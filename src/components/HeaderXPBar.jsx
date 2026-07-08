import { useState, useEffect, useRef } from 'react';
import { getLevel, getLevelProg, getRank, xpToNext, getStreakMult } from '../utils';
import { XP } from '../data';

export default function HeaderXPBar({totalXP,streak}){
  const lv=getLevel(totalXP);const prog=getLevelProg(totalXP);const rank=getRank(lv);const remain=xpToNext(totalXP);const mult=getStreakMult(streak);
  return(<div style={{display:"flex",alignItems:"center",gap:10,flex:1,maxWidth:400}}>
    <div style={{width:36,height:36,borderRadius:10,background:`linear-gradient(135deg,${rank.color}30,${rank.color}10)`,border:`1.5px solid ${rank.color}40`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Rajdhani,sans-serif",fontWeight:800,fontSize:15,color:rank.color,flexShrink:0}}>{lv}</div>
    <div style={{flex:1,minWidth:0}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3,alignItems:"center"}}>
        <span className="rank-badge" style={{background:`${rank.color}12`,color:rank.color,border:`1px solid ${rank.color}20`,padding:"2px 8px",fontSize:10}}>{rank.emoji} {rank.name}</span>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {streak>0&&<span className="streak-fire" style={{fontSize:10,padding:"2px 8px"}}>🔥{streak}d{mult>1?` ×${mult}`:""}</span>}
          <span style={{fontSize:10,color:"#4b5563",fontFamily:"Rajdhani,sans-serif"}}>{lv<100?`${remain.toLocaleString()}XP`:""}</span>
        </div>
      </div>
      <div className="xp-bar-bg"><div className="xp-bar-fill" style={{width:`${prog*100}%`,background:`linear-gradient(90deg,${rank.color},#10b981)`,boxShadow:`0 0 8px ${rank.color}40`}}/></div>
    </div>
  </div>);
}
