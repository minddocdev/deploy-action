# Deploy Action

Install the dependencies

```bash
yarn install
```

Build the typescript

```bash
yarn build
```

Run the tests :heavy_check_mark:

```bash
yarn test
```

## Usage

Deploy with helm

```yaml
- name: Check chart
  uses: minddocdev/deploy-action@master
  with:
    appName: myApp
    kubeConfig: |
      apiVersion: v1
      clusters:
      - cluster:
          certificate-authority-data: ${{ secrets.KUBE_CERT }}
          server: ${{ secrets.KUBE_SERVER }}
        name: myCluster
      contexts:
      - context:
          cluster: myCluster
          namespace: default
          user: ci
        name: myCluster
      current-context: myCluster
      kind: Config
      preferences: {}
      users:
      - name: ci
        user:
          token: ${{ secrets.KUBE_USER_TOKEN }}
```
