import { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../firebase';

const googleProvider = new GoogleAuthProvider();

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login"); // login | signup | forgot
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const clearError = () => setError("");

  // ── Email/Password Login ──
  const handleLogin = async () => {
    if (!email || !pass) return setError("Enter email and password");
    setLoading(true); clearError();
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      onAuth?.(cred.user);
    } catch (e) {
      if (e.code === "auth/user-not-found") setError("No account found. Sign up first.");
      else if (e.code === "auth/wrong-password") setError("Wrong password. Try again or reset it.");
      else if (e.code === "auth/invalid-email") setError("Invalid email format.");
      else if (e.code === "auth/too-many-requests") setError("Too many attempts. Try again later or reset password.");
      else if (e.code === "auth/invalid-credential") setError("Invalid email or password.");
      else setError(e.message);
    }
    setLoading(false);
  };

  // ── Email/Password Sign Up ──
  const handleSignup = async () => {
    if (!email || !pass) return setError("Enter email and password");
    if (pass.length < 6) return setError("Password must be at least 6 characters");
    if (!name.trim()) return setError("Enter your name");
    setLoading(true); clearError();
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(cred.user, { displayName: name.trim() });
      onAuth?.(cred.user);
    } catch (e) {
      if (e.code === "auth/email-already-in-use") setError("Email already registered. Try logging in.");
      else if (e.code === "auth/weak-password") setError("Password too weak. Use at least 6 characters.");
      else if (e.code === "auth/invalid-email") setError("Invalid email format.");
      else setError(e.message);
    }
    setLoading(false);
  };

  // ── Google Sign-In ──
  const handleGoogle = async () => {
    setLoading(true); clearError();
    try {
      const result = await signInWithPopup(auth, googleProvider);
      onAuth?.(result.user);
    } catch (e) {
      if (e.code === "auth/popup-closed-by-user") setError("Sign-in cancelled.");
      else if (e.code === "auth/popup-blocked") setError("Popup blocked. Allow popups and try again.");
      else if (e.code === "auth/cancelled-popup-request") { /* ignore */ }
      else setError(e.message);
    }
    setLoading(false);
  };

  // ── Forgot Password ──
  const handleReset = async () => {
    if (!email) return setError("Enter your email address first");
    setLoading(true); clearError();
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (e) {
      if (e.code === "auth/user-not-found") setError("No account found with this email.");
      else if (e.code === "auth/invalid-email") setError("Invalid email format.");
      else setError(e.message);
    }
    setLoading(false);
  };

  const switchMode = (m) => { setMode(m); clearError(); setResetSent(false); };

  const inputStyle = {
    width: "100%", padding: "14px 16px", borderRadius: 10, fontSize: 14,
    background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)",
    color: "#f3f4f6", outline: "none", marginBottom: 10,
    transition: "border .2s",
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#07090d", padding: 20,
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🔥</div>
          <h1 style={{
            fontSize: 36, fontWeight: 900, fontFamily: "Rajdhani,sans-serif",
            background: "linear-gradient(135deg, #10b981, #06b6d4)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            letterSpacing: 3,
          }}>IGNITE</h1>
          <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
            {mode === "forgot" ? "Reset your password" : mode === "signup" ? "Create your warrior account" : "Welcome back, warrior"}
          </p>
        </div>

        {/* ── FORGOT PASSWORD ── */}
        {mode === "forgot" && (
          <div className="gs" style={{ padding: 24 }}>
            {resetSent ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📧</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#22c55e", fontFamily: "Rajdhani,sans-serif" }}>Reset Email Sent!</div>
                <p style={{ fontSize: 13, color: "#6b7280", marginTop: 8 }}>
                  Check your inbox at <span style={{ color: "#10b981" }}>{email}</span>. Click the link in the email to set a new password.
                </p>
                <p style={{ fontSize: 12, color: "#4b5563", marginTop: 8 }}>Don't see it? Check spam folder.</p>
                <button onClick={() => switchMode("login")}
                  className="bp" style={{ marginTop: 16, padding: "12px 32px" }}>
                  ← Back to Login
                </button>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 14, color: "#d1d5db", marginBottom: 16 }}>
                  Enter your email and we'll send you a link to reset your password.
                </div>
                <input
                  type="email" placeholder="Your email address" value={email}
                  onChange={e => { setEmail(e.target.value); clearError(); }}
                  onKeyDown={e => e.key === "Enter" && handleReset()}
                  style={inputStyle}
                />
                {error && <div style={{ fontSize: 12, color: "#ef4444", marginBottom: 10, padding: "8px 12px", borderRadius: 8, background: "rgba(239,68,68,.06)" }}>{error}</div>}
                <button onClick={handleReset} disabled={loading}
                  className="bp" style={{ width: "100%", padding: 14, fontSize: 15, marginBottom: 12 }}>
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
                <div style={{ textAlign: "center" }}>
                  <span onClick={() => switchMode("login")}
                    style={{ fontSize: 13, color: "#10b981", cursor: "pointer" }}>
                    ← Back to Login
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── LOGIN / SIGNUP ── */}
        {mode !== "forgot" && (
          <div className="gs" style={{ padding: 24 }}>
            {/* Google Sign-In */}
            <button onClick={handleGoogle} disabled={loading}
              style={{
                width: "100%", padding: "13px 16px", borderRadius: 10, fontSize: 14,
                fontWeight: 600, cursor: "pointer", border: "1px solid rgba(255,255,255,.1)",
                background: "rgba(255,255,255,.04)", color: "#f3f4f6",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                marginBottom: 16, transition: "all .2s",
              }}>
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.06)" }} />
              <span style={{ fontSize: 11, color: "#4b5563" }}>or with email</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.06)" }} />
            </div>

            {/* Name (signup only) */}
            {mode === "signup" && (
              <input
                type="text" placeholder="Your name" value={name}
                onChange={e => { setName(e.target.value); clearError(); }}
                style={inputStyle}
              />
            )}

            {/* Email */}
            <input
              type="email" placeholder="Email address" value={email}
              onChange={e => { setEmail(e.target.value); clearError(); }}
              style={inputStyle}
            />

            {/* Password */}
            <input
              type="password" placeholder={mode === "signup" ? "Create password (6+ chars)" : "Password"}
              value={pass}
              onChange={e => { setPass(e.target.value); clearError(); }}
              onKeyDown={e => e.key === "Enter" && (mode === "login" ? handleLogin() : handleSignup())}
              style={inputStyle}
            />

            {/* Forgot Password (login only) */}
            {mode === "login" && (
              <div style={{ textAlign: "right", marginBottom: 12 }}>
                <span onClick={() => switchMode("forgot")}
                  style={{ fontSize: 12, color: "#10b981", cursor: "pointer" }}>
                  Forgot password?
                </span>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{
                fontSize: 12, color: "#ef4444", marginBottom: 10,
                padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,.06)",
                border: "1px solid rgba(239,68,68,.1)",
              }}>{error}</div>
            )}

            {/* Submit */}
            <button
              onClick={mode === "login" ? handleLogin : handleSignup}
              disabled={loading}
              className="bp"
              style={{ width: "100%", padding: 14, fontSize: 15, letterSpacing: 1, marginBottom: 14 }}>
              {loading ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
            </button>

            {/* Switch mode */}
            <div style={{ textAlign: "center", fontSize: 13, color: "#6b7280" }}>
              {mode === "login" ? (
                <>Don't have an account? <span onClick={() => switchMode("signup")} style={{ color: "#10b981", cursor: "pointer", fontWeight: 600 }}>Sign Up</span></>
              ) : (
                <>Already have an account? <span onClick={() => switchMode("login")} style={{ color: "#10b981", cursor: "pointer", fontWeight: 600 }}>Login</span></>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: "#4b5563" }}>
          By continuing, you agree to IGNITE's terms of service.
        </div>
      </div>
    </div>
  );
}