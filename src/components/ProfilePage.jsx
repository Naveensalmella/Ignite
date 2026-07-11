import { useState, useMemo } from 'react';
import { getLevel, getLevelProg, getRank, xpToNext, calcBMI, bmiCat, bmiCol, today } from '../utils';
import { GATES, RANKS } from '../data';

const ACTIVITY_LEVELS = [
  { value: "1.2", label: "Sedentary", desc: "Desk job, little exercise" },
  { value: "1.375", label: "Lightly Active", desc: "Light exercise 1-3 days/week" },
  { value: "1.55", label: "Moderately Active", desc: "Exercise 3-5 days/week" },
  { value: "1.725", label: "Very Active", desc: "Hard exercise 6-7 days/week" },
  { value: "1.9", label: "Athlete", desc: "Training twice a day" },
];

const NUTRITION_GOALS = [
  { value: "lose", label: "Lose Fat", desc: "−500 kcal deficit", icon: "🔥" },
  { value: "maintain", label: "Maintain", desc: "Stay at current weight", icon: "⚖️" },
  { value: "gain", label: "Build Muscle", desc: "+300 kcal surplus", icon: "💪" },
];

const FITNESS_LEVELS = [
  { value: "beginner", label: "Beginner", desc: "New to fitness (0-6 months)" },
  { value: "intermediate", label: "Intermediate", desc: "Consistent training (6-24 months)" },
  { value: "advanced", label: "Advanced", desc: "Experienced (2+ years)" },
];

export default function ProfilePage({ profile, setProfile, user, onLogout, totalXP, streak, workoutLog, activityLog }) {
  const [editing, setEditing] = useState(null); // null | "personal" | "body" | "fitness"
  const [form, setForm] = useState({ ...profile });

  const lv = getLevel(totalXP);
  const rank = getRank(lv);
  const prog = getLevelProg(totalXP);
  const remain = xpToNext(totalXP);
  const bmi = calcBMI(parseFloat(profile.weight), parseFloat(profile.height));
  const totalW = Object.keys(workoutLog).length;
  const totalCal = Object.values(workoutLog).reduce((s, w) => s + (w.calBurned || 0), 0);
  const unlockedGates = GATES.filter(g => lv >= g.unlock).length;
  const nextRank = RANKS.find(r => r.min > lv);

  // Calculate TDEE for display
  const tdee = useMemo(() => {
    const w = parseFloat(profile.weight);
    const h = parseFloat(profile.height);
    const age = parseInt(profile.age) || 22;
    if (!w || !h) return null;
    const gender = profile.gender || "male";
    const bmr = gender === "female"
      ? (10 * w) + (6.25 * h) - (5 * age) - 161
      : (10 * w) + (6.25 * h) - (5 * age) + 5;
    const activity = parseFloat(profile.activityLevel) || 1.55;
    return Math.round(bmr * activity);
  }, [profile]);

  const calorieTarget = useMemo(() => {
    if (!tdee) return null;
    const adj = profile.nutritionGoal === "lose" ? -500 : profile.nutritionGoal === "gain" ? 300 : 0;
    return tdee + adj;
  }, [tdee, profile.nutritionGoal]);

  // Days since joined
  const daysSinceJoin = useMemo(() => {
    if (!profile.joined) return 0;
    const diff = new Date() - new Date(profile.joined);
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }, [profile.joined]);

  const startEdit = (section) => {
    setForm({ ...profile });
    setEditing(section);
  };

  const save = () => {
    setProfile(p => ({ ...p, ...form }));
    setEditing(null);
  };

  const cancel = () => setEditing(null);

  const updateForm = (key, val) => setForm(p => ({ ...p, [key]: val }));

  return (
    <div style={{ maxWidth: 600 }}>

      {/* ══ PROFILE CARD ══ */}
      <div className="gs" style={{ textAlign: "center", marginBottom: 20, padding: 32, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${rank.color}, #10b981)` }} />

        {/* Avatar */}
        <div style={{ width: 96, height: 96, borderRadius: "50%", margin: "0 auto 16px", background: `linear-gradient(135deg, ${rank.color}, #10b981)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, fontWeight: 800, color: "#fff", fontFamily: "Rajdhani,sans-serif", boxShadow: `0 0 30px ${rank.color}30` }}>
          {(profile.name || user.name || "U")[0].toUpperCase()}
        </div>

        <h3 style={{ fontSize: 24, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>{profile.name || user.name}</h3>
        <p style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>{user.email || user.username}</p>
        {profile.bio && <p style={{ fontSize: 13, color: "#9ca3b8", marginTop: 6, fontStyle: "italic" }}>{profile.bio}</p>}

        {/* Level & Rank */}
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 16 }}>
          <div>
            <div style={{ fontSize: 32, fontWeight: 900, color: rank.color, fontFamily: "Rajdhani,sans-serif", lineHeight: 1 }}>{lv}</div>
            <div style={{ fontSize: 10, color: "#6b7280", letterSpacing: 1 }}>LEVEL</div>
          </div>
          <div>
            <span className="rank-badge" style={{ background: `${rank.color}15`, color: rank.color, border: `1px solid ${rank.color}25`, fontSize: 15, padding: "8px 20px" }}>{rank.emoji} {rank.name}</span>
          </div>
          <div>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#10b981", fontFamily: "Rajdhani,sans-serif", lineHeight: 1 }}>{streak}</div>
            <div style={{ fontSize: 10, color: "#6b7280", letterSpacing: 1 }}>STREAK</div>
          </div>
        </div>

        {/* XP Bar */}
        <div style={{ marginTop: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6b7280", marginBottom: 4 }}>
            <span>Level {lv}</span>
            <span style={{ color: rank.color }}>{remain.toLocaleString()} XP to Level {lv < 100 ? lv + 1 : "MAX"}</span>
          </div>
          <div className="xp-bar-bg" style={{ height: 10, borderRadius: 5 }}>
            <div className="xp-bar-fill" style={{ width: `${prog * 100}%`, background: `linear-gradient(90deg, ${rank.color}, #10b981)`, height: 10, borderRadius: 5 }} />
          </div>
          <div style={{ fontSize: 11, color: "#4b5563", marginTop: 6 }}>
            {totalXP.toLocaleString()} Total XP
            {nextRank && <span> · Next rank: <span style={{ color: nextRank.color }}>{nextRank.name}</span> at Lv.{nextRank.min}</span>}
          </div>
        </div>
      </div>

      {/* ══ STATS OVERVIEW ══ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 10, marginBottom: 20 }}>
        {[
          ["🏋️", totalW, "Workouts"],
          ["🔥", totalCal.toLocaleString(), "Cal Burned"],
          ["⚔️", `${unlockedGates}/6`, "Gates"],
          ["📅", daysSinceJoin, "Days"],
          ["📊", bmi || "—", "BMI"],
          ["🎯", calorieTarget || "—", "Cal Goal"],
        ].map(([icon, val, label]) => (
          <div key={label} className="gc" style={{ textAlign: "center", padding: 14 }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>{val}</div>
            <div style={{ fontSize: 10, color: "#6b7280" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ══ PERSONAL INFO ══ */}
      <div className="gs" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div className="sl" style={{ margin: 0 }}>Personal Info</div>
          {editing !== "personal" && <span onClick={() => startEdit("personal")} style={{ fontSize: 12, color: "#10b981", cursor: "pointer", fontWeight: 600 }}>Edit</span>}
        </div>

        {editing === "personal" ? (
          <div className="fade-in">
            {[
              ["Name", "name", "text", "Your full name"],
              ["Bio", "bio", "text", "One-line about yourself"],
              ["Goal", "goal", "text", "What are you working toward?"],
            ].map(([label, key, type, placeholder]) => (
              <div key={key} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 4 }}>{label}</label>
                <input className="inp" type={type} placeholder={placeholder} value={form[key] || ""} onChange={e => updateForm(key, e.target.value)} />
              </div>
            ))}
            <div style={{ display: "flex", gap: 10 }}>
              <button className="bp" onClick={save} style={{ flex: 1 }}>Save</button>
              <button className="bg" onClick={cancel} style={{ flex: 1 }}>Cancel</button>
            </div>
          </div>
        ) : (
          <div>
            {[
              ["Name", profile.name || "—"],
              ["Bio", profile.bio || "—"],
              ["Goal", profile.goal || "—"],
              ["Joined", profile.joined ? new Date(profile.joined + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : "—"],
            ].map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,.03)", fontSize: 14 }}>
                <span style={{ color: "#6b7280" }}>{l}</span>
                <span style={{ color: "#e5e7eb" }}>{v}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══ BODY & HEALTH ══ */}
      <div className="gs" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div className="sl" style={{ margin: 0 }}>Body & Health</div>
          {editing !== "body" && <span onClick={() => startEdit("body")} style={{ fontSize: 12, color: "#10b981", cursor: "pointer", fontWeight: 600 }}>Edit</span>}
        </div>

        {editing === "body" ? (
          <div className="fade-in">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              {[
                ["Weight (kg)", "weight", "number", "e.g. 70"],
                ["Height (cm)", "height", "number", "e.g. 175"],
                ["Age", "age", "number", "e.g. 22"],
                ["Target Weight (kg)", "targetWeight", "number", "e.g. 65"],
              ].map(([label, key, type, ph]) => (
                <div key={key}>
                  <label style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 4 }}>{label}</label>
                  <input className="inp" type={type} placeholder={ph} value={form[key] || ""} onChange={e => updateForm(key, e.target.value)} />
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 6 }}>Gender</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[["male", "♂ Male"], ["female", "♀ Female"]].map(([val, label]) => (
                  <div key={val} className={`chip ${form.gender === val ? "chip-a" : "chip-i"}`}
                    onClick={() => updateForm("gender", val)} style={{ flex: 1, justifyContent: "center", padding: "10px" }}>
                    {label}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 6 }}>Blood Group (optional)</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => (
                  <span key={bg} className={`chip ${form.bloodGroup === bg ? "chip-a" : "chip-i"}`}
                    onClick={() => updateForm("bloodGroup", bg)} style={{ padding: "6px 12px" }}>
                    {bg}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button className="bp" onClick={save} style={{ flex: 1 }}>Save</button>
              <button className="bg" onClick={cancel} style={{ flex: 1 }}>Cancel</button>
            </div>
          </div>
        ) : (
          <div>
            {[
              ["Weight", profile.weight ? `${profile.weight} kg` : "—"],
              ["Height", profile.height ? `${profile.height} cm` : "—"],
              ["Age", profile.age ? `${profile.age} years` : "—"],
              ["Gender", profile.gender ? (profile.gender === "male" ? "♂ Male" : "♀ Female") : "—"],
              ["BMI", bmi ? `${bmi} (${bmiCat(bmi)})` : "—", bmiCol(bmi)],
              ["Target Weight", profile.targetWeight ? `${profile.targetWeight} kg` : "—"],
              ["Blood Group", profile.bloodGroup || "—"],
            ].map(([l, v, color]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,.03)", fontSize: 14 }}>
                <span style={{ color: "#6b7280" }}>{l}</span>
                <span style={{ color: color || "#e5e7eb", fontWeight: color ? 600 : 400 }}>{v}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══ FITNESS & NUTRITION ══ */}
      <div className="gs" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div className="sl" style={{ margin: 0 }}>Fitness & Nutrition Goals</div>
          {editing !== "fitness" && <span onClick={() => startEdit("fitness")} style={{ fontSize: 12, color: "#10b981", cursor: "pointer", fontWeight: 600 }}>Edit</span>}
        </div>

        {editing === "fitness" ? (
          <div className="fade-in">
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 6 }}>Activity Level</label>
              {ACTIVITY_LEVELS.map(al => (
                <div key={al.value} onClick={() => updateForm("activityLevel", al.value)}
                  className="gc" style={{ padding: "10px 14px", marginBottom: 6, cursor: "pointer", border: form.activityLevel === al.value ? "1px solid rgba(16,185,129,.3)" : "1px solid rgba(255,255,255,.04)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: form.activityLevel === al.value ? "#10b981" : "#e5e7eb" }}>{al.label}</div>
                      <div style={{ fontSize: 11, color: "#6b7280" }}>{al.desc}</div>
                    </div>
                    {form.activityLevel === al.value && <span style={{ color: "#10b981" }}>✓</span>}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 6 }}>Nutrition Goal</label>
              <div style={{ display: "flex", gap: 8 }}>
                {NUTRITION_GOALS.map(ng => (
                  <div key={ng.value} onClick={() => updateForm("nutritionGoal", ng.value)}
                    className="gc" style={{ flex: 1, padding: "12px 8px", textAlign: "center", cursor: "pointer", border: form.nutritionGoal === ng.value ? "1px solid rgba(16,185,129,.3)" : "1px solid rgba(255,255,255,.04)" }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{ng.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: form.nutritionGoal === ng.value ? "#10b981" : "#e5e7eb" }}>{ng.label}</div>
                    <div style={{ fontSize: 10, color: "#6b7280" }}>{ng.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 6 }}>Fitness Level</label>
              <div style={{ display: "flex", gap: 8 }}>
                {FITNESS_LEVELS.map(fl => (
                  <div key={fl.value} onClick={() => updateForm("fitnessLevel", fl.value)}
                    className={`chip ${form.fitnessLevel === fl.value ? "chip-a" : "chip-i"}`}
                    style={{ flex: 1, justifyContent: "center", padding: "10px 8px", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                    <div style={{ fontWeight: 600 }}>{fl.label}</div>
                    <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>{fl.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 4 }}>Daily Calorie Target (auto-calculated, override here)</label>
              <input className="inp" type="number" placeholder="e.g. 2000" value={form.calGoal || ""} onChange={e => updateForm("calGoal", e.target.value)} />
              {tdee && <div style={{ fontSize: 11, color: "#4b5563", marginTop: 4 }}>Estimated TDEE: {tdee} kcal · Suggested target: {calorieTarget} kcal</div>}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button className="bp" onClick={save} style={{ flex: 1 }}>Save</button>
              <button className="bg" onClick={cancel} style={{ flex: 1 }}>Cancel</button>
            </div>
          </div>
        ) : (
          <div>
            {[
              ["Activity Level", ACTIVITY_LEVELS.find(a => a.value === profile.activityLevel)?.label || "Moderately Active"],
              ["Nutrition Goal", NUTRITION_GOALS.find(n => n.value === profile.nutritionGoal)?.label || "Maintain"],
              ["Fitness Level", FITNESS_LEVELS.find(f => f.value === profile.fitnessLevel)?.label || "—"],
              ["TDEE", tdee ? `${tdee} kcal/day` : "Set weight & height to calculate"],
              ["Daily Target", calorieTarget ? `${calorieTarget} kcal/day` : "—"],
            ].map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,.03)", fontSize: 14 }}>
                <span style={{ color: "#6b7280" }}>{l}</span>
                <span style={{ color: "#e5e7eb" }}>{v}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══ ACTIVITY LOG ══ */}
      {activityLog && activityLog.length > 0 && (
        <div className="gs" style={{ marginBottom: 16 }}>
          <div className="sl">Recent Activity</div>
          {activityLog.slice(0, 25).map(a => (
            <div key={a.id} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,.03)", fontSize: 13 }}>
              <span style={{ color: "#d1d5db" }}>{a.detail}</span>
              <span style={{ color: "#4b5563", fontSize: 11, flexShrink: 0, marginLeft: 10 }}>{a.date} {a.time}</span>
            </div>
          ))}
        </div>
      )}

      {/* ══ LOGOUT ══ */}
      <button className="bg" onClick={onLogout} style={{ width: "100%", color: "#ef4444", padding: 14 }}>Log Out</button>
    </div>
  );
}
