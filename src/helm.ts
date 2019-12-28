import { oneLine } from 'common-tags';
import { exec } from 'shelljs';
import * as core from '@actions/core';
import * as fs from 'fs';
import * as util from 'util';
import * as yaml from 'js-yaml';

const writeFile = util.promisify(fs.writeFile);

export function parseValueFiles(files: string | string[]) {
  core.debug(`Parsing files '${files}'...`);
  let fileList: string[];
  if (typeof files === 'string') {
    try {
      // Try JSON first
      fileList = JSON.parse(files);
      core.info(`Parsed value files: ${fileList}`);
    } catch (err) {
      // Might be in YAML format
      try {
        fileList = yaml.safeLoad(files);
      } catch (err) {
        fileList = [files];
        core.warning(`Parsed value files as single string: ${fileList}`);
      }
    }
  } else {
    fileList = files;
    core.info(`Skip value files parsed, it is already a list: ${fileList}`);
  }
  if (!Array.isArray(fileList)) {
    core.warning(`Cannot parse array from given value files: ${fileList}`);
    return [];
  }
  return fileList.filter(f => !!f);
}

export async function createKubeConfig(kubeConfig: string) {
  process.env.KUBECONFIG = './kubeconfig.yaml';
  await writeFile(process.env.KUBECONFIG, kubeConfig);
  core.info(`Created kubernetes config in ${process.env.KUBECONFIG}`);
}

export async function createHelmValuesFile(path: string, values: string | {}) {
  core.debug(`Parsing values '${values}'...`);
  let parsedValues: string;
  if (typeof values === 'object') {
    // Parse to JSON so helm can read it
    parsedValues = JSON.stringify(values);
  } else {
    // It is either YAML or JSON (helm will read it directly)
    parsedValues = values as string;
  }
  await writeFile(path, parsedValues);
  core.info(`Created values file from provided values in ${path}`);
}

export function addHelmRepo(name: string, url: string, username?: string, password?: string) {
  core.startGroup('Add helm repository');
  const loginString = username && password ? `--username ${username} --password ${password} ` : '';
  const addCommand = `helm repo add ${loginString}${name} ${url}`;
  core.info(addCommand);
  if (exec(addCommand).code !== 0) {
    throw new Error(`Unable to add repository ${name} with url ${url}`);
  }
  const updateCommand = 'helm repo update';
  core.info(updateCommand);
  if (exec(updateCommand).code !== 0) {
    throw new Error('Unable to update repositories');
  }
  core.endGroup();
}

export function setupHelmChart(
  namespace: string,
  release: string,
  chart: string,
  valueFiles: string[] = [],
) {
  core.startGroup(`Deploy ${chart} chart with release ${release}`);
  const valueFilesString = valueFiles
    .map(valueFile => `-f ${valueFile}`)
    .join(' ');
  const command = oneLine`
    helm upgrade
      --install
      --wait
      --namespace ${namespace}
      ${valueFilesString}
      ${release}
      ${chart}
  `;
  core.info(command);
  if (exec(command).code !== 0) {
    throw new Error(`Unable to deploy ${chart} chart with release ${release}`);
  }
  core.endGroup();
}
