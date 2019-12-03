import { exec } from 'shelljs';

export function setSentryRelease(
  authToken: string, org: string, appName: string, commitSha: string, environment: string,
) {
  const sentryCliReleases = `sentry-cli --auth-token ${authToken} releases --org ${org}`;
  exec(`${sentryCliReleases} new -p ${appName} ${commitSha}`);
  exec(`${sentryCliReleases} set -commits--auto ${commitSha}`);
  return exec(`${sentryCliReleases} deploys ${commitSha} new -e ${environment}`);
}
