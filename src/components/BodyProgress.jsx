"use client";
import { useState, useRef } from 'react';
import storeV2 from '@/store-v2';
import { today, parseDateKey } from '@/utils';
import { Camera, Plus, LayoutGrid, Columns2, Trash2, Lightbulb } from 'lucide-react';
import { Card, IconBadge, EmptyState } from '@/components/ui/kit';

const fmtDate = (key, opts) => { const dt = parseDateKey(key); return isNaN(dt) ? String(key || "") : dt.toLocaleDateString("en-IN", opts); };

// Phone camera photos are several MB; a Firestore document is capped at 1MB, so the
// raw data URL would fail to save. Downscale + JPEG-compress, stepping size/quality
// down until the photo fits comfortably in one document.
const MAX_PHOTO_CHARS = 600_000;
const COMPRESS_STEPS = [[900, 0.7], [720, 0.6], [560, 0.5], [420, 0.45]];
function compressImage(file) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            try {
                let out = "";
                for (const [maxDim, quality] of COMPRESS_STEPS) {
                    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
                    const c = document.createElement("canvas");
                    c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
                    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
                    out = c.toDataURL("image/jpeg", quality);
                    if (out.length <= MAX_PHOTO_CHARS) break;
                }
                if (out.length > MAX_PHOTO_CHARS) reject(new Error("Image is too large even after compression"));
                else resolve(out);
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
    const [status, setStatus] = useState(null); // { tone: "error" | "info", text }
    const fileRef = useRef(null);

    // Put one date's entry back to what it was (undefined = remove)
    const restore = (date, entry) => setBodyPhotos(prev => {
        const next = { ...(prev || {}) };
        if (entry) next[date] = entry; else delete next[date];
        return next;
    });

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
        setStatus(null);
        const previous = photos[d];
        let dataUrl;
        try {
            dataUrl = await compressImage(file);
        } catch (err) {
            console.error("Photo compress failed:", err);
            setStatus({ tone: "error", text: "Couldn't use that photo. Please try a different image." });
            setUploading(false);
            return;
        }
        // Update UI immediately
        setBodyPhotos(prev => ({
            ...(prev || {}),
            [d]: { photo: dataUrl, date: d, note, weight }
        }));
        try {
            // Save to subcollection (each photo = its own Firestore doc)
            const res = userId ? await storeV2.saveBodyPhoto(userId, d, dataUrl, note, weight) : "saved";
            if (res === "queued") setStatus({ tone: "info", text: "You're offline — the photo is stored on this device and will sync when you're back online." });
        } catch (err) {
            console.error("Photo save failed:", err);
            restore(d, previous);
            setStatus({ tone: "error", text: "Couldn't save that photo. Check your connection and try again." });
        } finally {
            setUploading(false);
        }
    };

    // Delete photo — removes the Firestore doc; put it back if that fails
    const deletePhoto = async (date) => {
        if (!window.confirm("Delete this progress photo?")) return;
        const previous = photos[date];
        setStatus(null);
        restore(date, undefined);
        if (compareA === date) setCompareA(null);
        if (compareB === date) setCompareB(null);
        if (!userId) return;
        try {
            const res = await storeV2.deleteBodyPhoto(userId, date);
            if (res === "queued") setStatus({ tone: "info", text: "You're offline — the photo will be deleted from your account when you're back online." });
        } catch (e) {
            console.error("Delete error:", e);
            restore(date, previous);
            setStatus({ tone: "error", text: "Couldn't delete that photo. Check your connection and try again." });
        }
    };

    const openPicker = () => fileRef.current?.click();
    const bothPicked = compareA && compareB && photos[compareA] && photos[compareB];

    return (
        <div className="flex flex-col gap-3">
            {/* Header */}
            <Card>
                <div className="flex items-center gap-3">
                    <IconBadge icon={Camera} tone="sky" size={40} />
                    <div className="flex-1 min-w-0">
                        <div className="card-title">Body progress</div>
                        <div className="card-sub">{sortedDates.length} {sortedDates.length === 1 ? "photo" : "photos"} · Track your transformation</div>
                    </div>
                    <button type="button" className="bp shrink-0" onClick={openPicker} disabled={uploading} style={{ padding: "9px 14px", fontSize: 13 }}>
                        {uploading ? "Uploading..." : <><Plus size={16} /> Add photo</>}
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={addPhoto} aria-label="Add progress photo" style={{ display: "none" }} />
                </div>

                {status && (
                    <div role={status.tone === "error" ? "alert" : "status"} className="text-[12.5px] mt-3 px-3 py-2 rounded-xl"
                        style={{ color: status.tone === "error" ? "var(--danger)" : "var(--text-secondary)", background: status.tone === "error" ? "color-mix(in srgb, var(--danger) 10%, transparent)" : "var(--ghost-bg)" }}>
                        {status.text}
                    </div>
                )}

                {/* View toggle */}
                {sortedDates.length >= 2 && (
                    <div className="flex gap-2 mt-3">
                        <button type="button" aria-pressed={mode === "grid"} className={`chip flex-1 justify-center ${mode === "grid" ? "chip-a" : "chip-i"}`} onClick={() => setViewMode("grid")} style={{ minHeight: 36 }}>
                            <LayoutGrid size={15} /> Gallery
                        </button>
                        <button type="button" aria-pressed={mode === "compare"} className={`chip flex-1 justify-center ${mode === "compare" ? "chip-a" : "chip-i"}`} onClick={() => setViewMode("compare")} style={{ minHeight: 36 }}>
                            <Columns2 size={15} /> Compare
                        </button>
                    </div>
                )}
            </Card>

            {/* Empty state */}
            {sortedDates.length === 0 && (
                <Card>
                    <EmptyState icon={Camera} title="No photos yet"
                        action={<button type="button" className="bp" onClick={openPicker} disabled={uploading}><Camera size={16} /> Take first photo</button>}>
                        Take your first progress photo. Monthly photos show big transformations over time.
                    </EmptyState>
                </Card>
            )}

            {/* Grid view */}
            {mode === "grid" && sortedDates.length > 0 && (
                <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
                    {sortedDates.map(date => {
                        const entry = photos[date];
                        return (
                            <div key={date} className="card relative overflow-hidden" style={{ padding: 0 }}>
                                <img src={entry.photo} alt={`Progress ${date}`} className="block w-full object-cover" style={{ aspectRatio: "3/4" }} />
                                <div className="px-3 py-2.5">
                                    <div className="text-[12.5px] font-semibold" style={{ color: "var(--text-primary)" }}>
                                        {fmtDate(date, { day: "numeric", month: "short", year: "numeric" })}
                                    </div>
                                    {entry.weight && <div className="text-[12px] font-semibold num" style={{ color: "var(--accent)" }}>{entry.weight} kg</div>}
                                    {entry.note && <div className="text-[11.5px] mt-0.5" style={{ color: "var(--text-dim)" }}>{entry.note}</div>}
                                </div>
                                {/* sits on the photo, so a dark scrim is right in both themes */}
                                <button type="button" onClick={() => deletePhoto(date)} aria-label="Delete photo"
                                    className="absolute flex items-center justify-center"
                                    style={{ top: 6, right: 6, width: 36, height: 36, borderRadius: "50%", background: "rgba(0, 0, 0, .55)", border: "none", color: "#fff" }}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Compare view */}
            {mode === "compare" && (
                <Card title="Compare">
                    <div className="grid grid-cols-2 gap-2.5">
                        {/* Left selector */}
                        <label className="block">
                            <span className="block text-[12px] font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Before</span>
                            <select className="inp" value={compareA || ""} onChange={e => setCompareA(e.target.value)} style={{ fontSize: 13 }}>
                                <option value="">Select date</option>
                                {sortedDates.map(d => <option key={d} value={d}>{fmtDate(d, { day: "numeric", month: "short", year: "2-digit" })}</option>)}
                            </select>
                        </label>
                        {/* Right selector */}
                        <label className="block">
                            <span className="block text-[12px] font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>After</span>
                            <select className="inp" value={compareB || ""} onChange={e => setCompareB(e.target.value)} style={{ fontSize: 13 }}>
                                <option value="">Select date</option>
                                {sortedDates.map(d => <option key={d} value={d}>{fmtDate(d, { day: "numeric", month: "short", year: "2-digit" })}</option>)}
                            </select>
                        </label>
                    </div>

                    {/* Comparison display */}
                    {bothPicked && (
                        <div className="fade-in mt-3">
                            <div className="grid grid-cols-2 gap-2.5">
                                {[["Before", compareA], ["After", compareB]].map(([label, key]) => (
                                    <div key={label} className="overflow-hidden" style={{ borderRadius: 16, background: "var(--ghost-bg)" }}>
                                        <img src={photos[key].photo} alt={label} className="block w-full object-cover" style={{ aspectRatio: "3/4" }} />
                                        <div className="px-2.5 py-2 text-center">
                                            <div className="text-[12px] font-bold" style={{ color: label === "Before" ? "var(--text-secondary)" : "var(--accent)" }}>{label}</div>
                                            <div className="text-[11.5px]" style={{ color: "var(--text-dim)" }}>{fmtDate(key, { day: "numeric", month: "short" })}</div>
                                            {photos[key].weight && <div className="text-[12.5px] font-bold num" style={{ color: "var(--text-primary)" }}>{photos[key].weight} kg</div>}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Weight difference */}
                            {Number.isFinite(parseFloat(photos[compareA].weight)) && Number.isFinite(parseFloat(photos[compareB].weight)) && (() => {
                                const diff = parseFloat(photos[compareB].weight) - parseFloat(photos[compareA].weight);
                                const daysDiff = Math.abs(Math.round((parseDateKey(compareB) - parseDateKey(compareA)) / (24 * 60 * 60 * 1000)));
                                return (
                                    <div className="mt-3 rounded-2xl px-3 py-3 text-center" style={{ background: "var(--ghost-bg)" }}>
                                        <div className="text-[22px] font-extrabold num" style={{ color: diff <= 0 ? "var(--ok)" : "var(--warn)" }}>
                                            {diff > 0 ? "+" : ""}{diff.toFixed(1)} kg
                                        </div>
                                        <div className="text-[12px]" style={{ color: "var(--text-dim)" }}>in {daysDiff} days</div>
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {!bothPicked && (
                        <div className="text-center text-[13px] pt-6 pb-3" style={{ color: "var(--text-dim)" }}>Select two dates above to compare photos side by side.</div>
                    )}
                </Card>
            )}

            {/* Tips */}
            {sortedDates.length > 0 && sortedDates.length < 3 && (
                <div className="flex items-start gap-2 text-[12.5px] px-3.5 py-3 rounded-2xl"
                    style={{ color: "var(--text-secondary)", background: "color-mix(in srgb, var(--accent) 10%, transparent)" }}>
                    <Lightbulb size={15} className="shrink-0 mt-px" style={{ color: "var(--accent)" }} aria-hidden="true" />
                    <span>Take photos monthly in the same lighting, pose and clothing for the best comparison.</span>
                </div>
            )}
        </div>
    );
}
