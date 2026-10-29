"use client";
import { useId } from "react";

// The IGNITE logo: a flame with a "level up" arrow cut out, on the app's hero gradient.
// Same artwork as public/ignite-logo.svg (the favicon and home-screen icons are rendered from it).
export const FLAME = "M270 64C288 136 386 186 386 312C386 386 328 442 256 442C184 442 126 386 126 312C126 252 154 208 192 180C190 222 204 250 228 262C212 188 232 116 270 64Z";
export const ARROW = "M256 282L328 354L298 384L256 342L214 384L184 354Z";

export default function BrandMark({ size = 48, className = "", style }) {
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
        <mask id={`${id}m`}>
          <rect width="512" height="512" fill="#fff" />
          <path d={ARROW} />
        </mask>
      </defs>
      <rect width="512" height="512" rx="116" fill={`url(#${id}g)`} />
      <rect width="512" height="512" rx="116" fill={`url(#${id}s)`} />
      <path d={FLAME} fill="#fff" mask={`url(#${id}m)`} />
    </svg>
  );
}
