"use client";
import { useState, useRef, useCallback } from 'react';

export default function PullToRefresh({ onRefresh, children }) {
    const [pulling, setPulling] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const startY = useRef(0);
    const containerRef = useRef(null);

    const THRESHOLD = 80;

    const handleTouchStart = useCallback((e) => {
        if (containerRef.current?.scrollTop > 5) return;
        startY.current = e.touches[0].clientY;
        setPulling(true);
    }, []);

    const handleTouchMove = useCallback((e) => {
        if (!pulling || refreshing) return;
        const diff = e.touches[0].clientY - startY.current;
        if (diff > 0 && containerRef.current?.scrollTop <= 0) {
            setPullDistance(Math.min(diff * 0.4, 120));
            if (diff > 10) e.preventDefault();
        }
    }, [pulling, refreshing]);

    const handleTouchEnd = useCallback(async () => {
        if (pullDistance >= THRESHOLD && onRefresh) {
            setRefreshing(true);
            try { await onRefresh(); } catch { }
            setRefreshing(false);
        }
        setPulling(false);
        setPullDistance(0);
    }, [pullDistance, onRefresh]);

    return (
        <div
            ref={containerRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ width: "100%", minHeight: "100%", position: "relative" }}
        >
            {/* Pull indicator */}
            {(pullDistance > 0 || refreshing) && (
                <div style={{
                    display: "flex", justifyContent: "center", alignItems: "center",
                    height: refreshing ? 40 : pullDistance,
                    transition: refreshing ? "height .2s" : "none",
                    overflow: "hidden",
                }}>
                    <div style={{
                        width: 24, height: 24, borderRadius: "50%",
                        border: "2px solid rgba(255,255,255,.06)",
                        borderTopColor: "#10b981",
                        animation: refreshing ? "spin .6s linear infinite" : "none",
                        transform: refreshing ? "none" : `rotate(${pullDistance * 3}deg)`,
                        opacity: Math.min(1, pullDistance / THRESHOLD),
                    }} />
                    {pullDistance >= THRESHOLD && !refreshing && (
                        <span style={{ fontSize: 10, color: "#10b981", marginLeft: 8 }}>Release to refresh</span>
                    )}
                </div>
            )}
            {children}
        </div>
    );
}