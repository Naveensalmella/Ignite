"use client";
import { useState, useMemo, useRef, useEffect } from 'react';
import { today, toArr, parseDateKey } from '@/utils';
import { Scale, Ruler, BicepsFlexed, Flame, Camera, X, Check, RotateCcw, LineChart, ClipboardList, Images } from 'lucide-react';
import { Card, IconBadge, EmptyState } from '@/components/ui/kit';

const MEASUREMENTS = [
  { key: "weight", label: "Weight", unit: "kg", icon: Scale, color: "var(--tone-sky)" },
  { key: "chest", label: "Chest", unit: "in", icon: Ruler, color: "var(--tone-teal)" },
  { key: "waist", label: "Waist", unit: "in", icon: Ruler, color: "var(--tone-amber)" },
  { key: "arms", label: "Arms", unit: "in", icon: BicepsFlexed, color: "var(--tone-violet)" },
  { key: "thighs", label: "Thighs", unit: "in", icon: Ruler, color: "var(--tone-rose)" },
  { key: "bodyFat", label: "Body Fat", unit: "%", icon: Flame, color: "var(--tone-orange)" },
];


// Firestore data is untrusted: lists may be objects with numeric keys, values may be strings
const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
const fmtDate = (key, opts) => { const dt = parseDateKey(key); return isNaN(dt) ? "" : dt.toLocaleDateString('en-IN', opts); };
const asObj = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});

export default function BodyTracker({ bodyData, setBodyData = () => { } }) {
  const d = today();
  const entries = useMemo(() => toArr(asObj(bodyData).entries).filter(e => e && typeof e === "object"), [bodyData]);
  const photos = useMemo(() => toArr(asObj(bodyData).photos).filter(p => p && typeof p === "object" && p.photo), [bodyData]);

  const [tab, setTab] = useState("log"); // log | chart | photos
  const [values, setValues] = useState({});
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [photoNote, setPhotoNote] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [cameraError, setCameraError] = useState("");
  const captureOpenRef = useRef(false);

  // Functional update so we always merge into the latest stored bodyData
  const update = (fn) => setBodyData(prev => { const p = asObj(prev); return { ...p, ...fn(p) }; });

  // Log measurements (inputs hold raw strings so decimals like "70.5" can be typed)
  const filledValues = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, parseFloat(v)]).filter(([, v]) => Number.isFinite(v) && v > 0));
  const logEntry = () => {
    if (Object.keys(filledValues).length === 0) return;
    const entry = { date: d, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), measurements: filledValues };
    update(p => ({ entries: [...toArr(p.entries), entry] }));
    setValues({});
  };

  // Latest values
  const latest = useMemo(() => {
    const l = {};
    MEASUREMENTS.forEach(m => {
      for (let i = entries.length - 1; i >= 0; i--) {
        const v = num(entries[i].measurements?.[m.key]);
        if (v > 0) { l[m.key] = { value: v, date: entries[i].date }; break; }
      }
    });
    return l;
  }, [entries]);

  // Change calculation
  const getChange = (key) => {
    const vals = entries.filter(e => num(e.measurements?.[key]) > 0).map(e => ({ val: num(e.measurements[key]), date: e.date }));
    if (vals.length < 2) return null;
    const diff = vals[vals.length - 1].val - vals[vals.length - 2].val;
    return diff;
  };

  // Chart data (last 30 entries for a measurement)
  const [chartKey, setChartKey] = useState("weight");
  const chartData = useMemo(() => {
    return entries.filter(e => num(e.measurements?.[chartKey]) > 0).map(e => ({ date: e.date, val: num(e.measurements[chartKey]) })).slice(-30);
  }, [entries, chartKey]);

  // Progress photos
  const stopCamera = () => { if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; } };

  // Always release the camera when leaving the page
  useEffect(() => () => { captureOpenRef.current = false; stopCamera(); }, []);

  const startCamera = async () => {
    setShowPhotoCapture(true);
    setCameraError("");
    captureOpenRef.current = true;
    stopCamera();
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 480 } } });
      // Capture screen was closed (or page left) while waiting for permission — don't leak the stream
      if (!captureOpenRef.current) { s.getTracks().forEach(t => t.stop()); return; }
      streamRef.current = s;
      if (videoRef.current) { videoRef.current.srcObject = s; videoRef.current.play().catch(() => { }); }
    } catch (e) { console.error(e); setCameraError("Couldn't access the camera. Check camera permissions and try again."); }
  };

  const closeCapture = () => { captureOpenRef.current = false; stopCamera(); setShowPhotoCapture(false); setCapturedPhoto(null); setCameraError(""); };

  const capture = () => {
    if (!videoRef.current || !canvasRef.current || !streamRef.current) return;
    const c = canvasRef.current, v = videoRef.current;
    c.width = 300; c.height = 400;
    const ctx = c.getContext("2d");
    ctx.drawImage(v, 0, 0, 300, 400);
    // Date stamp
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 375, 300, 25);
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText(`IGNITE · ${new Date().toLocaleDateString()}`, 8, 392);
    setCapturedPhoto(c.toDataURL("image/jpeg", 0.6));
    stopCamera();
  };

  const savePhoto = () => {
    if (!capturedPhoto) return;
    const photo = { date: d, photo: capturedPhoto, note: photoNote.trim(), weight: latest.weight?.value || null };
    update(p => ({ photos: [...toArr(p.photos), photo] }));
    setPhotoNote(""); closeCapture();
  };

  // Photo capture modal
  if (showPhotoCapture) {
    return (
      <div className="flex flex-col gap-3">
        <Card>
          <div className="card-head">
            <div className="flex items-center gap-2.5 min-w-0">
              <IconBadge icon={Camera} tone="sky" size={36} />
              <div className="card-title">Progress photo</div>
            </div>
            <button type="button" className="icon-btn" onClick={closeCapture} aria-label="Close"><X size={18} /></button>
          </div>
          {!capturedPhoto ? (
            <div>
              <div className="w-full mx-auto mb-4 overflow-hidden" style={{ maxWidth: 300, aspectRatio: "3/4", borderRadius: 20, background: "var(--ghost-bg)" }}>
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />
              </div>
              <canvas ref={canvasRef} style={{ display: "none" }} />
              {cameraError && <div role="alert" className="text-center text-[12.5px] mb-3" style={{ color: "var(--danger)" }}>{cameraError}</div>}
              <button type="button" className="bp w-full" onClick={capture} disabled={!!cameraError} style={{ padding: "13px 18px", fontSize: 15 }}><Camera size={17} /> Capture</button>
            </div>
          ) : (
            <div>
              <div className="w-full mx-auto mb-4 overflow-hidden" style={{ maxWidth: 300, borderRadius: 20 }}>
                <img src={capturedPhoto} alt="progress" className="block w-full" />
              </div>
              <input className="inp mb-3" placeholder="Note (e.g., Week 4, feeling stronger)" aria-label="Photo note" value={photoNote} onChange={e => setPhotoNote(e.target.value)} />
              <div className="flex gap-2">
                <button type="button" className="bp flex-1" onClick={savePhoto} style={{ padding: "13px 18px" }}><Check size={17} /> Save photo</button>
                <button type="button" className="bg" onClick={() => { setCapturedPhoto(null); startCamera(); }} aria-label="Retake photo" style={{ padding: "13px 16px" }}><RotateCcw size={17} /></button>
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  }

  const chartM = MEASUREMENTS.find(m => m.key === chartKey);

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <Card>
        <div className="flex items-center gap-3">
          <IconBadge icon={Ruler} tone="teal" size={40} />
          <div className="flex-1 min-w-0">
            <div className="card-title">Body measurements</div>
            <div className="card-sub">Track measurements and see your transformation</div>
          </div>
        </div>
        {/* Sections */}
        <div className="flex gap-2 mt-3" role="tablist" aria-label="Measurement views">
          {[["log", "Log", ClipboardList], ["chart", "Progress", LineChart], ["photos", "Photos", Images]].map(([k, l, Icon]) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} className={`chip flex-1 justify-center ${tab === k ? "chip-a" : "chip-i"}`} onClick={() => setTab(k)} style={{ minHeight: 36 }}>
              <Icon size={15} /> {l}
            </button>
          ))}
        </div>
      </Card>

      {/* ═══ LOG TAB ═══ */}
      {tab === "log" && (
        <>
          {/* Current Stats */}
          <Card title="Current measurements">
            <div className="grid grid-cols-3 gap-2">
              {MEASUREMENTS.map(m => {
                const cur = latest[m.key];
                const change = getChange(m.key);
                const Icon = m.icon;
                const good = m.key === "weight" ? change <= 0 : change > 0;
                return (
                  <div key={m.key} className="rounded-2xl px-2.5 py-3" style={{ background: "var(--ghost-bg)" }}>
                    <Icon size={16} style={{ color: m.color }} aria-hidden="true" />
                    <div className="text-[19px] font-extrabold num mt-1 leading-tight" style={{ color: "var(--text-primary)" }}>{cur ? cur.value : "—"}</div>
                    <div className="text-[11.5px]" style={{ color: "var(--text-secondary)" }}>{m.label} ({m.unit})</div>
                    {change !== null && <div className="text-[11.5px] font-semibold num mt-0.5" style={{ color: good ? "var(--ok)" : "var(--danger)" }}>{change > 0 ? "+" : ""}{change.toFixed(1)}</div>}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Log New */}
          <Card title="Log today's measurements">
            <div className="grid grid-cols-2 gap-2.5">
              {MEASUREMENTS.map(m => (
                <div key={m.key}>
                  <label htmlFor={`bt-${m.key}`} className="block text-[12px] font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>{m.label} ({m.unit})</label>
                  <input id={`bt-${m.key}`} className="inp num" type="number" step="0.1" min="0" inputMode="decimal" placeholder={latest[m.key] ? String(latest[m.key].value) : "0"} value={values[m.key] ?? ""} onChange={e => setValues(p => ({ ...p, [m.key]: e.target.value }))} style={{ textAlign: "center" }} />
                </div>
              ))}
            </div>
            <button type="button" className="bp w-full mt-4" onClick={logEntry} disabled={Object.keys(filledValues).length === 0}>Save measurements</button>
          </Card>

          {/* History */}
          <Card title="History" sub={`${entries.length} ${entries.length === 1 ? "entry" : "entries"}`}>
            {entries.length === 0 && <div className="text-center text-[13px] py-4" style={{ color: "var(--text-dim)" }}>No entries yet. Log your first measurement above.</div>}
            {entries.slice().reverse().slice(0, 15).map((e, i) => (
              <div key={i} className="py-2.5" style={{ borderTop: i > 0 ? "1px solid var(--line)" : "none" }}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-[13.5px] font-semibold" style={{ color: "var(--text-primary)" }}>{fmtDate(e.date, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                  <span className="text-[12px]" style={{ color: "var(--text-dim)" }}>{e.time}</span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {Object.entries(asObj(e.measurements)).filter(([, v]) => num(v) > 0).map(([k, v]) => {
                    const m = MEASUREMENTS.find(x => x.key === k);
                    return m ? <span key={k} className="pill num" style={{ "--tone": m.color }}>{m.label} {num(v)}{m.unit}</span> : null;
                  })}
                </div>
              </div>
            ))}
          </Card>
        </>
      )}

      {/* ═══ CHART TAB ═══ */}
      {tab === "chart" && (
        <>
          <div className="chip-row">
            {MEASUREMENTS.map(m => {
              const Icon = m.icon;
              return (
                <button key={m.key} type="button" aria-pressed={chartKey === m.key} className={`chip ${chartKey === m.key ? "chip-a" : "chip-i"}`} onClick={() => setChartKey(m.key)} style={{ minHeight: 36 }}>
                  <Icon size={14} /> {m.label}
                </button>
              );
            })}
          </div>

          {chartData.length < 2 ? (
            <Card>
              <EmptyState icon={LineChart} title="Not enough data yet">Log at least 2 entries to see a chart. Keep logging!</EmptyState>
            </Card>
          ) : (
            <Card title={`${chartM?.label} over time`} sub={chartM?.unit}>
              {/* Simple bar chart */}
              <div className="flex flex-col gap-1.5">
                {chartData.map((d, i) => {
                  const vals = chartData.map(x => x.val);
                  const min = Math.min(...vals);
                  const max = Math.max(...vals);
                  const range = max - min || 1;
                  const pct = ((d.val - min) / range) * 100;
                  const col = chartM?.color || "var(--accent)";
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-[11.5px] shrink-0 text-right" style={{ color: "var(--text-dim)", width: 46 }}>{fmtDate(d.date, { day: 'numeric', month: 'short' })}</span>
                      <div className="flex-1 overflow-hidden" style={{ height: 22, background: "var(--track)", borderRadius: 999 }}>
                        <div className="h-full flex items-center justify-end" style={{ width: `${Math.max(10, pct)}%`, background: col, borderRadius: 999, transition: "width .5s", paddingRight: 8 }}>
                          <span className="text-[11px] font-bold num" style={{ color: "var(--accent-ink)" }}>{d.val}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Summary */}
              {(() => {
                const first = chartData[0].val, last = chartData[chartData.length - 1].val, diff = last - first;
                return (
                  <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                    {[["First", first, "var(--text-primary)"], ["Latest", last, col0(chartM)], ["Change", `${diff > 0 ? "+" : ""}${diff.toFixed(1)}`, diff > 0 ? "var(--danger)" : "var(--ok)"]].map(([l, v, c]) => (
                      <div key={l} className="rounded-2xl py-2.5" style={{ background: "var(--ghost-bg)" }}>
                        <div className="text-[18px] font-bold num" style={{ color: c }}>{v}</div>
                        <div className="text-[11.5px]" style={{ color: "var(--text-dim)" }}>{l}</div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </Card>
          )}
        </>
      )}

      {/* ═══ PHOTOS TAB ═══ */}
      {tab === "photos" && (
        <>
          <button type="button" className="bp w-full" onClick={startCamera} style={{ padding: "13px 18px" }}><Camera size={17} /> Take progress photo</button>
          {photos.length === 0 && (
            <Card><EmptyState icon={Camera} title="No progress photos yet">Take your first one!</EmptyState></Card>
          )}
          {photos.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {photos.slice().reverse().map((p, i) => (
                <div key={i} className="card overflow-hidden" style={{ padding: 0 }}>
                  <img src={p.photo} alt="progress" className="block w-full object-cover" style={{ aspectRatio: "3/4" }} />
                  <div className="px-3 py-2.5">
                    <div className="text-[12.5px] font-semibold" style={{ color: "var(--text-primary)" }}>{fmtDate(p.date, { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                    {p.weight && <div className="text-[12px] font-semibold num" style={{ color: "var(--accent)" }}>{p.weight} kg</div>}
                    {p.note && <div className="text-[11.5px] mt-0.5" style={{ color: "var(--text-dim)" }}>{p.note}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

const col0 = (m) => m?.color || "var(--accent)";
