"use client";
import { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Flame, Mail, Lock, User, ArrowLeft, MailCheck, CircleAlert } from 'lucide-react';
import { IconBadge } from '@/components/ui/kit';

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

  const linkStyle = { color: "var(--accent)" };

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-8" style={{ background: "var(--bg)" }}>
      <div className="w-full fade-in" style={{ maxWidth: 400 }}>
        {/* Brand */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex items-center justify-center"
            style={{ width: 60, height: 60, borderRadius: 20, background: "var(--hero-gradient)", color: "#fff", boxShadow: "0 12px 28px rgba(37, 99, 235, .28)" }}
            aria-hidden="true">
            <Flame size={30} strokeWidth={2.2} />
          </div>
          <h1 className="text-accent-grad text-[30px] font-extrabold" style={{ letterSpacing: 4 }}>IGNITE</h1>
          <p className="text-[13.5px] mt-1" style={{ color: "var(--text-secondary)" }}>
            {mode === "forgot" ? "Reset your password" : mode === "signup" ? "Create your Hunter account" : "Welcome back, Hunter"}
          </p>
        </div>

        {/* ── FORGOT PASSWORD ── */}
        {mode === "forgot" && (
          <div className="card" style={{ padding: 22 }}>
            {resetSent ? (
              <div className="text-center">
                <div className="flex justify-center mb-3"><IconBadge icon={MailCheck} tone="teal" size={52} /></div>
                <div className="text-[18px] font-bold" style={{ color: "var(--text-primary)" }}>Reset email sent</div>
                <p className="text-[13px] mt-2" style={{ color: "var(--text-secondary)" }}>
                  Check your inbox at <span className="font-semibold" style={linkStyle}>{email}</span>. Click the link in the email to set a new password.
                </p>
                <p className="text-[12px] mt-2" style={{ color: "var(--text-dim)" }}>Don&apos;t see it? Check your spam folder.</p>
                <button type="button" onClick={() => switchMode("login")} className="bp w-full mt-5">
                  <ArrowLeft size={16} /> Back to login
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="text-[13.5px]" style={{ color: "var(--text-secondary)" }}>
                  Enter your email and we&apos;ll send you a link to reset your password.
                </div>
                <Field icon={Mail}>
                  <input
                    type="email" placeholder="Your email address" value={email} aria-label="Email address" autoComplete="email"
                    onChange={e => { setEmail(e.target.value); clearError(); }}
                    onKeyDown={e => e.key === "Enter" && handleReset()}
                    className="inp" style={{ paddingLeft: 42 }}
                  />
                </Field>
                {error && <ErrorNote>{error}</ErrorNote>}
                <button type="button" onClick={handleReset} disabled={loading} className="bp w-full" style={{ padding: "13px 18px", fontSize: 15 }}>
                  {loading ? "Sending..." : "Send reset link"}
                </button>
                <div className="text-center">
                  <button type="button" onClick={() => switchMode("login")} className="link-btn" style={{ minHeight: 36 }}>
                    <ArrowLeft size={14} /> Back to login
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── LOGIN / SIGNUP ── */}
        {mode !== "forgot" && (
          <div className="card flex flex-col gap-3" style={{ padding: 22 }}>
            {/* Google Sign-In */}
            <button type="button" onClick={handleGoogle} disabled={loading} className="bg w-full" style={{ padding: "12px 18px" }}>
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px" style={{ background: "var(--line)" }} />
              <span className="text-[11.5px]" style={{ color: "var(--text-dim)" }}>or with email</span>
              <div className="flex-1 h-px" style={{ background: "var(--line)" }} />
            </div>

            {/* Name (signup only) */}
            {mode === "signup" && (
              <Field icon={User}>
                <input
                  type="text" placeholder="Your name" value={name} aria-label="Your name" autoComplete="name"
                  onChange={e => { setName(e.target.value); clearError(); }}
                  className="inp" style={{ paddingLeft: 42 }}
                />
              </Field>
            )}

            {/* Email */}
            <Field icon={Mail}>
              <input
                type="email" placeholder="Email address" value={email} aria-label="Email address" autoComplete="email"
                onChange={e => { setEmail(e.target.value); clearError(); }}
                className="inp" style={{ paddingLeft: 42 }}
              />
            </Field>

            {/* Password */}
            <Field icon={Lock}>
              <input
                type="password" placeholder={mode === "signup" ? "Create password (6+ chars)" : "Password"}
                aria-label="Password" autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={pass}
                onChange={e => { setPass(e.target.value); clearError(); }}
                onKeyDown={e => e.key === "Enter" && (mode === "login" ? handleLogin() : handleSignup())}
                className="inp" style={{ paddingLeft: 42 }}
              />
            </Field>

            {/* Forgot Password (login only) */}
            {mode === "login" && (
              <div className="text-right -mt-1">
                <button type="button" onClick={() => switchMode("forgot")} className="link-btn text-[12.5px]" style={{ minHeight: 28 }}>
                  Forgot password?
                </button>
              </div>
            )}

            {/* Error */}
            {error && <ErrorNote>{error}</ErrorNote>}

            {/* Submit */}
            <button
              type="button"
              onClick={mode === "login" ? handleLogin : handleSignup}
              disabled={loading}
              className="bp w-full"
              style={{ padding: "13px 18px", fontSize: 15 }}>
              {loading ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
            </button>

            {/* Switch mode */}
            <div className="text-center text-[13px]" style={{ color: "var(--text-secondary)" }}>
              {mode === "login" ? (
                <>Don&apos;t have an account? <button type="button" onClick={() => switchMode("signup")} className="link-btn" style={{ minHeight: 36 }}>Sign up</button></>
              ) : (
                <>Already have an account? <button type="button" onClick={() => switchMode("login")} className="link-btn" style={{ minHeight: 36 }}>Log in</button></>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-5 text-[11.5px]" style={{ color: "var(--text-dim)" }}>
          By continuing, you agree to IGNITE&apos;s terms of service.
        </div>
      </div>
    </div>
  );
}

/** Input with a leading line icon. */
function Field({ icon: Icon, children }) {
  return (
    <div className="relative">
      <Icon size={17} aria-hidden="true" className="absolute pointer-events-none" style={{ left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }} />
      {children}
    </div>
  );
}

function ErrorNote({ children }) {
  return (
    <div role="alert" className="flex items-start gap-2 text-[12.5px] px-3 py-2.5 rounded-xl"
      style={{ color: "var(--danger)", background: "color-mix(in srgb, var(--danger) 10%, transparent)" }}>
      <CircleAlert size={15} className="shrink-0 mt-px" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
