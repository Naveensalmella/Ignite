# 🔥 IGNITE — Level Up Your Life

A gamified self-improvement app: train, eat well, build habits, focus, journal — and earn XP, ranks and streaks for it.
Built with **Next.js 16 (App Router)**, **React 19**, **Zustand**, **Tailwind CSS v4** and **Firebase** (Auth + Firestore), with AI features powered by **Groq** and **Gemini**.

## Features

| Area | What it does |
|------|--------------|
| **Dashboard** | Level, streak, today's score, "next step" suggestion, daily login bonus, weekly report |
| **Training** | Guided workout player (warm-up → exercises → rest → cool-down), challenges, gym & combat programs, AI workout generator, body-focus workouts, history |
| **Nutrition** | Food log with 190+ Indian/global foods, AI photo & text food scanner, water tracker, macro targets, meal plans & shopping list |
| **Flame Oracle** | Streaming AI coach with 4 modes; can log food from chat |
| **Habits & life** | Daily quests, missions (to-dos), focus timer (Pomodoro), wellness journal, finance tracker, daily routine, growth missions |
| **Progress** | Body stats, progress photos, year heatmap, data export |
| **Social & gaming** | Friends, feed, group challenges, XP sources, quest chains, titles |

Works on phones (bottom navigation, installable PWA) and desktop (sidebar), in dark or light mode.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

### Environment variables

| Variable | Required | Used for |
|----------|----------|----------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | ✅ | Firebase web config |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | ✅ | Firebase web config |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ✅ | Firebase web config |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | | Firebase web config |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | | Firebase web config |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | ✅ | Firebase web config |
| `GROQ_API_KEY` | for AI coach / workout generator | Server-side only |
| `GEMINI_API_KEY` | for food scanner | Server-side only |
| `GROQ_MODEL` | optional | Override the chat model (default `openai/gpt-oss-120b`, falls back automatically) |
| `GEMINI_MODEL` | optional | Override the vision model (falls back automatically if a model is retired) |
| `EXERCISEDB_API_KEY` | optional | `/api/exercises` proxy |

If the Firebase variables are missing the app shows a "Setup needed" screen instead of crashing.
On **Vercel**, add the same variables under *Project → Settings → Environment Variables*; every push to the deployed branch redeploys automatically.

### Firebase setup

1. Enable **Authentication** → Email/Password and Google providers. Add your domain under *Authorized domains*.
2. Create a **Firestore** database and deploy the rules in [`firestore.rules`](firestore.rules) (Firestore → Rules → paste → Publish).

## Scripts

| Command | |
|---------|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |

## How data is stored

```
users/{uid}                     profile, XP, streak, settings (small)
users/{uid}/workouts/{date}     one document per day   (also foodLog, journal, xpLog, focusLog, habitLog)
users/{uid}/chatHistory/current Flame Oracle chats (capped)
users/{uid}/finances/ledger     transactions
users/{uid}/activityLog/recent  last 200 activity entries
users/{uid}/bodyPhotos/{date}   progress photos (one per document)
users/{uid}/bodyData/photos     body-tracker snapshots (size-capped)
publicProfiles/{uid}            what friends can see (social)
```

Changes are saved automatically (debounced) and **only changed documents are written**. Firestore's offline cache keeps the app usable without a connection and syncs when you're back online. The header shows the sync status.

All day-based data uses the user's **local** calendar date.

## Project layout

```
src/app/            Next.js entry (layout, page) and API routes (chat, food-scan, generate-workout, exercise-gif)
src/components/     App shell (App.jsx, BottomNav.jsx) and every page
src/stores/         Zustand store — loading, auto-save, XP, streak logic
src/store-v2.js     Firestore read/write layer
src/lib/            Firebase init, AI helpers, workout helpers
src/data/           Food database, exercises, programs, gamification data
public/             PWA manifest, service worker, icons
```
