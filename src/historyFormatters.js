// ═══════════════════════════════════════
// IGNITE — History Data Formatters
// Converts raw data from each section into
// HistoryPanel-compatible entries
// ═══════════════════════════════════════

const fmt = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

// ── TRAINING ──
export function formatTrainingHistory(workoutLog) {
    return Object.entries(workoutLog || {}).map(([date, w]) => ({
        date,
        icon: "⚔️",
        title: w.splitName || "Training Session",
        subtitle: `${fmt(w.duration || 0)} · ${w.exerciseCount || 0} exercises`,
        value: `${w.calBurned || 0} cal`,
        valueColor: "#10b981",
        badge: w.verified ? { text: "✓ Verified", color: "#22c55e" } : w.photo ? { text: "📸 Photo", color: "#06b6d4" } : null,
        photo: w.photo || null,
        details: [
            { label: "Duration", value: fmt(w.duration || 0) },
            { label: "Calories", value: `${w.calBurned || 0} cal`, color: "#ef4444" },
            { label: "Activity", value: w.activity || w.type || "Training" },
            { label: "Focus", value: w.focus || "Full Body" },
            { label: "Completed At", value: w.completedAt || "—" },
            { label: "Exercises", value: `${w.exerciseCount || 0} total` },
        ],
        items: [
            ...(w.exercises || []).map(name => ({ icon: "💪", text: name })),
            ...(w.fighting || []).map(name => ({ icon: "⚔️", text: name, sub: "Combat" })),
        ],
    }));
}

// ── NUTRITION ──
export function formatNutritionHistory(foodLog) {
    const dates = Object.keys(foodLog || {}).filter(k => !k.startsWith("water_") && Array.isArray(foodLog[k]) && foodLog[k].length > 0);
    return dates.map(date => {
        const items = foodLog[date] || [];
        const cal = items.reduce((s, f) => s + (f.cal || 0), 0);
        const protein = items.reduce((s, f) => s + (f.protein || 0), 0);
        const carbs = items.reduce((s, f) => s + (f.carbs || 0), 0);
        const fat = items.reduce((s, f) => s + (f.fat || 0), 0);
        const fiber = items.reduce((s, f) => s + (f.fiber || 0), 0);
        const water = foodLog[`water_${date}`] || 0;
        const meals = [...new Set(items.map(f => f.meal).filter(Boolean))];

        return {
            date,
            icon: "🍎",
            title: `${items.length} items logged`,
            subtitle: `${meals.join(", ")} · 💧${water} glasses`,
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
                text: `${f.name}${f.qty && f.qty !== 1 ? ` ×${f.qty}` : ""}`,
                sub: `${f.meal || ""} ${f.time || ""}`,
                value: `${f.cal}cal`,
                valueColor: "#f59e0b",
            })),
        };
    });
}

// ── QUEST ──
export function formatQuestHistory(habitLog, workoutLog, habits) {
    return Object.entries(habitLog || {}).map(([date, checked]) => {
        const trained = !!(workoutLog && workoutLog[date]);
        const questNames = (checked || []).map(id => {
            const h = (habits || []).find(h => h.id === id);
            return h ? h.name : id;
        });

        return {
            date,
            icon: trained ? "✅" : "🎯",
            title: `${checked.length} quest${checked.length !== 1 ? "s" : ""} completed`,
            subtitle: trained ? "Training complete ✓" : "Training not done",
            value: trained ? "Complete" : "Partial",
            valueColor: trained ? "#22c55e" : "#f59e0b",
            badge: trained ? { text: "Trained", color: "#22c55e" } : null,
            details: [
                { label: "Quests Done", value: checked.length },
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
    return Object.entries(focusLog || {}).filter(([_, sessions]) => Array.isArray(sessions) && sessions.length > 0).map(([date, sessions]) => {
        const totalMin = sessions.reduce((s, sess) => s + (sess.duration || 0), 0);
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
                text: `${sess.tagLabel || sess.tag || "Focus"} — ${sess.duration}min`,
                sub: sess.time || "",
                value: `${sess.duration}m`,
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

    return Object.entries(journal || {}).filter(([_, e]) => e && (e.mood || e.entry)).map(([date, e]) => {
        const mood = e.mood || 0;
        const hasJournal = e.entry && e.entry.length > 10;
        const gratCount = (e.gratitude || []).filter(g => g && g.trim()).length;
        const wordCount = hasJournal ? e.entry.split(/\s+/).filter(w => w).length : 0;

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
                ...(e.gratitude || []).filter(g => g && g.trim()).map((g, i) => ({
                    icon: "🙏", text: g, sub: `Gratitude ${i + 1}`,
                })),
                ...(hasJournal ? [{
                    icon: "📝",
                    text: e.entry.length > 100 ? e.entry.slice(0, 100) + "..." : e.entry,
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
    (finances || []).forEach(f => {
        const date = f.date || "unknown";
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(f);
    });

    return Object.entries(grouped).map(([date, items]) => {
        const income = items.filter(f => f.type === "income").reduce((s, f) => s + f.amount, 0);
        const expense = items.filter(f => f.type === "expense").reduce((s, f) => s + f.amount, 0);
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
                text: `${f.note || f.category || "Transaction"}`,
                sub: `${f.category} ${f.time || ""}`,
                value: `${f.type === "income" ? "+" : "−"}₹${f.amount.toLocaleString()}`,
                valueColor: f.type === "income" ? "#22c55e" : "#ef4444",
            })),
        };
    });
}