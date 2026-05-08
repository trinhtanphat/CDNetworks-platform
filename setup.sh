#!/usr/bin/env bash
# =============================================================================
# CDNetworks Platform — bootstrap script
# Chạy: bash setup.sh   (idempotent, có thể chạy lại nhiều lần)
# Tạo toàn bộ cây thư mục + file rỗng theo ARCHITECTURE.md
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo ">> Bootstrap CDNetworks-platform tại: $ROOT"

# ------------------------------------------------------------ helpers
mk()  { mkdir -p "$ROOT/$1"; }
tch() { local f="$ROOT/$1"; mkdir -p "$(dirname "$f")"; [[ -e "$f" ]] || touch "$f"; }

# ------------------------------------------------------------ root files
for f in README.md AI_CONTEXT.md .env.example .gitignore docker-compose.yml \
         package.json pnpm-workspace.yaml; do
  tch "$f"
done

# ------------------------------------------------------------ apps/web (Next.js)
mk apps/web/app/\(marketing\)/free-trial
mk apps/web/app/\(marketing\)/products/\[slug\]
mk apps/web/components
mk apps/web/lib
mk apps/web/public/images
for f in \
  apps/web/app/layout.tsx \
  apps/web/app/globals.css \
  apps/web/app/\(marketing\)/page.tsx \
  apps/web/app/\(marketing\)/free-trial/page.tsx \
  apps/web/app/\(marketing\)/products/\[slug\]/page.tsx \
  apps/web/components/Header.tsx \
  apps/web/components/Footer.tsx \
  apps/web/components/HeroBanner.tsx \
  apps/web/components/ServiceGrid.tsx \
  apps/web/components/FreeTrialForm.tsx \
  apps/web/lib/i18n.ts \
  apps/web/next.config.mjs \
  apps/web/tailwind.config.ts \
  apps/web/postcss.config.js \
  apps/web/tsconfig.json \
  apps/web/package.json; do tch "$f"; done

# ------------------------------------------------------------ apps/console (Vite + AntD)
mk apps/console/src/containers/App
mk apps/console/src/containers/Sidebar
mk apps/console/src/containers/Topbar
mk apps/console/src/containers/Dashboard
mk apps/console/src/containers/Reports
mk apps/console/src/containers/EdgeConfig
mk apps/console/src/containers/AccessLogs
mk apps/console/src/components
mk apps/console/src/services
mk apps/console/src/utils
mk apps/console/src/styles/themes
for f in \
  apps/console/index.html \
  apps/console/vite.config.ts \
  apps/console/tsconfig.json \
  apps/console/package.json \
  apps/console/src/main.tsx \
  apps/console/src/App.tsx \
  apps/console/src/routes.tsx \
  apps/console/src/containers/App/MainLayout.tsx \
  apps/console/src/containers/Sidebar/Sidebar.tsx \
  apps/console/src/containers/Topbar/Topbar.tsx \
  apps/console/src/containers/Dashboard/Dashboard.tsx \
  apps/console/src/containers/Reports/Reports.tsx \
  apps/console/src/containers/EdgeConfig/EdgeConfig.tsx \
  apps/console/src/containers/AccessLogs/AccessLogs.tsx \
  apps/console/src/components/DateRangePicker.tsx \
  apps/console/src/components/HostnameSelect.tsx \
  apps/console/src/services/api.ts \
  apps/console/src/services/auth.ts \
  apps/console/src/utils/dateRange.ts \
  apps/console/src/styles/themes/index.ts; do tch "$f"; done

# ------------------------------------------------------------ apps/api (Express + TS)
mk apps/api/src/routes
mk apps/api/src/controllers
mk apps/api/src/services
mk apps/api/src/middlewares
mk apps/api/src/mock
for f in \
  apps/api/tsconfig.json \
  apps/api/package.json \
  apps/api/src/server.ts \
  apps/api/src/app.ts \
  apps/api/src/routes/index.ts \
  apps/api/src/routes/auth.routes.ts \
  apps/api/src/routes/accesslogs.routes.ts \
  apps/api/src/middlewares/auth.ts \
  apps/api/src/mock/accesslogs.json; do tch "$f"; done

# ------------------------------------------------------------ packages
mk packages/ui/src
mk packages/sdk/src
mk packages/eslint-config
for f in packages/ui/package.json packages/sdk/package.json \
         packages/eslint-config/index.js; do tch "$f"; done

# ------------------------------------------------------------ docs (Docusaurus)
mk docs/docs/getting-started
mk docs/docs/tutorials
mk docs/docs/api-reference
mk docs/i18n/en
mk docs/i18n/vi
mk docs/static
for f in \
  docs/docusaurus.config.ts \
  docs/sidebars.ts \
  docs/package.json \
  docs/docs/getting-started/introduction.md \
  docs/docs/tutorials/how-to-download-access-logs.md \
  docs/docs/api-reference/access-logs-api.md; do tch "$f"; done

# ------------------------------------------------------------ infrastructure
mk infrastructure/nginx/conf.d
mk infrastructure/docker
mk infrastructure/k8s
for f in \
  infrastructure/nginx/conf.d/web.conf \
  infrastructure/nginx/conf.d/console.conf \
  infrastructure/nginx/conf.d/api.conf \
  infrastructure/nginx/conf.d/docs.conf \
  infrastructure/docker/web.Dockerfile \
  infrastructure/docker/console.Dockerfile \
  infrastructure/docker/api.Dockerfile; do tch "$f"; done

# ------------------------------------------------------------ tests
mk tests/unit
mk tests/e2e/cypress/e2e
mk tests/e2e/cypress/support
for f in \
  tests/unit/dateRange.test.ts \
  tests/unit/jest.config.ts \
  tests/unit/package.json \
  tests/e2e/cypress.config.ts \
  tests/e2e/package.json \
  tests/e2e/cypress/support/e2e.ts \
  tests/e2e/cypress/e2e/login-and-download-log.cy.ts; do tch "$f"; done

# ------------------------------------------------------------ scripts
mk scripts
for f in scripts/seed-mock.ts scripts/build-all.sh; do tch "$f"; done

echo ">> Done. Tổng số file/dir đã tạo:"
find "$ROOT" -mindepth 1 -maxdepth 5 \
  \( -path '*/node_modules' -prune \) -o -print | wc -l
echo ">> Tiếp theo: cd $ROOT && pnpm install && pnpm -r dev"
