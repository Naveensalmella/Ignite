import { useState, useMemo, useRef } from 'react';
import { today } from '../utils';

const MEASUREMENTS = [
  { key: "weight", label: "Weight", unit: "kg", icon: "⚖️", color: "#10b981" },
  { key: "chest", label: "Chest", unit: "in", icon: "📏", color: "#06b6d4" },
  { key: "waist", label: "Waist", unit: "in", icon: "📏", color: "#f59e0b" },
  { key: "arms", label: "Arms", unit: "in", icon: "💪", color: "#8b5cf6" },
  { key: "thighs", label: "Thighs", unit: "in", icon: "🦵", color: "#ef4444" },
  { key: "bodyFat", label: "Body Fat", unit: "%", icon: "🔥", color: "#f97316" },
];

export default function BodyTracker({ bodyData, setBodyData }) {
  const d = today();
  const data = bodyData || { entries: [], photos: [] };
  const entries = data.entries || [];
  const photos = data.photos || [];

  const [tab, setTab] = useState("log"); // log | chart | photos
  const [values, setValues] = useState({});
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [photoNote, setPhotoNote] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);

  const save = (newData) => setBodyData(newData);

  // Log measurements
  const logEntry = () => {
    const filled = Object.entries(values).filter(([_, v]) => v && v > 0);
    if (filled.length === 0) return;
    const entry = { date: d, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), measurements: { ...values } };
    save({ ...data, entries: [...entries, entry] });
    setValues({});
  };

  // Latest values
  const latest = useMemo(() => {
    const l = {};
    MEASUREMENTS.forEach(m => {
      for (let i = entries.length - 1; i >= 0; i--) {
        if (entries[i].measurements?.[m.key]) { l[m.key] = { value: entries[i].measurements[m.key], date: entries[i].date }; break; }
      }
    });
    return l;
  }, [entries]);

  // Change calculation
  const getChange = (key) => {
    const vals = entries.filter(e => e.measurements?.[key]).map(e => ({ val: e.measurements[key], date: e.date }));
    if (vals.length < 2) return null;
    const diff = vals[vals.length - 1].val - vals[vals.length - 2].val;
    return diff;
  };

  // Chart data (last 30 entries for a measurement)
  const [chartKey, setChartKey] = useState("weight");
  const chartData = useMemo(() => {
    return entries.filter(e => e.measurements?.[chartKey]).map(e => ({ date: e.date, val: e.measurements[chartKey] })).slice(-30);
  }, [entries, chartKey]);

  // Progress photos
  const startCamera = async () => {
    setShowPhotoCapture(true);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 480 } } });
      streamRef.current = s;
      if (videoRef.current) { videoRef.current.srcObject = s; videoRef.current.play(); }
    } catch (e) { console.error(e); }
  };

  const stopCamera = () => { if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; } };

  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const c = canvasRef.current, v = videoRef.current;
    c.width = 300; c.height = 400;
    const ctx = c.getContext("2d");
    ctx.drawImage(v, 0, 0, 300, 400);
    // Date stamp
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 375, 300, 25);
    ctx.fillStyle = "#10b981";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText(`IGNITE · ${new Date().toLocaleDateString()}`, 8, 392);
    setCapturedPhoto(c.toDataURL("image/jpeg", 0.6));
    stopCamera();
  };

  const savePhoto = () => {
    if (!capturedPhoto) return;
    save({ ...data, photos: [...photos, { date: d, photo: capturedPhoto, note: photoNote, weight: latest.weight?.value || null }] });
    setCapturedPhoto(null); setPhotoNote(""); setShowPhotoCapture(false);
  };

  // Photo capture modal
  if (showPhotoCapture) {
    return (
      <div style={{ padding: "10px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontFamily: "Rajdhani,sans-serif", fontSize: 20, fontWeight: 700 }}>📸 Progress Photo</h3>
          <button className="bg" onClick={() => { stopCamera(); setShowPhotoCapture(false); setCapturedPhoto(null); }} style={{ padding: "6px 14px" }}>✕</button>
        </div>
        {!capturedPhoto ? (
          <div>
            <div style={{ width: "100%", maxWidth: 300, aspectRatio: "3/4", borderRadius: 16, overflow: "hidden", border: "2px solid rgba(16,185,129,.2)", margin: "0 auto 16px", background: "#111" }}>
              <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
            </div>
            <canvas ref={canvasRef} style={{ display: "none" }} />
            <button className="bp" onClick={capture} style={{ width: "100%", padding: 14, fontSize: 16 }}>📸 Capture</button>
          </div>
        ) : (
          <div>
            <div style={{ width: "100%", maxWidth: 300, borderRadius: 16, overflow: "hidden", margin: "0 auto 16px" }}>
              <img src={capturedPhoto} alt="progress" style={{ width: "100%", display: "block" }} />
            </div>
            <input className="inp" placeholder="Note (e.g., Week 4, feeling stronger)" value={photoNote} onChange={e => setPhotoNote(e.target.value)} style={{ marginBottom: 12 }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button className="bp" onClick={savePhoto} style={{ flex: 1, padding: 14 }}>✓ Save Photo</button>
              <button className="bg" onClick={() => { setCapturedPhoto(null); startCamera(); }} style={{ padding: "14px 18px" }}>🔄</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>📊 Body Tracker</h2>
        <p style={{ color: "#6b7280", fontSize: 13, marginTop: 4 }}>Track measurements & see your transformation</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 16 }}>
        {[["log", "📏 Log"], ["chart", "📈 Progress"], ["photos", "📸 Photos"]].map(([k, l]) => (
          <span key={k} className={`chip ${tab === k ? "chip-a" : "chip-i"}`} onClick={() => setTab(k)} style={{ padding: "8px 16px" }}>{l}</span>
        ))}
      </div>

      {/* ═══ LOG TAB ═══ */}
      {tab === "log" && (
        <div>
          {/* Current Stats */}
          <div className="gs" style={{ marginBottom: 16 }}>
            <div className="sl">Current Measurements</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {MEASUREMENTS.map(m => {
                const cur = latest[m.key];
                const change = getChange(m.key);
                return (
                  <div key={m.key} style={{ textAlign: "center", padding: 12, background: "rgba(255,255,255,.02)", borderRadius: 12, border: "1px solid rgba(255,255,255,.04)" }}>
                    <div style={{ fontSize: 16 }}>{m.icon}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: m.color, fontFamily: "Rajdhani,sans-serif" }}>{cur ? cur.value : "—"}</div>
                    <div style={{ fontSize: 10, color: "#6b7280" }}>{m.label} ({m.unit})</div>
                    {change !== null && <div style={{ fontSize: 10, color: change > 0 ? (m.key === "weight" ? "#ef4444" : "#22c55e") : (m.key === "weight" ? "#22c55e" : "#ef4444"), marginTop: 2 }}>{change > 0 ? "+" : ""}{change.toFixed(1)}</div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Log New */}
          <div className="gs" style={{ marginBottom: 16 }}>
            <div className="sl">Log Today's Measurements</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
              {MEASUREMENTS.map(m => (
                <div key={m.key}>
                  <label style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 4 }}>{m.icon} {m.label} ({m.unit})</label>
                  <input className="inp" type="number" step="0.1" placeholder={latest[m.key] ? String(latest[m.key].value) : "0"} value={values[m.key] || ""} onChange={e => setValues(p => ({ ...p, [m.key]: parseFloat(e.target.value) || 0 }))} style={{ textAlign: "center" }} />
                </div>
              ))}
            </div>
            <button className="bp" onClick={logEntry} style={{ width: "100%", marginTop: 14, padding: 12 }}>Save Measurements</button>
          </div>

          {/* History */}
          <div className="gs">
            <div className="sl">History · {entries.length} entries</div>
            {entries.length === 0 && <div style={{ textAlign: "center", color: "#6b7280", padding: "16px 0", fontSize: 13 }}>No entries yet. Log your first measurement above.</div>}
            {entries.slice().reverse().slice(0, 15).map((e, i) => (
              <div key={i} style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{new Date(e.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                  <span style={{ fontSize: 11, color: "#6b7280" }}>{e.time}</span>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {Object.entries(e.measurements || {}).filter(([_, v]) => v > 0).map(([k, v]) => {
                    const m = MEASUREMENTS.find(x => x.key === k);
                    return m ? <span key={k} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: `${m.color}10`, color: m.color }}>{m.icon} {v}{m.unit}</span> : null;
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ CHART TAB ═══ */}
      {tab === "chart" && (
        <div>
          <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
            {MEASUREMENTS.map(m => (
              <span key={m.key} className={`chip ${chartKey === m.key ? "chip-a" : "chip-i"}`} onClick={() => setChartKey(m.key)}>{m.icon} {m.label}</span>
            ))}
          </div>

          {chartData.length < 2 ? (
            <div className="gs" style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.3 }}>📈</div>
              <div style={{ color: "#6b7280", fontSize: 14 }}>Need at least 2 entries to show a chart. Keep logging!</div>
            </div>
          ) : (
            <div className="gs" style={{ padding: 20 }}>
              <div className="sl" style={{ color: MEASUREMENTS.find(m => m.key === chartKey)?.color }}>
                {MEASUREMENTS.find(m => m.key === chartKey)?.label} Over Time
              </div>
              {/* Simple text-based chart */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
                {chartData.map((d, i) => {
                  const min = Math.min(...chartData.map(x => x.val));
                  const max = Math.max(...chartData.map(x => x.val));
                  const range = max - min || 1;
                  const pct = ((d.val - min) / range) * 100;
                  const col = MEASUREMENTS.find(m => m.key === chartKey)?.color || "#10b981";
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 10, color: "#6b7280", width: 45, textAlign: "right", flexShrink: 0 }}>{new Date(d.date + 'T00:00:00').toLocaleDateString('en', { day: 'numeric', month: 'short' })}</span>
                      <div style={{ flex: 1, height: 20, background: "rgba(255,255,255,.03)", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${Math.max(10, pct)}%`, background: col, borderRadius: 4, transition: "width .5s", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#060a0c" }}>{d.val}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Summary */}
              <div style={{ display: "flex", justifyContent: "space-around", marginTop: 16, textAlign: "center" }}>
                <div><div style={{ fontSize: 18, fontWeight: 700, color: "#f3f4f6" }}>{chartData[0].val}</div><div style={{ fontSize: 10, color: "#6b7280" }}>First</div></div>
                <div><div style={{ fontSize: 18, fontWeight: 700, color: MEASUREMENTS.find(m => m.key === chartKey)?.color }}>{chartData[chartData.length - 1].val}</div><div style={{ fontSize: 10, color: "#6b7280" }}>Latest</div></div>
                <div><div style={{ fontSize: 18, fontWeight: 700, color: (chartData[chartData.length - 1].val - chartData[0].val) > 0 ? "#ef4444" : "#22c55e" }}>{(chartData[chartData.length - 1].val - chartData[0].val) > 0 ? "+" : ""}{(chartData[chartData.length - 1].val - chartData[0].val).toFixed(1)}</div><div style={{ fontSize: 10, color: "#6b7280" }}>Change</div></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ PHOTOS TAB ═══ */}
      {tab === "photos" && (
        <div>
          <button className="bp" onClick={startCamera} style={{ width: "100%", padding: 14, marginBottom: 16, background: "linear-gradient(135deg,#8b5cf6,#6d28d9)" }}>📸 Take Progress Photo</button>
          {photos.length === 0 && <div className="gs" style={{ textAlign: "center", padding: "30px 0" }}><div style={{ fontSize: 32, marginBottom: 8, opacity: 0.3 }}>📸</div><div style={{ color: "#6b7280", fontSize: 14 }}>No progress photos yet. Take your first one!</div></div>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            {photos.slice().reverse().map((p, i) => (
              <div key={i} style={{ borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,.06)" }}>
                <img src={p.photo} alt="progress" style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }} />
                <div style={{ padding: "8px 10px", background: "rgba(255,255,255,.02)" }}>
                  <div style={{ fontSize: 11, fontWeight: 600 }}>{new Date(p.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  {p.weight && <div style={{ fontSize: 10, color: "#10b981" }}>{p.weight} kg</div>}
                  {p.note && <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>{p.note}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
