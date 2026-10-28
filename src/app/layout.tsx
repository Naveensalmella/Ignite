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
    apple: [{ url: "/icon-192.png", sizes: "192x192" }],
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#07090d" },
  ],
};

// Apply the saved theme before first paint so there is no dark/light flash.
const themeScript = `try{var t=localStorage.getItem("ignite-theme");if(t==="light"){document.documentElement.setAttribute("data-theme","light")}else{document.documentElement.classList.add("dark")}}catch(e){}`;

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
