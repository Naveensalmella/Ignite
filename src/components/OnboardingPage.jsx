"use client";
import { useState } from 'react';
import {
  Flame, Dumbbell, HeartPulse, Swords, Flower2, Sprout, Zap, PersonStanding, Footprints, Shuffle,
  HandFist, Wind, Medal, Ban, Mars, Venus, VenusAndMars, UserRound, Check, ArrowLeft, ArrowRight, CircleAlert,
} from 'lucide-react';
import { IconBadge } from '@/components/ui/kit';
import { getRank, today } from '@/utils';

const GOALS = [
  { id: "lose", icon: Flame, tone: "orange", label: "Lose Fat", desc: "Burn fat, get lean and defined" },
  { id: "muscle", icon: Dumbbell, tone: "sky", label: "Build Muscle", desc: "Gain strength and muscle mass" },
  { id: "fit", icon: HeartPulse, tone: "rose", label: "Get Fit", desc: "Overall health and endurance" },
  { id: "fight", icon: Swords, tone: "violet", label: "Learn Fighting", desc: "Master combat techniques" },
  { id: "flex", icon: Flower2, tone: "teal", label: "Flexibility & Balance", desc: "Mobility, recovery, and body control" },
];

const FITNESS_LEVELS = [
  { id: "beginner", icon: Sprout, tone: "lime", label: "Beginner", desc: "New to fitness or returning after a long break", multiplier: 0.6 },
  { id: "intermediate", icon: Zap, tone: "sky", label: "Intermediate", desc: "Been training for 3-12 months consistently", multiplier: 1.0 },
  { id: "advanced", icon: Flame, tone: "orange", label: "Advanced", desc: "2+ years of serious training", multiplier: 1.4 },
];

const TRAINING_TYPES = [
  { id: "bodyweight", icon: PersonStanding, tone: "teal", label: "Bodyweight", desc: "No equipment needed — train anywhere" },
  { id: "gym", icon: Dumbbell, tone: "sky", label: "Gym", desc: "Weights, machines, and barbells" },
  { id: "cardio", icon: Footprints, tone: "rose", label: "Cardio Focus", desc: "Running, HIIT, endurance training" },
  { id: "mixed", icon: Shuffle, tone: "violet", label: "Mixed", desc: "Combine everything for maximum results" },
];

const FIGHTING_STYLES = [
  { id: "boxing", icon: HandFist, tone: "rose", label: "Boxing", desc: "Jabs, crosses, hooks, footwork" },
  { id: "kickboxing", icon: Wind, tone: "orange", label: "Kickboxing", desc: "Punches + powerful kicks" },
  { id: "mma", icon: Swords, tone: "violet", label: "MMA", desc: "Strikes, clinch, ground basics" },
  { id: "martial_arts", icon: Medal, tone: "amber", label: "Martial Arts", desc: "Traditional techniques and forms" },
  { id: "none", icon: Ban, tone: "sky", label: "Not Interested", desc: "Skip combat training" },
];

const TIME_OPTIONS = [
  { id: "15", label: "15 min", desc: "Quick burst" },
  { id: "30", label: "30 min", desc: "Focused session" },
  { id: "45", label: "45 min", desc: "Solid workout" },
  { id: "60", label: "60 min", desc: "Full training" },
  { id: "90", label: "90+ min", desc: "Beast mode" },
];

const BODY_PARTS = [
  { id: "chest", label: "Chest" },
  { id: "back", label: "Back" },
  { id: "shoulders", label: "Shoulders" },
  { id: "arms", label: "Arms" },
  { id: "core", label: "Core / Abs" },
  { id: "legs", label: "Legs" },
  { id: "glutes", label: "Glutes" },
  { id: "full", label: "Full Body" },
];

const GENDERS = [
  { id: "male", icon: Mars, label: "Male" },
  { id: "female", icon: Venus, label: "Female" },
  { id: "other", icon: VenusAndMars, label: "Other" },
];

// Sane bounds so typos like "0", "-5" or "1750" can't produce a broken BMI/calorie target
const inRange = (v, min, max) => { const n = parseFloat(v); return Number.isFinite(n) && n >= min && n <= max; };
const BOUNDS = { age: [10, 100], weight: [25, 300], height: [100, 250] };

export default function OnboardingPage({ onComplete = () => { }, initialName = "" }) {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState({
    name: initialName, age: "", gender: "", weight: "", height: "",
    goal: "", fitnessLevel: "", trainingType: "",
    fightingStyle: "", dailyTime: "45", focusAreas: ["full"],
  });

  const totalSteps = 6;
  const update = (key, val) => setData(p => ({ ...p, [key]: val }));
  const toggleFocus = (id) => {
    setData(p => {
      let areas = [...p.focusAreas];
      if (id === "full") return { ...p, focusAreas: ["full"] };
      areas = areas.filter(a => a !== "full");
      if (areas.includes(id)) areas = areas.filter(a => a !== id);
      else areas.push(id);
      if (areas.length === 0) areas = ["full"];
      return { ...p, focusAreas: areas };
    });
  };

  const canNext = () => {
    if (step === 0) return data.name.trim().length >= 2;
    if (step === 1) return !!data.gender && inRange(data.age, ...BOUNDS.age) && inRange(data.weight, ...BOUNDS.weight) && inRange(data.height, ...BOUNDS.height);
    if (step === 2) return data.goal && data.fitnessLevel;
    if (step === 3) return data.trainingType && data.fightingStyle;
    if (step === 4) return data.dailyTime && data.focusAreas.length > 0;
    return !submitting;
  };

  const finish = async () => {
    if (submitting) return;
    setSubmitting(true); setError("");
    try {
      await onComplete({
        name: data.name.trim(),
        age: data.age,
        gender: data.gender,
        weight: data.weight,
        height: data.height,
        goal: data.goal,
        fitnessLevel: data.fitnessLevel,
        trainingType: data.trainingType,
        fightingStyle: data.fightingStyle,
        dailyTime: data.dailyTime,
        focusAreas: data.focusAreas,
        nutritionGoal: data.goal === "lose" ? "lose" : data.goal === "muscle" ? "gain" : "maintain",
        activityLevel: data.fitnessLevel === "beginner" ? "1.375" : data.fitnessLevel === "advanced" ? "1.725" : "1.55",
        onboardingComplete: true,
        joined: today(),
      });
    } catch (e) {
      // Save failed — surface it and re-enable the button instead of failing silently
      console.error("Onboarding save error:", e);
      setError("Couldn't save your profile. Check your connection and try again.");
      setSubmitting(false);
    }
  };

  const stepTitles = ["Your name", "Body & stats", "Goal & level", "Training style", "Time & focus", "Summary"];

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-8" style={{ background: "var(--bg)" }}>
      <div className="w-full flex flex-col gap-4" style={{ maxWidth: 520 }}>

        {/* Brand + progress */}
        <div className="text-center">
          <div className="text-accent-grad text-[24px] font-extrabold" style={{ letterSpacing: 4 }}>IGNITE</div>
          <div className="text-[12.5px] mt-0.5" style={{ color: "var(--text-dim)" }}>Step {step + 1} of {totalSteps} · {stepTitles[step]}</div>
        </div>
        <div className="flex gap-1" aria-hidden="true">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div key={i} className="flex-1" style={{ height: 4, borderRadius: 999, background: i <= step ? "var(--accent)" : "var(--track)", transition: "background .3s" }} />
          ))}
        </div>

        {/* ═══ STEP 0: Welcome + Name ═══ */}
        {step === 0 && (
          <div className="card fade-in text-center" style={{ padding: 22 }}>
            <div className="flex justify-center mb-3"><IconBadge icon={UserRound} tone="sky" size={56} /></div>
            <StepHead title="Build your Hunter profile" sub="We'll set up your training from your body, goals and style. This takes 2 minutes." center />
            <div className="text-left mt-5">
              <label htmlFor="ob-name" className="block text-[12.5px] font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>What should we call you?</label>
              <input id="ob-name" className="inp" placeholder="Your name" value={data.name} onChange={e => update("name", e.target.value)}
                style={{ fontSize: 17, textAlign: "center", padding: 14 }} autoFocus />
            </div>
          </div>
        )}

        {/* ═══ STEP 1: Body Stats ═══ */}
        {step === 1 && (
          <div className="card fade-in" style={{ padding: 22 }}>
            <StepHead title="Body & stats" sub="This helps calculate your BMI, calorie needs and training intensity." />

            <div className="grid grid-cols-2 gap-3 mt-4 mb-3">
              <NumField id="ob-age" label="Age" placeholder="e.g. 22" value={data.age} onChange={v => update("age", v)} />
              <NumField id="ob-weight" label="Weight (kg)" placeholder="e.g. 70" value={data.weight} onChange={v => update("weight", v)} />
            </div>
            <div className="mb-4">
              <NumField id="ob-height" label="Height (cm)" placeholder="e.g. 175" value={data.height} onChange={v => update("height", v)} />
            </div>

            <SectionLabel>Gender</SectionLabel>
            <div className="grid grid-cols-3 gap-2">
              {GENDERS.map(g => (
                <OptionTile key={g.id} selected={data.gender === g.id} onClick={() => update("gender", g.id)} icon={g.icon} label={g.label} />
              ))}
            </div>

            {/* Step 1 validation hint */}
            {!canNext() && (data.age || data.weight || data.height) && (
              <div className="text-[12.5px] mt-4 px-3 py-2.5 rounded-xl" style={{ color: "var(--warn)", background: "color-mix(in srgb, var(--warn) 10%, transparent)" }}>
                Enter age {BOUNDS.age[0]}–{BOUNDS.age[1]}, weight {BOUNDS.weight[0]}–{BOUNDS.weight[1]} kg, height {BOUNDS.height[0]}–{BOUNDS.height[1]} cm and pick a gender.
              </div>
            )}
          </div>
        )}

        {/* ═══ STEP 2: Goal + Fitness Level ═══ */}
        {step === 2 && (
          <div className="card fade-in" style={{ padding: 22 }}>
            <StepHead title="Your goal" sub="What are you training for?" />
            <div className="flex flex-col gap-2 mt-4 mb-5">
              {GOALS.map(g => (
                <OptionRow key={g.id} selected={data.goal === g.id} onClick={() => update("goal", g.id)} icon={g.icon} tone={g.tone} label={g.label} desc={g.desc} />
              ))}
            </div>

            <SectionLabel>Current fitness level</SectionLabel>
            <div className="grid grid-cols-3 gap-2">
              {FITNESS_LEVELS.map(fl => (
                <OptionTile key={fl.id} selected={data.fitnessLevel === fl.id} onClick={() => update("fitnessLevel", fl.id)} icon={fl.icon} label={fl.label} desc={fl.desc} />
              ))}
            </div>
          </div>
        )}

        {/* ═══ STEP 3: Training Type + Fighting Style ═══ */}
        {step === 3 && (
          <div className="card fade-in" style={{ padding: 22 }}>
            <StepHead title="Training style" sub="How do you prefer to train?" />
            <div className="grid grid-cols-2 gap-2 mt-4 mb-5">
              {TRAINING_TYPES.map(t => (
                <OptionTile key={t.id} selected={data.trainingType === t.id} onClick={() => update("trainingType", t.id)} icon={t.icon} label={t.label} desc={t.desc} />
              ))}
            </div>

            <SectionLabel>Fighting interest</SectionLabel>
            <div className="flex flex-col gap-2">
              {FIGHTING_STYLES.map(f => (
                <OptionRow key={f.id} selected={data.fightingStyle === f.id} onClick={() => update("fightingStyle", f.id)} icon={f.icon} tone={f.tone} label={f.label} desc={f.desc} />
              ))}
            </div>
          </div>
        )}

        {/* ═══ STEP 4: Time + Focus Areas ═══ */}
        {step === 4 && (
          <div className="card fade-in" style={{ padding: 22 }}>
            <StepHead title="Daily training time" sub="How much time can you train per day?" />
            <div className="grid grid-cols-5 gap-1.5 mt-4 mb-5">
              {TIME_OPTIONS.map(t => {
                const on = data.dailyTime === t.id;
                return (
                  <button key={t.id} type="button" aria-pressed={on} onClick={() => update("dailyTime", t.id)}
                    className="rounded-2xl text-center px-1 py-2.5" style={optionStyle(on)}>
                    <div className="text-[14px] font-extrabold num" style={{ color: on ? "var(--accent)" : "var(--text-primary)" }}>{t.label}</div>
                    <div className="text-[10.5px] mt-0.5 leading-tight" style={{ color: "var(--text-dim)" }}>{t.desc}</div>
                  </button>
                );
              })}
            </div>

            <SectionLabel>Focus areas</SectionLabel>
            <p className="text-[12.5px] -mt-1 mb-3" style={{ color: "var(--text-dim)" }}>Pick the body parts you want to focus on, or Full Body.</p>
            <div className="flex flex-wrap gap-2">
              {BODY_PARTS.map(bp => {
                const on = data.focusAreas.includes(bp.id);
                return (
                  <button key={bp.id} type="button" aria-pressed={on} onClick={() => toggleFocus(bp.id)}
                    className={`chip ${on ? "chip-a" : "chip-i"}`} style={{ minHeight: 36 }}>
                    {on && <Check size={14} strokeWidth={2.6} />}{bp.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ STEP 5: Summary ═══ */}
        {step === 5 && (
          <div className="fade-in flex flex-col gap-3">
            <div className="card hero" style={{ padding: 22 }}>
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center shrink-0 text-[26px] font-extrabold"
                  style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(255, 255, 255, .2)", color: "#fff" }}>
                  {data.name[0]?.toUpperCase() || "I"}
                </div>
                <div className="min-w-0">
                  <div className="text-[12.5px] font-semibold" style={{ color: "var(--text-secondary)" }}>Hunter profile ready</div>
                  <div className="text-[22px] font-extrabold truncate" style={{ color: "var(--text-primary)" }}>{data.name}</div>
                  <div className="mt-1"><span className="pill">Level 1 · {getRank(1).name}</span></div>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: 18 }}>
              <div className="card-head"><div className="card-title">Your setup</div></div>
              <div className="grid grid-cols-2 gap-x-4">
                {[
                  ["Age", `${data.age} years`],
                  ["Gender", GENDERS.find(g => g.id === data.gender)?.label],
                  ["Weight", `${data.weight} kg`],
                  ["Height", `${data.height} cm`],
                  ["Goal", GOALS.find(g => g.id === data.goal)?.label],
                  ["Level", FITNESS_LEVELS.find(f => f.id === data.fitnessLevel)?.label],
                  ["Style", TRAINING_TYPES.find(t => t.id === data.trainingType)?.label],
                  ["Fighting", FIGHTING_STYLES.find(f => f.id === data.fightingStyle)?.label],
                  ["Daily Time", TIME_OPTIONS.find(t => t.id === data.dailyTime)?.label],
                  ["Focus", data.focusAreas.map(a => BODY_PARTS.find(b => b.id === a)?.label).join(", ")],
                ].map(([l, v]) => (
                  <div key={l} className="py-2" style={{ borderBottom: "1px solid var(--line)" }}>
                    <div className="text-[11.5px]" style={{ color: "var(--text-dim)" }}>{l}</div>
                    <div className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div role="alert" className="flex items-center justify-center gap-2 text-[12.5px] px-3 py-2.5 rounded-xl"
            style={{ color: "var(--danger)", background: "color-mix(in srgb, var(--danger) 10%, transparent)" }}>
            <CircleAlert size={15} aria-hidden="true" /> {error}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-2.5">
          {step > 0 && (
            <button type="button" className="bg" onClick={() => setStep(s => s - 1)} disabled={submitting} style={{ padding: "13px 20px" }}>
              <ArrowLeft size={16} /> Back
            </button>
          )}
          <button type="button" className="bp flex-1" onClick={() => { if (step < totalSteps - 1) setStep(s => s + 1); else finish(); }}
            disabled={!canNext()} style={{ padding: "13px 20px", fontSize: 15, cursor: canNext() ? "pointer" : "not-allowed" }}>
            {step === totalSteps - 1 ? (submitting ? "Saving..." : "Begin your journey") : "Next"} {!submitting && <ArrowRight size={17} />}
          </button>
        </div>
      </div>
    </div>
  );
}

const optionStyle = (selected) => ({
  background: selected ? "color-mix(in srgb, var(--accent) 12%, transparent)" : "var(--ghost-bg)",
  border: `1px solid ${selected ? "color-mix(in srgb, var(--accent) 45%, transparent)" : "transparent"}`,
  transition: "background .2s, border-color .2s",
});

function StepHead({ title, sub, center = false }) {
  return (
    <div className={center ? "text-center" : ""}>
      <h2 className="text-[20px] font-extrabold" style={{ color: "var(--text-primary)", letterSpacing: "-.01em" }}>{title}</h2>
      {sub && <p className="text-[13.5px] mt-1" style={{ color: "var(--text-secondary)" }}>{sub}</p>}
    </div>
  );
}

function SectionLabel({ children }) {
  return <div className="text-[14px] font-bold mb-2" style={{ color: "var(--text-primary)" }}>{children}</div>;
}

function NumField({ id, label, placeholder, value, onChange }) {
  return (
    <div>
      <label htmlFor={id} className="block text-[12px] font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>{label}</label>
      <input id={id} className="inp num" type="number" inputMode="decimal" placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)} style={{ textAlign: "center", fontSize: 17, fontWeight: 700 }} />
    </div>
  );
}

/** Selectable list row: icon badge · label/desc · tick. */
function OptionRow({ selected, onClick, icon, tone, label, desc }) {
  return (
    <button type="button" aria-pressed={selected} onClick={onClick}
      className="w-full flex items-center gap-3 text-left rounded-2xl px-3 py-2.5" style={optionStyle(selected)}>
      <IconBadge icon={icon} tone={tone} size={38} />
      <div className="flex-1 min-w-0">
        <div className="text-[14.5px] font-semibold" style={{ color: selected ? "var(--accent)" : "var(--text-primary)" }}>{label}</div>
        <div className="text-[12.5px]" style={{ color: "var(--text-dim)" }}>{desc}</div>
      </div>
      {selected && <span className="flex items-center justify-center shrink-0" style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--accent)", color: "var(--accent-ink)" }}><Check size={13} strokeWidth={3} /></span>}
    </button>
  );
}

/** Selectable square tile: icon · label · optional desc. */
function OptionTile({ selected, onClick, icon: Icon, label, desc }) {
  return (
    <button type="button" aria-pressed={selected} onClick={onClick}
      className="flex flex-col items-center text-center rounded-2xl px-2 py-3" style={optionStyle(selected)}>
      <Icon size={22} strokeWidth={2} style={{ color: selected ? "var(--accent)" : "var(--text-secondary)" }} aria-hidden="true" />
      <div className="text-[13px] font-semibold mt-1.5" style={{ color: selected ? "var(--accent)" : "var(--text-primary)" }}>{label}</div>
      {desc && <div className="text-[11px] mt-0.5 leading-snug" style={{ color: "var(--text-dim)" }}>{desc}</div>}
    </button>
  );
}
