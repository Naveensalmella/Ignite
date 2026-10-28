"use client";
// The "appState" bundle some pages take (AI Coach, Profile, Badges), as a hook:
// it only changes when one of its fields changes (getAppState() builds a new object every call).
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import useAppStore from "./useAppStore";

const pick = (s) => ({
    foodLog: s.foodLog, habits: s.habits, habitLog: s.habitLog, tasks: s.tasks, journal: s.journal,
    finances: s.finances, profile: s.profile, user: s.user, pillarProg: s.pillarProg, focusLog: s.focusLog,
    workoutLog: s.workoutLog, chatHistory: s.chatHistory, routineData: s.routineData, masteryData: s.masteryData,
    bodyData: s.bodyData, challengeData: s.challengeData, freezeData: s.freezeData, programState: s.programState,
    xpLog: s.xpLog, loginData: s.loginData, activeTitle: s.activeTitle, questChainData: s.questChainData, system: s.system,
});

export function useAppState() {
    const s = useAppStore(useShallow(pick));
    return useMemo(() => ({
        foodLog: s.foodLog || {}, habits: s.habits || [], habitLog: s.habitLog || {},
        tasks: s.tasks || [], journal: s.journal || {}, finances: s.finances || [],
        profile: s.profile || {}, user: s.user, pillarProg: s.pillarProg || {},
        focusLog: s.focusLog || {}, workoutLog: s.workoutLog || {},
        oracleChats: s.chatHistory || [], routineData: s.routineData,
        masteryData: s.masteryData, bodyData: s.bodyData,
        challengeData: s.challengeData, freezeData: s.freezeData,
        programState: s.programState || {}, xpLog: s.xpLog || {},
        loginData: s.loginData || {}, activeTitle: s.activeTitle,
        questChainData: s.questChainData || {}, system: s.system,
    }), [s]);
}

/** Subscribe to just these store keys (shallow-compared), e.g. useStoreKeys(["workoutLog", "addXP"]). */
export function useStoreKeys(keys) {
    return useAppStore(useShallow((s) => {
        const o = {};
        for (const k of keys) o[k] = s[k];
        return o;
    }));
}
