import { oneLine } from 'common-tags';
import * as sh from 'shelljs';

import { setSentryRelease } from '../src/sentry';

describe('sentry', () => {
  const authToken = 'fakeToken';
  const org = 'fakeOrg';
  const appName = 'fakeApp';
  const commitSha = 'fakeSha';
  const environment = 'fakeEnvironment';

  test('set release', () => {
    setSentryRelease(authToken, org, appName, commitSha, environment);
    const sentryCliReleases = `sentry-cli --auth-token ${authToken} releases --org ${org}`;
    expect(sh.exec)
      .toBeCalledWith(`${sentryCliReleases} new -p ${appName} ${commitSha}`);
    expect(sh.exec)
      .toBeCalledWith(`${sentryCliReleases} set -commits--auto ${commitSha}`);
    expect(sh.exec)
      .toBeCalledWith(`${sentryCliReleases} deploys ${commitSha} new -e ${environment}`);
  });
});
