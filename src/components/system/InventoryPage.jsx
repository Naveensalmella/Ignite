"use client";
// Items: inventory, shop (System items + your own real-life rewards), titles and badges.
import { useState, lazy, Suspense } from "react";
import { Trash2, Plus, Backpack, Award, Lock, Coins } from "lucide-react";
import useAppStore from "@/stores/useAppStore";
import { Card, Tabs, IconBadge, EmptyState, Pill } from "../ui/kit";
import { ITEM_ICON, ITEM_TONE } from "../ui/icons";
import { GoldAmount } from "./SysWin";
import { SkeletonPage } from "../Loading";
import { SHOP_ITEMS, itemById, REWARD_PREFIX } from "@/lib/system/items";
import { buy, buyReward, consumeItem, saveRewards, equipTitle } from "@/lib/system/actions";
import { TITLES, describeEffect } from "@/lib/system/progression";
import { today, toArr } from "@/utils";

const GamingHub = lazy(() => import("../GamingHub"));
const TABS = [["inventory", "Items"], ["shop", "Shop"], ["titles", "Titles"], ["achievements", "Badges"]];

/** Why an item can't be used right now (null = usable). */
function blocker(id, system, freezeData) {
    if (id === "key") return "Used automatically when you clear a Red Gate (Train → Gates).";
    if (id === "shield" && toArr(freezeData?.freezesUsed).includes(today())) return "Today is already protected.";
    if (id === "pardon" && !system?.penalty?.active) return "No active Penalty Quest.";
    if (id === "reset" && !Object.values(system?.allocated || {}).some(n => Number(n) > 0)) return "No assigned points to refund.";
    return null;
}

function ItemIcon({ id, emoji }) {
    if (emoji) return <span className="icon-badge text-[22px]" style={{ width: 44, height: 44, borderRadius: 14, "--tone": "var(--tone-amber)" }} aria-hidden="true">{emoji}</span>;
    return <IconBadge icon={ITEM_ICON[id] || Backpack} tone={ITEM_TONE[id] || "sky"} size={44} />;
}

function InventoryTab({ system, freezeData, goShop }) {
    const inv = system?.inventory || {};
    const rewards = toArr(system?.rewards);
    const owned = Object.entries(inv).filter(([, n]) => Number(n) > 0);
    if (owned.length === 0) {
        return (
            <Card>
                <EmptyState icon={Backpack} title="Your bag is empty" action={<button type="button" className="bp" onClick={goShop}>Visit the shop</button>}>
                    Items you buy or find in Gates show up here.
                </EmptyState>
            </Card>
        );
    }
    return (
        <div className="shop-grid">
            {owned.map(([id, n]) => {
                const isReward = id.startsWith(REWARD_PREFIX);
                const meta = isReward ? rewards.find(r => REWARD_PREFIX + r.id === id) || { name: "Reward", icon: "🎉" } : itemById(id);
                if (!meta) return null;
                const why = isReward ? null : blocker(id, system, freezeData);
                return (
                    <div key={id} className="shop-item">
                        <div className="flex items-start justify-between">
                            <ItemIcon id={id} emoji={isReward ? meta.icon : null} />
                            <span className="text-[17px] font-extrabold num">×{n}</span>
                        </div>
                        <div className="shop-name">{meta.name}</div>
                        <div className="shop-desc">{isReward ? "A real-life reward you bought with Gold." : why || meta.desc}</div>
                        <button type="button" className={isReward ? "bp !py-2 !text-[13px]" : "bg !py-2 !text-[13px]"} disabled={!!why} onClick={() => consumeItem(id)}>
                            {isReward ? "Redeem" : id === "box" ? "Open" : "Use"}
                        </button>
                    </div>
                );
            })}
        </div>
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
            <input className="inp flex-1 min-w-[140px]" value={name} maxLength={40} onChange={e => setName(e.target.value)} placeholder="e.g. Movie night" aria-label="Reward name" />
            <input className="inp !w-24" type="number" min="10" step="10" value={price} onChange={e => setPrice(e.target.value)} aria-label="Price in gold" />
            <button type="submit" className="bp" disabled={!name.trim()}><Plus size={15} /> Add</button>
        </form>
    );
}

function ShopTab({ system }) {
    const gold = Number(system?.gold) || 0;
    const rewards = toArr(system?.rewards);
    return (
        <>
            <div className="shop-grid">
                {SHOP_ITEMS.map(it => (
                    <div key={it.id} className="shop-item">
                        <div className="flex items-start justify-between">
                            <ItemIcon id={it.id} />
                            <span className="text-[12px] dim">Owned {Number(system?.inventory?.[it.id]) || 0}</span>
                        </div>
                        <div className="shop-name">{it.name}</div>
                        <div className="shop-desc">{it.desc}</div>
                        <button type="button" className="bp !py-2 !text-[13px]" disabled={gold < it.price} onClick={() => buy(it.id)}>
                            <Coins size={14} /> {it.price}
                        </button>
                    </div>
                ))}
            </div>
            <Card title="Your rewards" sub="Real treats, paid in Gold">
                {rewards.length > 0 ? rewards.map(r => (
                    <div key={r.id} className="list-row">
                        <span className="icon-badge text-[20px]" style={{ width: 38, height: 38, borderRadius: 12, "--tone": "var(--tone-amber)" }} aria-hidden="true">{r.icon}</span>
                        <div className="flex-1 min-w-0">
                            <div className="row-title truncate">{r.name}</div>
                            <GoldAmount value={r.price} size={12.5} />
                        </div>
                        <button type="button" className="bp !py-1.5 !px-3.5 !text-[12.5px]" disabled={gold < r.price} onClick={() => buyReward(r)}>Buy</button>
                        <button type="button" className="icon-btn !w-9 !h-9" onClick={() => saveRewards(rewards.filter(x => x.id !== r.id))} aria-label={`Delete ${r.name}`}><Trash2 size={15} /></button>
                    </div>
                )) : <p className="text-[13px] dim">No rewards yet — add your first one.</p>}
                <RewardForm onAdd={(r) => saveRewards([...rewards, r])} />
            </Card>
        </>
    );
}

function TitlesTab({ system, activeTitle }) {
    const owned = new Set(toArr(system?.titles));
    return (
        <Card title="Titles" sub="Equip one for its bonus">
            {TITLES.map(t => {
                const has = owned.has(t.id);
                const on = activeTitle === t.name;
                return (
                    <div key={t.id} className="list-row" style={{ opacity: has ? 1 : 0.55 }}>
                        <IconBadge icon={has ? Award : Lock} tone={on ? "amber" : has ? "sky" : "blue"} size={38} />
                        <div className="flex-1 min-w-0">
                            <div className="row-title">{t.name}</div>
                            <div className="row-sub">{has ? describeEffect(t.effect) : t.how}</div>
                        </div>
                        {has && (on
                            ? <button type="button" className="bp !py-1.5 !px-3.5 !text-[12.5px]" onClick={() => equipTitle(t.name)}>Equipped</button>
                            : <button type="button" className="bg !py-1.5 !px-3.5 !text-[12.5px]" onClick={() => equipTitle(t.name)}>Equip</button>)}
                    </div>
                );
            })}
        </Card>
    );
}

export default function InventoryPage({ initialTab = "inventory" }) {
    const [tab, setTab] = useState(initialTab);
    const s = useAppStore();
    const system = s.system;

    return (
        <div className="page fade-in">
            <Card hero>
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <div className="text-[12.5px]" style={{ color: "var(--text-secondary)" }}>Your gold</div>
                        <div className="text-[30px] font-extrabold num leading-tight">{Math.floor(Number(system?.gold) || 0).toLocaleString()}</div>
                        <div className="text-[12px]" style={{ color: "var(--text-secondary)" }}>Earned from XP, Daily Quests, Gates and rank-ups</div>
                    </div>
                    <span className="icon-badge" style={{ width: 54, height: 54, borderRadius: 18, color: "#fff", background: "rgba(255,255,255,.18)" }} aria-hidden="true"><Coins size={28} /></span>
                </div>
                {s.activeTitle && <div className="mt-3"><Pill icon={Award}>{s.activeTitle}</Pill></div>}
            </Card>
            <Tabs tabs={TABS} value={tab} onChange={setTab} label="Items sections" />

            {tab === "inventory" && <InventoryTab system={system} freezeData={s.freezeData} goShop={() => setTab("shop")} />}
            {tab === "shop" && <ShopTab system={system} />}
            {tab === "titles" && <TitlesTab system={system} activeTitle={s.activeTitle} />}
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
