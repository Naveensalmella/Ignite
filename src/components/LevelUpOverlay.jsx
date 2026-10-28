"use client";
import { useEffect, useRef } from 'react';
import SysWin, { RankEmblem } from './system/SysWin';

export default function LevelUpOverlay({ level, rank, ap = 0, onClose }) {
  // App passes a new inline onClose on every render; keep the latest in a ref so the
  // auto-close timer isn't restarted (and postponed indefinitely) on each re-render.
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => { const t = setTimeout(() => onCloseRef.current?.(), 4500); return () => clearTimeout(t); }, []);
  return (
    <div className="lvl-overlay" onClick={onClose} role="status" aria-live="assertive">
      <div className="lvl-card">
        <SysWin title="Level Up!">
          <div className="lvl-num">{level}</div>
          <div className="sys-label mt-1">Level</div>
          {rank && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <RankEmblem rank={rank} size={30} />
              <span className="font-heading font-bold tracking-wider" style={{ color: rank.color }}>{rank.name}</span>
            </div>
          )}
          {ap > 0 && <div className="mt-3 text-[14px] font-semibold" style={{ color: "#bae6fd" }}>+{ap} Ability Points available</div>}
          <div className="text-[12px] mt-3" style={{ color: "var(--text-dim)" }}>Tap to continue</div>
        </SysWin>
      </div>
    </div>
  );
}
