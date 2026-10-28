"use client";
import { useState, useMemo } from 'react';
import {
  UtensilsCrossed, Car, ShoppingBag, Receipt, Gamepad2, Pill as PillIcon, GraduationCap, House, Tag,
  Banknote, Laptop, TrendingUp, Gift, Coins, Trash2, Plus, Wallet, PieChart,
} from 'lucide-react';
import { today, toArr } from '@/utils';
import { Card, ListRow, Tabs, Bar, EmptyState } from '@/components/ui/kit';

const CATEGORIES = {
  income: ["Salary", "Freelance", "Investment", "Gift", "Other Income"],
  expense: ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Health", "Education", "Rent", "Other"],
};
// Category → tone (see --tone-* tokens) and line icon
const CAT_TONE = { Food: "amber", Transport: "blue", Shopping: "rose", Bills: "orange", Entertainment: "violet", Health: "sky", Education: "teal", Rent: "orange", Other: "blue", Salary: "lime", Freelance: "sky", Investment: "teal", Gift: "amber", "Other Income": "lime" };
// Firestore data is untrusted: amounts may be strings/missing, dates may be missing, entries may be null
const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const monthLabel = (m) => { const [y, mo] = String(m).split("-").map(Number); const dt = new Date(y, (mo || 1) - 1, 1); return isNaN(dt) ? m : dt.toLocaleDateString("en", { month: "short", year: "2-digit" }); };
const CAT_ICONS = { Food: UtensilsCrossed, Transport: Car, Shopping: ShoppingBag, Bills: Receipt, Entertainment: Gamepad2, Health: PillIcon, Education: GraduationCap, Rent: House, Other: Tag, Salary: Banknote, Freelance: Laptop, Investment: TrendingUp, Gift: Gift, "Other Income": Coins };
const catIcon = (c) => CAT_ICONS[c] || Tag;
const catTone = (c) => CAT_TONE[c] || "blue";
const money = (v) => `₹${num(v).toLocaleString()}`;

export default function FinancePage({ finances = [], setFinances = () => { }, addXP = () => { } }) {
  const d = today();
  const [tab, setTab] = useState("overview");
  const [txType, setTxType] = useState("expense");
  const [txAmount, setTxAmount] = useState("");
  const [txCategory, setTxCategory] = useState("");
  const [txNote, setTxNote] = useState("");
  const [filterMonth, setFilterMonth] = useState(d.slice(0, 7)); // YYYY-MM

  const amountVal = parseFloat(txAmount);
  const amountValid = Number.isFinite(amountVal) && amountVal > 0;

  const addTransaction = () => {
    if (!amountValid || !txCategory) return;
    const tx = { id: Date.now(), type: txType, amount: Math.round(amountVal * 100) / 100, category: txCategory, note: txNote.trim(), date: d };
    setFinances(prev => [tx, ...toArr(prev)]);
    setTxAmount(""); setTxCategory(""); setTxNote("");
    setFilterMonth(d.slice(0, 7));
    setTab("overview");
    addXP(5, "Finance logged");
  };

  const deleteTx = (id) => {
    if (!window.confirm("Delete this transaction?")) return;
    setFinances(prev => toArr(prev).filter(t => t.id !== id));
  };

  // Monthly data
  const txList = useMemo(() => toArr(finances).filter(t => t && typeof t === "object"), [finances]);
  const monthTxs = useMemo(() => txList.filter(t => String(t.date || "").startsWith(filterMonth)), [txList, filterMonth]);
  const totalIncome = monthTxs.filter(t => t.type === "income").reduce((s, t) => s + num(t.amount), 0);
  const totalExpense = monthTxs.filter(t => t.type === "expense").reduce((s, t) => s + num(t.amount), 0);
  const savings = totalIncome - totalExpense;

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const cats = {};
    monthTxs.filter(t => t.type === "expense").forEach(t => {
      const c = t.category || "Other";
      cats[c] = (cats[c] || 0) + num(t.amount);
    });
    return Object.entries(cats).sort((a, b) => b[1] - a[1]);
  }, [monthTxs]);

  // All transactions, newest first
  const recent = useMemo(() => [...txList].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")) || num(b.id) - num(a.id)), [txList]);

  // Month selector
  const months = useMemo(() => {
    const set = new Set();
    txList.forEach(t => { if (typeof t.date === "string" && /^\d{4}-\d{2}/.test(t.date)) set.add(t.date.slice(0, 7)); });
    set.add(d.slice(0, 7));
    return [...set].sort().reverse();
  }, [txList, d]);

  const maxIE = Math.max(totalIncome, totalExpense);

  return (
    <div className="page fade-in">
      {/* ══ HERO: this month's balance ══ */}
      <Card hero>
        <div className="flex items-center justify-between gap-2">
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
            {savings >= 0 ? "Saved" : "Deficit"} · {monthLabel(filterMonth)}
          </span>
          <Wallet size={18} aria-hidden="true" style={{ color: "var(--text-secondary)" }} />
        </div>
        <div className="num" style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.15, marginTop: 4, color: "var(--text-primary)" }}>
          {savings < 0 ? "-" : ""}₹{Math.abs(savings).toLocaleString()}
        </div>
        <div className="flex gap-6 mt-3">
          <div>
            <div className="num" style={{ fontSize: 17, fontWeight: 700 }}>{money(totalIncome)}</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Income</div>
          </div>
          <div>
            <div className="num" style={{ fontSize: 17, fontWeight: 700 }}>{money(totalExpense)}</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Expense</div>
          </div>
        </div>
        {/* Month selector */}
        <div className="chip-row mt-4" role="group" aria-label="Month">
          {months.slice(0, 6).map(m => (
            <button
              key={m}
              type="button"
              className="chip chip-i"
              aria-pressed={filterMonth === m}
              onClick={() => setFilterMonth(m)}
              style={filterMonth === m ? { background: "rgba(255,255,255,.95)", color: "#1e3a8a", flexShrink: 0 } : { flexShrink: 0 }}
            >
              {monthLabel(m)}
            </button>
          ))}
        </div>
      </Card>

      <Tabs tabs={[["overview", "Overview"], ["transactions", "All"], ["add", "Add"]]} value={tab} onChange={setTab} label="Finance sections" />

      {/* ══ OVERVIEW ══ */}
      {tab === "overview" && (
        <>
          {/* Income vs Expense */}
          {(totalIncome > 0 || totalExpense > 0) && (
            <Card title="Income vs expense">
              <div className="flex items-center gap-3 mb-2">
                <span style={{ fontSize: 12.5, color: "var(--text-secondary)", width: 62 }}>Income</span>
                <Bar className="flex-1" height={8} value={totalIncome > 0 ? totalIncome / maxIE : 0} color="var(--ok)" />
              </div>
              <div className="flex items-center gap-3">
                <span style={{ fontSize: 12.5, color: "var(--text-secondary)", width: 62 }}>Expense</span>
                <Bar className="flex-1" height={8} value={totalExpense > 0 ? totalExpense / maxIE : 0} color="var(--danger)" />
              </div>
            </Card>
          )}

          {/* Spending by category */}
          {categoryBreakdown.length > 0 && (
            <Card title="Spending by category">
              {categoryBreakdown.map(([cat, amount]) => {
                const pct = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
                return (
                  <ListRow
                    key={cat}
                    icon={catIcon(cat)}
                    tone={catTone(cat)}
                    title={cat}
                    right={
                      <div className="text-right">
                        <div className="num" style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{money(amount)}</div>
                        <div className="num" style={{ fontSize: 12, color: "var(--text-dim)" }}>{pct}%</div>
                      </div>
                    }
                  >
                    <Bar className="mt-1.5" value={pct / 100} color={`var(--tone-${catTone(cat)})`} />
                  </ListRow>
                );
              })}
            </Card>
          )}

          {totalIncome === 0 && totalExpense === 0 && (
            <Card>
              <EmptyState
                icon={PieChart}
                title="No transactions this month"
                action={<button type="button" className="bp" onClick={() => setTab("add")}><Plus size={16} /> Add transaction</button>}
              >
                Log your income and spending to see where your money goes.
              </EmptyState>
            </Card>
          )}
        </>
      )}

      {/* ══ TRANSACTIONS ══ */}
      {tab === "transactions" && (
        <Card title="All transactions" sub={recent.length ? `${recent.length} total` : undefined}>
          {recent.length === 0 ? (
            <EmptyState icon={Receipt} title="No transactions yet">Tap “Add” to start tracking.</EmptyState>
          ) : (
            recent.map((tx, i) => (
              <ListRow
                key={tx.id ?? `i${i}`}
                icon={catIcon(tx.category)}
                tone={catTone(tx.category)}
                title={tx.category || "Other"}
                sub={[tx.note, tx.date].filter(Boolean).join(" · ")}
                right={
                  <div className="flex items-center gap-1">
                    <span className="num" style={{ fontSize: 14, fontWeight: 700, color: tx.type === "income" ? "var(--ok)" : "var(--danger)" }}>
                      {tx.type === "income" ? "+" : "-"}{money(tx.amount)}
                    </span>
                    <button type="button" className="icon-btn" style={{ width: 36, height: 36, background: "none", color: "var(--text-dim)" }} onClick={() => deleteTx(tx.id)} aria-label="Delete transaction">
                      <Trash2 size={15} />
                    </button>
                  </div>
                }
              />
            ))
          )}
        </Card>
      )}

      {/* ══ ADD ══ */}
      {tab === "add" && (
        <Card title="Add transaction">
          {/* Type */}
          <Tabs
            className="mb-3"
            tabs={[["expense", "Expense"], ["income", "Income"]]}
            value={txType}
            onChange={(k) => { setTxType(k); setTxCategory(""); }}
            label="Transaction type"
          />

          {/* Amount */}
          <div className="flex items-center gap-2 mb-3">
            <span style={{ fontSize: 20, fontWeight: 700, color: "var(--text-secondary)" }}>₹</span>
            <input className="inp num" type="number" min="0" step="0.01" inputMode="decimal" placeholder="Amount" aria-label="Amount" value={txAmount} onChange={e => setTxAmount(e.target.value)} style={{ flex: 1, fontSize: 18, fontWeight: 700 }} />
          </div>

          {/* Category */}
          <div className="sl">Category</div>
          <div className="flex gap-2 flex-wrap mb-3">
            {CATEGORIES[txType].map(cat => {
              const Icon = catIcon(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  className={`chip ${txCategory === cat ? "chip-a" : "chip-i"}`}
                  aria-pressed={txCategory === cat}
                  onClick={() => setTxCategory(cat)}
                  style={{ minHeight: 36 }}
                >
                  <Icon size={14} style={txCategory === cat ? undefined : { color: `var(--tone-${catTone(cat)})` }} /> {cat}
                </button>
              );
            })}
          </div>

          {/* Note */}
          <input className="inp mb-3" placeholder="Note (optional)" aria-label="Note" value={txNote} onChange={e => setTxNote(e.target.value)} />

          <button type="button" className="bp w-full" onClick={addTransaction} disabled={!amountValid || !txCategory} style={{ padding: 14 }}>
            <Plus size={16} /> Add {txType === "income" ? "income" : "expense"}
          </button>
        </Card>
      )}
    </div>
  );
}
