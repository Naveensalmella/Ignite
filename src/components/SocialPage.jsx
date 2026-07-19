import { useState, useEffect, useMemo } from 'react';
import { getLevel, getRank, today } from '../utils';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';

function Ring({ pct, color, size = 44, stroke = 4, children }) {
    const r = (size - stroke) / 2, c = 2 * Math.PI * r;
    return (
        <div style={{ position: "relative", width: size, height: size }}>
            <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.04)" strokeWidth={stroke} />
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
                    strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, pct / 100))} strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset .8s" }} />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>
        </div>
    );
}

export default function SocialPage({ user = {}, profile = {}, totalXP = 0, streak = 0, workoutLog = {} }) {
    const [tab, setTab] = useState("leaderboard"); // leaderboard | friends | requests
    const [friends, setFriends] = useState([]);
    const [friendProfiles, setFriendProfiles] = useState([]);
    const [searchEmail, setSearchEmail] = useState("");
    const [searchResult, setSearchResult] = useState(null);
    const [searching, setSearching] = useState(false);
    const [loading, setLoading] = useState(true);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [requestProfiles, setRequestProfiles] = useState([]);
    const [sentMsg, setSentMsg] = useState("");

    const myLv = getLevel(totalXP);
    const myRank = getRank(myLv);
    const myWorkouts = Object.keys(workoutLog || {}).length;

    // Load friends list from Firestore
    useEffect(() => {
        if (!user?.uid) return;
        loadFriendsData();
    }, [user]);

    // Auto-refresh when tab changes
    useEffect(() => {
        if (!user?.uid) return;
        if (tab === "requests") loadFriendsData();
    }, [tab]);

    const loadFriendsData = async () => {
        setLoading(true);
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            const data = userDoc.exists() ? userDoc.data() : {};
            const friendIds = data.friends || [];
            const pending = data.pendingRequests || [];

            setFriends(friendIds);
            setPendingRequests(pending);

            // Load friend profiles
            if (friendIds.length > 0) {
                const profiles = [];
                for (const fid of friendIds) {
                    try {
                        const fDoc = await getDoc(doc(db, "users", fid));
                        if (fDoc.exists()) {
                            const fd = fDoc.data();
                            profiles.push({
                                uid: fid,
                                name: fd.profile?.name || fd.email?.split("@")[0] || "Warrior",
                                email: fd.email || "",
                                totalXP: fd.totalXP || 0,
                                streak: fd.streak || 0,
                                workouts: Object.keys(fd.workoutLog || {}).length,
                                avatar: (fd.profile?.name || "W")[0]?.toUpperCase(),
                            });
                        }
                    } catch { }
                }
                setFriendProfiles(profiles);
            }

            // Load pending request profiles
            if (pending.length > 0) {
                const reqProfiles = [];
                for (const rid of pending) {
                    try {
                        const rDoc = await getDoc(doc(db, "users", rid));
                        if (rDoc.exists()) {
                            const rd = rDoc.data();
                            reqProfiles.push({
                                uid: rid,
                                name: rd.profile?.name || rd.email?.split("@")[0] || "Warrior",
                                email: rd.email || "",
                                totalXP: rd.totalXP || 0,
                            });
                        }
                    } catch { }
                }
                setRequestProfiles(reqProfiles);
            }
        } catch (e) {
            console.error("Error loading friends:", e);
        }
        setLoading(false);
    };

    // Search user by email
    const searchUser = async () => {
        const term = searchEmail.trim().toLowerCase();
        if (!term) return;
        setSearching(true);
        setSearchResult(null);
        setSentMsg("");

        try {
            // Search by email
            const q = query(collection(db, "users"), where("email", "==", term));
            const snap = await getDocs(q);

            if (!snap.empty) {
                const foundDoc = snap.docs[0];
                const fd = foundDoc.data();
                if (foundDoc.id === user.uid) {
                    setSearchResult({ error: "That's you! 😄" });
                } else if (friends.includes(foundDoc.id)) {
                    setSearchResult({ error: "Already friends! ✅" });
                } else {
                    setSearchResult({
                        uid: foundDoc.id,
                        name: fd.profile?.name || fd.email?.split("@")[0] || "Warrior",
                        email: fd.email || "",
                        totalXP: fd.totalXP || 0,
                        streak: fd.streak || 0,
                    });
                }
            } else {
                setSearchResult({ error: "No user found with that email. Make sure they've signed up for IGNITE." });
            }
        } catch (e) {
            console.error("Search error:", e);
            setSearchResult({ error: "Search failed. Check your internet connection." });
        }
        setSearching(false);
    };

    // Send friend request
    const sendRequest = async (targetUid) => {
        try {
            // Check if already sent
            const targetDoc = await getDoc(doc(db, "users", targetUid));
            if (targetDoc.exists()) {
                const targetData = targetDoc.data();
                if ((targetData.pendingRequests || []).includes(user.uid)) {
                    setSentMsg("Request already sent! ⏳");
                    setSearchResult(null);
                    return;
                }
                if ((targetData.friends || []).includes(user.uid)) {
                    setSentMsg("Already friends! ✅");
                    setSearchResult(null);
                    return;
                }
            }
            await updateDoc(doc(db, "users", targetUid), {
                pendingRequests: arrayUnion(user.uid),
            });
            setSentMsg("Request sent! ✅");
            setSearchResult(null);
            setSearchEmail("");
        } catch (e) {
            setSentMsg("Failed to send. Check your internet and try again.");
        }
    };

    // Accept friend request
    const acceptRequest = async (fromUid) => {
        try {
            // Add each other as friends
            await updateDoc(doc(db, "users", user.uid), {
                friends: arrayUnion(fromUid),
                pendingRequests: arrayRemove(fromUid),
            });
            await updateDoc(doc(db, "users", fromUid), {
                friends: arrayUnion(user.uid),
            });
            // Refresh
            loadFriendsData();
        } catch (e) {
            console.error("Accept error:", e);
        }
    };

    // Decline request
    const declineRequest = async (fromUid) => {
        try {
            await updateDoc(doc(db, "users", user.uid), {
                pendingRequests: arrayRemove(fromUid),
            });
            setPendingRequests(p => p.filter(id => id !== fromUid));
            setRequestProfiles(p => p.filter(r => r.uid !== fromUid));
        } catch { }
    };

    // Remove friend (with confirmation)
    const removeFriend = async (friendUid) => {
        const friendName = friendProfiles.find(f => f.uid === friendUid)?.name || "this friend";
        if (!window.confirm(`Remove ${friendName} from your friends?`)) return;
        try {
            await updateDoc(doc(db, "users", user.uid), {
                friends: arrayRemove(friendUid),
            });
            await updateDoc(doc(db, "users", friendUid), {
                friends: arrayRemove(user.uid),
            });
            setFriends(p => p.filter(id => id !== friendUid));
            setFriendProfiles(p => p.filter(f => f.uid !== friendUid));
        } catch (e) {
            console.error("Remove friend error:", e);
        }
    };

    // Build leaderboard (you + friends sorted by XP)
    const leaderboard = useMemo(() => {
        const me = {
            uid: user?.uid, name: profile.name || "You", email: user?.email || "",
            totalXP, streak, workouts: myWorkouts, avatar: (profile.name || "Y")[0]?.toUpperCase(), isMe: true,
        };
        return [me, ...friendProfiles].sort((a, b) => b.totalXP - a.totalXP);
    }, [friendProfiles, totalXP, streak, myWorkouts, profile]);

    return (
        <div style={{ maxWidth: "100%", overflowX: "hidden" }}>
            {/* Tabs */}
            <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 20, flexWrap: "wrap" }}>
                {[["leaderboard", "🏆 Leaderboard", 0], ["friends", `👥 Friends (${friends.length})`, 0], ["requests", "📩 Requests", pendingRequests.length]].map(([k, l, badge]) => (
                    <span key={k} className={`chip ${tab === k ? "chip-a" : "chip-i"}`} onClick={() => setTab(k)} style={{ padding: "8px 14px", position: "relative" }}>
                        {l}
                        {badge > 0 && <span style={{ position: "absolute", top: -4, right: -4, width: 18, height: 18, borderRadius: "50%", background: "#ef4444", color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{badge}</span>}
                    </span>
                ))}
            </div>

            {/* ══ LEADERBOARD ══ */}
            {tab === "leaderboard" && (
                <div>
                    <div style={{ textAlign: "center", marginBottom: 20 }}>
                        <div style={{ fontSize: 36 }}>🏆</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>Leaderboard</div>
                        <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>Compete with friends for the top spot</div>
                        <button className="bg" onClick={loadFriendsData} style={{ marginTop: 8, padding: "6px 16px", fontSize: 11 }}>🔄 Refresh</button>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: "center", padding: 40 }}>
                            <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 12 }}>
                                {[0, 1, 2].map(i => <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981", animation: `dotPulse 1.2s ${i * .2}s infinite` }} />)}
                            </div>
                            <div style={{ color: "#6b7280", fontSize: 13 }}>Loading leaderboard...</div>
                        </div>
                    ) : leaderboard.length <= 1 ? (
                        <div className="gs" style={{ textAlign: "center", padding: 30 }}>
                            <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>No friends yet</div>
                            <p style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>Add friends to see the leaderboard come alive!</p>
                            <button className="bp" onClick={() => setTab("friends")} style={{ marginTop: 12, padding: "10px 24px" }}>+ Add Friends</button>
                        </div>
                    ) : (
                        <div>
                            {/* Top 3 Podium */}
                            {leaderboard.length >= 2 && (
                                <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 10, marginBottom: 24 }}>
                                    {[1, 0, 2].map(pos => {
                                        const p = leaderboard[pos];
                                        if (!p) return <div key={pos} style={{ width: 90 }} />;
                                        const lv = getLevel(p.totalXP);
                                        const rk = getRank(lv);
                                        const medals = ["🥇", "🥈", "🥉"];
                                        const heights = [120, 150, 100];
                                        return (
                                            <div key={pos} style={{ textAlign: "center", width: 100 }}>
                                                <div style={{ width: 48, height: 48, borderRadius: "50%", background: `linear-gradient(135deg,${rk.color},#10b981)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "#fff", margin: "0 auto 6px", border: p.isMe ? "2px solid #10b981" : "2px solid transparent", boxShadow: pos === 0 ? `0 0 20px ${rk.color}40` : "none" }}>
                                                    {p.avatar}
                                                </div>
                                                <div style={{ fontSize: 18 }}>{medals[pos]}</div>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: p.isMe ? "#10b981" : "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>{p.isMe ? "You" : p.name}</div>
                                                <div style={{ fontSize: 11, color: rk.color }}>{rk.emoji} {rk.name}</div>
                                                <div style={{ fontSize: 12, color: "#f59e0b", fontWeight: 700 }}>{p.totalXP.toLocaleString()} XP</div>
                                                <div style={{ width: "100%", height: heights[pos === 1 ? 0 : pos === 0 ? 1 : 2], background: `linear-gradient(180deg,${rk.color}15,transparent)`, borderRadius: "8px 8px 0 0", marginTop: 8, border: `1px solid ${rk.color}20`, borderBottom: "none" }} />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Full List */}
                            {leaderboard.map((p, i) => {
                                const lv = getLevel(p.totalXP);
                                const rk = getRank(lv);
                                return (
                                    <div key={p.uid} className="gs" style={{ marginBottom: 8, padding: "12px 16px", border: p.isMe ? "1px solid rgba(16,185,129,.2)" : "1px solid rgba(255,255,255,.04)", background: p.isMe ? "rgba(16,185,129,.04)" : undefined }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                            <div style={{ fontSize: 16, fontWeight: 800, color: i < 3 ? ["#fbbf24", "#94a3b8", "#cd7f32"][i] : "#4b5563", fontFamily: "Rajdhani,sans-serif", width: 28, textAlign: "center" }}>#{i + 1}</div>
                                            <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg,${rk.color},#10b981)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#fff", flexShrink: 0 }}>{p.avatar}</div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 15, fontWeight: 700, color: p.isMe ? "#10b981" : "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>{p.isMe ? `${p.name} (You)` : p.name}</div>
                                                <div style={{ fontSize: 11, color: "#6b7280" }}>{rk.emoji} {rk.name} · Lv.{lv} · 🔥{p.streak}d</div>
                                            </div>
                                            <div style={{ textAlign: "right" }}>
                                                <div style={{ fontSize: 16, fontWeight: 800, color: "#f59e0b", fontFamily: "Rajdhani,sans-serif" }}>{p.totalXP.toLocaleString()}</div>
                                                <div style={{ fontSize: 10, color: "#6b7280" }}>XP</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ══ FRIENDS ══ */}
            {tab === "friends" && (
                <div>
                    {/* Share invite */}
                    <div className="gs" style={{ marginBottom: 12, padding: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>📤 Invite Friends</div>
                                <div style={{ fontSize: 11, color: "#6b7280" }}>Share IGNITE with friends</div>
                            </div>
                            <button className="bp" onClick={() => {
                                const text = `Join me on IGNITE! 🔥 Track workouts, nutrition, and level up your life. Add me: ${user.email || ""}`;
                                if (navigator.share) navigator.share({ title: "Join IGNITE", text }).catch(() => { });
                                else { navigator.clipboard.writeText(text); setSentMsg("Invite copied to clipboard! 📋"); setTimeout(() => setSentMsg(""), 2000); }
                            }} style={{ padding: "8px 16px", fontSize: 12 }}>Share</button>
                        </div>
                    </div>

                    {/* Add Friend */}
                    <div className="gs" style={{ marginBottom: 16 }}>
                        <div className="sl">Add Friend by Email</div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <input className="inp" placeholder="friend@email.com" value={searchEmail}
                                onChange={e => setSearchEmail(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && searchUser()}
                                style={{ flex: 1 }} />
                            <button className="bp" onClick={searchUser} disabled={searching} style={{ padding: "10px 20px" }}>
                                {searching ? "..." : "Search"}
                            </button>
                        </div>

                        {sentMsg && <div style={{ marginTop: 10, fontSize: 13, color: "#10b981", textAlign: "center" }}>{sentMsg}</div>}

                        {searchResult && (
                            <div className="fade-in" style={{ marginTop: 12 }}>
                                {searchResult.error ? (
                                    <div style={{ fontSize: 13, color: "#6b7280", textAlign: "center", padding: 10 }}>{searchResult.error}</div>
                                ) : (
                                    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10, background: "rgba(16,185,129,.04)", border: "1px solid rgba(16,185,129,.15)" }}>
                                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#10b981,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#fff" }}>{searchResult.name[0]?.toUpperCase()}</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 15, fontWeight: 700, color: "#f3f4f6" }}>{searchResult.name}</div>
                                            <div style={{ fontSize: 11, color: "#6b7280" }}>{searchResult.email} · {searchResult.totalXP.toLocaleString()} XP</div>
                                        </div>
                                        <button className="bp" onClick={() => sendRequest(searchResult.uid)} style={{ padding: "8px 16px", fontSize: 12 }}>+ Add</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* My Friends */}
                    <div className="sl">My Friends · {friendProfiles.length}</div>
                    {loading ? <div style={{ textAlign: "center", padding: 20, color: "#6b7280" }}>Loading...</div> :
                        friendProfiles.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "30px 0", color: "#6b7280", fontSize: 13 }}>No friends yet. Search by email above to add!</div>
                        ) : (
                            friendProfiles.map(f => {
                                const lv = getLevel(f.totalXP);
                                const rk = getRank(lv);
                                return (
                                    <div key={f.uid} className="gs" style={{ marginBottom: 8, padding: "12px 16px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                            <div style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg,${rk.color},#10b981)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "#fff", flexShrink: 0 }}>{f.avatar}</div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 15, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>{f.name}</div>
                                                <div style={{ fontSize: 12, color: "#6b7280" }}>{rk.emoji} {rk.name} · Lv.{lv}</div>
                                                <div style={{ display: "flex", gap: 12, marginTop: 4, fontSize: 11 }}>
                                                    <span style={{ color: "#f59e0b" }}>⚡ {f.totalXP.toLocaleString()} XP</span>
                                                    <span style={{ color: "#f97316" }}>🔥 {f.streak}d</span>
                                                    <span style={{ color: "#10b981" }}>🏋️ {f.workouts}</span>
                                                </div>
                                            </div>
                                            <button onClick={() => removeFriend(f.uid)} style={{ background: "none", border: "none", color: "#4b5563", fontSize: 14, cursor: "pointer", padding: "4px 8px" }}>✕</button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                </div>
            )}

            {/* ══ REQUESTS ══ */}
            {tab === "requests" && (
                <div>
                    <div style={{ textAlign: "center", marginBottom: 20 }}>
                        <div style={{ fontSize: 28 }}>📩</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>Friend Requests</div>
                    </div>

                    {loading ? <div style={{ textAlign: "center", padding: 20, color: "#6b7280" }}>Loading...</div> :
                        requestProfiles.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "30px 0", color: "#6b7280", fontSize: 13 }}>No pending requests</div>
                        ) : (
                            requestProfiles.map(r => (
                                <div key={r.uid} className="gs" style={{ marginBottom: 8, padding: "14px 16px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#10b981,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#fff" }}>{r.name[0]?.toUpperCase()}</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 15, fontWeight: 700, color: "#f3f4f6" }}>{r.name}</div>
                                            <div style={{ fontSize: 11, color: "#6b7280" }}>{r.email} · {r.totalXP.toLocaleString()} XP</div>
                                        </div>
                                        <div style={{ display: "flex", gap: 6 }}>
                                            <button className="bp" onClick={() => acceptRequest(r.uid)} style={{ padding: "8px 14px", fontSize: 12 }}>Accept</button>
                                            <button className="bg" onClick={() => declineRequest(r.uid)} style={{ padding: "8px 14px", fontSize: 12 }}>Decline</button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                </div>
            )}
        </div>
    );
}