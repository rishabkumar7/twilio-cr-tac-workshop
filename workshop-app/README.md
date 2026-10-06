# Workshop Web App

A self-contained workshop web app for guiding attendees through building a voice AI agent with Twilio Agent Connect (TAC) and Gemini Flash. The Python path is shown by default; an optional Node.js path can be enabled with configuration.

From the repository root, open `workshop-app/index.html` directly or serve the folder locally:

```bash
npx serve workshop-app
```

No build step is required.

Deployment only stages the static app files (`index.html`, `config.js`, `app.js`, `styles.css`, and `assets/`) from this directory. Participant code at the repository root is never uploaded to Azure.

## What is included

- Three workshop chapters: Mission Briefing, How It Works, and Agent Connect.
- Copyable Python, terminal, and prompt snippets by default.
- Optional Node.js instructions behind a configuration flag.
- Local progress tracking with chapter badges.
- Interactive prompt builder for the agent name, persona, and Gemini model used by the workshop.
- Light and dark themes.

## SDK reference for maintainers

The workshop uses this repository as the attendee workspace. Maintainers can consult the upstream TAC Python SDK separately when updating SDK-specific examples:

https://github.com/twilio/twilio-agent-connect-python

## Validate and deploy

Run these commands from the repository root:

```bash
node workshop-app/scripts/validate-workshop-code.mjs
bash workshop-app/deploy.sh
```

## Optional Node.js path

The Node.js workshop path is disabled by default. For local development, set `enableNode` to `true` in `workshop-app/config.js` and reload the page.

For a manual deployment, set the deployment environment variable:

```bash
ENABLE_NODE_WORKSHOP=true bash workshop-app/deploy.sh
```

For GitHub Actions deployments, set the repository variable `ENABLE_NODE_WORKSHOP` to `true`. Leave it unset or set it to `false` for the Python-only workshop.
