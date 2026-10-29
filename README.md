# 🔥 IGNITE — Arise, Player

A self-improvement app built like **the System from Solo Leveling**: real workouts, meals, habits and focus sessions earn XP, Gold and stats; a Daily Quest waits every day; Hunter ranks are earned through real Rank Assessments.
Built with **Next.js 16 (App Router)**, **React 19**, **Zustand**, **Tailwind CSS v4** and **Firebase** (Auth + Firestore), with AI features powered by **Groq** and **Gemini**.

## Features

| Area | What it does |
|------|--------------|
| **Home** | Greeting, level ring, Daily Quest checklist and stats at a glance — the Status Window: level, Hunter rank, job, title, XP, Gold, and five stats — STR, AGI, VIT, INT, PER — earned from your real activity, plus Ability Points (+3 per level) to allocate |
| **Quests** | The System's **Daily Quest** (push-ups, sit-ups, squats, run — scaled to your level, fully editable, resets at midnight), the **Penalty Zone** (a missed Daily Quest means a 5-minute survival workout; XP is halved until it's cleared — nothing is ever taken away), **Rank Assessments** (E → D → C → B → A → S → National Level), habits and long-term missions |
| **Items** (inventory & shop) | Spend Gold on System items (Streak Shield, XP Potion, Penalty Pardon, Random Box, Stat Reset Scroll) or on real-life rewards you define yourself; achievements and titles |
| **Gates & Dungeons** | Three new Gates every day (one below your rank, one at it, and a Red Gate above it that needs a Gate Key): themed dungeon workouts — Goblin Den, Ant Island, Demon Castle… — with waves and a boss round. Clear 60% of the sets for XP, Gold and loot |
| **Skills & Titles** | Skills unlock from your stats (e.g. Bloodlust at STR 20: +10% workout XP); titles are earned from feats (“Wolf Slayer”, “One Who Overcame Adversity”…) and the equipped one grants a bonus |
| **Shadow Army** | Keep a habit for 14 days and ARISE it as a shadow (Igris, Iron, Tank…). Shadows rank up with your best streak — Soldier → Knight → Elite Knight → Commander → Marshal → Grand Marshal — add an XP bonus while active, and go dormant when the habit breaks |
| **Job Change** | At Level 40, a 7-day Job Change Quest; then choose Fighter, Assassin, Tank, Mage-Scholar or Ranger-Monk — or the hidden Shadow Monarch class |
| **Training** | Visual demo for **every** exercise (start/end photos or an animated athlete), 900+ exercise library, workout player with set/weight logging, rest timer and PR detection, muscle-recovery map, 22 programs (strength, combat, running, yoga, HIIT, mind), custom workouts, AI workout builder, progress analytics |
| **Nutrition** | Food log with 190+ Indian/global foods, AI photo & text food scanner, water tracker, macro targets, meal plans & shopping list |
| **AI Coach** | Streaming AI coach that speaks in the System's voice, 4 specialties; knows your rank, stats and quest status; can log food from chat |
| **Life** | Missions (to-dos), focus timer (Pomodoro), wellness journal, finance tracker, daily routine |
| **Body Progress** | Progress photos and body measurements, year heatmap, data export |
| **Social** | Friends, feed, leaderboard with Hunter ranks |

Works on phones (bottom navigation, installable PWA) and desktop (sidebar), in dark or light mode.

## Design

The UI uses the **"B6" design**: calm soft-dark cards (with a matching light version), one colourful gradient "hero" card per screen, pill buttons, Plus Jakarta Sans, and lucide line icons. The holographic blue Solo Leveling windows appear only for special moments (level-up, rank-up, quest complete, ARISE, penalty, awakening).

- Colours, radii and tones are CSS tokens in `src/app/globals.css` (`:root` = dark, `[data-theme="light"]` = light).
- Shared building blocks live in `src/components/ui/kit.jsx` (Card, Ring, Bar, Tabs, ListRow, Tile, Check, IconBadge, Pill, EmptyState) and icons in `src/components/ui/icons.js`.
- Pages use tokens instead of hard-coded colours, so every screen works in both themes.

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
| `GROQ_API_KEY` | for AI coach / workout generator (also a food-scan backup) | Server-side only |
| `GEMINI_API_KEY` | for food scanner | Server-side only — free key at aistudio.google.com |
| `OPENROUTER_API_KEY` | optional | Extra free food-scan backup (OpenRouter `:free` vision models) |
| `GROQ_MODEL` | optional | Override the chat model (default `openai/gpt-oss-120b`, falls back automatically) |
| `GEMINI_MODEL` | optional | Override the food model; comma-separate several (falls back automatically) |
| `GROQ_VISION_MODEL`, `OPENROUTER_MODEL` | optional | Override the backup food models |

The food scanner tries Gemini Flash → Gemini Flash-Lite → Groq vision → OpenRouter, so one free quota running out doesn't stop it. Typed meals are matched against the built-in food list first, results are cached on the device, and packaged foods can be scanned by barcode (Open Food Facts, free, no key). AI routes need a signed-in user and have per-user limits.

If the Firebase variables are missing the app shows a "Setup needed" screen instead of crashing.
On **Vercel**, add the same variables under *Project → Settings → Environment Variables*; every push to the deployed branch redeploys automatically.

### Firebase setup

1. Enable **Authentication** → Email/Password and Google providers. Add your domain under *Authorized domains*.
2. Create a **Firestore** database and publish the rules in [`firestore.rules`](firestore.rules): either Firebase console → Firestore → Rules → paste → **Publish**, or `npx firebase-tools deploy --only firestore:rules --project <your-project-id>`. Publish them again whenever `firestore.rules` changes — the Social page depends on them.

## Scripts

| Command | |
|---------|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |

## Exercise visuals

Every exercise in the app has a visual demonstration:

1. **Photo demos** — start/end photos from [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (public domain / Unlicense), crossfaded to show the movement. The exercises used by the app's workouts are matched in `src/data/exerciseVisualMap.json` and their photos are bundled in `public/exercises/` (so they load fast and work offline). The full 870+ exercise catalog lives in `public/data/exercise-catalog.json`; its remaining photos load from GitHub at a pinned commit.
2. **Animated figure** — `src/components/training/MoveFigure.jsx` draws an animated athlete for ~60 movement patterns (`figurePatterns.js`), used for combat drills, yoga, running and anything without a photo (including AI-generated exercises).

To rebuild the bundled photos and catalog after changing the map:

```bash
pip install pillow
python3 scripts/build_exercise_assets.py
```

## How data is stored

```
users/{uid}                     profile, XP, streak, settings, `system` (rank, stats allocation, Gold, inventory, quest log)
users/{uid}/workouts/{date}     one document per day   (also foodLog, journal, xpLog, focusLog, habitLog)
users/{uid}/chatHistory/current Flame Oracle chats (capped)
users/{uid}/finances/ledger     transactions
users/{uid}/activityLog/recent  last 200 activity entries
users/{uid}/bodyPhotos/{date}   progress photos (one per document)
users/{uid}/bodyData/photos     body-tracker snapshots (size-capped)
(programState on the main doc holds the active program, weekly goal and saved custom workouts)
publicProfiles/{uid}            what friends can see (social)
```

Changes are saved automatically (debounced) and **only changed documents are written**. Firestore's offline cache keeps the app usable without a connection and syncs when you're back online. The header shows the sync status.

All day-based data uses the user's **local** calendar date.

## Project layout

```
src/app/            Next.js entry (layout, page) and API routes (chat, food-scan, generate-workout)
src/components/     App shell (App.jsx, BottomNav.jsx) and every page
src/components/training/  Training hub pieces: MoveFigure, BodyMap, ExerciseDemo, library, programs, progress
src/stores/         Zustand store — loading, auto-save, XP, streak logic
src/store-v2.js     Firestore read/write layer
src/lib/            Firebase init, AI helpers, workout helpers
src/lib/system/     The System: ranks & assessments, stats, Daily Quest, Gates, skills/titles/jobs/shadows (progression.js), shop, actions
src/components/system/  Status window, Quests, Inventory & Shop, [SYSTEM] notifications, Awakening
src/data/           Food database, exercises, programs, gamification data
public/             PWA manifest, service worker, icons
```
