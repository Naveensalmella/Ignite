"use client";
import { useState, useEffect, useMemo, useCallback } from 'react';
import { AnimatedCard, StaggerContainer, StaggerItem } from './PageTransition';
import { getLevel, getRank, today } from '@/utils';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { hasDayWorkout, getDayCal, getDayDuration, getDaySplit, getTotalCal, countWorkoutDays } from '@/lib/workoutHelpers';

function Ring({ pct, color, size = 44, stroke = 4, children }) {
    const r = (size - stroke) / 2, c = 2 * Math.PI * r;
    return (<div style={{ position: "relative", width: size, height: size }}><svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.04)" strokeWidth={stroke} /><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, pct / 100))} strokeLinecap="round" style={{ transition: "stroke-dashoffset .8s" }} /></svg><div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div></div>);
}

export default function SocialPage({ user = {}, profile = {}, totalXP = 0, streak = 0, workoutLog = {}, addXP = () => { } }) {
    const [tab, setTab] = useState("feed");
    const [searchEmail, setSearchEmail] = useState("");
    const [searchResult, setSearchResult] = useState(null);
    const [searching, setSearching] = useState(false);
    const [friends, setFriends] = useState([]);
    const [friendProfiles, setFriendProfiles] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [requestProfiles, setRequestProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sentMsg, setSentMsg] = useState("");
    const [feedItems, setFeedItems] = useState([]);
    const [postText, setPostText] = useState("");
    const [posting, setPosting] = useState(false);
    const [challenges, setChallenges] = useState([]);

    const myLv = getLevel(totalXP);
    const myRank = getRank(myLv);
    const myWorkouts = countWorkoutDays(workoutLog);
    const d = today();

    // ── Load all data ──
    const loadFriendsData = useCallback(async () => {
        if (!user?.uid) return;
        setLoading(true);
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            const data = userDoc.exists() ? userDoc.data() : {};
            const friendIds = data.friends || [];
            const pending = data.pendingRequests || [];
            setFriends(friendIds);
            setPendingRequests(pending);

            // Load friend profiles
            const profiles = [];
            const feed = [];
            for (const fid of friendIds) {
                try {
                    const fDoc = await getDoc(doc(db, "users", fid));
                    if (fDoc.exists()) {
                        const fd = fDoc.data();
                        const fp = {
                            uid: fid,
                            name: fd.profile?.name || fd.email?.split("@")[0] || "Warrior",
                            email: fd.email || "",
                            totalXP: fd.totalXP || 0,
                            streak: fd.streak || 0,
                            workouts: Object.keys(fd.workoutLog || {}).length,
                        };
                        profiles.push(fp);

                        // Build activity feed from friend's recent data
                        const fWorkoutLog = fd.workoutLog || {};
                        const fXpLog = fd.xpLog || {};
                        const fPosts = fd.posts || [];

                        // Recent workouts (last 7 days)
                        for (let i = 0; i < 7; i++) {
                            const dt = new Date(); dt.setDate(dt.getDate() - i);
                            const ds = dt.toISOString().split("T")[0];
                            if (fWorkoutLog[ds]) {
                                feed.push({ type: "workout", user: fp.name, uid: fid, date: ds, data: fWorkoutLog[ds], time: ds });
                            }
                        }

                        // Recent posts
                        fPosts.forEach(p => {
                            feed.push({ type: "post", user: fp.name, uid: fid, ...p, time: p.date || p.time });
                        });

                        // Streak milestones
                        if (fd.streak >= 7 && fd.streak % 7 === 0) {
                            feed.push({ type: "streak", user: fp.name, uid: fid, streak: fd.streak, time: d });
                        }

                        // Level ups (check if recent)
                        const fLv = getLevel(fd.totalXP || 0);
                        if (fLv > 1) {
                            feed.push({ type: "level", user: fp.name, uid: fid, level: fLv, rank: getRank(fLv).name, time: d });
                        }
                    }
                } catch { }
            }

            // Sort feed by date (newest first)
            feed.sort((a, b) => (b.time || "").localeCompare(a.time || ""));
            setFeedItems(feed.slice(0, 30));
            setFriendProfiles(profiles.sort((a, b) => b.totalXP - a.totalXP));

            // Load request profiles
            const reqProfiles = [];
            for (const rid of pending) {
                try {
                    const rDoc = await getDoc(doc(db, "users", rid));
                    if (rDoc.exists()) {
                        const rd = rDoc.data();
                        reqProfiles.push({ uid: rid, name: rd.profile?.name || rd.email?.split("@")[0] || "Warrior", email: rd.email || "", totalXP: rd.totalXP || 0 });
                    }
                } catch { }
            }
            setRequestProfiles(reqProfiles);

            // Load challenges
            setChallenges(data.groupChallenges || []);
        } catch (e) { console.error("Load friends error:", e); }
        setLoading(false);
    }, [user]);

    useEffect(() => { loadFriendsData(); }, [loadFriendsData]);

    // ── Search by email ──
    const handleSearch = async () => {
        const term = searchEmail.trim().toLowerCase();
        if (!term) return;
        setSearching(true); setSearchResult(null); setSentMsg("");
        try {
            const q = query(collection(db, "users"), where("email", "==", term));
            const snap = await getDocs(q);
            if (!snap.empty) {
                const foundDoc = snap.docs[0];
                const fd = foundDoc.data();
                if (foundDoc.id === user.uid) setSearchResult({ error: "That's you! 😄" });
                else if (friends.includes(foundDoc.id)) setSearchResult({ error: "Already friends! ✅" });
                else setSearchResult({ uid: foundDoc.id, name: fd.profile?.name || fd.email?.split("@")[0] || "Warrior", email: fd.email, totalXP: fd.totalXP || 0, streak: fd.streak || 0 });
            } else setSearchResult({ error: "No user found with that email." });
        } catch { setSearchResult({ error: "Search failed." }); }
        setSearching(false);
    };

    // ── Send request ──
    const sendRequest = async (targetUid) => {
        try {
            const targetDoc = await getDoc(doc(db, "users", targetUid));
            if (targetDoc.exists()) {
                const td = targetDoc.data();
                if ((td.pendingRequests || []).includes(user.uid)) { setSentMsg("Request already sent! ⏳"); setSearchResult(null); return; }
                if ((td.friends || []).includes(user.uid)) { setSentMsg("Already friends! ✅"); setSearchResult(null); return; }
            }
            await updateDoc(doc(db, "users", targetUid), { pendingRequests: arrayUnion(user.uid) });
            setSentMsg("Request sent! ✅"); setSearchResult(null); setSearchEmail("");
        } catch { setSentMsg("Failed to send request."); }
    };

    // ── Accept / Decline ──
    const acceptRequest = async (fromUid) => {
        try {
            await updateDoc(doc(db, "users", user.uid), { friends: arrayUnion(fromUid), pendingRequests: arrayRemove(fromUid) });
            await updateDoc(doc(db, "users", fromUid), { friends: arrayUnion(user.uid) });
            addXP(10, "New friend connected");
            loadFriendsData();
        } catch { }
    };

    const declineRequest = async (fromUid) => {
        try {
            await updateDoc(doc(db, "users", user.uid), { pendingRequests: arrayRemove(fromUid) });
            loadFriendsData();
        } catch { }
    };

    const removeFriend = async (fid) => {
        if (!window.confirm("Remove this friend?")) return;
        try {
            await updateDoc(doc(db, "users", user.uid), { friends: arrayRemove(fid) });
            await updateDoc(doc(db, "users", fid), { friends: arrayRemove(user.uid) });
            loadFriendsData();
        } catch { }
    };

    // ── Post to feed ──
    const createPost = async () => {
        if (!postText.trim()) return;
        setPosting(true);
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            const currentPosts = userDoc.exists() ? (userDoc.data().posts || []) : [];
            const newPost = { id: Date.now(), text: postText.trim(), date: d, time: new Date().toISOString(), likes: [], comments: [] };
            await updateDoc(doc(db, "users", user.uid), { posts: [newPost, ...currentPosts].slice(0, 20) });
            setPostText(""); addXP(5, "Posted update");
            loadFriendsData();
        } catch { }
        setPosting(false);
    };

    // ── Like a post ──
    const likePost = async (postOwnerUid, postId) => {
        try {
            const ownerDoc = await getDoc(doc(db, "users", postOwnerUid));
            if (!ownerDoc.exists()) return;
            const posts = ownerDoc.data().posts || [];
            const updated = posts.map(p => {
                if (p.id === postId) {
                    const likes = p.likes || [];
                    if (likes.includes(user.uid)) return { ...p, likes: likes.filter(l => l !== user.uid) };
                    else return { ...p, likes: [...likes, user.uid] };
                }
                return p;
            });
            await updateDoc(doc(db, "users", postOwnerUid), { posts: updated });
            loadFriendsData();
        } catch { }
    };

    // ── Create group challenge ──
    const createChallenge = async (type) => {
        const challengeTemplates = {
            workouts: { title: "Most Workouts This Week", icon: "⚔️", metric: "workouts", duration: 7 },
            xp: { title: "XP Race This Week", icon: "⚡", metric: "xp", duration: 7 },
            streak: { title: "Longest Streak Challenge", icon: "🔥", metric: "streak", duration: 14 },
        };
        const template = challengeTemplates[type];
        if (!template) return;
        const challenge = { ...template, id: Date.now(), creator: user.uid, startDate: d, participants: [user.uid], scores: {} };
        try {
            // Save to all friends
            for (const fid of friends) {
                const fDoc = await getDoc(doc(db, "users", fid));
                const fChallenges = fDoc.exists() ? (fDoc.data().groupChallenges || []) : [];
                await updateDoc(doc(db, "users", fid), { groupChallenges: [challenge, ...fChallenges].slice(0, 5) });
            }
            // Save to self
            const myDoc = await getDoc(doc(db, "users", user.uid));
            const myChallenges = myDoc.exists() ? (myDoc.data().groupChallenges || []) : [];
            await updateDoc(doc(db, "users", user.uid), { groupChallenges: [challenge, ...myChallenges].slice(0, 5) });
            addXP(10, "Created group challenge");
            loadFriendsData();
        } catch { }
    };

    const timeAgo = (dateStr) => {
        if (!dateStr) return "";
        const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
        if (diff < 60) return "now";
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    return (
        <div style={{ maxWidth: "100%", overflowX: "hidden" }}>
            {/* Tabs */}
            <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto" }}>
                {[["feed", "📰 Feed"], ["leaderboard", "🏆 Board"], ["friends", `👥 Friends (${friends.length})`], ["challenges", "🏅 Challenges"], ["requests", `📩 Requests`, pendingRequests.length]].map(([k, l, badge]) => (
                    <span key={k} className={`chip ${tab === k ? "chip-a" : "chip-i"}`} onClick={() => { setTab(k); if (k === "requests") loadFriendsData(); }} style={{ flexShrink: 0, fontSize: 12, position: "relative" }}>
                        {l}
                        {badge > 0 && <span style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: "#ef4444", fontSize: 9, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>{badge}</span>}
                    </span>
                ))}
            </div>

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
                    {feedItems.length === 0 && !loading && (
                        <div style={{ textAlign: "center", padding: 30, color: "#6b7280" }}>
                            <div style={{ fontSize: 32, marginBottom: 8 }}>📰</div>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>No feed yet</div>
                            <div style={{ fontSize: 12, marginTop: 4 }}>Add friends to see their workouts and achievements!</div>
                        </div>
                    )}

                    {feedItems.map((item, i) => (
                        <StaggerItem key={i}>
                            <div className="gs" style={{ marginBottom: 10, padding: 14 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(16,185,129,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#10b981" }}>{(item.user || "U")[0]?.toUpperCase()}</div>
                                    <div style={{ flex: 1 }}>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: "#f3f4f6" }}>{item.user}</span>
                                        <span style={{ fontSize: 10, color: "#6b7280", marginLeft: 8 }}>{timeAgo(item.time)}</span>
                                    </div>
                                </div>

                                {item.type === "workout" && (
                                    <div>
                                        <div style={{ fontSize: 13, color: "#d1d5db" }}>💪 Completed a workout: <span style={{ color: "#10b981", fontWeight: 600 }}>{item.data?.splitName || "Training"}</span></div>
                                        {item.data?.calBurned > 0 && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>🔥 {item.data.calBurned} cal · {Math.round((item.data.duration || 0) / 60)} min</div>}
                                    </div>
                                )}

                                {item.type === "post" && (
                                    <div>
                                        <div style={{ fontSize: 13, color: "#d1d5db", lineHeight: 1.5 }}>{item.text}</div>
                                        <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                                            <span onClick={() => likePost(item.uid, item.id)} style={{ fontSize: 12, color: (item.likes || []).includes(user.uid) ? "#ef4444" : "#6b7280", cursor: "pointer" }}>
                                                {(item.likes || []).includes(user.uid) ? "❤️" : "🤍"} {(item.likes || []).length}
                                            </span>
                                            <span style={{ fontSize: 12, color: "#6b7280" }}>💬 {(item.comments || []).length}</span>
                                        </div>
                                    </div>
                                )}

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
                        <span onClick={loadFriendsData} style={{ fontSize: 11, color: "#10b981", cursor: "pointer" }}>🔄 Refresh</span>
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
                            {[{ uid: user.uid, name: profile.name || "You", totalXP, streak, workouts: myWorkouts, isMe: true }, ...friendProfiles]
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
                                                    <div style={{ fontSize: 10, color: "#6b7280" }}>Lv.{lv} {rank.name} · {p.workouts || 0} workouts</div>
                                                </div>
                                                <div style={{ textAlign: "right" }}>
                                                    <div style={{ fontSize: 16, fontWeight: 800, color: rank.color || "#10b981", fontFamily: "Rajdhani,sans-serif" }}>{p.totalXP.toLocaleString()}</div>
                                                    <div style={{ fontSize: 9, color: "#6b7280" }}>XP</div>
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
                                    <div style={{ fontSize: 10, color: "#6b7280" }}>{searchResult.email} · {searchResult.totalXP} XP</div>
                                </div>
                                <button className="bp" onClick={() => sendRequest(searchResult.uid)} style={{ padding: "8px 16px", fontSize: 12 }}>+ Add</button>
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
                                    <div style={{ fontSize: 10, color: "#6b7280" }}>{f.totalXP.toLocaleString()} XP · 🔥{f.streak}d · {f.workouts} workouts</div>
                                </div>
                                <span onClick={() => removeFriend(f.uid)} style={{ fontSize: 14, color: "#4b5563", cursor: "pointer", padding: "4px 8px" }}>✕</span>
                            </div>
                        </div>
                    ))}

                    {friends.length === 0 && <div style={{ textAlign: "center", padding: 20, color: "#6b7280", fontSize: 12 }}>No friends yet. Search by email above!</div>}
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
                                <div key={ch.type} onClick={() => createChallenge(ch.type)} className="gc" style={{ flex: 1, padding: 14, textAlign: "center", cursor: "pointer" }}>
                                    <div style={{ fontSize: 24 }}>{ch.icon}</div>
                                    <div style={{ fontSize: 10, color: "#d1d5db", marginTop: 4 }}>{ch.label}</div>
                                </div>
                            ))}
                        </div>
                        {friends.length === 0 && <div style={{ fontSize: 11, color: "#f59e0b", marginTop: 8, textAlign: "center" }}>Add friends first to create challenges!</div>}
                    </div>

                    {/* Active challenges */}
                    {challenges.length > 0 ? challenges.map(ch => (
                        <div key={ch.id} className="gs" style={{ marginBottom: 10, padding: 14 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                <span style={{ fontSize: 20 }}>{ch.icon}</span>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>{ch.title}</div>
                                    <div style={{ fontSize: 10, color: "#6b7280" }}>Started {ch.startDate} · {ch.duration} days</div>
                                </div>
                            </div>
                            <div style={{ fontSize: 12, color: "#10b981" }}>{(ch.participants || []).length} participants</div>
                        </div>
                    )) : (
                        <div style={{ textAlign: "center", padding: 20, color: "#6b7280", fontSize: 12 }}>No active challenges. Create one above!</div>
                    )}
                </div>
            )}

            {/* ══ REQUESTS TAB ══ */}
            {tab === "requests" && (
                <div>
                    {requestProfiles.length > 0 ? requestProfiles.map(r => (
                        <div key={r.uid} className="gs" style={{ marginBottom: 10, padding: 14 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: "#f3f4f6" }}>{r.name}</div>
                                    <div style={{ fontSize: 11, color: "#6b7280" }}>{r.email} · {r.totalXP} XP</div>
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