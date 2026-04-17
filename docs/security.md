# Security

## Principles

- keep provider keys in Cloudflare secrets
- store only required metadata in D1
- preserve raw artifacts in R2 with scoped access
- validate all external payloads before persistence
- log traces without leaking secrets

## Recommended Controls

- Cloudflare Access for internal dashboards
- environment-specific API keys
- signed upload URLs for screenshots
- audit logs for eval and operator actions

@BryteSikaStrategyAI
