import { useState, useEffect, useRef } from 'react';
import { getLevel, calcBMI, bmiCat, bmiCol, today } from '../utils';
import { GATES, XP } from '../data';
import ExerciseDetail from './ExerciseDetail';

export default function TrainingPage({totalXP,addXP,workoutLog,setWorkoutLog,profile}){
  const lv=getLevel(totalXP);const d=today();const todayW=workoutLog[d];
  const [activeGate,setActiveGate]=useState(null);
  const [session,setSession]=useState(null);
  const [expandedEx,setExpandedEx]=useState(null); // index of expanded exercise
  const [timer,setTimer]=useState(0);const [timerRunning,setTimerRunning]=useState(false);
  const timerRef=useRef(null);
  const unlockedGates=GATES.filter(g=>lv>=g.unlock);
  const bmi=calcBMI(parseFloat(profile.weight),parseFloat(profile.height));

  useEffect(()=>{if(timerRunning){timerRef.current=setInterval(()=>setTimer(t=>t+1),1000);return()=>clearInterval(timerRef.current)}return()=>clearInterval(timerRef.current)},[timerRunning]);

  const startSession=(gate)=>{
    const allEx=[...gate.exercises.map(e=>({...e,category:"strength",completed:false})),...gate.combat.map(e=>({...e,category:"combat",completed:false}))];
    setSession({gate:gate.gate,gateName:gate.name,gateColor:gate.color,exercises:allEx,calBurned:0,startTime:Date.now()});
    setTimer(0);setTimerRunning(true);setExpandedEx(0);
  };

  const completeExercise=(idx)=>{
    setSession(prev=>{
      const ex=[...prev.exercises];ex[idx]={...ex[idx],completed:true};
      const cal=prev.calBurned+(ex[idx].cal||10);
      const allDone=ex.every(e=>e.completed);
      if(allDone){
        setTimerRunning(false);
        const combatCount=ex.filter(e=>e.category==="combat"&&e.completed).length;
        addXP(XP.workout+combatCount*XP.combat,"Gate "+prev.gate+" training");
        setWorkoutLog(p=>({...p,[d]:{gate:prev.gate,gateName:prev.gateName,calBurned:cal,duration:Math.floor((Date.now()-prev.startTime)/1000),completedAt:new Date().toLocaleTimeString()}}));
        setExpandedEx(null);
      } else {
        // Auto-expand next uncompleted exercise
        const nextIdx=ex.findIndex((e,i)=>i>idx&&!e.completed);
        setExpandedEx(nextIdx>=0?nextIdx:null);
      }
      return{...prev,exercises:ex,calBurned:cal};
    });
  };

  const mins=Math.floor(timer/60);const secs=timer%60;

  // Active training session
  if(session){
    const ex=session.exercises;const done=ex.filter(e=>e.completed).length;const total=ex.length;const allDone=done===total;

    if(allDone){
      return(<div style={{textAlign:"center",padding:"40px 0"}} className="fade-in">
        <div style={{fontSize:64,marginBottom:16}}>🏆</div>
        <h2 style={{fontFamily:"Rajdhani,sans-serif",fontSize:28,fontWeight:800,background:"linear-gradient(135deg,#10b981,#06b6d4)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:2}}>TRAINING COMPLETE</h2>
        <div style={{fontSize:14,color:"#6b7280",marginTop:8}}>Gate {session.gate} — {session.gateName}</div>
        <div style={{display:"flex",gap:20,justifyContent:"center",marginTop:24,flexWrap:"wrap"}}>
          {[["⏱",`${mins}:${String(secs).padStart(2,"0")}`,"Duration"],["🔥",session.calBurned,"Calories"],["⚡",`+${XP.workout}`,`XP Earned`]].map(([icon,val,label])=>(
            <div key={label} className="gs" style={{padding:16,minWidth:100}}><div style={{fontSize:24,fontWeight:800,color:"#ef4444",fontFamily:"Rajdhani,sans-serif"}}>{val}</div><div style={{fontSize:11,color:"#6b7280"}}>{label}</div></div>
          ))}
        </div>
        <button className="bp" onClick={()=>setSession(null)} style={{marginTop:24,padding:"14px 40px",letterSpacing:2}}>BACK</button>
      </div>);
    }

    return(<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div><div style={{fontFamily:"Rajdhani,sans-serif",fontWeight:700,color:"#6ee7b7",letterSpacing:1}}>GATE {session.gate} — {session.gateName}</div><div style={{fontSize:13,color:"#6b7280"}}>{done}/{total} exercises · {session.calBurned} cal</div></div>
        <div style={{textAlign:"right"}}><div style={{fontSize:28,fontWeight:800,color:"#ef4444",fontFamily:"Rajdhani,sans-serif",fontVariantNumeric:"tabular-nums"}}>{String(mins).padStart(2,"0")}:{String(secs).padStart(2,"0")}</div></div>
      </div>
      <div className="xp-bar-bg" style={{marginBottom:16,height:6}}><div className="xp-bar-fill" style={{width:`${(done/total)*100}%`,background:"linear-gradient(90deg,#10b981,#06b6d4)",height:6}}/></div>

      {ex.map((e,i)=>(
        <div key={i} className="ex-card" onClick={()=>!e.completed&&setExpandedEx(expandedEx===i?null:i)} style={{opacity:e.completed?.4:1,border:expandedEx===i?"1px solid rgba(16,185,129,.2)":"1px solid rgba(16,185,129,.06)"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <span style={{fontSize:12,color:e.category==="combat"?"#f59e0b":"#ef4444",fontWeight:700,fontFamily:"Rajdhani,sans-serif"}}>{e.category==="combat"?"⚔️ COMBAT":"💪 STRENGTH"}</span>
              {e.completed&&<span style={{color:"#22c55e",fontSize:13}}>✓</span>}
            </div>
            {!e.completed&&<span style={{fontSize:14,color:"#4b5563"}}>{expandedEx===i?"▾":"▸"}</span>}
          </div>
          <div style={{fontWeight:600,fontSize:15,marginTop:6,color:e.completed?"#4b5563":"#e5e7eb"}}>{e.name}</div>
          <div style={{fontSize:12,color:"#6b7280",marginTop:2}}>{e.reps} {e.muscle?`· ${e.muscle}`:""} · ~{e.cal} cal</div>

          {expandedEx===i&&!e.completed&&(
            <ExerciseDetail ex={e} color={session.gateColor} onComplete={()=>completeExercise(i)} showComplete={true}/>
          )}
        </div>
      ))}
    </div>);
  }

  // Already done today
  if(todayW){
    return(<div>
      <div className="gs" style={{textAlign:"center",marginBottom:20,border:"1px solid rgba(34,197,94,.2)"}}>
        <div style={{fontSize:48,marginBottom:8}}>✅</div>
        <div style={{fontFamily:"Rajdhani,sans-serif",fontWeight:700,fontSize:18,color:"#22c55e",letterSpacing:1}}>TODAY'S TRAINING COMPLETE</div>
        <div style={{fontSize:13,color:"#6b7280",marginTop:4}}>Gate {todayW.gate} — {todayW.gateName} · {todayW.calBurned} cal · {Math.floor(todayW.duration/60)}:{String(todayW.duration%60).padStart(2,"0")}</div>
      </div>
      <div className="sl">Training History</div>
      {Object.entries(workoutLog).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,10).map(([date,w])=>(<div key={date} className="ex-card" style={{cursor:"default"}}><div style={{fontWeight:600}}>Gate {w.gate} — {w.gateName}</div><div style={{fontSize:12,color:"#6b7280"}}>{date} · {w.calBurned} cal · {Math.floor(w.duration/60)}:{String(w.duration%60).padStart(2,"0")}</div></div>))}
      {bmi&&<div className="gs" style={{marginTop:16,textAlign:"center"}}><div className="sl">Body Status</div><div style={{fontSize:36,fontWeight:800,color:bmiCol(bmi),fontFamily:"Rajdhani,sans-serif"}}>{bmi}</div><div style={{color:bmiCol(bmi),fontSize:13}}>{bmiCat(bmi)}</div><div style={{fontSize:11,color:"#4b5563",marginTop:4}}>{profile.weight}kg · {profile.height}cm</div></div>}
    </div>);
  }

  // Gate selection with exercise previews
  return(<div>
    <div style={{marginBottom:16}}>
      <div className="sl" style={{marginBottom:2}}>Select Gate · Workout = <span style={{color:"#fbbf24"}}>+{XP.workout} XP</span> + combat bonuses</div>
      {bmi&&<div style={{fontSize:12,color:"#6b7280"}}>BMI: <span style={{color:bmiCol(bmi),fontWeight:700}}>{bmi} ({bmiCat(bmi)})</span> · {profile.weight}kg · {profile.height}cm</div>}
    </div>
    {GATES.map(g=>{const unlocked=lv>=g.unlock;return(
      <div key={g.gate} className={`gs ${unlocked?"":"gate-locked"}`} style={{marginBottom:14,border:unlocked?`1px solid ${g.color}15`:"",cursor:unlocked?"pointer":"default"}} onClick={()=>unlocked&&setActiveGate(activeGate===g.gate?null:g.gate)}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:44,height:44,borderRadius:10,background:unlocked?`linear-gradient(135deg,${g.color}25,${g.color}10)`:"rgba(255,255,255,.03)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Rajdhani,sans-serif",fontWeight:800,fontSize:18,color:unlocked?g.color:"#4b5563"}}>G{g.gate}</div>
            <div><div style={{fontWeight:700,fontSize:16,color:unlocked?g.color:"#4b5563",fontFamily:"Rajdhani,sans-serif",letterSpacing:1}}>{g.name}</div><div style={{fontSize:12,color:"#6b7280"}}>{unlocked?`${g.exercises.length} exercises + ${g.combat.length} combat drills`:`🔒 Unlock at Level ${g.unlock}`}</div></div>
          </div>
          {unlocked&&<span style={{color:g.color,fontSize:18}}>{activeGate===g.gate?"▾":"▸"}</span>}
        </div>
        {activeGate===g.gate&&unlocked&&(<div style={{marginTop:16}} onClick={e=>e.stopPropagation()}>
          <div className="sl" style={{color:g.color}}>💪 Strength & Power</div>
          {g.exercises.map((e,i)=><div key={i} className="ex-card" onClick={()=>setExpandedEx(expandedEx===`p${g.gate}-${i}`?null:`p${g.gate}-${i}`)}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontWeight:600,fontSize:14}}>{e.name}</div><div style={{fontSize:12,color:"#6b7280"}}>{e.reps} · {e.muscle} · ~{e.cal}cal</div></div><span style={{color:"#4b5563",fontSize:14}}>{expandedEx===`p${g.gate}-${i}`?"▾":"▸"}</span></div>
            {expandedEx===`p${g.gate}-${i}`&&<ExerciseDetail ex={e} color={g.color} showComplete={false}/>}
          </div>)}
          <div className="sl" style={{color:"#a78bfa",marginTop:16}}>⚔️ Combat Training</div>
          {g.combat.map((e,i)=><div key={i} className="ex-card" onClick={()=>setExpandedEx(expandedEx===`c${g.gate}-${i}`?null:`c${g.gate}-${i}`)}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontWeight:600,fontSize:14}}>{e.name}</div><div style={{fontSize:12,color:"#6b7280"}}>{e.reps} · ~{e.cal}cal</div></div><span style={{color:"#4b5563",fontSize:14}}>{expandedEx===`c${g.gate}-${i}`?"▾":"▸"}</span></div>
            {expandedEx===`c${g.gate}-${i}`&&<ExerciseDetail ex={e} color="#f59e0b" showComplete={false}/>}
          </div>)}
          <button className="bp" onClick={()=>startSession(g)} style={{width:"100%",marginTop:14,padding:14,fontSize:16,letterSpacing:2}}>⚔️ BEGIN TRAINING</button>
        </div>)}
      </div>
    )})}
  </div>);
}
