import { oneLine } from 'common-tags';
import * as sh from 'shelljs';

import { addHelmRepo, setupHelmChart } from '../src/helm';

describe('helm', () => {

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
  });

  test('repo add without username and password', () => {
    const name = 'fakeRepo';
    const url = 'https://fakeRepo';
    addHelmRepo(name, url);
    expect(sh.exec).toBeCalledWith(`helm repo add ${name} ${url}`);
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

    test('with value fields', () => {
      setupHelmChart(namespace, release, chart, ['values.yaml', 'secrets.yaml']);
      expect(sh.exec).toBeCalledWith(oneLine`
        helm upgrade --install --wait --namespace ${namespace}
        -f values.yaml -f secrets.yaml ${release} ${chart}
      `);
    });

    test('with values', () => {
      setupHelmChart(namespace, release, chart, undefined, ['image.tag=fake']);
      expect(sh.exec).toBeCalledWith(oneLine`
        helm upgrade --install --wait --namespace ${namespace}
        --set image.tag=fake ${release} ${chart}
      `);
    });
  });
});
