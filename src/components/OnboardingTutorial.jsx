import { useState } from 'react';

const STEPS = [
  { title: "Welcome to IGNITE", icon: "🔥", desc: "Your life is now an RPG. Every action earns XP. Train, eat right, build habits — and level up for real.", bg: "linear-gradient(135deg,#10b981,#06b6d4)" },
  { title: "Training", icon: "⚔️", desc: "Generate smart workouts for 9 activity types — Gym, Boxing, HIIT, Yoga, MMA and more. Each exercise has step-by-step guides so you know exactly what to do.", bg: "linear-gradient(135deg,#10b981,#22c55e)" },
  { title: "Nutrition", icon: "🍎", desc: "Log food from 194 Indian dishes. Scan food with AI camera. Get personalized diet plans. Track macros — protein, carbs, fat, fiber.", bg: "linear-gradient(135deg,#f59e0b,#f97316)" },
  { title: "Daily Quests", icon: "🎯", desc: "Set personal daily goals — drink water, read, meditate, save money. Complete your training quest every day or lose XP!", bg: "linear-gradient(135deg,#ef4444,#f97316)" },
  { title: "My Day", icon: "📅", desc: "Plan your entire day with time blocks. Choose from 3 templates or build your own. Mark done as you go.", bg: "linear-gradient(135deg,#f97316,#f59e0b)" },
  { title: "Focus Timer", icon: "⏱", desc: "Deep focus sessions with tags. Track your productive hours. See weekly stats.", bg: "linear-gradient(135deg,#06b6d4,#3b82f6)" },
  { title: "Wellness", icon: "💛", desc: "Track mood, write gratitude, journal your thoughts. See your 14-day mood trend. Take care of your mind.", bg: "linear-gradient(135deg,#8b5cf6,#a78bfa)" },
  { title: "Flame Oracle", icon: "🔮", desc: "Your AI assistant. Say 'I ate rice' and it logs nutrition. Say 'plan my workout' and it creates one. It controls the entire app for you.", bg: "linear-gradient(135deg,#ec4899,#8b5cf6)" },
  { title: "Level Up System", icon: "⚡", desc: "15 ranks from Cinder to Absolute. 40 achievement badges. Infinite leveling. Your only competition is yesterday.", bg: "linear-gradient(135deg,#fbbf24,#f59e0b)" },
  { title: "You're Ready", icon: "🚀", desc: "Start your journey. One workout. One meal logged. One quest completed. That's all it takes to begin.", bg: "linear-gradient(135deg,#10b981,#06b6d4)" },
];

export default function OnboardingTutorial({ onComplete }) {
  const [step, setStep] = useState(0);
  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: "#07090d", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Progress dots */}
      <div style={{ display: "flex", gap: 4, justifyContent: "center", padding: "20px 20px 0", flexShrink: 0 }}>
        {STEPS.map((_, i) => (
          <div key={i} style={{ width: i === step ? 24 : 8, height: 4, borderRadius: 2, background: i <= step ? "#10b981" : "rgba(255,255,255,.08)", transition: "all .3s" }} />
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 30px", textAlign: "center" }}>
        <div className="fade-in" key={step} style={{ maxWidth: 400 }}>
          {/* Icon */}
          <div style={{ width: 100, height: 100, borderRadius: 28, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, margin: "0 auto 24px", boxShadow: "0 12px 40px rgba(16,185,129,.15)" }}>
            {s.icon}
          </div>

          <h2 style={{ fontSize: 28, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", letterSpacing: 1, marginBottom: 12 }}>{s.title}</h2>
          <p style={{ fontSize: 16, color: "#9ca3af", lineHeight: 1.7 }}>{s.desc}</p>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ padding: "0 30px 40px", flexShrink: 0 }}>
        <button className="bp" onClick={() => isLast ? onComplete() : setStep(step + 1)}
          style={{ width: "100%", padding: 18, fontSize: 17, letterSpacing: 1, background: s.bg, boxShadow: "none" }}>
          {isLast ? "START MY JOURNEY" : "Next"}
        </button>
        {!isLast && (
          <button onClick={onComplete}
            style={{ width: "100%", marginTop: 10, padding: 12, background: "transparent", border: "none", color: "#4b5563", fontSize: 13, cursor: "pointer" }}>
            Skip Tutorial
          </button>
        )}
      </div>
    </div>
  );
}
