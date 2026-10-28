"use client";
// Body progress: photos and measurements in one place (was two separate pages).
import { useState, lazy, Suspense } from "react";
import { SkeletonPage } from "./Loading";

const BodyProgress = lazy(() => import("./BodyProgress"));
const BodyTracker = lazy(() => import("./BodyTracker"));

export default function ProgressPage({ bodyPhotos, setBodyPhotos, userId, bodyData, setBodyData, initialTab = "photos" }) {
    const [tab, setTab] = useState(initialTab);
    return (
        <div className="fade-in">
            <div className="seg mb-4" role="tablist" aria-label="Progress type">
                {[["photos", "Photos"], ["measurements", "Measurements"]].map(([k, l]) => (
                    <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? "is-active" : ""} onClick={() => setTab(k)}>{l}</button>
                ))}
            </div>
            <Suspense fallback={<SkeletonPage />}>
                {tab === "photos"
                    ? <BodyProgress bodyPhotos={bodyPhotos} setBodyPhotos={setBodyPhotos} userId={userId} />
                    : <BodyTracker bodyData={bodyData} setBodyData={setBodyData} />}
            </Suspense>
        </div>
    );
}
