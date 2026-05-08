# =============================================================================
# HashiCorp Vault — bootstrap policy + KV engine cho CDNetworks Platform.
# Chạy 1 lần sau khi `vault operator init`:
#   vault login <root-token>
#   bash infrastructure/vault/bootstrap.sh
# =============================================================================
set -euo pipefail

# Bật KV v2
vault secrets enable -version=2 -path=secret kv || true

# Bật Kubernetes auth (Vault Agent Injector dùng cái này)
vault auth enable kubernetes || true
vault write auth/kubernetes/config \
  kubernetes_host="https://kubernetes.default.svc:443"

# Policy: cdn-api chỉ đọc secret/cdnetworks/api
cat <<'EOF' | vault policy write cdn-api -
path "secret/data/cdnetworks/api"   { capabilities = ["read"] }
path "secret/data/cdnetworks/shared"{ capabilities = ["read"] }
EOF

cat <<'EOF' | vault policy write cdn-worker -
path "secret/data/cdnetworks/worker" { capabilities = ["read"] }
path "secret/data/cdnetworks/shared" { capabilities = ["read"] }
EOF

cat <<'EOF' | vault policy write cdn-edge -
path "secret/data/cdnetworks/edge"   { capabilities = ["read"] }
path "secret/data/cdnetworks/ssl/*"  { capabilities = ["read"] }
EOF

# Role gắn ServiceAccount K8s với policy
vault write auth/kubernetes/role/cdn-api \
  bound_service_account_names=cdn-api \
  bound_service_account_namespaces=cdnetworks \
  policies=cdn-api ttl=1h

vault write auth/kubernetes/role/cdn-worker \
  bound_service_account_names=cdn-worker \
  bound_service_account_namespaces=cdnetworks \
  policies=cdn-worker ttl=1h

vault write auth/kubernetes/role/cdn-edge \
  bound_service_account_names=cdn-edge \
  bound_service_account_namespaces=cdnetworks \
  policies=cdn-edge ttl=1h

# Bootstrap secret values (chỉ chạy lần đầu — production nên dùng terraform-vault)
vault kv put secret/cdnetworks/api \
  jwt_secret="$(openssl rand -hex 32)" \
  admin_email="admin@vnso.vn" \
  admin_password="$(openssl rand -base64 24)" \
  database_url="postgres://cdn:CHANGEME@cdn-postgresql.cdnetworks:5432/cdn" \
  redis_url="redis://:CHANGEME@cdn-redis-master.cdnetworks:6379/0"

vault kv put secret/cdnetworks/shared \
  sentry_dsn="" \
  slack_webhook="" \
  telegram_bot_token=""

echo "✅ Vault bootstrap done. Rotate admin_password sau lần đăng nhập đầu."
