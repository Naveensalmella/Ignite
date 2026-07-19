import { useState, useRef } from 'react';

export default function BodyProgress({ bodyPhotos = {}, setBodyPhotos = () => { } }) {
    const [viewMode, setViewMode] = useState("grid"); // grid | compare
    const [compareA, setCompareA] = useState(null);
    const [compareB, setCompareB] = useState(null);
    const fileRef = useRef(null);

    const sortedDates = Object.keys(bodyPhotos).sort().reverse();

    // Add photo
    const addPhoto = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const d = new Date().toISOString().split("T")[0];
            const note = prompt("Add a note (optional):", "") || "";
            setBodyPhotos(prev => ({
                ...prev,
                [d]: {
                    photo: ev.target.result,
                    date: d,
                    note,
                    weight: prompt("Current weight (kg):", "") || "",
                }
            }));
        };
        reader.readAsDataURL(file);
    };

    // Delete photo
    const deletePhoto = (date) => {
        if (!window.confirm("Delete this progress photo?")) return;
        setBodyPhotos(prev => {
            const updated = { ...prev };
            delete updated[date];
            return updated;
        });
    };

    return (
        <div style={{ maxWidth: "100%", overflowX: "hidden" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>📸 Body Progress</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>{sortedDates.length} photos · Track your transformation</div>
                </div>
                <button className="bp" onClick={() => fileRef.current?.click()} style={{ padding: "8px 16px", fontSize: 13 }}>+ Add Photo</button>
                <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={addPhoto} style={{ display: "none" }} />
            </div>

            {/* View toggle */}
            {sortedDates.length >= 2 && (
                <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                    <span className={`chip ${viewMode === "grid" ? "chip-a" : "chip-i"}`} onClick={() => setViewMode("grid")} style={{ flex: 1, textAlign: "center" }}>📷 Gallery</span>
                    <span className={`chip ${viewMode === "compare" ? "chip-a" : "chip-i"}`} onClick={() => setViewMode("compare")} style={{ flex: 1, textAlign: "center" }}>🔄 Compare</span>
                </div>
            )}

            {/* Empty state */}
            {sortedDates.length === 0 && (
                <div className="gs" style={{ textAlign: "center", padding: 40 }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📸</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>No photos yet</div>
                    <p style={{ fontSize: 13, color: "#6b7280", marginTop: 6, maxWidth: 280, margin: "6px auto 0" }}>Take your first progress photo! Monthly photos show incredible transformations over time.</p>
                    <button className="bp" onClick={() => fileRef.current?.click()} style={{ marginTop: 16, padding: "12px 24px" }}>📸 Take First Photo</button>
                </div>
            )}

            {/* Grid view */}
            {viewMode === "grid" && sortedDates.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
                    {sortedDates.map(date => {
                        const entry = bodyPhotos[date];
                        return (
                            <div key={date} className="gs" style={{ padding: 0, overflow: "hidden", borderRadius: 12, position: "relative" }}>
                                <img src={entry.photo} alt={`Progress ${date}`} style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }} />
                                <div style={{ padding: "8px 10px" }}>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: "#f3f4f6" }}>
                                        {new Date(date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                    </div>
                                    {entry.weight && <div style={{ fontSize: 11, color: "#10b981" }}>{entry.weight} kg</div>}
                                    {entry.note && <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>{entry.note}</div>}
                                </div>
                                <button onClick={() => deletePhoto(date)} style={{ position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: "50%", background: "rgba(0,0,0,.6)", border: "none", color: "#ef4444", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Compare view */}
            {viewMode === "compare" && sortedDates.length >= 2 && (
                <div>
                    <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                        {/* Left selector */}
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6, textAlign: "center" }}>BEFORE</div>
                            <select className="inp" value={compareA || ""} onChange={e => setCompareA(e.target.value)} style={{ width: "100%", fontSize: 12 }}>
                                <option value="">Select date</option>
                                {sortedDates.map(d => <option key={d} value={d}>{new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}</option>)}
                            </select>
                        </div>
                        {/* Right selector */}
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6, textAlign: "center" }}>AFTER</div>
                            <select className="inp" value={compareB || ""} onChange={e => setCompareB(e.target.value)} style={{ width: "100%", fontSize: 12 }}>
                                <option value="">Select date</option>
                                {sortedDates.map(d => <option key={d} value={d}>{new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Comparison display */}
                    {compareA && compareB && bodyPhotos[compareA] && bodyPhotos[compareB] && (
                        <div className="fade-in">
                            <div style={{ display: "flex", gap: 6 }}>
                                <div style={{ flex: 1, borderRadius: 12, overflow: "hidden", border: "1px solid rgba(239,68,68,.2)" }}>
                                    <img src={bodyPhotos[compareA].photo} alt="Before" style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }} />
                                    <div style={{ padding: "8px 10px", textAlign: "center" }}>
                                        <div style={{ fontSize: 11, color: "#ef4444", fontWeight: 600 }}>BEFORE</div>
                                        <div style={{ fontSize: 10, color: "#6b7280" }}>{new Date(compareA + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
                                        {bodyPhotos[compareA].weight && <div style={{ fontSize: 12, color: "#f3f4f6", fontWeight: 700 }}>{bodyPhotos[compareA].weight} kg</div>}
                                    </div>
                                </div>
                                <div style={{ flex: 1, borderRadius: 12, overflow: "hidden", border: "1px solid rgba(34,197,94,.2)" }}>
                                    <img src={bodyPhotos[compareB].photo} alt="After" style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }} />
                                    <div style={{ padding: "8px 10px", textAlign: "center" }}>
                                        <div style={{ fontSize: 11, color: "#22c55e", fontWeight: 600 }}>AFTER</div>
                                        <div style={{ fontSize: 10, color: "#6b7280" }}>{new Date(compareB + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
                                        {bodyPhotos[compareB].weight && <div style={{ fontSize: 12, color: "#f3f4f6", fontWeight: 700 }}>{bodyPhotos[compareB].weight} kg</div>}
                                    </div>
                                </div>
                            </div>

                            {/* Weight difference */}
                            {bodyPhotos[compareA].weight && bodyPhotos[compareB].weight && (() => {
                                const diff = parseFloat(bodyPhotos[compareB].weight) - parseFloat(bodyPhotos[compareA].weight);
                                const daysDiff = Math.round((new Date(compareB) - new Date(compareA)) / (24 * 60 * 60 * 1000));
                                return (
                                    <div className="gs" style={{ marginTop: 12, padding: 12, textAlign: "center" }}>
                                        <div style={{ fontSize: 22, fontWeight: 900, color: diff <= 0 ? "#22c55e" : "#f59e0b", fontFamily: "Rajdhani,sans-serif" }}>
                                            {diff > 0 ? "+" : ""}{diff.toFixed(1)} kg
                                        </div>
                                        <div style={{ fontSize: 11, color: "#6b7280" }}>in {daysDiff} days</div>
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {(!compareA || !compareB) && (
                        <div style={{ textAlign: "center", padding: "30px 0", color: "#6b7280", fontSize: 13 }}>Select two dates above to compare photos side by side</div>
                    )}
                </div>
            )}

            {/* Tips */}
            {sortedDates.length > 0 && sortedDates.length < 3 && (
                <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 10, background: "rgba(16,185,129,.04)", border: "1px solid rgba(16,185,129,.1)", fontSize: 12, color: "#10b981" }}>
                    💡 Take photos monthly in the same lighting, pose, and clothing for the best comparison.
                </div>
            )}
        </div>
    );
}