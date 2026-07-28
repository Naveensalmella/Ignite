"use client";
import { useState } from 'react';

export default function IntroPage({ onGetStarted }) {
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = [
        {
            icon: "🔥",
            title: "Welcome to IGNITE",
            subtitle: "Level Up Your Life",
            desc: "The gamified self-improvement platform that turns your daily routine into an RPG adventure.",
            color: "#10b981",
        },
        {
            icon: "⚔️",
            title: "Train Like a Warrior",
            subtitle: "22 Structured Programs",
            desc: "Gym, combat, yoga, running — pick your path. Track sets, reps, calories. Watch your body transform.",
            color: "#3b82f6",
        },
        {
            icon: "🍎",
            title: "Fuel Your Body",
            subtitle: "Smart Nutrition Tracking",
            desc: "199 Indian foods, AI-powered scanner, meal plans, and macro tracking. Eat right, perform better.",
            color: "#f59e0b",
        },
        {
            icon: "🔮",
            title: "AI Coach at Your Side",
            subtitle: "Flame Oracle",
            desc: "Your personal AI coach. 4 modes: Coach, Nutritionist, Wellness Guide, Motivator. Real-time streaming.",
            color: "#8b5cf6",
        },
        {
            icon: "🎮",
            title: "Game Your Growth",
            subtitle: "XP • Levels • Ranks • Badges",
            desc: "Earn XP for every action. Level up through 15 ranks. Unlock achievements, titles, and compete with friends.",
            color: "#ec4899",
        },
    ];

    const slide = slides[currentSlide];
    const isLast = currentSlide === slides.length - 1;

    return (
        <div style={{ minHeight: "100vh", background: "#07090d", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "24px 20px", position: "relative", overflow: "hidden" }}>
            {/* Background glow */}
            <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, ${slide.color}08 0%, transparent 70%)`, pointerEvents: "none", transition: "background 0.5s" }} />

            {/* Logo */}
            <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 24 }}>🔥</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: "#10b981", fontFamily: "Rajdhani, sans-serif", letterSpacing: 2 }}>IGNITE</span>
            </div>

            {/* Slide content */}
            <div style={{ textAlign: "center", maxWidth: 360, margin: "0 auto", padding: "40px 0" }}>
                <div style={{ fontSize: 64, marginBottom: 20, transition: "all 0.3s", animation: "slideUp 0.4s ease-out" }} key={currentSlide}>
                    {slide.icon}
                </div>
                <h1 style={{ fontSize: 28, fontWeight: 900, color: "#f3f4f6", fontFamily: "Rajdhani, sans-serif", marginBottom: 4, lineHeight: 1.2 }} key={`t${currentSlide}`}>
                    {slide.title}
                </h1>
                <div style={{ fontSize: 15, fontWeight: 600, color: slide.color, marginBottom: 16, fontFamily: "Rajdhani, sans-serif" }}>
                    {slide.subtitle}
                </div>
                <p style={{ fontSize: 14, color: "#9ca3af", lineHeight: 1.6, margin: 0 }}>
                    {slide.desc}
                </p>
            </div>

            {/* Dots */}
            <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
                {slides.map((_, i) => (
                    <div key={i} onClick={() => setCurrentSlide(i)} style={{ width: i === currentSlide ? 24 : 8, height: 8, borderRadius: 4, background: i === currentSlide ? slide.color : "rgba(255,255,255,.1)", transition: "all 0.3s", cursor: "pointer" }} />
                ))}
            </div>

            {/* Buttons */}
            <div style={{ width: "100%", maxWidth: 320 }}>
                {isLast ? (
                    <button onClick={onGetStarted} style={{ width: "100%", padding: "16px 24px", borderRadius: 14, border: "none", background: `linear-gradient(135deg, ${slide.color}, #06b6d4)`, color: "#060a0c", fontSize: 16, fontWeight: 800, fontFamily: "Rajdhani, sans-serif", cursor: "pointer", letterSpacing: 1, transition: "all 0.2s" }}>
                        GET STARTED 🚀
                    </button>
                ) : (
                    <div style={{ display: "flex", gap: 10 }}>
                        <button onClick={onGetStarted} style={{ flex: 1, padding: "14px", borderRadius: 12, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", color: "#6b7280", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                            Skip
                        </button>
                        <button onClick={() => setCurrentSlide(currentSlide + 1)} style={{ flex: 2, padding: "14px", borderRadius: 12, background: `linear-gradient(135deg, ${slide.color}, #06b6d4)`, border: "none", color: "#060a0c", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "Rajdhani, sans-serif" }}>
                            Next →
                        </button>
                    </div>
                )}
            </div>

            {/* Features strip at bottom */}
            <div style={{ position: "absolute", bottom: 20, display: "flex", gap: 16, opacity: 0.4 }}>
                {["⚔️", "🍎", "🔮", "🎮", "💪", "🏆"].map((icon, i) => (
                    <span key={i} style={{ fontSize: 16 }}>{icon}</span>
                ))}
            </div>
        </div>
    );
}