"use client";
import { useState } from 'react';
import { Flame, Dumbbell, ListChecks, Rocket, ArrowRight, ArrowLeft } from 'lucide-react';
import { IconBadge } from '@/components/ui/kit';
import { useDialog } from '@/components/ui/useDialog';

// Four short slides — the rest of the app explains itself where it's used.
const STEPS = [
  { title: "Welcome to IGNITE", icon: Flame, tone: "sky", desc: "You have been chosen as a Player. Every real action — a workout, a meal, a habit — earns XP, Gold and stats. Level up for real." },
  { title: "Your Daily Quest", icon: ListChecks, tone: "teal", desc: "Push-ups, sit-ups, squats and a run, scaled to your level and fully editable. Clear it before midnight for XP, Gold and Ability Points — miss it and tomorrow starts in the Penalty Zone. Level up, then pass a Rank Assessment to rise from E-Rank." },
  { title: "Train and eat well", icon: Dumbbell, tone: "orange", desc: "Pick a ready-made workout or a Gate, with step-by-step guides for every exercise. Log food from 118 Indian dishes or scan a meal with the AI camera, and get meal plans that hit your protein, carbs and fat." },
  { title: "You're ready", icon: Rocket, tone: "sky", desc: "Your AI Coach knows your rank, stats and quests — ask it anything. Start small: one workout, one meal logged, one quest cleared." },
];

export default function OnboardingTutorial({ onComplete }) {
  const [step, setStep] = useState(0);
  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;
  // Escape skips the tutorial; focus stays inside it.
  const ref = useDialog({ onClose: onComplete });

  return (
    <div ref={ref} className="fixed inset-0 flex flex-col overflow-hidden" style={{ zIndex: 99999, background: "var(--bg)" }} role="dialog" aria-modal="true" aria-label="App tutorial">
      {/* Progress */}
      <div className="flex gap-1 justify-center shrink-0 px-5 pt-5" aria-hidden="true">
        {STEPS.map((_, i) => (
          <div key={i} style={{ width: i === step ? 24 : 8, height: 4, borderRadius: 999, background: i <= step ? "var(--accent)" : "var(--track)", transition: "width .3s, background .3s" }} />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 overflow-y-auto">
        <div className="card w-full text-center fade-in" key={step} style={{ maxWidth: 420, padding: "32px 22px" }} aria-live="polite">
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
        <div className="flex gap-2">
          {step > 0 && (
            <button type="button" className="bg" onClick={() => setStep(step - 1)} style={{ padding: "14px 18px", fontSize: 15 }}>
              <ArrowLeft size={17} /> Back
            </button>
          )}
          <button type="button" className="bp flex-1" data-autofocus onClick={() => isLast ? onComplete() : setStep(step + 1)}
            style={{ padding: "14px 20px", fontSize: 15 }}>
            {isLast ? "Start my journey" : "Next"} <ArrowRight size={17} />
          </button>
        </div>
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
