"use client";
// Inventory, System Shop (items + your own real-life rewards) and achievements.
import { useState, lazy, Suspense } from "react";
import { Trash2, Plus } from "lucide-react";
import useAppStore from "@/stores/useAppStore";
import SysWin, { GoldAmount } from "./SysWin";
import { SkeletonPage } from "../Loading";
import { SHOP_ITEMS, itemById, REWARD_PREFIX } from "@/lib/system/items";
import { buy, buyReward, consumeItem, saveRewards } from "@/lib/system/actions";
import { today, toArr } from "@/utils";

const GamingHub = lazy(() => import("../GamingHub"));
const TABS = [["inventory", "Inventory"], ["shop", "Shop"], ["achievements", "Achievements"]];

/** Why an item can't be used right now (null = usable). */
function blocker(id, system, freezeData) {
    if (id === "shield" && toArr(freezeData?.freezesUsed).includes(today())) return "Today is already protected.";
    if (id === "pardon" && !system?.penalty?.active) return "No active Penalty Quest.";
    if (id === "reset" && !Object.values(system?.allocated || {}).some(n => Number(n) > 0)) return "No allocated points to refund.";
    return null;
}

function InventoryTab({ system, freezeData, goShop }) {
    const inv = system?.inventory || {};
    const rewards = toArr(system?.rewards);
    const owned = Object.entries(inv).filter(([, n]) => Number(n) > 0);
    if (owned.length === 0) {
        return (
            <SysWin title="Inventory">
                <div className="text-center text-[13.5px] py-4" style={{ color: "var(--text-secondary)" }}>Your inventory is empty.</div>
                <button type="button" className="sys-btn w-full" onClick={goShop}>Visit the shop</button>
            </SysWin>
        );
    }
    return (
        <SysWin title="Inventory">
            <div className="shop-grid">
                {owned.map(([id, n]) => {
                    const isReward = id.startsWith(REWARD_PREFIX);
                    const meta = isReward ? rewards.find(r => REWARD_PREFIX + r.id === id) || { name: "Reward", icon: "🎉" } : itemById(id);
                    if (!meta) return null;
                    const why = isReward ? null : blocker(id, system, freezeData);
                    return (
                        <div key={id} className="shop-item">
                            <div className="sys-row"><span className="shop-icon">{meta.icon}</span><span className="font-heading font-bold text-[18px]">×{n}</span></div>
                            <div className="shop-name">{meta.name}</div>
                            <div className="shop-desc">{isReward ? "A real-life reward you bought with Gold." : why || meta.desc}</div>
                            <button type="button" className="sys-btn !py-2 !text-[13px]" disabled={!!why} onClick={() => consumeItem(id)}>
                                {isReward ? "Redeem" : id === "box" ? "Open" : "Use"}
                            </button>
                        </div>
                    );
                })}
            </div>
        </SysWin>
    );
}

function RewardForm({ onAdd }) {
    const [name, setName] = useState("");
    const [icon, setIcon] = useState("🎁");
    const [price, setPrice] = useState(300);
    const add = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onAdd({ id: Date.now().toString(36), name: name.trim().slice(0, 40), icon: icon.trim().slice(0, 4) || "🎁", price: Math.max(10, Math.round(Number(price) || 0)) });
        setName("");
    };
    return (
        <form onSubmit={add} className="flex flex-wrap gap-2 mt-3">
            <input className="inp !w-14 text-center" value={icon} onChange={e => setIcon(e.target.value)} aria-label="Reward emoji" />
            <input className="inp flex-1 min-w-[140px]" value={name} maxLength={40} onChange={e => setName(e.target.value)} placeholder="e.g. New sneakers, movie night" aria-label="Reward name" />
            <input className="inp !w-24" type="number" min="10" step="10" value={price} onChange={e => setPrice(e.target.value)} aria-label="Price in gold" />
            <button type="submit" className="sys-btn" disabled={!name.trim()}><Plus size={15} /> Add</button>
        </form>
    );
}

function ShopTab({ system }) {
    const gold = Number(system?.gold) || 0;
    const rewards = toArr(system?.rewards);
    return (
        <>
            <SysWin title="System Shop" className="mb-4">
                <div className="shop-grid">
                    {SHOP_ITEMS.map(it => (
                        <div key={it.id} className="shop-item">
                            <span className="shop-icon">{it.icon}</span>
                            <div className="shop-name">{it.name}</div>
                            <div className="shop-desc">{it.desc}</div>
                            <div className="sys-row text-[12px]"><GoldAmount value={it.price} size={14} /><span style={{ color: "var(--text-dim)" }}>Owned: {Number(system?.inventory?.[it.id]) || 0}</span></div>
                            <button type="button" className="sys-btn !py-2 !text-[13px]" disabled={gold < it.price} onClick={() => buy(it.id)}>Buy</button>
                        </div>
                    ))}
                </div>
            </SysWin>
            <SysWin title="Your Rewards" kind="gold">
                <p className="text-[12.5px] mb-3" style={{ color: "var(--text-secondary)" }}>Turn Gold into real treats. Set a price that feels earned — then buy it only when you can afford it.</p>
                {rewards.length > 0 ? (
                    <div className="flex flex-col">
                        {rewards.map(r => (
                            <div key={r.id} className="quest-row">
                                <span className="text-[26px] w-9 text-center">{r.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="quest-name truncate">{r.name}</div>
                                    <GoldAmount value={r.price} size={13} />
                                </div>
                                <button type="button" className="sys-btn !py-1.5 !px-3 !text-[12.5px]" disabled={gold < r.price} onClick={() => buyReward(r)}>Buy</button>
                                <button type="button" className="icon-btn" onClick={() => saveRewards(rewards.filter(x => x.id !== r.id))} aria-label={`Delete ${r.name}`}><Trash2 size={15} /></button>
                            </div>
                        ))}
                    </div>
                ) : <div className="text-[13px]" style={{ color: "var(--text-dim)" }}>No rewards yet — add your first one.</div>}
                <RewardForm onAdd={(r) => saveRewards([...rewards, r])} />
            </SysWin>
        </>
    );
}

export default function InventoryPage({ initialTab = "inventory" }) {
    const [tab, setTab] = useState(initialTab);
    const s = useAppStore();
    const system = s.system;

    return (
        <div className="fade-in max-w-[760px] mx-auto">
            <div className="sys-row mb-3">
                <div className="seg flex-1" role="tablist" aria-label="Inventory sections">
                    {TABS.map(([k, l]) => (
                        <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? "is-active" : ""} onClick={() => setTab(k)}>{l}</button>
                    ))}
                </div>
            </div>
            <div className="gs !py-2.5 mb-4 sys-row">
                <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>Gold — earned from every XP gain, Daily Quests and rank-ups</span>
                <GoldAmount value={system?.gold} size={18} />
            </div>

            {tab === "inventory" && <InventoryTab system={system} freezeData={s.freezeData} goShop={() => setTab("shop")} />}
            {tab === "shop" && <ShopTab system={system} />}
            {tab === "achievements" && (
                <Suspense fallback={<SkeletonPage />}>
                    <GamingHub appState={s.getAppState()} totalXP={s.totalXP} streak={s.streak} workoutLog={s.workoutLog} addXP={s.addXP}
                        profile={s.profile} loginData={s.loginData} setLoginData={s.setLoginData} xpLog={s.xpLog}
                        activeTitle={s.activeTitle} setActiveTitle={s.setActiveTitle} questChainData={s.questChainData} setQuestChainData={s.setQuestChainData} />
                </Suspense>
            )}
        </div>
    );
}
