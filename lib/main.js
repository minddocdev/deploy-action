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
const helm_1 = require("./helm");
const sentry_1 = require("./sentry");
const slack_1 = require("./slack");
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
            const valueFiles = helm_1.parseValueFiles(core.getInput('valueFiles', { required: false }));
            const values = core.getInput('values');
            // Sentry variables
            const sentryAuthToken = core.getInput('sentryAuthToken', { required: false });
            const sentryEnvironment = core.getInput('sentryEnvironment', { required: false })
                || environment;
            const sentryOrg = core.getInput('sentryOrg', { required: false });
            // Slack variables
            const slackWebhook = core.getInput('slackWebhook', { required: false });
            core.debug('Loaded variables:');
            core.debug(`- app: ${app}`);
            core.debug(`- appUrl: ${appUrl}`);
            core.debug(`- environment: ${environment}`);
            core.debug(`- helmRepoName: ${helmRepoName}`);
            core.debug(`- helmRepoUsername: ${helmRepoUsername}`);
            core.debug(`- helmRepoPassword: ${helmRepoPassword}`);
            core.debug(`- kubeConfig: ${kubeConfig}`);
            core.debug(`- namespace: ${namespace}`);
            core.debug(`- release: ${release}`);
            core.debug(`- valueFiles: ${valueFiles}`);
            core.debug(`- values: ${values}`);
            core.debug(`- sentryAuthToken: ${sentryAuthToken}`);
            core.debug(`- sentryEnvironment: ${sentryEnvironment}`);
            core.debug(`- sentryOrg: ${sentryOrg}`);
            core.debug(`- slackWebhook: ${slackWebhook}`);
            // Deploy to Kubernetes
            yield helm_1.createKubeConfig(kubeConfig);
            if (values) {
                const loadedValuesPath = './loaded-values.yaml';
                helm_1.createHelmValuesFile(loadedValuesPath, values);
                valueFiles.concat([loadedValuesPath]);
            }
            if (helmRepoName && helmRepoUrl) {
                helm_1.addHelmRepo(helmRepoName, helmRepoUrl, helmRepoUsername, helmRepoPassword);
            }
            helm_1.setupHelmChart(namespace, release, chart, valueFiles);
            // Deploy to Sentry
            if (sentryAuthToken) {
                sentry_1.setSentryRelease(sentryAuthToken, sentryOrg, app, context.sha, sentryEnvironment);
            }
            // Send Slack notification
            if (slackWebhook) {
                slack_1.sendSlackMessage(`${context.repo.owner}/${context.repo.repo}`, context.ref, context.actor, app, appUrl, context.sha, release, slackWebhook, sentryOrg);
            }
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();
