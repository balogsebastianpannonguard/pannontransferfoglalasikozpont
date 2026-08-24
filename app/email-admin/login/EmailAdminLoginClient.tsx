"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function EmailAdminLoginClient() {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (error && shake) {
      const t = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(t);
    }
  }, [error, shake]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const normalizedEmail = email.trim();
    const normalizedPassword = password.trim();

    if (!normalizedEmail || !normalizedPassword) {
      setError("Kérjük, adja meg a hozzáférési adatokat.");
      setShake(true);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/email-admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          password: normalizedPassword,
        }),
        credentials: "include",
      });

      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        console.error("[Login] Response nem JSON:", text);
        throw new Error("A szerver válasza nem értelmezhető. Kérjük, frissítse az oldalt és próbálkozzon újra.");
      }

      if (!response.ok || !data.success) {
        setError(data.message || "Hibás bejelentkezési adatok.");
        setShake(true);
        setIsLoading(false);
        return;
      }

      const redirectTo = data.redirectTo || "/email-admin/dashboard";
      window.location.href = redirectTo;
    } catch (err) {
      console.error("[Login] Hiba:", err);
      const message =
        err instanceof Error ? err.message : "Hálózati hiba történt. Kérjük, próbálja újra.";
      setError(message);
      setShake(true);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="relative min-h-screen w-full bg-[#FAFAFA] text-admin-black font-sans flex items-center justify-center p-6 selection:bg-admin-yellow selection:text-white overflow-hidden">

      {/* ============ EPIC LIGHT ABSTRACT BACKGROUND - YELLOW THEME ============ */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#FAFAFA]" />

        <div
          className="absolute inset-0 opacity-50 mix-blend-multiply animate-float"
          style={{
            background:
              "radial-gradient(circle at 15% 25%, rgba(229,9,20,0.12) 0%, transparent 50%), radial-gradient(circle at 85% 15%, rgba(255,215,0,0.25) 0%, transparent 50%), radial-gradient(circle at 75% 85%, rgba(0,86,210,0.10) 0%, transparent 50%), radial-gradient(circle at 25% 80%, rgba(17,17,17,0.08) 0%, transparent 50%)",
            filter: "blur(70px)",
          }}
        />

        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#000000_1px,transparent_1px),linear-gradient(to_bottom,#000000_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      <div className="relative z-10 w-full max-w-[420px]">

        {/* BRANDING HEADER */}
        <div
          className={`text-center mb-8 ${isLoaded ? "animate-fade-in-up" : "opacity-0"}`}
          style={{ animationDelay: "0.1s", opacity: 0, animationFillMode: "forwards" }}
        >
          <div className="relative inline-flex items-center justify-center w-16 h-16 bg-white/80 backdrop-blur-xl rounded-[1.25rem] shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-white mb-6 group">
            <div className="absolute inset-0 rounded-[1.25rem] bg-gradient-to-br from-admin-yellow/10 to-admin-red/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <span className="relative font-black text-2xl tracking-tighter bg-gradient-to-br from-admin-yellow to-[#B8860B] bg-clip-text text-transparent">
              PT
            </span>
          </div>
          <h1 className="font-serif text-4xl font-bold tracking-tight text-admin-gray-900 mb-2">
            Email Küldő
          </h1>
          <p className="text-xs font-bold tracking-[0.25em] uppercase bg-gradient-to-r from-admin-red/80 via-admin-yellow to-admin-yellow bg-clip-text text-transparent">
            Pannon Transfer • Invite Center
          </p>
        </div>

        {/* LOGIN CARD */}
        <div
          className={`relative bg-white/70 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-white/60 overflow-hidden ${shake ? "animate-shake" : ""} ${isLoaded ? "animate-fade-in-up" : "opacity-0"}`}
          style={{ animationDelay: "0.2s", opacity: 0, animationFillMode: "forwards" }}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />

          <div className="px-8 sm:px-10 py-10">
            <form ref={formRef} onSubmit={submit} className="space-y-6">

              {/* EMAIL */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-[10px] font-black tracking-[0.2em] uppercase text-admin-gray-400 ml-1"
                >
                  E-mail cím
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-admin-yellow/30 to-admin-red/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    className="relative w-full bg-white/80 border border-admin-gray-200/60 rounded-2xl px-5 py-4 text-sm text-admin-gray-900 placeholder:text-admin-gray-400 outline-none transition-all duration-300 focus:bg-white focus:border-admin-yellow/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                    placeholder="admin@pannon.hu"
                    autoComplete="email"
                    spellCheck={false}
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label
                    htmlFor="password"
                    className="text-[10px] font-black tracking-[0.2em] uppercase text-admin-gray-400"
                  >
                    Jelszó
                  </label>
                </div>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-admin-yellow/30 to-admin-red/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                  <input
                    id="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    type={showPassword ? "text" : "password"}
                    className="relative w-full bg-white/80 border border-admin-gray-200/60 rounded-2xl pl-5 pr-14 py-4 text-sm text-admin-gray-900 placeholder:text-admin-gray-400 outline-none transition-all duration-300 focus:bg-white focus:border-admin-yellow/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    spellCheck={false}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full text-admin-gray-400 hover:text-admin-gray-700 hover:bg-admin-gray-100/50 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* ERROR */}
              {error && (
                <div className="rounded-2xl bg-admin-red/5 border border-admin-red/10 px-4 py-3 animate-fade-in flex items-center justify-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-admin-red/10 flex items-center justify-center shrink-0">
                  <span className="text-admin-red font-black text-[10px]">!</span>
                  </div>
                  <p className="text-admin-red text-xs font-semibold">{error}</p>
                </div>
              )}

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={isLoading}
                className={`group relative w-full rounded-2xl overflow-hidden transition-all duration-300 shadow-[0_8px_20px_rgba(0,0,0,0.08)] mt-2 ${isLoading ? "opacity-80 cursor-wait" : "hover:shadow-[0_12px_25px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 active:translate-y-0"}`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-admin-yellow via-[#F7C800] to-admin-yellow transition-colors" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#E6B800] via-[#FFD500] to-[#E6B800] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative px-6 py-4.5 flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin text-admin-gray-900/50" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span className="text-admin-gray-900 font-bold tracking-[0.2em] uppercase text-xs">Hitelesítés...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-admin-gray-900 font-bold tracking-[0.2em] uppercase text-xs drop-shadow-sm">
                        Bejelentkezés
                      </span>
                      <svg className="w-4 h-4 text-admin-gray-900/70 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-admin-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                      </svg>
                    </>
                  )}
                </div>
              </button>
            </form>
          </div>

          <div className="bg-admin-gray-50/50 backdrop-blur-md border-t border-white/40 px-8 py-5 flex items-center justify-center gap-2">
            <svg className="w-3.5 h-3.5 text-admin-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <p className="text-[10px] font-bold tracking-wider uppercase text-admin-gray-400">
              Email Admin • Pannon Transfer Invite Center
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div
          className={`mt-10 flex items-center justify-center gap-4 text-[10px] font-bold tracking-[0.2em] text-admin-gray-400 uppercase ${isLoaded ? "animate-fade-in" : "opacity-0"}`}
          style={{ animationDelay: "0.4s", opacity: 0, animationFillMode: "forwards" }}
        >
          <span>© {new Date().getFullYear()} Pannon Transfer</span>

          <div className="relative group cursor-pointer flex items-center">
            <span className="w-1 h-1 rounded-full bg-admin-gray-300 mx-3 group-hover:bg-admin-gray-900 transition-colors" />
            <span className="hover:text-admin-gray-900 transition-colors duration-300">Support</span>

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-[280px] p-4 bg-white/90 backdrop-blur-xl border border-admin-gray-100 rounded-2xl shadow-2xl opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 z-50">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 rounded-full bg-admin-gray-50 border border-admin-gray-100 flex items-center justify-center mb-1 shadow-sm">
                  <svg className="w-5 h-5 text-admin-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <p className="text-admin-gray-900 font-bold text-sm normal-case tracking-normal">Balog Sebastian Máté</p>
                <div className="w-full h-px bg-admin-gray-100 my-1" />
                <a href="mailto:balog.sebastian@pannonguard.hu" className="text-admin-red hover:text-admin-red-dark transition-colors normal-case tracking-normal text-xs">
                  balog.sebastian@pannonguard.hu
                </a>
                <a href="tel:+36306654135" className="text-admin-gray-600 hover:text-admin-gray-900 transition-colors normal-case tracking-normal text-xs font-mono">
                  +36 30 665 4135
                </a>
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/90 border-b border-r border-admin-gray-100 rotate-45" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
