// src/lib/workoutHelpers.js
// Handles both old format (workoutLog[date] = single object) and new format (workoutLog[date] = array)

export function getDayEntries(workoutLog, date) {
    const raw = workoutLog?.[date];
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    return [raw]; // legacy single object
}

export function hasDayWorkout(workoutLog, date) {
    return getDayEntries(workoutLog, date).length > 0;
}

export function getDayCal(workoutLog, date) {
    return getDayEntries(workoutLog, date).reduce((s, w) => s + (w.calBurned || w.cal || 0), 0);
}

export function getDayDuration(workoutLog, date) {
    return getDayEntries(workoutLog, date).reduce((s, w) => s + (w.duration || 0), 0);
}

export function getDaySplit(workoutLog, date) {
    const entries = getDayEntries(workoutLog, date);
    return entries.length > 0 ? entries.map(e => e.splitName || "Training").join(", ") : null;
}

export function getTotalCal(workoutLog) {
    return Object.keys(workoutLog || {}).reduce((s, d) => s + getDayCal(workoutLog, d), 0);
}

export function countWorkoutDays(workoutLog) {
    return Object.keys(workoutLog || {}).filter(d => hasDayWorkout(workoutLog, d)).length;
}