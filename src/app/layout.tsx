import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IGNITE — Level Up Your Life",
  description: "Gamified self-improvement RPG. Track workouts, nutrition, habits. Earn XP, level up, compete with friends.",
  manifest: "/manifest.json",
  keywords: ["fitness", "self-improvement", "RPG", "workout tracker", "nutrition", "gamification"],
  authors: [{ name: "Naveen Salmella" }],
  icons: {
    icon: [{ url: "/ignite-logo.svg", type: "image/svg+xml" }, { url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: { capable: true, title: "IGNITE", statusBarStyle: "black-translucent" },
  openGraph: {
    title: "IGNITE — Level Up Your Life",
    description: "The gamified self-improvement platform. Train, eat right, build habits, and level up.",
    type: "website",
    siteName: "IGNITE",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // No themeColor here: the app picks its own theme (saved choice, else the OS preference),
  // so the inline script below writes <meta name="theme-color"> and ThemeToggle updates it.
};

// Apply the theme before first paint so there is no dark/light flash: the saved choice,
// or the OS preference on first run. Also sets <meta name="theme-color"> to the theme's --bg.
const themeScript = `try{var t=localStorage.getItem("ignite-theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia&&matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}var d=document.documentElement;if(t==="light"){d.setAttribute("data-theme","light")}else{d.classList.add("dark")}var c=t==="light"?"#f4f6fb":"#0f1115",m=function(){var e=document.querySelectorAll('meta[name="theme-color"]');if(!e.length){var n=document.createElement("meta");n.name="theme-color";document.head.appendChild(n);e=[n]}e.forEach(function(x){x.removeAttribute("media");x.content=c})};m();document.addEventListener("DOMContentLoaded",m)}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
