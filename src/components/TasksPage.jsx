"use client";
import { useState } from "react";
import { today, toArr } from '@/utils';

export default function TasksPage({ tasks, setTasks }) {
  const [newT,setNewT]=useState("");const [pri,setPri]=useState("medium");const [filter,setFilter]=useState("all");
  const list=toArr(tasks).filter(t=>t&&typeof t==="object");
  const add=()=>{if(!newT.trim())return;setTasks(p=>[{id:Date.now(),text:newT.trim(),done:false,priority:pri,created:today()},...toArr(p)]);setNewT("")};
  const toggle=(id)=>setTasks(p=>toArr(p).map(t=>t&&t.id===id?{...t,done:!t.done}:t));
  const remove=(id)=>setTasks(p=>toArr(p).filter(t=>t&&t.id!==id));
  const filtered=list.filter(t=>filter==="all"?true:filter==="active"?!t.done:t.done);
  const pc={high:{c:"#ef4444",b:"rgba(239,68,68,.1)",l:"Epic"},medium:{c:"#f59e0b",b:"rgba(245,158,11,.1)",l:"Rare"},low:{c:"#fb923c",b:"rgba(251,146,60,.1)",l:"Common"}};

  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}><input className="inp" placeholder="Add a new mission..." value={newT} onChange={e=>setNewT(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} style={{flex:"1 1 220px"}}/><select className="inp" value={pri} onChange={e=>setPri(e.target.value)} style={{flex:"0 0 auto",width:"auto",cursor:"pointer"}}><option value="high">🔴 Epic</option><option value="medium">🟠 Rare</option><option value="low">🟡 Common</option></select><button className="bp" onClick={add}>Add Mission</button></div>
      <div style={{display:"flex",gap:8,marginBottom:18}}>{[["all","All",list.length],["active","Active",list.filter(t=>!t.done).length],["done","Cleared",list.filter(t=>t.done).length]].map(([k,l,c])=><span key={k} className={`chip ${filter===k?"chip-a":"chip-i"}`} onClick={()=>setFilter(k)}>{l} ({c})</span>)}</div>
      {filtered.length===0&&<div style={{textAlign:"center",padding:40,color:"#6b4a42",fontSize:14}}>{list.length===0?"No active missions. Add one above.":"No missions match this filter"}</div>}
      {filtered.map((t,i)=>{const pr=pc[t.priority]||pc.medium;return <div key={t.id??`i${i}`} className="gc" style={{padding:14,marginBottom:8,display:"flex",alignItems:"center",justifyContent:"space-between"}}><div onClick={()=>toggle(t.id)} style={{display:"flex",alignItems:"center",gap:12,cursor:"pointer",flex:1}}><div style={{width:24,height:24,borderRadius:"50%",flexShrink:0,border:t.done?"none":`2px solid ${pr.c}40`,background:t.done?"linear-gradient(135deg,#ef4444,#f97316)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff",fontWeight:700,transition:"all .25s",boxShadow:t.done?"0 0 12px rgba(239,68,68,.3)":"none"}}>{t.done?"✓":""}</div><span style={{fontSize:14,fontWeight:500,color:t.done?"#4a3830":"#e8d8d0",textDecoration:t.done?"line-through":"none"}}>{t.text}</span></div><div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:11,padding:"3px 10px",borderRadius:100,background:pr.b,color:pr.c,fontWeight:600,fontFamily:"Rajdhani,Inter,sans-serif",letterSpacing:.5}}>{pr.l}</span><span onClick={()=>remove(t.id)} style={{cursor:"pointer",color:"#4a3830",fontSize:16}}>×</span></div></div>})}
    </div>
  );
}
