import { useState, useEffect, useRef } from 'react';
import { getLevel, getLevelProg, getRank, calcBMI, bmiCat, bmiCol } from '../utils';
import { XP } from '../data';

export default function ProfilePage({profile,setProfile,user,onLogout,totalXP,streak,workoutLog,activityLog}){
  const [editing,setEditing]=useState(false);
  const [form,setForm]=useState({name:profile.name||user.name||"",bio:profile.bio||"",goal:profile.goal||"",calGoal:profile.calGoal||2000,weight:profile.weight||"",height:profile.height||""});
  const save=()=>{setProfile(p=>({...p,...form,calGoal:parseInt(form.calGoal)}));setEditing(false)};
  const lv=getLevel(totalXP);const rank=getRank(lv);const prog=getLevelProg(totalXP);
  const bmi=calcBMI(parseFloat(form.weight),parseFloat(form.height));const totalW=Object.keys(workoutLog).length;const totalCal=Object.values(workoutLog).reduce((s,w)=>s+(w.calBurned||0),0);
  return(<div style={{maxWidth:560}}>
    <div className="gs" style={{textAlign:"center",marginBottom:20,padding:32,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${rank.color},#10b981)`}}/>
      <div style={{width:90,height:90,borderRadius:"50%",margin:"0 auto 16px",background:`linear-gradient(135deg,${rank.color},#10b981)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,fontWeight:800,color:"#fff",fontFamily:"Rajdhani,sans-serif"}}>{(form.name||"U")[0].toUpperCase()}</div>
      <h3 style={{fontSize:22,fontWeight:800,color:"#f3f4f6",fontFamily:"Rajdhani,sans-serif"}}>{form.name||user.name}</h3>
      <p style={{fontSize:13,color:"#6b7280"}}>{user.email||user.username}</p>
      <div style={{display:"flex",justifyContent:"center",gap:20,marginTop:14}}>
        <div><div style={{fontSize:28,fontWeight:900,color:rank.color,fontFamily:"Rajdhani,sans-serif"}}>{lv}</div><div style={{fontSize:10,color:"#6b7280"}}>Level</div></div>
        <div><span className="rank-badge" style={{background:`${rank.color}15`,color:rank.color,border:`1px solid ${rank.color}25`,fontSize:14,padding:"6px 18px"}}>{rank.emoji} {rank.name}</span></div>
        <div><div style={{fontSize:28,fontWeight:900,color:"#10b981",fontFamily:"Rajdhani,sans-serif"}}>{streak}</div><div style={{fontSize:10,color:"#6b7280"}}>Streak</div></div>
      </div>
      <div className="xp-bar-bg" style={{marginTop:12,height:8}}><div className="xp-bar-fill" style={{width:`${prog*100}%`,background:`linear-gradient(90deg,${rank.color},#10b981)`,height:8}}/></div>
      <div style={{fontSize:11,color:"#4b5563",marginTop:6}}>{totalXP.toLocaleString()} XP · {totalW} workouts · {totalCal.toLocaleString()} cal burned</div>
      {bmi&&<div style={{marginTop:10}}><span style={{fontSize:16,fontWeight:700,color:bmiCol(bmi),fontFamily:"Rajdhani,sans-serif"}}>BMI: {bmi}</span> <span style={{fontSize:12,color:bmiCol(bmi)}}>{bmiCat(bmi)}</span></div>}
    </div>
    <div className="gs" style={{marginBottom:16}}>
      {!editing?<div>{[["Goal",form.goal],["Daily Fuel",`${form.calGoal}kcal`],["Weight",form.weight?`${form.weight}kg`:"—"],["Height",form.height?`${form.height}cm`:"—"]].map(([l,v])=><div key={l} style={{display:"flex",justifyContent:"space-between",padding:"14px 0",borderBottom:"1px solid rgba(16,185,129,.04)",fontSize:14}}><span style={{color:"#6b7280"}}>{l}</span><span>{v||"—"}</span></div>)}<button className="bp" onClick={()=>setEditing(true)} style={{width:"100%",marginTop:16}}>Edit Profile</button></div>
      :<div>{[["Name","name","text"],["Bio","bio","text"],["Goal","goal","text"],["Daily Fuel","calGoal","number"],["Weight (kg)","weight","number"],["Height (cm)","height","number"]].map(([l,k,t])=><div key={k} style={{marginBottom:14}}><label style={{fontSize:12,color:"#6b7280",display:"block",marginBottom:4}}>{l}</label><input className="inp" type={t} value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}/></div>)}<div style={{display:"flex",gap:10}}><button className="bp" onClick={save} style={{flex:1}}>Save</button><button className="bg" onClick={()=>setEditing(false)} style={{flex:1}}>Cancel</button></div></div>}
    </div>
    {activityLog&&activityLog.length>0&&<div className="gs" style={{marginBottom:16}}><div className="sl">Recent Activity</div>{activityLog.slice(0,25).map(a=><div key={a.id} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,.03)",fontSize:13}}><span style={{color:"#d1d5db"}}>{a.detail}</span><span style={{color:"#4b5563",fontSize:11,flexShrink:0,marginLeft:10}}>{a.date} {a.time}</span></div>)}</div>}
    <button className="bg" onClick={onLogout} style={{width:"100%",color:"#ef4444"}}>Log Out</button>
  </div>);
}
