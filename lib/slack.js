"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const common_tags_1 = require("common-tags");
const shelljs_1 = require("shelljs");
function sendSlackMessage(githubRepo, githubRef, githubActor, appName, appUrl, commitSha, release, slackWebhook, sentryOrg) {
    core.info('Send slack notification');
    const payload = {
        text: common_tags_1.oneLine `
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
    if (shelljs_1.exec(common_tags_1.oneLine `
    curl -s -H "Content-type: application/json" -d "${JSON.stringify(payload)}" ${slackWebhook}
  `).code !== 0) {
        throw new Error('Unable to send Slack notification');
    }
}
exports.sendSlackMessage = sendSlackMessage;
