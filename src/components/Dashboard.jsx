import { useState, useEffect, useRef } from 'react';
import { getLevel, getLevelProg, getRank, xpToNext, getStreakMult, calcBMI, bmiCat, bmiCol, today } from '../utils';
import { REQUIRED_DAILY, RANKS, GATES, XP, DAILY_PENALTY } from '../data';

export default function Dashboard({appState,setPage,totalXP,streak,workoutLog}){
  const {habitLog,tasks,habits,user,profile}=appState;const d=today();
  const todayHabits=habitLog[d]||[];const tasksDone=tasks.filter(t=>t.done).length;
  const lv=getLevel(totalXP);const rank=getRank(lv);const prog=getLevelProg(totalXP);const remain=xpToNext(totalXP);const mult=getStreakMult(streak);
  const nextRank=RANKS.find(r=>r.min>lv);const todayW=workoutLog[d];
  const totalWorkouts=Object.keys(workoutLog).length;const totalCalBurned=Object.values(workoutLog).reduce((s,w)=>s+(w.calBurned||0),0);
  const bmi=calcBMI(parseFloat(profile.weight),parseFloat(profile.height));
  const unlockedGates=GATES.filter(g=>lv>=g.unlock);
  const greet=()=>{const h=new Date().getHours();return h<12?"Good morning":h<17?"Good afternoon":"Good evening"};
  return(<div>
    <div style={{marginBottom:24}}><h1 style={{fontSize:26,fontWeight:800,color:"#f3f4f6",fontFamily:"Rajdhani,sans-serif",letterSpacing:1}}>{greet()}, <span style={{background:"linear-gradient(135deg,#10b981,#06b6d4)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{user.name}</span></h1><p style={{color:"#6b7280",fontSize:14}}>{todayHabits.length<REQUIRED_DAILY?`⚠️ Complete ${REQUIRED_DAILY-todayHabits.length} more daily quests or lose ${DAILY_PENALTY} XP!`:"Daily quests on track. Keep pushing."}</p></div>
    {/* LEVEL CARD */}
    <div className="gs" style={{marginBottom:20,position:"relative",overflow:"hidden",border:`1px solid ${rank.color}20`}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${rank.color},#10b981)`}}/>
      <div style={{display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
        <div style={{textAlign:"center",minWidth:90}}><div style={{fontSize:52,fontWeight:900,fontFamily:"Rajdhani,sans-serif",color:rank.color,lineHeight:1}}>{lv}</div><span className="rank-badge" style={{background:`${rank.color}15`,color:rank.color,border:`1px solid ${rank.color}25`,marginTop:6}}>{rank.emoji} {rank.name}</span></div>
        <div style={{flex:1,minWidth:200}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#6b7280",marginBottom:6}}><span>Level {lv} → {lv<100?lv+1:"MAX"}</span><span style={{color:rank.color,fontWeight:600}}>{remain.toLocaleString()} XP</span></div>
          <div className="xp-bar-bg" style={{height:12,borderRadius:6}}><div className="xp-bar-fill" style={{width:`${prog*100}%`,background:`linear-gradient(90deg,${rank.color},#10b981)`,height:12,borderRadius:6}}/></div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#4b5563",marginTop:6,flexWrap:"wrap"}}>
            <span>Total: {totalXP.toLocaleString()} XP</span>
            <div style={{display:"flex",gap:8}}>{streak>0&&<span className="streak-fire">🔥 {streak}d{mult>1?` (×${mult})`:""}</span>}{nextRank&&<span>Next: <span style={{color:nextRank.color}}>{nextRank.name}</span> Lv.{nextRank.min}</span>}</div>
          </div>
        </div>
      </div>
    </div>
    {/* STATUS CARDS */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(145px,1fr))",gap:14,marginBottom:24}}>
      <div className="gc" onClick={()=>setPage("training")} style={{cursor:"pointer"}}><div style={{fontSize:22,marginBottom:6}}>⚔️</div><div style={{fontSize:11,color:"#6b7280",fontFamily:"Rajdhani,sans-serif",letterSpacing:1}}>TRAINING</div><div style={{fontSize:18,fontWeight:800,color:todayW?"#22c55e":"#ef4444"}}>{todayW?"DONE":"NOT DONE"}</div></div>
      <div className="gc"><div style={{fontSize:22,marginBottom:6}}>🏋️</div><div style={{fontSize:11,color:"#6b7280",fontFamily:"Rajdhani,sans-serif",letterSpacing:1}}>WORKOUTS</div><div style={{fontSize:18,fontWeight:800,color:"#10b981"}}>{totalWorkouts}</div></div>
      <div className="gc"><div style={{fontSize:22,marginBottom:6}}>🔥</div><div style={{fontSize:11,color:"#6b7280",fontFamily:"Rajdhani,sans-serif",letterSpacing:1}}>CAL BURNED</div><div style={{fontSize:18,fontWeight:800,color:"#f59e0b"}}>{totalCalBurned.toLocaleString()}</div></div>
      <div className="gc"><div style={{fontSize:22,marginBottom:6}}>📊</div><div style={{fontSize:11,color:"#6b7280",fontFamily:"Rajdhani,sans-serif",letterSpacing:1}}>BMI</div><div style={{fontSize:18,fontWeight:800,color:bmiCol(bmi)}}>{bmi||"—"}</div><div style={{fontSize:10,color:bmiCol(bmi)}}>{bmiCat(bmi)}</div></div>
    </div>
    {/* GATE PROGRESS */}
    <div className="sl">Gates · {unlockedGates.length}/{GATES.length}</div>
    <div className="gs" style={{marginBottom:24}}><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{GATES.map(g=>{const u=lv>=g.unlock;const cur=u&&(!GATES.find(x=>x.unlock>g.unlock&&lv>=x.unlock)||g.gate===6);return(<div key={g.gate} style={{flex:"1 1 auto",minWidth:70,textAlign:"center",padding:"8px 4px",borderRadius:8,background:cur?`${g.color}12`:u?"rgba(255,255,255,.02)":"rgba(4,8,10,.5)",border:`1px solid ${cur?g.color+"30":"transparent"}`,opacity:u?1:.3}}><div style={{fontSize:13,fontWeight:800,color:u?g.color:"#4b5563",fontFamily:"Rajdhani,sans-serif"}}>G{g.gate}</div><div style={{fontSize:9,color:u?g.color:"#4b5563"}}>{g.name}</div><div style={{fontSize:8,color:"#4b5563"}}>{u?"✓":"🔒"}Lv.{g.unlock}</div></div>)})}</div></div>
    {/* PENALTY + QUICK LINKS */}
    {todayHabits.length<REQUIRED_DAILY&&<div className="gs" style={{marginBottom:20,border:"1px solid rgba(16,185,129,.2)",background:"rgba(16,185,129,.04)"}}><div style={{display:"flex",gap:10,alignItems:"center"}}><span style={{fontSize:24}}>⚠️</span><div><div style={{fontWeight:700,color:"#ef4444",fontFamily:"Rajdhani,sans-serif",fontSize:13}}>DAILY QUEST WARNING</div><div style={{fontSize:12,color:"#6b7280"}}>Need {REQUIRED_DAILY-todayHabits.length} more quests or <span style={{color:"#ef4444"}}>-{DAILY_PENALTY} XP</span> penalty. Levels CAN drop!</div></div></div></div>}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14}}>
      {[{l:"Daily Quests",v:`${todayHabits.length}/${habits.length}`,c:"#10b981",p:"dailyquest",i:"🎯"},{l:"Missions",v:`${tasksDone}/${tasks.length}`,c:"#f59e0b",p:"missions",i:"📋"},{l:"Flame Oracle",v:"Ask AI",c:"#ef4444",p:"chat",i:"🔮"}].map((s,i)=>(<div key={i} className="gc" onClick={()=>setPage(s.p)} style={{cursor:"pointer"}}><div style={{fontSize:24,marginBottom:8}}>{s.i}</div><div style={{fontSize:11,color:"#6b7280",fontFamily:"Rajdhani,sans-serif",letterSpacing:1}}>{s.l}</div><div style={{fontSize:22,fontWeight:800,color:s.c}}>{s.v}</div></div>))}
    </div>
  </div>);
}
