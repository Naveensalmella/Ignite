import { useState, useMemo } from 'react';

const PILLARS = [
  { id: "mind", label: "Mind", icon: "⚡", color: "#06b6d4", desc: "Knowledge, learning, intellectual growth" },
  { id: "heart", label: "Heart", icon: "💛", color: "#f59e0b", desc: "Relationships, empathy, emotional intelligence" },
  { id: "spirit", label: "Spirit", icon: "🌟", color: "#8b5cf6", desc: "Mindfulness, discipline, inner peace" },
  { id: "fortune", label: "Fortune", icon: "💎", color: "#10b981", desc: "Financial literacy, wealth building, career" },
];

const GROWTH_DATA = {
  mind: [
    {
      tier: 1, name: "Foundation", missions: [
        { id: "m1_1", text: "Read your first book cover to cover" },
        { id: "m1_2", text: "Learn a new word every day for 7 days" },
        { id: "m1_3", text: "Watch 3 educational documentaries" },
        { id: "m1_4", text: "Take handwritten notes on a topic you're curious about" },
      ]
    },
    {
      tier: 2, name: "Expansion", missions: [
        { id: "m2_1", text: "Read 5 books in any genre" },
        { id: "m2_2", text: "Start journaling your thoughts daily for 14 days" },
        { id: "m2_3", text: "Learn the basics of a new skill (coding, cooking, music, art)" },
        { id: "m2_4", text: "Complete one online course or tutorial series" },
        { id: "m2_5", text: "Write a summary of everything you learned this month" },
      ]
    },
    {
      tier: 3, name: "Depth", missions: [
        { id: "m3_1", text: "Read 15 books total" },
        { id: "m3_2", text: "Write an essay, blog post, or article" },
        { id: "m3_3", text: "Teach someone something you've mastered" },
        { id: "m3_4", text: "Study one complex subject deeply for 30 days" },
        { id: "m3_5", text: "Have a debate or deep discussion and learn from the opposing view" },
      ]
    },
    {
      tier: 4, name: "Mastery", missions: [
        { id: "m4_1", text: "Read 30 books total" },
        { id: "m4_2", text: "Create original content weekly for a month" },
        { id: "m4_3", text: "Mentor someone in a subject you know well" },
        { id: "m4_4", text: "Study a field outside your expertise for 90 days" },
        { id: "m4_5", text: "Build something using a skill you recently learned" },
      ]
    },
    {
      tier: 5, name: "Wisdom", missions: [
        { id: "m5_1", text: "Read 50 books total" },
        { id: "m5_2", text: "Publish or share your writing publicly" },
        { id: "m5_3", text: "Learn basics of a second language" },
        { id: "m5_4", text: "Lead a study group or learning community" },
        { id: "m5_5", text: "Connect knowledge across 3+ different fields" },
      ]
    },
    {
      tier: 6, name: "Transcendence", missions: [
        { id: "m6_1", text: "Read 100 books total" },
        { id: "m6_2", text: "Write a book, course, or comprehensive guide" },
        { id: "m6_3", text: "Become a recognized resource in your field" },
        { id: "m6_4", text: "Think in systems — see connections others miss" },
      ]
    },
  ],
  heart: [
    {
      tier: 1, name: "Opening", missions: [
        { id: "h1_1", text: "Tell 3 people you appreciate them" },
        { id: "h1_2", text: "Write a gratitude list of 20 things" },
        { id: "h1_3", text: "Reconnect with an old friend you've lost touch with" },
        { id: "h1_4", text: "Forgive someone — even if just in your heart" },
      ]
    },
    {
      tier: 2, name: "Connection", missions: [
        { id: "h2_1", text: "Have one deep conversation every week for a month" },
        { id: "h2_2", text: "Practice active listening for 7 days — no interrupting" },
        { id: "h2_3", text: "Help a stranger with no expectation of return" },
        { id: "h2_4", text: "Write 3 letters of appreciation to people who shaped you" },
        { id: "h2_5", text: "Spend quality time with family — phones away — for 7 days" },
      ]
    },
    {
      tier: 3, name: "Empathy", missions: [
        { id: "h3_1", text: "Volunteer for a cause you believe in" },
        { id: "h3_2", text: "Resolve a conflict peacefully through understanding" },
        { id: "h3_3", text: "Support a friend through a difficult time without judgment" },
        { id: "h3_4", text: "Practice putting yourself in others' shoes daily for 14 days" },
        { id: "h3_5", text: "Apologize sincerely for something you've been avoiding" },
      ]
    },
    {
      tier: 4, name: "Leadership", missions: [
        { id: "h4_1", text: "Lead by example in your community for 30 days" },
        { id: "h4_2", text: "Inspire someone to start their own growth journey" },
        { id: "h4_3", text: "Build a small supportive community or group" },
        { id: "h4_4", text: "Practice radical honesty with kindness for 14 days" },
      ]
    },
    {
      tier: 5, name: "Service", missions: [
        { id: "h5_1", text: "Dedicate regular weekly time to helping others" },
        { id: "h5_2", text: "Transform a struggling relationship into a strong one" },
        { id: "h5_3", text: "Become someone 5+ people trust and confide in" },
        { id: "h5_4", text: "Give generously without keeping score" },
      ]
    },
    {
      tier: 6, name: "Legacy", missions: [
        { id: "h6_1", text: "Positively impact 100+ lives" },
        { id: "h6_2", text: "Create something that helps others grow" },
        { id: "h6_3", text: "Become a pillar others lean on in your community" },
        { id: "h6_4", text: "Leave a relationship legacy you're proud of" },
      ]
    },
  ],
  spirit: [
    {
      tier: 1, name: "Stillness", missions: [
        { id: "s1_1", text: "Meditate 5 minutes daily for 7 days" },
        { id: "s1_2", text: "Practice deep breathing — 4-7-8 technique for 5 days" },
        { id: "s1_3", text: "Spend 30 minutes in nature with zero technology" },
        { id: "s1_4", text: "Digital detox for 24 hours" },
      ]
    },
    {
      tier: 2, name: "Practice", missions: [
        { id: "s2_1", text: "Meditate 15 minutes daily for 14 days" },
        { id: "s2_2", text: "Create and follow a morning ritual for 7 days" },
        { id: "s2_3", text: "Practice mindfulness during meals for a week — no screens" },
        { id: "s2_4", text: "Try yoga or stretching for 7 consecutive days" },
        { id: "s2_5", text: "Keep a dream journal for 14 days" },
      ]
    },
    {
      tier: 3, name: "Discipline", missions: [
        { id: "s3_1", text: "Meditate 30 minutes daily for 30 days" },
        { id: "s3_2", text: "Wake before 6 AM for 14 consecutive days" },
        { id: "s3_3", text: "Complete a 24-hour fast (water only)" },
        { id: "s3_4", text: "Cold shower every morning for 7 days" },
        { id: "s3_5", text: "One hour of complete silence daily for 7 days" },
      ]
    },
    {
      tier: 4, name: "Surrender", missions: [
        { id: "s4_1", text: "Meditate 45 minutes daily for 30 days" },
        { id: "s4_2", text: "Spend an entire day in silence — no speaking" },
        { id: "s4_3", text: "Face a deep fear you've been avoiding" },
        { id: "s4_4", text: "Let go of something you're strongly attached to" },
      ]
    },
    {
      tier: 5, name: "Awakening", missions: [
        { id: "s5_1", text: "Meditate 1 hour daily for 14 days" },
        { id: "s5_2", text: "Go on a solo day retreat — nature, silence, reflection" },
        { id: "s5_3", text: "Practice gratitude as an automatic way of life for 30 days" },
        { id: "s5_4", text: "Write down your life's purpose and live by it for 30 days" },
      ]
    },
    {
      tier: 6, name: "Inner Mastery", missions: [
        { id: "s6_1", text: "Meditation becomes effortless — 60+ min feels natural" },
        { id: "s6_2", text: "Maintain inner calm during a crisis or high-stress event" },
        { id: "s6_3", text: "Guide someone else in their spiritual practice" },
        { id: "s6_4", text: "Live with complete presence — past and future don't control you" },
      ]
    },
  ],
  fortune: [
    {
      tier: 1, name: "Awareness", missions: [
        { id: "f1_1", text: "Track every rupee you spend for 7 days" },
        { id: "f1_2", text: "Create a monthly budget and stick to it" },
        { id: "f1_3", text: "Open a dedicated savings account" },
        { id: "f1_4", text: "Learn about compound interest and calculate your potential" },
      ]
    },
    {
      tier: 2, name: "Control", missions: [
        { id: "f2_1", text: "Save 10% of your income for 30 days" },
        { id: "f2_2", text: "Eliminate one unnecessary expense permanently" },
        { id: "f2_3", text: "Build a 1-month emergency fund" },
        { id: "f2_4", text: "Read one book about personal finance" },
        { id: "f2_5", text: "Track your net worth for the first time" },
      ]
    },
    {
      tier: 3, name: "Growth", missions: [
        { id: "f3_1", text: "Invest in yourself — take a paid course or workshop" },
        { id: "f3_2", text: "Learn basics of investing (stocks, mutual funds, SIPs)" },
        { id: "f3_3", text: "Brainstorm 5 ideas for a second income stream" },
        { id: "f3_4", text: "Save 3 months of expenses as emergency fund" },
        { id: "f3_5", text: "Start a SIP or recurring investment — even ₹500/month" },
      ]
    },
    {
      tier: 4, name: "Building", missions: [
        { id: "f4_1", text: "Start a side project, freelance work, or small business" },
        { id: "f4_2", text: "Invest consistently for 90 days without missing" },
        { id: "f4_3", text: "Build a 6-month emergency fund" },
        { id: "f4_4", text: "Create a 5-year financial plan" },
      ]
    },
    {
      tier: 5, name: "Wealth", missions: [
        { id: "f5_1", text: "Have 2+ active income streams" },
        { id: "f5_2", text: "Net worth growing consistently month over month" },
        { id: "f5_3", text: "Help someone else with financial guidance" },
        { id: "f5_4", text: "Your money earns money — passive income established" },
      ]
    },
    {
      tier: 6, name: "Freedom", missions: [
        { id: "f6_1", text: "Financial independence is visible on your timeline" },
        { id: "f6_2", text: "Money decisions come from abundance, not fear" },
        { id: "f6_3", text: "Give generously to causes that matter" },
        { id: "f6_4", text: "Build a wealth mindset that can last generations" },
      ]
    },
  ],
};

function Ring({ pct, color, size = 60, stroke = 5, children }) { const r = (size - stroke) / 2, c = 2 * Math.PI * r; return (<div style={{ position: "relative", width: size, height: size }}><svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.04)" strokeWidth={stroke} /><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, pct / 100))} strokeLinecap="round" style={{ transition: "stroke-dashoffset .8s" }} /></svg><div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div></div>) }

export default function GrowthPage({ pillarProg, setPillarProg }) {
  const [selPillar, setSelPillar] = useState("mind");
  const pp = pillarProg || {};

  const toggle = (id) => setPillarProg(p => ({ ...p, [id]: !p[id] }));

  const pillarStats = useMemo(() => {
    const stats = {};
    PILLARS.forEach(p => {
      const tiers = GROWTH_DATA[p.id] || [];
      const total = tiers.flatMap(t => t.missions).length;
      const done = tiers.flatMap(t => t.missions).filter(m => pp[m.id]).length;
      const currentTier = tiers.findIndex(t => !t.missions.every(m => pp[m.id]));
      stats[p.id] = { total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0, currentTier: currentTier === -1 ? tiers.length : currentTier };
    });
    return stats;
  }, [pp]);

  const overallPct = Math.round(Object.values(pillarStats).reduce((s, p) => s + p.pct, 0) / 4);
  const pillar = PILLARS.find(p => p.id === selPillar);
  const tiers = GROWTH_DATA[selPillar] || [];
  const stats = pillarStats[selPillar];

  return (<div>
    {/* Overall */}
    <div className="gs" style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
      <Ring pct={overallPct} color="#10b981" size={70} stroke={6}>
        <div style={{ textAlign: "center" }}><div style={{ fontSize: 20, fontWeight: 900, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", lineHeight: 1 }}>{overallPct}%</div><div style={{ fontSize: 8, color: "#6b7280" }}>Growth</div></div>
      </Ring>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>Life Growth</div>
        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>Complete missions across all 4 pillars. Each tier unlocks the next.</div>
      </div>
    </div>

    {/* Pillar selector */}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
      {PILLARS.map(p => {
        const s = pillarStats[p.id];
        return (<div key={p.id} onClick={() => setSelPillar(p.id)}
          style={{
            textAlign: "center", padding: "10px 4px", borderRadius: 10, cursor: "pointer",
            background: selPillar === p.id ? `${p.color}10` : "rgba(255,255,255,.02)",
            border: selPillar === p.id ? `1px solid ${p.color}30` : "1px solid rgba(255,255,255,.04)"
          }}>
          <div style={{ fontSize: 22 }}>{p.icon}</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: selPillar === p.id ? p.color : "#e5e7eb", marginTop: 4 }}>{p.label}</div>
          <div style={{ fontSize: 10, color: "#4b5563" }}>{s.pct}%</div>
        </div>);
      })}
    </div>

    {/* Selected pillar header */}
    <div className="gs" style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <span style={{ fontSize: 28 }}>{pillar.icon}</span>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: pillar.color, fontFamily: "Rajdhani,sans-serif" }}>{pillar.label}</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>{pillar.desc}</div>
        </div>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,.04)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${stats.pct}%`, background: pillar.color, borderRadius: 3, transition: "width .5s" }} />
      </div>
      <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>{stats.done}/{stats.total} missions · Tier {Math.min(stats.currentTier + 1, tiers.length)}/{tiers.length}</div>
    </div>

    {/* Tiers */}
    {tiers.map((tier, ti) => {
      const prevComplete = ti === 0 || tiers[ti - 1].missions.every(m => pp[m.id]);
      const unlocked = ti === 0 || prevComplete;
      const tierDone = tier.missions.filter(m => pp[m.id]).length;
      const tierComplete = tierDone === tier.missions.length;

      return (<div key={tier.tier} className="gs" style={{
        marginBottom: 10, opacity: unlocked ? 1 : 0.3,
        border: tierComplete ? `1px solid ${pillar.color}25` : unlocked ? "1px solid rgba(255,255,255,.06)" : "1px solid rgba(255,255,255,.03)",
        background: tierComplete ? `${pillar.color}04` : undefined,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Rajdhani,sans-serif", fontWeight: 800, fontSize: 14, background: tierComplete ? `${pillar.color}15` : "rgba(255,255,255,.03)", color: tierComplete ? pillar.color : unlocked ? "#e5e7eb" : "#4b5563", border: `1px solid ${tierComplete ? pillar.color + "30" : "rgba(255,255,255,.06)"}` }}>
              {tierComplete ? "✓" : tier.tier}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: tierComplete ? pillar.color : unlocked ? "#e5e7eb" : "#4b5563" }}>Tier {tier.tier} — {tier.name}</div>
              <div style={{ fontSize: 11, color: "#4b5563" }}>{tierDone}/{tier.missions.length} complete</div>
            </div>
          </div>
          {!unlocked && <span style={{ fontSize: 10, color: "#4b5563" }}>🔒 Complete Tier {tier.tier - 1} first</span>}
          {tierComplete && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 100, background: `${pillar.color}12`, color: pillar.color, fontWeight: 600 }}>Mastered ✓</span>}
        </div>

        {unlocked && tier.missions.map(m => {
          const done = pp[m.id];
          return (<div key={m.id} onClick={() => unlocked && toggle(m.id)}
            style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderTop: "1px solid rgba(255,255,255,.03)", cursor: unlocked ? "pointer" : "default" }}>
            <div style={{
              width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, transition: "all .2s",
              ...(done ? { background: `linear-gradient(135deg, ${pillar.color}, ${pillar.color}cc)`, color: "#060a0c" } : { border: "2px solid #374151" }),
            }}>{done ? "✓" : ""}</div>
            <span style={{ fontSize: 13, color: done ? "#6b7280" : "#d1d5db", textDecoration: done ? "line-through" : "none", lineHeight: 1.5 }}>{m.text}</span>
          </div>);
        })}
      </div>);
    })}
  </div>);
}