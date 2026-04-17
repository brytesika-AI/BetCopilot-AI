$ErrorActionPreference = "Stop"

Write-Host "Installing workspace dependencies..."
npm install

Write-Host "Applying D1 schema..."
wrangler d1 execute betcopilot-ai --file infra/d1/schema.sql --config apps/api-edge/wrangler.toml

Write-Host "Starting API locally..."
npm run dev:api
