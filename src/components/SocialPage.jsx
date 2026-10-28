"use client";
import { useState, useEffect, useMemo } from 'react';
import { StaggerContainer, StaggerItem } from './PageTransition';
import { getLevel, getRank, today, toArr, addDays, parseDateKey } from '@/utils';
import { collection, query, where, getDocs, doc, getDoc, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { countWorkoutDays, getDayEntries } from '@/lib/workoutHelpers';

// ── Firestore model ──
// firestore.rules only allow users/{uid} (owner-only) and publicProfiles/{uid} (readable by any
// signed-in user, writable only by its owner). So every piece of social data lives in the user's
// OWN public profile and relationships are derived by querying other public profiles — this page
// never reads another user's private users/{uid} doc and never writes to anyone else's doc.
//   friends: [uid]             people I've added/accepted. Shown as a friend once they list me too
//                              (in their `friends`, or still in their `outgoingRequests` to me).
//   outgoingRequests: [uid]    requests I've sent — the recipient finds them with array-contains.
//   declinedRequests: [uid]    incoming requests I've declined / friends I removed.
//   posts: [...]               my posts (max 20).
//   likes: ["ownerUid:postId"] posts I've liked; like counts are tallied across loaded profiles.
//   groupChallenges: [...]     challenges I created; participants see them via my profile.
//   emailHash                  SHA-256 of the lower-cased email, used for "add friend by email"
//                              without publishing raw email addresses to every signed-in user.
const PUBLIC = "publicProfiles";
const nowMs = () => Date.now();
const asStr = v => (typeof v === "string" ? v : "");
const uidList = v => toArr(v).filter(x => typeof x === "string" && x);

// Day keys are local dates (see today()/addDays in utils)
const shiftDay = (ds, n) => addDays(n, ds);

export async function hashEmail(email) {
    const norm = asStr(email).trim().toLowerCase();
    if (!norm || typeof crypto === "undefined" || !crypto.subtle) return null;
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(norm));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function recentWorkoutsFrom(workoutLog, d) {
    const out = [];
    for (let i = 0; i < 7; i++) {
        const ds = shiftDay(d, -i);
        getDayEntries(workoutLog || {}, ds).forEach(w => {
            if (w && typeof w === "object") out.push({ date: ds, splitName: asStr(w.splitName) || "Training", calBurned: Number(w.calBurned) || 0, duration: Number(w.duration) || 0 });
        });
    }
    return out.slice(0, 14);
}

// Publish this user's public stats so friends can find / rank them.
// Exported so it can also be called after login (users only become searchable once synced).
export async function syncPublicProfile({ user, profile, totalXP = 0, streak = 0, workoutLog = {} }, prev = null) {
    if (!user?.uid) return null;
    const d = today();
    const level = getLevel(totalXP);
    const data = {
        uid: user.uid,
        name: asStr(profile?.name) || asStr(user.name) || "Warrior",
        totalXP: Number(totalXP) || 0,
        streak: Number(streak) || 0,
        workouts: countWorkoutDays(workoutLog || {}),
        level,
        recentWorkouts: recentWorkoutsFrom(workoutLog, d),
        updatedAt: new Date().toISOString(),
    };
    try { const h = await hashEmail(user.email); if (h) data.emailHash = h; } catch { }
    if (prev && Number(prev.level) > 0 && level > Number(prev.level)) data.levelUpDate = d;
    await setDoc(doc(db, PUBLIC, user.uid), data, { merge: true });
    return { ...(prev || {}), ...data };
}

// Load everything the page needs. Pure data fetch — no React state in here.
async function fetchSocial({ user, profile, totalXP, streak, workoutLog }) {
    const uid = user.uid;
    const myRef = doc(db, PUBLIC, uid);
    let snap = await getDoc(myRef);
    let me = snap.exists() ? snap.data() : null;

    // One-time migration of legacy social fields from the user's own users/{uid} doc
    if (!me?.migratedLegacy) {
        try {
            const legacy = await getDoc(doc(db, "users", uid));
            const ld = legacy.exists() ? legacy.data() : {};
            const patch = { migratedLegacy: true };
            const lf = uidList(ld.friends).filter(f => f !== uid);
            if (lf.length) patch.friends = arrayUnion(...lf);
            const lp = toArr(ld.posts).filter(p => p && asStr(p.text));
            if (!toArr(me?.posts).length && lp.length) {
                patch.posts = lp.slice(0, 20).map((p, i) => ({ id: Number(p.id) || nowMs() + i, text: asStr(p.text), date: asStr(p.date), time: asStr(p.time) || asStr(p.date) }));
            }
            await setDoc(myRef, patch, { merge: true });
        } catch (e) { console.warn("Social migration skipped:", e?.code || e); }
    }

    await syncPublicProfile({ user, profile, totalXP, streak, workoutLog }, me);
    snap = await getDoc(myRef);
    me = snap.exists() ? snap.data() : {};

    const [listsMeSnap, reqSnap] = await Promise.all([
        getDocs(query(collection(db, PUBLIC), where("friends", "array-contains", uid))),
        getDocs(query(collection(db, PUBLIC), where("outgoingRequests", "array-contains", uid))),
    ]);
    const listsMe = {}; listsMeSnap.forEach(s => { if (s.id !== uid) listsMe[s.id] = { ...s.data(), uid: s.id }; });
    const requesters = {}; reqSnap.forEach(s => { if (s.id !== uid) requesters[s.id] = { ...s.data(), uid: s.id }; });

    let myFriends = uidList(me.friends);
    let myOut = uidList(me.outgoingRequests);
    const myDeclined = uidList(me.declinedRequests);

    // Requests I sent that the other person accepted (they now list me) → complete the friendship
    const accepted = myOut.filter(f => listsMe[f] && !myFriends.includes(f));
    const resolved = myOut.filter(f => listsMe[f] || myFriends.includes(f));
    if (accepted.length || resolved.length) {
        const patch = {};
        if (accepted.length) patch.friends = arrayUnion(...accepted);
        if (resolved.length) patch.outgoingRequests = arrayRemove(...resolved);
        await setDoc(myRef, patch, { merge: true });
        myFriends = [...new Set([...myFriends, ...accepted])];
        myOut = myOut.filter(f => !resolved.includes(f));
    }

    const friendDocs = myFriends.map(f => listsMe[f] || requesters[f]).filter(Boolean);
    const incoming = Object.values(requesters).filter(r => !myFriends.includes(r.uid) && !myDeclined.includes(r.uid));
    return { me: { ...me, uid, friends: myFriends, outgoingRequests: myOut, declinedRequests: myDeclined }, friendDocs, incoming };
}

export default function SocialPage({ user: rawUser = {}, profile: rawProfile = {}, totalXP = 0, streak = 0, workoutLog = {}, addXP = () => { } }) {
    const user = rawUser || {};
    const profile = rawProfile || {};
    const uid = user.uid;
    const [tab, setTab] = useState("feed");
    const [searchEmail, setSearchEmail] = useState("");
    const [searchResult, setSearchResult] = useState(null);
    const [searching, setSearching] = useState(false);
    const [social, setSocial] = useState({ me: null, friendDocs: [], incoming: [] });
    const [loading, setLoading] = useState(Boolean(uid));
    const [loadError, setLoadError] = useState("");
    const [reloadKey, setReloadKey] = useState(0);
    const [now, setNow] = useState(nowMs);
    const [sentMsg, setSentMsg] = useState("");
    const [postText, setPostText] = useState("");
    const [posting, setPosting] = useState(false);

    const myWorkouts = countWorkoutDays(workoutLog || {});
    const d = today();

    // ── Load all data ──
    useEffect(() => {
        if (!uid) return;
        let cancelled = false;
        fetchSocial({ user, profile, totalXP, streak, workoutLog })
            .then(res => { if (!cancelled) { setSocial(res); setLoadError(""); } })
            .catch(e => {
                console.error("Load friends error:", e);
                if (!cancelled) setLoadError(e?.code === "permission-denied" ? "Social features are unavailable (permission denied)." : "Couldn't load social data. Check your connection.");
            })
            .finally(() => { if (!cancelled) { setLoading(false); setNow(nowMs()); } });
        return () => { cancelled = true; };
        // Only re-fetch on user change or explicit refresh — not on every XP/log change.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uid, reloadKey]);

    const reload = () => { setLoading(true); setReloadKey(k => k + 1); };

    const me = useMemo(() => social.me || {}, [social.me]);
    const friends = social.friendDocs;
    const friendIds = friends.map(f => f.uid);
    const pendingRequests = social.incoming;
    const myRef = uid ? doc(db, PUBLIC, uid) : null;

    // ── Derived view data ──
    const friendProfiles = useMemo(() => friends.map(f => ({
        uid: f.uid,
        name: asStr(f.name) || "Warrior",
        totalXP: Number(f.totalXP) || 0,
        streak: Number(f.streak) || 0,
        workouts: Number(f.workouts) || 0,
    })).sort((a, b) => b.totalXP - a.totalXP), [friends]);

    const allProfiles = useMemo(() => [{ ...me, uid }, ...friends], [me, uid, friends]);
    const likersOf = (ownerUid, postId) => allProfiles.filter(p => toArr(p.likes).includes(`${ownerUid}:${postId}`)).map(p => p.uid);

    const feedItems = useMemo(() => {
        const feed = [];
        const weekAgo = shiftDay(d, -6);
        friends.forEach(f => {
            const name = asStr(f.name) || "Warrior";
            toArr(f.recentWorkouts).forEach(w => {
                if (w && asStr(w.date) >= weekAgo) feed.push({ type: "workout", user: name, uid: f.uid, date: w.date, data: w, time: w.date });
            });
            const updated = asStr(f.updatedAt).slice(0, 10);
            if (Number(f.streak) >= 7 && Number(f.streak) % 7 === 0 && updated >= weekAgo) {
                feed.push({ type: "streak", user: name, uid: f.uid, streak: Number(f.streak), time: asStr(f.updatedAt) || d });
            }
            if (asStr(f.levelUpDate) >= weekAgo && Number(f.level) > 1) {
                feed.push({ type: "level", user: name, uid: f.uid, level: Number(f.level), rank: getRank(Number(f.level)).name, time: f.levelUpDate });
            }
        });
        [{ ...me, uid, name: profile.name || user.name || "You" }, ...friends].forEach(p => {
            toArr(p.posts).forEach(post => {
                if (post && asStr(post.text)) feed.push({ type: "post", user: asStr(p.name) || "Warrior", uid: p.uid, id: post.id, text: post.text, time: asStr(post.time) || asStr(post.date) });
            });
        });
        // Sort feed by date (newest first)
        feed.sort((a, b) => (b.time || "").localeCompare(a.time || ""));
        return feed.slice(0, 30);
    }, [friends, me, uid, d, profile.name, user.name]);

    const challenges = useMemo(() => {
        const list = [];
        const seen = new Set();
        [{ ...me, uid, name: "You" }, ...friends].forEach(p => {
            toArr(p.groupChallenges).forEach(ch => {
                if (!ch || !ch.id) return;
                const key = `${p.uid}:${ch.id}`;
                if (seen.has(key)) return;
                if (p.uid !== uid && !uidList(ch.participants).includes(uid)) return;
                seen.add(key);
                list.push({ ...ch, key, creatorName: p.uid === uid ? "You" : asStr(p.name) || "Friend" });
            });
        });
        return list.sort((a, b) => asStr(b.startDate).localeCompare(asStr(a.startDate)));
    }, [me, uid, friends]);

    // ── Search by email ──
    const handleSearch = async () => {
        const term = searchEmail.trim().toLowerCase();
        if (!term || !uid) return;
        setSearching(true); setSearchResult(null); setSentMsg("");
        try {
            const h = await hashEmail(term);
            if (!h) throw new Error("hash unavailable");
            const snap = await getDocs(query(collection(db, PUBLIC), where("emailHash", "==", h)));
            if (!snap.empty) {
                const foundDoc = snap.docs[0];
                const fd = foundDoc.data();
                if (foundDoc.id === uid) setSearchResult({ error: "That's you! 😄" });
                else if (friendIds.includes(foundDoc.id)) setSearchResult({ error: "Already friends! ✅" });
                else setSearchResult({ uid: foundDoc.id, name: asStr(fd.name) || "Warrior", email: term, totalXP: Number(fd.totalXP) || 0, streak: Number(fd.streak) || 0, theyRequested: uidList(fd.outgoingRequests).includes(uid), theyListMe: uidList(fd.friends).includes(uid) });
            } else setSearchResult({ error: "No user found with that email (they need to open IGNITE's Social page once)." });
        } catch (e) { console.error("Search error:", e); setSearchResult({ error: "Search failed." }); }
        setSearching(false);
    };

    // ── Send request ──
    const sendRequest = async (target) => {
        if (!myRef || !target?.uid) return;
        try {
            if (target.theyRequested || target.theyListMe) {
                // They already asked (or still list us) — just accept
                await setDoc(myRef, { friends: arrayUnion(target.uid), declinedRequests: arrayRemove(target.uid) }, { merge: true });
                setSentMsg("You're now friends! ✅");
                addXP(10, "New friend connected");
            } else if (uidList(me.outgoingRequests).includes(target.uid)) {
                setSentMsg("Request already sent! ⏳");
            } else {
                await setDoc(myRef, { outgoingRequests: arrayUnion(target.uid), declinedRequests: arrayRemove(target.uid) }, { merge: true });
                setSentMsg("Request sent! ✅");
            }
            setSearchResult(null); setSearchEmail("");
            reload();
        } catch (e) { console.error("Send request error:", e); setSentMsg("Failed to send request."); }
    };

    // ── Accept / Decline ──
    const acceptRequest = async (fromUid) => {
        if (!myRef) return;
        try {
            await setDoc(myRef, { friends: arrayUnion(fromUid), declinedRequests: arrayRemove(fromUid) }, { merge: true });
            addXP(10, "New friend connected");
            reload();
        } catch (e) { console.error("Accept error:", e); }
    };

    const declineRequest = async (fromUid) => {
        if (!myRef) return;
        try {
            await setDoc(myRef, { declinedRequests: arrayUnion(fromUid) }, { merge: true });
            reload();
        } catch (e) { console.error("Decline error:", e); }
    };

    const removeFriend = async (fid) => {
        if (!myRef || !window.confirm("Remove this friend?")) return;
        try {
            // Dropping them from my list ends the friendship for both sides (it requires both to list each other)
            await setDoc(myRef, { friends: arrayRemove(fid), outgoingRequests: arrayRemove(fid), declinedRequests: arrayUnion(fid) }, { merge: true });
            reload();
        } catch (e) { console.error("Remove friend error:", e); }
    };

    // ── Post to feed ──
    const createPost = async () => {
        if (!postText.trim() || !myRef || posting) return;
        setPosting(true);
        try {
            const snap = await getDoc(myRef);
            const currentPosts = snap.exists() ? toArr(snap.data().posts) : [];
            const newPost = { id: nowMs(), text: postText.trim().slice(0, 1000), date: d, time: new Date().toISOString() };
            await setDoc(myRef, { posts: [newPost, ...currentPosts].slice(0, 20) }, { merge: true });
            setPostText(""); addXP(5, "Posted update");
            reload();
        } catch (e) { console.error("Post error:", e); }
        setPosting(false);
    };

    // ── Like a post ── (stored in MY profile as "ownerUid:postId")
    const likePost = async (postOwnerUid, postId) => {
        if (!myRef || postId == null) return;
        const key = `${postOwnerUid}:${postId}`;
        const liked = toArr(me.likes).includes(key);
        // Optimistic update
        setSocial(s => ({ ...s, me: { ...(s.me || {}), likes: liked ? toArr(s.me?.likes).filter(k => k !== key) : [...toArr(s.me?.likes), key] } }));
        try {
            await setDoc(myRef, { likes: liked ? arrayRemove(key) : arrayUnion(key) }, { merge: true });
        } catch (e) { console.error("Like error:", e); reload(); }
    };

    // ── Create group challenge ──
    const createChallenge = async (type) => {
        const challengeTemplates = {
            workouts: { title: "Most Workouts This Week", icon: "⚔️", metric: "workouts", duration: 7 },
            xp: { title: "XP Race This Week", icon: "⚡", metric: "xp", duration: 7 },
            streak: { title: "Longest Streak Challenge", icon: "🔥", metric: "streak", duration: 14 },
        };
        const template = challengeTemplates[type];
        if (!template || !myRef) return;
        if (friendIds.length === 0) { setTab("friends"); return; }
        const challenge = { ...template, id: nowMs(), creator: uid, startDate: d, participants: [uid, ...friendIds] };
        try {
            const snap = await getDoc(myRef);
            const mine = snap.exists() ? toArr(snap.data().groupChallenges) : [];
            await setDoc(myRef, { groupChallenges: [challenge, ...mine].slice(0, 5) }, { merge: true });
            addXP(10, "Created group challenge");
            reload();
        } catch (e) { console.error("Create challenge error:", e); }
    };

    const timeAgo = (dateStr) => {
        if (!dateStr) return "";
        // Date-only keys (workouts, legacy posts) are local days — compare by day, not by UTC midnight
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            if (dateStr >= d) return "today";
            if (dateStr === shiftDay(d, -1)) return "yesterday";
            const days = Math.round((parseDateKey(d) - parseDateKey(dateStr)) / 86400000);
            return `${days}d ago`;
        }
        const t = new Date(dateStr).getTime();
        if (!Number.isFinite(t)) return "";
        const diff = Math.max(0, (now - t) / 1000);
        if (diff < 60) return "now";
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    return (
        <div style={{ maxWidth: "100%", overflowX: "hidden" }}>
            {/* Tabs */}
            <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto" }}>
                {[["feed", "📰 Feed"], ["leaderboard", "🏆 Board"], ["friends", `👥 Friends (${friendIds.length})`], ["challenges", "🏅 Challenges"], ["requests", `📩 Requests`, pendingRequests.length]].map(([k, l, badge]) => (
                    <span key={k} className={`chip ${tab === k ? "chip-a" : "chip-i"}`} onClick={() => { setTab(k); if (k === "requests") reload(); }} style={{ flexShrink: 0, fontSize: 12, position: "relative" }}>
                        {l}
                        {badge > 0 && <span style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: "#ef4444", fontSize: 11, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>{badge}</span>}
                    </span>
                ))}
            </div>

            {loadError && (
                <div style={{ fontSize: 12, color: "#ef4444", padding: "8px 12px", borderRadius: 8, background: "rgba(239,68,68,.06)", marginBottom: 12, display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span>{loadError}</span>
                    <span onClick={reload} style={{ cursor: "pointer", color: "#10b981", flexShrink: 0 }}>Retry</span>
                </div>
            )}

            {/* ══ FEED TAB ══ */}
            {tab === "feed" && (
                <StaggerContainer>
                    {/* Post composer */}
                    <StaggerItem>
                        <div className="gs" style={{ marginBottom: 14, padding: 14 }}>
                            <div style={{ display: "flex", gap: 10 }}>
                                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#10b981,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff", flexShrink: 0 }}>{(profile.name || "U")[0]?.toUpperCase()}</div>
                                <div style={{ flex: 1 }}>
                                    <textarea className="inp" rows={2} placeholder="Share your progress, thoughts, or wins..." value={postText} onChange={e => setPostText(e.target.value)} style={{ resize: "none", marginBottom: 8 }} />
                                    <button className="bp" onClick={createPost} disabled={!postText.trim() || posting} style={{ padding: "8px 20px", fontSize: 12 }}>📤 Post</button>
                                </div>
                            </div>
                        </div>
                    </StaggerItem>

                    {/* Feed items */}
                    {feedItems.length === 0 && !loading && !loadError && (
                        <div style={{ textAlign: "center", padding: 30, color: "#6b7280" }}>
                            <div style={{ fontSize: 32, marginBottom: 8 }}>📰</div>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>No feed yet</div>
                            <div style={{ fontSize: 12, marginTop: 4 }}>Add friends to see their workouts and achievements!</div>
                        </div>
                    )}

                    {feedItems.map((item, i) => (
                        <StaggerItem key={`${item.type}-${item.uid}-${item.id ?? item.time}-${i}`}>
                            <div className="gs" style={{ marginBottom: 10, padding: 14 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(16,185,129,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#10b981" }}>{(item.user || "U")[0]?.toUpperCase()}</div>
                                    <div style={{ flex: 1 }}>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: "#f3f4f6" }}>{item.user}</span>
                                        <span style={{ fontSize: 11, color: "#6b7280", marginLeft: 8 }}>{timeAgo(item.time)}</span>
                                    </div>
                                </div>

                                {item.type === "workout" && (
                                    <div>
                                        <div style={{ fontSize: 13, color: "#d1d5db" }}>💪 Completed a workout: <span style={{ color: "#10b981", fontWeight: 600 }}>{item.data?.splitName || "Training"}</span></div>
                                        {item.data?.calBurned > 0 && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>🔥 {item.data.calBurned} cal · {Math.round((item.data.duration || 0) / 60)} min</div>}
                                    </div>
                                )}

                                {item.type === "post" && (() => {
                                    const likers = likersOf(item.uid, item.id);
                                    const liked = likers.includes(uid);
                                    return (
                                        <div>
                                            <div style={{ fontSize: 13, color: "#d1d5db", lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{item.text}</div>
                                            <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                                                <span onClick={() => likePost(item.uid, item.id)} style={{ fontSize: 12, color: liked ? "#ef4444" : "#6b7280", cursor: "pointer" }}>
                                                    {liked ? "❤️" : "🤍"} {likers.length}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {item.type === "streak" && (
                                    <div style={{ fontSize: 13, color: "#f59e0b" }}>🔥 Reached a {item.streak}-day streak!</div>
                                )}

                                {item.type === "level" && (
                                    <div style={{ fontSize: 13, color: "#8b5cf6" }}>⬆️ Leveled up to <span style={{ fontWeight: 700 }}>Level {item.level}</span> — {item.rank}</div>
                                )}
                            </div>
                        </StaggerItem>
                    ))}
                </StaggerContainer>
            )}

            {/* ══ LEADERBOARD TAB ══ */}
            {tab === "leaderboard" && (
                <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                        <span className="sl">🏆 XP Leaderboard</span>
                        <span onClick={reload} style={{ fontSize: 11, color: "#10b981", cursor: "pointer" }}>🔄 Refresh</span>
                    </div>

                    {friendProfiles.length === 0 ? (
                        <div style={{ textAlign: "center", padding: 30, color: "#6b7280" }}>
                            <div style={{ fontSize: 40, marginBottom: 8 }}>👥</div>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>No friends yet</div>
                            <div style={{ fontSize: 12, marginTop: 4 }}>Add friends to see the leaderboard!</div>
                            <button className="bp" onClick={() => setTab("friends")} style={{ marginTop: 12, padding: "10px 24px" }}>+ Add Friends</button>
                        </div>
                    ) : (
                        <div>
                            {/* Add yourself to the list */}
                            {[{ uid: uid || "me", name: profile.name || "You", totalXP, streak, workouts: myWorkouts, isMe: true }, ...friendProfiles]
                                .sort((a, b) => b.totalXP - a.totalXP)
                                .map((p, i) => {
                                    const lv = getLevel(p.totalXP);
                                    const rank = getRank(lv);
                                    return (
                                        <div key={p.uid} className="gc" style={{ marginBottom: 8, padding: 14, border: p.isMe ? "1px solid rgba(16,185,129,.15)" : undefined, background: p.isMe ? "rgba(16,185,129,.03)" : undefined }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                <div style={{ width: 28, height: 28, borderRadius: "50%", background: i === 0 ? "linear-gradient(135deg,#f59e0b,#f97316)" : i === 1 ? "linear-gradient(135deg,#9ca3af,#6b7280)" : i === 2 ? "linear-gradient(135deg,#b45309,#92400e)" : "rgba(255,255,255,.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: i < 3 ? "#fff" : "#6b7280" }}>
                                                    {i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: 13, fontWeight: 600, color: p.isMe ? "#10b981" : "#f3f4f6" }}>{p.name} {p.isMe ? "(You)" : ""}</div>
                                                    <div style={{ fontSize: 11, color: "#6b7280" }}>Lv.{lv} {rank.name} · {p.workouts || 0} workouts</div>
                                                </div>
                                                <div style={{ textAlign: "right" }}>
                                                    <div style={{ fontSize: 16, fontWeight: 800, color: rank.color || "#10b981", fontFamily: "Rajdhani,sans-serif" }}>{p.totalXP.toLocaleString()}</div>
                                                    <div style={{ fontSize: 11, color: "#6b7280" }}>XP</div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </div>
            )}

            {/* ══ FRIENDS TAB ══ */}
            {tab === "friends" && (
                <div>
                    {/* Search */}
                    <div className="gs" style={{ marginBottom: 14, padding: 14 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", marginBottom: 8 }}>Add Friend by Email</div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <input className="inp" placeholder="friend@email.com" value={searchEmail} onChange={e => setSearchEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()} style={{ flex: 1 }} />
                            <button className="bp" onClick={handleSearch} disabled={searching} style={{ padding: "10px 16px", fontSize: 13 }}>{searching ? "..." : "🔍"}</button>
                        </div>
                        {sentMsg && <div style={{ fontSize: 12, color: "#10b981", marginTop: 8 }}>{sentMsg}</div>}

                        {searchResult && !searchResult.error && (
                            <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "rgba(16,185,129,.04)", border: "1px solid rgba(16,185,129,.1)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: "#f3f4f6" }}>{searchResult.name}</div>
                                    <div style={{ fontSize: 11, color: "#6b7280" }}>{searchResult.email} · {searchResult.totalXP} XP</div>
                                </div>
                                <button className="bp" onClick={() => sendRequest(searchResult)} style={{ padding: "8px 16px", fontSize: 12 }}>{searchResult.theyRequested ? "✓ Accept" : "+ Add"}</button>
                            </div>
                        )}
                        {searchResult?.error && <div style={{ fontSize: 12, color: "#f59e0b", marginTop: 8 }}>{searchResult.error}</div>}
                    </div>

                    {/* Friends list */}
                    {friendProfiles.map(f => (
                        <div key={f.uid} className="gc" style={{ marginBottom: 8, padding: 14 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: "#f3f4f6" }}>{f.name}</div>
                                    <div style={{ fontSize: 11, color: "#6b7280" }}>{f.totalXP.toLocaleString()} XP · 🔥{f.streak}d · {f.workouts} workouts</div>
                                </div>
                                <span onClick={() => removeFriend(f.uid)} style={{ fontSize: 14, color: "#4b5563", cursor: "pointer", padding: "4px 8px" }}>✕</span>
                            </div>
                        </div>
                    ))}

                    {friendIds.length === 0 && !loading && <div style={{ textAlign: "center", padding: 20, color: "#6b7280", fontSize: 12 }}>No friends yet. Search by email above!</div>}
                    {uidList(me.outgoingRequests).length > 0 && (
                        <div style={{ textAlign: "center", padding: 8, color: "#6b7280", fontSize: 11 }}>⏳ {uidList(me.outgoingRequests).length} sent request{uidList(me.outgoingRequests).length !== 1 ? "s" : ""} awaiting response</div>
                    )}
                </div>
            )}

            {/* ══ CHALLENGES TAB ══ */}
            {tab === "challenges" && (
                <div>
                    {/* Create challenge */}
                    <div className="gs" style={{ marginBottom: 14, padding: 14 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", marginBottom: 10 }}>Create Group Challenge</div>
                        <div style={{ display: "flex", gap: 8 }}>
                            {[
                                { type: "workouts", icon: "⚔️", label: "Most Workouts" },
                                { type: "xp", icon: "⚡", label: "XP Race" },
                                { type: "streak", icon: "🔥", label: "Streak Battle" },
                            ].map(ch => (
                                <div key={ch.type} onClick={() => createChallenge(ch.type)} className="gc" style={{ flex: 1, padding: 14, textAlign: "center", cursor: "pointer", opacity: friendIds.length === 0 ? 0.5 : 1 }}>
                                    <div style={{ fontSize: 24 }}>{ch.icon}</div>
                                    <div style={{ fontSize: 11, color: "#d1d5db", marginTop: 4 }}>{ch.label}</div>
                                </div>
                            ))}
                        </div>
                        {friendIds.length === 0 && <div style={{ fontSize: 11, color: "#f59e0b", marginTop: 8, textAlign: "center" }}>Add friends first to create challenges!</div>}
                    </div>

                    {/* Active challenges */}
                    {challenges.length > 0 ? challenges.map(ch => {
                        const ended = /^\d{4}-\d{2}-\d{2}$/.test(asStr(ch.startDate)) && shiftDay(ch.startDate, Number(ch.duration) || 0) <= d;
                        return (
                            <div key={ch.key} className="gs" style={{ marginBottom: 10, padding: 14, opacity: ended ? 0.6 : 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                    <span style={{ fontSize: 20 }}>{ch.icon}</span>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>{ch.title}</div>
                                        <div style={{ fontSize: 11, color: "#6b7280" }}>By {ch.creatorName} · Started {ch.startDate} · {ch.duration} days{ended ? " · Ended" : ""}</div>
                                    </div>
                                </div>
                                <div style={{ fontSize: 12, color: "#10b981" }}>{toArr(ch.participants).length} participants</div>
                            </div>
                        );
                    }) : (
                        <div style={{ textAlign: "center", padding: 20, color: "#6b7280", fontSize: 12 }}>No active challenges. Create one above!</div>
                    )}
                </div>
            )}

            {/* ══ REQUESTS TAB ══ */}
            {tab === "requests" && (
                <div>
                    {pendingRequests.length > 0 ? pendingRequests.map(r => (
                        <div key={r.uid} className="gs" style={{ marginBottom: 10, padding: 14 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: "#f3f4f6" }}>{asStr(r.name) || "Warrior"}</div>
                                    <div style={{ fontSize: 11, color: "#6b7280" }}>Lv.{getLevel(Number(r.totalXP) || 0)} · {(Number(r.totalXP) || 0).toLocaleString()} XP</div>
                                </div>
                                <div style={{ display: "flex", gap: 6 }}>
                                    <button className="bp" onClick={() => acceptRequest(r.uid)} style={{ padding: "8px 14px", fontSize: 12 }}>✓ Accept</button>
                                    <button className="bg" onClick={() => declineRequest(r.uid)} style={{ padding: "8px 14px", fontSize: 12 }}>✕</button>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div style={{ textAlign: "center", padding: 30, color: "#6b7280" }}>
                            <div style={{ fontSize: 28, marginBottom: 8 }}>📩</div>
                            <div style={{ fontSize: 13 }}>No pending requests</div>
                        </div>
                    )}
                </div>
            )}

            {loading && <div style={{ textAlign: "center", padding: 20, color: "#6b7280", fontSize: 12 }}>Loading...</div>}
        </div>
    );
}