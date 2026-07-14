# TravelMind AI

TravelMind AI is a web application for planning trips, estimating travel costs and receiving personalised destination recommendations.

The application combines deterministic travel calculations with AI-generated explanations and itinerary support. It includes separate Traveller and Admin areas, Firebase Authentication, Firestore data storage and Google Gemini integration.

## Main Features

### Traveller

- Account registration and sign-in
- Trip planning by destination, month, duration, budget and spending style
- Estimated travel-cost calculation
- Budget status and optimisation suggestions
- Personalised destination recommendations
- AI-generated recommendation explanations
- AI itinerary generation and refinement
- Saved trips
- Traveller profile

### Admin

- Dashboard overview
- Destination catalogue
- Cost Settings management
- Recommendation Rules management
- AI activity logs
- User account overview

## Technology Stack

- Next.js
- React
- Firebase Authentication
- Cloud Firestore
- Google Gemini
- Bootstrap
- CSS Modules
- React Icons
- Recharts

## Installed Packages

The project dependencies are defined in `package.json`.

The main packages were installed with the following terminal commands.

### Bootstrap

```bash
npm install bootstrap
```

Bootstrap is used as the main UI library for responsive layouts, grids, forms, buttons, cards, navigation and tables.

### Firebase

```bash
npm install firebase
```

Firebase provides Authentication and Cloud Firestore access.

### React Icons and Recharts

```bash
npm install react-icons recharts
```

React Icons provides interface icons.

Recharts is available for charts and dashboard visualisations.

### Google Gemini SDK

```bash
npm install @google/genai
```

The project uses the official `@google/genai` JavaScript SDK for Gemini integration.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root.

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

GEMINI_API_KEY=
```

### 3. Start the development server

```bash
npm run dev
```

Open the application at:

```text
http://localhost:3000
```

## Available Scripts

### Development

```bash
npm run dev
```

Starts the local development server.

### Production build

```bash
npm run build
```

Creates a production build and checks that the application compiles successfully.

### Production server

```bash
npm run start
```

Starts the production build.

### Lint

```bash
npm run lint
```

Runs the configured code-quality checks.

## Application Structure

```text
public/
src/
  app/
    api/
    admin/
    traveller/
    trip-comparison/
  ai/
  context/
  data/
  firebase/
  logic/
  shared/
```

### Main folders

- `src/app` — application routes and pages
- `src/app/api` — internal API routes
- `src/app/admin` — Admin pages
- `src/app/traveller` — Traveller pages
- `src/app/trip-comparison` — trip comparison feature
- `src/firebase` — Firebase configuration and services
- `src/data` — shared travel datasets
- `src/logic` — cost, budget and recommendation calculations
- `src/ai` — AI request functions
- `src/shared` — shared layouts, navigation and styles
- `src/context` — shared React state

## Data and Application Logic

Travel cost calculations and destination ranking are handled by JavaScript logic.

Google Gemini is used for:

- recommendation explanations;
- budget advice;
- itinerary generation;
- itinerary refinement.

AI is not used to calculate prices or recommendation scores.

## Firebase Data

The main Firestore collections are:

```text
users
savedTrips
adminSettings
aiLogs
```

The `adminSettings` collection stores the Cost Settings and Recommendation Rules configuration.

## Security

- Keep `.env.local` outside version control.
- Do not expose `GEMINI_API_KEY` in client-side code.
- Do not store user passwords in Firestore.
- Keep Firebase access controlled through Authentication and Firestore Security Rules.

## Project Name

```text
qho635-ai-travel-planner
```
