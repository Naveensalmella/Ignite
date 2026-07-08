# 🔥 IGNITE — Level Up Your Life

A gamified self-improvement platform with bodyweight training, combat skills, RPG leveling, and habit tracking.

## Features
- ⚔️ **6-Gate Training System** — Progressive bodyweight + combat workouts
- 🎯 **Daily Quests** — Mandatory habits with XP penalties for skipping
- 📈 **RPG Leveling** — 100 levels, 10 ranks (Spark → Eternal)
- 🌱 **Growth Missions** — Mental, Emotional, Spiritual, Financial progression
- 🔮 **AI Coach** — Powered by Claude (requires Anthropic API)
- 💰 **Finance Tracker** — Income, expenses, budget
- 📊 **BMI Calculator** — Track body composition
- 🔥 **Streak System** — Up to 3× XP multiplier for consistency

## Quick Start

```bash
npm install
npm start
```

## Deploy to Vercel

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Deploy — that's it!

## File Structure

```
src/
├── App.jsx              — Main app (routing, state, auth)
├── data.js              — Food database, exercises, ranks, gates
├── store.js             — Storage (localStorage + Claude fallback)
├── styles.css           — Full CSS theme
├── utils.js             — Leveling math, BMI, helpers
├── index.js             — Entry point
└── components/
    ├── AuthPage.jsx     — Email signup/login
    ├── Dashboard.jsx    — Level, stats, gate progress
    ├── TrainingPage.jsx — Workout sessions with exercises
    ├── ExerciseDetail.jsx — Expandable exercise instructions
    ├── Nutrition.jsx    — Food logging
    ├── DailyQuestPage.jsx — Mandatory daily habits
    ├── MissionsPage.jsx — User-created tasks
    ├── FocusTimer.jsx   — Pomodoro timer
    ├── Wellness.jsx     — Mood, journal, gratitude
    ├── FinancePage.jsx  — Income/expense tracking
    ├── GrowthPage.jsx   — Mind/Heart/Spirit/Fortune missions
    ├── AIChat.jsx       — AI coach (Claude API)
    ├── ProfilePage.jsx  — Profile, BMI, activity log
    ├── XPToast.jsx      — Floating XP notifications
    ├── LevelUpOverlay.jsx — Level up celebration
    └── HeaderXPBar.jsx  — XP bar in header
```

## Tech Stack
- React 18
- CSS (no frameworks)
- localStorage for data persistence
- Anthropic Claude API for AI features
