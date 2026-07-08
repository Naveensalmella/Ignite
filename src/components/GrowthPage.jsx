import { useState, useEffect, useRef } from 'react';
import { PILLAR_MISSIONS, XP } from '../data';

export default function GrowthPage({pillarProg,setPillarProg}){
  const [openPillar,setOpenPillar]=useState(null);
  const [openTier,setOpenTier]=useState(null);
  const [openMission,setOpenMission]=useState(null);

  const isMissionDone=(id)=>pillarProg[id]===true;
  const toggleMission=(id)=>setPillarProg(p=>({...p,[id]:!p[id]}));
  const isTierUnlocked=(pillarKey,tierIdx)=>{
    if(tierIdx===0)return true;
    const prevTier=PILLAR_MISSIONS[pillarKey].tiers[tierIdx-1];
    return prevTier.missions.every(m=>isMissionDone(m.id));
  };
  const getPillarProgress=(pillarKey)=>{
    const allM=PILLAR_MISSIONS[pillarKey].tiers.flatMap(t=>t.missions);
    const done=allM.filter(m=>isMissionDone(m.id)).length;
    return{done,total:allM.length,pct:allM.length>0?Math.round(done/allM.length*100):0};
  };

  return(<div>
    <div style={{fontSize:14,color:"#6b7280",marginBottom:20}}>These missions develop your mind, heart, spirit, and fortune. They don't give XP — they build the person behind the fighter. Complete all missions in a tier to unlock the next.</div>

    {/* Pillar overview cards */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14,marginBottom:24}}>
      {Object.entries(PILLAR_MISSIONS).map(([key,p])=>{
        const prog=getPillarProgress(key);const unlocked=p.tiers.filter((_,i)=>isTierUnlocked(key,i)).length;
        return(<div key={key} className="gc" onClick={()=>{setOpenPillar(openPillar===key?null:key);setOpenTier(null);setOpenMission(null)}} style={{cursor:"pointer",border:openPillar===key?`1px solid ${p.color}30`:"1px solid rgba(255,255,255,.04)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <span style={{fontSize:28}}>{p.icon}</span>
            <div><div style={{fontWeight:700,fontSize:16,color:p.color,fontFamily:"Rajdhani,sans-serif",letterSpacing:1}}>{p.label}</div>
            <div style={{fontSize:11,color:"#6b7280"}}>{unlocked}/{p.tiers.length} tiers · {prog.done}/{prog.total} missions</div></div>
          </div>
          <div className="xp-bar-bg" style={{height:6}}><div className="xp-bar-fill" style={{width:`${prog.pct}%`,background:`linear-gradient(90deg,${p.color},${p.color}80)`,height:6}}/></div>
          <div style={{fontSize:11,color:p.color,marginTop:6,fontWeight:600}}>{prog.pct}% complete</div>
        </div>);
      })}
    </div>

    {/* Expanded pillar tiers */}
    {openPillar&&(()=>{
      const p=PILLAR_MISSIONS[openPillar];
      return(<div className="fade-in">
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
          <span style={{fontSize:28}}>{p.icon}</span>
          <div><div style={{fontWeight:700,fontSize:20,color:p.color,fontFamily:"Rajdhani,sans-serif",letterSpacing:1}}>{p.label} Path</div>
          <div style={{fontSize:12,color:"#6b7280"}}>Complete each tier to unlock the next</div></div>
        </div>

        {p.tiers.map((tier,tIdx)=>{
          const unlocked=isTierUnlocked(openPillar,tIdx);
          const tierDone=tier.missions.every(m=>isMissionDone(m.id));
          const doneCount=tier.missions.filter(m=>isMissionDone(m.id)).length;
          return(<div key={tier.tier} className={`gs ${unlocked?"":"gate-locked"}`} style={{marginBottom:14,border:unlocked?`1px solid ${tierDone?`${p.color}25`:"rgba(255,255,255,.04)"}`:""}}
            onClick={()=>unlocked&&setOpenTier(openTier===tIdx?null:tIdx)}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:unlocked?"pointer":"default"}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:40,height:40,borderRadius:10,background:unlocked?`${p.color}12`:"rgba(255,255,255,.03)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Rajdhani,sans-serif",fontWeight:800,fontSize:16,color:unlocked?p.color:"#4b5563",border:`1px solid ${unlocked?p.color+"25":"rgba(255,255,255,.04)"}`}}>T{tier.tier}</div>
                <div><div style={{fontWeight:700,fontSize:15,color:unlocked?p.color:"#4b5563",fontFamily:"Rajdhani,sans-serif",letterSpacing:1}}>{tier.name}</div>
                <div style={{fontSize:12,color:"#6b7280"}}>{unlocked?`${doneCount}/${tier.missions.length} missions${tierDone?" ✓ Complete":""}` :"🔒 Complete previous tier to unlock"}</div></div>
              </div>
              {unlocked&&<span style={{color:p.color,fontSize:16}}>{openTier===tIdx?"▾":"▸"}</span>}
            </div>

            {openTier===tIdx&&unlocked&&(<div style={{marginTop:14}} onClick={e=>e.stopPropagation()}>
              {tier.missions.map((m,mIdx)=>{
                const done=isMissionDone(m.id);const expanded=openMission===m.id;
                return(<div key={m.id} className="ex-card" onClick={()=>setOpenMission(expanded?null:m.id)} style={{opacity:done?.6:1,border:expanded?`1px solid ${p.color}20`:""}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div onClick={e=>{e.stopPropagation();toggleMission(m.id)}} style={{width:24,height:24,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,cursor:"pointer",flexShrink:0,...(done?{background:p.color,color:"#060a0c"}:{border:"2px solid #374151"})}}>{done?"✓":""}</div>
                      <span style={{fontSize:20}}>{m.icon}</span>
                      <div><div style={{fontWeight:600,fontSize:14,color:done?"#4b5563":"#e5e7eb",textDecoration:done?"line-through":"none"}}>{m.name}</div>
                      <div style={{fontSize:12,color:"#6b7280",marginTop:2}}>{m.desc}</div></div>
                    </div>
                    <span style={{color:"#4b5563",fontSize:14}}>{expanded?"▾":"▸"}</span>
                  </div>

                  {expanded&&(<div className="ex-detail fade-in" style={{borderColor:`${p.color}15`}}>
                    <div className="sl" style={{color:p.color}}>How To Complete</div>
                    {m.how?.map((step,i)=>(<div key={i} style={{display:"flex",gap:12,marginBottom:10,fontSize:14,lineHeight:1.6}}>
                      <span style={{width:24,height:24,borderRadius:6,background:`${p.color}12`,display:"flex",alignItems:"center",justifyContent:"center",color:p.color,fontSize:12,fontWeight:700,fontFamily:"Rajdhani,sans-serif",flexShrink:0}}>{i+1}</span>
                      <span style={{color:"#d1d5db"}}>{step}</span>
                    </div>))}
                    {!done&&<button className="bp" onClick={e=>{e.stopPropagation();toggleMission(m.id)}} style={{width:"100%",marginTop:12,padding:12,background:`linear-gradient(135deg,${p.color},${p.color}cc)`}}>✓ Mark as Complete</button>}
                  </div>)}
                </div>);
              })}
            </div>)}
          </div>);
        })}
      </div>);
    })()}
  </div>);
}
