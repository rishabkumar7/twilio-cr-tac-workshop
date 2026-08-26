# Workshop Web App

A self-contained workshop web app for guiding attendees through building a voice AI agent with Twilio Agent Connect (TAC) and Gemini Flash. The workshop supports both a Python and a Node.js path.

From the repository root, open `workshop-app/index.html` directly or serve the folder locally:

```bash
npx serve workshop-app
```

No build step is required.

Deployment only stages the static app files (`index.html`, `app.js`, `styles.css`, and `assets/`) from this directory. Participant code at the repository root is never uploaded to Azure.

## What is included

- Three workshop chapters: Mission Briefing, How It Works, and Agent Connect.
- Copyable Python, Node.js, terminal, and prompt snippets.
- Runtime switcher for Python or Node.js workshop instructions.
- Local progress tracking with chapter badges.
- Interactive agent builder for name, persona, voice, Gemini model, tools, and handoff behavior.
- Light and dark themes.

## Source Workshop Repo

The workshop content is based on the TAC sample repo:

https://github.com/twilio/twilio-agent-connect-python

## Validate and deploy

Run these commands from the repository root:

```bash
node workshop-app/scripts/validate-workshop-code.mjs
bash workshop-app/deploy.sh
```
