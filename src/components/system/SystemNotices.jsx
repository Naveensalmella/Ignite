"use client";
// [SYSTEM] popup windows — quest results, penalties, rank-ups, items. One at a time.
import { useEffect } from "react";
import useAppStore from "@/stores/useAppStore";
import SysWin from "./SysWin";
import { rankById } from "@/lib/system/ranks";

export default function SystemNotices() {
    const notice = useAppStore(s => s.notices[0]);
    const dismiss = useAppStore(s => s.dismissNotice);
    const setPage = useAppStore(s => s.setPage);

    useEffect(() => {
        if (!notice) return;
        const onKey = (e) => { if (e.key === "Escape" || e.key === "Enter") dismiss(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [notice, dismiss]);

    if (!notice) return null;
    const kind = notice.kind === "warning" ? "warning" : notice.kind === "rank" ? "gold" : "info";
    const rank = notice.rank ? rankById(notice.rank) : null;

    return (
        <div className="sys-notice-backdrop" role="alertdialog" aria-modal="true" aria-label={notice.title} onClick={dismiss}>
            <div className="sys-notice" key={notice.id} onClick={e => e.stopPropagation()}>
                <SysWin title={notice.title} kind={kind}>
                    {rank && <div className="sys-rank-big" style={{ color: rank.color }}>{rank.id === "N" ? "NL" : rank.id}</div>}
                    <div className="sys-notice-lines">
                        {(notice.lines || []).map((l, i) => <p key={i}>{l}</p>)}
                    </div>
                    <div className="flex gap-2 mt-5">
                        {notice.cta && (
                            <button type="button" className="sys-btn flex-1" onClick={() => { dismiss(); setPage(notice.cta.page); }}>
                                {notice.cta.label}
                            </button>
                        )}
                        <button type="button" className="sys-btn flex-1" onClick={dismiss} autoFocus>OK</button>
                    </div>
                </SysWin>
            </div>
        </div>
    );
}
