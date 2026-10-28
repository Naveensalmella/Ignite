"use client";
// One small wrapper per page: each subscribes to exactly the store fields its page needs,
// so an XP gain or a save-status change doesn't re-render every page through <App>.
import { lazy } from "react";
import { useAppState, useStoreKeys } from "@/stores/useAppState";

// ── Lazy-loaded pages (code splitting) ──
const StatusPage = lazy(() => import("./system/StatusPage"));
const QuestsPage = lazy(() => import("./system/QuestsPage"));
const InventoryPage = lazy(() => import("./system/InventoryPage"));
const ProgressPage = lazy(() => import("./ProgressPage"));
const ShadowArmyPage = lazy(() => import("./system/ShadowArmyPage"));
const TrainingPage = lazy(() => import("./TrainingPage"));
const Nutrition = lazy(() => import("./Nutrition"));
const MissionsPage = lazy(() => import("./MissionsPage"));
const FocusTimer = lazy(() => import("./FocusTimer"));
const Wellness = lazy(() => import("./Wellness"));
const FinancePage = lazy(() => import("./FinancePage"));
const FlameOracle = lazy(() => import("./FlameOracle"));
const ProfilePage = lazy(() => import("./ProfilePage"));
const RoutinePage = lazy(() => import("./RoutinePage"));
const SocialPage = lazy(() => import("./SocialPage"));
const ShareCard = lazy(() => import("./ShareCard"));

const K = {
    training: ["totalXP", "addXP", "workoutLog", "setWorkoutLog", "profile", "programState", "setProgramState"],
    nutrition: ["foodLog", "setFoodLog", "addXP", "profile"],
    missions: ["tasks", "setTasks", "addXP"],
    focus: ["addXP", "focusLog", "setFocusLog"],
    wellness: ["journal", "setJournal", "addXP"],
    finance: ["finances", "setFinances", "addXP"],
    routine: ["profile", "routineData", "setRoutineData"],
    oracle: ["addXP", "setFoodLog", "setChatHistory", "setPage", "profile", "totalXP", "streak", "workoutLog"],
    profile: ["profile", "setProfile", "user", "logout", "totalXP", "streak", "workoutLog", "activityLog", "freezeData", "setPage"],
    share: ["totalXP", "streak", "workoutLog", "profile"],
    bodyphotos: ["bodyPhotos", "setBodyPhotos", "user", "bodyData", "setBodyData"],
    social: ["user", "profile", "totalXP", "streak", "workoutLog", "addXP"],
};

const Training = () => <TrainingPage {...useStoreKeys(K.training)} />;
const Food = () => <Nutrition {...useStoreKeys(K.nutrition)} />;
const Missions = () => <MissionsPage {...useStoreKeys(K.missions)} />;
const Focus = () => <FocusTimer {...useStoreKeys(K.focus)} />;
const Well = () => <Wellness {...useStoreKeys(K.wellness)} />;
const Finance = () => <FinancePage {...useStoreKeys(K.finance)} />;
const Routine = () => <RoutinePage {...useStoreKeys(K.routine)} />;
const Share = () => <ShareCard {...useStoreKeys(K.share)} />;
const Social = () => <SocialPage {...useStoreKeys(K.social)} />;

function Oracle() {
    const p = useStoreKeys(K.oracle);
    const appState = useAppState();
    return <FlameOracle appState={appState} {...p} />;
}

function Profile() {
    const { logout, ...p } = useStoreKeys(K.profile);
    const appState = useAppState();
    return <ProfilePage {...p} onLogout={logout} appState={appState} />;
}

function Body({ page }) {
    const { user, ...p } = useStoreKeys(K.bodyphotos);
    return <ProgressPage {...p} userId={user?.uid} initialTab={page === "body" ? "measurements" : "photos"} />;
}

/** `current` = resolved page key, `page` = the raw key (old aliases pick a starting tab). */
export default function PageRoute({ current, page }) {
    switch (current) {
        case "quests": return <QuestsPage initialTab={page === "growth" ? "long" : page === "dailyquest" ? "habits" : "daily"} />;
        case "inventory": return <InventoryPage initialTab={page === "gaming" || page === "badges" ? "achievements" : page === "shop" ? "shop" : page === "titles" ? "titles" : "inventory"} />;
        case "army": return <ShadowArmyPage />;
        case "training": return <Training />;
        case "nutrition": return <Food />;
        case "missions": return <Missions />;
        case "focus": return <Focus />;
        case "wellness": return <Well />;
        case "finance": return <Finance />;
        case "routine": return <Routine />;
        case "oracle": return <Oracle />;
        case "profile": return <Profile />;
        case "share": return <Share />;
        case "bodyphotos": return <Body page={page} />;
        case "social": return <Social />;
        default: return <StatusPage />;
    }
}
