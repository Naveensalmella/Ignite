import { useState, useEffect, useRef } from 'react';
import { today } from '../utils';
import { XP } from '../data';

export default function Wellness({journal,setJournal,addXP}){
  const d=today();const entry=journal[d]||{mood:0,entry:"",gratitude:"",mL:false,jL:false,gL:false};
  const moods=["😫","😔","😐","🙂","😄"];const labels=["Burned Out","Low Flame","Steady","Blazing","On Fire"];
  const update=(f,v)=>{const prev=entry;const next={...entry,[f]:v};if(f==="mood"&&!prev.mL){next.mL=true;addXP(XP.mood,"Mood")}if(f==="entry"&&v.length>20&&!prev.jL){next.jL=true;addXP(XP.journal,"Journal")}if(f==="gratitude"&&v.length>10&&!prev.gL){next.gL=true;addXP(XP.gratitude,"Gratitude")}setJournal(p=>({...p,[d]:next}))};
  return(<div>
    <div className="gs" style={{marginBottom:16,textAlign:"center"}}><div className="sl">Flame Status</div><div style={{display:"flex",gap:16,justifyContent:"center",marginTop:12}}>{moods.map((m,i)=><div key={i} onClick={()=>update("mood",i+1)} style={{cursor:"pointer"}}><span className={`me ${entry.mood===i+1?"mea":""}`} style={{fontSize:entry.mood===i+1?40:28,display:"block"}}>{m}</span><span style={{fontSize:10,color:entry.mood===i+1?"#6ee7b7":"#4b5563",display:"block",marginTop:4,fontFamily:"Rajdhani,sans-serif"}}>{labels[i]}</span></div>)}</div></div>
    <div className="gs" style={{marginBottom:16}}><div style={{fontSize:14,fontWeight:600,color:"#f59e0b",marginBottom:8,fontFamily:"Rajdhani,sans-serif"}}>🌟 Gratitude <span style={{fontSize:11,color:"#fbbf24"}}>+{XP.gratitude}XP</span></div><textarea className="inp" placeholder="What fuels your fire?" value={entry.gratitude||""} onChange={e=>update("gratitude",e.target.value)} style={{minHeight:70,resize:"vertical"}}/></div>
    <div className="gs"><div style={{fontSize:14,fontWeight:600,color:"#10b981",marginBottom:8,fontFamily:"Rajdhani,sans-serif"}}>📝 Battle Journal <span style={{fontSize:11,color:"#fbbf24"}}>+{XP.journal}XP</span></div><textarea className="inp" placeholder="Record your victories..." value={entry.entry||""} onChange={e=>update("entry",e.target.value)} style={{minHeight:120,resize:"vertical",lineHeight:1.7}}/></div>
  </div>);
}
