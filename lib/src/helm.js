"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_tags_1 = require("common-tags");
const shelljs_1 = require("shelljs");
function setupHelmChart(namespace, release, chart, valueFiles = [], values) {
    const valueFilesString = valueFiles
        .map(valueFile => `-f ${valueFile}`)
        .join(' ');
    return shelljs_1.exec(common_tags_1.oneLine `
    helm upgrade
      --install
      --wait
      --namespace ${namespace}
      ${valueFilesString}
      ${values ? `--set ${values.join(',')}` : ''}
      ${release}
      ${chart}
  `);
}
exports.setupHelmChart = setupHelmChart;
