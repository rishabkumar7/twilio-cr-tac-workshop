# AGENTS.md

Guidelines for AI coding agents (Claude Code, Copilot, Cursor, etc.) working in this repo.

## Repo overview

Monorepo for the Twilio Agent Connect (TAC) workshop. `workshop-app/` contains the deployable static guide. The repository root is the attendee workspace where workshop participants create `main.py`, `server.js`, and related runtime files.

| File | Purpose |
|---|---|
| `workshop-app/index.html` | Workshop shell markup and layout |
| `workshop-app/config.js` | Deployment-time workshop feature flags |
| `workshop-app/styles.css` | All workshop styles (dark/light theme, layout, components) |
| `workshop-app/app.js` | Workshop content, rendering, state, and interactions |
| `workshop-app/assets/` | Static workshop assets (e.g. `gemini-logo.webp`) |
| `workshop-app/scripts/validate-workshop-code.mjs` | Syntax-checks every Python and Node.js snippet in `workshop-app/app.js` |
| `workshop-app/deploy.sh` | Azure Static Web Apps provisioning and deployment |
| `.env.example` | Safe attendee environment template; copied to the ignored root `.env` |
| `.github/workflows/deploy.yml` | GitHub Actions workflow — deploys `workshop-app/` changes on push to `main` |

## Key constraints

- **No workshop-app build step.** `workshop-app/index.html` is opened directly or served with `npx serve workshop-app`. Do not introduce a bundler or transpiler for the workshop app unless explicitly asked.
- **Single file per workshop concern.** All chapter content, rendering logic, and event handling live in `workshop-app/app.js`. Do not split it into modules without explicit instruction.
- **No external workshop runtime dependencies.** Three.js is loaded from a CDN inside `workshop-app/app.js`. Participant code at the root may install the Python or Node.js dependencies required by workshop steps.
- **Keep concerns separated.** Deployable guide files belong under `workshop-app/`; attendee agent code belongs at the repository root.
- **No comments describing what code does.** Only add a comment when the *why* is non-obvious (hidden constraint, subtle invariant, workaround for a specific bug).

## Chapter content (`workshop-app/app.js`)

The workshop has three chapters: **Mission Briefing** (setup), **How It Works** (conceptual), and **Agent Connect** (all TAC coding steps). Workshop chapters are in the `chapters` array near the top of `workshop-app/app.js`. Each chapter has:

- `title`, `summary`, `badge`, `intro`
- `steps[]` — each step has `title`, `body`, `instructions[]`, `codeLabel`, `code`
- `quiz` — `question`, `options[]`, `answer`
- `flow` — optional per-runtime flow diagram data (`python` / `node` keys)

Node.js overrides for code and body text live in `nodeCodeOverrides` and `nodeTextOverrides` (keyed by `"chapterIndex:stepIndex"`).

When editing chapter content, keep code snippets self-contained and copy-pasteable. Snippets labelled `main.py` must parse as valid Python; snippets labelled `server.js` must parse as valid ES module JavaScript. Run the validation script after editing:

```bash
node workshop-app/scripts/validate-workshop-code.mjs
```

## State and localStorage

Progress, builder settings, runtime choice, and theme are stored in `localStorage` under the key `twilio-cr-tac-state-v1`. Do not rename this key without also clearing old state in `loadState()`. The Node.js runtime must remain inaccessible when `config.js` sets `enableNode` to `false`, including for saved Node.js state.

## Styling

All CSS variables for colors and spacing are defined in `:root` and `[data-theme="light"]` blocks at the top of `workshop-app/styles.css`. Prefer CSS variables over hardcoded values. Do not use Tailwind or any utility-class framework.

## Deployment

- **Manual:** `bash workshop-app/deploy.sh` — provisions Azure resource group + Static Web App if they do not exist, then deploys only static guide files. Set `ENABLE_NODE_WORKSHOP=true` to expose the optional Node.js path.
- **CI:** Changes under `workshop-app/` pushed to `main` trigger `.github/workflows/deploy.yml`, which stages only static guide files. The `AZURE_STATIC_WEB_APPS_API_TOKEN` secret must be set in the repo settings. The optional `ENABLE_NODE_WORKSHOP` repository variable controls whether the Node.js path is exposed.
- Default Azure app name: `twilio-cr-tac`. Default resource group: `rg-twilio-cr-tac`.

## What agents should not do

- Do not add a `package.json`, `node_modules/`, or build output inside `workshop-app/`.
- Do not move attendee code into `workshop-app/` or include root participant files in the static deployment.
- Do not modify `.github/workflows/deploy.yml` unless the change is specifically about CI/CD.
- Do not commit `.env` — it is gitignored and contains attendee credentials.
- Do not refactor working code for style without being asked.
