export default function ExerciseDetail({ exercise, onClose, onStart }) {
    if (!exercise) return null;
    return (
        <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 50, overflowY: "auto", padding: 16 }}>
            <button onClick={onClose} style={{ color: "#9ca3af", background: "none", border: "none", marginBottom: 12 }}>← Back</button>
            <img src={exercise.gifUrl || exercise.imageUrl} alt={exercise.name}
                style={{ width: "100%", borderRadius: 14, marginBottom: 14 }} />
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>{exercise.name}</div>
            <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 14 }}>
                {exercise.bodyParts?.join(", ")} · {exercise.equipments?.join(", ")}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Target Muscles</div>
            <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 14 }}>{exercise.targetMuscles?.join(", ")}</div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Instructions</div>
            <ol style={{ fontSize: 13, color: "#d1d5db", paddingLeft: 18, marginBottom: 20 }}>
                {exercise.instructions?.map((step, i) => <li key={i} style={{ marginBottom: 6 }}>{step}</li>)}
            </ol>
            <button onClick={() => onStart(exercise)}
                style={{ width: "100%", padding: 14, background: "#10b981", color: "#000", fontWeight: 700, borderRadius: 12, border: "none" }}>
                Add to Workout
            </button>
        </div>
    );
}