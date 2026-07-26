# IGNITE v3.0 — Next.js Setup Guide

## Step 1: Create Next.js Project (run in your Desktop folder)
```
cd C:\Users\Dell\OneDrive\Desktop\Self improvement website
npx create-next-app@latest ignite-v3 --typescript --tailwind --eslint --app --src-dir
```

When prompted:
- TypeScript: YES
- ESLint: YES  
- Tailwind CSS: YES
- `src/` directory: YES
- App Router: YES
- Import alias: YES (default @/)

## Step 2: Install Dependencies
```
cd ignite-v3
npm install firebase framer-motion howler recharts lucide-react
npm install @dnd-kit/core @dnd-kit/sortable
```

## Step 3: Copy Environment Variables
Create `.env.local` with same variables as before, PLUS:
```
# Keep existing Firebase vars
REACT_APP_FIREBASE_API_KEY=...
(all 6 Firebase vars)

# NEW: Server-side only (no REACT_APP_ prefix = hidden from browser)
GROQ_API_KEY=gsk_your_key
GEMINI_API_KEY=your_key

# Keep old ones for backward compat during migration
REACT_APP_GROQ_API_KEY=gsk_your_key
```

## Step 4: Copy Component Files
Copy all files from `elevate/src/components/` to `ignite-v3/src/components/`
Copy all files from `elevate/src/data/` to `ignite-v3/src/data/`
Add "use client"; at the top of EVERY component file.

## Step 5: Run
```
npm run dev
```
Opens at http://localhost:3000

## Step 6: Test, then push to dev
```
git init
git remote add origin https://github.com/Naveensalmella/Ignite.git
git checkout -b v3
git add .
git commit -m "IGNITE v3.0 - Next.js migration"
git push origin v3
```
