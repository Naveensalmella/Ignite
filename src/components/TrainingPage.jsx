import { useState, useEffect, useRef, useMemo } from 'react';
import { getLevel, today } from '../utils';
import { GATES, XP } from '../data';
import { generateWorkout, ACTIVITY_TYPES, BODY_PARTS, TIME_OPTIONS, RUNNING, YOGA, HIIT, FIGHTING } from '../data/exercises';
import ExerciseDetail from './ExerciseDetail';

const REST_OPTIONS = [15,30,45,60,90];
const fmt = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

export default function TrainingPage({totalXP,addXP,workoutLog,setWorkoutLog,profile}){
  const lv=getLevel(totalXP), d=today(), todayW=workoutLog[d];
  const [dayActivity,setDayActivity]=useState(profile.trainingType||"bodyweight");
  const [dayFocus,setDayFocus]=useState("full");
  const [dayTime,setDayTime]=useState(parseInt(profile.dailyTime)||45);
  const [workout,setWorkout]=useState(null);
  const [mode,setMode]=useState("config");
  const [currentIdx,setCurrentIdx]=useState(0);
  const [completedEx,setCompletedEx]=useState([]);
  const [sessionTimer,setSessionTimer]=useState(0);
  const [running,setRunning]=useState(false);
  const [resting,setResting]=useState(false);
  const [restTime,setRestTime]=useState(0);
  const [restDur,setRestDur]=useState(45);
  const [calBurned,setCalBurned]=useState(0);
  const [expandedEx,setExpandedEx]=useState(null);
  const [showCal,setShowCal]=useState(false);
  const [showHist,setShowHist]=useState(true);
  const timerRef=useRef(null),restRef=useRef(null);

  useEffect(()=>{if(running){timerRef.current=setInterval(()=>setSessionTimer(t=>t+1),1000);return()=>clearInterval(timerRef.current)}return()=>clearInterval(timerRef.current)},[running]);
  useEffect(()=>{if(resting&&restTime>0){restRef.current=setInterval(()=>setRestTime(t=>{if(t<=1){setResting(false);return 0}return t-1}),1000);return()=>clearInterval(restRef.current)}return()=>clearInterval(restRef.current)},[resting,restTime]);

  const generateDaily=()=>{
    const config={...profile,trainingType:dayActivity,dailyTime:String(dayTime),focusAreas:[dayFocus]};
    let w=generateWorkout(config);
    if(dayActivity==="running"){const pool=RUNNING[profile.fitnessLevel==="beginner"?"easy":"moderate"]||RUNNING.easy;w.exercises=pool.slice(0,Math.max(1,Math.floor(dayTime/15)));w.fighting=[];w.splitName="Running Session";}
    else if(dayActivity==="yoga"){w.exercises=[...YOGA].sort(()=>Math.random()-.5).slice(0,Math.max(3,Math.floor(dayTime/5)));w.fighting=[];w.splitName="Yoga & Flexibility";}
    else if(dayActivity==="hiit"){w.exercises=[...HIIT].sort(()=>Math.random()-.5).slice(0,Math.max(2,Math.floor(dayTime/8)));w.fighting=[];w.splitName="HIIT Session";}
    else if(["boxing","kickboxing","mma","martial_arts"].includes(dayActivity)){const fp=FIGHTING[dayActivity]||[];w.fighting=[...fp].sort(()=>Math.random()-.5).slice(0,Math.max(3,Math.floor(dayTime/5)));w.splitName=`${ACTIVITY_TYPES.find(a=>a.id===dayActivity)?.label} Training`;}
    w.estTime=dayTime;
    // Build full exercise list: warmup + main + combat + cooldown
    w.allExercises=[
      ...w.warmup.map(e=>({...e,phase:"warmup"})),
      ...w.exercises.map(e=>({...e,phase:"main"})),
      ...w.fighting.map(e=>({...e,phase:"combat"})),
      ...w.cooldown.map(e=>({...e,phase:"cooldown"})),
    ];
    setWorkout(w);setMode("preview");
  };

  const startSession=()=>{setMode("session");setCurrentIdx(0);setCompletedEx([]);setSessionTimer(0);setRunning(true);setCalBurned(0)};

  const completeExercise=(idx)=>{
    if(completedEx.includes(idx))return;
    const ex=workout.allExercises[idx];
    const newCompleted=[...completedEx,idx];
    setCompletedEx(newCompleted);
    setCalBurned(c=>c+(ex.cal||3)*(ex.sets||1));
    // Check if ALL done
    if(newCompleted.length>=workout.allExercises.length){
      finishWorkout(newCompleted.length);
    }else{
      // Move to next uncompleted
      const nextIdx=workout.allExercises.findIndex((_,i)=>!newCompleted.includes(i)&&i>idx);
      if(nextIdx>=0){
        if(ex.phase==="main"||ex.phase==="combat")startRest();
        setCurrentIdx(nextIdx);
      }else{
        finishWorkout(newCompleted.length);
      }
    }
  };

  const finishWorkout=(count)=>{
    setRunning(false);setMode("complete");
    const totalCal=calBurned;
    const combatCount=workout.fighting.length;
    addXP(XP.workout+(combatCount>0?combatCount*XP.combat:0),"Training complete");
    setWorkoutLog(p=>({...p,[d]:{
      type:"smart",splitName:workout.splitName,bodyParts:workout.bodyParts||[],
      calBurned:totalCal,duration:sessionTimer,
      exerciseCount:workout.exercises.length+workout.fighting.length,
      activity:dayActivity,focus:dayFocus,completedAt:new Date().toLocaleTimeString(),
      exercises:workout.exercises.map(e=>e.name),
      fighting:workout.fighting.map(e=>e.name),
    }}));
  };

  const skipExercise=(idx)=>{
    const nextIdx=workout.allExercises.findIndex((_,i)=>!completedEx.includes(i)&&i>idx);
    if(nextIdx>=0)setCurrentIdx(nextIdx);
  };

  const swapExercise=(idx)=>{
    if(!workout)return;
    const ex=workout.allExercises[idx];
    const pool=workout.exercises.filter(e=>e.name!==ex.name&&e.bodyPart===ex.bodyPart);
    if(pool.length===0)return;
    const rep=pool[Math.floor(Math.random()*pool.length)];
    const newAll=[...workout.allExercises];
    newAll[idx]={...rep,phase:ex.phase};
    setWorkout(w=>({...w,allExercises:newAll}));
  };

  const startRest=()=>{setResting(true);setRestTime(restDur)};
  const skipRest=()=>{setResting(false);setRestTime(0)};

  const phaseColor={warmup:"#f59e0b",main:"#10b981",combat:"#a78bfa",cooldown:"#06b6d4"};
  const phaseIcon={warmup:"🔥",main:"💪",combat:"⚔️",cooldown:"🧘"};

  const calDays=()=>{const now=new Date(),y=now.getFullYear(),m=now.getMonth(),fd=new Date(y,m,1).getDay(),dim=new Date(y,m+1,0).getDate(),days=[];for(let i=0;i<fd;i++)days.push(null);for(let i=1;i<=dim;i++){const ds=`${y}-${String(m+1).padStart(2,"0")}-${String(i).padStart(2,"0")}`;days.push({day:i,date:ds,w:workoutLog[ds]})}return days};

  // ═══ COMPLETE SCREEN ═══
  if(mode==="complete"){
    return(<div className="fade-in" style={{textAlign:"center",padding:"30px 0"}}>
      <div style={{fontSize:64,marginBottom:12}}>🏆</div>
      <h2 style={{fontFamily:"Rajdhani,sans-serif",fontSize:28,fontWeight:800,background:"linear-gradient(135deg,#10b981,#06b6d4)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:2}}>TRAINING COMPLETE</h2>
      <div style={{fontSize:14,color:"#6b7280",marginTop:6}}>{workout?.splitName}</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12,marginTop:24,maxWidth:320,margin:"24px auto"}}>
        {[["⏱",fmt(sessionTimer),"Duration"],["🔥",calBurned,"Calories"],["💪",workout?.exercises.length||0,"Exercises"],["⚔️",workout?.fighting.length||0,"Combat"],["⚡",`+${XP.workout+(workout?.fighting.length||0)*XP.combat}`,"XP Earned"],["🏅",completedEx.length,"Completed"]].map(([icon,val,label])=>(
          <div key={label} className="gs" style={{padding:14}}><div style={{fontSize:18}}>{icon}</div><div style={{fontSize:22,fontWeight:800,color:"#10b981",fontFamily:"Rajdhani,sans-serif"}}>{val}</div><div style={{fontSize:10,color:"#6b7280"}}>{label}</div></div>
        ))}
      </div>
      {workout?.exercises.length>0&&<div className="gs" style={{marginTop:16,textAlign:"left"}}><div className="sl">Exercises Completed</div>{workout.exercises.map((e,i)=><div key={i} style={{fontSize:13,color:"#d1d5db",padding:"4px 0",borderBottom:"1px solid rgba(255,255,255,.03)"}}>✓ {e.name} — {e.sets||1}×{e.reps}</div>)}</div>}
      <button className="bp" onClick={()=>setMode("config")} style={{marginTop:20,padding:"14px 40px",letterSpacing:2}}>DONE</button>
    </div>);
  }

  // ═══ SESSION ═══
  if(mode==="session"&&workout){
    const ex=workout.allExercises[currentIdx];
    if(!ex)return <div>Loading...</div>;
    const pct=Math.round((completedEx.length/workout.allExercises.length)*100);
    const isDone=completedEx.includes(currentIdx);
    return(<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div><span style={{fontSize:11,padding:"2px 8px",borderRadius:100,background:`${phaseColor[ex.phase]}15`,color:phaseColor[ex.phase],fontWeight:700,fontFamily:"Rajdhani,sans-serif"}}>{phaseIcon[ex.phase]} {ex.phase.toUpperCase()}</span></div>
        <div style={{fontSize:24,fontWeight:800,color:"#10b981",fontFamily:"Rajdhani,sans-serif",fontVariantNumeric:"tabular-nums"}}>{fmt(sessionTimer)}</div>
      </div>
      {/* Progress bar */}
      <div style={{height:6,background:"rgba(255,255,255,.04)",borderRadius:3,marginBottom:8,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,#10b981,#06b6d4)",borderRadius:3,transition:"width .5s"}}/></div>
      <div style={{fontSize:11,color:"#6b7280",marginBottom:12,textAlign:"center"}}>{completedEx.length}/{workout.allExercises.length} exercises · {pct}% complete</div>
      {/* Exercise dots */}
      <div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:14}}>{workout.allExercises.map((_,i)=><div key={i} onClick={()=>!completedEx.includes(i)&&setCurrentIdx(i)} style={{width:20,height:20,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,cursor:"pointer",background:completedEx.includes(i)?`${phaseColor[workout.allExercises[i].phase]}20`:i===currentIdx?`${phaseColor[ex.phase]}10`:"rgba(255,255,255,.03)",border:i===currentIdx?`1px solid ${phaseColor[ex.phase]}50`:"1px solid rgba(255,255,255,.04)",color:completedEx.includes(i)?phaseColor[workout.allExercises[i].phase]:"#4b5563"}}>{completedEx.includes(i)?"✓":i+1}</div>)}</div>
      {/* Rest Timer */}
      {resting&&<div className="gs fade-in" style={{marginBottom:14,textAlign:"center",border:"1px solid rgba(16,185,129,.2)",padding:16}}><div style={{fontSize:11,color:"#6b7280",letterSpacing:2}}>REST</div><div style={{fontSize:48,fontWeight:900,color:"#10b981",fontFamily:"Rajdhani,sans-serif",lineHeight:1}}>{restTime}</div><div style={{display:"flex",gap:6,justifyContent:"center",marginTop:8}}>{REST_OPTIONS.map(r=><span key={r} className={`chip ${restDur===r?"chip-a":"chip-i"}`} onClick={()=>{setRestDur(r);setRestTime(r)}} style={{fontSize:11}}>{r}s</span>)}</div><button className="bp" onClick={skipRest} style={{marginTop:10,padding:"8px 24px"}}>Skip →</button></div>}
      {/* Current Exercise */}
      {!resting&&<div className="gs fade-in" style={{border:`1px solid ${phaseColor[ex.phase]}15`}}>
        <div style={{textAlign:"center",marginBottom:12}}><div style={{fontSize:22,fontWeight:700,color:"#f3f4f6",fontFamily:"Rajdhani,sans-serif",letterSpacing:1}}>{ex.name}</div><div style={{fontSize:13,color:"#6b7280"}}>{ex.sets||1}×{ex.reps} {ex.muscle?`· ${ex.muscle}`:""} · ~{ex.cal||3}cal</div></div>
        {ex.steps&&<div style={{marginBottom:12}}>{ex.steps.map((s,i)=><div key={i} style={{fontSize:13,color:"#d1d5db",marginBottom:6,paddingLeft:10,borderLeft:`2px solid ${phaseColor[ex.phase]}20`}}>{s}</div>)}</div>}
        {ex.tips&&ex.tips.map((t,i)=><div key={i} style={{fontSize:12,color:"#6b7280",marginBottom:4,paddingLeft:10}}>💡 {t}</div>)}
        <div style={{display:"flex",gap:8,marginTop:14}}>
          <button className="bp" onClick={()=>completeExercise(currentIdx)} disabled={isDone} style={{flex:1,padding:14,fontSize:15,letterSpacing:1}}>{isDone?"✓ Done":"✓ COMPLETE"}</button>
          <button className="bg" onClick={()=>skipExercise(currentIdx)} style={{padding:"14px 16px"}}>Skip</button>
          {ex.phase==="main"&&<button className="bg" onClick={()=>swapExercise(currentIdx)} style={{padding:"14px 16px"}}>🔄</button>}
        </div>
      </div>}
      {/* Finish Early */}
      <button onClick={()=>finishWorkout(completedEx.length)} style={{width:"100%",marginTop:14,padding:10,background:"transparent",border:"1px solid rgba(239,68,68,.15)",borderRadius:8,color:"#ef4444",fontSize:12,cursor:"pointer"}}>End Session Early</button>
    </div>);
  }

  // ═══ PREVIEW ═══
  if(mode==="preview"&&workout){
    return(<div>
      <div className="gs" style={{marginBottom:16,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,#10b981,#06b6d4)"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:11,color:"#6b7280",fontFamily:"Rajdhani,sans-serif",letterSpacing:2}}>YOUR WORKOUT</div><div style={{fontSize:20,fontWeight:800,color:"#f3f4f6",fontFamily:"Rajdhani,sans-serif"}}>{workout.splitName}</div></div><button className="bg" onClick={()=>{setMode("config");setWorkout(null)}} style={{fontSize:12}}>← Change</button></div>
        <div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap",fontSize:12,color:"#d1d5db"}}><span>⏱ ~{workout.estTime}min</span><span>💪 {workout.exercises.length} exercises</span><span>⚔️ {workout.fighting.length} combat</span><span>🔥 {workout.warmup.length} warmup</span></div>
        <button className="bp" onClick={startSession} style={{width:"100%",marginTop:14,padding:16,fontSize:16,letterSpacing:2}}>⚔️ START WORKOUT</button>
      </div>
      {[["🔥 Warm-up",workout.warmup,"#f59e0b"],["💪 Exercises",workout.exercises,"#10b981"],["⚔️ Combat",workout.fighting,"#a78bfa"],["🧘 Cool-down",workout.cooldown,"#06b6d4"]].map(([label,list,color])=>list.length>0&&<div key={label} className="gs" style={{marginBottom:10}}><div className="sl" style={{color}}>{label} ({list.length})</div>{list.map((e,i)=><div key={i} className="ex-card" onClick={()=>setExpandedEx(expandedEx===`${label}${i}`?null:`${label}${i}`)}><div style={{display:"flex",justifyContent:"space-between"}}><div><div style={{fontWeight:600,fontSize:14}}>{e.name}</div><div style={{fontSize:12,color:"#6b7280"}}>{e.sets||1}×{e.reps} {e.muscle?`· ${e.muscle}`:""}</div></div><span style={{color:"#4b5563",fontSize:14}}>{expandedEx===`${label}${i}`?"▾":"▸"}</span></div>{expandedEx===`${label}${i}`&&<ExerciseDetail ex={e} color={color} showComplete={false}/>}</div>)}</div>)}
      <div style={{display:"flex",gap:6,alignItems:"center",marginTop:8}}><span style={{fontSize:11,color:"#6b7280"}}>Rest:</span>{REST_OPTIONS.map(r=><span key={r} className={`chip ${restDur===r?"chip-a":"chip-i"}`} onClick={()=>setRestDur(r)} style={{padding:"4px 10px",fontSize:11}}>{r}s</span>)}</div>
    </div>);
  }

  // ═══ ALREADY DONE TODAY ═══
  if(todayW&&mode==="config"){
    return(<div>
      <div className="gs" style={{textAlign:"center",marginBottom:16,border:"1px solid rgba(34,197,94,.2)"}}><div style={{fontSize:48,marginBottom:8}}>✅</div><div style={{fontFamily:"Rajdhani,sans-serif",fontWeight:700,fontSize:18,color:"#22c55e",letterSpacing:1}}>TRAINING COMPLETE</div><div style={{fontSize:13,color:"#6b7280",marginTop:4}}>{todayW.splitName} · {todayW.calBurned}cal · {fmt(todayW.duration)}</div><button className="bg" onClick={()=>setMode("config2")} style={{marginTop:12}}>Train Again</button></div>
      {/* Calendar */}
      <div className="gs" style={{marginBottom:14}}><div onClick={()=>setShowCal(!showCal)} style={{display:"flex",justifyContent:"space-between",cursor:"pointer"}}><div className="sl" style={{margin:0}}>{new Date().toLocaleDateString('en',{month:'long',year:'numeric'})}</div><span style={{color:"#6b7280"}}>{showCal?"▾":"▸"}</span></div>
        {showCal&&<div className="fade-in" style={{marginTop:12}}><div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,textAlign:"center"}}>{["Su","Mo","Tu","We","Th","Fr","Sa"].map(d=><div key={d} style={{fontSize:10,color:"#6b7280",padding:4,fontWeight:600}}>{d}</div>)}{calDays().map((day,i)=><div key={i} style={{padding:6,borderRadius:6,fontSize:12,fontWeight:600,background:day?.w?"rgba(16,185,129,.15)":"transparent",color:day?.w?"#22c55e":day?"#4b5563":"transparent"}}>{day?.day||""}</div>)}</div></div>}
      </div>
      {/* History */}
      <div className="gs"><div onClick={()=>setShowHist(!showHist)} style={{display:"flex",justifyContent:"space-between",cursor:"pointer"}}><div className="sl" style={{margin:0}}>Training History · {Object.keys(workoutLog).length} sessions</div><span style={{color:"#6b7280"}}>{showHist?"▾":"▸"}</span></div>
        {showHist&&<div style={{marginTop:12}}>{Object.entries(workoutLog).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,15).map(([date,w])=><div key={date} style={{padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,.03)"}}><div style={{display:"flex",justifyContent:"space-between"}}><div><div style={{fontWeight:600,fontSize:14}}>{w.splitName||"Training"}</div><div style={{fontSize:12,color:"#6b7280"}}>{new Date(date+'T00:00:00').toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}{w.completedAt?` · ${w.completedAt}`:""}</div></div><div style={{textAlign:"right"}}><div style={{fontSize:14,fontWeight:700,color:"#10b981"}}>{w.calBurned}cal</div><div style={{fontSize:11,color:"#6b7280"}}>{fmt(w.duration)}</div></div></div>{w.exercises&&<div style={{fontSize:11,color:"#4b5563",marginTop:4}}>{w.exercises.join(", ")}</div>}</div>)}</div>}
      </div>
    </div>);
  }

  // ═══ CONFIG ═══ (also mode==="config2" for training again)
  return(<div>
    <div style={{textAlign:"center",marginBottom:20}}><div style={{fontSize:36,marginBottom:8}}>⚔️</div><h2 style={{fontSize:22,fontWeight:800,color:"#f3f4f6",fontFamily:"Rajdhani,sans-serif",letterSpacing:1}}>Plan Today's Training</h2><p style={{color:"#6b7280",fontSize:13,marginTop:4}}>Choose your activity, focus, and time</p></div>
    <div className="gs" style={{marginBottom:14}}><div className="sl">Activity Type</div><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>{ACTIVITY_TYPES.map(a=><div key={a.id} onClick={()=>setDayActivity(a.id)} style={{padding:"12px 6px",borderRadius:10,textAlign:"center",cursor:"pointer",background:dayActivity===a.id?"rgba(16,185,129,.08)":"rgba(255,255,255,.02)",border:dayActivity===a.id?"1px solid rgba(16,185,129,.3)":"1px solid rgba(255,255,255,.04)"}}><div style={{fontSize:22}}>{a.icon}</div><div style={{fontSize:11,fontWeight:600,color:dayActivity===a.id?"#10b981":"#e5e7eb",marginTop:4}}>{a.label}</div></div>)}</div></div>
    {["bodyweight","gym"].includes(dayActivity)&&<div className="gs" style={{marginBottom:14}}><div className="sl">Body Focus</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{BODY_PARTS.map(bp=><span key={bp.id} className={`chip ${dayFocus===bp.id?"chip-a":"chip-i"}`} onClick={()=>setDayFocus(bp.id)} style={{padding:"8px 14px"}}>{bp.icon} {bp.label}</span>)}</div></div>}
    <div className="gs" style={{marginBottom:20}}><div className="sl">Time Available</div><div style={{display:"flex",gap:8}}>{TIME_OPTIONS.map(t=><div key={t} onClick={()=>setDayTime(t)} style={{flex:1,padding:"12px 4px",borderRadius:10,textAlign:"center",cursor:"pointer",background:dayTime===t?"rgba(16,185,129,.08)":"rgba(255,255,255,.02)",border:dayTime===t?"1px solid rgba(16,185,129,.3)":"1px solid rgba(255,255,255,.04)"}}><div style={{fontSize:18,fontWeight:800,color:dayTime===t?"#10b981":"#e5e7eb",fontFamily:"Rajdhani,sans-serif"}}>{t}</div><div style={{fontSize:10,color:"#6b7280"}}>min</div></div>)}</div></div>
    <button className="bp" onClick={generateDaily} style={{width:"100%",padding:16,fontSize:16,letterSpacing:2}}>⚔️ GENERATE WORKOUT</button>
  </div>);
}
