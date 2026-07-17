import { useState } from 'react';
import { today } from '../utils';
import { XP } from '../data';

const PROGRAMS = [
  {
    id: "beginner_strength", name: "Beginner Strength", icon: "💪", duration: "4 weeks", difficulty: "Beginner",
    color: "#22c55e", desc: "Build a solid foundation with basic compound movements. Perfect if you're just starting.",
    schedule: [
      { week: 1, name: "Foundation", days: [
        { day: 1, name: "Full Body A", exercises: ["Bodyweight Squats 3×15", "Push-ups 3×10", "Plank 3×30s", "Lunges 3×10 each", "Glute Bridges 3×15"] },
        { day: 2, name: "Rest + Stretch", exercises: ["Full body stretch 15 min", "Light walk 20 min"] },
        { day: 3, name: "Full Body B", exercises: ["Wall Sit 3×30s", "Incline Push-ups 3×12", "Superman 3×10", "Step-ups 3×10 each", "Dead Hang 3×15s"] },
        { day: 4, name: "Rest + Walk", exercises: ["Light walk 30 min", "Hip stretches 10 min"] },
        { day: 5, name: "Full Body C", exercises: ["Jump Squats 3×10", "Diamond Push-ups 3×8", "Mountain Climbers 3×20", "Calf Raises 3×20", "Plank 3×40s"] },
        { day: 6, name: "Active Recovery", exercises: ["Yoga flow 20 min", "Foam rolling 10 min"] },
        { day: 7, name: "Rest Day", exercises: ["Complete rest", "Stay hydrated"] },
      ]},
      { week: 2, name: "Building", days: [
        { day: 1, name: "Upper Body", exercises: ["Push-ups 4×12", "Pike Push-ups 3×8", "Tricep Dips 3×10", "Plank Shoulder Taps 3×10", "Arm Circles 2×20"] },
        { day: 2, name: "Lower Body", exercises: ["Squats 4×15", "Lunges 3×12 each", "Glute Bridges 4×15", "Wall Sit 3×40s", "Calf Raises 3×25"] },
        { day: 3, name: "Rest + Cardio", exercises: ["Light jog or walk 30 min"] },
        { day: 4, name: "Full Body", exercises: ["Burpees 3×8", "Push-ups 3×15", "Squats 3×20", "Plank 3×45s", "Mountain Climbers 3×20"] },
        { day: 5, name: "Core Focus", exercises: ["Crunches 4×20", "Leg Raises 3×12", "Bicycle Crunches 3×15", "Plank 3×50s", "Russian Twists 3×15"] },
        { day: 6, name: "Stretch + Yoga", exercises: ["Full body yoga 25 min"] },
        { day: 7, name: "Rest Day", exercises: ["Complete rest"] },
      ]},
      { week: 3, name: "Pushing Limits", days: [
        { day: 1, name: "Push Day", exercises: ["Push-ups 4×15", "Diamond Push-ups 3×10", "Pike Push-ups 3×10", "Tricep Dips 4×12", "Plank to Push-up 3×8"] },
        { day: 2, name: "Pull + Back", exercises: ["Superman 4×12", "Reverse Snow Angels 3×10", "Doorway Rows 3×12", "Dead Hang 3×20s", "Back Extensions 3×15"] },
        { day: 3, name: "Legs + Glutes", exercises: ["Jump Squats 4×12", "Bulgarian Split Squat 3×10", "Hip Thrusts 4×15", "Box Jumps 3×8", "Wall Sit 3×50s"] },
        { day: 4, name: "Rest + Walk", exercises: ["Walk 30 min", "Stretch 15 min"] },
        { day: 5, name: "HIIT Circuit", exercises: ["Burpees 4×10", "Mountain Climbers 4×20", "Jump Squats 4×12", "Push-ups 4×12", "High Knees 4×30s"] },
        { day: 6, name: "Core + Flexibility", exercises: ["Ab circuit 20 min", "Deep stretch 15 min"] },
        { day: 7, name: "Rest Day", exercises: ["Complete rest"] },
      ]},
      { week: 4, name: "Test Week", days: [
        { day: 1, name: "Max Push Test", exercises: ["Max Push-ups (1 set)", "Max Plank Hold", "Diamond Push-ups 4×12", "Tricep Dips 4×15"] },
        { day: 2, name: "Max Leg Test", exercises: ["Max Squats (1 set)", "Max Wall Sit", "Jump Squats 4×15", "Lunges 4×12 each"] },
        { day: 3, name: "Full Body Burn", exercises: ["Burpees 5×10", "Push-ups 5×15", "Squats 5×20", "Plank 3×60s", "Mountain Climbers 5×20"] },
        { day: 4, name: "Active Rest", exercises: ["Light jog 20 min", "Yoga 20 min"] },
        { day: 5, name: "Final Challenge", exercises: ["100 Push-ups (any sets)", "100 Squats (any sets)", "5 min Plank (any sets)", "50 Burpees (any sets)"] },
        { day: 6, name: "Stretch + Reflect", exercises: ["Deep stretch 30 min", "Journal your progress"] },
        { day: 7, name: "Celebrate!", exercises: ["You completed the program!", "Take progress photo"] },
      ]},
    ],
  },
  {
    id: "fat_loss", name: "Fat Loss HIIT", icon: "🔥", duration: "4 weeks", difficulty: "Intermediate",
    color: "#ef4444", desc: "High intensity intervals designed to maximize calorie burn and boost metabolism.",
    schedule: [
      { week: 1, name: "Ignition", days: [
        { day: 1, name: "HIIT A", exercises: ["Jumping Jacks 4×30s", "Burpees 4×8", "Mountain Climbers 4×20", "High Knees 4×30s", "Rest 60s between sets"] },
        { day: 2, name: "Steady Cardio", exercises: ["Brisk walk or jog 35 min"] },
        { day: 3, name: "HIIT B", exercises: ["Squat Jumps 4×12", "Push-ups 4×12", "Tuck Jumps 3×8", "Plank 3×45s", "Skaters 4×10 each"] },
        { day: 4, name: "Rest", exercises: ["Complete rest or light walk"] },
        { day: 5, name: "HIIT C", exercises: ["Burpee + Push-up 4×8", "Sprint in place 4×20s", "Lunges 4×10 each", "Mountain Climbers 4×25", "Jump Rope 4×30s"] },
        { day: 6, name: "Active Recovery", exercises: ["Yoga or stretch 25 min"] },
        { day: 7, name: "Rest", exercises: ["Complete rest"] },
      ]},
      { week: 2, name: "Burn Phase", days: [
        { day: 1, name: "Tabata A", exercises: ["20s Burpees / 10s Rest ×8", "20s Squats / 10s Rest ×8", "20s Push-ups / 10s Rest ×8"] },
        { day: 2, name: "Cardio", exercises: ["Run or cycle 30 min moderate"] },
        { day: 3, name: "Tabata B", exercises: ["20s High Knees / 10s Rest ×8", "20s Mountain Climbers / 10s Rest ×8", "20s Tuck Jumps / 10s Rest ×8"] },
        { day: 4, name: "Rest", exercises: ["Light stretch only"] },
        { day: 5, name: "Circuit", exercises: ["5 rounds: 10 Burpees, 15 Squats, 10 Push-ups, 20 Mountain Climbers, 60s Rest"] },
        { day: 6, name: "Cardio", exercises: ["Brisk walk 40 min or jog 25 min"] },
        { day: 7, name: "Rest", exercises: ["Complete rest"] },
      ]},
      { week: 3, name: "Peak Burn", days: [
        { day: 1, name: "Death Circuit", exercises: ["6 rounds: 12 Burpees, 20 Squats, 15 Push-ups, 25 Mountain Climbers, 45s Rest"] },
        { day: 2, name: "Steady State", exercises: ["Run 30 min or cycle 40 min"] },
        { day: 3, name: "EMOM 20", exercises: ["Every minute on the minute for 20 min: Odd min = 10 Burpees, Even min = 15 Squats"] },
        { day: 4, name: "Active Rest", exercises: ["Walk 30 min, stretch 15 min"] },
        { day: 5, name: "AMRAP 20", exercises: ["As many rounds as possible in 20 min: 5 Burpees, 10 Push-ups, 15 Squats, 20 Sit-ups"] },
        { day: 6, name: "Light Cardio", exercises: ["Easy jog or walk 30 min"] },
        { day: 7, name: "Rest", exercises: ["Complete rest"] },
      ]},
      { week: 4, name: "Final Push", days: [
        { day: 1, name: "Benchmark WOD", exercises: ["For time: 100 Squats, 80 Sit-ups, 60 Push-ups, 40 Burpees, 20 Tuck Jumps"] },
        { day: 2, name: "Recovery Run", exercises: ["Easy 25 min jog"] },
        { day: 3, name: "Chipper", exercises: ["50 Jumping Jacks, 40 Squats, 30 Push-ups, 20 Burpees, 10 Tuck Jumps, 1 min Plank"] },
        { day: 4, name: "Rest", exercises: ["Complete rest"] },
        { day: 5, name: "FINAL TEST", exercises: ["Max Burpees in 5 min", "Max Push-ups in 2 min", "Max Squats in 3 min"] },
        { day: 6, name: "Cool Down", exercises: ["Yoga 30 min, deep stretch"] },
        { day: 7, name: "Done!", exercises: ["Congratulations! Take progress photos and measurements"] },
      ]},
    ],
  },
  {
    id: "muscle_building", name: "Muscle Builder", icon: "🏋️", duration: "4 weeks", difficulty: "Intermediate",
    color: "#8b5cf6", desc: "Progressive overload focused program. Build real muscle with structured push/pull/legs split.",
    schedule: [
      { week: 1, name: "Adaptation", days: [
        { day: 1, name: "Push", exercises: ["Push-ups 4×12", "Diamond Push-ups 3×10", "Pike Push-ups 3×10", "Tricep Dips 4×12", "Plank Push-ups 3×8"] },
        { day: 2, name: "Pull", exercises: ["Doorway Rows 4×12", "Superman 4×12", "Reverse Snow Angels 3×10", "Bicep Towel Curls 3×12", "Dead Hang 3×20s"] },
        { day: 3, name: "Legs", exercises: ["Squats 4×15", "Bulgarian Split Squat 3×10", "Hip Thrusts 4×15", "Calf Raises 4×25", "Wall Sit 3×45s"] },
        { day: 4, name: "Rest", exercises: ["Complete rest, eat well"] },
        { day: 5, name: "Upper", exercises: ["Push-ups 5×10", "Pike Push-ups 4×8", "Rows 4×12", "Dips 4×10", "Plank 3×50s"] },
        { day: 6, name: "Lower + Core", exercises: ["Jump Squats 4×10", "Lunges 4×12", "Glute Bridges 4×20", "Crunches 4×20", "Leg Raises 3×15"] },
        { day: 7, name: "Rest", exercises: ["Rest and recover"] },
      ]},
      { week: 2, name: "Growth", days: [
        { day: 1, name: "Push Heavy", exercises: ["Push-ups 5×15", "Decline Push-ups 4×12", "Diamond Push-ups 4×10", "Dips 5×12", "Overhead Tricep 3×12"] },
        { day: 2, name: "Pull Heavy", exercises: ["Rows 5×12", "Superman Hold 4×20s", "Bicep Curls 4×12", "Face Pulls 3×15", "Dead Hang 4×25s"] },
        { day: 3, name: "Legs Heavy", exercises: ["Squats 5×20", "Pistol Squat Prog 3×5", "Hip Thrusts 5×20", "Jump Squats 4×12", "Calf Raises 5×30"] },
        { day: 4, name: "Rest", exercises: ["Rest, stretch, eat protein"] },
        { day: 5, name: "Push + Core", exercises: ["Push-ups 4×20", "Pike Push-ups 4×12", "Dips 4×15", "Plank 4×60s", "Ab Rollout 3×10"] },
        { day: 6, name: "Full Body", exercises: ["Burpees 3×10", "Push-ups 3×15", "Squats 3×20", "Rows 3×12", "Plank 2×60s"] },
        { day: 7, name: "Rest", exercises: ["Complete rest"] },
      ]},
      { week: 3, name: "Intensity", days: [
        { day: 1, name: "Chest Focus", exercises: ["Wide Push-ups 5×15", "Diamond 4×12", "Decline 4×12", "Chest Squeeze 4×15", "Push-up Hold 3×20s"] },
        { day: 2, name: "Back Focus", exercises: ["Rows 5×15", "Superman 5×15", "Reverse Fly 4×12", "Back Extension 4×15", "Dead Hang 4×30s"] },
        { day: 3, name: "Leg Focus", exercises: ["Squats 5×25", "Jump Squats 5×12", "Split Squats 4×12", "Wall Sit 4×60s", "Calf Raises 5×30"] },
        { day: 4, name: "Active Rest", exercises: ["Light walk 30 min, stretch 20 min"] },
        { day: 5, name: "Arms + Shoulders", exercises: ["Pike Push-ups 5×12", "Dips 5×15", "Curls 5×15", "Lateral Raise 4×12", "Plank Shoulder Tap 4×12"] },
        { day: 6, name: "Core Destroyer", exercises: ["Hollow Body 4×30s", "L-Sit Prog 4×10s", "Leg Raises 5×15", "Russian Twists 4×20", "Plank 3×75s"] },
        { day: 7, name: "Rest", exercises: ["Rest day"] },
      ]},
      { week: 4, name: "Peak", days: [
        { day: 1, name: "Push Max", exercises: ["Max Push-ups test", "Diamond 5×12", "Decline 5×12", "Dips 5×15", "Push-up Burnout"] },
        { day: 2, name: "Pull Max", exercises: ["Rows 5×15", "Superman 5×15", "Curls 5×15", "Dead Hang Max Hold", "Back Burnout"] },
        { day: 3, name: "Legs Max", exercises: ["Squats Max Test", "Jump Squats 5×15", "Split Squats 5×12", "Wall Sit Max", "Leg Burnout"] },
        { day: 4, name: "Rest", exercises: ["Rest and eat well"] },
        { day: 5, name: "FINAL TEST", exercises: ["Max Push-ups 2 min", "Max Squats 3 min", "Max Plank", "Max Dead Hang", "Record all numbers!"] },
        { day: 6, name: "Deload", exercises: ["Light full body 20 min", "Deep stretch 20 min"] },
        { day: 7, name: "Done!", exercises: ["Compare Week 1 vs Week 4 numbers!", "Progress photos!"] },
      ]},
    ],
  },
];

export default function WorkoutPrograms({ programData, setProgramData, addXP }) {
  const d = today();
  const data = programData || { active: null, completed: [], dayLog: {} };
  const [tab, setTab] = useState(data.active ? "active" : "browse");

  const save = (nd) => setProgramData(nd);

  const startProgram = (prog) => {
    save({ ...data, active: { ...prog, startDate: d, currentWeek: 1, currentDay: 1 } });
    setTab("active");
  };

  const completeDay = () => {
    if (!data.active) return;
    const key = `${data.active.id}_w${data.active.currentWeek}_d${data.active.currentDay}`;
    const newLog = { ...data.dayLog, [key]: { date: d, completed: true } };
    let nextDay = data.active.currentDay + 1;
    let nextWeek = data.active.currentWeek;
    const weekData = data.active.schedule[nextWeek - 1];
    if (nextDay > (weekData?.days?.length || 7)) { nextDay = 1; nextWeek++; }
    const totalWeeks = data.active.schedule.length;
    if (nextWeek > totalWeeks && nextDay === 1) {
      addXP(300, `Program complete: ${data.active.name}`);
      save({ ...data, active: null, completed: [...data.completed, { name: data.active.name, completedDate: d }], dayLog: newLog });
      setTab("browse");
      return;
    }
    addXP(15, "Program day complete");
    save({ ...data, active: { ...data.active, currentWeek: nextWeek, currentDay: nextDay }, dayLog: newLog });
  };

  const act = data.active;
  const weekData = act ? act.schedule[act.currentWeek - 1] : null;
  const dayData = weekData ? weekData.days[act.currentDay - 1] : null;
  const totalDays = act ? act.schedule.reduce((s, w) => s + w.days.length, 0) : 0;
  const doneDays = act ? Object.keys(data.dayLog).filter(k => k.startsWith(act.id)).length : 0;

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>📋 Workout Programs</h2>
        <p style={{ color: "#6b7280", fontSize: 13, marginTop: 4 }}>Structured programs to follow week by week</p>
      </div>

      <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 16 }}>
        {[["browse", "📋 Programs"], ["active", "🔥 Active"]].map(([k, l]) => (
          <span key={k} className={`chip ${tab === k ? "chip-a" : "chip-i"}`} onClick={() => setTab(k)} style={{ padding: "8px 16px" }}>{l}</span>
        ))}
      </div>

      {tab === "browse" && (
        <div>
          {PROGRAMS.map(p => {
            const isDone = data.completed.some(c => c.name === p.name);
            const isActive = act?.id === p.id;
            return (
              <div key={p.id} className="gs" style={{ marginBottom: 14, border: isDone ? "1px solid rgba(34,197,94,.15)" : undefined }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: `${p.color}10`, border: `1px solid ${p.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>{p.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: p.color, marginTop: 2 }}>{p.duration} · {p.difficulty}</div>
                    <div style={{ fontSize: 13, color: "#6b7280", marginTop: 6, lineHeight: 1.5 }}>{p.desc}</div>
                    <div style={{ fontSize: 12, color: "#4b5563", marginTop: 6 }}>{p.schedule.length} weeks · {p.schedule.reduce((s, w) => s + w.days.length, 0)} days</div>
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  {isDone ? <span style={{ fontSize: 12, color: "#22c55e", fontWeight: 600 }}>✅ Completed</span>
                    : isActive ? <span style={{ fontSize: 12, color: p.color, fontWeight: 600 }}>Currently active</span>
                    : <button className="bp" onClick={() => startProgram(p)} disabled={!!act} style={{ width: "100%", padding: 12 }}>{act ? "Finish current program first" : "Start Program"}</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "active" && (
        <div>
          {!act ? (
            <div className="gs" style={{ textAlign: "center", padding: "30px 0" }}>
              <div style={{ color: "#6b7280", fontSize: 14 }}>No active program. Browse and start one!</div>
            </div>
          ) : (
            <div>
              <div className="gs" style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>{act.icon} {act.name}</div>
                    <div style={{ fontSize: 13, color: "#6b7280" }}>Week {act.currentWeek} · Day {act.currentDay} · {weekData?.name}</div>
                  </div>
                  <span onClick={() => save({ ...data, active: null })} style={{ fontSize: 12, color: "#ef4444", cursor: "pointer" }}>Quit</span>
                </div>
                <div style={{ height: 10, background: "rgba(255,255,255,.04)", borderRadius: 5, overflow: "hidden", marginBottom: 8 }}>
                  <div style={{ height: "100%", width: `${(doneDays / totalDays) * 100}%`, background: act.color, borderRadius: 5, transition: "width .5s" }} />
                </div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{doneDays}/{totalDays} days complete · {Math.round((doneDays / totalDays) * 100)}%</div>
              </div>

              {dayData && (
                <div className="gs" style={{ marginBottom: 16, border: `1px solid ${act.color}15` }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: act.color, fontFamily: "Rajdhani,sans-serif", marginBottom: 8 }}>Day {act.currentDay}: {dayData.name}</div>
                  {dayData.exercises.map((ex, i) => (
                    <div key={i} style={{ fontSize: 14, color: "#d1d5db", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,.03)", paddingLeft: 12, borderLeft: `2px solid ${act.color}20` }}>{ex}</div>
                  ))}
                  <button className="bp" onClick={completeDay} style={{ width: "100%", marginTop: 14, padding: 14, fontSize: 15 }}>✓ Complete Day {act.currentDay}</button>
                </div>
              )}

              {/* Week overview */}
              <div className="gs">
                <div className="sl">Week {act.currentWeek} Overview</div>
                {weekData?.days.map((wd, i) => {
                  const key = `${act.id}_w${act.currentWeek}_d${i + 1}`;
                  const done = !!data.dayLog[key];
                  const isCurrent = i + 1 === act.currentDay;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,.03)", opacity: done ? 0.5 : 1 }}>
                      <div style={{ width: 24, height: 24, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, ...(done ? { background: act.color, color: "#060a0c" } : isCurrent ? { border: `2px solid ${act.color}` } : { border: "2px solid #374151" }) }}>{done ? "✓" : i + 1}</div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: isCurrent ? 600 : 400, color: isCurrent ? "#f3f4f6" : done ? "#6b7280" : "#d1d5db", textDecoration: done ? "line-through" : "none" }}>{wd.name}</div>
                        <div style={{ fontSize: 11, color: "#4b5563" }}>{wd.exercises.length} exercises</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
