import { useState, useEffect, useRef } from 'react';
import { today } from '../utils';
import { DEFAULT_HABITS, REQUIRED_DAILY, XP, DAILY_PENALTY } from '../data';

export default function DailyQuestPage({habits,setHabits,habitLog,setHabitLog,addXP}){
  const [newH,setNewH]=useState("");const d=today();const checked=habitLog[d]||[];
  const toggle=(id)=>{const was=checked.includes(id);setHabitLog(p=>{const dl=p[d]||[];return{...p,[d]:was?dl.filter(x=>x!==id):[...dl,id]}});if(!was)addXP(XP.habit,"Quest done")};
  const addH=()=>{if(!newH.trim())return;setHabits(p=>[...p,{id:`h${Date.now()}`,name:newH,icon:"⭐",pillar:"power"}]);setNewH("")};
  const removeH=(id)=>{if(DEFAULT_HABITS.find(h=>h.id===id))return;setHabits(p=>p.filter(h=>h.id!==id))};
  const getStreak=(id)=>{let s=0,dt=new Date();for(let i=0;i<365;i++){const ds=dt.toISOString().split("T")[0];if((habitLog[ds]||[]).includes(id)){s++;dt.setDate(dt.getDate()-1)}else break}return s};
  const progress=habits.length>0?Math.round((checked.length/habits.length)*100):0;
  const penaltyRisk=checked.length<REQUIRED_DAILY;
  const required=habits.filter(h=>h.required);const optional=habits.filter(h=>!h.required);

  return(<div>
    {penaltyRisk&&<div className="gs" style={{marginBottom:16,border:"1px solid rgba(16,185,129,.2)",background:"rgba(16,185,129,.04)"}}><div style={{display:"flex",gap:10,alignItems:"center"}}><span style={{fontSize:22}}>⚠️</span><div><div style={{fontWeight:700,color:"#ef4444",fontFamily:"Rajdhani,sans-serif",fontSize:13}}>PENALTY WARNING</div><div style={{fontSize:12,color:"#6b7280"}}>{REQUIRED_DAILY-checked.length} more needed or <span style={{color:"#ef4444"}}>-{DAILY_PENALTY} XP</span> at midnight!</div></div></div></div>}

    <div className="gs" style={{textAlign:"center",marginBottom:16,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,height:"100%",width:`${progress}%`,background:"linear-gradient(90deg,rgba(16,185,129,.06),transparent)",borderRadius:14}}/>
      <div style={{position:"relative"}}><div style={{fontSize:36,fontWeight:900,fontFamily:"Rajdhani,sans-serif",background:"linear-gradient(135deg,#10b981,#06b6d4)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{progress}%</div>
        <div style={{height:6,background:"rgba(16,185,129,.06)",borderRadius:3,marginTop:8,overflow:"hidden"}}><div style={{height:"100%",width:`${progress}%`,background:"linear-gradient(90deg,#10b981,#06b6d4)",borderRadius:3}}/></div>
        <div style={{fontSize:12,color:"#6b7280",marginTop:6}}>{checked.length}/{habits.length} done · +{XP.habit}XP each · Min {REQUIRED_DAILY} required</div>
      </div>
    </div>

    {/* MANDATORY QUESTS */}
    <div className="sl" style={{color:"#ef4444"}}>🔥 Mandatory Daily Training</div>
    <div style={{marginBottom:20}}>{required.map(h=><div key={h.id} className="gc" style={{padding:14,marginBottom:8,display:"flex",alignItems:"center",justifyContent:"space-between"}}><div onClick={()=>toggle(h.id)} style={{display:"flex",alignItems:"center",gap:12,cursor:"pointer",flex:1}}><div style={{width:26,height:26,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,flexShrink:0,...(checked.includes(h.id)?{background:"linear-gradient(135deg,#10b981,#059669)",color:"#060a0c"}:{border:"2px solid #374151"})}}>{checked.includes(h.id)?"✓":""}</div><span style={{fontSize:18}}>{h.icon}</span><span style={{fontSize:14,fontWeight:500,color:checked.includes(h.id)?"#4b5563":"#e5e7eb",textDecoration:checked.includes(h.id)?"line-through":"none"}}>{h.name}</span><span style={{fontSize:9,padding:"2px 6px",borderRadius:100,background:"rgba(239,68,68,.08)",color:"#ef4444"}}>REQ</span></div><div style={{display:"flex",gap:8}}>{getStreak(h.id)>0&&<span style={{fontSize:11,color:"#10b981"}}>🔥{getStreak(h.id)}d</span>}</div></div>)}</div>

    {/* OPTIONAL + CUSTOM QUESTS */}
    <div className="sl" style={{color:"#10b981"}}>⭐ Additional Quests</div>
    {optional.map(h=><div key={h.id} className="gc" style={{padding:14,marginBottom:8,display:"flex",alignItems:"center",justifyContent:"space-between"}}><div onClick={()=>toggle(h.id)} style={{display:"flex",alignItems:"center",gap:12,cursor:"pointer",flex:1}}><div style={{width:26,height:26,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,flexShrink:0,...(checked.includes(h.id)?{background:"linear-gradient(135deg,#10b981,#f59e0b)",color:"#060a0c"}:{border:"2px solid #374151"})}}>{checked.includes(h.id)?"✓":""}</div><span style={{fontSize:18}}>{h.icon}</span><span style={{fontSize:14,fontWeight:500,color:checked.includes(h.id)?"#4b5563":"#e5e7eb",textDecoration:checked.includes(h.id)?"line-through":"none"}}>{h.name}</span></div><div style={{display:"flex",gap:8}}>{getStreak(h.id)>0&&<span style={{fontSize:11,color:"#10b981"}}>🔥{getStreak(h.id)}d</span>}{!DEFAULT_HABITS.find(dh=>dh.id===h.id)&&<span onClick={()=>removeH(h.id)} style={{cursor:"pointer",color:"#4b5563"}}>×</span>}</div></div>)}

    {/* ADD CUSTOM */}
    <div style={{display:"flex",gap:8,marginTop:12}}><input className="inp" placeholder="Add custom quest..." value={newH} onChange={e=>setNewH(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addH()} style={{flex:1}}/><button className="bp" onClick={addH}>Add</button></div>
  </div>);
}
