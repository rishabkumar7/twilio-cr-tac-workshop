# Twilio Agent Connect Workshop

This repository contains both the hosted workshop guide and the workspace attendees use to build their agent.

## Repository layout

```text
twilio-cr-tac-workshop/
├── workshop-app/       Static workshop website and deployment tooling
├── .env.example        Environment variable template for attendee code
├── main.py             Python attendees create during the workshop
└── server.js           Node.js attendees create during the workshop
```

Attendee code belongs at the repository root. Keep `workshop-app/` unchanged while following the workshop so the guide remains separate from the agent being built.

## Start the workshop

Open the hosted Azure Static Web App, or serve the guide locally:

```bash
npx serve workshop-app
```

Then prepare the root workspace:

```bash
cp .env.example .env
```

Choose Python or Node.js in the workshop guide and create `main.py` or `server.js` at the repository root as directed.

## Workshop app development

The static site has no build step. Validate its embedded code snippets with:

```bash
node workshop-app/scripts/validate-workshop-code.mjs
```

Deploy it manually with:

```bash
bash workshop-app/deploy.sh
```

Changes under `workshop-app/` pushed to `main` deploy through `.github/workflows/deploy.yml` when the `AZURE_STATIC_WEB_APPS_API_TOKEN` repository secret is configured.
