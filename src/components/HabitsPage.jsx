"use client";
import { useState } from "react";
import { pillars } from '@/data/index';
import { today, toArr, dateKey } from '@/utils';

// habitLog[date] may be an id array (legacy), a Firestore-mangled array, or a {habitId: bool} map
const doneIds=(v)=>{if(Array.isArray(v))return v;if(v&&typeof v==="object"){const k=Object.keys(v);if(k.length>0&&k.every(x=>!isNaN(x)))return Object.values(v);return k.filter(x=>v[x]===true)}return[]};
const asDoneMap=(v)=>{if(v&&typeof v==="object"&&!Array.isArray(v)){const k=Object.keys(v);if(!(k.length>0&&k.every(x=>!isNaN(x))))return{...v}}return Object.fromEntries(doneIds(v).map(id=>[id,true]))};

export default function HabitsPage({ habits, setHabits, habitLog, setHabitLog }) {
  const [newH,setNewH]=useState("");const [newP,setNewP]=useState("power");
  const hl=habitLog||{};const habitList=toArr(habits).filter(h=>h&&h.id!=null);
  const d=today();const checked=doneIds(hl[d]);
  const toggle=(id)=>setHabitLog(p=>{const prev=p||{};const m=asDoneMap(prev[d]);return{...prev,[d]:{...m,[id]:!m[id]}}});
  const addH=()=>{if(!newH.trim())return;setHabits(p=>[...toArr(p),{id:`h${Date.now()}`,name:newH.trim(),icon:"⭐",pillar:newP}]);setNewH("")};
  const removeH=(id)=>setHabits(p=>toArr(p).filter(h=>h&&h.id!==id));
  const getStreak=(id)=>{let s=0,dt=new Date();for(let i=0;i<365;i++){const ds=dateKey(dt);if(doneIds(hl[ds]).includes(id)){s++;dt.setDate(dt.getDate()-1)}else break}return s};
  const doneCount=habitList.filter(h=>checked.includes(h.id)).length;
  const progress=habitList.length>0?Math.round((doneCount/habitList.length)*100):0;

  return (
    <div>
      <div className="gs" style={{textAlign:"center",marginBottom:20,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:0,left:0,height:"100%",width:`${progress}%`,background:"linear-gradient(90deg,rgba(239,68,68,.06),rgba(249,115,22,.03))",transition:"width .5s",borderRadius:14}}/>
        <div style={{position:"relative"}}>
          <div style={{fontSize:42,fontWeight:900,fontFamily:"Rajdhani,Inter,sans-serif",background:"linear-gradient(135deg,#ef4444,#f97316)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{progress}%</div>
          <div style={{height:6,background:"rgba(239,68,68,.06)",borderRadius:3,marginTop:10,overflow:"hidden"}}><div style={{height:"100%",width:`${progress}%`,background:"linear-gradient(90deg,#ef4444,#f97316)",borderRadius:3,transition:"width .5s",boxShadow:"0 0 10px rgba(239,68,68,.3)"}}/></div>
          <div style={{fontSize:13,color:"#6b4a42",marginTop:8}}>{doneCount} of {habitList.length} daily challenges completed</div>
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}><input className="inp" placeholder="Add a new challenge..." value={newH} onChange={e=>setNewH(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addH()} style={{flex:"1 1 200px"}}/><select className="inp" value={newP} onChange={e=>setNewP(e.target.value)} style={{flex:"0 0 auto",width:"auto",cursor:"pointer"}}>{pillars.map(p=><option key={p.key} value={p.key}>{p.icon} {p.label}</option>)}</select><button className="bp" onClick={addH}>Add</button></div>
      {pillars.map(p=>{const ph=habitList.filter(h=>h.pillar===p.key);if(!ph.length)return null;return(
        <div key={p.key} style={{marginBottom:20}}><div className="sl" style={{color:p.color}}>{p.icon} {p.label}</div>
          {ph.map(h=><div key={h.id} className="gc" style={{padding:14,marginBottom:8,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div onClick={()=>toggle(h.id)} style={{display:"flex",alignItems:"center",gap:12,cursor:"pointer",flex:1}}>
              <div style={{width:26,height:26,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,flexShrink:0,transition:"all .25s",...(checked.includes(h.id)?{background:p.gradient,color:"#0a0806",border:"none",boxShadow:`0 0 12px ${p.color}35`}:{border:"2px solid #3a2820",background:"transparent"})}}>{checked.includes(h.id)?"✓":""}</div>
              <span style={{fontSize:18}}>{h.icon}</span>
              <span style={{fontSize:14,fontWeight:500,color:checked.includes(h.id)?"#4a3830":"#e8d8d0",textDecoration:checked.includes(h.id)?"line-through":"none"}}>{h.name}</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              {getStreak(h.id)>0&&<span style={{fontSize:12,color:"#f97316",fontWeight:600}}>🔥 {getStreak(h.id)}d</span>}
              <span onClick={()=>removeH(h.id)} style={{cursor:"pointer",color:"#4a3830",fontSize:14}}>×</span>
            </div>
          </div>)}
        </div>
      )})}
    </div>
  );
}
