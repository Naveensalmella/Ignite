import { useState, useEffect, useRef } from 'react';
import { today } from '../utils';
import { XP } from '../data';

export default function FinancePage({finances,setFinances,addXP}){
  const [amt,setAmt]=useState("");const [cat,setCat]=useState("");const [note,setNote]=useState("");const [type,setType]=useState("expense");
  const add=()=>{if(!amt||!cat)return;setFinances(p=>[{id:Date.now(),type,amount:parseFloat(amt),category:cat,note,date:today()},...p]);setAmt("");setCat("");setNote("");addXP(XP.finance,"Finance")};
  const income=finances.filter(f=>f.type==="income").reduce((s,f)=>s+f.amount,0);const expense=finances.filter(f=>f.type==="expense").reduce((s,f)=>s+f.amount,0);
  return(<div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:16}}>{[["Earned",income,"#10b981"],["Spent",expense,"#ef4444"],["Balance",income-expense,income>=expense?"#fbbf24":"#ef4444"]].map(([l,v,c])=><div key={l} className="gs" style={{textAlign:"center"}}><div style={{fontSize:12,color:"#6b7280",fontFamily:"Rajdhani,sans-serif"}}>{l}</div><div style={{fontSize:20,fontWeight:800,color:c}}>₹{v.toLocaleString()}</div></div>)}</div>
    <div className="gs" style={{marginBottom:16}}><div style={{display:"flex",gap:6,marginBottom:12}}>{["expense","income"].map(t=><span key={t} className={`chip ${type===t?"chip-a":"chip-i"}`} onClick={()=>setType(t)}>{t==="income"?"+ Income":"− Expense"}</span>)}</div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><input className="inp" placeholder="₹" type="number" value={amt} onChange={e=>setAmt(e.target.value)} style={{flex:"1 1 80px"}}/><input className="inp" placeholder="Category" value={cat} onChange={e=>setCat(e.target.value)} style={{flex:"1 1 120px"}}/><input className="inp" placeholder="Note" value={note} onChange={e=>setNote(e.target.value)} style={{flex:"2 1 140px"}}/><button className="bp" onClick={add}>Add</button></div></div>
    <div className="gs"><div className="sl">Transactions</div>{finances.slice(0,15).map(f=><div key={f.id} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid rgba(16,185,129,.04)"}}><div><div style={{fontSize:14}}>{f.category}{f.note&&<span style={{color:"#4b5563"}}> — {f.note}</span>}</div><div style={{fontSize:11,color:"#4b5563"}}>{f.date}</div></div><span style={{fontWeight:700,color:f.type==="income"?"#10b981":"#ef4444"}}>{f.type==="income"?"+":"−"}₹{f.amount.toLocaleString()}</span></div>)}</div>
  </div>);
}
