"use client";
import { useState, useMemo } from 'react';
import { Card, Ring, Bar, IconBadge, Pill, Check } from '@/components/ui/kit';
import { Brain, Heart, Sparkles, Gem, Lock } from 'lucide-react';

const PILLARS = [
  { id: "mind", label: "Mind", Icon: Brain, tone: "sky", desc: "Knowledge, learning, intellectual growth" },
  { id: "heart", label: "Heart", Icon: Heart, tone: "amber", desc: "Relationships, empathy, emotional intelligence" },
  { id: "spirit", label: "Spirit", Icon: Sparkles, tone: "violet", desc: "Mindfulness, discipline, inner peace" },
  { id: "fortune", label: "Fortune", Icon: Gem, tone: "teal", desc: "Financial literacy, wealth building, career" },
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

export default function GrowthPage({ pillarProg = {}, setPillarProg = () => { } }) {
  const [selPillar, setSelPillar] = useState("mind");
  const pp = useMemo(() => (pillarProg && typeof pillarProg === "object" ? pillarProg : {}), [pillarProg]);

  const toggle = (id) => setPillarProg(p => { const prev = p && typeof p === "object" ? p : {}; return { ...prev, [id]: !prev[id] }; });

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

  const toneVar = `var(--tone-${pillar.tone})`;

  return (<div className="flex flex-col gap-3">
    {/* Overall — the one hero card */}
    <Card hero>
      <div className="flex items-center gap-4">
        <Ring value={overallPct / 100} size={76} stroke={7} color="#fff">
          <b className="text-[19px] font-extrabold leading-none num" style={{ color: "var(--text-primary)" }}>{overallPct}%</b>
          <small className="text-[11px]" style={{ color: "var(--text-dim)" }}>growth</small>
        </Ring>
        <div className="flex-1 min-w-0">
          <div className="text-[19px] font-extrabold" style={{ color: "var(--text-primary)" }}>Life growth</div>
          <div className="text-[13px] mt-0.5 leading-snug" style={{ color: "var(--text-secondary)" }}>Complete missions across all 4 pillars. Each tier unlocks the next.</div>
        </div>
      </div>
    </Card>

    {/* Pillar selector */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5" role="tablist" aria-label="Pillar">
      {PILLARS.map(p => {
        const st = pillarStats[p.id];
        const active = selPillar === p.id;
        return (<button type="button" key={p.id} role="tab" aria-selected={active} onClick={() => setSelPillar(p.id)}
          className="tile" style={active ? { background: `color-mix(in srgb, var(--tone-${p.tone}) 10%, var(--card-bg))`, borderColor: `color-mix(in srgb, var(--tone-${p.tone}) 45%, transparent)` } : undefined}>
          <div className="flex items-center justify-between w-full">
            <IconBadge icon={p.Icon} tone={p.tone} size={34} />
            <span className="text-[12.5px] font-bold num" style={{ color: active ? `var(--tone-${p.tone})` : "var(--text-secondary)" }}>{st.pct}%</span>
          </div>
          <span className="tile-label">{p.label}</span>
          <Bar value={st.pct / 100} color={`var(--tone-${p.tone})`} className="w-full !h-1" />
        </button>);
      })}
    </div>

    {/* Selected pillar */}
    <Card>
      <div className="flex items-center gap-3 mb-3">
        <IconBadge icon={pillar.Icon} tone={pillar.tone} size={44} />
        <div className="min-w-0">
          <div className="text-[18px] font-extrabold" style={{ color: "var(--text-primary)" }}>{pillar.label}</div>
          <div className="text-[12.5px]" style={{ color: "var(--text-dim)" }}>{pillar.desc}</div>
        </div>
      </div>
      <Bar value={stats.pct / 100} color={toneVar} label={`${pillar.label} progress`} />
      <div className="flex justify-between text-[12px] mt-1.5 num" style={{ color: "var(--text-dim)" }}>
        <span>{stats.done}/{stats.total} missions</span>
        <span>Tier {Math.min(stats.currentTier + 1, tiers.length)} of {tiers.length}</span>
      </div>
    </Card>

    {/* Tiers */}
    {tiers.map((tier, ti) => {
      const prevComplete = ti === 0 || tiers[ti - 1].missions.every(m => pp[m.id]);
      const unlocked = ti === 0 || prevComplete;
      const tierDone = tier.missions.filter(m => pp[m.id]).length;
      const tierComplete = tierDone === tier.missions.length;

      return (<Card key={tier.tier} className={unlocked ? "" : "opacity-60"}>
        <div className={`flex items-center gap-3 ${unlocked ? "mb-2" : ""}`}>
          <span className="w-9 h-9 rounded-xl flex items-center justify-center text-[14px] font-extrabold shrink-0 num"
            style={{ background: tierComplete ? `color-mix(in srgb, ${toneVar} 16%, transparent)` : "var(--ghost-bg)", color: tierComplete ? toneVar : unlocked ? "var(--text-primary)" : "var(--text-dim)" }}>
            {unlocked ? tier.tier : <Lock size={15} />}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[14.5px] font-bold truncate" style={{ color: unlocked ? "var(--text-primary)" : "var(--text-dim)" }}>Tier {tier.tier} · {tier.name}</div>
            <div className="text-[12px] num" style={{ color: "var(--text-dim)" }}>{unlocked ? `${tierDone}/${tier.missions.length} complete` : `Complete Tier ${tier.tier - 1} first`}</div>
          </div>
          {tierComplete && <Pill tone={pillar.tone}>Mastered</Pill>}
        </div>
        {unlocked && !tierComplete && tierDone > 0 && <Bar value={tierDone / tier.missions.length} color={toneVar} className="!h-1 mb-1" />}

        {unlocked && <div>
          {tier.missions.map(m => {
            const done = !!pp[m.id];
            return (<button type="button" key={m.id} onClick={() => unlocked && toggle(m.id)} aria-pressed={done} className="list-row !items-start">
              <Check on={done} />
              <span className={`text-[13.5px] leading-normal flex-1 ${done ? "is-done-text" : ""}`} style={done ? undefined : { color: "var(--text-secondary)" }}>{m.text}</span>
            </button>);
          })}
        </div>}
      </Card>);
    })}
  </div>);
}
