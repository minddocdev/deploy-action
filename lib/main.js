"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const fs = __importStar(require("fs"));
const util = __importStar(require("util"));
const helm_1 = require("./helm");
const sentry_1 = require("./sentry");
const slack_1 = require("./slack");
const writeFile = util.promisify(fs.writeFile);
function getValueFiles(files) {
    let fileList;
    if (typeof files === 'string') {
        try {
            fileList = JSON.parse(files);
        }
        catch (err) {
            // Assume it's a single string.
            fileList = [files];
        }
    }
    else {
        fileList = files;
    }
    if (!Array.isArray(fileList)) {
        return [];
    }
    return fileList.filter(f => !!f);
}
function getValues(values) {
    if (typeof values === 'object') {
        return JSON.stringify(values);
    }
    return values;
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const context = github.context;
            // Deployment variables
            const app = core.getInput('app', { required: true });
            const appUrl = core.getInput('appUrl', { required: true });
            const environment = core.getInput('environment', { required: true });
            // Helm variables
            const chart = core.getInput('chart', { required: true });
            const helmRepoName = core.getInput('helmRepoName', { required: false });
            const helmRepoUrl = core.getInput('helmRepoUrl', { required: false });
            const helmRepoUsername = core.getInput('helmRepoUsername', { required: false });
            const helmRepoPassword = core.getInput('helmRepoPassword', { required: false });
            const kubeConfig = core.getInput('kubeConfig', { required: false });
            const namespace = core.getInput('namespace', { required: false }) || 'default';
            const release = core.getInput('release', { required: false }) || app;
            const valueFiles = getValueFiles(core.getInput('valueFiles', { required: false }));
            const values = getValues(core.getInput('values'));
            // Sentry variables
            const sentryAuthToken = core.getInput('sentryAuthToken', { required: false });
            const sentryEnvironment = core.getInput('sentryEnvironment', { required: false })
                || environment;
            const sentryOrg = core.getInput('sentryOrg', { required: false });
            // Slack variables
            const slackWebhook = core.getInput('slackWebhook', { required: false });
            // Create kubeconfig file
            process.env.KUBECONFIG = './kubeconfig.yaml';
            yield writeFile(process.env.KUBECONFIG, kubeConfig);
            // Create values file from given YAML/JSON (will overwrite file values)
            if (values) {
                const loadedValuesPath = './loaded-values.yaml';
                yield writeFile(loadedValuesPath, values);
                valueFiles.concat([loadedValuesPath]);
            }
            core.info(`Deploy ${app} chart`);
            if (helmRepoName && helmRepoUrl) {
                if (helm_1.addHelmRepo(helmRepoName, helmRepoUrl, helmRepoUsername, helmRepoPassword).code !== 0) {
                    throw new Error(`Unable to add repository ${helmRepoName} with url ${helmRepoUrl}`);
                }
            }
            if (helm_1.setupHelmChart(namespace, release, chart, valueFiles).code !== 0) {
                throw new Error(`Unable to deploy ${app}`);
            }
            if (sentryAuthToken) {
                core.info(`Set up sentry release for ${sentryEnvironment}`);
                if (sentry_1.setSentryRelease(sentryAuthToken, sentryOrg, app, context.sha, sentryEnvironment).code !== 0) {
                    throw new Error(`Unable to deploy ${app} release to sentry`);
                }
            }
            if (slackWebhook) {
                core.info('Send slack notification');
                if (slack_1.sendSlackMessage(`${context.repo.owner}/${context.repo.repo}`, context.ref, context.actor, app, appUrl, context.sha, release, slackWebhook, sentryOrg).code !== 0) {
                    throw new Error('Unable to send Slack notification');
                }
            }
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();
