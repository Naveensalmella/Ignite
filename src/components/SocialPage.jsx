"use client";
import { useState, useEffect, useMemo } from 'react';
import { StaggerContainer, StaggerItem } from './PageTransition';
import { getLevel, getRank, today, toArr, addDays, parseDateKey } from '@/utils';
import { playerRank, rankById } from '@/lib/system/ranks';
import useAppStore from '@/stores/useAppStore';
import { collection, query, where, limit, getDocs, doc, getDoc, setDoc, arrayUnion, arrayRemove, deleteField } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, Pill, Tabs, Tile, IconBadge, EmptyState } from '@/components/ui/kit';
import { Dumbbell, Zap, Flame, Swords, TrendingUp, Send, Search, UserPlus, Check, X, RotateCw, Users, Rss, Trophy, Inbox, Clock, Medal } from 'lucide-react';
import { countWorkoutDays, getDayEntries } from '@/lib/workoutHelpers';

// ── Firestore model ──
// firestore.rules only allow users/{uid} (owner-only), publicProfiles/{uid} (any signed-in user
// can get one by id; listing is limited to profiles that name you in `friends` /
// `outgoingRequests`; writable only by its owner, with validated fields) and emailIndex/{hash}.
// So every piece of social data lives in the user's OWN public profile and relationships are
// derived by querying other public profiles — this page never reads another user's private
// users/{uid} doc and never writes to anyone else's doc.
//   friends: [uid]             people I've added/accepted. Shown as a friend once they list me too
//                              (in their `friends`, or still in their `outgoingRequests` to me).
//   outgoingRequests: [uid]    requests I've sent — the recipient finds them with array-contains.
//   declinedRequests: [uid]    incoming requests I've declined / friends I removed.
//   posts: [...]               my posts (max 20).
//   likes: ["ownerUid:postId"] posts I've liked; like counts are tallied across loaded profiles.
//   groupChallenges: [...]     challenges I created; participants see them via my profile.
// emailIndex/{sha256(email)} → { uid }: "add friend by email" looks a user up by the hash of
// the address you type (a get, never a list), so nobody can enumerate users or harvest hashes.
// The rules only let an account write the entry for its own sign-in email.
const PUBLIC = "publicProfiles";
const EMAIL_INDEX = "emailIndex";
const MAX_QUERY = 200; // firestore.rules cap list queries
const nowMs = () => Date.now();
const asStr = v => (typeof v === "string" ? v : "");
const uidList = v => toArr(v).filter(x => typeof x === "string" && x);
const numOr0 = v => (Number.isFinite(Number(v)) ? Number(v) : 0);

// Another user's profile data is untrusted: only plain, well-typed challenges get rendered.
function cleanChallenge(ch) {
    if (!ch || typeof ch !== "object" || ch.id == null || typeof ch.id === "object") return null;
    return {
        id: String(ch.id),
        title: asStr(ch.title).slice(0, 80) || "Challenge",
        metric: Object.hasOwn(CHALLENGE_LOOK, asStr(ch.metric)) ? ch.metric : "",
        duration: Math.max(0, Math.min(365, Math.round(numOr0(ch.duration)))),
        startDate: /^\d{4}-\d{2}-\d{2}$/.test(asStr(ch.startDate)) ? ch.startDate : "",
        participants: uidList(ch.participants),
    };
}

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
export async function syncPublicProfile({ user, profile, totalXP = 0, streak = 0, workoutLog = {}, system = null }, prev = null) {
    if (!user?.uid) return null;
    const d = today();
    const level = getLevel(totalXP);
    const data = {
        uid: user.uid,
        name: (asStr(profile?.name) || asStr(user.name) || "Warrior").slice(0, 60),
        totalXP: Math.max(0, Math.round(Number(totalXP) || 0)),
        streak: Math.max(0, Math.round(Number(streak) || 0)),
        workouts: countWorkoutDays(workoutLog || {}),
        level,
        rank: asStr(playerRank(system, level).id),
        recentWorkouts: recentWorkoutsFrom(workoutLog, d),
        updatedAt: new Date().toISOString(),
    };
    if (prev && Number(prev.level) > 0 && level > Number(prev.level)) data.levelUpDate = d;
    // The email hash used to be published on the profile; it now lives only in emailIndex.
    await setDoc(doc(db, PUBLIC, user.uid), { ...data, emailHash: deleteField() }, { merge: true });
    try {
        const h = await hashEmail(user.email);
        if (h) await setDoc(doc(db, EMAIL_INDEX, h), { uid: user.uid });
    } catch (e) { console.warn("Email index skipped:", e?.code || e); }
    return { ...(prev || {}), ...data };
}

// Load everything the page needs. Pure data fetch — no React state in here.
async function fetchSocial({ user, profile, totalXP, streak, workoutLog, system }) {
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

    await syncPublicProfile({ user, profile, totalXP, streak, workoutLog, system }, me);
    snap = await getDoc(myRef);
    me = snap.exists() ? snap.data() : {};

    const [listsMeSnap, reqSnap] = await Promise.all([
        getDocs(query(collection(db, PUBLIC), where("friends", "array-contains", uid), limit(MAX_QUERY))),
        getDocs(query(collection(db, PUBLIC), where("outgoingRequests", "array-contains", uid), limit(MAX_QUERY))),
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

// Display-only helpers
const initialOf = (name) => (asStr(name) || "U").trim().charAt(0).toUpperCase() || "U";
function Avatar({ name, size = 38 }) {
    return <span className="avatar" style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }} aria-hidden="true">{initialOf(name)}</span>;
}
const CHALLENGE_LOOK = { workouts: [Swords, "orange"], xp: [Zap, "sky"], streak: [Flame, "rose"] };
const PODIUM_TONE = ["amber", "blue", "orange"];

export default function SocialPage({ user: rawUser = {}, profile: rawProfile = {}, totalXP = 0, streak = 0, workoutLog = {}, addXP = () => { } }) {
    const user = rawUser || {};
    const profile = rawProfile || {};
    const uid = user.uid;
    const system = useAppStore(s => s.system);
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
        fetchSocial({ user, profile, totalXP, streak, workoutLog, system: useAppStore.getState().system })
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
                if (w && typeof w === "object" && asStr(w.date) >= weekAgo) {
                    const data = { splitName: asStr(w.splitName) || "Training", calBurned: numOr0(w.calBurned), duration: numOr0(w.duration) };
                    feed.push({ type: "workout", user: name, uid: f.uid, date: w.date, data, time: w.date });
                }
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
                if (post && asStr(post.text) && (typeof post.id === "number" || typeof post.id === "string")) feed.push({ type: "post", user: asStr(p.name) || "Warrior", uid: p.uid, id: post.id, text: post.text, time: asStr(post.time) || asStr(post.date) });
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
            toArr(p.groupChallenges).forEach(raw => {
                const ch = cleanChallenge(raw);
                if (!ch) return;
                const key = `${p.uid}:${ch.id}`;
                if (seen.has(key)) return;
                if (p.uid !== uid && !ch.participants.includes(uid)) return;
                seen.add(key);
                list.push({ ...ch, key, creatorName: p.uid === uid ? "You" : asStr(p.name) || "Friend" });
            });
        });
        return list.sort((a, b) => b.startDate.localeCompare(a.startDate));
    }, [me, uid, friends]);

    // ── Search by email ──
    const handleSearch = async () => {
        const term = searchEmail.trim().toLowerCase();
        if (!term || !uid) return;
        setSearching(true); setSearchResult(null); setSentMsg("");
        try {
            const h = await hashEmail(term);
            if (!h) throw new Error("hash unavailable");
            const idx = await getDoc(doc(db, EMAIL_INDEX, h));
            const foundUid = idx.exists() ? asStr(idx.data()?.uid) : "";
            const found = foundUid ? await getDoc(doc(db, PUBLIC, foundUid)) : null;
            if (found?.exists()) {
                const fd = found.data();
                if (found.id === uid) setSearchResult({ error: "That's you!" });
                else if (friendIds.includes(found.id)) setSearchResult({ error: "Already friends!" });
                else setSearchResult({ uid: found.id, name: asStr(fd.name) || "Warrior", email: term, totalXP: numOr0(fd.totalXP), streak: numOr0(fd.streak), theyRequested: uidList(fd.outgoingRequests).includes(uid), theyListMe: uidList(fd.friends).includes(uid) });
            } else setSearchResult({ error: "No user found with that email (they need to open IGNITE once)." });
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
                setSentMsg("You're now friends!");
                addXP(10, "New friend connected");
            } else if (uidList(me.outgoingRequests).includes(target.uid)) {
                setSentMsg("Request already sent.");
            } else {
                await setDoc(myRef, { outgoingRequests: arrayUnion(target.uid), declinedRequests: arrayRemove(target.uid) }, { merge: true });
                setSentMsg("Request sent!");
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

    const tabs = [
        ["feed", "Feed"],
        ["leaderboard", "Leaderboard"],
        ["friends", `Friends (${friendIds.length})`],
        ["challenges", "Challenges"],
        ["requests", <span key="rq" className="inline-flex items-center gap-1.5">Requests{pendingRequests.length > 0 && <span className="min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-bold inline-flex items-center justify-center num" style={{ background: "var(--danger)", color: "#fff" }}>{pendingRequests.length}</span>}</span>],
    ];
    const outCount = uidList(me.outgoingRequests).length;

    return (
        <div className="page fade-in max-w-full overflow-x-hidden">
            {/* Tabs */}
            <div className="overflow-x-auto no-scrollbar">
                <Tabs tabs={tabs} value={tab} onChange={k => { setTab(k); if (k === "requests") reload(); }} label="Social sections" className="min-w-full w-max" />
            </div>

            {loadError && (
                <Card tone="rose" className="!py-3">
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-[13px]" style={{ color: "var(--danger)" }}>{loadError}</span>
                        <button type="button" className="link-btn shrink-0 min-h-[36px]" onClick={reload}><RotateCw size={14} />Retry</button>
                    </div>
                </Card>
            )}

            {/* ══ FEED TAB ══ */}
            {tab === "feed" && (
                <StaggerContainer style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {/* Post composer */}
                    <StaggerItem>
                        <Card>
                            <div className="flex gap-3">
                                <Avatar name={profile.name} size={38} />
                                <div className="flex-1 min-w-0">
                                    <textarea className="inp" rows={2} aria-label="Write a post" placeholder="Share your progress, thoughts, or wins…" value={postText} onChange={e => setPostText(e.target.value)} style={{ resize: "none" }} />
                                    <div className="flex justify-end mt-2">
                                        <button type="button" className="bp !py-2 !px-5 !text-[13px]" onClick={createPost} disabled={!postText.trim() || posting}><Send size={15} />Post</button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </StaggerItem>

                    {/* Feed items */}
                    {feedItems.length === 0 && !loading && !loadError && (
                        <Card><EmptyState icon={Rss} title="No feed yet">Add friends to see their workouts and achievements!</EmptyState></Card>
                    )}

                    {feedItems.map((item, i) => (
                        <StaggerItem key={`${item.type}-${item.uid}-${item.id ?? item.time}-${i}`}>
                            <Card>
                                <div className="flex items-center gap-3 mb-2.5">
                                    <Avatar name={item.user} size={34} />
                                    <div className="flex-1 min-w-0 flex items-baseline gap-2">
                                        <span className="row-title truncate">{item.user}</span>
                                        <span className="text-[12px] shrink-0" style={{ color: "var(--text-dim)" }}>{timeAgo(item.time)}</span>
                                    </div>
                                </div>

                                {item.type === "workout" && (
                                    <div className="flex items-center gap-3">
                                        <IconBadge icon={Dumbbell} tone="orange" size={34} />
                                        <div className="min-w-0">
                                            <div className="text-[13.5px]" style={{ color: "var(--text-secondary)" }}>Completed a workout: <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{item.data?.splitName || "Training"}</span></div>
                                            {item.data?.calBurned > 0 && <div className="text-[12px] mt-0.5 num" style={{ color: "var(--text-dim)" }}>{item.data.calBurned} cal · {Math.round((item.data.duration || 0) / 60)} min</div>}
                                        </div>
                                    </div>
                                )}

                                {item.type === "post" && (() => {
                                    const likers = likersOf(item.uid, item.id);
                                    const liked = likers.includes(uid);
                                    return (
                                        <div>
                                            <div className="text-[14px] leading-normal whitespace-pre-wrap break-words" style={{ color: "var(--text-primary)" }}>{item.text}</div>
                                            <div className="flex mt-2">
                                                <button type="button" onClick={() => likePost(item.uid, item.id)} aria-pressed={liked} aria-label={liked ? "Unlike" : "Like"}
                                                    className="inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-full border-0 text-[13px] font-semibold num"
                                                    style={{ background: liked ? "color-mix(in srgb, var(--danger) 12%, transparent)" : "var(--ghost-bg)", color: liked ? "var(--danger)" : "var(--text-secondary)" }}>
                                                    <span aria-hidden="true">{liked ? "❤️" : "🤍"}</span>{likers.length}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {item.type === "streak" && (
                                    <div className="flex items-center gap-3">
                                        <IconBadge icon={Flame} tone="orange" size={34} />
                                        <div className="text-[13.5px]" style={{ color: "var(--text-secondary)" }}>Reached a <span className="font-bold" style={{ color: "var(--tone-orange)" }}>{item.streak}-day streak</span>!</div>
                                    </div>
                                )}

                                {item.type === "level" && (
                                    <div className="flex items-center gap-3">
                                        <IconBadge icon={TrendingUp} tone="violet" size={34} />
                                        <div className="text-[13.5px]" style={{ color: "var(--text-secondary)" }}>Leveled up to <span className="font-bold" style={{ color: "var(--tone-violet)" }}>Level {item.level}</span> · {item.rank}</div>
                                    </div>
                                )}
                            </Card>
                        </StaggerItem>
                    ))}
                </StaggerContainer>
            )}

            {/* ══ LEADERBOARD TAB ══ */}
            {tab === "leaderboard" && (
                <Card title="XP leaderboard" action={<button type="button" className="link-btn min-h-[36px]" onClick={reload}><RotateCw size={14} />Refresh</button>}>
                    {friendProfiles.length === 0 ? (
                        <EmptyState icon={Trophy} title="No friends yet" action={<button type="button" className="bp" onClick={() => setTab("friends")}><UserPlus size={16} />Add friends</button>}>Add friends to see the leaderboard!</EmptyState>
                    ) : (
                        <div>
                            {/* Add yourself to the list */}
                            {[{ uid: uid || "me", name: profile.name || "You", totalXP, streak, workouts: myWorkouts, isMe: true }, ...friendProfiles]
                                .sort((a, b) => b.totalXP - a.totalXP)
                                .map((p, i) => {
                                    const lv = getLevel(p.totalXP);
                                    const rank = p.isMe ? playerRank(system, lv) : p.rank ? rankById(p.rank) : getRank(lv);
                                    const podium = PODIUM_TONE[i];
                                    return (
                                        <div key={p.uid} className="list-row">
                                            <span className="w-7 h-7 rounded-full shrink-0 inline-flex items-center justify-center text-[13px] font-extrabold num"
                                                style={podium ? { background: `color-mix(in srgb, var(--tone-${podium}) 18%, transparent)`, color: `var(--tone-${podium})` } : { color: "var(--text-dim)" }}
                                                aria-label={`Rank ${i + 1}`}>{i + 1}</span>
                                            <Avatar name={p.name} size={36} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <span className="row-title truncate" style={p.isMe ? { color: "var(--accent)" } : undefined}>{p.name}</span>
                                                    {p.isMe && <Pill tone="sky" className="!py-0.5 !px-2 !text-[11px]">You</Pill>}
                                                </div>
                                                <div className="row-sub truncate">Lv.{lv} · <span style={rank.color ? { color: rank.color } : undefined}>{rank.name}</span> · {p.workouts || 0} workouts</div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className="text-[15px] font-extrabold num" style={{ color: "var(--text-primary)" }}>{p.totalXP.toLocaleString()}</div>
                                                <div className="text-[11px]" style={{ color: "var(--text-dim)" }}>XP</div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </Card>
            )}

            {/* ══ FRIENDS TAB ══ */}
            {tab === "friends" && (
                <>
                    {/* Search */}
                    <Card title="Add friend by email">
                        <div className="flex gap-2">
                            <input className="inp flex-1" type="email" aria-label="Friend's email" placeholder="friend@email.com" value={searchEmail} onChange={e => setSearchEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()} />
                            <button type="button" className="bp !px-4 shrink-0" onClick={handleSearch} disabled={searching} aria-label="Search">{searching ? "…" : <Search size={17} />}</button>
                        </div>
                        {sentMsg && <div className="text-[13px] mt-2" style={{ color: "var(--accent)" }}>{sentMsg}</div>}

                        {searchResult && !searchResult.error && (
                            <div className="mt-3 p-3 rounded-2xl flex items-center gap-3" style={{ background: "var(--ghost-bg)" }}>
                                <Avatar name={searchResult.name} size={38} />
                                <div className="flex-1 min-w-0">
                                    <div className="row-title truncate">{searchResult.name}</div>
                                    <div className="row-sub truncate num">{searchResult.email} · {searchResult.totalXP} XP</div>
                                </div>
                                <button type="button" className="bp !py-2 !px-4 !text-[13px] shrink-0" onClick={() => sendRequest(searchResult)}>{searchResult.theyRequested ? <><Check size={15} />Accept</> : <><UserPlus size={15} />Add</>}</button>
                            </div>
                        )}
                        {searchResult?.error && <div className="text-[13px] mt-2" style={{ color: "var(--warn)" }}>{searchResult.error}</div>}
                    </Card>

                    {/* Friends list */}
                    <Card title="Friends" sub={`${friendIds.length}`}>
                        {friendProfiles.length > 0 && (
                            <div>
                                {friendProfiles.map(f => (
                                    <div key={f.uid} className="list-row">
                                        <Avatar name={f.name} size={38} />
                                        <div className="flex-1 min-w-0">
                                            <div className="row-title truncate">{f.name}</div>
                                            <div className="row-sub num">Lv.{getLevel(f.totalXP)} · {f.totalXP.toLocaleString()} XP · {f.workouts} workouts</div>
                                        </div>
                                        {f.streak > 0 && <Pill tone="orange" icon={Flame} className="num">{f.streak}d</Pill>}
                                        <button type="button" className="icon-btn !w-9 !h-9 shrink-0" onClick={() => removeFriend(f.uid)} aria-label={`Remove ${f.name}`} style={{ background: "transparent", color: "var(--text-dim)" }}><X size={16} /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                        {friendIds.length === 0 && !loading && <EmptyState icon={Users} title="No friends yet">Search by email above!</EmptyState>}
                        {outCount > 0 && (
                            <div className="flex items-center justify-center gap-1.5 text-[12.5px] pt-3 mt-1" style={{ color: "var(--text-dim)", borderTop: friendProfiles.length > 0 ? "1px solid var(--line)" : undefined }}>
                                <Clock size={14} />{outCount} sent request{outCount !== 1 ? "s" : ""} awaiting response
                            </div>
                        )}
                    </Card>
                </>
            )}

            {/* ══ CHALLENGES TAB ══ */}
            {tab === "challenges" && (
                <>
                    {/* Create challenge */}
                    <Card title="Create group challenge">
                        <div className={`tile-grid ${friendIds.length === 0 ? "opacity-50" : ""}`}>
                            {[
                                { type: "workouts", label: "Most Workouts", sub: "7 days" },
                                { type: "xp", label: "XP Race", sub: "7 days" },
                                { type: "streak", label: "Streak Battle", sub: "14 days" },
                            ].map(ch => (
                                <Tile key={ch.type} icon={CHALLENGE_LOOK[ch.type][0]} tone={CHALLENGE_LOOK[ch.type][1]} label={ch.label} sub={ch.sub} onClick={() => createChallenge(ch.type)} />
                            ))}
                        </div>
                        {friendIds.length === 0 && <div className="text-[12.5px] mt-3 text-center" style={{ color: "var(--warn)" }}>Add friends first to create challenges!</div>}
                    </Card>

                    {/* Active challenges */}
                    <Card title="Challenges">
                        {challenges.length > 0 ? (
                            <div>
                                {challenges.map(ch => {
                                    const ended = /^\d{4}-\d{2}-\d{2}$/.test(asStr(ch.startDate)) && shiftDay(ch.startDate, Number(ch.duration) || 0) <= d;
                                    const [Icon, tone] = CHALLENGE_LOOK[ch.metric] || [Medal, "amber"];
                                    return (
                                        <div key={ch.key} className={`list-row ${ended ? "opacity-60" : ""}`}>
                                            <IconBadge icon={Icon} tone={tone} size={38} />
                                            <div className="flex-1 min-w-0">
                                                <div className="row-title truncate">{ch.title}</div>
                                                <div className="row-sub">By {ch.creatorName} · Started {ch.startDate} · {ch.duration} days{ended ? " · Ended" : ""}</div>
                                            </div>
                                            <Pill tone="sky" icon={Users} className="num">{toArr(ch.participants).length}</Pill>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <EmptyState icon={Trophy} title="No active challenges">Create one above!</EmptyState>
                        )}
                    </Card>
                </>
            )}

            {/* ══ REQUESTS TAB ══ */}
            {tab === "requests" && (
                <Card title="Friend requests">
                    {pendingRequests.length > 0 ? (
                        <div>
                            {pendingRequests.map(r => (
                                <div key={r.uid} className="list-row">
                                    <Avatar name={r.name} size={38} />
                                    <div className="flex-1 min-w-0">
                                        <div className="row-title truncate">{asStr(r.name) || "Warrior"}</div>
                                        <div className="row-sub num">Lv.{getLevel(Number(r.totalXP) || 0)} · {(Number(r.totalXP) || 0).toLocaleString()} XP</div>
                                    </div>
                                    <button type="button" className="bp !py-2 !px-3.5 !text-[13px] shrink-0" onClick={() => acceptRequest(r.uid)}><Check size={15} />Accept</button>
                                    <button type="button" className="icon-btn !w-9 !h-9 shrink-0" onClick={() => declineRequest(r.uid)} aria-label="Decline request"><X size={16} /></button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState icon={Inbox} title="No pending requests" />
                    )}
                </Card>
            )}

            {loading && <div className="text-center py-4 text-[13px]" style={{ color: "var(--text-dim)" }}>Loading…</div>}
        </div>
    );
}
