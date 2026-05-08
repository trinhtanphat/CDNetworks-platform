# Enterprise Deployment Blueprint — CDNetworks Platform

Bộ scaffolding sẵn sàng để bật khi VPS hiện tại chuyển sang multi-node / K8s.
**KHÔNG** apply vào single-VPS hiện tại — chỉ là blueprint.

```
infrastructure/
├── helm/cdnetworks/         Helm chart (api/console/web/worker/edge DaemonSet)
├── argocd/application.yaml  GitOps tự động sync từ git
├── terraform/main.tf        Cloudflare WAF + Anycast + Route53 GeoDNS + Hetzner PoP
├── vault/bootstrap.sh       HashiCorp Vault policy + KV bootstrap
├── backup/                  pg_dump → S3 STANDARD_IA (cron + K8s CronJob)
├── observability/           Prometheus alerts + Alertmanager Telegram/Slack
├── mesh/linkerd-policies    Auto-mTLS giữa các service
├── chaos/litmus-*.yaml      Chaos experiments (pod-kill, latency, disk-fill)
└── uptime/uptimerobot.yaml  External health check 3 region
```

## Thứ tự triển khai khi có cluster K8s

| Bước | Lệnh | Kết quả |
|------|------|---------|
| 1. Cluster | `kubeadm init` hoặc managed K8s | API server up |
| 2. Ingress + cert-manager | `helm install ingress-nginx` + cert-manager | TLS tự động |
| 3. Vault | `helm install vault hashicorp/vault` → `bootstrap.sh` | Secrets store |
| 4. Linkerd | `linkerd install \| kubectl apply -f -` + `mesh/linkerd-policies.yaml` | mTLS auto |
| 5. Monitoring | `helm install kube-prometheus-stack` + `prometheus-alerts.yml` + `alertmanager.yml` | Metrics + alert |
| 6. ArgoCD | `helm install argo-cd argo/argo-cd` → apply `argocd/application.yaml` | GitOps |
| 7. App | ArgoCD tự sync `helm/cdnetworks` | api/console/web/worker/edge live |
| 8. Backup | `kubectl apply -f backup/cronjob.yaml` | Daily pg_dump → S3 |
| 9. Anycast | `terraform apply` (Cloudflare + Route53 + Hetzner) | GeoDNS multi-PoP |
| 10. Chaos | `kubectl apply -f chaos/litmus-experiments.yaml` (chỉ staging) | HA verified |

## Mappping: yêu cầu → file đã tạo

| Yêu cầu | File |
|---------|------|
| K8s + Helm chart | `helm/cdnetworks/{Chart,values}.yaml` + `templates/*.yaml` |
| ArgoCD GitOps | `argocd/application.yaml` |
| Anycast IP + GeoDNS | `terraform/main.tf` (Cloudflare + Route53) |
| HashiCorp Vault | `vault/bootstrap.sh` + Vault Agent annotations trong `helm/.../api-deployment.yaml` |
| Cloudflare WAF | `terraform/main.tf` (cloudflare_ruleset + rate_limit) |
| UptimeRobot | `uptime/uptimerobot.yaml` |
| Postgres backup S3 STANDARD_IA | `backup/postgres-backup.sh` + `backup/cronjob.yaml` |
| Alertmanager Telegram/Slack | `observability/alertmanager.yml` + `prometheus-alerts.yml` |
| mTLS Linkerd | `mesh/linkerd-policies.yaml` + Helm template auto-inject |
| Chaos Litmus | `chaos/litmus-experiments.yaml` |
