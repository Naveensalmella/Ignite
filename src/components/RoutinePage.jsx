import { useState, useMemo } from 'react';
import { today } from '../utils';

const TIME_BLOCKS = ["05:00","06:00","07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00","23:00"];

const TEMPLATES = {
  warrior: {name:"Warrior's Day",icon:"⚔️",blocks:[
    {time:"05:30",activity:"Wake up + Cold splash",icon:"🌅",duration:15,cat:"spirit"},
    {time:"06:00",activity:"Training Session",icon:"⚔️",duration:60,cat:"power"},
    {time:"07:00",activity:"Shower + Breakfast",icon:"🍳",duration:45,cat:"power"},
    {time:"08:00",activity:"Deep Work / Study",icon:"💻",duration:120,cat:"mind"},
    {time:"10:00",activity:"Short Break + Stretch",icon:"🤸",duration:15,cat:"spirit"},
    {time:"10:15",activity:"Work / Study Block 2",icon:"📚",duration:105,cat:"mind"},
    {time:"12:00",activity:"Lunch + Walk",icon:"🍽️",duration:60,cat:"power"},
    {time:"13:00",activity:"Focus Session",icon:"⚡",duration:90,cat:"mind"},
    {time:"14:30",activity:"Creative Work / Learning",icon:"🎨",duration:90,cat:"mind"},
    {time:"16:00",activity:"Skills Practice",icon:"🎯",duration:60,cat:"mind"},
    {time:"17:00",activity:"Evening Walk / Light Cardio",icon:"🚶",duration:30,cat:"power"},
    {time:"17:30",activity:"Social / Family Time",icon:"💛",duration:90,cat:"heart"},
    {time:"19:00",activity:"Dinner",icon:"🍽️",duration:45,cat:"power"},
    {time:"20:00",activity:"Journal + Reflect",icon:"📝",duration:30,cat:"heart"},
    {time:"20:30",activity:"Reading / Growth",icon:"📖",duration:45,cat:"mind"},
    {time:"21:15",activity:"Meditate + Gratitude",icon:"🧘",duration:15,cat:"spirit"},
    {time:"21:30",activity:"Wind Down + Sleep",icon:"😴",duration:30,cat:"spirit"},
  ]},
  balanced: {name:"Balanced Day",icon:"⚖️",blocks:[
    {time:"06:30",activity:"Wake up + Morning Routine",icon:"🌅",duration:30,cat:"spirit"},
    {time:"07:00",activity:"Light Exercise / Yoga",icon:"🧘",duration:30,cat:"power"},
    {time:"07:30",activity:"Breakfast",icon:"🍳",duration:30,cat:"power"},
    {time:"08:00",activity:"Work / Study",icon:"💼",duration:180,cat:"mind"},
    {time:"11:00",activity:"Break + Snack",icon:"☕",duration:15,cat:"power"},
    {time:"11:15",activity:"Work / Study",icon:"💻",duration:105,cat:"mind"},
    {time:"13:00",activity:"Lunch",icon:"🍽️",duration:60,cat:"power"},
    {time:"14:00",activity:"Afternoon Work",icon:"📊",duration:120,cat:"mind"},
    {time:"16:00",activity:"Training Session",icon:"⚔️",duration:60,cat:"power"},
    {time:"17:00",activity:"Free Time / Hobbies",icon:"🎮",duration:60,cat:"heart"},
    {time:"18:00",activity:"Dinner Prep + Eat",icon:"🍽️",duration:60,cat:"power"},
    {time:"19:00",activity:"Social / Family",icon:"💛",duration:90,cat:"heart"},
    {time:"20:30",activity:"Reading + Journal",icon:"📝",duration:45,cat:"mind"},
    {time:"21:15",activity:"Meditate + Sleep Prep",icon:"🧘",duration:30,cat:"spirit"},
  ]},
  student: {name:"Student Mode",icon:"📚",blocks:[
    {time:"06:00",activity:"Wake up + Quick Workout",icon:"💪",duration:45,cat:"power"},
    {time:"06:45",activity:"Shower + Breakfast",icon:"🍳",duration:45,cat:"power"},
    {time:"07:30",activity:"Study / Classes",icon:"📚",duration:180,cat:"mind"},
    {time:"10:30",activity:"Break",icon:"☕",duration:15,cat:"spirit"},
    {time:"10:45",activity:"Study Block 2",icon:"📖",duration:75,cat:"mind"},
    {time:"12:00",activity:"Lunch + Rest",icon:"🍽️",duration:60,cat:"power"},
    {time:"13:00",activity:"Study / Classes",icon:"💻",duration:120,cat:"mind"},
    {time:"15:00",activity:"Break + Snack",icon:"🍎",duration:15,cat:"power"},
    {time:"15:15",activity:"Focus Study (hardest subject)",icon:"🧠",duration:90,cat:"mind"},
    {time:"16:45",activity:"Training / Sports",icon:"⚔️",duration:60,cat:"power"},
    {time:"17:45",activity:"Free Time",icon:"🎮",duration:75,cat:"heart"},
    {time:"19:00",activity:"Dinner",icon:"🍽️",duration:45,cat:"power"},
    {time:"19:45",activity:"Light Review + Revision",icon:"📝",duration:60,cat:"mind"},
    {time:"20:45",activity:"Social / Relax",icon:"💛",duration:45,cat:"heart"},
    {time:"21:30",activity:"Journal + Sleep",icon:"😴",duration:30,cat:"spirit"},
  ]},
};

const CAT_COLORS = {power:"#ef4444",mind:"#06b6d4",heart:"#f59e0b",spirit:"#8b5cf6",fortune:"#10b981"};

export default function RoutinePage({profile,routineData,setRoutineData}){
  const d=today();
  const [selTemplate,setSelTemplate]=useState(null);
  const [showTemplates,setShowTemplates]=useState(true);

  const routine=routineData||{blocks:[],template:null};
  const blocks=routine.blocks||[];

  const setRoutine=(blocks,template)=>{
    setRoutineData({blocks,template,date:d});
  };

  const applyTemplate=(key)=>{
    const t=TEMPLATES[key];
    setRoutine(t.blocks,key);
    setSelTemplate(key);
    setShowTemplates(false);
  };

  const toggleDone=(idx)=>{
    const newBlocks=[...blocks];
    newBlocks[idx]={...newBlocks[idx],done:!newBlocks[idx].done};
    setRoutine(newBlocks,routine.template);
  };

  const addBlock=(time,activity,cat)=>{
    const newBlocks=[...blocks,{time,activity,icon:"⭐",duration:30,cat:cat||"mind",done:false}].sort((a,b)=>a.time.localeCompare(b.time));
    setRoutine(newBlocks,routine.template);
  };

  const removeBlock=(idx)=>{
    const newBlocks=blocks.filter((_,i)=>i!==idx);
    setRoutine(newBlocks,routine.template);
  };

  const [addTime,setAddTime]=useState("08:00");
  const [addName,setAddName]=useState("");
  const [addCat,setAddCat]=useState("mind");
  const [showAddBlock,setShowAddBlock]=useState(false);

  const doneCount=blocks.filter(b=>b.done).length;
  const totalMin=blocks.reduce((s,b)=>s+(b.duration||30),0);
  const progress=blocks.length>0?Math.round((doneCount/blocks.length)*100):0;

  // Group by time period
  const now=new Date().getHours();
  const currentBlock=blocks.findIndex(b=>{const h=parseInt(b.time);return h>=now&&!b.done});

  return(<div>
    {/* Progress */}
    {blocks.length>0&&<div className="gs" style={{marginBottom:16,textAlign:"center"}}>
      <div style={{fontSize:11,color:"#6b7280",fontFamily:"Rajdhani,sans-serif",letterSpacing:2}}>TODAY'S ROUTINE</div>
      <div style={{fontSize:28,fontWeight:900,color:"#f3f4f6",fontFamily:"Rajdhani,sans-serif"}}>{doneCount}/{blocks.length} Complete</div>
      <div style={{height:8,background:"rgba(255,255,255,.04)",borderRadius:4,overflow:"hidden",marginTop:10}}><div style={{height:"100%",width:`${progress}%`,background:progress>=100?"#22c55e":"linear-gradient(90deg,#10b981,#06b6d4)",borderRadius:4,transition:"width .5s"}}/></div>
      <div style={{fontSize:12,color:"#6b7280",marginTop:6}}>{Math.floor(totalMin/60)}h {totalMin%60}m planned</div>
    </div>}

    {/* Templates */}
    {(blocks.length===0||showTemplates)&&<div className="gs" style={{marginBottom:16}}>
      <div className="sl">Choose a Routine Template</div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {Object.entries(TEMPLATES).map(([key,t])=>(
          <div key={key} onClick={()=>applyTemplate(key)} className="gc" style={{padding:14,cursor:"pointer"}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <span style={{fontSize:28}}>{t.icon}</span>
              <div><div style={{fontSize:15,fontWeight:600,color:"#e5e7eb"}}>{t.name}</div><div style={{fontSize:12,color:"#6b7280"}}>{t.blocks.length} activities · {Math.floor(t.blocks.reduce((s,b)=>s+(b.duration||30),0)/60)}h planned</div></div>
            </div>
          </div>
        ))}
      </div>
    </div>}

    {/* Timeline */}
    {blocks.length>0&&<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div className="sl" style={{margin:0}}>Timeline</div>
        <div style={{display:"flex",gap:8}}>
          <span onClick={()=>setShowTemplates(!showTemplates)} style={{fontSize:11,color:"#6b7280",cursor:"pointer"}}>Templates</span>
          <span onClick={()=>setShowAddBlock(!showAddBlock)} style={{fontSize:11,color:"#10b981",cursor:"pointer"}}>+ Add</span>
        </div>
      </div>

      {showAddBlock&&<div className="gs fade-in" style={{marginBottom:12,border:"1px solid rgba(16,185,129,.15)"}}>
        <div style={{display:"flex",gap:8,marginBottom:8}}>
          <input className="inp" type="time" value={addTime} onChange={e=>setAddTime(e.target.value)} style={{width:120}}/>
          <input className="inp" placeholder="Activity name" value={addName} onChange={e=>setAddName(e.target.value)} style={{flex:1}}/>
        </div>
        <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>{Object.entries(CAT_COLORS).map(([k,c])=><span key={k} className={`chip ${addCat===k?"chip-a":"chip-i"}`} onClick={()=>setAddCat(k)} style={{textTransform:"capitalize"}}>{k}</span>)}</div>
        <button className="bp" onClick={()=>{if(addName.trim()){addBlock(addTime,addName.trim(),addCat);setAddName("");setShowAddBlock(false)}}} style={{width:"100%",padding:10}}>Add to Routine</button>
      </div>}

      {blocks.map((b,i)=>{
        const isCurrent=i===currentBlock;
        const isPast=parseInt(b.time)<now;
        return(<div key={i} style={{display:"flex",gap:12,marginBottom:4,position:"relative"}}>
          {/* Timeline line */}
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:20}}>
            <div style={{width:10,height:10,borderRadius:"50%",flexShrink:0,background:b.done?CAT_COLORS[b.cat]||"#10b981":isCurrent?"#10b981":"rgba(255,255,255,.06)",border:isCurrent&&!b.done?`2px solid #10b981`:"none",transition:"all .3s"}}/>
            {i<blocks.length-1&&<div style={{width:2,flex:1,background:"rgba(255,255,255,.04)"}}/>}
          </div>
          {/* Block content */}
          <div onClick={()=>toggleDone(i)} style={{flex:1,padding:"10px 14px",borderRadius:10,marginBottom:4,cursor:"pointer",background:b.done?`${CAT_COLORS[b.cat]||"#10b981"}06`:isCurrent?"rgba(16,185,129,.04)":"rgba(255,255,255,.02)",border:isCurrent&&!b.done?"1px solid rgba(16,185,129,.2)":"1px solid rgba(255,255,255,.04)",opacity:b.done?.6:1,transition:"all .2s"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:16}}>{b.icon}</span>
                <div>
                  <div style={{fontSize:14,fontWeight:500,color:b.done?"#6b7280":"#e5e7eb",textDecoration:b.done?"line-through":"none"}}>{b.activity}</div>
                  <div style={{fontSize:11,color:"#4b5563"}}>{b.time} · {b.duration}min</div>
                </div>
              </div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <span style={{width:6,height:6,borderRadius:3,background:CAT_COLORS[b.cat]||"#6b7280"}}/>
                <span onClick={e=>{e.stopPropagation();removeBlock(i)}} style={{color:"#4b5563",fontSize:14,cursor:"pointer"}}>×</span>
              </div>
            </div>
          </div>
        </div>);
      })}
    </div>}
  </div>);
}
