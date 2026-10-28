"use client";
import { useState } from 'react';
import { XP } from '@/data/index';
import { today, toArr } from '@/utils';

const PC={high:{c:"#ef4444",l:"Epic",x:XP.task_epic},medium:{c:"#f59e0b",l:"Rare",x:XP.task_rare},low:{c:"#34d399",l:"Common",x:XP.task_common}};
// Firestore data is untrusted: tasks may arrive as an object with numeric keys, contain nulls, or have an unknown priority
const pcOf=(t)=>PC[t.priority]||PC.medium;

export default function MissionsPage({tasks,setTasks,addXP}){
  const [newT,setNewT]=useState("");const [pri,setPri]=useState("medium");const [filter,setFilter]=useState("all");
  const list=toArr(tasks).filter(t=>t&&typeof t==="object");
  const add=()=>{if(!newT.trim())return;setTasks(p=>[{id:Date.now(),text:newT.trim(),done:false,priority:pri,created:today()},...toArr(p)]);setNewT("")};
  // XP is awarded only the first time a mission is cleared (xpAwarded flag) so un-check/re-check can't farm XP
  const toggle=(id)=>{const t=list.find(t=>t.id===id);if(t&&!t.done&&!t.xpAwarded){addXP(pcOf(t).x,"Mission cleared")}setTasks(p=>toArr(p).map(t=>t&&t.id===id?{...t,done:!t.done,...(!t.done?{xpAwarded:true}:{})}:t))};
  const remove=(id)=>setTasks(p=>toArr(p).filter(t=>t&&t.id!==id));const filtered=list.filter(t=>filter==="all"?true:filter==="active"?!t.done:t.done);
  return(<div>
    <div style={{fontSize:13,color:"#6b7280",marginBottom:16}}>Your personal missions — add anything you want to accomplish. These are separate from your mandatory daily training quests.</div>
    <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}><input className="inp" placeholder="Add your own mission..." aria-label="New mission" value={newT} onChange={e=>setNewT(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} style={{flex:"1 1 200px"}}/><select className="inp" aria-label="Mission rarity" value={pri} onChange={e=>setPri(e.target.value)} style={{width:"auto"}}><option value="high">🔴 Epic +{XP.task_epic}XP</option><option value="medium">🟠 Rare +{XP.task_rare}XP</option><option value="low">🟡 Common +{XP.task_common}XP</option></select><button className="bp" onClick={add} disabled={!newT.trim()}>Add</button></div>
    <div style={{display:"flex",gap:8,marginBottom:16}}>{[["all","All",list.length],["active","Active",list.filter(t=>!t.done).length],["done","Cleared",list.filter(t=>t.done).length]].map(([k,l,c])=><span key={k} className={`chip ${filter===k?"chip-a":"chip-i"}`} onClick={()=>setFilter(k)}>{l}({c})</span>)}</div>
    {filtered.length===0&&<div style={{textAlign:"center",padding:40,color:"#6b7280"}}>{list.length===0?"Add your own missions above.":filter==="done"?"No cleared missions yet.":"No active missions."}</div>}
    {filtered.map((t,i)=>{const pc=pcOf(t);return <div key={t.id??`i${i}`} className="gc" style={{padding:14,marginBottom:8,display:"flex",alignItems:"center",justifyContent:"space-between"}}><div onClick={()=>toggle(t.id)} style={{display:"flex",alignItems:"center",gap:12,cursor:"pointer",flex:1}}><div style={{width:24,height:24,borderRadius:"50%",flexShrink:0,border:t.done?"none":`2px solid ${pc.c}40`,background:t.done?"linear-gradient(135deg,#10b981,#06b6d4)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff",fontWeight:700}}>{t.done?"✓":""}</div><span style={{fontSize:14,color:t.done?"#4b5563":"#e5e7eb",textDecoration:t.done?"line-through":"none"}}>{t.text}</span></div><div style={{display:"flex",gap:8,alignItems:"center"}}>{!t.done&&!t.xpAwarded&&<span style={{fontSize:11,color:"#fbbf24"}}>+{pc.x}</span>}<span style={{fontSize:11,padding:"3px 8px",borderRadius:100,background:`${pc.c}10`,color:pc.c,fontFamily:"Rajdhani,sans-serif"}}>{pc.l}</span><span onClick={()=>remove(t.id)} role="button" aria-label="Delete mission" style={{cursor:"pointer",color:"#4b5563"}}>×</span></div></div>})}
  </div>);
}
