"use client";
// Compact level chip for the header: progress ring with the level inside, plus the streak.
import { Flame } from 'lucide-react';
import { getLevel, getLevelProg, xpToNext } from '@/utils';
import { Ring } from './ui/kit';

export default function HeaderXPBar({ totalXP = 0, streak = 0, system = null }) {
  const lv = getLevel(totalXP);
  const prog = getLevelProg(totalXP);
  const penalized = !!system?.penalty?.active;

  return (
    <div className="lv-chip" title={`Level ${lv} · ${xpToNext(totalXP).toLocaleString()} XP to level ${lv + 1}${penalized ? " · Penalty active: XP halved" : ""}`}>
      <Ring value={prog} size={28} stroke={3.5}>
        <span className="text-[10.5px] font-extrabold num">{lv}</span>
      </Ring>
      <span className="num">Lv {lv}</span>
      {streak > 0 && <span className="streak num"><Flame size={14} strokeWidth={2.4} />{streak}</span>}
      {penalized && <span className="w-2 h-2 rounded-full" style={{ background: "var(--danger)" }} aria-label="Penalty active" />}
    </div>
  );
}
