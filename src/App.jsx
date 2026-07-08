import { useState, useEffect, useCallback } from 'react';
import './styles.css';
import { DEFAULT_HABITS, navItems, REQUIRED_DAILY, DAILY_PENALTY, XP } from './data';
import { getLevel, getRank, getStreakMult, today } from './utils';
import store from './store';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import TrainingPage from './components/TrainingPage';
import Nutrition from './components/Nutrition';
import DailyQuestPage from './components/DailyQuestPage';
import MissionsPage from './components/MissionsPage';
import FocusTimer from './components/FocusTimer';
import Wellness from './components/Wellness';
import FinancePage from './components/FinancePage';
import GrowthPage from './components/GrowthPage';
import AIChat from './components/AIChat';
import ProfilePage from './components/ProfilePage';
import XPToast from './components/XPToast';
import LevelUpOverlay from './components/LevelUpOverlay';
import HeaderXPBar from './components/HeaderXPBar';

// ═══════════════ MAIN APP ═══════════════
export default function App(){
  const [user,setUser]=useState(null);const [loading,setLoading]=useState(true);
  const [page,setPage]=useState("dashboard");const [sideOpen,setSideOpen]=useState(false);
  const [foodLog,setFoodLog]=useState({});const [habits,setHabits]=useState(DEFAULT_HABITS);
  const [habitLog,setHabitLog]=useState({});const [tasks,setTasks]=useState([]);
  const [journal,setJournal]=useState({});const [finances,setFinances]=useState([]);
  const [profile,setProfile]=useState({});const [chatHistory,setChatHistory]=useState([]);
  const [totalXP,setTotalXP]=useState(0);const [xpEvents,setXpEvents]=useState([]);
  const [levelUp,setLevelUp]=useState(null);const [isMobile,setIsMobile]=useState(false);
  const [workoutLog,setWorkoutLog]=useState({});const [streak,setStreak]=useState(0);
  const [lastCheck,setLastCheck]=useState("");const [pillarProg,setPillarProg]=useState({});
  const [activityLog,setActivityLog]=useState([]);
  const logActivity=(type,detail)=>{
    const entry={id:Date.now(),type,detail,date:today(),time:new Date().toLocaleTimeString(),timestamp:Date.now()};
    setActivityLog(p=>[entry,...p].slice(0,200));
  };

  useEffect(()=>{const ck=()=>setIsMobile(window.innerWidth<768);ck();window.addEventListener("resize",ck);return()=>window.removeEventListener("resize",ck)},[]);
  useEffect(()=>{(async()=>{const u=await store.get("ignite-user");if(u){setUser(u);await loadUD(u.username)}setLoading(false)})()},[]);

  const loadUD=async(un)=>{const d=await store.get(`ignite-data-${un}`);if(d){d.foodLog&&setFoodLog(d.foodLog);d.habits&&setHabits(d.habits);d.habitLog&&setHabitLog(d.habitLog);d.tasks&&setTasks(d.tasks);d.journal&&setJournal(d.journal);d.finances&&setFinances(d.finances);d.profile&&setProfile(d.profile);d.chatHistory&&setChatHistory(d.chatHistory);d.workoutLog&&setWorkoutLog(d.workoutLog);d.pillarProg&&setPillarProg(d.pillarProg);d.activityLog&&setActivityLog(d.activityLog);if(d.totalXP!==undefined)setTotalXP(d.totalXP);if(d.streak!==undefined)setStreak(d.streak);if(d.lastCheck)setLastCheck(d.lastCheck)}};

  const saveData=useCallback(async()=>{if(!user)return;await store.set(`ignite-data-${user.username}`,{foodLog,habits,habitLog,tasks,journal,finances,profile,chatHistory,totalXP,workoutLog,streak,lastCheck,pillarProg,activityLog})},[user,foodLog,habits,habitLog,tasks,journal,finances,profile,chatHistory,totalXP,workoutLog,streak,lastCheck,pillarProg,activityLog]);
  useEffect(()=>{if(user)saveData()},[saveData]);

  // STREAK & PENALTY CHECK
  useEffect(()=>{
    if(!user)return;const d=today();if(lastCheck===d)return;
    if(lastCheck&&lastCheck!==d){
      const ck=new Date(lastCheck);const td=new Date(d);let missed=0;const dt=new Date(ck);dt.setDate(dt.getDate()+1);
      while(dt<td){const ds=dt.toISOString().split("T")[0];if((habitLog[ds]||[]).length<REQUIRED_DAILY)missed++;dt.setDate(dt.getDate()+1)}
      if(missed>0){const pen=missed*DAILY_PENALTY;setTotalXP(p=>Math.max(0,p-pen));const id=Date.now();setXpEvents(p=>[...p,{id,amount:-pen,reason:`${missed} day${missed>1?"s":""} missed!`}]);setTimeout(()=>setXpEvents(p=>p.filter(e=>e.id!==id)),2500)}
    }
    let s=0;const dt2=new Date();dt2.setDate(dt2.getDate()-1);
    for(let i=0;i<365;i++){const ds=dt2.toISOString().split("T")[0];if((habitLog[ds]||[]).length>=REQUIRED_DAILY){s++;dt2.setDate(dt2.getDate()-1)}else break}
    setStreak(s);setLastCheck(d);
  },[user,habitLog,lastCheck]);

  const addXP=useCallback((amount,reason)=>{
    const mult=getStreakMult(streak);const actual=Math.floor(amount*mult);
    setTotalXP(prev=>{const oldLv=getLevel(prev);const nxp=prev+actual;const nLv=getLevel(nxp);
      if(nLv>oldLv)setTimeout(()=>setLevelUp({level:nLv,rank:getRank(nLv)}),300);return nxp});
    const id=Date.now()+Math.random();
    setXpEvents(p=>[...p,{id,amount:actual,reason:reason+(mult>1?` (×${mult})`:"")}]);
    setTimeout(()=>setXpEvents(p=>p.filter(e=>e.id!==id)),1600);
    logActivity("xp",`+${actual} XP: ${reason}`);
  },[streak]);

  const handleLogin=async(email,pw)=>{
    if(!email||!pw)return"Enter email and password";
    const users=(await store.get("ignite-users"))||{};
    if(!users[email])return"No account found with this email. Please sign up first.";
    if(users[email].password!==pw)return"Wrong password. Try again.";
    const u={username:email,name:users[email].name,email};
    setUser(u);await store.set("ignite-user",u);await loadUD(email);
    return null;
  };
  const handleSignup=async(email,pw,name)=>{
    if(!email||!pw||!name)return"Fill in all fields";
    if(!email.includes("@"))return"Enter a valid email address";
    if(pw.length<4)return"Password needs 4+ characters";
    const users=(await store.get("ignite-users"))||{};
    if(users[email])return"An account with this email already exists. Sign in instead.";
    users[email]={password:pw,name,created:today()};
    await store.set("ignite-users",users);
    const u={username:email,name,email};
    setUser(u);await store.set("ignite-user",u);
    setProfile({name,email,joined:today()});
    logActivity("account","Account created");
    return null;
  };
  const logout=async()=>{await store.set("ignite-user",null);setUser(null);setFoodLog({});setHabits(DEFAULT_HABITS);setHabitLog({});setTasks([]);setJournal({});setFinances([]);setProfile({});setChatHistory([]);setTotalXP(0);setWorkoutLog({});setStreak(0);setPillarProg({});setActivityLog([])};
  const handleAI=(a)=>{if(!a)return;try{const x=typeof a==="string"?JSON.parse(a):a;if(x.type==="add_task")setTasks(p=>[...p,{id:Date.now(),text:x.text,done:false,priority:x.priority||"medium",created:today()}]);if(x.type==="add_habit")setHabits(p=>[...p,{id:`h${Date.now()}`,name:x.name,icon:x.icon||"⭐",pillar:x.pillar||"power"}]);if(x.type==="navigate")setPage(x.page)}catch{}};

  if(loading)return(<><div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#060a0c"}}><div style={{textAlign:"center"}}><div style={{fontSize:44,marginBottom:12,animation:"float 2s ease-in-out infinite",filter:"drop-shadow(0 0 15px rgba(239,68,68,.5))"}}>🔥</div><div style={{color:"#ef4444",fontSize:22,fontWeight:900,letterSpacing:6,fontFamily:"Rajdhani,sans-serif"}}>IGNITE</div></div></div></>);
  if(!user)return(<><AuthPage onLogin={handleLogin} onSignup={handleSignup}/></>);

  const appState={foodLog,habits,habitLog,tasks,journal,finances,profile,user};
  const pages={
    dashboard:<Dashboard appState={appState} setPage={setPage} totalXP={totalXP} streak={streak} workoutLog={workoutLog}/>,
    training:<TrainingPage totalXP={totalXP} addXP={addXP} workoutLog={workoutLog} setWorkoutLog={setWorkoutLog} profile={profile}/>,
    nutrition:<Nutrition foodLog={foodLog} setFoodLog={setFoodLog} addXP={addXP}/>,
    dailyquest:<DailyQuestPage habits={habits} setHabits={setHabits} habitLog={habitLog} setHabitLog={setHabitLog} addXP={addXP}/>,
    missions:<MissionsPage tasks={tasks} setTasks={setTasks} addXP={addXP}/>,
    focus:<FocusTimer addXP={addXP}/>,
    wellness:<Wellness journal={journal} setJournal={setJournal} addXP={addXP}/>,
    finance:<FinancePage finances={finances} setFinances={setFinances} addXP={addXP}/>,
    growth:<GrowthPage pillarProg={pillarProg} setPillarProg={setPillarProg}/>,
    chat:<AIChat appState={appState} onAction={handleAI} chatHistory={chatHistory} setChatHistory={setChatHistory} totalXP={totalXP} streak={streak} workoutLog={workoutLog}/>,
    profile:<ProfilePage profile={profile} setProfile={setProfile} user={user} onLogout={logout} totalXP={totalXP} streak={streak} workoutLog={workoutLog} activityLog={activityLog}/>
  };

  return(<>
    <XPToast xpEvents={xpEvents}/>
    {levelUp&&<LevelUpOverlay level={levelUp.level} rank={levelUp.rank} onClose={()=>setLevelUp(null)}/>}
    <div style={{display:"flex",height:"100vh",background:"#060a0c",overflow:"hidden",position:"relative"}}>
      <div style={{position:"fixed",top:"-20%",right:"-10%",width:600,height:600,borderRadius:"50%",background:"radial-gradient(circle,rgba(16,185,129,.025),transparent 70%)",pointerEvents:"none",zIndex:0}}/>
      {sideOpen&&<div onClick={()=>setSideOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:45,backdropFilter:"blur(4px)"}}/>}
      <nav style={{width:sideOpen?240:72,minWidth:sideOpen?240:72,background:"linear-gradient(180deg,rgba(6,10,12,.99),rgba(4,8,10,.99))",borderRight:"1px solid rgba(16,185,129,.06)",display:"flex",flexDirection:"column",transition:"all .3s",zIndex:50,position:isMobile?"fixed":"relative",height:"100%",left:isMobile&&!sideOpen?-72:0}}>
        <div onClick={()=>setSideOpen(!sideOpen)} style={{padding:"20px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,borderBottom:"1px solid rgba(255,255,255,.04)"}}><div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#10b981,#06b6d4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:900,color:"#fff",flexShrink:0,fontFamily:"Rajdhani,sans-serif"}}>I</div>{sideOpen&&<span style={{fontSize:18,fontWeight:800,fontFamily:"Rajdhani,sans-serif",background:"linear-gradient(135deg,#10b981,#06b6d4,#22d3ee)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:4}}>IGNITE</span>}</div>
        <div style={{flex:1,overflowY:"auto",padding:"12px 0"}}>{navItems.map(n=><div key={n.key} className={`ni ${page===n.key?"act":""}`} onClick={()=>{setPage(n.key);setSideOpen(false)}}><span style={{fontSize:18,width:24,textAlign:"center",flexShrink:0}}>{n.icon}</span>{sideOpen&&<span>{n.label}</span>}</div>)}</div>
        <div className="ni" onClick={logout} style={{margin:"8px 8px 16px",color:"#ef4444"}}><span style={{fontSize:18,width:24,textAlign:"center"}}>⏻</span>{sideOpen&&<span>Log Out</span>}</div>
      </nav>
      <main style={{flex:1,overflow:"auto",position:"relative",zIndex:1}}>
        <header style={{padding:"12px 24px",display:"flex",justifyContent:"space-between",alignItems:"center",background:"rgba(6,10,12,.92)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(16,185,129,.05)",position:"sticky",top:0,zIndex:30,gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
            {isMobile&&<span onClick={()=>setSideOpen(true)} style={{cursor:"pointer",fontSize:22,color:"#6b7280"}}>☰</span>}
            <h2 style={{fontSize:16,fontWeight:700,color:"#f3f4f6",fontFamily:"Rajdhani,sans-serif",letterSpacing:1}}>{navItems.find(n=>n.key===page)?.label}</h2>
          </div>
          <HeaderXPBar totalXP={totalXP} streak={streak}/>
          <div onClick={()=>setPage("profile")} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",padding:"4px 10px 4px 14px",borderRadius:100,background:"rgba(16,185,129,.04)",border:"1px solid rgba(16,185,129,.07)",flexShrink:0}}>
            <span className="do" style={{fontSize:12,color:"#34d399"}}>{user.name}</span>
            <div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,#10b981,#06b6d4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:"#fff"}}>{user.name?.[0]?.toUpperCase()||"U"}</div>
          </div>
        </header>
        <div className="fade-in" key={page} style={{padding:24,maxWidth:1120,margin:"0 auto"}}>{pages[page]}</div>
      </main>
    </div></>);
}
