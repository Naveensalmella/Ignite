"use client";
import { getLevel, getLevelProg, xpToNext } from '@/utils';
import { playerRank } from '@/lib/system/ranks';
import { RankEmblem } from './system/SysWin';

export default function HeaderXPBar({ totalXP = 0, streak = 0, system = null }) {
  const lv = getLevel(totalXP);
  const rank = playerRank(system, lv);
  const pct = Math.round(getLevelProg(totalXP) * 100);
  const needed = xpToNext(totalXP);
  const penalized = !!system?.penalty?.active;

  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <RankEmblem rank={rank} size={30} />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-[3px] gap-2">
          <span className="text-[12px] font-bold font-heading whitespace-nowrap tracking-wide" style={{ color: "var(--text-primary)" }}>
            Lv.{lv}
            {streak > 0 && <span style={{ color: "#fb923c" }}> 🔥{streak}</span>}
            {penalized && <span style={{ color: "#f87171" }} title="Penalty Quest active — XP halved"> ⚠</span>}
          </span>
          <span className="text-[11px] whitespace-nowrap" style={{ color: "var(--text-dim)" }}>{needed.toLocaleString()} to Lv.{lv + 1}</span>
        </div>
        <div className="sys-bar !h-[5px]" aria-hidden="true"><div style={{ width: `${pct}%` }} /></div>
      </div>
    </div>
  );
}
