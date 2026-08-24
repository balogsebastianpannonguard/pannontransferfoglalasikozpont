"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginClient() {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState<string>("");
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [lockRemaining, setLockRemaining] = useState<number | null>(null);

  const formRef = useRef<HTMLFormElement>(null);
  const totpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (error && shake) {
      const t = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(t);
    }
  }, [error, shake]);

  useEffect(() => {
    if (lockRemaining === null || lockRemaining <= 0) return;
    const timer = setInterval(() => {
      setLockRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockRemaining]);

  function formatLockSeconds(secs: number): string {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m <= 0) return `${s} mp`;
    return `${m} perc${s > 0 ? ` ${s} mp` : ""}`;
  }

  function handleTotpChange(index: number, value: string) {
    const digit = value.replace(/[^0-9]/g, "").slice(-1);
    const parts = totpCode.padEnd(6, " ").split("").map((c) => (c === " " ? "" : c));
    parts[index] = digit;
    const newCode = parts.join("").slice(0, 6);
    setTotpCode(newCode);
    if (error && (error.code === "MISSING_2FA" || error.code === "INVALID_2FA")) {
      setError(null);
    }
    if (digit && index < 5) {
      totpInputRefs.current[index + 1]?.focus();
    }
  }

  function handleTotpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !totpCode[index] && index > 0) {
      totpInputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") {
      submit(e as any);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const normalizedEmail = email.trim();
    const normalizedPassword = password.trim();
    const normalizedTotp = totpCode.replace(/[^0-9]/g, "").padStart(6, "0").slice(-6);

    if (!normalizedEmail || !normalizedPassword) {
      setError({ message: "Kérjük, adja meg az e-mail címet és a jelszót." });
      setShake(true);
      setIsLoading(false);
      return;
    }

    try {
      const payload: Record<string, string> = {
        email: normalizedEmail,
        password: normalizedPassword,
      };
      if (/^[0-9]{6}$/.test(totpCode.replace(/[^0-9]/g, ""))) {
        payload.totpCode = normalizedTotp;
      } else if (totpCode.length > 0) {
        payload.totpCode = totpCode.replace(/[^0-9]/g, "");
      }

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

      if (data.code === "LOCKED" && typeof data.remainingSeconds === "number") {
        setLockRemaining(data.remainingSeconds);
      } else {
        setLockRemaining(null);
      }

      if (data.code === "2FA_REQUIRED_SETUP") {
        const redirectTo = data.redirectTo || "/setup-2fa";
        window.location.href = redirectTo;
        return;
      }

      if (!response.ok || !data.success) {
        setError({
          message: data.message || "Hibás bejelentkezési adatok.",
          code: data.code,
        });
        setShake(true);
        if (data.code === "INVALID_2FA" || data.code === "MISSING_2FA") {
          setTotpCode("");
          setTimeout(() => totpInputRefs.current[0]?.focus(), 50);
        }
        setIsLoading(false);
        return;
      }

      const redirectTo = data.redirectTo || "/admin";
      window.location.href = redirectTo;
    } catch (err) {
      console.error("[Login] Hiba:", err);
      const message =
        err instanceof Error ? err.message : "Hálózati hiba történt. Kérjük, próbálja újra.";
      setError({ message });
      setShake(true);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="relative min-h-screen w-full bg-[#FAFAFA] text-admin-black font-sans flex items-center justify-center p-6 selection:bg-admin-red selection:text-white overflow-hidden">
      
      {/* ============ EPIC LIGHT ABSTRACT BACKGROUND ============ */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Very light base background to keep it bright */}
        <div className="absolute inset-0 bg-[#FAFAFA]" />
        
        {/* Dynamic mesh gradient background (Red, Yellow, Blue, Black/Dark Gray) on a light base */}
        <div 
          className="absolute inset-0 opacity-40 mix-blend-multiply animate-float" 
          style={{ 
            background: 'radial-gradient(circle at 10% 20%, rgba(229,9,20,0.15) 0%, transparent 50%), radial-gradient(circle at 90% 10%, rgba(255,215,0,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 90%, rgba(0,86,210,0.15) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(17,17,17,0.1) 0%, transparent 50%)',
            filter: 'blur(60px)' 
          }} 
        />
        
        {/* Crisp grid pattern */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#000000_1px,transparent_1px),linear-gradient(to_bottom,#000000_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      <div className="relative z-10 w-full max-w-[420px]">
        
        {/* BRANDING HEADER */}
        <div className={`text-center mb-8 ${isLoaded ? "animate-fade-in-up" : "opacity-0"}`} style={{ animationDelay: "0.1s", opacity: 0, animationFillMode: "forwards" }}>
          <div className="relative inline-flex items-center justify-center w-16 h-16 bg-white/80 backdrop-blur-xl rounded-[1.25rem] shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-white mb-6 group">
            <div className="absolute inset-0 rounded-[1.25rem] bg-gradient-to-br from-admin-red/5 to-admin-yellow/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <span className="relative font-black text-2xl tracking-tighter bg-gradient-to-br from-admin-red to-[#B50710] bg-clip-text text-transparent">PT</span>
          </div>
          <h1 className="font-serif text-4xl font-bold tracking-tight text-admin-gray-900 mb-2">
            Pannon Transfer
          </h1>
          <p className="text-xs font-bold tracking-[0.25em] uppercase text-admin-gray-400 bg-gradient-to-r from-admin-red/80 to-admin-yellow/80 bg-clip-text text-transparent">
            Client Relationship Management
          </p>
        </div>

        {/* LOGIN CARD */}
        <div 
          className={`relative bg-white/70 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-white/60 overflow-hidden ${shake ? "animate-shake" : ""} ${isLoaded ? "animate-fade-in-up" : "opacity-0"}`}
          style={{ animationDelay: "0.2s", opacity: 0, animationFillMode: "forwards" }}
        >
          {/* Subtle inner top highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />
          
          <div className="px-8 sm:px-10 py-10">
            <form ref={formRef} onSubmit={submit} className="space-y-6">
              
              {/* EMAIL */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-[10px] font-black tracking-[0.2em] uppercase text-admin-gray-400 ml-1">
                  E-mail cím
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-admin-red/20 to-admin-yellow/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    className="relative w-full bg-white/80 border border-admin-gray-200/60 rounded-2xl px-5 py-4 text-sm text-admin-gray-900 placeholder:text-admin-gray-400 outline-none transition-all duration-300 focus:bg-white focus:border-admin-red/30 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                    placeholder="admin@pannon.hu"
                    autoComplete="email"
                    spellCheck={false}
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label htmlFor="password" className="text-[10px] font-black tracking-[0.2em] uppercase text-admin-gray-400">
                    Jelszó
                  </label>
                  <Link href="/forgot-password" className="text-[10px] font-bold tracking-wider text-admin-gray-400 hover:text-admin-red transition-colors">
                    Elfelejtetted?
                  </Link>
                </div>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-admin-red/20 to-admin-yellow/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                  <input
                    id="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    type={showPassword ? "text" : "password"}
                    className="relative w-full bg-white/80 border border-admin-gray-200/60 rounded-2xl pl-5 pr-14 py-4 text-sm text-admin-gray-900 placeholder:text-admin-gray-400 outline-none transition-all duration-300 focus:bg-white focus:border-admin-red/30 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
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

              {/* 2FA TOTP CODE */}
              <div className={`space-y-2.5 ${error?.code === "MISSING_2FA" || error?.code === "INVALID_2FA" ? "animate-shake" : ""}`}>
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[10px] font-black tracking-[0.2em] uppercase text-admin-gray-400 flex items-center gap-1.5">
                    <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-[4px] bg-blue-500/10 text-blue-600">
                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                      </svg>
                    </span>
                    Hitelesítő kód (2FA)
                  </label>
                  <span className="text-[9px] font-bold tracking-wider text-admin-gray-300 uppercase">
                    Google · Authy
                  </span>
                </div>
                <div className="relative">
                  <div className={`grid grid-cols-6 gap-2 ${error?.code === "MISSING_2FA" || error?.code === "INVALID_2FA" ? "[&>*]:!border-admin-red/50 [&>*]:!bg-admin-red/5" : ""}`}>
                    {[0, 1, 2, 3, 4, 5].map((idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          totpInputRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        autoComplete="off"
                        value={totpCode[idx] || ""}
                        onChange={(e) => handleTotpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleTotpKeyDown(idx, e)}
                        disabled={lockRemaining !== null || isLoading}
                        className="relative w-full aspect-square bg-white/80 border border-admin-gray-200/60 rounded-xl text-center text-lg font-black text-admin-gray-900 placeholder:text-admin-gray-300 outline-none transition-all duration-300 focus:bg-white focus:border-blue-500/30 focus:shadow-[0_0_0_4px_rgba(0,86,210,0.05)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] disabled:opacity-60 disabled:cursor-not-allowed font-mono"
                      />
                    ))}
                  </div>
                  {error?.code === "MISSING_2FA" || error?.code === "INVALID_2FA" ? (
                    <div className="absolute -bottom-5 left-0 text-[10px] font-bold text-admin-red animate-fade-in">
                      {error.code === "MISSING_2FA"
                        ? "Kérjük, add meg a 6 számjegyű kódot."
                        : "Hibás vagy lejárt kód, próbáld újra."}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* LOCKOUT BANNER */}
              {lockRemaining !== null && lockRemaining > 0 && (
                <div className="rounded-2xl bg-amber-50 border border-amber-200/70 px-4 py-3 animate-fade-in flex items-center justify-center gap-2.5 mt-2">
                  <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  <div className="flex flex-col items-center">
                    <p className="text-admin-gray-900 text-[11px] font-bold tracking-wide uppercase">
                      Fiók ideiglenesen zárolva
                    </p>
                    <p className="text-admin-gray-600 text-[11px] font-semibold font-mono mt-0.5">
                      Újrapróbálkozás: <span className="text-admin-red font-black">{formatLockSeconds(lockRemaining)}</span>
                    </p>
                  </div>
                </div>
              )}

              {/* ERROR (except 2FA inline errors) */}
              {error && error.code !== "MISSING_2FA" && error.code !== "INVALID_2FA" && (
                <div className="rounded-2xl bg-admin-red/5 border border-admin-red/10 px-4 py-3 animate-fade-in flex items-center justify-center gap-2 mt-2">
                  <div className="w-4 h-4 rounded-full bg-admin-red/10 flex items-center justify-center shrink-0">
                    <span className="text-admin-red font-black text-[10px]">!</span>
                  </div>
                  <p className="text-admin-red text-xs font-semibold text-center">{error.message}</p>
                </div>
              )}

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={isLoading || (lockRemaining !== null && lockRemaining > 0)}
                className={`group relative w-full rounded-2xl overflow-hidden transition-all duration-300 shadow-[0_8px_20px_rgba(0,0,0,0.08)] mt-2 ${
                  isLoading || (lockRemaining !== null && lockRemaining > 0) ? "opacity-80 cursor-wait" : "hover:shadow-[0_12px_25px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 active:translate-y-0"
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-admin-gray-900 to-black transition-colors" />
                <div className="absolute inset-0 bg-gradient-to-r from-admin-gray-800 via-black to-admin-gray-800 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative px-6 py-4.5 flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin text-white/50" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span className="text-white font-bold tracking-[0.2em] uppercase text-xs">Hitelesítés...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-white font-bold tracking-[0.2em] uppercase text-xs drop-shadow-sm">
                        Bejelentkezés
                      </span>
                      <svg className="w-4 h-4 text-white/70 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
              Végpontok közötti titkosított kapcsolat
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div 
          className={`mt-10 flex items-center justify-center gap-4 text-[10px] font-bold tracking-[0.2em] text-admin-gray-400 uppercase ${isLoaded ? "animate-fade-in" : "opacity-0"}`}
          style={{ animationDelay: "0.4s", opacity: 0, animationFillMode: "forwards" }}
        >
          <span>© {new Date().getFullYear()} Pannon Transfer CRM</span>
          
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
              {/* Tooltip arrow */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/90 border-b border-r border-admin-gray-100 rotate-45" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
