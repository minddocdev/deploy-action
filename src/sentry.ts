import { exec } from 'shelljs';
import * as core from '@actions/core';

export function setSentryRelease(
  authToken: string, org: string, appName: string, commitSha: string, environment: string,
) {
  core.info(`Set up sentry release for ${environment}`);
  const sentryCliReleases = `sentry-cli --auth-token ${authToken} releases --org ${org}`;
  const newReleaseCommand = `${sentryCliReleases} new -p ${appName} ${commitSha}`;
  core.info(newReleaseCommand);
  if (exec(newReleaseCommand).code !== 0) {
    throw new Error(`Unable to prepare ${appName} sentry release`);
  }
  const setCommitsCommand = `${sentryCliReleases} set-commits --auto ${commitSha}`;
  core.info(setCommitsCommand);
  if (exec(setCommitsCommand).code !== 0) {
    throw new Error(`Unable set commits for ${appName} sentry release`);
  }
  const deployCommand = `${sentryCliReleases} deploys ${commitSha} new -e ${environment}`;
  core.info(deployCommand);
  if (exec(deployCommand).code !== 0) {
    throw new Error(`Unable to deploy ${appName} to sentry`);
  }
}
