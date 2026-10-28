// ═══════════════════════════════════════
// IGNITE — History Data Formatters
// Converts raw data from each section into
// HistoryPanel-compatible entries
// ═══════════════════════════════════════

import { toArr } from '@/utils';
const num = v => (Number.isFinite(Number(v)) ? Number(v) : 0);
const fmt = s => { const t = Math.max(0, Math.round(num(s))); return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`; };
const str = v => (typeof v === "string" ? v : typeof v === "number" && Number.isFinite(v) ? String(v) : "");

// workoutLog[date] is either a legacy single object, an array of entries, or a
// Firestore-mangled array ({0: {...}, 1: {...}})
function dayWorkoutEntries(w) {
    if (!w || typeof w !== "object") return [];
    if (Array.isArray(w)) return w.filter(e => e && typeof e === "object");
    const keys = Object.keys(w);
    if (keys.length > 0 && keys.every(k => !isNaN(k))) return Object.values(w).filter(e => e && typeof e === "object");
    return [w];
}

// Exercises may be stored as names or as objects ({ name, sets, ... })
const exerciseName = ex => (typeof ex === "string" ? ex : str(ex?.name || ex?.exercise || ex?.title) || "Exercise");

// ── TRAINING ──
export function formatTrainingHistory(workoutLog) {
    return Object.entries(workoutLog || {}).flatMap(([date, raw]) => dayWorkoutEntries(raw).map(w => {
        const exercises = toArr(w.exercises).length ? toArr(w.exercises) : toArr(w.gym?.exercises);
        const exerciseCount = num(w.exerciseCount) || exercises.length;
        const completedAt = typeof w.completedAt === "number" && w.completedAt > 0
            ? new Date(w.completedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : str(w.completedAt) || "—";
        return {
            date,
            icon: "⚔️",
            title: str(w.splitName) || "Training Session",
            subtitle: `${fmt(w.duration)} · ${exerciseCount} exercises`,
            value: `${num(w.calBurned)} cal`,
            valueColor: "#10b981",
            badge: w.verified ? { text: "✓ Verified", color: "#22c55e" } : w.photo ? { text: "📸 Photo", color: "#06b6d4" } : null,
            photo: typeof w.photo === "string" ? w.photo : null,
            details: [
                { label: "Duration", value: fmt(w.duration) },
                { label: "Calories", value: `${num(w.calBurned)} cal`, color: "#ef4444" },
                { label: "Activity", value: str(w.activity || w.trainingType || w.type) || "Training" },
                { label: "Focus", value: str(w.focus) || "Full Body" },
                { label: "Completed At", value: completedAt },
                { label: "Exercises", value: `${exerciseCount} total` },
            ],
            items: [
                ...exercises.map(ex => ({ icon: "💪", text: exerciseName(ex) })),
                ...toArr(w.fighting).map(ex => ({ icon: "⚔️", text: exerciseName(ex), sub: "Combat" })),
            ],
        };
    }));
}

// ── NUTRITION ──
export function formatNutritionHistory(foodLog) {
    const dates = Object.keys(foodLog || {}).filter(k => !k.startsWith("water_") && toArr(foodLog[k]).length > 0);
    return dates.map(date => {
        const items = toArr(foodLog[date]).filter(f => f && typeof f === "object");
        const cal = Math.round(items.reduce((s, f) => s + num(f.cal), 0));
        const protein = items.reduce((s, f) => s + num(f.protein), 0);
        const carbs = items.reduce((s, f) => s + num(f.carbs), 0);
        const fat = items.reduce((s, f) => s + num(f.fat), 0);
        const fiber = items.reduce((s, f) => s + num(f.fiber), 0);
        const water = num(foodLog[`water_${date}`]);
        const meals = [...new Set(items.map(f => f.meal).filter(Boolean))];

        return {
            date,
            icon: "🍎",
            title: `${items.length} item${items.length !== 1 ? "s" : ""} logged`,
            subtitle: [meals.join(", "), `💧${water} glasses`].filter(Boolean).join(" · "),
            value: `${cal} cal`,
            valueColor: "#f59e0b",
            details: [
                { label: "Calories", value: `${cal}`, color: "#f59e0b" },
                { label: "Protein", value: `${Math.round(protein)}g`, color: "#ef4444" },
                { label: "Carbs", value: `${Math.round(carbs)}g`, color: "#f59e0b" },
                { label: "Fat", value: `${Math.round(fat)}g`, color: "#06b6d4" },
                { label: "Fiber", value: `${Math.round(fiber)}g`, color: "#22c55e" },
                { label: "Water", value: `${water} glasses`, color: "#06b6d4" },
            ],
            items: items.map(f => ({
                icon: f.emoji || "🍽️",
                text: `${str(f.name) || "Food"}${f.qty && f.qty !== 1 ? ` ×${f.qty}` : ""}`,
                sub: `${str(f.meal)} ${str(f.time)}`.trim(),
                value: `${Math.round(num(f.cal))}cal`,
                valueColor: "#f59e0b",
            })),
        };
    });
}

// ── QUEST ──
export function formatQuestHistory(habitLog, workoutLog, habits) {
    const habitList = toArr(habits);
    return Object.entries(habitLog || {}).map(([date, checked]) => {
        const trained = !!(workoutLog && workoutLog[date]);
        // habitLog[date] is {habitId: bool}; legacy data may be an array of habit ids
        const doneIds = Array.isArray(checked)
            ? checked.filter(id => typeof id === "string" || typeof id === "number")
            : checked && typeof checked === "object"
                ? Object.keys(checked).filter(id => checked[id] === true)
                : [];
        const questNames = doneIds.map(id => {
            const h = habitList.find(h => h?.id === id);
            return h ? str(h.name) : str(id);
        });
        const doneCount = doneIds.length;

        return {
            date,
            icon: trained ? "✅" : "🎯",
            title: `${doneCount} quest${doneCount !== 1 ? "s" : ""} completed`,
            subtitle: trained ? "Training complete ✓" : "Training not done",
            value: trained ? "Complete" : "Partial",
            valueColor: trained ? "#22c55e" : "#f59e0b",
            badge: trained ? { text: "Trained", color: "#22c55e" } : null,
            details: [
                { label: "Quests Done", value: doneCount },
                { label: "Training", value: trained ? "✓ Complete" : "✗ Missed", color: trained ? "#22c55e" : "#ef4444" },
            ],
            items: [
                ...(trained ? [{ icon: "⚔️", text: "Daily Training", sub: "Compulsory", value: "✓", valueColor: "#22c55e" }] : []),
                ...questNames.map(name => ({ icon: "✓", text: name, valueColor: "#10b981" })),
            ],
        };
    });
}

// ── FOCUS ──
export function formatFocusHistory(focusLog) {
    return Object.entries(focusLog || {}).filter(([, sessions]) => toArr(sessions).length > 0).map(([date, rawSessions]) => {
        const sessions = toArr(rawSessions).filter(s => s && typeof s === "object");
        const totalMin = Math.round(sessions.reduce((s, sess) => s + num(sess.duration), 0));
        const totalSessions = sessions.length;
        const tags = [...new Set(sessions.map(s => s.tagLabel || s.tag).filter(Boolean))];

        return {
            date,
            icon: "⏱️",
            title: `${totalSessions} focus session${totalSessions !== 1 ? "s" : ""}`,
            subtitle: tags.join(", ") || "Focused work",
            value: `${totalMin} min`,
            valueColor: "#06b6d4",
            details: [
                { label: "Sessions", value: totalSessions },
                { label: "Total Time", value: `${Math.floor(totalMin / 60)}h ${totalMin % 60}m` },
                { label: "Categories", value: tags.join(", ") || "—" },
            ],
            items: sessions.map(sess => ({
                icon: "⚡",
                text: `${str(sess.tagLabel || sess.tag) || "Focus"} — ${num(sess.duration)}min`,
                sub: str(sess.time || (sess.start ? new Date(sess.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "")),
                value: `${num(sess.duration)}m`,
                valueColor: "#06b6d4",
            })),
        };
    });
}

// ── WELLNESS ──
export function formatWellnessHistory(journal) {
    const MOOD_MAP = { 1: "😫", 2: "😔", 3: "😐", 4: "🙂", 5: "😄" };
    const MOOD_LABELS = { 1: "Burned Out", 2: "Low Flame", 3: "Steady", 4: "Blazing", 5: "On Fire" };
    const MOOD_COLORS = { 1: "#ef4444", 2: "#f97316", 3: "#f59e0b", 4: "#22c55e", 5: "#10b981" };

    return Object.entries(journal || {}).filter(([, e]) => e && typeof e === "object" && (e.mood || e.entry)).map(([date, e]) => {
        const mood = e.mood || 0;
        const entryText = str(e.entry);
        const hasJournal = entryText.length > 10;
        const gratitude = toArr(e.gratitude).filter(g => typeof g === "string" && g.trim());
        const gratCount = gratitude.length;
        const wordCount = hasJournal ? entryText.split(/\s+/).filter(w => w).length : 0;

        return {
            date,
            icon: MOOD_MAP[mood] || "💛",
            title: MOOD_LABELS[mood] || "Check-in",
            subtitle: [
                hasJournal ? `${wordCount} words` : null,
                gratCount > 0 ? `${gratCount} gratitudes` : null,
            ].filter(Boolean).join(" · ") || "Mood logged",
            value: mood > 0 ? `${mood}/5` : "—",
            valueColor: MOOD_COLORS[mood] || "#6b7280",
            details: [
                { label: "Mood", value: `${MOOD_MAP[mood] || "—"} ${MOOD_LABELS[mood] || ""}`, color: MOOD_COLORS[mood] },
                { label: "Journal", value: hasJournal ? `${wordCount} words` : "Not written" },
                { label: "Gratitude", value: `${gratCount}/3 written` },
            ],
            items: [
                ...gratitude.map((g, i) => ({
                    icon: "🙏", text: g, sub: `Gratitude ${i + 1}`,
                })),
                ...(hasJournal ? [{
                    icon: "📝",
                    text: entryText.length > 100 ? entryText.slice(0, 100) + "..." : entryText,
                    sub: `${wordCount} words`,
                }] : []),
            ],
        };
    });
}

// ── FINANCE ──
export function formatFinanceHistory(finances) {
    // Group by date
    const grouped = {};
    toArr(finances).forEach(f => {
        if (!f || typeof f !== "object") return;
        const date = f.date || "unknown";
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(f);
    });

    return Object.entries(grouped).map(([date, items]) => {
        const income = items.filter(f => f.type === "income").reduce((s, f) => s + num(f.amount), 0);
        const expense = items.filter(f => f.type === "expense").reduce((s, f) => s + num(f.amount), 0);
        const net = income - expense;

        return {
            date,
            icon: net >= 0 ? "💰" : "💸",
            title: `${items.length} transaction${items.length !== 1 ? "s" : ""}`,
            subtitle: income > 0 ? `+₹${income.toLocaleString()} income` : `${items.length} expenses`,
            value: `₹${expense > 0 ? expense.toLocaleString() : income.toLocaleString()}`,
            valueColor: net >= 0 ? "#22c55e" : "#ef4444",
            details: [
                { label: "Income", value: `+₹${income.toLocaleString()}`, color: "#22c55e" },
                { label: "Expense", value: `-₹${expense.toLocaleString()}`, color: "#ef4444" },
                { label: "Net", value: `₹${net.toLocaleString()}`, color: net >= 0 ? "#22c55e" : "#ef4444" },
                { label: "Transactions", value: items.length },
            ],
            items: items.map(f => ({
                icon: f.type === "income" ? "📈" : "📉",
                text: `${str(f.note || f.category) || "Transaction"}`,
                sub: `${str(f.category)} ${str(f.time)}`.trim(),
                value: `${f.type === "income" ? "+" : "−"}₹${num(f.amount).toLocaleString()}`,
                valueColor: f.type === "income" ? "#22c55e" : "#ef4444",
            })),
        };
    });
}