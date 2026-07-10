import { useState } from 'react';

const GOALS = [
    { id: "lose", icon: "🔥", label: "Lose Fat", desc: "Burn fat, get lean and defined" },
    { id: "muscle", icon: "💪", label: "Build Muscle", desc: "Gain strength and muscle mass" },
    { id: "fit", icon: "🏃", label: "Get Fit", desc: "Overall health and endurance" },
    { id: "fight", icon: "⚔️", label: "Learn Fighting", desc: "Master combat techniques" },
    { id: "flex", icon: "🧘", label: "Flexibility & Balance", desc: "Mobility, recovery, and body control" },
];

const FITNESS_LEVELS = [
    { id: "beginner", icon: "🌱", label: "Beginner", desc: "New to fitness or returning after a long break", multiplier: 0.6 },
    { id: "intermediate", icon: "⚡", label: "Intermediate", desc: "Been training for 3-12 months consistently", multiplier: 1.0 },
    { id: "advanced", icon: "🔥", label: "Advanced", desc: "2+ years of serious training", multiplier: 1.4 },
];

const TRAINING_TYPES = [
    { id: "bodyweight", icon: "🤸", label: "Bodyweight", desc: "No equipment needed — train anywhere" },
    { id: "gym", icon: "🏋️", label: "Gym", desc: "Weights, machines, and barbells" },
    { id: "cardio", icon: "🏃", label: "Cardio Focus", desc: "Running, HIIT, endurance training" },
    { id: "mixed", icon: "🔄", label: "Mixed", desc: "Combine everything for maximum results" },
];

const FIGHTING_STYLES = [
    { id: "boxing", icon: "🥊", label: "Boxing", desc: "Jabs, crosses, hooks, footwork" },
    { id: "kickboxing", icon: "🦵", label: "Kickboxing", desc: "Punches + powerful kicks" },
    { id: "mma", icon: "⚔️", label: "MMA", desc: "Strikes, clinch, ground basics" },
    { id: "martial_arts", icon: "🥋", label: "Martial Arts", desc: "Traditional techniques and forms" },
    { id: "none", icon: "❌", label: "Not Interested", desc: "Skip combat training" },
];

const TIME_OPTIONS = [
    { id: "15", label: "15 min", desc: "Quick burst" },
    { id: "30", label: "30 min", desc: "Focused session" },
    { id: "45", label: "45 min", desc: "Solid workout" },
    { id: "60", label: "60 min", desc: "Full training" },
    { id: "90", label: "90+ min", desc: "Beast mode" },
];

const BODY_PARTS = [
    { id: "chest", icon: "🫁", label: "Chest" },
    { id: "back", icon: "🔙", label: "Back" },
    { id: "shoulders", icon: "💪", label: "Shoulders" },
    { id: "arms", icon: "🦾", label: "Arms" },
    { id: "core", icon: "🔥", label: "Core / Abs" },
    { id: "legs", icon: "🦵", label: "Legs" },
    { id: "glutes", icon: "🍑", label: "Glutes" },
    { id: "full", icon: "⚡", label: "Full Body" },
];

const GENDERS = [
    { id: "male", icon: "♂", label: "Male" },
    { id: "female", icon: "♀", label: "Female" },
    { id: "other", icon: "⚧", label: "Other" },
];

export default function OnboardingPage({ onComplete }) {
    const [step, setStep] = useState(0);
    const [data, setData] = useState({
        name: "", age: "", gender: "", weight: "", height: "",
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
        if (step === 1) return data.age && data.gender && data.weight && data.height;
        if (step === 2) return data.goal && data.fitnessLevel;
        if (step === 3) return data.trainingType && data.fightingStyle;
        if (step === 4) return data.dailyTime && data.focusAreas.length > 0;
        return true;
    };

    const finish = () => {
        onComplete({
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
            joined: new Date().toISOString().split("T")[0],
        });
    };

    const cardStyle = (selected) => ({
        padding: "14px 16px", borderRadius: 10, cursor: "pointer",
        background: selected ? "rgba(16,185,129,.08)" : "rgba(255,255,255,.02)",
        border: selected ? "1px solid rgba(16,185,129,.3)" : "1px solid rgba(255,255,255,.04)",
        transition: "all .2s",
    });

    return (
        <div style={{ minHeight: "100vh", background: "#060a0c", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <div style={{ maxWidth: 520, width: "100%" }}>

                {/* Logo */}
                <div style={{ textAlign: "center", marginBottom: 32 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 12, margin: "0 auto 12px", background: "linear-gradient(135deg,#10b981,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 900, color: "#fff", fontFamily: "Rajdhani,sans-serif" }}>I</div>
                    <h1 style={{ fontSize: 28, fontWeight: 900, fontFamily: "Rajdhani,sans-serif", background: "linear-gradient(135deg,#10b981,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 6 }}>IGNITE</h1>
                </div>

                {/* Progress Bar */}
                <div style={{ display: "flex", gap: 4, marginBottom: 24 }}>
                    {Array.from({ length: totalSteps }, (_, i) => (
                        <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= step ? "linear-gradient(90deg,#10b981,#06b6d4)" : "rgba(255,255,255,.06)", transition: "background .3s" }} />
                    ))}
                </div>

                {/* ═══ STEP 0: Welcome + Name ═══ */}
                {step === 0 && (
                    <div className="fade-in" style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>⚔️</div>
                        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", letterSpacing: 1 }}>Build Your Warrior Profile</h2>
                        <p style={{ color: "#6b7280", fontSize: 14, marginTop: 8, marginBottom: 28 }}>Let's set up your training based on your body, goals, and style. This takes 2 minutes.</p>
                        <div style={{ textAlign: "left" }}>
                            <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 6 }}>What should we call you?</label>
                            <input className="inp" placeholder="Your name" value={data.name} onChange={e => update("name", e.target.value)}
                                style={{ fontSize: 18, textAlign: "center", padding: 16 }} autoFocus />
                        </div>
                    </div>
                )}

                {/* ═══ STEP 1: Body Stats ═══ */}
                {step === 1 && (
                    <div className="fade-in">
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", letterSpacing: 1, marginBottom: 4 }}>Body & Stats</h2>
                        <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 20 }}>This helps calculate your BMI, calorie needs, and training intensity.</p>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                            <div>
                                <label style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 4 }}>Age</label>
                                <input className="inp" type="number" placeholder="e.g. 22" value={data.age} onChange={e => update("age", e.target.value)} style={{ textAlign: "center", fontSize: 18, fontWeight: 700 }} />
                            </div>
                            <div>
                                <label style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 4 }}>Weight (kg)</label>
                                <input className="inp" type="number" placeholder="e.g. 70" value={data.weight} onChange={e => update("weight", e.target.value)} style={{ textAlign: "center", fontSize: 18, fontWeight: 700 }} />
                            </div>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 4 }}>Height (cm)</label>
                            <input className="inp" type="number" placeholder="e.g. 175" value={data.height} onChange={e => update("height", e.target.value)} style={{ textAlign: "center", fontSize: 18, fontWeight: 700 }} />
                        </div>

                        <div>
                            <label style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 8 }}>Gender</label>
                            <div style={{ display: "flex", gap: 8 }}>
                                {GENDERS.map(g => (
                                    <div key={g.id} onClick={() => update("gender", g.id)}
                                        style={{ ...cardStyle(data.gender === g.id), flex: 1, textAlign: "center", padding: 14 }}>
                                        <div style={{ fontSize: 24 }}>{g.icon}</div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: data.gender === g.id ? "#10b981" : "#e5e7eb", marginTop: 4 }}>{g.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══ STEP 2: Goal + Fitness Level ═══ */}
                {step === 2 && (
                    <div className="fade-in">
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", letterSpacing: 1, marginBottom: 4 }}>Your Goal</h2>
                        <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 16 }}>What are you training for?</p>

                        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                            {GOALS.map(g => (
                                <div key={g.id} onClick={() => update("goal", g.id)} style={cardStyle(data.goal === g.id)}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                        <span style={{ fontSize: 28 }}>{g.icon}</span>
                                        <div>
                                            <div style={{ fontSize: 15, fontWeight: 600, color: data.goal === g.id ? "#10b981" : "#e5e7eb" }}>{g.label}</div>
                                            <div style={{ fontSize: 12, color: "#6b7280" }}>{g.desc}</div>
                                        </div>
                                        {data.goal === g.id && <span style={{ marginLeft: "auto", color: "#10b981" }}>✓</span>}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", marginBottom: 8 }}>Current Fitness Level</h3>
                        <div style={{ display: "flex", gap: 8 }}>
                            {FITNESS_LEVELS.map(fl => (
                                <div key={fl.id} onClick={() => update("fitnessLevel", fl.id)}
                                    style={{ ...cardStyle(data.fitnessLevel === fl.id), flex: 1, textAlign: "center", padding: 14 }}>
                                    <div style={{ fontSize: 24 }}>{fl.icon}</div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: data.fitnessLevel === fl.id ? "#10b981" : "#e5e7eb", marginTop: 4 }}>{fl.label}</div>
                                    <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>{fl.desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ═══ STEP 3: Training Type + Fighting Style ═══ */}
                {step === 3 && (
                    <div className="fade-in">
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", letterSpacing: 1, marginBottom: 4 }}>Training Style</h2>
                        <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 16 }}>How do you prefer to train?</p>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 24 }}>
                            {TRAINING_TYPES.map(t => (
                                <div key={t.id} onClick={() => update("trainingType", t.id)}
                                    style={{ ...cardStyle(data.trainingType === t.id), textAlign: "center", padding: 16 }}>
                                    <div style={{ fontSize: 28 }}>{t.icon}</div>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: data.trainingType === t.id ? "#10b981" : "#e5e7eb", marginTop: 4 }}>{t.label}</div>
                                    <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{t.desc}</div>
                                </div>
                            ))}
                        </div>

                        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", marginBottom: 8 }}>Fighting Interest</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {FIGHTING_STYLES.map(f => (
                                <div key={f.id} onClick={() => update("fightingStyle", f.id)} style={cardStyle(data.fightingStyle === f.id)}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                        <span style={{ fontSize: 24 }}>{f.icon}</span>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 600, color: data.fightingStyle === f.id ? "#10b981" : "#e5e7eb" }}>{f.label}</div>
                                            <div style={{ fontSize: 12, color: "#6b7280" }}>{f.desc}</div>
                                        </div>
                                        {data.fightingStyle === f.id && <span style={{ marginLeft: "auto", color: "#10b981" }}>✓</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ═══ STEP 4: Time + Focus Areas ═══ */}
                {step === 4 && (
                    <div className="fade-in">
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", letterSpacing: 1, marginBottom: 4 }}>Daily Training Time</h2>
                        <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 16 }}>How much time can you train per day?</p>

                        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
                            {TIME_OPTIONS.map(t => (
                                <div key={t.id} onClick={() => update("dailyTime", t.id)}
                                    style={{ ...cardStyle(data.dailyTime === t.id), flex: 1, textAlign: "center", padding: 12 }}>
                                    <div style={{ fontSize: 18, fontWeight: 800, color: data.dailyTime === t.id ? "#10b981" : "#e5e7eb", fontFamily: "Rajdhani,sans-serif" }}>{t.label}</div>
                                    <div style={{ fontSize: 10, color: "#6b7280" }}>{t.desc}</div>
                                </div>
                            ))}
                        </div>

                        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", marginBottom: 8 }}>Focus Areas</h3>
                        <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 12 }}>Select body parts you want to focus on (or choose Full Body)</p>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                            {BODY_PARTS.map(bp => (
                                <div key={bp.id} onClick={() => toggleFocus(bp.id)}
                                    style={{ ...cardStyle(data.focusAreas.includes(bp.id)), textAlign: "center", padding: 12 }}>
                                    <div style={{ fontSize: 22 }}>{bp.icon}</div>
                                    <div style={{ fontSize: 11, fontWeight: 600, color: data.focusAreas.includes(bp.id) ? "#10b981" : "#e5e7eb", marginTop: 4 }}>{bp.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ═══ STEP 5: Summary ═══ */}
                {step === 5 && (
                    <div className="fade-in" style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 52, marginBottom: 12 }}>🔥</div>
                        <h2 style={{ fontSize: 24, fontWeight: 800, fontFamily: "Rajdhani,sans-serif", background: "linear-gradient(135deg,#10b981,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 2 }}>WARRIOR PROFILE READY</h2>
                        <p style={{ color: "#6b7280", fontSize: 14, marginTop: 8, marginBottom: 24 }}>Your personalized training has been configured</p>

                        <div style={{ background: "rgba(10,16,18,.9)", border: "1px solid rgba(16,185,129,.15)", borderRadius: 14, padding: 24, textAlign: "left" }}>
                            {/* Avatar + Name */}
                            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,#10b981,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800, color: "#fff", fontFamily: "Rajdhani,sans-serif" }}>
                                    {data.name[0]?.toUpperCase() || "I"}
                                </div>
                                <div>
                                    <div style={{ fontSize: 22, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>{data.name}</div>
                                    <div style={{ fontSize: 12, color: "#10b981" }}>Level 1 · Spark</div>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
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
                                    <div key={l} style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,.03)" }}>
                                        <div style={{ fontSize: 10, color: "#6b7280", fontFamily: "Rajdhani,sans-serif", letterSpacing: 1 }}>{l}</div>
                                        <div style={{ fontSize: 14, fontWeight: 600, color: "#e5e7eb" }}>{v}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                    {step > 0 && (
                        <button onClick={() => setStep(s => s - 1)}
                            style={{ flex: "0 0 auto", padding: "14px 24px", background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", color: "#e5e7eb", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                            ← Back
                        </button>
                    )}
                    <button onClick={() => { if (step < totalSteps - 1) setStep(s => s + 1); else finish(); }}
                        disabled={!canNext()}
                        style={{ flex: 1, padding: 14, background: canNext() ? "linear-gradient(135deg,#10b981,#059669)" : "rgba(255,255,255,.03)", color: canNext() ? "#fff" : "#4b5563", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: canNext() ? "pointer" : "not-allowed", fontFamily: "inherit", letterSpacing: 1, boxShadow: canNext() ? "0 4px 16px rgba(16,185,129,.25)" : "none", transition: "all .25s" }}>
                        {step === totalSteps - 1 ? "BEGIN YOUR JOURNEY →" : "NEXT →"}
                    </button>
                </div>
            </div>
        </div>
    );
}