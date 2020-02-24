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
const common_tags_1 = require("common-tags");
const yaml = __importStar(require("js-yaml"));
const shelljs_1 = require("shelljs");
const helm_1 = require("./helm");
const sentry_1 = require("./sentry");
function getConfig() {
    var _a;
    const rawConfig = core.getInput('config', { required: true });
    core.debug(`Parsing raw config '${rawConfig}'...`);
    let config;
    try {
        // Try JSON first
        config = JSON.parse(rawConfig);
        core.debug(`Loaded config: ${rawConfig}`);
    }
    catch (err) {
        // Might be in YAML format
        try {
            config = yaml.safeLoad(rawConfig);
        }
        catch (err) {
            throw new Error(`Unable to parse config. Found content: ${rawConfig}`);
        }
    }
    // Check loaded types
    ['app', 'appUrl', 'chart'].forEach((requiredKey) => {
        const requiredValue = config[requiredKey];
        if (!requiredValue || typeof requiredValue !== 'string') {
            throw new Error(common_tags_1.oneLine `
        Invalid config value for mandatory key ${requiredKey}.
        Found ${requiredValue} while expecting a string
      `);
        }
    });
    ['namespace', 'sentryApp', 'release'].forEach((optionalKey) => {
        if (config[optionalKey] && typeof config[optionalKey] !== 'string') {
            throw new Error(common_tags_1.oneLine `
        Expecting string in '${optionalKey}' optional key.
        Found ${config[optionalKey]}
      `);
        }
    });
    if (config['valueFiles'] && !Array.isArray(config['valueFiles'])) {
        throw new Error(common_tags_1.oneLine `
      Expecting array in 'valueFiles' optional key.
      Found ${config['valueFiles']}
    `);
    }
    if (config['values'] && !config['values'] === Object(config['values'])) {
        throw new Error(common_tags_1.oneLine `
      Expecting object in 'values' optional key.
      Found ${config['values']}
    `);
    }
    return Object.assign({ namespace: 'default', release: config.app, sentryApp: (_a = config.sentryApp, (_a !== null && _a !== void 0 ? _a : config.app)), valueFiles: [], values: {} }, config);
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const context = github.context;
            // Deployment variables
            const config = getConfig();
            const { app, appUrl, chart, namespace, sentryApp, release, valueFiles, values } = config;
            const environment = core.getInput('environment', { required: true });
            // Helm variables
            const helmRepoName = core.getInput('helmRepoName', { required: false });
            const helmRepoUrl = core.getInput('helmRepoUrl', { required: false });
            const helmRepoUsername = core.getInput('helmRepoUsername', { required: false });
            const helmRepoPassword = core.getInput('helmRepoPassword', { required: false });
            const kubeConfig = core.getInput('kubeConfig', { required: false });
            // Sentry variables
            const sentryAuthToken = core.getInput('sentryAuthToken', { required: false });
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
            core.debug(`- sentryApp: ${sentryApp}`);
            core.debug(`- sentryAuthToken: ${sentryAuthToken}`);
            core.debug(`- sentryOrg: ${sentryOrg}`);
            core.debug(`- slackWebhook: ${slackWebhook}`);
            // Deploy to Kubernetes
            yield helm_1.createKubeConfig(kubeConfig);
            core.startGroup('Configured namespace information');
            shelljs_1.exec(`helm ls -n ${namespace}`);
            shelljs_1.exec(`kubectl get all -n ${namespace}`);
            core.endGroup();
            if (values) {
                const loadedValuesPath = './loaded-values.yaml';
                yield helm_1.createHelmValuesFile(loadedValuesPath, values);
                valueFiles.push(loadedValuesPath);
            }
            else {
                core.info('No values were provided. Skipping extra value file creation');
            }
            if (helmRepoName && helmRepoUrl) {
                helm_1.addHelmRepo(helmRepoName, helmRepoUrl, helmRepoUsername, helmRepoPassword);
            }
            else {
                core.info('No repo was provided. Skipping repo addition');
            }
            helm_1.setupHelmChart(namespace, release, chart, valueFiles);
            // Deploy to Sentry
            if (sentryAuthToken) {
                sentry_1.setSentryRelease(sentryAuthToken, sentryOrg, sentryApp, context.sha, environment);
            }
            else {
                core.info('No sentry auth token was provided. Skipping sentry release');
            }
            // Send Slack notification
            // if (slackWebhook) {
            //   sendSlackMessage(
            //     `${context.repo.owner}/${context.repo.repo}`,
            //     context.ref,
            //     context.actor,
            //     app,
            //     appUrl,
            //     context.sha,
            //     release,
            //     slackWebhook,
            //     sentryOrg,
            //   );
            // } else {
            //   core.info('No slack webhook was provided. Skipping slack message notification');
            // }
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();
