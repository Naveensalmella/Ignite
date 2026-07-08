import { useState, useEffect, useRef } from 'react';
import { XP } from '../data';

export default function FocusTimer({addXP}){
  const [mode,setMode]=useState("focus");const [tl,setTl]=useState(25*60);const [run,setRun]=useState(false);const [ses,setSes]=useState(0);
  const ref=useRef(null);const modes={focus:25*60,short:5*60,long:15*60};
  useEffect(()=>{if(run&&tl>0){ref.current=setInterval(()=>setTl(t=>t-1),1000);return()=>clearInterval(ref.current)}if(tl===0&&run){setRun(false);if(mode==="focus"){setSes(s=>s+1);addXP(XP.focus,"Focus session")}}},[run,tl,mode]);
  const sw=(m)=>{setMode(m);setTl(modes[m]);setRun(false)};const mins=Math.floor(tl/60);const secs=tl%60;const prog=((modes[mode]-tl)/modes[mode])*100;const c=2*Math.PI*116;const mc={focus:"#ef4444",short:"#10b981",long:"#f59e0b"};
  return(<div style={{textAlign:"center",maxWidth:440,margin:"0 auto"}}>
    <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:32}}>{[["focus","Focus"],["short","Short"],["long","Long"]].map(([k,l])=><span key={k} className={`chip ${mode===k?"chip-a":"chip-i"}`} onClick={()=>sw(k)} style={mode===k?{background:`${mc[k]}15`,color:mc[k]}:{}}>{l}</span>)}</div>
    <div style={{position:"relative",width:260,height:260,margin:"0 auto 32px"}}><svg width="260" height="260" style={{transform:"rotate(-90deg)"}}><circle cx="130" cy="130" r="116" fill="none" stroke="rgba(16,185,129,.06)" strokeWidth="8"/><circle cx="130" cy="130" r="116" fill="none" stroke={mc[mode]} strokeWidth="8" strokeDasharray={c} strokeDashoffset={c*(1-prog/100)} strokeLinecap="round" style={{transition:"stroke-dashoffset .6s",filter:`drop-shadow(0 0 12px ${mc[mode]}50)`}}/></svg><div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}><div style={{fontSize:56,fontWeight:800,color:mc[mode],fontFamily:"Rajdhani,sans-serif",fontVariantNumeric:"tabular-nums"}}>{String(mins).padStart(2,"0")}:{String(secs).padStart(2,"0")}</div></div></div>
    <div style={{display:"flex",gap:12,justifyContent:"center",marginBottom:24}}><button className="bp" onClick={()=>setRun(!run)} style={{minWidth:130,fontSize:16,padding:14,letterSpacing:2,background:run?"linear-gradient(135deg,#f59e0b,#d97706)":""}}>{run?"PAUSE":"IGNITE"}</button><button className="bg" onClick={()=>{setTl(modes[mode]);setRun(false)}}>Reset</button></div>
    <div className="gs" style={{display:"inline-flex",gap:12,padding:"12px 24px"}}><span style={{color:"#6b7280",fontSize:13}}>Sessions:</span><span style={{fontSize:20,fontWeight:800,color:"#ef4444",fontFamily:"Rajdhani,sans-serif"}}>{ses}</span><span style={{color:"#fbbf24",fontSize:12}}>+{XP.focus}XP</span></div>
  </div>);
}
