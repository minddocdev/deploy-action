import * as core from '@actions/core';
import * as github from '@actions/github';
import * as fs from 'fs';
import * as util from 'util';

import { setupHelmChart, addHelmRepo } from './helm';
import { setSentryRelease } from './sentry';
import { sendSlackMessage } from './slack';

type Environment = 'production' | 'staging' | 'qa';

const writeFile = util.promisify(fs.writeFile);

function getValueFiles(files) {
  let fileList: string[];
  if (typeof files === 'string') {
    try {
      fileList = JSON.parse(files);
    } catch (err) {
      // Assume it's a single string.
      fileList = [files];
    }
  } else {
    fileList = files;
  }
  if (!Array.isArray(fileList)) {
    return [];
  }
  return fileList.filter(f => !!f);
}

function getValues(values) {
  if (typeof values === 'object') {
    return JSON.stringify(values);
  }
  return values;
}

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
    const imageTagKey = core.getInput('imageTagKey', { required: false }) || 'image.tag';
    const kubeConfig = core.getInput('kubeConfig', { required: false });
    const namespace = core.getInput('namespace', { required: false }) || 'default';
    const release = core.getInput('release', { required: false }) || app;
    const valueFiles = getValueFiles(core.getInput('valueFiles', { required: false }));
    const values = getValues(core.getInput('values'));
    // Sentry variables
    const sentryAuthToken = core.getInput('sentryAuthToken', { required: false });
    const sentryEnvironment = core.getInput('sentryEnvironment', { required: false })
      || environment;
    const sentryOrg = core.getInput('sentryOrg', { required: false });
    // Slack variables
    const slackWebhook = core.getInput('slackWebhook', { required: false });

    // Create kubeconfig file
    process.env.KUBECONFIG = './kubeconfig.yaml';
    await writeFile(process.env.KUBECONFIG, kubeConfig);

    // Create values file from given YAML/JSON (will overwrite file values)
    if (values) {
      const loadedValuesPath = './loaded-values.yaml';
      await writeFile(loadedValuesPath, values);
      valueFiles.concat([loadedValuesPath]);
    }

    core.info(`Deploy ${app} chart`);
    if (helmRepoName && helmRepoUrl) {
      addHelmRepo(helmRepoName, helmRepoUrl, helmRepoUsername, helmRepoPassword);
    }
    const code = setupHelmChart(
      namespace, release, chart, valueFiles, [`${imageTagKey}=${context.sha}`],
    ).code;
    const state = code === 0 ? 'success' : 'failure';

    if (state === 'success') {
      if (sentryAuthToken) {
        core.info(`Set up sentry release for ${sentryEnvironment}`);
        setSentryRelease(sentryAuthToken, sentryOrg, app, context.sha, sentryEnvironment);
      }
    }

    if (slackWebhook) {
      core.info('Send slack notification');
      sendSlackMessage(
        state,
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
    }

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
