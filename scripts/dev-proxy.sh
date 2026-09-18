#!/usr/bin/env bash
# Opens a local tunnel to Cloud SQL on 127.0.0.1:5432 for `npm run dev`, migrations, and seeding.
# Requires the Cloud SQL Auth Proxy:  brew install cloud-sql-proxy   (or see docs/DEPLOYMENT.md)
set -euo pipefail
if [ -f .env ]; then set -a; . ./.env; set +a; fi
: "${CLOUD_SQL_CONNECTION_NAME:?Set CLOUD_SQL_CONNECTION_NAME in .env (PROJECT:REGION:INSTANCE)}"
exec cloud-sql-proxy "$CLOUD_SQL_CONNECTION_NAME" --port 5432
