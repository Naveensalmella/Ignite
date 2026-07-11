import { useState } from 'react';
import { XP } from '../data';
import { today } from '../utils';

export default function MissionsPage({tasks,setTasks,addXP}){
  const [newT,setNewT]=useState("");const [pri,setPri]=useState("medium");const [filter,setFilter]=useState("all");
  const add=()=>{if(!newT.trim())return;setTasks(p=>[{id:Date.now(),text:newT,done:false,priority:pri,created:today()},...p]);setNewT("")};
  const toggle=(id)=>{const t=tasks.find(t=>t.id===id);if(t&&!t.done){const xp=t.priority==="high"?XP.task_epic:t.priority==="medium"?XP.task_rare:XP.task_common;addXP(xp,"Mission cleared")}setTasks(p=>p.map(t=>t.id===id?{...t,done:!t.done}:t))};
  const remove=(id)=>setTasks(p=>p.filter(t=>t.id!==id));const filtered=tasks.filter(t=>filter==="all"?true:filter==="active"?!t.done:t.done);
  const pc={high:{c:"#ef4444",l:"Epic",x:XP.task_epic},medium:{c:"#f59e0b",l:"Rare",x:XP.task_rare},low:{c:"#34d399",l:"Common",x:XP.task_common}};
  return(<div>
    <div style={{fontSize:13,color:"#6b7280",marginBottom:16}}>Your personal missions — add anything you want to accomplish. These are separate from your mandatory daily training quests.</div>
    <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}><input className="inp" placeholder="Add your own mission..." value={newT} onChange={e=>setNewT(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} style={{flex:"1 1 200px"}}/><select className="inp" value={pri} onChange={e=>setPri(e.target.value)} style={{width:"auto"}}><option value="high">🔴 Epic +{XP.task_epic}XP</option><option value="medium">🟠 Rare +{XP.task_rare}XP</option><option value="low">🟡 Common +{XP.task_common}XP</option></select><button className="bp" onClick={add}>Add</button></div>
    <div style={{display:"flex",gap:8,marginBottom:16}}>{[["all","All",tasks.length],["active","Active",tasks.filter(t=>!t.done).length],["done","Cleared",tasks.filter(t=>t.done).length]].map(([k,l,c])=><span key={k} className={`chip ${filter===k?"chip-a":"chip-i"}`} onClick={()=>setFilter(k)}>{l}({c})</span>)}</div>
    {filtered.length===0&&<div style={{textAlign:"center",padding:40,color:"#6b7280"}}>{tasks.length===0?"Add your own missions above.":"Empty"}</div>}
    {filtered.map(t=><div key={t.id} className="gc" style={{padding:14,marginBottom:8,display:"flex",alignItems:"center",justifyContent:"space-between"}}><div onClick={()=>toggle(t.id)} style={{display:"flex",alignItems:"center",gap:12,cursor:"pointer",flex:1}}><div style={{width:24,height:24,borderRadius:"50%",border:t.done?"none":`2px solid ${pc[t.priority].c}40`,background:t.done?"linear-gradient(135deg,#10b981,#06b6d4)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff",fontWeight:700}}>{t.done?"✓":""}</div><span style={{fontSize:14,color:t.done?"#4b5563":"#e5e7eb",textDecoration:t.done?"line-through":"none"}}>{t.text}</span></div><div style={{display:"flex",gap:8,alignItems:"center"}}>{!t.done&&<span style={{fontSize:10,color:"#fbbf24"}}>+{pc[t.priority].x}</span>}<span style={{fontSize:11,padding:"3px 8px",borderRadius:100,background:`${pc[t.priority].c}10`,color:pc[t.priority].c,fontFamily:"Rajdhani,sans-serif"}}>{pc[t.priority].l}</span><span onClick={()=>remove(t.id)} style={{cursor:"pointer",color:"#4b5563"}}>×</span></div></div>)}
  </div>);
}
