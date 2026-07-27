"use client";
import { useRef } from 'react';

// Generates a beautiful achievement card image and shares it
export default function ShareCard({ type = "workout", data = {}, profile = {}, totalXP = 0, streak = 0, onClose }) {
  const canvasRef = useRef(null);

  const templates = {
    workout: {
      title: "Workout Complete! 💪",
      subtitle: data.splitName || "Training Session",
      stats: [
        { label: "Duration", value: `${Math.round((data.duration || 0) / 60)} min` },
        { label: "Calories", value: `${data.calBurned || 0} cal` },
        { label: "Exercises", value: `${data.exercises?.length || 0}` },
      ],
      color: "#10b981",
    },
    streak: {
      title: `${streak} Day Streak! 🔥`,
      subtitle: "Consistency is the key",
      stats: [
        { label: "Streak", value: `${streak} days` },
        { label: "Total XP", value: `${totalXP.toLocaleString()}` },
        { label: "Level", value: `${data.level || 1}` },
      ],
      color: "#f59e0b",
    },
    levelup: {
      title: `Level ${data.level || 1} Reached! ⚡`,
      subtitle: data.rank || "Rising Star",
      stats: [
        { label: "Level", value: `${data.level || 1}` },
        { label: "Total XP", value: `${totalXP.toLocaleString()}` },
        { label: "Rank", value: data.rank || "Cinder" },
      ],
      color: "#8b5cf6",
    },
    milestone: {
      title: `${data.title || "Milestone"} 🏆`,
      subtitle: data.msg || "Achievement unlocked!",
      stats: [
        { label: "XP Earned", value: `${totalXP.toLocaleString()}` },
        { label: "Streak", value: `${streak}d` },
      ],
      color: "#ef4444",
    },
  };

  const template = templates[type] || templates.workout;

  const generateImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
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
    ctx.roundRect(10, 10, 580, 380, 20);
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
      ctx.beginPath();
      ctx.roundRect(x, 200, statWidth - 15, 80, 12);
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

  const shareCard = async () => {
    const imageUrl = await generateImage();
    if (!imageUrl) return;

    // Convert to blob for sharing
    const blob = await (await fetch(imageUrl)).blob();
    const file = new File([blob], "ignite-achievement.png", { type: "image/png" });

    const shareText = `${template.title}\n${template.subtitle}\n${template.stats.map(s => `${s.label}: ${s.value}`).join(" · ")}\n\n🔥 Join IGNITE: ignite-reality.vercel.app`;

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ title: "IGNITE Achievement", text: shareText, files: [file] });
      } catch { }
    } else if (navigator.share) {
      try {
        await navigator.share({ title: "IGNITE Achievement", text: shareText });
      } catch { }
    } else {
      // Fallback: download image
      const a = document.createElement("a");
      a.href = imageUrl;
      a.download = "ignite-achievement.png";
      a.click();
    }
  };

  const downloadCard = async () => {
    const imageUrl = await generateImage();
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = "ignite-achievement.png";
    a.click();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.8)", backdropFilter: "blur(8px)", padding: 16 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ maxWidth: 400, width: "100%" }}>
        {/* Preview */}
        <div style={{ background: "#07090d", borderRadius: 16, border: `1px solid ${template.color}30`, padding: 20, marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: template.color, fontWeight: 600, marginBottom: 4 }}>🔥 IGNITE</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani, sans-serif" }}>{template.title}</div>
          <div style={{ fontSize: 14, color: template.color, marginTop: 2 }}>{template.subtitle}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            {template.stats.map(s => (
              <div key={s.label} style={{ flex: 1, padding: 12, borderRadius: 10, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.05)", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: template.color, fontFamily: "Rajdhani, sans-serif" }}>{s.value}</div>
                <div style={{ fontSize: 10, color: "#6b7280" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8 }}>
          <button className="bp" onClick={shareCard} style={{ flex: 1, padding: 14, fontSize: 14 }}>📤 Share</button>
          <button className="bg" onClick={downloadCard} style={{ flex: 1, padding: 14, fontSize: 14 }}>💾 Save Image</button>
          <button className="bg" onClick={onClose} style={{ padding: "14px 16px" }}>✕</button>
        </div>

        {/* Hidden canvas */}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    </div>
  );
}