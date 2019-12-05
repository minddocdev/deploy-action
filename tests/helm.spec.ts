import { oneLine } from 'common-tags';
import * as sh from 'shelljs';
import * as fs from 'fs';

import {
  addHelmRepo, createKubeConfig, setupHelmChart,
  createHelmValuesFile, parseValueFiles,
} from '../src/helm';

jest.mock('fs', () => ({
  writeFile: jest.fn(),
}));

jest.mock('@actions/core');

describe('helm', () => {

  describe('parse values file', () => {
    test('from a valid JSON string list', () => {
      expect(parseValueFiles('["file1", "file2"]')).toStrictEqual(['file1', 'file2']);
    });

    test('gives empty list when JSON string is not a list', () => {
      expect(parseValueFiles('{"files": ["file1", "file2"]}')).toStrictEqual([]);
    });

    test('from a valid YAML list', () => {
      expect(parseValueFiles('- "file1"\n- "file2"\n')).toStrictEqual(['file1', 'file2']);
    });

    test('gives empty list when YAML string is not a list', () => {
      expect(parseValueFiles('config:\n  key: value\n')).toStrictEqual([]);
    });

    test('does nothing when list is already provided', () => {
      const files = ['file1', 'file2'];
      expect(parseValueFiles(files)).toStrictEqual(files);
    });

    test('filters empty values', () => {
      expect(parseValueFiles('["file1", ""]')).toStrictEqual(['file1']);
    });
  });

  test('create kube config', () => {
    const myConfig = oneLine`
    clusters:
      - fake
    `;
    createKubeConfig(myConfig);
    expect(fs.writeFile).toBeCalledWith('./kubeconfig.yaml', myConfig, expect.any(Function));
  });

  describe('create helm values file', () => {
    const path = 'fakepath.yaml';

    test('with YAML format', () => {
      const values = oneLine`
        config:
          fakeEntry: lol
      `;
      createHelmValuesFile(path, values);
      expect(fs.writeFile).toBeCalledWith(path, values, expect.any(Function));
    });

    test('with object format', () => {
      const values = { config: { fakeEntry: 'lol' } };
      createHelmValuesFile(path, values);
      expect(fs.writeFile).toBeCalledWith(path, JSON.stringify(values), expect.any(Function));
    });
  });

  test('repo add with username and password', () => {
    const name = 'fakeRepo';
    const url = 'https://fakeRepo';
    const username = 'fakeUser';
    const password = 'fakePassword';
    addHelmRepo(name, url, username, password);
    expect(sh.exec).toBeCalledWith(oneLine`
      helm repo add
        --username ${username}
        --password ${password}
        ${name}
        ${url}
    `);
    expect(sh.exec).toBeCalledWith('helm repo update');
  });

  test('repo add without username and password', () => {
    const name = 'fakeRepo';
    const url = 'https://fakeRepo';
    addHelmRepo(name, url);
    expect(sh.exec).toBeCalledWith(`helm repo add ${name} ${url}`);
    expect(sh.exec).toBeCalledWith('helm repo update');
  });

  describe('upgrade', () => {
    const namespace = 'fakeNamespace';
    const release = 'fakeRelease';
    const chart = 'fakeChart';

    test('with defaults', () => {
      setupHelmChart(namespace, release, chart);
      expect(sh.exec).toBeCalledWith(oneLine`
        helm upgrade --install --wait --namespace ${namespace} ${release} ${chart}
      `);
    });

    test('with value files', () => {
      setupHelmChart(namespace, release, chart, ['values.yaml', 'secrets.yaml']);
      expect(sh.exec).toBeCalledWith(oneLine`
        helm upgrade --install --wait --namespace ${namespace}
        -f values.yaml -f secrets.yaml ${release} ${chart}
      `);
    });
  });
});
