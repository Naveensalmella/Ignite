import { useState, useEffect } from 'react';

export default function ExerciseLibrary({ onSelectExercise }) {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/exercises?offset=${offset}&limit=20`)
      .then(res => res.json())
      .then(data => {
        const list = data.exercises || [];
        setExercises(prev => offset === 0 ? list : [...prev, ...list]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [offset]);

  const filtered = query.trim()
    ? exercises.filter(ex => ex.name.toLowerCase().includes(query.trim().toLowerCase()))
    : exercises;

  return (
    <div>
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search exercises..."
        style={{ width: "100%", padding: 12, borderRadius: 10, marginBottom: 10, fontSize: 14 }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {filtered.map(ex => (
          <div key={ex.exerciseId} onClick={() => onSelectExercise(ex)}
            style={{ background: "#141414", borderRadius: 12, overflow: "hidden", cursor: "pointer" }}>
            <img src={ex.gifUrl || ex.imageUrl} alt={ex.name}
              style={{ width: "100%", height: 100, objectFit: "cover" }} />
            <div style={{ padding: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>{ex.name}</div>
              <div style={{ fontSize: 10, color: "#6b7280" }}>{ex.bodyParts?.[0]}</div>
            </div>
          </div>
        ))}
      </div>
      {loading && <div style={{ textAlign: "center", padding: 16, color: "#6b7280" }}>Loading...</div>}
      {!loading && (
        <button onClick={() => setOffset(o => o + 20)}
          style={{ width: "100%", padding: 12, marginTop: 10, background: "#1a1a1a", color: "#fff", borderRadius: 10, border: "none" }}>
          Load More
        </button>
      )}
    </div>
  );
}