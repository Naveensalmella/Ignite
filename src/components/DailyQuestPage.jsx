import { useState, useMemo } from 'react';
import { XP, DAILY_PENALTY } from '../data';
import { today } from '../utils';

const QUEST_CATS = [
  { id: "power", label: "Physical", icon: "💪", color: "#ef4444" },
  { id: "mind", label: "Mental", icon: "⚡", color: "#06b6d4" },
  { id: "heart", label: "Heart", icon: "💛", color: "#f59e0b" },
  { id: "spirit", label: "Spirit", icon: "🌟", color: "#8b5cf6" },
  { id: "fortune", label: "Fortune", icon: "💎", color: "#10b981" },
];

const SUGGESTED = [
  { name: "Drink 3L water", icon: "💧", cat: "power" },
  { name: "Read 20 pages", icon: "📖", cat: "mind" },
  { name: "Meditate 10 min", icon: "🧘", cat: "spirit" },
  { name: "No junk food today", icon: "🚫", cat: "power" },
  { name: "Walk 10,000 steps", icon: "🚶", cat: "power" },
  { name: "Write in journal", icon: "📝", cat: "heart" },
  { name: "Learn something new", icon: "🧠", cat: "mind" },
  { name: "Practice gratitude", icon: "🙏", cat: "spirit" },
  { name: "Save ₹100 today", icon: "💰", cat: "fortune" },
  { name: "No social media 2h", icon: "📵", cat: "mind" },
  { name: "Stretch 15 min", icon: "🤸", cat: "power" },
  { name: "Talk to a friend", icon: "👋", cat: "heart" },
];

function Ring({pct,color,size=80,stroke=6,children}){const r=(size-stroke)/2,c=2*Math.PI*r;return(<div style={{position:"relative",width:size,height:size}}><svg width={size} height={size} style={{transform:"rotate(-90deg)"}}><circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,.04)" strokeWidth={stroke}/><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={c*(1-Math.min(1,pct/100))} strokeLinecap="round" style={{transition:"stroke-dashoffset .8s"}}/></svg><div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>{children}</div></div>)}

export default function DailyQuestPage({habits,setHabits,habitLog,setHabitLog,addXP,workoutLog}){
  const d=today();
  const checked=habitLog[d]||[];
  const todayTrained=!!(workoutLog&&workoutLog[d]);
  const [newName,setNewName]=useState("");
  const [newCat,setNewCat]=useState("power");
  const [showAdd,setShowAdd]=useState(false);
  const [showSuggestions,setShowSuggestions]=useState(false);
  const [showCal,setShowCal]=useState(false);
  const [showStats,setShowStats]=useState(false);

  // Filter out old required habits — only keep user-created ones
  const userQuests=habits.filter(h=>h.id!=="h1"||h.name==="Complete Daily Training");

  const toggle=(id)=>{
    const was=checked.includes(id);
    setHabitLog(p=>{const dl=p[d]||[];return{...p,[d]:was?dl.filter(x=>x!==id):[...dl,id]}});
    if(!was)addXP(XP.habit,"Quest completed");
  };

  const addQuest=(name,cat)=>{
    if(!name.trim())return;
    setHabits(p=>[...p,{id:`q${Date.now()}`,name:name.trim(),icon:QUEST_CATS.find(c=>c.id===cat)?.icon||"⭐",pillar:cat}]);
    setNewName("");setShowAdd(false);
  };

  const removeQuest=(id)=>{if(id!=="h1")setHabits(p=>p.filter(h=>h.id!==id))};

  const completedCount=checked.length+(todayTrained?1:0);
  const totalCount=userQuests.length+1;
  const progress=totalCount>0?Math.round((completedCount/totalCount)*100):0;
  const xpEarned=checked.length*XP.habit+(todayTrained?XP.workout:0);

  // Calendar
  const calDays=useMemo(()=>{const now=new Date(),y=now.getFullYear(),m=now.getMonth(),fd=new Date(y,m,1).getDay(),dim=new Date(y,m+1,0).getDate(),days=[];for(let i=0;i<fd;i++)days.push(null);for(let i=1;i<=dim;i++){const ds=`${y}-${String(m+1).padStart(2,"0")}-${String(i).padStart(2,"0")}`;const dh=habitLog[ds]||[];const w=workoutLog&&workoutLog[ds];days.push({day:i,date:ds,done:w||dh.length>=3,partial:dh.length>0})}return days},[habitLog,workoutLog]);

  // Stats
  const stats=useMemo(()=>{const allDates=Object.keys(habitLog);return{totalDays:allDates.length,totalQuests:allDates.reduce((s,ds)=>s+(habitLog[ds]||[]).length,0),activeDays:allDates.filter(ds=>(habitLog[ds]||[]).length>0).length}},[habitLog]);

  return(<div>
    {/* Hero */}
    <div className="gs" style={{marginBottom:16,display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
      <Ring pct={progress} color={progress>=100?"#22c55e":progress>=50?"#10b981":"#f59e0b"} size={85} stroke={6}><div style={{textAlign:"center"}}><div style={{fontSize:24,fontWeight:900,color:"#f3f4f6",fontFamily:"Rajdhani,sans-serif",lineHeight:1}}>{progress}%</div><div style={{fontSize:9,color:"#6b7280"}}>done</div></div></Ring>
      <div style={{flex:1,minWidth:160}}>
        <div style={{fontSize:18,fontWeight:800,color:"#f3f4f6",fontFamily:"Rajdhani,sans-serif"}}>{completedCount}/{totalCount} Complete</div>
        <div style={{fontSize:12,color:"#6b7280",marginTop:2}}>{progress>=100?"All done! Amazing day! 🎉":`${totalCount-completedCount} remaining`}</div>
        <div style={{fontSize:12,color:"#fbbf24",marginTop:4}}>+{xpEarned} XP earned today</div>
      </div>
    </div>

    {/* Training — THE compulsory quest */}
    <div className="gs" style={{marginBottom:16,border:todayTrained?"1px solid rgba(34,197,94,.2)":"1px solid rgba(239,68,68,.2)",background:todayTrained?"rgba(34,197,94,.03)":"rgba(239,68,68,.03)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:32,height:32,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,...(todayTrained?{background:"linear-gradient(135deg,#22c55e,#10b981)",color:"#060a0c"}:{border:"2px solid #ef4444"})}}>{todayTrained?"✓":""}</div>
          <div><div style={{fontSize:15,fontWeight:600,color:todayTrained?"#22c55e":"#f3f4f6"}}>{todayTrained?"Training Complete":"Complete Daily Training"}</div><div style={{fontSize:11,color:todayTrained?"#6b7280":"#ef4444"}}>{todayTrained?"Great work today!":"Required — or lose "+DAILY_PENALTY+" XP"}</div></div>
        </div>
        <span style={{fontSize:9,padding:"3px 8px",borderRadius:100,background:"rgba(239,68,68,.1)",color:"#ef4444",fontWeight:700,fontFamily:"Rajdhani,sans-serif",letterSpacing:1}}>REQUIRED</span>
      </div>
    </div>

    {/* User's Quests */}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
      <div className="sl" style={{margin:0}}>Your Daily Quests</div>
      <span onClick={()=>setShowAdd(!showAdd)} style={{fontSize:12,color:"#10b981",cursor:"pointer",fontWeight:600}}>{showAdd?"Cancel":"+ Add"}</span>
    </div>

    {showAdd&&<div className="gs fade-in" style={{marginBottom:12,border:"1px solid rgba(16,185,129,.15)"}}>
      <input className="inp" placeholder="Quest name..." value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addQuest(newName,newCat)} autoFocus style={{marginBottom:10}}/>
      <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>{QUEST_CATS.map(c=><span key={c.id} className={`chip ${newCat===c.id?"chip-a":"chip-i"}`} onClick={()=>setNewCat(c.id)}>{c.icon} {c.label}</span>)}</div>
      <div style={{display:"flex",gap:8}}>
        <button className="bp" onClick={()=>addQuest(newName,newCat)} disabled={!newName.trim()} style={{flex:1,padding:12}}>+ Add Quest</button>
        <button className="bg" onClick={()=>setShowSuggestions(!showSuggestions)} style={{padding:"12px 16px"}}>💡</button>
      </div>
      {showSuggestions&&<div className="fade-in" style={{marginTop:10}}><div style={{fontSize:11,color:"#6b7280",marginBottom:6}}>Quick add suggestions:</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{SUGGESTED.map((s,i)=><span key={i} className="chip chip-i" onClick={()=>addQuest(s.name,s.cat)} style={{cursor:"pointer",padding:"6px 12px"}}>{s.icon} {s.name}</span>)}</div></div>}
    </div>}

    {userQuests.filter(h=>h.id!=="h1").length===0&&!showAdd&&<div style={{textAlign:"center",padding:"20px 0",color:"#6b7280",fontSize:13}}>No quests yet. Add your own daily goals above, or tap 💡 for ideas.</div>}

    {userQuests.filter(h=>h.id!=="h1").map(h=>{
      const done=checked.includes(h.id);
      const cat=QUEST_CATS.find(c=>c.id===h.pillar);
      return(<div key={h.id} className="gc" style={{padding:14,marginBottom:8,cursor:"pointer",border:done?"1px solid rgba(16,185,129,.15)":"1px solid rgba(255,255,255,.04)",background:done?"rgba(16,185,129,.03)":undefined}} onClick={()=>toggle(h.id)}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:28,height:28,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,flexShrink:0,...(done?{background:"linear-gradient(135deg,#10b981,#06b6d4)",color:"#060a0c"}:{border:"2px solid #374151"})}}>{done?"✓":""}</div>
            <span style={{fontSize:18}}>{h.icon}</span>
            <div><div style={{fontSize:14,fontWeight:500,color:done?"#6b7280":"#e5e7eb",textDecoration:done?"line-through":"none"}}>{h.name}</div>{cat&&<div style={{fontSize:10,color:cat.color}}>{cat.label}</div>}</div>
          </div>
          <span onClick={e=>{e.stopPropagation();removeQuest(h.id)}} style={{color:"#4b5563",fontSize:16,padding:"2px 6px",cursor:"pointer"}}>×</span>
        </div>
      </div>);
    })}

    {/* Calendar */}
    <div className="gs" style={{marginTop:16,marginBottom:16}}><div onClick={()=>setShowCal(!showCal)} style={{display:"flex",justifyContent:"space-between",cursor:"pointer"}}><div className="sl" style={{margin:0}}>{new Date().toLocaleDateString('en',{month:'long',year:'numeric'})}</div><span style={{color:"#6b7280"}}>{showCal?"▾":"▸"}</span></div>
      {showCal&&<div className="fade-in" style={{marginTop:12}}><div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,textAlign:"center"}}>{["Su","Mo","Tu","We","Th","Fr","Sa"].map(d=><div key={d} style={{fontSize:10,color:"#6b7280",padding:4,fontWeight:600}}>{d}</div>)}{calDays.map((day,i)=><div key={i} style={{padding:6,borderRadius:6,fontSize:12,fontWeight:600,background:day?.done?"rgba(34,197,94,.15)":day?.partial?"rgba(245,158,11,.1)":"transparent",color:day?.done?"#22c55e":day?.partial?"#f59e0b":day?"#4b5563":"transparent"}}>{day?.day||""}</div>)}</div></div>}
    </div>

    {/* Stats */}
    <div className="gs"><div onClick={()=>setShowStats(!showStats)} style={{display:"flex",justifyContent:"space-between",cursor:"pointer"}}><div className="sl" style={{margin:0}}>Quest Stats</div><span style={{color:"#6b7280"}}>{showStats?"▾":"▸"}</span></div>
      {showStats&&<div className="fade-in" style={{marginTop:12,display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>{[["📅",stats.activeDays,"Active Days"],["⚡",stats.totalQuests,"Quests Done"],["🏆",calDays.filter(d=>d?.done).length,"Perfect Days"]].map(([icon,val,label])=><div key={label} style={{padding:10,background:"rgba(255,255,255,.02)",borderRadius:8,textAlign:"center"}}><div style={{fontSize:16}}>{icon}</div><div style={{fontSize:18,fontWeight:800,color:"#f3f4f6",fontFamily:"Rajdhani,sans-serif"}}>{val}</div><div style={{fontSize:10,color:"#6b7280"}}>{label}</div></div>)}</div>}
    </div>
  </div>);
}
