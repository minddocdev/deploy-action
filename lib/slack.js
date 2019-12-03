"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_tags_1 = require("common-tags");
const shelljs_1 = require("shelljs");
function sendSlackMessage(state, githubRepo, githubRef, githubActor, appName, appUrl, commitSha, release, slackWebhook, sentryOrg) {
    const payload = {
        text: common_tags_1.oneLine `
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
                            text: common_tags_1.oneLine `
                Release ${sentryOrg ?
                                `<https://sentry.io/organizations/${sentryOrg}/releases/${commitSha}|${release}>` :
                                release}
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
                            text: common_tags_1.oneLineTrim `
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
    return shelljs_1.exec(common_tags_1.oneLine `
    curl -s -H "Content-type: application/json" -d "${JSON.stringify(payload)}" ${slackWebhook}
  `);
}
exports.sendSlackMessage = sendSlackMessage;
