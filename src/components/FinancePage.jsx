import { useState, useMemo } from 'react';
import { XP } from '../data';
import { today } from '../utils';

const EXPENSE_CATS = [
  { id: "food", label: "Food & Dining", icon: "🍽️", color: "#f59e0b" },
  { id: "transport", label: "Transport", icon: "🚗", color: "#06b6d4" },
  { id: "shopping", label: "Shopping", icon: "🛍️", color: "#ec4899" },
  { id: "bills", label: "Bills & Utilities", icon: "📄", color: "#8b5cf6" },
  { id: "health", label: "Health", icon: "🏥", color: "#22c55e" },
  { id: "education", label: "Education", icon: "📚", color: "#3b82f6" },
  { id: "entertainment", label: "Entertainment", icon: "🎮", color: "#f97316" },
  { id: "rent", label: "Rent / EMI", icon: "🏠", color: "#ef4444" },
  { id: "savings", label: "Savings / Investment", icon: "💰", color: "#10b981" },
  { id: "other", label: "Other", icon: "📦", color: "#6b7280" },
];

const INCOME_CATS = [
  { id: "salary", label: "Salary", icon: "💼" },
  { id: "freelance", label: "Freelance", icon: "💻" },
  { id: "business", label: "Business", icon: "🏢" },
  { id: "investment", label: "Investment Returns", icon: "📈" },
  { id: "gift", label: "Gift / Received", icon: "🎁" },
  { id: "other_inc", label: "Other", icon: "💵" },
];

function MiniRing({ pct, color, size = 52, stroke = 5, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.04)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, pct / 100))}
          strokeLinecap="round" style={{ transition: "stroke-dashoffset .8s" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>
    </div>
  );
}

export default function FinancePage({ finances, setFinances, addXP }) {
  const [type, setType] = useState("expense");
  const [amt, setAmt] = useState("");
  const [cat, setCat] = useState("food");
  const [note, setNote] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState("all"); // all | month | week
  const [showBreakdown, setShowBreakdown] = useState(true);
  const [showBudget, setShowBudget] = useState(false);
  const [budget, setBudget] = useState({});

  const d = today();
  const currentMonth = d.slice(0, 7);
  const currentWeekStart = (() => {
    const dt = new Date(); dt.setDate(dt.getDate() - dt.getDay());
    return dt.toISOString().split("T")[0];
  })();

  const add = () => {
    if (!amt || parseFloat(amt) <= 0) return;
    setFinances(p => [{
      id: Date.now(), type, amount: parseFloat(amt),
      category: cat, note: note.trim(), date: d,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }, ...p]);
    setAmt(""); setNote(""); setShowAdd(false);
    addXP(XP.finance, "Finance tracked");
  };

  const remove = (id) => setFinances(p => p.filter(f => f.id !== id));

  // Filtered data
  const filtered = useMemo(() => {
    if (filter === "month") return finances.filter(f => f.date?.startsWith(currentMonth));
    if (filter === "week") return finances.filter(f => f.date >= currentWeekStart);
    return finances;
  }, [finances, filter, currentMonth, currentWeekStart]);

  const income = filtered.filter(f => f.type === "income").reduce((s, f) => s + f.amount, 0);
  const expense = filtered.filter(f => f.type === "expense").reduce((s, f) => s + f.amount, 0);
  const balance = income - expense;
  const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0;

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const expenses = filtered.filter(f => f.type === "expense");
    const cats = {};
    expenses.forEach(f => {
      const c = f.category || "other";
      cats[c] = (cats[c] || 0) + f.amount;
    });
    return Object.entries(cats)
      .map(([id, amount]) => ({
        ...EXPENSE_CATS.find(c => c.id === id) || { id, label: id, icon: "📦", color: "#6b7280" },
        amount,
        pct: expense > 0 ? Math.round((amount / expense) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filtered, expense]);

  // Monthly trend (last 6 months)
  const monthlyTrend = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const dt = new Date(); dt.setMonth(dt.getMonth() - i);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      const label = dt.toLocaleDateString('en', { month: 'short' });
      const monthData = finances.filter(f => f.date?.startsWith(key));
      const inc = monthData.filter(f => f.type === "income").reduce((s, f) => s + f.amount, 0);
      const exp = monthData.filter(f => f.type === "expense").reduce((s, f) => s + f.amount, 0);
      months.push({ key, label, income: inc, expense: exp });
    }
    return months;
  }, [finances]);

  const maxMonthly = Math.max(1, ...monthlyTrend.flatMap(m => [m.income, m.expense]));

  // Today's spending
  const todaySpent = finances.filter(f => f.date === d && f.type === "expense").reduce((s, f) => s + f.amount, 0);

  const getCatInfo = (id) => EXPENSE_CATS.find(c => c.id === id) || INCOME_CATS.find(c => c.id === id) || { icon: "📦", label: id, color: "#6b7280" };

  return (
    <div>
      {/* ══ OVERVIEW CARDS ══ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 16 }}>
        <div className="gs" style={{ textAlign: "center", padding: 14 }}>
          <div style={{ fontSize: 10, color: "#6b7280", fontFamily: "Rajdhani,sans-serif", letterSpacing: 1 }}>INCOME</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#22c55e", fontFamily: "Rajdhani,sans-serif" }}>₹{income.toLocaleString()}</div>
        </div>
        <div className="gs" style={{ textAlign: "center", padding: 14 }}>
          <div style={{ fontSize: 10, color: "#6b7280", fontFamily: "Rajdhani,sans-serif", letterSpacing: 1 }}>SPENT</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#ef4444", fontFamily: "Rajdhani,sans-serif" }}>₹{expense.toLocaleString()}</div>
        </div>
        <div className="gs" style={{ textAlign: "center", padding: 14 }}>
          <div style={{ fontSize: 10, color: "#6b7280", fontFamily: "Rajdhani,sans-serif", letterSpacing: 1 }}>BALANCE</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: balance >= 0 ? "#10b981" : "#ef4444", fontFamily: "Rajdhani,sans-serif" }}>₹{balance.toLocaleString()}</div>
        </div>
        <div className="gs" style={{ textAlign: "center", padding: 14 }}>
          <div style={{ fontSize: 10, color: "#6b7280", fontFamily: "Rajdhani,sans-serif", letterSpacing: 1 }}>SAVINGS</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: savingsRate >= 20 ? "#10b981" : savingsRate >= 0 ? "#f59e0b" : "#ef4444", fontFamily: "Rajdhani,sans-serif" }}>{savingsRate}%</div>
        </div>
      </div>

      {/* Filter + Add */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {[["all", "All"], ["month", "This Month"], ["week", "This Week"]].map(([k, l]) => (
            <span key={k} className={`chip ${filter === k ? "chip-a" : "chip-i"}`} onClick={() => setFilter(k)}>{l}</span>
          ))}
        </div>
        <button className="bp" onClick={() => setShowAdd(!showAdd)} style={{ padding: "8px 16px", fontSize: 13 }}>
          {showAdd ? "Cancel" : "+ Add"}
        </button>
      </div>

      {/* ══ ADD TRANSACTION ══ */}
      {showAdd && (
        <div className="gs fade-in" style={{ marginBottom: 16, border: "1px solid rgba(16,185,129,.15)" }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {[["expense", "− Expense", "#ef4444"], ["income", "+ Income", "#22c55e"]].map(([t, l, c]) => (
              <span key={t} className={`chip ${type === t ? "chip-a" : "chip-i"}`}
                onClick={() => { setType(t); setCat(t === "income" ? "salary" : "food"); }}
                style={type === t ? { background: `${c}15`, color: c, borderColor: `${c}30` } : {}}>
                {l}
              </span>
            ))}
          </div>

          <input className="inp" type="number" placeholder="Amount (₹)" value={amt}
            onChange={e => setAmt(e.target.value)} style={{ marginBottom: 10, fontSize: 20, fontWeight: 700, textAlign: "center" }} />

          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>Category</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {(type === "expense" ? EXPENSE_CATS : INCOME_CATS).map(c => (
              <span key={c.id} className={`chip ${cat === c.id ? "chip-a" : "chip-i"}`}
                onClick={() => setCat(c.id)} style={{ padding: "6px 10px", fontSize: 11 }}>
                {c.icon} {c.label}
              </span>
            ))}
          </div>

          <input className="inp" placeholder="Note (optional)" value={note}
            onChange={e => setNote(e.target.value)} style={{ marginBottom: 12 }} />

          <button className="bp" onClick={add} disabled={!amt || parseFloat(amt) <= 0}
            style={{ width: "100%", padding: 12 }}>
            Add {type === "income" ? "Income" : "Expense"}
          </button>
        </div>
      )}

      {/* ══ CATEGORY BREAKDOWN ══ */}
      {categoryBreakdown.length > 0 && (
        <div className="gs" style={{ marginBottom: 16 }}>
          <div onClick={() => setShowBreakdown(!showBreakdown)} style={{ display: "flex", justifyContent: "space-between", cursor: "pointer" }}>
            <div className="sl" style={{ margin: 0 }}>Spending Breakdown</div>
            <span style={{ color: "#6b7280", fontSize: 14 }}>{showBreakdown ? "▾" : "▸"}</span>
          </div>
          {showBreakdown && (
            <div className="fade-in" style={{ marginTop: 12 }}>
              {categoryBreakdown.map(c => (
                <div key={c.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{c.icon}</span>
                      <span style={{ fontSize: 13, color: "#e5e7eb" }}>{c.label}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: c.color }}>₹{c.amount.toLocaleString()}</span>
                      <span style={{ fontSize: 11, color: "#6b7280" }}>{c.pct}%</span>
                    </div>
                  </div>
                  <div style={{ height: 6, background: "rgba(255,255,255,.04)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${c.pct}%`, background: c.color, borderRadius: 3, transition: "width .5s" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ MONTHLY TREND ══ */}
      <div className="gs" style={{ marginBottom: 16 }}>
        <div className="sl">Monthly Trend · 6 Months</div>
        <div style={{ display: "flex", gap: 6, alignItems: "end", height: 120 }}>
          {monthlyTrend.map(m => (
            <div key={m.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <div style={{ display: "flex", gap: 2, alignItems: "end", height: 90, width: "100%" }}>
                <div style={{ flex: 1, borderRadius: "3px 3px 0 0", background: "rgba(34,197,94,.3)", height: `${maxMonthly > 0 ? (m.income / maxMonthly) * 90 : 0}px`, transition: "height .5s" }} />
                <div style={{ flex: 1, borderRadius: "3px 3px 0 0", background: "rgba(239,68,68,.3)", height: `${maxMonthly > 0 ? (m.expense / maxMonthly) * 90 : 0}px`, transition: "height .5s" }} />
              </div>
              <div style={{ fontSize: 9, color: m.key === currentMonth ? "#10b981" : "#6b7280", fontWeight: m.key === currentMonth ? 700 : 400 }}>{m.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8, fontSize: 11, color: "#6b7280" }}>
          <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "rgba(34,197,94,.4)", marginRight: 4 }} />Income</span>
          <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "rgba(239,68,68,.4)", marginRight: 4 }} />Expense</span>
        </div>
      </div>

      {/* ══ TODAY ══ */}
      {todaySpent > 0 && (
        <div className="gs" style={{ marginBottom: 16, padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#6b7280" }}>Today's spending</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#ef4444", fontFamily: "Rajdhani,sans-serif" }}>₹{todaySpent.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* ══ TRANSACTIONS ══ */}
      <div className="gs">
        <div className="sl">Transactions · {filtered.length}</div>
        {filtered.length === 0 && <div style={{ fontSize: 13, color: "#6b7280", padding: "16px 0", textAlign: "center" }}>No transactions yet. Start tracking above.</div>}
        {filtered.slice(0, 25).map(f => {
          const catInfo = getCatInfo(f.category);
          return (
            <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,.03)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>{catInfo.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#e5e7eb" }}>{catInfo.label}{f.note ? ` — ${f.note}` : ""}</div>
                  <div style={{ fontSize: 11, color: "#4b5563" }}>{f.date} {f.time || ""}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: f.type === "income" ? "#22c55e" : "#ef4444" }}>
                  {f.type === "income" ? "+" : "−"}₹{f.amount.toLocaleString()}
                </span>
                <span onClick={() => remove(f.id)} style={{ cursor: "pointer", color: "#4b5563", fontSize: 14 }}>×</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}