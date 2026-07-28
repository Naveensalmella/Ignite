"use client";

import { useState, useEffect, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import AuthPage from "@/components/AuthPage";
import MainApp from "@/components/MainApp";
import Loading from "@/components/Loading";
import IntroPage from "@/components/IntroPage";
import SplashScreen from "@/components/SplashScreen";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    const hasVisited = localStorage.getItem("ignite_visited");
    if (!hasVisited) setShowIntro(true);

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  const handleGetStarted = () => {
    localStorage.setItem("ignite_visited", "true");
    setShowIntro(false);
  };

  // Splash screen shows FIRST every time
  if (showSplash) return <SplashScreen onComplete={handleSplashComplete} />;

  if (loading) return <Loading />;
  if (showIntro && !user) return <IntroPage onGetStarted={handleGetStarted} />;
  if (!user) return <AuthPage />;
  return <MainApp user={user} />;
}