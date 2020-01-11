import * as core from '@actions/core';
import { oneLine, oneLineTrim } from 'common-tags';
import { exec } from 'shelljs';

export function sendSlackMessage(
  githubRepo: string,
  githubRef: string,
  githubActor: string,
  appName: string,
  appUrl: string,
  commitSha: string,
  release: string,
  slackWebhook: string,
  sentryOrg?: string,
) {
  core.info('Send slack notification');
  const payload = {
    text: oneLine`
      [<https://github.com/${githubRepo}|${appName}>]
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
  if (exec(oneLine`
    curl -s -H "Content-type: application/json" -d "${JSON.stringify(payload)}" ${slackWebhook}
  `).code !== 0) {
    throw new Error('Unable to send Slack notification');
  }
}
