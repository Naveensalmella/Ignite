"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import AuthPage from "@/components/AuthPage";
import MainApp from "@/components/MainApp";
import Loading from "@/components/Loading";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return <Loading />;
  if (!user) return <AuthPage />;
  return <MainApp user={user} />;
}
