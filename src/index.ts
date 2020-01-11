import * as core from '@actions/core';
import * as github from '@actions/github';
import * as yaml from 'js-yaml';
import { exec } from 'shelljs';

import {
  createKubeConfig, setupHelmChart, addHelmRepo, createHelmValuesFile,
} from './helm';
import { setSentryRelease } from './sentry';
import { oneLine } from 'common-tags';

interface RequiredConfig {
  app: string;
  appUrl: string;
  chart: string;
}
interface OptionalConfig extends RequiredConfig {
  namespace?: string;
  release?: string;
  valueFiles?: string[];
  values?: {};
}
interface Config extends RequiredConfig {
  namespace: string;
  release: string;
  valueFiles: string[];
  values: {};
}

function getConfig(): Config {
  const rawConfig = core.getInput('config', { required: true });
  core.debug(`Parsing raw config '${rawConfig}'...`);
  let config: OptionalConfig;
  try {
    // Try JSON first
    config = JSON.parse(rawConfig);
    core.debug(`Loaded config: ${rawConfig}`);
  } catch (err) {
    // Might be in YAML format
    try {
      config = yaml.safeLoad(rawConfig);
    } catch (err) {
      throw new Error(`Unable to parse config. Found content: ${rawConfig}`);
    }
  }
  // Check loaded types
  ['app', 'appUrl', 'chart'].forEach((requiredKey) => {
    const requiredValue = config[requiredKey];
    if (!requiredValue || typeof requiredValue !== 'string') {
      throw new Error(oneLine`
        Invalid config value for mandatory key ${requiredKey}.
        Found ${requiredValue} while expecting a string
      `);
    }
  });
  ['namespace', 'release'].forEach((optionalKey) => {
    if (config[optionalKey] && typeof config[optionalKey] !== 'string') {
      throw new Error(oneLine`
        Expecting string in '${optionalKey}' optional key.
        Found ${config[optionalKey]}
      `);
    }
  });
  if (config['valueFiles'] && !Array.isArray(config['valueFiles'])) {
    throw new Error(oneLine`
      Expecting array in 'valueFiles' optional key.
      Found ${config['valueFiles']}
    `);
  }
  if (config['values'] && !config['values'] === Object(config['values'])) {
    throw new Error(oneLine`
      Expecting object in 'values' optional key.
      Found ${config['values']}
    `);
  }
  return {
    namespace: 'default',
    release: config.app,
    valueFiles: [],
    values: {},
    ...config,
  };
}

async function run() {
  try {
    const context = github.context;

    // Deployment variables
    const config = getConfig();
    const { app, appUrl, chart, namespace, release, valueFiles, values } = config;
    const environment = core.getInput('environment', { required: true });

    // Helm variables
    const helmRepoName = core.getInput('helmRepoName', { required: false });
    const helmRepoUrl = core.getInput('helmRepoUrl', { required: false });
    const helmRepoUsername = core.getInput('helmRepoUsername', { required: false });
    const helmRepoPassword = core.getInput('helmRepoPassword', { required: false });
    const kubeConfig = core.getInput('kubeConfig', { required: false });
    // Sentry variables
    const sentryAuthToken = core.getInput('sentryAuthToken', { required: false });
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
    core.debug(`- sentryOrg: ${sentryOrg}`);
    core.debug(`- slackWebhook: ${slackWebhook}`);

    // Deploy to Kubernetes
    await createKubeConfig(kubeConfig);

    core.startGroup('Configured namespace information');
    exec(`helm ls -n ${namespace}`);
    exec(`kubectl get all -n ${namespace}`);
    core.endGroup();

    if (values) {
      const loadedValuesPath = './loaded-values.yaml';
      await createHelmValuesFile(loadedValuesPath, values);
      valueFiles.push(loadedValuesPath);
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
      setSentryRelease(sentryAuthToken, sentryOrg, app, context.sha, environment);
    } else {
      core.info('No sentry auth token was provided. Skipping sentry release');
    }

    // Send Slack notification
    // if (slackWebhook) {
    //   sendSlackMessage(
    //     `${context.repo.owner}/${context.repo.repo}`,
    //     context.ref,
    //     context.actor,
    //     app,
    //     appUrl,
    //     context.sha,
    //     release,
    //     slackWebhook,
    //     sentryOrg,
    //   );
    // } else {
    //   core.info('No slack webhook was provided. Skipping slack message notification');
    // }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
