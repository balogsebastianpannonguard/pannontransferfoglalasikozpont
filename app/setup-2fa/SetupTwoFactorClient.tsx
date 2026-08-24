"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function SetupTwoFactorClient() {
  const router = useRouter();

  const [isLoaded, setIsLoaded] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [plainSecret, setPlainSecret] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  const [totpCode, setTotpCode] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [shake, setShake] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const resultScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoaded(true);
    generateQr(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (submitError) {
      setShake(true);
      const t = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(t);
    }
  }, [submitError]);

  async function generateQr(isInitial: boolean = false) {
    if (isGenerating) return;
    setIsGenerating(true);
    setSessionError(null);
    setSubmitError(null);

    if (!isInitial) {
      setQrCodeDataUrl(null);
      setPlainSecret(null);
    }

    try {
      const response = await fetch("/api/setup-2fa/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("A szerver válasza nem értelmezhető. Frissítsd az oldalt.");
      }

      if (!response.ok || !data.success) {
        if (data.code === "SESSION_EXPIRED") {
          setSessionError(data.message || "A munkamenet lejárt.");
          setTimeout(() => {
            window.location.href = data.redirectTo || "/setup-password";
          }, 1200);
          return;
        }
        throw new Error(data.message || "Hiba a QR-kód generálásakor.");
      }

      setQrCodeDataUrl(data.qrCodeDataUrl || null);
      setPlainSecret(data.secret || null);
      setEmail(data.email || "");
    } catch (err) {
      console.error("[Setup2FA] generate error:", err);
      setSessionError(err instanceof Error ? err.message : "Ismeretlen hiba.");
    } finally {
      setIsGenerating(false);
    }
  }

  function handleCodeChange(index: number, value: string) {
    const digit = value.replace(/[^0-9]/g, "").slice(-1);
    const parts = totpCode.split("");
    parts[index] = digit;
    const newCode = parts.join("").padEnd(6, " ").replace(/ /g, "").slice(0, 6);
    setTotpCode(newCode);
    setSubmitError(null);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleCodeKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !totpCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") {
      handleSubmit(e as any);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting || submitSuccess) return;
    if (!qrCodeDataUrl) {
      setSubmitError("Először generáld meg a QR-kódot az 1. lépésben.");
      return;
    }
    const code = totpCode.replace(/[^0-9]/g, "").padStart(6, "0").slice(-6);
    if (!/^[0-9]{6}$/.test(code)) {
      setSubmitError("Kérjük, add meg a teljes 6 számjegyű kódot.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/setup-2fa/verify-and-enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ totpCode: code }),
      });

      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("A szerver válasza nem értelmezhető. Próbáld újra.");
      }

      if (!response.ok || !data.success) {
        if (data.code === "SESSION_EXPIRED") {
          setSessionError(data.message || "A munkamenet lejárt.");
          setTimeout(() => {
            window.location.href = data.redirectTo || "/setup-password";
          }, 1200);
          return;
        }
        const msg =
          data?.message ||
          (data?.code === "INVALID_CODE"
            ? "Hibás kód. Ellenőrizd a hitelesítő alkalmazásod időját és a beírt számokat."
            : "Hiba történt a kód ellenőrzésekor.");
        setSubmitError(msg);
        setIsSubmitting(false);
        return;
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        window.location.href = data.redirectTo || "/login";
      }, 900);
    } catch (err) {
      console.error("[Setup2FA] submit error:", err);
      setSubmitError(
        err instanceof Error ? err.message : "Hálózati hiba történt. Kérjük, próbáld újra."
      );
    } finally {
      setIsSubmitting(false);
      setTimeout(() => {
        resultScrollRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
  }

  return (
    <section className="relative min-h-screen w-full bg-[#FAFAFA] text-admin-black font-sans flex items-center justify-center p-6 selection:bg-admin-yellow selection:text-white overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#FAFAFA]" />
        <div
          className="absolute inset-0 opacity-55 mix-blend-multiply animate-float"
          style={{
            background:
              "radial-gradient(circle at 15% 25%, rgba(0,86,210,0.12) 0%, transparent 50%), radial-gradient(circle at 85% 15%, rgba(255,215,0,0.26) 0%, transparent 50%), radial-gradient(circle at 75% 85%, rgba(229,9,20,0.08) 0%, transparent 50%)",
            filter: "blur(70px)",
          }}
        />
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#000000_1px,transparent_1px),linear-gradient(to_bottom,#000000_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      <div className="relative z-10 w-full max-w-[560px]">
        <div
          className={`text-center mb-8 ${isLoaded ? "animate-fade-in-up" : "opacity-0"}`}
          style={{ animationDelay: "0.1s", opacity: 0, animationFillMode: "forwards" }}
        >
          <div className="relative inline-flex items-center justify-center w-16 h-16 bg-white/80 backdrop-blur-xl rounded-[1.25rem] shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-white mb-6 group">
            <div className="absolute inset-0 rounded-[1.25rem] bg-gradient-to-br from-admin-blue/15 to-admin-yellow/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-admin-blue to-admin-yellow flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              </svg>
            </div>
          </div>
          <h1 className="font-serif text-4xl font-bold tracking-tight text-admin-gray-900 mb-2">
            Kétfaktoros Hitelesítés
          </h1>
          <p className="text-[11px] font-bold tracking-[0.25em] uppercase bg-gradient-to-r from-admin-blue/80 via-admin-yellow to-admin-blue bg-clip-text text-transparent">
            Pannon Transfer CRM • Hitelesítés 2/2
          </p>
        </div>

        <div
          className={`relative bg-white/70 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-white/60 overflow-hidden ${shake ? "animate-shake" : ""} ${isLoaded ? "animate-fade-in-up" : "opacity-0"}`}
          style={{ animationDelay: "0.2s", opacity: 0, animationFillMode: "forwards" }}
        >
          <div className="absolute inset-x-0 top-0 h-[4px] bg-gradient-to-r from-admin-blue via-admin-yellow to-admin-red" />

          <div className="px-8 sm:px-10 py-10">
            {/* Folyamatjelző */}
            <div className="mb-8 flex items-center justify-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow-md">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-admin-gray-500">
                  JELSZÓ
                </span>
              </div>
              <div className="w-10 h-[2px] bg-gradient-to-r from-green-500 to-admin-yellow" />
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-admin-yellow flex items-center justify-center shadow-md">
                  <span className="text-[11px] font-black text-admin-gray-900">2</span>
                </div>
                <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-admin-gray-900">
                  2FA
                </span>
              </div>
            </div>

            {/* Session expired */}
            {sessionError && (
              <div className="py-4 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-2xl bg-admin-red/10 border border-admin-red/15">
                  <svg className="w-8 h-8 text-admin-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-serif text-xl font-bold tracking-tight mb-2">
                  Munkamenet lejárt
                </h3>
                <p className="text-sm font-medium text-admin-gray-600">{sessionError}</p>
              </div>
            )}

            {!sessionError && (
              <div className="space-y-10">
                {/* 1. QR generálás */}
                <section>
                  <div className="flex items-start gap-3 mb-5">
                    <div className="w-7 h-7 shrink-0 rounded-full bg-admin-yellow/20 border border-admin-yellow/30 flex items-center justify-center mt-0.5">
                      <span className="text-[12px] font-black text-admin-gray-900">1</span>
                    </div>
                    <div className="flex-1">
                      <h2 className="font-serif text-xl font-bold tracking-tight mb-1">
                        Olvasd be a QR-kódot hitelesítő alkalmazásoddal
                      </h2>
                      <p className="text-[13px] leading-relaxed text-admin-gray-600 font-medium">
                        Használd a Google Authenticator, Authy vagy bármilyen TOTP kompatibilis alkalmazást.
                      </p>
                    </div>
                    <button
                      onClick={() => generateQr(false)}
                      disabled={isGenerating}
                      className="shrink-0 px-3 py-2 rounded-xl border border-admin-gray-200 bg-white hover:bg-admin-gray-50 text-[10px] font-black tracking-[0.18em] uppercase text-admin-gray-600 hover:text-admin-gray-900 transition-colors disabled:opacity-60 disabled:cursor-wait"
                    >
                      {isGenerating ? "Betöltés..." : "Újragenerálás"}
                    </button>
                  </div>

                  <div className="rounded-3xl bg-admin-gray-50/80 border border-admin-gray-200 p-6 flex flex-col lg:flex-row items-center gap-6">
                    <div className="shrink-0 rounded-2xl bg-white p-3 border border-admin-gray-200 shadow-sm">
                      {isGenerating && !qrCodeDataUrl ? (
                        <div className="w-[260px] h-[260px] rounded-xl bg-admin-gray-100 flex items-center justify-center">
                          <svg className="w-8 h-8 animate-spin text-admin-gray-400" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        </div>
                      ) : qrCodeDataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={qrCodeDataUrl}
                          alt="2FA QR-kód"
                          className="w-[260px] h-[260px] rounded-xl"
                        />
                      ) : (
                        <button
                          onClick={() => generateQr(false)}
                          className="w-[260px] h-[260px] rounded-xl border-2 border-dashed border-admin-gray-200 text-admin-gray-400 hover:text-admin-gray-600 hover:border-admin-yellow/60 transition-colors flex flex-col items-center justify-center gap-3"
                        >
                          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM16.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75zM19.5 16.5h.75v.75h-.75v-.75z" />
                          </svg>
                          <span className="text-xs font-bold uppercase tracking-wider">QR Kód Generálása</span>
                        </button>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 w-full space-y-4">
                      {email && (
                        <div className="rounded-2xl bg-white border border-admin-gray-200 px-4 py-3 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-admin-blue/10 flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4 text-admin-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-black tracking-[0.18em] uppercase text-admin-gray-400 mb-0.5">
                              Fiók
                            </p>
                            <p className="text-xs font-bold text-admin-gray-900 truncate">{email}</p>
                          </div>
                        </div>
                      )}
                      <div className="rounded-2xl bg-white border border-admin-gray-200 p-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <p className="text-[10px] font-black tracking-[0.18em] uppercase text-admin-gray-400 mb-1">
                              Oldalankénti titkos kulcs (backup)
                            </p>
                            <p className="text-[13px] text-admin-gray-600 font-medium leading-relaxed">
                              Ha nem tudod beolvasni a QR-kódot, írd be ezt a kulcsot a hitelesítő alkalmazásodba manuálisan.
                            </p>
                          </div>
                        </div>
                        <div className="rounded-xl bg-admin-gray-900 text-admin-yellow p-3.5 font-mono text-xs tracking-[0.3em] break-all shadow-sm">
                          {plainSecret ? (
                            <>
                              {plainSecret.match(/.{1,4}/g)?.join(" ")}
                              <button
                                type="button"
                                onClick={() => {
                                  if (plainSecret) navigator.clipboard?.writeText(plainSecret);
                                }}
                                className="ml-3 inline-flex items-center px-2.5 py-1 rounded-lg bg-admin-yellow/10 text-admin-yellow text-[10px] font-black tracking-wider align-middle hover:bg-admin-yellow/15 transition-colors"
                              >
                                MÁSOLÁS
                              </button>
                            </>
                          ) : (
                            <span className="text-admin-gray-500/70 italic tracking-normal text-[11px]">
                              [generáld a QR-kódot...]
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-admin-blue/5 border border-admin-blue/20 p-4 flex gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white border border-admin-blue/20 flex items-center justify-center shrink-0">
                          <svg className="w-4.5 h-4.5 text-admin-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                          </svg>
                        </div>
                        <p className="text-[12px] leading-relaxed text-admin-blue-800 font-medium">
                          Ez a titkos kulcs csak a beállítási folyamat során látható. <strong className="font-bold">Készíts róla biztonsági másolatot</strong>, mert egyébként (ha elveszted a telefonod) hitelesítő kódot nem tudsz generálni.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 2. Kód beírás */}
                <section>
                  <form onSubmit={handleSubmit}>
                    <div className="flex items-start gap-3 mb-5">
                      <div className="w-7 h-7 shrink-0 rounded-full bg-admin-blue/20 border border-admin-blue/30 flex items-center justify-center mt-0.5">
                        <span className="text-[12px] font-black text-admin-gray-900">2</span>
                      </div>
                      <div className="flex-1">
                        <h2 className="font-serif text-xl font-bold tracking-tight mb-1">
                          Írd be az alkalmazásod által generált 6 számjegyű kódot
                        </h2>
                        <p className="text-[13px] leading-relaxed text-admin-gray-600 font-medium">
                          A kód 30 másodpercenként változik. A 6 mezőbe a balról jobbra írd be a számokat.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-3xl bg-admin-gray-50/80 border border-admin-gray-200 p-6">
                      <div className="grid grid-cols-6 gap-3">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="relative">
                            <input
                              ref={(el) => { inputRefs.current[i] = el; }}
                              value={totpCode[i] || ""}
                              onChange={(e) => handleCodeChange(i, e.target.value)}
                              onKeyDown={(e) => handleCodeKeyDown(i, e)}
                              inputMode="numeric"
                              maxLength={1}
                              autoComplete="one-time-code"
                              className="w-full h-16 text-center text-2xl font-black text-admin-gray-900 tracking-tight bg-white rounded-2xl border border-admin-gray-200 focus:border-admin-yellow/60 focus:ring-2 focus:ring-admin-yellow/20 outline-none transition-all shadow-sm"
                              aria-label={`${i + 1}. számjegy`}
                            />
                          </div>
                        ))}
                      </div>

                      <div ref={resultScrollRef} className="mt-6 space-y-4">
                        {submitError && (
                          <div className="rounded-2xl bg-admin-red/5 border border-admin-red/10 px-4 py-3 animate-fade-in flex items-center justify-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-admin-red/10 flex items-center justify-center shrink-0">
                              <span className="text-admin-red font-black text-[10px]">!</span>
                            </div>
                            <p className="text-admin-red text-xs font-semibold">{submitError}</p>
                          </div>
                        )}
                        {submitSuccess && (
                          <div className="py-3 rounded-2xl bg-green-500/10 border border-green-500/20 flex flex-col items-center gap-2 animate-fade-in-up">
                            <div className="w-10 h-10 rounded-full bg-green-500/15 flex items-center justify-center">
                              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                            </div>
                            <p className="font-bold text-green-700 text-sm tracking-wide">
                              Kétfaktoros hitelesítés aktiválva! Átirányítás a bejelentkezéshez...
                            </p>
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={isSubmitting || submitSuccess || !qrCodeDataUrl}
                          className={`group relative w-full rounded-2xl overflow-hidden transition-all duration-300 mt-1 ${qrCodeDataUrl && !isSubmitting && !submitSuccess ? "shadow-[0_8px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_25px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 active:translate-y-0" : "opacity-50 cursor-not-allowed"}`}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-admin-blue via-[#1e6bff] to-admin-blue transition-colors" />
                          <div className="absolute inset-0 bg-gradient-to-r from-[#0041a0] via-[#0056d2] to-[#0041a0] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          <div className="relative px-6 py-4.5 flex items-center justify-center gap-2.5">
                            {isSubmitting ? (
                              <>
                                <svg className="w-4 h-4 animate-spin text-white/70" viewBox="0 0 24 24" fill="none">
                                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                <span className="text-white font-bold tracking-[0.2em] uppercase text-xs">
                                  Ellenőrzés...
                                </span>
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4 text-white/80 transition-transform duration-300 group-hover:scale-110 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-white font-bold tracking-[0.2em] uppercase text-xs drop-shadow-sm">
                                  Aktiválás &amp; Kész
                                </span>
                              </>
                            )}
                          </div>
                        </button>
                      </div>
                    </div>
                  </form>
                </section>
              </div>
            )}
          </div>

          <div className="bg-admin-gray-50/50 backdrop-blur-md border-t border-white/40 px-8 py-5 flex items-center justify-center gap-2">
            <svg className="w-3.5 h-3.5 text-admin-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <p className="text-[10px] font-bold tracking-wider uppercase text-admin-gray-400">
              TOTP 2FA • Google / Authy kompatibilis • 30 mp • ±1 lépés tolerancia
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
