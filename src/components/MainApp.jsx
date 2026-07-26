"use client";
// MainApp — bridges old App.jsx into Next.js
// This imports your existing App component and renders it
// Gradually migrate pages out of App.jsx into Next.js routes

import App from './App';

export default function MainApp({ user }) {
    return <App externalUser={user} />;
}
