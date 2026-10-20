# Azure Hosting & Deployment Plan

> **Note on Submission Scope**:  
> Live cloud deployment is optional for this assessment and has **not** been performed. This document details the complete production architecture, deployment workflow, monitoring strategy, security baseline, and cost management plan for hosting the Adaptive Memory Matching Game on **Azure Static Web Apps (SWA)**.

---

## 1. System Architecture

The Adaptive Memory Matching Game is an entirely client-side Single-Page Application (SPA).

```
                      +---------------------------------------+
                      |             User Browser              |
                      |  - React 18 SPA (DOM + State)         |
                      |  - Seeded Mulberry32 RNG              |
                      |  - LocalStorage (Anonymous Results)   |
                      |  - Page Visibility Timer API          |
                      +-------------------+-------------------+
                                          |
                                          | HTTPS (TLS 1.3)
                                          v
                      +---------------------------------------+
                      |     Azure Static Web Apps (CDN)       |
                      |  - Globally Distributed Edge Cache    |
                      |  - Static Assets (HTML, CSS, JS)      |
                      |  - Automated SSL Certificate          |
                      |  - Custom Security Headers Config     |
                      +---------------------------------------+
```

### Architecture Highlights
- **Zero Backend / Serverless**: No node server, container, or database is required. The bundle (`index.html`, JavaScript, CSS) is served directly from Azure's global edge network.
- **Client-Side Persistence**: Game history and anonymous session stats are stored entirely in the user's browser `localStorage`. No server-side database or user authentication is required.
- **Deterministic Compute in Browser**: Shuffling, win detection, and adaptive difficulty calculations run deterministically in the client runtime without latency or network dependency.

---

## 2. Why Static Hosting Fits This Project

1. **Performance**: Static assets are pre-compiled (`npm run build`) and cached across Azure CDN points-of-presence (PoPs), delivering sub-50ms Time To First Byte (TTFB) globally.
2. **Operational Simplicity**: No OS patches, runtime maintenance, server provisioning, or scaling policies to manage.
3. **High Availability**: SWA provides 99.95% SLA on static content delivery with built-in geo-redundancy.
4. **Cost Efficiency**: Zero compute idling costs. The Free tier easily handles thousands of monthly players with zero financial overhead.

---

## 3. Deployment Workflow via GitHub Actions

Deployments are automated through GitHub Actions upon push to the main branch or creation of pull requests.

### Build and Artifact Configuration
- **App Location**: `/` (or repository root)
- **Build Command**: `npm run build`
- **Output Folder**: `dist`
- **Node Runtime**: Version `20`

### Pipeline Specification (`.github/workflows/azure-static-web-apps.yml`)
```yaml
name: Deploy to Azure Static Web Apps

on:
  push:
    branches: [ main ]
  pull_request:
    types: [ opened, synchronize, reopened, closed ]
    branches: [ main ]

jobs:
  build_and_deploy_job:
    if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed')
    runs-on: ubuntu-latest
    name: Build and Deploy Job
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: true

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install & Test
        run: |
          npm ci
          npm test -- --run

      - name: Build and Deploy to Azure SWA
        id: builddeploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "/"
          output_location: "dist"

  close_pull_request_job:
    if: github.event_name == 'pull_request' && github.event.action == 'closed'
    runs-on: ubuntu-latest
    name: Close Pull Request Job
    steps:
      - name: Close Staging Environment
        id: closepullrequest
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          action: "close"
```

---

## 4. Identity, Credentials, and Secrets

- **Zero In-App Secrets**: The application code contains no API keys, connection strings, or database credentials.
- **CI/CD Authentication**:
  - **Standard Approach**: The Azure Static Web App deployment token is stored as an encrypted GitHub secret (`AZURE_STATIC_WEB_APPS_API_TOKEN`).
  - **Recommended Enterprise Alternative**: Azure OpenID Connect (OIDC) with Workload Identity Federation, eliminating long-lived credentials entirely.
- **Repository Cleanliness**: `.env` and `.env.*` are explicitly listed in `.gitignore` to prevent any local variables from accidentally reaching the remote repository.

---

## 5. Observability and Monitoring

Telemetry and health checks are configured using Azure Monitor and Application Insights:

1. **Client-Side Telemetry (Application Insights)**:
   - A lightweight Application Insights JavaScript SDK snippet in `index.html` logs page load performance, route changes, and unhandled client-side runtime errors.
2. **Synthetic Health Alerts**:
   - Azure Monitor synthetic availability tests send HTTP GET requests every 5 minutes to verify HTTP 200 response codes and SSL validity.
3. **Metric Alerts**:
   - Alert triggered if 4xx/5xx HTTP error rate exceeds 1% over a 5-minute rolling evaluation window.
   - Immediate email/SMS notification to operations contacts via Azure Action Groups.

---

## 6. Cost Control and Budgeting

The application is structured to run at **$0 / month** on Azure infrastructure:

- **Free Tier Entitlements**:
  - Azure Static Web Apps Free plan includes:
    - Custom domains with free auto-renewed SSL/TLS certificates.
    - 100 GB bandwidth per month.
    - Up to 3 pre-production staging environments for Pull Requests.
- **Budget Alerts**:
  - An Azure Cost Management budget alert is created at the subscription/resource group level with an absolute budget limit of **$1.00 USD**.
  - Automated threshold alerts trigger at 50%, 80%, and 100% consumption.

---

## 7. Security Hardening and Compliance

Security policies are enforced at the edge via `staticwebapp.config.json` placed in the project root:

```json
{
  "navigationFallback": {
    "rewrite": "/index.html"
  },
  "globalHeaders": {
    "Content-Security-Policy": "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://dc.services.visualstudio.com; object-src 'none'; frame-ancestors 'none';",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload"
  },
  "mimeTypes": {
    ".json": "application/json"
  }
}
```

### Security Considerations:
- **HTTPS Enforced**: All HTTP requests are automatically redirected to HTTPS (TLS 1.2 / TLS 1.3).
- **Privacy by Design**: No Personally Identifiable Information (PII) or IP addresses are tracked or sent to external servers. All session analytics remain in the user's browser `localStorage`.
- **Content Security Policy (CSP)**: Disallows external scripts, frame embedding (`DENY`), and MIME-type sniffing.

---

## 8. Rollback and Preview Environments

1. **Pull Request Staging**:
   - Each GitHub pull request automatically provisions an isolated, ephemeral staging environment URL (e.g., `https://nice-ocean-123-pr1.azurestaticapps.net`).
   - Enables end-to-end visual and functional review before code merges to `main`.
2. **Instant Production Rollback**:
   - If a regression occurs in production, reverting the commit in Git and pushing triggers the GitHub Action to rebuild and redeploy the last stable build within 90 seconds.
   - Alternatively, the Azure Portal allows promoting an active staging build to production instantly.
