import { useState, useEffect, useRef } from 'react';
import { today } from '../utils';
import { FOOD_DB, XP } from '../data';

export default function Nutrition({foodLog,setFoodLog,addXP}){
  const [cat,setCat]=useState("All");const [sel,setSel]=useState(null);const [qty,setQty]=useState(1);const [search,setSearch]=useState("");
  const d=today();const log=foodLog[d]||[];
  const cats=["All",...new Set(FOOD_DB.map(f=>f.category))];
  const filtered=FOOD_DB.filter(f=>(cat==="All"||f.category===cat)&&f.name.toLowerCase().includes(search.toLowerCase()));
  const totals=log.reduce((a,f)=>({cal:a.cal+f.cal*(f.qty||1),protein:a.protein+f.protein*(f.qty||1),carbs:a.carbs+f.carbs*(f.qty||1),fat:a.fat+f.fat*(f.qty||1),fiber:a.fiber+f.fiber*(f.qty||1)}),{cal:0,protein:0,carbs:0,fat:0,fiber:0});
  const addFood=(food,q=1)=>{setFoodLog(p=>({...p,[d]:[...(p[d]||[]),{...food,qty:q}]}));setSel(null);setQty(1);addXP(XP.food,"Fuel logged")};
  const nc={cal:"#ef4444",protein:"#10b981",carbs:"#f59e0b",fat:"#fbbf24",fiber:"#34d399"};const nl={cal:"Calories",protein:"Protein",carbs:"Carbs",fat:"Fat",fiber:"Fiber"};
  return(<div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))",gap:10,marginBottom:16}}>{Object.keys(nl).map(k=><div key={k} className="gs" style={{textAlign:"center",padding:12}}><div style={{fontSize:11,color:"#6b7280"}}>{nl[k]}</div><div style={{fontSize:20,fontWeight:800,color:nc[k]}}>{Math.round(totals[k])}</div></div>)}</div>
    <input className="inp" placeholder="Search foods..." value={search} onChange={e=>setSearch(e.target.value)} style={{marginBottom:12}}/>
    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>{cats.map(c=><span key={c} className={`chip ${cat===c?"chip-a":"chip-i"}`} onClick={()=>setCat(c)}>{c}</span>)}</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(100px,1fr))",gap:10,marginBottom:16}}>{filtered.map(f=><div key={f.id} className={`fc ${sel?.id===f.id?"sel":""}`} onClick={()=>{setSel(f);setQty(1)}}><div style={{fontSize:32,marginBottom:4}}>{f.emoji}</div><div style={{fontSize:11,fontWeight:600}}>{f.name}</div><div style={{fontSize:10,color:"#ef4444"}}>{f.cal}kcal</div></div>)}</div>
    {sel&&<div className="gs fade-in" style={{marginBottom:16,border:"1px solid rgba(239,68,68,.2)"}}><div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}><span style={{fontSize:36}}>{sel.emoji}</span><div><div style={{fontWeight:700}}>{sel.name}</div><div style={{fontSize:12,color:"#fbbf24"}}>+{XP.food} XP</div></div></div><div style={{display:"flex",alignItems:"center",gap:12}}><button className="bg" onClick={()=>setQty(Math.max(.5,qty-.5))}>−</button><span style={{fontWeight:700,fontSize:18,color:"#f3f4f6",minWidth:30,textAlign:"center"}}>{qty}</span><button className="bg" onClick={()=>setQty(qty+.5)}>+</button><button className="bp" onClick={()=>addFood(sel,qty)} style={{marginLeft:"auto"}}>+ Add</button></div></div>}
    {log.length>0&&<div className="gs"><div className="sl">Today's Fuel</div>{log.map((f,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:i<log.length-1?"1px solid rgba(16,185,129,.04)":"none"}}><span style={{fontSize:13}}>{f.emoji} {f.name} ×{f.qty}</span><span style={{color:"#ef4444",fontSize:13}}>{Math.round(f.cal*f.qty)}kcal</span></div>)}</div>}
  </div>);
}
