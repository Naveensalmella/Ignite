import { useRef, useState } from 'react';
import { getLevel, getRank, today } from '../utils';

export default function ShareCard({ totalXP, streak, workoutLog, profile }) {
    const canvasRef = useRef(null);
    const [generated, setGenerated] = useState(null);
    const [copied, setCopied] = useState(false);

    const lv = getLevel(totalXP);
    const rank = getRank(lv);
    const d = today();
    const todayW = workoutLog[d];
    const totalWorkouts = Object.keys(workoutLog || {}).length;
    const totalCal = Object.values(workoutLog || {}).reduce((s, w) => s + (w.calBurned || 0), 0);

    const generateCard = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const W = 1080, H = 1920;
        canvas.width = W;
        canvas.height = H;

        // Background
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, "#07090d");
        grad.addColorStop(0.5, "#0d1117");
        grad.addColorStop(1, "#07090d");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Glow circles
        const drawGlow = (x, y, r, color, alpha) => {
            const g = ctx.createRadialGradient(x, y, 0, x, y, r);
            g.addColorStop(0, `rgba(${color},${alpha})`);
            g.addColorStop(1, "transparent");
            ctx.fillStyle = g;
            ctx.fillRect(x - r, y - r, r * 2, r * 2);
        };
        drawGlow(W / 2, 400, 400, "16,185,129", 0.08);
        drawGlow(200, 1200, 300, "6,182,212", 0.05);

        // Top accent line
        const lineGrad = ctx.createLinearGradient(0, 0, W, 0);
        lineGrad.addColorStop(0, "#10b981");
        lineGrad.addColorStop(1, "#06b6d4");
        ctx.fillStyle = lineGrad;
        ctx.fillRect(0, 0, W, 6);

        // IGNITE logo
        ctx.font = "bold 48px 'Rajdhani', sans-serif";
        ctx.fillStyle = "#10b981";
        ctx.textAlign = "center";
        ctx.fillText("IGNITE", W / 2, 120);

        ctx.font = "24px 'Inter', sans-serif";
        ctx.fillStyle = "#6b7280";
        ctx.fillText("Self-Improvement RPG", W / 2, 160);

        // Name
        ctx.font = "bold 56px 'Rajdhani', sans-serif";
        ctx.fillStyle = "#f3f4f6";
        ctx.fillText(profile.name || "Warrior", W / 2, 280);

        // Rank badge
        const rankText = `Level ${lv} · ${rank.name}`;
        ctx.font = "bold 32px 'Rajdhani', sans-serif";
        ctx.fillStyle = rank.color || "#10b981";
        ctx.fillText(rankText, W / 2, 340);

        if (rank.title) {
            ctx.font = "italic 24px 'Inter', sans-serif";
            ctx.fillStyle = "#4b5563";
            ctx.fillText(`"${rank.title}"`, W / 2, 385);
        }

        // Stats cards
        const drawStatCard = (x, y, w, h, value, label, color) => {
            // Card bg
            ctx.fillStyle = "rgba(17,24,39,0.8)";
            ctx.beginPath();
            ctx.roundRect(x, y, w, h, 20);
            ctx.fill();
            // Border
            ctx.strokeStyle = `rgba(${color},0.15)`;
            ctx.lineWidth = 1;
            ctx.stroke();
            // Value
            ctx.font = "bold 52px 'Rajdhani', sans-serif";
            ctx.fillStyle = `rgb(${color})`;
            ctx.textAlign = "center";
            ctx.fillText(value, x + w / 2, y + h / 2 + 5);
            // Label
            ctx.font = "18px 'Inter', sans-serif";
            ctx.fillStyle = "#6b7280";
            ctx.fillText(label, x + w / 2, y + h / 2 + 38);
        };

        const cw = 460, ch = 140, gap = 40;
        const sx = (W - cw * 2 - gap) / 2;

        drawStatCard(sx, 450, cw, ch, `${lv}`, "LEVEL", "16,185,129");
        drawStatCard(sx + cw + gap, 450, cw, ch, `${streak}d`, "STREAK", "239,68,68");
        drawStatCard(sx, 620, cw, ch, `${totalXP.toLocaleString()}`, "TOTAL XP", "6,182,212");
        drawStatCard(sx + cw + gap, 620, cw, ch, `${totalWorkouts}`, "WORKOUTS", "245,158,11");
        drawStatCard(sx, 790, cw, ch, `${totalCal.toLocaleString()}`, "CALORIES BURNED", "139,92,250");
        drawStatCard(sx + cw + gap, 790, cw, ch, todayW ? "Done" : "Pending", "TODAY", todayW ? "34,197,94" : "107,114,128");

        // Today's workout info
        if (todayW) {
            ctx.fillStyle = "rgba(17,24,39,0.8)";
            ctx.beginPath();
            ctx.roundRect(sx, 970, cw * 2 + gap, 120, 20);
            ctx.fill();
            ctx.strokeStyle = "rgba(16,185,129,0.12)";
            ctx.stroke();
            ctx.font = "bold 28px 'Rajdhani', sans-serif";
            ctx.fillStyle = "#22c55e";
            ctx.fillText("Today's Training Complete", W / 2, 1020);
            ctx.font = "22px 'Inter', sans-serif";
            ctx.fillStyle = "#6b7280";
            ctx.fillText(`${todayW.splitName || "Workout"} · ${todayW.calBurned || 0} cal`, W / 2, 1060);
        }

        // Week activity
        const days = ["S", "M", "T", "W", "T", "F", "S"];
        const dw = 120, dy = 1140;
        const weekStart = (W - dw * 7) / 2;
        days.forEach((day, i) => {
            const dt = new Date();
            dt.setDate(dt.getDate() - (6 - i));
            const ds = dt.toISOString().split("T")[0];
            const done = !!workoutLog[ds];
            const x = weekStart + i * dw;
            ctx.fillStyle = done ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.02)";
            ctx.beginPath();
            ctx.roundRect(x + 10, dy, dw - 20, 70, 12);
            ctx.fill();
            ctx.font = "bold 22px 'Inter', sans-serif";
            ctx.fillStyle = done ? "#22c55e" : "#4b5563";
            ctx.textAlign = "center";
            ctx.fillText(day, x + dw / 2, dy + 30);
            ctx.fillText(done ? "✓" : "·", x + dw / 2, dy + 56);
        });

        // Motivational quote
        const quotes = [
            "Discipline is the bridge between goals and accomplishment.",
            "The only bad workout is the one that didn't happen.",
            "Your only limit is you.",
            "Champions train, losers complain.",
            "One day or day one. You decide.",
        ];
        ctx.font = "italic 26px 'Inter', sans-serif";
        ctx.fillStyle = "#4b5563";
        ctx.fillText(quotes[Math.floor(Math.random() * quotes.length)], W / 2, 1320);

        // Bottom CTA
        ctx.fillStyle = "rgba(16,185,129,0.08)";
        ctx.beginPath();
        ctx.roundRect(100, H - 200, W - 200, 80, 16);
        ctx.fill();
        ctx.font = "bold 26px 'Rajdhani', sans-serif";
        ctx.fillStyle = "#10b981";
        ctx.fillText("ignite-reality.vercel.app", W / 2, H - 150);

        ctx.font = "18px 'Inter', sans-serif";
        ctx.fillStyle = "#4b5563";
        ctx.fillText("Start your journey today", W / 2, H - 100);

        // Date
        ctx.font = "16px 'Inter', sans-serif";
        ctx.fillStyle = "#374151";
        ctx.fillText(new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), W / 2, H - 50);

        setGenerated(canvas.toDataURL("image/png"));
    };

    const download = () => {
        if (!generated) return;
        const a = document.createElement("a");
        a.href = generated;
        a.download = `ignite-stats-${d}.png`;
        a.click();
    };

    const share = async () => {
        if (!generated) return;
        try {
            const blob = await (await fetch(generated)).blob();
            const file = new File([blob], "ignite-stats.png", { type: "image/png" });
            if (navigator.share) {
                await navigator.share({ files: [file], title: "My IGNITE Stats", text: "Check out my progress on IGNITE!" });
            } else {
                download();
            }
        } catch (e) { download(); }
    };

    return (
        <div>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>📱 Share Your Progress</h2>
                <p style={{ color: "#6b7280", fontSize: 13, marginTop: 4 }}>Generate an Instagram story card with your stats</p>
            </div>

            <canvas ref={canvasRef} style={{ display: "none" }} />

            {!generated ? (
                <div className="gs" style={{ textAlign: "center", padding: "40px 20px" }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📸</div>
                    <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 20 }}>Creates a beautiful image with your level, rank, streak, workouts, and XP — ready to post on Instagram.</p>
                    <button className="bp" onClick={generateCard} style={{ padding: "14px 40px", fontSize: 16, letterSpacing: 1 }}>Generate Share Card</button>
                </div>
            ) : (
                <div className="fade-in">
                    <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(16,185,129,.15)", marginBottom: 16 }}>
                        <img src={generated} alt="Share card" style={{ width: "100%", display: "block" }} />
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                        <button className="bp" onClick={share} style={{ flex: 1, padding: 14, fontSize: 15 }}>📤 Share</button>
                        <button className="bg" onClick={download} style={{ flex: 1, padding: 14 }}>💾 Download</button>
                    </div>
                    <button className="bg" onClick={() => setGenerated(null)} style={{ width: "100%", marginTop: 10, padding: 10 }}>🔄 Regenerate</button>
                </div>
            )}
        </div>
    );
}