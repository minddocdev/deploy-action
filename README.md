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

Example of deployment with helm based on a Github deployment trigger, that pushes
releases to sentry and notifies Slack.

```yaml
on: ['deployment']

#...

jobs:
  deploy:
    name: deploy ${{ github.event.deployment.payload.app }} to ${{ github.event.deployment.environment }}
    runs-on: ubuntu-latest
    steps:
      # ...
      - name: Check chart
        uses: minddocdev/deploy-action@master
        with:
          config: |
            {
              "app": "myApp",
              "appUrl": "https://myApp.minddoc.com",
              "chart": "myhelmrepo/myapp",
              "namespace": "apps",
              "release": "myapp",
              "valueFiles": [
                "myapp-values/values.yaml",
                "myapp-values/values-staging.yaml"
              ],
              "values": {
                "image": {
                  "tag": ${{ github.sha }}
                }
              }
            }
          # Or you could specify the config in the deployment payload, like:
          # config: ${{ github.event.deployment.payload }}
          environment: ${{ github.event.deployment.environment }}
          helmRepoName: myhelmrepo
          helmRepoUrl: https://raw.githubusercontent.com/mycompany/myhelmrepo/master/helm/releases
          helmRepoUsername: myhelmrepouser
          helmRepoPassword: ${{ secrets.HELM_REPO_TOKEN }}
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
          sentryAuthToken: ${{ secrets.SENTRY_AUTH_TOKEN }}
          sentryOrg: mysentryorg
          slackWebhook: ${{ secrets.SLACK_WEBHOOK }}
```
