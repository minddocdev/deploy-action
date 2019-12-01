import { oneLine, oneLineTrim } from 'common-tags';
import * as sh from 'shelljs';

import { sendSlackMessage } from '../src/slack';

describe('sentry', () => {
  const state = 'success';
  const githubRepo = 'fakeRepo';
  const githubRef = 'fakeRef';
  const githubActor = 'fakeActor';
  const appName = 'fakeApp';
  const appUrl = 'fakeAppUrl';
  const commitSha = 'fakeCommitSha';
  const release = 'fakeRelease';
  const slackWebhook = 'fakeSlackWebhook';
  const sentryOrg = 'fakeOrg';

  test('set release', () => {
    sendSlackMessage(
      state, githubRepo, githubRef, githubActor, appName, appUrl,
      commitSha, release, slackWebhook, sentryOrg,
    );
    const expectedPayload = {
      text: oneLine`
      [<https://github.com/${githubRepo}|${appName}>] [${state}]
      Deployed <https://github.com/${githubRepo}|${githubRef}> to <${appUrl}|${appUrl}>
    `,
      attachments: [
        {
          color: '#36a64f',
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdown',
                text: oneLine`
                Release ${sentryOrg ?
                    `<https://sentry.io/organizations/${sentryOrg}/releases/${commitSha}|${release}>` :
                    release
                  }
              `,
              },
            },
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdown',
                  text: `See <https://github.com/${githubRepo}/actions>`,
                },
              ],
            },
            {
              type: 'divider',
            },
            {
              type: 'section',
              text: {
                type: 'mrkdown',
                text: oneLineTrim`
                https://github.com/${githubRepo}/commit/${commitSha}|${commitSha}>
                \n*${commitSha}*\n${commitSha}
              `,
              },
            },
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdown',
                  text: `*Author:* <https://github.com/${githubActor}|${githubActor}>`,
                },
              ],
            },
          ],
        },
      ],
    };
    expect(sh.exec).toBeCalledWith(oneLine`
      curl -s -H "Content-type: application/json"
      -d "${JSON.stringify(expectedPayload)}" ${slackWebhook}
    `);
  });
});
