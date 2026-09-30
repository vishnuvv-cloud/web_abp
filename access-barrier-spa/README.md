# Access Barrier Prediction — Hub Agent SPA

Frontend-only React application for Hub Agent case review. The app uses business-level case, assessment, owner, action, and validation-issue concepts. Backend processing and infrastructure are outside this repository.

## Requirements

- Node.js 20 or newer
- npm

## Install and run in VS Code

Open this folder in VS Code, then run in the integrated terminal:

```sh
npm install
npm run dev
```

Vite prints the local development URL. The application works without a backend in mock mode.

## Project structure

- `src/App.jsx` — React Router route map
- `src/components/layout/` — Hub Agent navigation shell and profile controls
- `src/features/hub/` — Dashboard, case queue, workspace drawer, exceptions, and secondary views
- `src/hooks/useHubData.js` — shared async loading, retry, and error state
- `src/services/api/` — API transport and case/dashboard functions
- `src/mocks/hubData.js` — synthetic demo cases, metrics, activity, and validation issues
- `src/styles/` — base styles, tokens, and Hub Agent responsive UI

## Environment variables

Copy `.env.example` to `.env.local` when configuring the app. Only public browser configuration belongs here; never put API secrets or cloud credentials in a Vite variable.

- `VITE_API_BASE_URL` — base URL for your API. No URL is hardcoded in the source.
- `VITE_USE_MOCK_DATA` — set to `true` to run against local synthetic data, or `false` to call the configured API.

Restart Vite after changing environment variables.

## Mock mode and API mode

Mock mode is the default unless `VITE_USE_MOCK_DATA=false` is set. The screens call the same service functions in both modes, so mock data can be replaced independently of the UI.

API mode currently maps the service functions to these business endpoints:

- `GET /dashboard/summary`
- `GET /cases`, `GET /cases/:caseId`, `GET /cases?assignedTo=me`
- `GET /cases/:caseId/activity`
- `GET /cases/:caseId/assessment`
- `GET /cases/:caseId/ownership`
- `GET /cases/:caseId/actions`
- `GET /exceptions`
- `POST /cases/:caseId/decision`
- `PUT /cases/:caseId/assessment`
- `PUT /cases/:caseId/assignment`

Response mapping lives in `src/services/api/caseService.js`; adjust that file if your API contract differs. Components do not call `fetch` directly. Data refresh is isolated in `useHubData`, so polling or a push-based transport can be introduced behind the service boundary later.

## Routes

- `/hub/dashboard`
- `/hub/cases`
- `/hub/cases/:caseId`
- `/hub/my-cases`
- `/hub/exceptions`
- `/hub/outcomes`
- `/hub/performance`
- `/hub/rules`

## Production build

```sh
npm run build
npm run preview
```

All included names, patient references, and case records are synthetic.
