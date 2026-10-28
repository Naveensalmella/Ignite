"use client";
import { useState } from 'react';
import { Flame, Dumbbell, Apple, ListChecks, CalendarDays, Timer, Heart, MessageCircle, Shield, Rocket, ArrowRight } from 'lucide-react';
import { IconBadge } from '@/components/ui/kit';

const STEPS = [
  { title: "Welcome to IGNITE", icon: Flame, tone: "sky", desc: "You have been chosen as a Player. Every real action earns XP, Gold and stats. Train, eat right, build habits — and level up for real." },
  { title: "Training", icon: Dumbbell, tone: "orange", desc: "Generate smart workouts for 9 activity types — Gym, Boxing, HIIT, Yoga, MMA and more. Each exercise has step-by-step guides so you know exactly what to do." },
  { title: "Nutrition", icon: Apple, tone: "lime", desc: "Log food from 194 Indian dishes. Scan food with the AI camera. Get personalised diet plans. Track protein, carbs, fat and fibre." },
  { title: "Daily Quest", icon: ListChecks, tone: "teal", desc: "Push-ups, sit-ups, squats and a run — scaled to your level and fully editable. Clear it before midnight for XP, Gold and Ability Points. Miss it and tomorrow starts in the Penalty Zone." },
  { title: "My Day", icon: CalendarDays, tone: "teal", desc: "Plan your whole day with time blocks. Choose from 3 templates or build your own. Mark blocks done as you go." },
  { title: "Focus Timer", icon: Timer, tone: "violet", desc: "Deep focus sessions with tags. Track your productive hours and see weekly stats." },
  { title: "Wellness", icon: Heart, tone: "rose", desc: "Track mood, write gratitude and journal your thoughts. See your 14-day mood trend." },
  { title: "AI Coach", icon: MessageCircle, tone: "sky", desc: "Your AI guide, speaking as the System. Say 'I ate rice' and it logs nutrition. Ask it to plan a workout. It knows your rank, stats and quests." },
  { title: "Hunter Ranks", icon: Shield, tone: "amber", desc: "Rise from E-Rank to National Level. Reach the level, then pass a real Rank Assessment to be promoted. Spend Ability Points on STR, AGI, VIT, INT and PER." },
  { title: "You're ready", icon: Rocket, tone: "sky", desc: "Start your journey. One workout. One meal logged. One quest completed. That's all it takes to begin." },
];

export default function OnboardingTutorial({ onComplete }) {
  const [step, setStep] = useState(0);
  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ zIndex: 99999, background: "var(--bg)" }} role="dialog" aria-modal="true" aria-label="App tutorial">
      {/* Progress */}
      <div className="flex gap-1 justify-center shrink-0 px-5 pt-5" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
        {STEPS.map((_, i) => (
          <div key={i} style={{ width: i === step ? 24 : 8, height: 4, borderRadius: 999, background: i <= step ? "var(--accent)" : "var(--track)", transition: "width .3s, background .3s" }} />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 overflow-y-auto">
        <div className="card w-full text-center fade-in" key={step} style={{ maxWidth: 420, padding: "32px 22px" }}>
          <div className="flex justify-center mb-5">
            {isLast ? (
              <span className="flex items-center justify-center" style={{ width: 84, height: 84, borderRadius: 26, background: "var(--hero-gradient)", color: "#fff", boxShadow: "0 12px 28px rgba(37, 99, 235, .28)" }} aria-hidden="true">
                <s.icon size={40} strokeWidth={2} />
              </span>
            ) : (
              <IconBadge icon={s.icon} tone={s.tone} size={84} />
            )}
          </div>
          <div className="text-[12px] font-semibold mb-1" style={{ color: "var(--text-dim)" }}>{step + 1} of {STEPS.length}</div>
          <h2 className="text-[22px] font-extrabold mb-3" style={{ color: "var(--text-primary)", letterSpacing: "-.01em" }}>{s.title}</h2>
          <p className="text-[14.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{s.desc}</p>
        </div>
      </div>

      {/* Buttons */}
      <div className="shrink-0 w-full mx-auto px-4 pb-8" style={{ maxWidth: 420 }}>
        <button type="button" className="bp w-full" onClick={() => isLast ? onComplete() : setStep(step + 1)}
          style={{ padding: "14px 20px", fontSize: 15 }}>
          {isLast ? "Start my journey" : "Next"} <ArrowRight size={17} />
        </button>
        {!isLast && (
          <button type="button" onClick={onComplete} className="w-full mt-2 text-[13px] font-medium"
            style={{ minHeight: 40, background: "transparent", border: "none", color: "var(--text-dim)" }}>
            Skip tutorial
          </button>
        )}
      </div>
    </div>
  );
}
