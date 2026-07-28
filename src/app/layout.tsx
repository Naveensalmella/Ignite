import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IGNITE — Level Up Your Life",
  description: "Gamified self-improvement RPG. Track workouts, nutrition, habits. Earn XP, level up, compete with friends.",
  manifest: "/manifest.json",
  keywords: ["fitness", "self-improvement", "RPG", "workout tracker", "nutrition", "gamification"],
  authors: [{ name: "Naveen Salmella" }],
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
  maximumScale: 1,
  userScalable: false,
  themeColor: "#07090d",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/ignite-logo.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-screen bg-[#07090d] text-[#f3f4f6] antialiased">
        {children}
      </body>
    </html>
  );
}