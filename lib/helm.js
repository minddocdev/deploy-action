"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_tags_1 = require("common-tags");
const shelljs_1 = require("shelljs");
function addHelmRepo(name, url, username, password) {
    const loginString = username && password ? `--username ${username} --password ${password} ` : '';
    return shelljs_1.exec(`helm repo add ${loginString}${name} ${url}`);
}
exports.addHelmRepo = addHelmRepo;
function setupHelmChart(namespace, release, chart, valueFiles = []) {
    const valueFilesString = valueFiles
        .map(valueFile => `-f ${valueFile}`)
        .join(' ');
    return shelljs_1.exec(common_tags_1.oneLine `
    helm upgrade
      --install
      --wait
      --namespace ${namespace}
      ${valueFilesString}
      ${release}
      ${chart}
  `);
}
exports.setupHelmChart = setupHelmChart;
