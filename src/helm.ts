import { oneLine } from 'common-tags';
import { exec } from 'shelljs';

export function addHelmRepo(name: string, url: string, username?: string, password?: string) {
  const loginString = username && password ? `--username ${username} --password ${password} ` : '';
  return exec(`helm repo add ${loginString}${name} ${url}`);
}

export function setupHelmChart(
  namespace: string,
  release: string,
  chart: string,
  valueFiles: string[] = [],
  values?: string[],
) {
  const valueFilesString = valueFiles
    .map(valueFile => `-f ${valueFile}`)
    .join(' ');

  return exec(oneLine`
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
