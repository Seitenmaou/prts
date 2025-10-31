## Purpose

This file gives short, actionable guidance for AI coding agents working on this repository (a Create React App-based React frontend).

## Big picture

- Project type: Create React App (see `package.json`). Entry point is `src/index.js`, top-level component is `src/App.js`.
- UI is organized under `src/` with a small `pages/` folder (`src/pages/Login.js`, `src/pages/Dashboard.js`). At present those page files are present but empty — routing and page wiring live in `src/App.js` or `src/index.js`.
- No obvious backend or API integration in the repository. If adding integrations, update README and add environment variables using CRA conventions (`REACT_APP_...`).

## How to run & test (commands)

- Install dependencies: `npm install`
- Start dev server: `npm start` (runs `react-scripts start`, app served on http://localhost:3000)
- Run tests: `npm test` (CRA test runner)
- Build for production: `npm run build`

All scripts are defined in `package.json`.

## Important files & patterns

- `src/index.js` — React entry, renders `<App />` inside `React.StrictMode`.
- `src/App.js` — main app shell. Use this file to add global routing, top-level providers, and common layout.
- `src/pages/*.js` — page components (Login, Dashboard). Create new pages here and export default a React component.
- `public/index.html` — static HTML template; favicon and meta live here.
- `src/reportWebVitals.js` — performance helper used by CRA — keep if you plan to collect metrics.

## Project-specific conventions

- Keep presentational components under `src/` and page-level components in `src/pages/`.
- CSS is colocated in `src/*.css` (see `App.css`, `index.css`). Prefer existing CSS files for small projects instead of introducing a new styling framework without discussion.
- Tests use Testing Library packages installed in `package.json` — follow existing Testing Library patterns for DOM testing.

## Examples (how to extend)

- Add a page: create `src/pages/Settings.js`, export a default React component, then import & register route in `src/App.js`.
- Add a route: edit `src/App.js` to wrap content in a router (React Router is installed — check `package.json` for version) and add a route that renders the new page component.

## Safety & assumptions for agents

- Do not modify `react-scripts` or eject (`npm run eject`) unless explicitly requested; this is a CRA-managed project.
- There is no secrets file in repo. If you need environment values, use `.env` (ignored by git) and follow CRA naming (`REACT_APP_*`).

## When to ask the human

- If you need to add a new major dependency (e.g., state management, UI library), ask before making the change.
- If pages need API contracts (endpoints, auth), request API specs or backend details.

## Where to look next

- Start by opening `src/App.js` and `src/index.js` to add routes or providers.
- Check `package.json` for available scripts and installed versions.

If anything here is unclear or you want specific examples (routing, state, tests), tell me which area to expand.
