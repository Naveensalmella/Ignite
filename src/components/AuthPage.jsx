import { useState, useEffect, useRef } from 'react';

export default function AuthPage({onLogin,onSignup}){
  const [mode,setMode]=useState("login");
  const [email,setEmail]=useState("");
  const [pw,setPw]=useState("");
  const [nm,setNm]=useState("");
  const [err,setErr]=useState("");
  const [success,setSuccess]=useState("");
  const [show,setShow]=useState(false);
  const [busy,setBusy]=useState(false);

  const submit=async()=>{
    setErr("");setSuccess("");
    const e=email.trim().toLowerCase();
    const p=pw;
    const n=nm.trim();
    if(!e||!p){setErr("Enter email and password");return}
    if(mode==="signup"&&!n){setErr("Enter your name");return}
    if(mode==="signup"&&!e.includes("@")){setErr("Enter a valid email address");return}
    if(mode==="signup"&&p.length<4){setErr("Password must be 4+ characters");return}
    setBusy(true);
    const result=mode==="login"?await onLogin(e,p):await onSignup(e,p,n);
    if(result)setErr(result);
    setBusy(false);
  };

  return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#060a0c",padding:20,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:"-20%",right:"-10%",width:600,height:600,borderRadius:"50%",background:"radial-gradient(circle,rgba(16,185,129,.06),transparent 70%)",pointerEvents:"none"}}/>
      <div className="fade-in" style={{maxWidth:420,width:"100%",position:"relative",zIndex:1}}>
        <div style={{textAlign:"center",marginBottom:40}}>
          <div style={{width:72,height:72,borderRadius:14,margin:"0 auto 16px",background:"linear-gradient(135deg,#10b981,#06b6d4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,fontWeight:900,color:"#fff",boxShadow:"0 0 40px rgba(16,185,129,.35)",animation:"emberGlow 3s ease-in-out infinite",fontFamily:"Rajdhani,sans-serif"}}>I</div>
          <h1 style={{fontSize:38,fontWeight:900,fontFamily:"Rajdhani,sans-serif",background:"linear-gradient(135deg,#10b981,#06b6d4,#22d3ee)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:8}}>IGNITE</h1>
          <p style={{color:"#6b7280",fontSize:13,marginTop:6,letterSpacing:1}}>Train your body. Forge your will. Level up.</p>
        </div>

        <div className="gs" style={{padding:28}}>
          <div style={{display:"flex",marginBottom:24,background:"rgba(16,185,129,.03)",borderRadius:10,padding:3}}>
            <div onClick={()=>{setMode("login");setErr("");setSuccess("")}} style={{flex:1,padding:12,textAlign:"center",borderRadius:8,cursor:"pointer",fontSize:14,fontWeight:600,background:mode==="login"?"rgba(16,185,129,.1)":"transparent",color:mode==="login"?"#6ee7b7":"#6b7280"}}>Sign In</div>
            <div onClick={()=>{setMode("signup");setErr("");setSuccess("")}} style={{flex:1,padding:12,textAlign:"center",borderRadius:8,cursor:"pointer",fontSize:14,fontWeight:600,background:mode==="signup"?"rgba(16,185,129,.1)":"transparent",color:mode==="signup"?"#6ee7b7":"#6b7280"}}>Sign Up</div>
          </div>

          {mode==="signup"&&<div style={{marginBottom:12}}>
            <label style={{fontSize:11,color:"#6b7280",display:"block",marginBottom:4,fontWeight:500}}>Full Name</label>
            <input className="inp" placeholder="e.g. Naveen Kumar" value={nm} onChange={e=>setNm(e.target.value)}/>
          </div>}

          <div style={{marginBottom:12}}>
            <label style={{fontSize:11,color:"#6b7280",display:"block",marginBottom:4,fontWeight:500}}>Email Address</label>
            <input className="inp" placeholder="e.g. name@email.com" value={email} onChange={e=>setEmail(e.target.value)} type="email"/>
          </div>

          <div style={{marginBottom:16}}>
            <label style={{fontSize:11,color:"#6b7280",display:"block",marginBottom:4,fontWeight:500}}>Password</label>
            <div style={{position:"relative"}}>
              <input className="inp" placeholder="Enter password" type={show?"text":"password"} value={pw}
                onChange={e=>setPw(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!busy)submit()}}/>
              <span onClick={()=>setShow(!show)} style={{position:"absolute",right:16,top:"50%",transform:"translateY(-50%)",cursor:"pointer",color:"#6b7280",fontSize:13,userSelect:"none"}}>{show?"Hide":"Show"}</span>
            </div>
          </div>

          {err&&<div style={{color:"#fca5a5",fontSize:13,marginBottom:12,padding:"10px 14px",background:"rgba(239,68,68,.1)",borderRadius:8,border:"1px solid rgba(239,68,68,.2)"}}>⚠ {err}</div>}
          {success&&<div style={{color:"#6ee7b7",fontSize:13,marginBottom:12,padding:"10px 14px",background:"rgba(16,185,129,.1)",borderRadius:8,border:"1px solid rgba(16,185,129,.2)"}}>✓ {success}</div>}

          <button onClick={submit} disabled={busy}
            style={{width:"100%",padding:14,fontSize:15,letterSpacing:2,fontWeight:700,fontFamily:"inherit",cursor:busy?"not-allowed":"pointer",opacity:busy?.6:1,background:"linear-gradient(135deg,#10b981,#059669)",color:"#fff",border:"none",borderRadius:10,boxShadow:"0 4px 16px rgba(16,185,129,.25)",transition:"all .25s"}}>
            {busy?"Please wait...":mode==="login"?"SIGN IN →":"CREATE ACCOUNT →"}
          </button>

          {mode==="signup"&&<p style={{fontSize:11,color:"#6b7280",marginTop:12,textAlign:"center"}}>Your email is your login ID · Password 4+ characters</p>}
          {mode==="login"&&<p style={{fontSize:11,color:"#6b7280",marginTop:12,textAlign:"center"}}>Use the email you signed up with</p>}
        </div>
      </div>
    </div>
  );
}
