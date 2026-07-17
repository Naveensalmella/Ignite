import { useEffect, useRef } from 'react';

// Lightweight confetti — drops 80 particles, auto-cleans
export function ConfettiBlast({ trigger }) {
    const canvasRef = useRef(null);
    const animRef = useRef(null);

    useEffect(() => {
        if (!trigger) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const colors = ["#10b981", "#06b6d4", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#22c55e", "#fbbf24"];
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

// XP Popup Toast — shows "+25 XP Training complete" with animation
export function XPPopup({ events }) {
    if (!events || events.length === 0) return null;
    return (
        <div style={{ position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)", zIndex: 99997, display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
            {events.slice(-3).map((ev, i) => (
                <div key={ev.id || i} style={{
                    padding: "10px 20px", borderRadius: 12,
                    background: "rgba(16,185,129,.15)", backdropFilter: "blur(10px)",
                    border: "1px solid rgba(16,185,129,.25)",
                    color: "#10b981", fontSize: 14, fontWeight: 700,
                    fontFamily: "Rajdhani,sans-serif", letterSpacing: 1,
                    animation: "fadeUp .4s ease both",
                }}>
                    +{ev.xp} XP · {ev.reason}
                </div>
            ))}
        </div>
    );
}

// Level Up Overlay — full screen celebration
export function LevelUpCelebration({ level, rank, onClose }) {
    if (!level) return null;
    return (
        <div onClick={onClose} style={{
            position: "fixed", inset: 0, zIndex: 99999,
            background: "rgba(3,4,7,.92)", backdropFilter: "blur(12px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
        }}>
            <div style={{ textAlign: "center", animation: "fadeUp .5s ease both" }}>
                <div style={{ fontSize: 72, marginBottom: 16 }}>⚡</div>
                <div style={{
                    fontSize: 16, color: "#6b7280", fontFamily: "Rajdhani,sans-serif",
                    letterSpacing: 4, marginBottom: 8,
                }}>LEVEL UP</div>
                <div style={{
                    fontSize: 64, fontWeight: 900, fontFamily: "Rajdhani,sans-serif",
                    background: "linear-gradient(135deg,#10b981,#06b6d4)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                    lineHeight: 1,
                }}>Level {level}</div>
                {rank && (
                    <div style={{
                        marginTop: 12, padding: "6px 20px", borderRadius: 100,
                        background: `${rank.color}15`, border: `1px solid ${rank.color}30`,
                        color: rank.color, fontSize: 16, fontWeight: 700,
                        fontFamily: "Rajdhani,sans-serif", display: "inline-block",
                    }}>{rank.emoji} {rank.name}</div>
                )}
                <div style={{ color: "#4b5563", fontSize: 13, marginTop: 20 }}>Tap anywhere to continue</div>
            </div>
        </div>
    );
}