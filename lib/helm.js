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
const common_tags_1 = require("common-tags");
const shelljs_1 = require("shelljs");
const core = __importStar(require("@actions/core"));
const fs = __importStar(require("fs"));
const util = __importStar(require("util"));
const yaml = __importStar(require("js-yaml"));
const writeFile = util.promisify(fs.writeFile);
function parseValueFiles(files) {
    core.debug(`Parsing files '${files}'...`);
    let fileList;
    if (typeof files === 'string') {
        try {
            // Try JSON first
            fileList = JSON.parse(files);
            core.info(`Parsed value files: ${fileList}`);
        }
        catch (err) {
            // Might be in YAML format
            try {
                fileList = yaml.safeLoad(files);
            }
            catch (err) {
                fileList = [files];
                core.warning(`Parsed value files as single string: ${fileList}`);
            }
        }
    }
    else {
        fileList = files;
        core.info(`Skip value files parsed, it is already a list: ${fileList}`);
    }
    if (!Array.isArray(fileList)) {
        core.warning(`Cannot parse array from given value files: ${fileList}`);
        return [];
    }
    return fileList.filter(f => !!f);
}
exports.parseValueFiles = parseValueFiles;
function createKubeConfig(kubeConfig) {
    return __awaiter(this, void 0, void 0, function* () {
        process.env.KUBECONFIG = './kubeconfig.yaml';
        yield writeFile(process.env.KUBECONFIG, kubeConfig);
        core.info(`Created kubernetes config in ${process.env.KUBECONFIG}`);
    });
}
exports.createKubeConfig = createKubeConfig;
function createHelmValuesFile(path, values) {
    return __awaiter(this, void 0, void 0, function* () {
        core.debug(`Parsing values '${values}'...`);
        let parsedValues;
        if (typeof values === 'object') {
            parsedValues = JSON.stringify(values);
        }
        else {
            parsedValues = values;
        }
        yield writeFile(path, parsedValues);
        core.info(`Created values file from provided values in ${path}`);
    });
}
exports.createHelmValuesFile = createHelmValuesFile;
function addHelmRepo(name, url, username, password) {
    const loginString = username && password ? `--username ${username} --password ${password} ` : '';
    const command = `helm repo add ${loginString}${name} ${url}`;
    core.info(command);
    if (shelljs_1.exec(command).code !== 0) {
        throw new Error(`Unable to add repository ${name} with url ${url}`);
    }
}
exports.addHelmRepo = addHelmRepo;
function setupHelmChart(namespace, release, chart, valueFiles = []) {
    core.info(`Deploy ${chart} chart with release ${release}`);
    const valueFilesString = valueFiles
        .map(valueFile => `-f ${valueFile}`)
        .join(' ');
    const command = common_tags_1.oneLine `
    helm upgrade
      --install
      --wait
      --namespace ${namespace}
      ${valueFilesString}
      ${release}
      ${chart}
  `;
    core.info(command);
    if (shelljs_1.exec(command).code !== 0) {
        throw new Error(`Unable to deploy ${chart} chart with release ${release}`);
    }
}
exports.setupHelmChart = setupHelmChart;
