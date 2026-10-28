"use client";

import App from "@/components/App";

// The whole app is a client-side SPA: auth, intro, onboarding and every page
// are handled inside <App /> so there is exactly one auth listener.
export default function Home() {
  return <App />;
}
