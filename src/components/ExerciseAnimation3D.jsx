import { useState } from 'react';

// ══════════════════════════════════════
// Exercise Animation — YouTube Tutorials
// 90+ exercises with hand-picked videos
// Tap thumbnail to play inline
// ══════════════════════════════════════

const VIDEO_MAP = {
  // ── Push variations ──
  "push-ups": "_l3ySVKYVJ8", "standard push-ups": "_l3ySVKYVJ8", "push ups": "_l3ySVKYVJ8",
  "diamond push-ups": "J0DnG1_S92I", "decline push-ups": "SKPab2YC8BE",
  "pike push-ups": "sposDXWEB0A", "incline push-ups": "cfns5VDVVvk",
  "archer push-ups": "yvCNFRjMDKE", "wide push-ups": "pfnVMnfXGkQ",
  "clap push-ups": "EYwWCgm6FVg",
  // ── Squats ──
  "squats": "YaXPRqUwItQ", "bodyweight squats": "YaXPRqUwItQ",
  "jump squats": "A-cFYGvaXio", "sumo squats": "3MFxyCAcWKo",
  "goblet squats": "MeIiIdhvXT4", "bulgarian split squats": "2C-uNgKwPLE",
  "pistol squats": "qDcniqddTeE", "wall sit": "y-wV4Lz6wJk",
  // ── Lower body ──
  "lunges": "QOVaHwm-Q6U", "walking lunges": "L8fvypPH3fA",
  "reverse lunges": "xrPteyQLGAo", "glute bridge": "8bbE64NuDTU",
  "hip thrusts": "SEdqd1n0icg", "calf raises": "gwLzBJYoWlI",
  "step-ups": "dQqApCGd5Ag", "leg press": "IZxyjW7MPJQ",
  "romanian deadlift": "JCXUYuzwNrM", "hamstring curls": "1Tq3QdYUuHs",
  // ── Core ──
  "plank": "ASdvN_XEl_c", "plank hold": "ASdvN_XEl_c",
  "side plank": "K2VljzCC16g", "crunches": "Xyd_fa5zoEU",
  "bicycle crunches": "9FGilxCbdz8", "leg raises": "JB2oyawG9KI",
  "mountain climbers": "nmwgirgXLYM", "russian twists": "wkD8rjkodUI",
  "superman": "z6PJMT2y8GQ", "flutter kicks": "ANVdMDaYRts",
  "hanging knee raises": "Pr1ieGZ5atk", "v-ups": "iP2fjvG0g3w",
  "sit-ups": "1fbU_MkV7NE", "dead bug": "4XLEnwUr1d8",
  "dragon flags": "moyFIvRrS0s", "l-sit": "IUZJoSP66HI",
  // ── Upper body ──
  "tricep dips": "0326dy_-CzM", "pull-ups": "eGo4IYlbE5g",
  "chin-ups": "brhRXlOhsAM", "bench press": "rT7DgCr-3pg",
  "dumbbell press": "VmB1G1K7v94", "overhead press": "_RlRDWO2jfg",
  "shoulder press": "qEwKCR5JCog", "lat pulldown": "CAwf7n6Luuc",
  "barbell row": "FWJR5Ve8bnQ", "dumbbell row": "pYcpY20QaE8",
  "dumbbell curl": "ykJmrZ5v0Oo", "hammer curl": "TwD-YGVP4Bk",
  "tricep extension": "_gsUck-7M74", "chest fly": "eozdVDA78K0",
  "lateral raise": "3VcKaXpzqRo", "front raise": "gzDM5uaKx0E",
  "face pull": "rep-qVOkqgk", "shrug": "cJRVVxmytaM",
  // ── Full body ──
  "burpees": "dZgVxmf6jkA", "deadlift": "op9kVnSso6Q",
  "jumping jacks": "CWpmIW6l-YA", "high knees": "D0e3TO_OwTY",
  "tuck jumps": "JYMzFBEg1eA", "box jumps": "52r_Ul5k03g",
  "bear crawl": "pL7sHHZOY88", "inchworm": "VSp0z4eDkMo",
  // ── Warm-up / Stretches ──
  "arm circles": "y5CG86hpMvo", "leg swings": "LT7OaBHLULo",
  "hip circles": "QxGPnrUqx8Q", "quad stretch": "YO6JBLQlbZ0",
  "child's pose": "2MJGg-dUKh0", "downward dog": "j97SSGsnCAQ",
  "standing forward fold": "g7Uhp5tphAs", "cobra stretch": "JDcdhTuycOI",
  "cat-cow": "kqnua4rHVVA", "pigeon pose": "UWIYsL5ewug",
  "deep breathing": "tybOi4hjZFQ", "neck rolls": "wKOoWNrXELY",
  "sprint in place": "D0e3TO_OwTY",
  // ── Boxing ──
  "jab": "hMh1lyeNsPY", "cross": "hMh1lyeNsPY",
  "hook": "QHxnIlMnGIQ", "uppercut": "LCrMCmJkvxE",
  "jab-cross combo": "hMh1lyeNsPY", "shadow boxing": "WR9dCSGORqk",
  "front kick": "E1YGPGEQLHE", "roundhouse kick": "e0A4kV37qLA",
  "knee strikes": "xB5e9xHxtzM", "elbow strikes": "KKsVORj67qk",
  "slip and counter": "Y0rGMIkhDBU", "4-punch combo": "z8Cvel_BXNM",
  "defensive footwork": "XPjDsBVjHxM",
  // ── MMA ──
  "spinning back fist": "K7JXhedWo_c", "tornado kick": "VYK3KB6UEfI",
  "flying knee": "u4RNQvwpJEE", "axe kick": "Cv3hSRKLO0g",
  // ── Yoga ──
  "warrior i": "k4qaVoAg4qU", "warrior ii": "QVkqpODHpVo",
  "tree pose": "Fr5kiIygm0c", "bridge pose": "8bbE64NuDTU",
  "downward facing dog": "j97SSGsnCAQ",
  // ── HIIT ──
  "skaters": "d1J3NLNWAIM", "level change drill": "XPjDsBVjHxM",
};

function getVideoId(name) {
  const l = name.toLowerCase().trim();
  if (VIDEO_MAP[l]) return VIDEO_MAP[l];
  for (const [k, id] of Object.entries(VIDEO_MAP)) {
    if (l.includes(k) || k.includes(l)) return id;
  }
  const first = l.split(' ')[0];
  if (first.length > 3) {
    for (const [k, id] of Object.entries(VIDEO_MAP)) {
      if (k.includes(first)) return id;
    }
  }
  return null;
}

// CSS fallback
const CSS = `
@keyframes exPush{0%,100%{transform:translateY(0)}50%{transform:translateY(12px) rotateX(5deg)}}
@keyframes exSquat{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(14px) scaleY(.86)}}
@keyframes exPlank{0%,100%{opacity:1}50%{opacity:.75}}
@keyframes exBurpee{0%{transform:translateY(0)}25%{transform:translateY(16px) scaleY(.72)}75%{transform:translateY(-10px)}100%{transform:translateY(0)}}
@keyframes exPunch{0%,100%{transform:translateX(0)}40%{transform:translateX(18px) scale(1.04)}}
@keyframes exKick{0%,100%{transform:rotateZ(0)}40%{transform:rotateZ(14deg) translateY(-8px)}}
@keyframes exGeneric{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}
@keyframes glow{0%,100%{box-shadow:0 0 10px rgba(16,185,129,.05)}50%{box-shadow:0 0 18px rgba(16,185,129,.1)}}
`;
const AK = { "push": "exPush", "press": "exPush", "dip": "exPush", "fly": "exPush", "squat": "exSquat", "lunge": "exSquat", "split": "exSquat", "wall": "exSquat", "plank": "exPlank", "hold": "exPlank", "stretch": "exPlank", "pose": "exPlank", "dog": "exPlank", "cobra": "exPlank", "child": "exPlank", "cat": "exPlank", "burpee": "exBurpee", "climber": "exBurpee", "mountain": "exBurpee", "jab": "exPunch", "cross": "exPunch", "punch": "exPunch", "uppercut": "exPunch", "shadow": "exPunch", "hook": "exPunch", "elbow": "exPunch", "kick": "exKick", "knee": "exKick", "roundhouse": "exKick", "jump": "exSquat", "jack": "exSquat" };
function getAn(n) { const l = n.toLowerCase(); for (const [k, v] of Object.entries(AK)) { if (l.includes(k)) return v; } return "exGeneric"; }

export default function ExerciseAnimation3D({ exerciseName, color = "#10b981", size = 180 }) {
  const [playing, setPlaying] = useState(false);
  const [imgError, setImgError] = useState(false);
  const videoId = getVideoId(exerciseName);
  const an = getAn(exerciseName);
  const isSmall = size <= 80;

  // ── Video playing ──
  if (playing && videoId) {
    return (
      <div style={{ width: "100%", height: Math.max(size, 240), borderRadius: 16, overflow: "hidden", position: "relative", background: "#000" }}>
        <iframe src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
          title={exerciseName} width="100%" height="100%" frameBorder="0"
          allow="autoplay; encrypted-media" allowFullScreen style={{ borderRadius: 16 }} />
        <div onClick={(e) => { e.stopPropagation(); setPlaying(false); }}
          style={{ position: "absolute", top: 10, right: 10, width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, color: "#fff", zIndex: 5, backdropFilter: "blur(4px)" }}>✕</div>
      </div>
    );
  }

  // ── Container ──
  return (
    <div style={{ width: "100%", height: size, borderRadius: isSmall ? 10 : 16, background: "rgba(255,255,255,.015)", border: "1px solid rgba(255,255,255,.06)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", cursor: videoId && !isSmall ? "pointer" : "default" }}
      onClick={() => videoId && !isSmall && setPlaying(true)}>
      <style>{CSS}</style>

      {/* ── YouTube Thumbnail (large) ── */}
      {videoId && !isSmall && !imgError && (
        <>
          <img src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
            alt={exerciseName} onError={() => setImgError(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 16 }} />
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(16,185,129,.9)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(16,185,129,.35)", transition: "transform .2s" }}>
              <span style={{ fontSize: 20, marginLeft: 2, color: "#fff" }}>▶</span>
            </div>
          </div>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px 12px 8px", background: "linear-gradient(transparent, rgba(0,0,0,.75))", borderRadius: "0 0 16px 16px" }}>
            <div style={{ fontSize: 11, color: "#10b981", fontWeight: 600 }}>▶ Tap to watch how to do it</div>
          </div>
        </>
      )}

      {/* ── YouTube Thumbnail (small/mini) ── */}
      {videoId && isSmall && !imgError && (
        <img src={`https://img.youtube.com/vi/${videoId}/default.jpg`}
          alt={exerciseName} onError={() => setImgError(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} />
      )}

      {/* ── CSS Fallback (no video or image error) ── */}
      {(!videoId || imgError) && (
        <>
          <div style={{ position: "absolute", bottom: 16, width: "30%", height: 6, borderRadius: "50%", background: "rgba(0,0,0,.2)", filter: "blur(3px)" }} />
          <div style={{ animation: `${an} ${an === "exPunch" ? ".8s" : "2s"} ease-in-out infinite`, animation2: "glow 4s ease-in-out infinite" }}>
            <svg width={isSmall ? 36 : 80} height={isSmall ? 56 : 125} viewBox="0 0 80 125">
              <defs><linearGradient id={`gx${an}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".85" /><stop offset="100%" stopColor={color} stopOpacity=".45" /></linearGradient></defs>
              <circle cx="40" cy="15" r="10" fill={color} opacity=".8" />
              <circle cx="36" cy="12" r="1.2" fill="#0d1117" /><circle cx="44" cy="12" r="1.2" fill="#0d1117" />
              <rect x="37" y="24" width="6" height="5" rx="2" fill={color} opacity=".6" />
              <path d="M26 30L54 30L52 66L28 66Z" fill={`url(#gx${an})`} opacity=".75" />
              <path d="M26 32L14 48L17 60" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" opacity=".75" />
              <path d="M54 32L66 48L63 60" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" opacity=".75" />
              <path d="M32 66L24 92L21 108" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" opacity=".7" />
              <path d="M48 66L56 92L59 108" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" opacity=".7" />
              <ellipse cx="19" cy="110" rx="5" ry="2" fill={color} opacity=".45" />
              <ellipse cx="61" cy="110" rx="5" ry="2" fill={color} opacity=".45" />
            </svg>
          </div>
          {!isSmall && <div style={{ position: "absolute", bottom: 6, fontSize: 9, color: "#4b5563" }}>{exerciseName}</div>}
        </>
      )}
    </div>
  );
}