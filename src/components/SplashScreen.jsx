"use client";
import { useState, useEffect } from 'react';

export default function SplashScreen({ onComplete }) {
    const [phase, setPhase] = useState(0); // 0=logo, 1=text, 2=fade out

    useEffect(() => {
        const t1 = setTimeout(() => setPhase(1), 400);   // Show text
        const t2 = setTimeout(() => setPhase(2), 1800);   // Start fade
        const t3 = setTimeout(() => onComplete(), 2300);   // Done
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, [onComplete]);

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 99999,
            background: "#07090d",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            opacity: phase === 2 ? 0 : 1,
            transition: "opacity 0.5s ease-out",
        }}>
            {/* Background glows */}
            <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translateX(-50%)", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,.08) 0%, transparent 70%)", animation: "splashPulse 2s ease-in-out infinite" }} />
            <div style={{ position: "absolute", top: "35%", left: "50%", transform: "translateX(-50%)", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(6,182,212,.06) 0%, transparent 70%)", animation: "splashPulse 2s ease-in-out infinite 0.3s" }} />

            {/* Flame icon */}
            <div style={{
                fontSize: 56,
                marginBottom: 16,
                opacity: phase >= 0 ? 1 : 0,
                transform: phase >= 0 ? "scale(1) translateY(0)" : "scale(0.5) translateY(20px)",
                transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
                filter: "drop-shadow(0 0 20px rgba(16,185,129,.3))",
            }}>
                🔥
            </div>

            {/* IGNITE text */}
            <div style={{
                fontSize: 36,
                fontWeight: 900,
                fontFamily: "Rajdhani, sans-serif",
                letterSpacing: 6,
                background: "linear-gradient(135deg, #10b981, #06b6d4, #8b5cf6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                opacity: phase >= 1 ? 1 : 0,
                transform: phase >= 1 ? "translateY(0)" : "translateY(10px)",
                transition: "all 0.5s ease-out",
            }}>
                IGNITE
            </div>

            {/* Tagline */}
            <div style={{
                fontSize: 12,
                color: "#6b7280",
                fontWeight: 500,
                letterSpacing: 3,
                marginTop: 8,
                textTransform: "uppercase",
                opacity: phase >= 1 ? 1 : 0,
                transform: phase >= 1 ? "translateY(0)" : "translateY(10px)",
                transition: "all 0.5s ease-out 0.15s",
            }}>
                Level Up Your Life
            </div>

            {/* Loading bar */}
            <div style={{
                width: 120, height: 3, borderRadius: 2,
                background: "rgba(255,255,255,.06)",
                marginTop: 32,
                overflow: "hidden",
                opacity: phase >= 1 ? 1 : 0,
                transition: "opacity 0.3s",
            }}>
                <div style={{
                    height: "100%",
                    background: "linear-gradient(90deg, #10b981, #06b6d4)",
                    borderRadius: 2,
                    animation: "splashLoad 1.5s ease-in-out forwards",
                }} />
            </div>

            <style>{`
        @keyframes splashPulse {
          0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.5; }
          50% { transform: translateX(-50%) scale(1.1); opacity: 1; }
        }
        @keyframes splashLoad {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
        </div>
    );
}