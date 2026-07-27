"use client";
import { useMemo } from 'react';
import { getLevel, getLevelProg, getRank, xpToNext } from '@/utils';

export default function HeaderXPBar({ totalXP = 0, streak = 0 }) {
  const lv = getLevel(totalXP);
  const rank = getRank(lv);
  const prog = getLevelProg(totalXP);
  const needed = xpToNext(totalXP);
  const pct = Math.round(prog * 100);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
      {/* Level badge */}
      <div style={{
        width: 32, height: 32, borderRadius: "50%",
        background: `linear-gradient(135deg, ${rank.color || "#10b981"}, #06b6d4)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 900, color: "#060a0c", fontFamily: "Rajdhani, sans-serif",
        flexShrink: 0
      }}>
        {lv}
      </div>

      {/* XP info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani, sans-serif", whiteSpace: "nowrap" }}>
            {rank.name} {streak > 0 && <span style={{ color: "#f59e0b" }}>🔥{streak}</span>}
          </span>
          <span style={{ fontSize: 9, color: "#6b7280", whiteSpace: "nowrap" }}>{needed} to Lv.{lv + 1}</span>
        </div>
        <div style={{ height: 4, background: "rgba(255,255,255,.06)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${pct}%`,
            background: `linear-gradient(90deg, ${rank.color || "#10b981"}, #06b6d4)`,
            borderRadius: 2, transition: "width 0.8s ease"
          }} />
        </div>
      </div>
    </div>
  );
}