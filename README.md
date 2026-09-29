# Solara

A personal budgeting app. Set a monthly budget per category, log income and
expenses, and see how you're tracking at a glance. Sign in with email and
password and your budget syncs across devices through Firebase. It installs
to a phone's home screen and keeps working offline.

Live at https://ksamra1200.github.io/Solara/

## Features

- Monthly budget by category, with a ring chart and progress meters;
  categories can fill up (ascending) or count down (descending)
- Roll unused money over to the next month
- Income and expense log with search and filters, recurring transactions,
  CSV export, and undo
- Alerts for bills coming due and categories near or over budget
- Auto-categorize rules ("note contains Shell -> Gas")
- Reports: income vs. spending and spending by category over 3/6/12 months
- Savings goals
- Share a budget with a partner using an invite code

## Getting started

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173). This talks to
the real Firebase project.

To work against local Firebase emulators instead (needs Java):

```bash
npm run emulators       # in one terminal
npm run dev:emulated    # in another
```

## Tests

```bash
npm run test:rules      # Firestore security rules, against the emulator
```

## Build & deploy

```bash
npm run build
```

Pushing to `main` builds and deploys to GitHub Pages
(`.github/workflows/deploy.yml`). Firestore rules live in `firestore.rules`
and are deployed separately with the Firebase CLI or console.
