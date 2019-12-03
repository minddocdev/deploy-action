"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shelljs_1 = require("shelljs");
function setSentryRelease(authToken, org, appName, commitSha, environment) {
    const sentryCliReleases = `sentry-cli --auth-token ${authToken} releases --org ${org}`;
    shelljs_1.exec(`${sentryCliReleases} new -p ${appName} ${commitSha}`);
    shelljs_1.exec(`${sentryCliReleases} set -commits--auto ${commitSha}`);
    return shelljs_1.exec(`${sentryCliReleases} deploys ${commitSha} new -e ${environment}`);
}
exports.setSentryRelease = setSentryRelease;
