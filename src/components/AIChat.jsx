import { useState, useEffect, useRef } from 'react';
import { getLevel, getRank, today } from '../utils';
import { GATES, XP } from '../data';

export default function AIChat({appState,onAction,chatHistory,setChatHistory,totalXP,streak,workoutLog}){
  const [input,setInput]=useState("");const [loading,setLoading]=useState(false);const chatEnd=useRef(null);
  const lv=getLevel(totalXP);const rank=getRank(lv);const ug=GATES.filter(g=>lv>=g.unlock).length;
  useEffect(()=>{chatEnd.current?.scrollIntoView({behavior:"smooth"})},[chatHistory]);
  const send=async()=>{if(!input.trim()||loading)return;const um={role:"user",content:input};const newH=[...chatHistory,um];setChatHistory(newH);setInput("");setLoading(true);
    try{const ctx=`Champion: ${appState.user.name}. Lv${lv} ${rank.name}. XP:${totalXP}. Streak:${streak}d. Gates:${ug}/6. Workouts:${Object.keys(workoutLog).length}. Trained today:${workoutLog[today()]?"yes":"no"}.`;
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,system:`You are the Flame Oracle — bold, wise training AI. User is Lv.${lv} "${rank.name}" with ${ug}/6 gates unlocked. Address as "Champion." Use RPG language. Motivate training consistency — their streak is ${streak} days. ${ctx}\nActions: <action>JSON</action>: add_task, add_habit, navigate. Only if asked.`,messages:newH.slice(-20).map(m=>({role:m.role,content:m.content})),tools:[{type:"web_search_20250305",name:"web_search"}]})});
      const data=await res.json();let text=data.content?.filter(c=>c.type==="text").map(c=>c.text).join("\n")||"The flame burns.";
      const am=text.match(/<action>([\s\S]*?)<\/action>/);if(am){text=text.replace(/<action>[\s\S]*?<\/action>/,"").trim();onAction(am[1].trim())}
      setChatHistory(h=>[...h,{role:"assistant",content:text}]);
    }catch{setChatHistory(h=>[...h,{role:"assistant",content:"Flame flickers. Try again."}])}setLoading(false)};
  const sugg=["Analyze my stats — what should I grind?","How do I unlock Gate "+(GATES.find(g=>lv<g.unlock)?.gate||"MAX")+"?","Am I overtraining?","Best diet for muscle growth","What fighting technique should I focus on?","Recovery plan for today"];
  return(<div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 130px)"}}>
    <div style={{flex:1,overflowY:"auto",paddingBottom:16}}>
      {chatHistory.length===0&&<div style={{textAlign:"center",padding:"40px 20px"}}><div style={{width:72,height:72,borderRadius:16,margin:"0 auto 16px",background:"linear-gradient(135deg,#10b981,#06b6d4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,boxShadow:"0 0 40px rgba(239,68,68,.3)",animation:"emberGlow 3s infinite"}}>🔮</div><h3 style={{fontSize:22,fontWeight:800,color:"#f3f4f6",fontFamily:"Rajdhani,sans-serif"}}>Flame Oracle</h3><p style={{color:"#6b7280",fontSize:14,marginBottom:24}}>Lv.{lv} {rank.name} · {ug} Gates</p><div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center",maxWidth:500,margin:"0 auto"}}>{sugg.map((s,i)=><span key={i} className="chip chip-i" onClick={()=>setInput(s)} style={{padding:"10px 16px",fontSize:13}}>{s}</span>)}</div></div>}
      {chatHistory.map((m,i)=><div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",marginBottom:12}}>{m.role==="assistant"&&<div style={{width:30,height:30,borderRadius:10,background:"linear-gradient(135deg,#10b981,#06b6d4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0,marginRight:8,marginTop:4}}>🔮</div>}<div className={`cb ${m.role==="user"?"cbu":"cba"}`}>{m.content}</div></div>)}
      {loading&&<div style={{display:"flex",gap:8,marginBottom:12}}><div style={{width:30,height:30,borderRadius:10,background:"linear-gradient(135deg,#10b981,#06b6d4)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>🔮</div><div className="cb cba"><div style={{display:"flex",gap:6}}>{[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:"#10b981",animation:`dotPulse 1.2s ${i*.2}s infinite`}}/>)}</div></div></div>}
      <div ref={chatEnd}/>
    </div>
    <div style={{display:"flex",gap:10,borderTop:"1px solid rgba(16,185,129,.07)",paddingTop:14}}><input className="inp" placeholder="Ask the Oracle..." value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} style={{flex:1}}/><button className="bp" onClick={send} disabled={loading} style={{padding:"12px 28px",fontSize:16}}>{loading?"...":"↑"}</button></div>
  </div>);
}
