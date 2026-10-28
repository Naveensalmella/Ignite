"use client";
import { useEffect, useRef } from 'react';
import { Zap, Shield } from 'lucide-react';

// Lightweight confetti — drops 80 particles, auto-cleans
export function ConfettiBlast({ trigger }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    if (!trigger) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // B6 tone palette (canvas can't read CSS variables, so these are literal hex)
    const colors = ["#38bdf8", "#2dd4bf", "#a78bfa", "#fbbf24", "#fb7185", "#60a5fa", "#fb923c", "#2563eb"];
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 100,
      w: 6 + Math.random() * 6,
      h: 4 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 4,
      vy: 2 + Math.random() * 4,
      rot: Math.random() * 360,
      rotV: (Math.random() - 0.5) * 10,
      life: 1,
    }));

    let frame = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      particles.forEach(p => {
        if (p.life <= 0) return;
        alive = true;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08;
        p.rot += p.rotV;
        p.life -= 0.008;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      frame++;
      if (alive && frame < 300) animRef.current = requestAnimationFrame(animate);
      else ctx.clearRect(0, 0, canvas.width, canvas.height); // don't leave frozen particles on screen
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [trigger]);

  if (!trigger) return null;
  return (
    <canvas ref={canvasRef} style={{
      position: "fixed", inset: 0, zIndex: 99998,
      pointerEvents: "none",
    }} />
  );
}

// XP Popup Toast — shows "+25 XP Training complete"
export function XPPopup({ events }) {
  if (!events || events.length === 0) return null;
  return (
    <div className="fixed flex flex-col items-center gap-1.5" style={{ top: 80, left: "50%", transform: "translateX(-50%)", zIndex: 99997 }} aria-live="polite">
      {events.slice(-3).map((ev, i) => (
        <div key={ev.id || i} className="fade-in inline-flex items-center gap-1.5 text-[14px] font-bold" style={{
          padding: "9px 16px", borderRadius: 999,
          background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow)",
          color: "var(--text-primary)",
        }}>
          <Zap size={15} style={{ color: "var(--accent)" }} aria-hidden="true" />
          <span style={{ color: "var(--accent)" }}>+{ev.xp ?? ev.amount ?? 0} XP</span>
          <span className="font-medium" style={{ color: "var(--text-secondary)" }}>· {ev.reason}</span>
        </div>
      ))}
    </div>
  );
}

// Level Up Overlay — full screen celebration
export function LevelUpCelebration({ level, rank, onClose }) {
  if (!level) return null;
  return (
    <div onClick={onClose} role="dialog" aria-modal="true" aria-label={`Level up: level ${level}`}
      className="fixed inset-0 flex items-center justify-center px-4 cursor-pointer"
      style={{ zIndex: 99999, background: "color-mix(in srgb, var(--bg) 92%, transparent)", backdropFilter: "blur(12px)" }}>
      <div className="card hero fade-in text-center w-full" style={{ maxWidth: 340, padding: "28px 22px" }}>
        <div className="flex justify-center mb-3">
          <span className="flex items-center justify-center" style={{ width: 64, height: 64, borderRadius: 22, background: "rgba(255, 255, 255, .2)", color: "#fff" }} aria-hidden="true">
            <Zap size={32} strokeWidth={2.2} />
          </span>
        </div>
        <div className="text-[13px] font-bold" style={{ color: "var(--text-secondary)", letterSpacing: 3 }}>LEVEL UP</div>
        <div className="text-[52px] font-extrabold num leading-none mt-1" style={{ color: "var(--text-primary)" }}>Level {level}</div>
        {rank && (
          <div className="mt-4"><span className="pill" style={{ fontSize: 14, padding: "6px 14px" }}><Shield size={14} aria-hidden="true" /> {rank.name}</span></div>
        )}
        <div className="text-[12.5px] mt-5" style={{ color: "var(--text-dim)" }}>Tap anywhere to continue</div>
      </div>
    </div>
  );
}
