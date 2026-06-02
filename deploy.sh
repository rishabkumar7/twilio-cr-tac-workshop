#!/usr/bin/env bash
set -euo pipefail

APP_NAME="${APP_NAME:-twilio-cr-tac}"
RESOURCE_GROUP="${RESOURCE_GROUP:-rg-twilio-cr-tac}"
LOCATION="${LOCATION:-eastus2}"
CREATED_BY="${CREATED_BY:-$(az account show --query user.name -o tsv 2>/dev/null || echo "unknown")}"
SITE_DIR="$(cd "$(dirname "$0")" && pwd)"

# ── prereq checks ────────────────────────────────────────────────────────────

if ! command -v az &>/dev/null; then
  echo "Error: Azure CLI (az) is not installed." >&2
  echo "  Install: https://docs.microsoft.com/cli/azure/install-azure-cli" >&2
  exit 1
fi

if ! command -v swa &>/dev/null; then
  echo "SWA CLI not found. Installing..."
  npm install -g @azure/static-web-apps-cli
fi

# ── azure login check ─────────────────────────────────────────────────────────

if ! az account show &>/dev/null; then
  echo "Not logged in to Azure. Running az login..."
  az login
fi

echo "Account: $(az account show --query '[name, id]' -o tsv | tr '\t' ' / ')"

# ── resource group ────────────────────────────────────────────────────────────

if ! az group show --name "$RESOURCE_GROUP" &>/dev/null; then
  echo "Creating resource group '$RESOURCE_GROUP' in $LOCATION..."
  az group create --name "$RESOURCE_GROUP" --location "$LOCATION" \
    --tags created_by="$CREATED_BY" \
    --output none
  echo "Resource group created."
fi

# ── static web app ────────────────────────────────────────────────────────────

if ! az staticwebapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" &>/dev/null; then
  echo "Creating Static Web App '$APP_NAME'..."
  az staticwebapp create \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --sku Free \
    --tags created_by="$CREATED_BY" \
    --output none
  echo "Static Web App created."
fi

# ── deploy ────────────────────────────────────────────────────────────────────

echo "Deploying '$SITE_DIR' to '$APP_NAME'..."
# StaticSitesClient requires CWD to not be inside the artifact folder.
# Run from the parent directory and pass the project folder as a relative path.
(cd "$(dirname "$SITE_DIR")" && swa deploy "$(basename "$SITE_DIR")" \
  --app-name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --env production)

echo ""
HOSTNAME=$(az staticwebapp show \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query defaultHostname -o tsv)
echo "Deployed: https://$HOSTNAME"
