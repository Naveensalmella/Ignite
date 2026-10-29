"use client";
import { useId } from "react";

// The IGNITE logo: a flame inside an XP ring, on the app's hero gradient.
// Same artwork as public/ignite-logo.svg (the favicon and home-screen icons are rendered from it).
// `animated` fills the ring on a loop (the loading screen); it stays still for reduced-motion users.
const FLAME = "M270 64C288 136 386 186 386 312C386 386 328 442 256 442C184 442 126 386 126 312C126 252 154 208 192 180C190 222 204 250 228 262C212 188 232 116 270 64Z";
const RING = 2 * Math.PI * 166; // ring circumference
const FILLED = RING * 0.72;     // how much of the ring the still logo shows

export default function BrandMark({ size = 48, animated = false, className = "", style }) {
  const id = `ig${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`; // unique per logo on the page
  return (
    <svg viewBox="0 0 512 512" width={size} height={size} className={className} style={style} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0f766e" />
          <stop offset=".55" stopColor="#2563eb" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".16" />
          <stop offset=".5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="116" fill={`url(#${id}g)`} />
      <rect width="512" height="512" rx="116" fill={`url(#${id}s)`} />
      <circle cx="256" cy="262" r="166" fill="none" stroke="#fff" strokeOpacity=".28" strokeWidth="30" />
      <circle cx="256" cy="262" r="166" fill="none" stroke="#fff" strokeWidth="30" strokeLinecap="round" transform="rotate(-90 256 262)"
        strokeDasharray={`${FILLED} ${RING}`} className={animated ? "brand-ring-fill" : undefined} style={animated ? { "--ring": RING, "--filled": FILLED } : undefined} />
      <path d={FLAME} fill="#fff" transform="translate(256 262) scale(.58) translate(-256 -253)" />
    </svg>
  );
}
