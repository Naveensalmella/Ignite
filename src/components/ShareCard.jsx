"use client";
import { useRef, useState, useMemo } from 'react';
import { getLevel, getRank, toArr } from '@/utils';
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
  const rank = getRank(lv);

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
      color: "#10b981",
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
        { label: "Rank", value: data.rank || "Cinder" },
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
    ? { position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.8)", backdropFilter: "blur(8px)", padding: 16 }
    : { display: "flex", justifyContent: "center" };

  return (
    <div style={wrapperStyle} onClick={isModal ? onClose : undefined}>
      <div onClick={e => e.stopPropagation()} style={{ maxWidth: 400, width: "100%" }}>
        {/* Card picker (page mode) */}
        {!isModal && !hasData && (
          <div style={{ display: "flex", gap: 6, marginBottom: 12, justifyContent: "center", flexWrap: "wrap" }}>
            {[["streak", "🔥 Streak"], ["levelup", "⚡ Level"], ["workout", "💪 Workout"]].map(([k, l]) => (
              <span key={k} className={`chip ${selType === k ? "chip-a" : "chip-i"}`} onClick={() => setSelType(k)} style={{ fontSize: 12 }}>{l}</span>
            ))}
          </div>
        )}
        {!isModal && !hasData && cardType === "workout" && !latestWorkout && (
          <div style={{ fontSize: 12, color: "#6b7280", textAlign: "center", marginBottom: 10 }}>No workouts logged yet — finish a session to share it.</div>
        )}
        {/* Preview */}
        <div style={{ background: "#07090d", borderRadius: 16, border: `1px solid ${template.color}30`, padding: 20, marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: template.color, fontWeight: 600, marginBottom: 4 }}>🔥 IGNITE</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani, sans-serif" }}>{template.title}</div>
          <div style={{ fontSize: 14, color: template.color, marginTop: 2 }}>{template.subtitle}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            {template.stats.map(s => (
              <div key={s.label} style={{ flex: 1, padding: 12, borderRadius: 10, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.05)", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: template.color, fontFamily: "Rajdhani, sans-serif" }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8 }}>
          <button className="bp" onClick={shareCard} disabled={busy} style={{ flex: 1, padding: 14, fontSize: 14 }}>📤 Share</button>
          <button className="bg" onClick={downloadCard} style={{ flex: 1, padding: 14, fontSize: 14 }}>💾 Save Image</button>
          {isModal && <button className="bg" onClick={onClose} style={{ padding: "14px 16px" }}>✕</button>}
        </div>

        {/* Hidden canvas */}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    </div>
  );
}