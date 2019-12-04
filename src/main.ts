import * as core from '@actions/core';
import * as github from '@actions/github';

import {
  createKubeConfig, parseValueFiles,
  setupHelmChart, addHelmRepo, createHelmValuesFile,
} from './helm';
import { setSentryRelease } from './sentry';
import { sendSlackMessage } from './slack';
import { Cipher } from 'crypto';

type Environment = 'production' | 'staging' | 'qa';

async function run() {
  try {
    const context = github.context;

    // Deployment variables
    const app = core.getInput('app', { required: true });
    const appUrl = core.getInput('appUrl', { required: true });
    const environment = core.getInput('environment', { required: true }) as Environment;
    // Helm variables
    const chart = core.getInput('chart', { required: true });
    const helmRepoName = core.getInput('helmRepoName', { required: false });
    const helmRepoUrl = core.getInput('helmRepoUrl', { required: false });
    const helmRepoUsername = core.getInput('helmRepoUsername', { required: false });
    const helmRepoPassword = core.getInput('helmRepoPassword', { required: false });
    const kubeConfig = core.getInput('kubeConfig', { required: false });
    const namespace = core.getInput('namespace', { required: false }) || 'default';
    const release = core.getInput('release', { required: false }) || app;
    const valueFiles = parseValueFiles(core.getInput('valueFiles', { required: false }));
    const values = core.getInput('values', { required: false });
    // Sentry variables
    const sentryAuthToken = core.getInput('sentryAuthToken', { required: false });
    const sentryEnvironment = core.getInput('sentryEnvironment', { required: false })
      || environment;
    const sentryOrg = core.getInput('sentryOrg', { required: false });
    // Slack variables
    const slackWebhook = core.getInput('slackWebhook', { required: false });

    core.debug('Loaded variables:');
    core.debug(`- app: ${app}`);
    core.debug(`- appUrl: ${appUrl}`);
    core.debug(`- environment: ${environment}`);
    core.debug(`- helmRepoName: ${helmRepoName}`);
    core.debug(`- helmRepoUsername: ${helmRepoUsername}`);
    core.debug(`- helmRepoPassword: ${helmRepoPassword}`);
    core.debug(`- kubeConfig: ${kubeConfig}`);
    core.debug(`- namespace: ${namespace}`);
    core.debug(`- release: ${release}`);
    core.debug(`- valueFiles: ${valueFiles}`);
    core.debug(`- values: ${values}`);
    core.debug(`- sentryAuthToken: ${sentryAuthToken}`);
    core.debug(`- sentryEnvironment: ${sentryEnvironment}`);
    core.debug(`- sentryOrg: ${sentryOrg}`);
    core.debug(`- slackWebhook: ${slackWebhook}`);

    // Deploy to Kubernetes
    await createKubeConfig(kubeConfig);
    if (values) {
      const loadedValuesPath = './loaded-values.yaml';
      createHelmValuesFile(loadedValuesPath, values);
      valueFiles.concat([loadedValuesPath]);
    } else {
      core.info('No values were provided. Skipping extra value file creation');
    }
    if (helmRepoName && helmRepoUrl) {
      addHelmRepo(helmRepoName, helmRepoUrl, helmRepoUsername, helmRepoPassword);
    } else {
      core.info('No repo was provided. Skipping repo addition');
    }
    setupHelmChart(namespace, release, chart, valueFiles);

    // Deploy to Sentry
    if (sentryAuthToken) {
      setSentryRelease(sentryAuthToken, sentryOrg, app, context.sha, sentryEnvironment);
    } else {
      core.info('No sentry auth token was provided. Skipping sentry release')
    }

    // Send Slack notification
    if (slackWebhook) {
      sendSlackMessage(
        `${context.repo.owner}/${context.repo.repo}`,
        context.ref,
        context.actor,
        app,
        appUrl,
        context.sha,
        release,
        slackWebhook,
        sentryOrg,
      );
    } else {
      core.info('No slack webhook was provided. Skipping slack message notification');
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
