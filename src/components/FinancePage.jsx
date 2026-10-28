"use client";
import { useState, useMemo } from 'react';
import { today, toArr } from '@/utils';

const CATEGORIES = {
  income: ["Salary", "Freelance", "Investment", "Gift", "Other Income"],
  expense: ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Health", "Education", "Rent", "Other"],
};
const CAT_COLORS = { Food: "#f59e0b", Transport: "#3b82f6", Shopping: "#ec4899", Bills: "#ef4444", Entertainment: "#8b5cf6", Health: "#38bdf8", Education: "#06b6d4", Rent: "#f97316", Other: "#6b7280", Salary: "#22c55e", Freelance: "#38bdf8", Investment: "#06b6d4", Gift: "#f59e0b", "Other Income": "#6b7280" };
// Firestore data is untrusted: amounts may be strings/missing, dates may be missing, entries may be null
const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const monthLabel = (m) => { const [y, mo] = String(m).split("-").map(Number); const dt = new Date(y, (mo || 1) - 1, 1); return isNaN(dt) ? m : dt.toLocaleDateString("en", { month: "short", year: "2-digit" }); };
const CAT_ICONS = { Food: "🍽️", Transport: "🚗", Shopping: "🛍️", Bills: "📄", Entertainment: "🎮", Health: "💊", Education: "📚", Rent: "🏠", Other: "📌", Salary: "💰", Freelance: "💻", Investment: "📈", Gift: "🎁", "Other Income": "💵" };

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

  return (
    <div style={{ maxWidth: "100%", overflowX: "hidden" }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto" }}>
        {[["overview", "📊 Overview"], ["transactions", "📋 All"], ["add", "➕ Add"]].map(([k, l]) => (
          <span key={k} className={`chip ${tab === k ? "chip-a" : "chip-i"}`} onClick={() => setTab(k)} style={{ flexShrink: 0, fontSize: 12 }}>{l}</span>
        ))}
      </div>

      {/* ══ OVERVIEW ══ */}
      {tab === "overview" && (
        <div>
          {/* Month selector */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto" }}>
            {months.slice(0, 6).map(m => (
              <span key={m} className={`chip ${filterMonth === m ? "chip-a" : "chip-i"}`} onClick={() => setFilterMonth(m)} style={{ flexShrink: 0, fontSize: 11 }}>
                {monthLabel(m)}
              </span>
            ))}
          </div>

          {/* Summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
            <div className="gc" style={{ padding: 12, textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#22c55e", fontFamily: "Rajdhani,sans-serif" }}>₹{totalIncome.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>Income</div>
            </div>
            <div className="gc" style={{ padding: 12, textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#ef4444", fontFamily: "Rajdhani,sans-serif" }}>₹{totalExpense.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>Expense</div>
            </div>
            <div className="gc" style={{ padding: 12, textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: savings >= 0 ? "#38bdf8" : "#ef4444", fontFamily: "Rajdhani,sans-serif" }}>₹{Math.abs(savings).toLocaleString()}</div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>{savings >= 0 ? "Saved" : "Deficit"}</div>
            </div>
          </div>

          {/* Income vs Expense bar */}
          {(totalIncome > 0 || totalExpense > 0) && (
            <div className="gs" style={{ marginBottom: 14, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", marginBottom: 10 }}>Income vs Expense</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: "#22c55e", width: 60 }}>Income</span>
                <div style={{ flex: 1, height: 10, background: "rgba(255,255,255,.04)", borderRadius: 5, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${totalIncome > 0 ? Math.min(100, (totalIncome / Math.max(totalIncome, totalExpense)) * 100) : 0}%`, background: "#22c55e", borderRadius: 5, transition: "width .5s" }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#ef4444", width: 60 }}>Expense</span>
                <div style={{ flex: 1, height: 10, background: "rgba(255,255,255,.04)", borderRadius: 5, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${totalExpense > 0 ? Math.min(100, (totalExpense / Math.max(totalIncome, totalExpense)) * 100) : 0}%`, background: "#ef4444", borderRadius: 5, transition: "width .5s" }} />
                </div>
              </div>
            </div>
          )}

          {/* Category pie (horizontal bars) */}
          {categoryBreakdown.length > 0 && (
            <div className="gs" style={{ padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", marginBottom: 10 }}>Spending by Category</div>
              {categoryBreakdown.map(([cat, amount]) => {
                const pct = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
                return (
                  <div key={cat} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 12, color: "#d1d5db" }}>{CAT_ICONS[cat] || "📌"} {cat}</span>
                      <span style={{ fontSize: 12, color: CAT_COLORS[cat] || "#6b7280", fontWeight: 600 }}>₹{amount.toLocaleString()} ({pct}%)</span>
                    </div>
                    <div style={{ height: 6, background: "rgba(255,255,255,.04)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: CAT_COLORS[cat] || "#6b7280", borderRadius: 3, transition: "width .5s" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {totalIncome === 0 && totalExpense === 0 && (
            <div style={{ textAlign: "center", padding: 30, color: "#6b7280", fontSize: 13 }}>No transactions this month. Tap &quot;Add&quot; to start tracking.</div>
          )}
        </div>
      )}

      {/* ══ TRANSACTIONS ══ */}
      {tab === "transactions" && (
        <div>
          {recent.length === 0 ? (
            <div style={{ textAlign: "center", padding: 30, color: "#6b7280", fontSize: 13 }}>No transactions yet.</div>
          ) : (
            recent.map((tx, i) => (
              <div key={tx.id ?? `i${i}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,.03)" }}>
                <span style={{ fontSize: 20 }}>{CAT_ICONS[tx.category] || "📌"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: "#f3f4f6" }}>{tx.category || "Other"}</div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>{[tx.note, tx.date].filter(Boolean).join(" · ")}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: tx.type === "income" ? "#22c55e" : "#ef4444", fontFamily: "Rajdhani,sans-serif" }}>
                    {tx.type === "income" ? "+" : "-"}₹{num(tx.amount).toLocaleString()}
                  </div>
                </div>
                <span onClick={() => deleteTx(tx.id)} role="button" aria-label="Delete transaction" style={{ fontSize: 14, color: "#4b5563", cursor: "pointer", padding: "0 4px" }}>×</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* ══ ADD ══ */}
      {tab === "add" && (
        <div className="gs" style={{ padding: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", marginBottom: 12 }}>Add Transaction</div>

          {/* Type */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <span className={`chip ${txType === "expense" ? "chip-a" : "chip-i"}`} onClick={() => { setTxType("expense"); setTxCategory(""); }} style={{ flex: 1, textAlign: "center" }}>💸 Expense</span>
            <span className={`chip ${txType === "income" ? "chip-a" : "chip-i"}`} onClick={() => { setTxType("income"); setTxCategory(""); }} style={{ flex: 1, textAlign: "center" }}>💰 Income</span>
          </div>

          {/* Amount */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <span style={{ fontSize: 20, color: "#f3f4f6" }}>₹</span>
            <input className="inp" type="number" min="0" step="0.01" inputMode="decimal" placeholder="Amount" aria-label="Amount" value={txAmount} onChange={e => setTxAmount(e.target.value)} style={{ flex: 1, fontSize: 18, fontWeight: 700 }} />
          </div>

          {/* Category */}
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>Category</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {CATEGORIES[txType].map(cat => (
              <span key={cat} className={`chip ${txCategory === cat ? "chip-a" : "chip-i"}`} onClick={() => setTxCategory(cat)} style={{ fontSize: 11 }}>
                {CAT_ICONS[cat] || "📌"} {cat}
              </span>
            ))}
          </div>

          {/* Note */}
          <input className="inp" placeholder="Note (optional)" value={txNote} onChange={e => setTxNote(e.target.value)} style={{ width: "100%", marginBottom: 12 }} />

          <button className="bp" onClick={addTransaction} disabled={!amountValid || !txCategory} style={{ width: "100%", padding: 14, fontSize: 14 }}>
            {txType === "income" ? "💰" : "💸"} Add {txType === "income" ? "Income" : "Expense"}
          </button>
        </div>
      )}
    </div>
  );
}