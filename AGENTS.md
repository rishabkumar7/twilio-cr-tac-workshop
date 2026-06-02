# AGENTS.md

Guidelines for AI coding agents (Claude Code, Copilot, Cursor, etc.) working in this repo.

## Repo overview

Static single-page workshop app for the Twilio Agent Connect (TAC) workshop — no build step, no package.json, no bundler.

| File | Purpose |
|---|---|
| `index.html` | Shell markup and layout |
| `styles.css` | All styles (dark/light theme, layout, components) |
| `app.js` | All JavaScript: chapter data, rendering, state, interactions |
| `assets/` | Static assets (e.g. `gemini-logo.webp`) |
| `scripts/validate-workshop-code.mjs` | CI script that syntax-checks every Python and Node.js snippet in `app.js` |
| `deploy.sh` | Azure Static Web Apps provisioning and deployment |
| `.github/workflows/deploy.yml` | GitHub Actions workflow — deploys on push to `main` |

## Key constraints

- **No build step.** `index.html` is opened directly in a browser or served with `npx serve .`. Do not introduce a bundler, transpiler, or `package.json` unless explicitly asked.
- **Single file per concern.** All chapter content, rendering logic, and event handling live in `app.js`. Do not split it into modules without explicit instruction.
- **No external runtime dependencies.** Three.js is loaded at runtime from a CDN import inside `app.js`. Do not add npm packages.
- **No comments describing what code does.** Only add a comment when the *why* is non-obvious (hidden constraint, subtle invariant, workaround for a specific bug).

## Chapter content (`app.js`)

The workshop has three chapters: **Mission Briefing** (setup), **How It Works** (conceptual), and **Agent Connect** (all TAC coding steps). Workshop chapters are in the `chapters` array near the top of `app.js`. Each chapter has:

- `title`, `summary`, `badge`, `intro`
- `steps[]` — each step has `title`, `body`, `instructions[]`, `codeLabel`, `code`
- `quiz` — `question`, `options[]`, `answer`
- `flow` — optional per-runtime flow diagram data (`python` / `node` keys)

Node.js overrides for code and body text live in `nodeCodeOverrides` and `nodeTextOverrides` (keyed by `"chapterIndex:stepIndex"`).

When editing chapter content, keep code snippets self-contained and copy-pasteable. Snippets labelled `main.py` must parse as valid Python; snippets labelled `server.js` must parse as valid ES module JavaScript. Run the validation script after editing:

```bash
node scripts/validate-workshop-code.mjs
```

## State and localStorage

Progress, builder settings, runtime choice, and theme are stored in `localStorage` under the key `twilio-cr-tac-state-v1`. Do not rename this key without also clearing old state in `loadState()`.

## Styling

All CSS variables for colors and spacing are defined in `:root` and `[data-theme="light"]` blocks at the top of `styles.css`. Prefer CSS variables over hardcoded values. Do not use Tailwind or any utility-class framework.

## Deployment

- **Manual:** `bash deploy.sh` — provisions Azure resource group + Static Web App if they do not exist, then deploys.
- **CI:** Push to `main` triggers `.github/workflows/deploy.yml`. The `AZURE_STATIC_WEB_APPS_API_TOKEN` secret must be set in the repo settings.
- Default Azure app name: `twilio-cr-tac`. Default resource group: `rg-twilio-cr-tac`.

## What agents should not do

- Do not add a `package.json`, `node_modules/`, or any build output to the repo.
- Do not modify `.github/workflows/deploy.yml` unless the change is specifically about CI/CD.
- Do not commit `.env` — it is gitignored and contains Azure credentials.
- Do not refactor working code for style without being asked.
