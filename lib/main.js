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
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const context = github.context;
            const appName = core.getInput('appName');
            // Helm variables
            const kubeConfig = core.getInput('kubeConfig');
            const chartName = core.getInput('chartName') || appName;
            const namespace = core.getInput('namespace') || 'default';
            const release = core.getInput('release') || appName;
            const valueFiles = getValueFiles(core.getInput('valueFiles'));
            const imageTagKey = core.getInput('imageTagKey') || 'image.tag';
            // Sentry variables
            const sentryAuthToken = core.getInput('sentryAuthToken');
            const sentryEnvironment = core.getInput('sentryEnvironment');
            const sentryOrg = core.getInput('sentryOrg');
            // Slack variables
            const slackWebhook = core.getInput('slackWebhook');
            const appUrl = core.getInput('appUrl');
            process.env.KUBECONFIG = './kubeconfig.yaml';
            yield writeFile(process.env.KUBECONFIG, kubeConfig);
            core.info(`Deploy ${appName} chart`);
            helm_1.setupHelmChart(namespace, release, chartName, valueFiles, [`${imageTagKey}=${context.sha}`]);
            if (sentryAuthToken) {
                core.info(`Set up sentry release for ${sentryEnvironment}`);
                sentry_1.setSentryRelease(sentryAuthToken, sentryOrg, appName, context.sha, sentryEnvironment);
            }
            if (slackWebhook) {
                core.info('Send slack notification');
                slack_1.sendSlackMessage(`${context.repo.owner}/${context.repo.repo}`, context.ref, context.actor, appName, appUrl, context.sha, release, slackWebhook, sentryOrg);
            }
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();
