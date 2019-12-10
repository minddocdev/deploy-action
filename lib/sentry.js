"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const shelljs_1 = require("shelljs");
const core = __importStar(require("@actions/core"));
function setSentryRelease(authToken, org, appName, commitSha, environment) {
    core.info(`Set up sentry release for ${environment}`);
    const sentryCliReleases = `sentry-cli --auth-token ${authToken} releases --org ${org}`;
    const newReleaseCommand = `${sentryCliReleases} new -p ${appName} ${commitSha}`;
    core.info(newReleaseCommand);
    if (shelljs_1.exec(newReleaseCommand).code !== 0) {
        throw new Error(`Unable to prepare ${appName} sentry release`);
    }
    const setCommitsCommand = `${sentryCliReleases} set-commits --auto ${commitSha}`;
    core.info(setCommitsCommand);
    if (shelljs_1.exec(setCommitsCommand).code !== 0) {
        throw new Error(`Unable set commits for ${appName} sentry release`);
    }
    const deployCommand = `${sentryCliReleases} deploys ${commitSha} new -e ${environment}`;
    core.info(deployCommand);
    if (shelljs_1.exec(deployCommand).code !== 0) {
        throw new Error(`Unable to deploy ${appName} to sentry`);
    }
}
exports.setSentryRelease = setSentryRelease;
