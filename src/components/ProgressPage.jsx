"use client";
// Body progress: photos and measurements in one place (was two separate pages).
import { useState, lazy, Suspense } from "react";
import { SkeletonPage } from "./Loading";
import { Tabs } from "@/components/ui/kit";

const BodyProgress = lazy(() => import("./BodyProgress"));
const BodyTracker = lazy(() => import("./BodyTracker"));

const TABS = [["photos", "Photos"], ["measurements", "Measurements"]];

export default function ProgressPage({ bodyPhotos, setBodyPhotos, userId, bodyData, setBodyData, initialTab = "photos" }) {
    const [tab, setTab] = useState(initialTab);
    return (
        <div className="page fade-in">
            <Tabs tabs={TABS} value={tab} onChange={setTab} label="Progress type" />
            <Suspense fallback={<SkeletonPage />}>
                {tab === "photos"
                    ? <BodyProgress bodyPhotos={bodyPhotos} setBodyPhotos={setBodyPhotos} userId={userId} />
                    : <BodyTracker bodyData={bodyData} setBodyData={setBodyData} />}
            </Suspense>
        </div>
    );
}
