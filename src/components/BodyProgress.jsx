"use client";
import { useState, useRef } from 'react';
import storeV2 from '@/store-v2';
import { today, parseDateKey } from '@/utils';

const fmtDate = (key, opts) => { const dt = parseDateKey(key); return isNaN(dt) ? String(key || "") : dt.toLocaleDateString("en-IN", opts); };

// Phone camera photos are several MB; a Firestore document is capped at 1MB, so the
// raw data URL would silently fail to save. Downscale + JPEG-compress first.
function compressImage(file, maxDim = 900, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            try {
                const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
                const c = document.createElement("canvas");
                c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
                c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
                resolve(c.toDataURL("image/jpeg", quality));
            } catch (err) { reject(err); } finally { URL.revokeObjectURL(url); }
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read image")); };
        img.src = url;
    });
}

export default function BodyProgress({ bodyPhotos = {}, setBodyPhotos = () => { }, userId = null }) {
    const [viewMode, setViewMode] = useState("grid"); // grid | compare
    const [compareA, setCompareA] = useState(null);
    const [compareB, setCompareB] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef(null);

    // Firestore data is untrusted: ignore null / photo-less entries
    const photos = bodyPhotos && typeof bodyPhotos === "object" ? bodyPhotos : {};
    const sortedDates = Object.keys(photos).filter(k => photos[k] && photos[k].photo).sort().reverse();
    // Compare needs 2+ photos; fall back to the gallery if photos were deleted
    const mode = sortedDates.length >= 2 ? viewMode : "grid";

    // Add photo — saves to Firestore subcollection via store-v2
    const addPhoto = async (e) => {
        const input = e.target;
        const file = input.files?.[0];
        input.value = ""; // allow picking the same file again later
        if (!file) return;
        const d = today();
        if (photos[d] && !window.confirm("You already have a photo for today. Replace it?")) return;
        const note = (prompt("Add a note (optional):", "") || "").trim();
        const w = parseFloat(prompt("Current weight (kg):", "") || "");
        const weight = Number.isFinite(w) && w > 0 ? String(w) : "";

        setUploading(true);
        try {
            const dataUrl = await compressImage(file);
            // Update UI immediately
            setBodyPhotos(prev => ({
                ...(prev || {}),
                [d]: { photo: dataUrl, date: d, note, weight }
            }));
            // Save to subcollection (each photo = its own Firestore doc)
            if (userId) await storeV2.saveBodyPhoto(userId, d, dataUrl, note, weight);
        } catch (err) {
            console.error("Photo save failed:", err);
            window.alert("Couldn't add that photo. Please try a different image.");
        } finally {
            setUploading(false);
        }
    };

    // Delete photo — removes from Storage + Firestore subcollection
    const deletePhoto = async (date) => {
        if (!window.confirm("Delete this progress photo?")) return;
        setBodyPhotos(prev => {
            const updated = { ...(prev || {}) };
            delete updated[date];
            return updated;
        });
        if (compareA === date) setCompareA(null);
        if (compareB === date) setCompareB(null);
        // Delete from Storage + subcollection
        if (userId) {
            try { await storeV2.deleteBodyPhoto(userId, date); } catch (e) { console.error("Delete error:", e); }
        }
    };

    return (
        <div style={{ maxWidth: "100%", overflowX: "hidden" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>📸 Body Progress</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>{sortedDates.length} photos · Track your transformation</div>
                </div>
                <button className="bp" onClick={() => fileRef.current?.click()} disabled={uploading} style={{ padding: "8px 16px", fontSize: 13, opacity: uploading ? 0.6 : 1 }}>{uploading ? "Uploading..." : "+ Add Photo"}</button>
                <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={addPhoto} aria-label="Add progress photo" style={{ display: "none" }} />
            </div>

            {/* View toggle */}
            {sortedDates.length >= 2 && (
                <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                    <span className={`chip ${mode === "grid" ? "chip-a" : "chip-i"}`} onClick={() => setViewMode("grid")} style={{ flex: 1, textAlign: "center" }}>📷 Gallery</span>
                    <span className={`chip ${mode === "compare" ? "chip-a" : "chip-i"}`} onClick={() => setViewMode("compare")} style={{ flex: 1, textAlign: "center" }}>🔄 Compare</span>
                </div>
            )}

            {/* Empty state */}
            {sortedDates.length === 0 && (
                <div className="gs" style={{ textAlign: "center", padding: 40 }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📸</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>No photos yet</div>
                    <p style={{ fontSize: 13, color: "#6b7280", marginTop: 6, maxWidth: 280, margin: "6px auto 0" }}>Take your first progress photo! Monthly photos show incredible transformations over time.</p>
                    <button className="bp" onClick={() => fileRef.current?.click()} disabled={uploading} style={{ marginTop: 16, padding: "12px 24px" }}>📸 Take First Photo</button>
                </div>
            )}

            {/* Grid view */}
            {mode === "grid" && sortedDates.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
                    {sortedDates.map(date => {
                        const entry = photos[date];
                        return (
                            <div key={date} className="gs" style={{ padding: 0, overflow: "hidden", borderRadius: 12, position: "relative" }}>
                                <img src={entry.photo} alt={`Progress ${date}`} style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }} />
                                <div style={{ padding: "8px 10px" }}>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: "#f3f4f6" }}>
                                        {fmtDate(date, { day: "numeric", month: "short", year: "numeric" })}
                                    </div>
                                    {entry.weight && <div style={{ fontSize: 11, color: "#10b981" }}>{entry.weight} kg</div>}
                                    {entry.note && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{entry.note}</div>}
                                </div>
                                <button onClick={() => deletePhoto(date)} aria-label="Delete photo" style={{ position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: "50%", background: "rgba(0,0,0,.6)", border: "none", color: "#ef4444", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Compare view */}
            {mode === "compare" && (
                <div>
                    <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                        {/* Left selector */}
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6, textAlign: "center" }}>BEFORE</div>
                            <select className="inp" value={compareA || ""} onChange={e => setCompareA(e.target.value)} style={{ width: "100%", fontSize: 12 }}>
                                <option value="">Select date</option>
                                {sortedDates.map(d => <option key={d} value={d}>{fmtDate(d, { day: "numeric", month: "short", year: "2-digit" })}</option>)}
                            </select>
                        </div>
                        {/* Right selector */}
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6, textAlign: "center" }}>AFTER</div>
                            <select className="inp" value={compareB || ""} onChange={e => setCompareB(e.target.value)} style={{ width: "100%", fontSize: 12 }}>
                                <option value="">Select date</option>
                                {sortedDates.map(d => <option key={d} value={d}>{fmtDate(d, { day: "numeric", month: "short", year: "2-digit" })}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Comparison display */}
                    {compareA && compareB && photos[compareA] && photos[compareB] && (
                        <div className="fade-in">
                            <div style={{ display: "flex", gap: 6 }}>
                                <div style={{ flex: 1, borderRadius: 12, overflow: "hidden", border: "1px solid rgba(239,68,68,.2)" }}>
                                    <img src={photos[compareA].photo} alt="Before" style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }} />
                                    <div style={{ padding: "8px 10px", textAlign: "center" }}>
                                        <div style={{ fontSize: 11, color: "#ef4444", fontWeight: 600 }}>BEFORE</div>
                                        <div style={{ fontSize: 11, color: "#6b7280" }}>{fmtDate(compareA, { day: "numeric", month: "short" })}</div>
                                        {photos[compareA].weight && <div style={{ fontSize: 12, color: "#f3f4f6", fontWeight: 700 }}>{photos[compareA].weight} kg</div>}
                                    </div>
                                </div>
                                <div style={{ flex: 1, borderRadius: 12, overflow: "hidden", border: "1px solid rgba(34,197,94,.2)" }}>
                                    <img src={photos[compareB].photo} alt="After" style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }} />
                                    <div style={{ padding: "8px 10px", textAlign: "center" }}>
                                        <div style={{ fontSize: 11, color: "#22c55e", fontWeight: 600 }}>AFTER</div>
                                        <div style={{ fontSize: 11, color: "#6b7280" }}>{fmtDate(compareB, { day: "numeric", month: "short" })}</div>
                                        {photos[compareB].weight && <div style={{ fontSize: 12, color: "#f3f4f6", fontWeight: 700 }}>{photos[compareB].weight} kg</div>}
                                    </div>
                                </div>
                            </div>

                            {/* Weight difference */}
                            {Number.isFinite(parseFloat(photos[compareA].weight)) && Number.isFinite(parseFloat(photos[compareB].weight)) && (() => {
                                const diff = parseFloat(photos[compareB].weight) - parseFloat(photos[compareA].weight);
                                const daysDiff = Math.abs(Math.round((parseDateKey(compareB) - parseDateKey(compareA)) / (24 * 60 * 60 * 1000)));
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

                    {(!compareA || !compareB || !photos[compareA] || !photos[compareB]) && (
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