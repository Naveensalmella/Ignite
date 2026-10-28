"use client";
import { useRef, useState, useMemo } from 'react';
import { Share2, Download, X } from 'lucide-react';
import { Card, IconBadge, Tabs } from '@/components/ui/kit';
import { getLevel, toArr } from '@/utils';
import useAppStore from '@/stores/useAppStore';
import { playerRank } from '@/lib/system/ranks';
import { getDayEntries } from '@/lib/workoutHelpers';

// ctx.roundRect is missing in older Safari/Firefox — fall back to a manual path
function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") { ctx.roundRect(x, y, w, h, r); return; }
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Generates a beautiful achievement card image and shares it.
// Used both as a modal (with onClose) and as the standalone "share" page (App passes
// totalXP/streak/workoutLog/profile only) — in page mode it renders inline and lets the
// user pick which card to share.
export default function ShareCard({ type = "workout", data: rawData = null, profile: rawProfile = {}, totalXP = 0, streak = 0, workoutLog = {}, onClose }) {
  const canvasRef = useRef(null);
  const isModal = typeof onClose === "function";
  const profile = rawProfile || {};
  const hasData = rawData && typeof rawData === "object" && Object.keys(rawData).length > 0;
  const [selType, setSelType] = useState(hasData ? type : "streak");
  const [busy, setBusy] = useState(false);
  const cardType = isModal || hasData ? type : selType;

  const lv = getLevel(totalXP);
  const system = useAppStore(s => s.system);
  const rank = playerRank(system, lv);

  // Page mode: build card data from the user's own stats / latest workout
  const latestWorkout = useMemo(() => {
    const dates = Object.keys(workoutLog || {}).filter(k => getDayEntries(workoutLog, k).length > 0).sort();
    if (!dates.length) return null;
    const entries = getDayEntries(workoutLog, dates[dates.length - 1]);
    return entries[entries.length - 1] || null;
  }, [workoutLog]);

  const data = hasData ? rawData : cardType === "workout" ? {
    splitName: latestWorkout?.splitName,
    duration: latestWorkout?.duration,
    calBurned: latestWorkout?.calBurned,
    exercises: latestWorkout?.exercises || latestWorkout?.gym?.exercises,
  } : { level: lv, rank: rank.name };

  const templates = {
    workout: {
      title: "Workout Complete! 💪",
      subtitle: data.splitName || "Training Session",
      stats: [
        { label: "Duration", value: `${Math.round((data.duration || 0) / 60)} min` },
        { label: "Calories", value: `${data.calBurned || 0} cal` },
        { label: "Exercises", value: `${toArr(data.exercises).length}` },
      ],
      color: "#38bdf8",
    },
    streak: {
      title: `${streak} Day Streak! 🔥`,
      subtitle: "Consistency is the key",
      stats: [
        { label: "Streak", value: `${streak} days` },
        { label: "Total XP", value: `${Number(totalXP || 0).toLocaleString()}` },
        { label: "Level", value: `${data.level || lv}` },
      ],
      color: "#f59e0b",
    },
    levelup: {
      title: `Level ${data.level || 1} Reached! ⚡`,
      subtitle: data.rank || "Rising Star",
      stats: [
        { label: "Level", value: `${data.level || 1}` },
        { label: "Total XP", value: `${Number(totalXP || 0).toLocaleString()}` },
        { label: "Rank", value: data.rank || "E-Rank" },
      ],
      color: "#8b5cf6",
    },
    milestone: {
      title: `${data.title || "Milestone"} 🏆`,
      subtitle: data.msg || "Achievement unlocked!",
      stats: [
        { label: "XP Earned", value: `${Number(totalXP || 0).toLocaleString()}` },
        { label: "Streak", value: `${streak}d` },
      ],
      color: "#ef4444",
    },
  };

  const template = templates[cardType] || templates.workout;

  const generateImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    canvas.width = 600;
    canvas.height = 400;

    // Background
    const grad = ctx.createLinearGradient(0, 0, 600, 400);
    grad.addColorStop(0, "#07090d");
    grad.addColorStop(1, "#0d1117");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 400);

    // Accent glow
    ctx.beginPath();
    const glowGrad = ctx.createRadialGradient(300, 200, 0, 300, 200, 300);
    glowGrad.addColorStop(0, template.color + "15");
    glowGrad.addColorStop(1, "transparent");
    ctx.fillStyle = glowGrad;
    ctx.arc(300, 200, 300, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = template.color + "40";
    ctx.lineWidth = 2;
    roundRectPath(ctx, 10, 10, 580, 380, 20);
    ctx.stroke();

    // IGNITE logo
    ctx.fillStyle = template.color;
    ctx.font = "bold 14px Rajdhani, sans-serif";
    ctx.fillText("🔥 IGNITE", 30, 40);

    // Username
    ctx.fillStyle = "#6b7280";
    ctx.font = "13px Inter, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`@${profile.name || "Warrior"}`, 570, 40);
    ctx.textAlign = "left";

    // Title
    ctx.fillStyle = "#f3f4f6";
    ctx.font = "bold 32px Rajdhani, sans-serif";
    ctx.fillText(template.title, 30, 120);

    // Subtitle
    ctx.fillStyle = template.color;
    ctx.font = "18px Rajdhani, sans-serif";
    ctx.fillText(template.subtitle, 30, 155);

    // Stats
    const statWidth = 540 / template.stats.length;
    template.stats.forEach((stat, i) => {
      const x = 30 + i * statWidth;

      // Stat box
      ctx.fillStyle = "rgba(255,255,255,0.03)";
      roundRectPath(ctx, x, 200, statWidth - 15, 80, 12);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Value
      ctx.fillStyle = template.color;
      ctx.font = "bold 28px Rajdhani, sans-serif";
      ctx.fillText(stat.value, x + 15, 245);

      // Label
      ctx.fillStyle = "#6b7280";
      ctx.font = "12px Inter, sans-serif";
      ctx.fillText(stat.label, x + 15, 268);
    });

    // Footer
    ctx.fillStyle = "#4b5563";
    ctx.font = "11px Inter, sans-serif";
    ctx.fillText("Join IGNITE — Level Up Your Life", 30, 365);
    ctx.textAlign = "right";
    ctx.fillStyle = "#6b7280";
    ctx.fillText("ignite-reality.vercel.app", 570, 365);

    return canvas.toDataURL("image/png");
  };

  const downloadUrl = (imageUrl) => {
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = "ignite-achievement.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const shareCard = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const imageUrl = await generateImage();
      if (!imageUrl) return;

      const shareText = `${template.title}\n${template.subtitle}\n${template.stats.map(s => `${s.label}: ${s.value}`).join(" · ")}\n\n🔥 Join IGNITE: ignite-reality.vercel.app`;

      let file = null;
      try {
        // Convert to blob for sharing
        const blob = await (await fetch(imageUrl)).blob();
        file = new File([blob], "ignite-achievement.png", { type: "image/png" });
      } catch { }

      if (file && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ title: "IGNITE Achievement", text: shareText, files: [file] });
        } catch { }
      } else if (navigator.share) {
        try {
          await navigator.share({ title: "IGNITE Achievement", text: shareText });
        } catch { }
      } else {
        // Fallback: download image
        downloadUrl(imageUrl);
      }
    } catch (e) {
      console.error("Share card error:", e);
    } finally {
      setBusy(false);
    }
  };

  const downloadCard = async () => {
    try {
      const imageUrl = await generateImage();
      if (imageUrl) downloadUrl(imageUrl);
    } catch (e) {
      console.error("Save card error:", e);
    }
  };

  const wrapperStyle = isModal
    ? { position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.7)", backdropFilter: "blur(8px)", padding: 16 }
    : undefined;

  return (
    <div style={wrapperStyle} className={isModal ? "" : "page fade-in"} onClick={isModal ? onClose : undefined}>
      <div onClick={e => e.stopPropagation()} className="w-full mx-auto" style={{ maxWidth: 440 }}>
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <IconBadge icon={Share2} tone="sky" size={38} />
            <div className="flex-1 min-w-0">
              <div className="card-title">Share your progress</div>
              <div className="row-sub">Post a card to your story or chat</div>
            </div>
            {isModal && <button type="button" className="icon-btn shrink-0" onClick={onClose} aria-label="Close"><X size={18} /></button>}
          </div>

          {/* Card picker (page mode) */}
          {!isModal && !hasData && (
            <Tabs className="mb-3" label="Card type" tabs={[["streak", "Streak"], ["levelup", "Level"], ["workout", "Workout"]]} value={selType} onChange={setSelType} />
          )}
          {!isModal && !hasData && cardType === "workout" && !latestWorkout && (
            <div className="row-sub text-center mb-3">No workouts logged yet — finish a session to share it.</div>
          )}

          {/* Preview — mirrors the generated image, which is always dark */}
          <div className="keep-dark mb-3" style={{ background: "var(--bg)", borderRadius: 16, border: `1px solid ${template.color}40`, padding: 18 }}>
            <div style={{ fontSize: 11, color: template.color, fontWeight: 700, marginBottom: 4 }}>🔥 IGNITE</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2 }}>{template.title}</div>
            <div style={{ fontSize: 13.5, color: template.color, marginTop: 2 }}>{template.subtitle}</div>
            <div className="flex gap-2 mt-4">
              {template.stats.map(s => (
                <div key={s.label} className="flex-1 min-w-0 text-center" style={{ padding: "10px 6px", borderRadius: 12, background: "var(--ghost-bg)" }}>
                  <div className="num truncate" style={{ fontSize: 18, fontWeight: 800, color: template.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button type="button" className="bp flex-1" onClick={shareCard} disabled={busy}><Share2 size={16} /> Share</button>
            <button type="button" className="bg flex-1" onClick={downloadCard}><Download size={16} /> Save image</button>
          </div>

          {/* Hidden canvas */}
          <canvas ref={canvasRef} style={{ display: "none" }} />
        </Card>
      </div>
    </div>
  );
}
