# TravelMind AI — Participant Setup Guide

This file explains how to download, install and run the TravelMind AI project locally, and how to open the main project areas.

## 1. Required Software

Before downloading the project, install:

- **Node.js LTS** — includes `npm`, which is required to install and run the project.

Check that Node.js and npm are available:

```bash
node --version
npm --version
```

## 2. Install the Project Dependencies

Run this command once inside the project folder:

```bash
npm install
```

This command reads `package.json` and automatically installs all dependencies required by the project, including:

- Next.js
- React
- Firebase
- Bootstrap
- React Icons
- Recharts
- Google Gemini SDK — `@google/genai`

The packages do not need to be installed separately when `npm install` completes successfully.

## 4. Start the Project

Run:

```bash
npm run dev
```

When the development server starts, open:

```text
http://localhost:3000
```

The login page can be opened directly at:

```text
http://localhost:3000/login
```

Keep the terminal running while working on the project.

## 5. Test Login Accounts

### Admin account

```text
Email: admin@travelmind-ai.com
Password: admin12345
```

Use this account for the Admin area.

### Traveller account

```text
Email: amelia.carter@example.com
Password: test123456
```

Use this account for the Traveller area.

These are project test accounts. They must not be reused for personal services or production deployment.

## 6. Main Local Addresses

### Traveller Dashboard

```text
http://localhost:3000/traveller/account/dashboard
```

Sign in with the Traveller account before opening this area.

### Admin Dashboard

```text
http://localhost:3000/admin/dashboard
```

Sign in with the Admin account before opening this area.

### Trip Comparison

```text
http://localhost:3000/trip-comparison
```

Open this address after the development server has started.

## 8. Opening the Correct Project Area

### Traveller area

1. Start the project with `npm run dev`.
2. Open `http://localhost:3000/login`.
3. Sign in with the Traveller test account.
4. Open `http://localhost:3000/traveller/account/dashboard`.
5. Use the Traveller navigation to open the assigned Traveller pages.

### Admin area

1. Start the project with `npm run dev`.
2. Open `http://localhost:3000/login`.
3. Sign in with the Admin test account.
4. Open `http://localhost:3000/admin/dashboard`.
5. Use the Admin navigation to open the assigned Admin pages.

### Trip Comparison area

1. Start the project with `npm run dev`.
2. Open `http://localhost:3000/trip-comparison`.
3. Continue working inside the `src/app/trip-comparison` folder.
