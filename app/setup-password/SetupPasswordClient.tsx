"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MIN_PASSWORD_LENGTH } from "@/lib/password-rules";

interface PasswordCheckState {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export default function SetupPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [isLoaded, setIsLoaded] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<
    "loading" | "valid" | "invalid"
  >("loading");
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
    const [requireTwoFactor, setRequireTwoFactor] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [checks, setChecks] = useState<PasswordCheckState>({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [shake, setShake] = useState(false);
  const resultScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoaded(true);
    (async () => {
      if (!token) {
        setTokenStatus("invalid");
        setTokenError("Hiányzó meghívó token. Kérjük, használd az emailben kapott teljes linket.");
        return;
      }
      try {
        const response = await fetch(`/api/setup-password/validate-token?token=${encodeURIComponent(token)}`);
        const data = await response.json();
        if (!response.ok || !data.valid) {
          setTokenStatus("invalid");
          setTokenError(data.message || "Érvénytelen meghívó link.");
        } else {
          setTokenStatus("valid");
          setUserEmail(data.email || "");
            setRequireTwoFactor(!!data.requireTwoFactor);
        }
      } catch (err) {
        setTokenStatus("invalid");
        setTokenError(
          err instanceof Error ? err.message : "Hálózati hiba a token ellenőrzésekor."
        );
      }
    })();
  }, [token]);

  // Élő jelszó komplexitás ellenőrzés
  useEffect(() => {
    setChecks({
      minLength: password.length >= MIN_PASSWORD_LENGTH,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[^A-Za-z0-9]/.test(password),
    });
  }, [password]);

  const passedChecksCount = Object.values(checks).filter(Boolean).length;
  const allChecksPassed = passedChecksCount === 5;
  const passwordsMatch = !!password && !!confirmPassword && password === confirmPassword;
  const canSubmit =
    tokenStatus === "valid" &&
    !isSubmitting &&
    allChecksPassed &&
    passwordsMatch &&
    !submitSuccess;

  useEffect(() => {
    if (submitError) {
      setShake(true);
      const t = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(t);
    }
  }, [submitError]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/setup-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
        credentials: "include",
      });

      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("A szerver válasza nem értelmezhető. Próbáld újra.");
      }

      if (!response.ok || !data.success) {
        const msg =
          data?.message ||
          (data?.code === "PASSWORD_MISMATCH"
            ? "A két jelszó nem egyezik meg."
            : data?.code === "WEAK_PASSWORD"
              ? data?.reason || "A jelszó nem elég biztonságos."
              : "Hiba történt a jelszó beállításakor.");
        setSubmitError(msg);
        setIsSubmitting(false);
        return;
      }

      setSubmitSuccess(true);
      setTimeout(() => {
          window.location.href = data.redirectTo || (data.requireTwoFactor ? "/setup-2fa" : "/login");
      }, 700);
    } catch (err) {
      console.error("[SetupPassword] Hiba:", err);
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

      {/* BACKGROUND */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#FAFAFA]" />
        <div
          className="absolute inset-0 opacity-55 mix-blend-multiply animate-float"
          style={{
            background:
              "radial-gradient(circle at 15% 25%, rgba(229,9,20,0.12) 0%, transparent 50%), radial-gradient(circle at 85% 15%, rgba(255,215,0,0.28) 0%, transparent 50%), radial-gradient(circle at 75% 85%, rgba(0,86,210,0.10) 0%, transparent 50%), radial-gradient(circle at 25% 80%, rgba(17,17,17,0.08) 0%, transparent 50%)",
            filter: "blur(70px)",
          }}
        />
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#000000_1px,transparent_1px),linear-gradient(to_bottom,#000000_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      <div className="relative z-10 w-full max-w-[520px]">
        {/* HEADER */}
        <div
          className={`text-center mb-8 ${isLoaded ? "animate-fade-in-up" : "opacity-0"}`}
          style={{ animationDelay: "0.1s", opacity: 0, animationFillMode: "forwards" }}
        >
          <div className="relative inline-flex items-center justify-center w-16 h-16 bg-white/80 backdrop-blur-xl rounded-[1.25rem] shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-white mb-6 group">
            <div className="absolute inset-0 rounded-[1.25rem] bg-gradient-to-br from-admin-yellow/12 to-admin-red/6 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-admin-yellow to-admin-red flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
          </div>
          <h1 className="font-serif text-4xl font-bold tracking-tight text-admin-gray-900 mb-2">
            Jelszó Beállítása
          </h1>
          <p className="text-[11px] font-bold tracking-[0.25em] uppercase bg-gradient-to-r from-admin-red/80 via-admin-yellow to-admin-yellow bg-clip-text text-transparent">
            Pannon Transfer CRM • Hitelesítés 1/2
          </p>
        </div>

        {/* INVALID TOKEN CARD */}
        {tokenStatus === "invalid" && (
          <div
            className={`relative bg-white/70 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-white/60 overflow-hidden ${isLoaded ? "animate-fade-in-up" : "opacity-0"}`}
            style={{ animationDelay: "0.2s", opacity: 0, animationFillMode: "forwards" }}
          >
            <div className="absolute inset-x-0 top-0 h-[4px] bg-gradient-to-r from-admin-red via-admin-red to-admin-red/60" />
            <div className="px-8 sm:px-10 py-10">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-2xl bg-admin-red/10 border border-admin-red/15">
                <svg className="w-8 h-8 text-admin-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <h2 className="font-serif text-2xl font-bold text-center tracking-tight mb-4">
                Érvénytelen vagy lejárt link
              </h2>
              <p className="text-sm text-admin-gray-600 text-center font-medium leading-relaxed mb-6">
                {tokenError || "A link érvényességi ideje lejárt, vagy a linket már felhasználták."}
              </p>
              <div className="h-px w-full bg-admin-gray-100 mb-6" />
              <button
                  onClick={() => router.push("/login")}
                className="w-full rounded-2xl bg-admin-gray-900 hover:bg-black text-white py-4 text-[11px] font-black tracking-[0.2em] uppercase transition-colors"
              >
                Vissza a bejelentkezéshez
              </button>
            </div>
          </div>
        )}

        {/* VALID TOKEN FORM */}
        {tokenStatus !== "invalid" && (
          <div
            className={`relative bg-white/70 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-white/60 overflow-hidden ${shake ? "animate-shake" : ""} ${isLoaded ? "animate-fade-in-up" : "opacity-0"}`}
            style={{ animationDelay: "0.2s", opacity: 0, animationFillMode: "forwards" }}
          >
            <div className="absolute inset-x-0 top-0 h-[4px] bg-gradient-to-r from-admin-red via-admin-yellow to-admin-blue" />

            <div className="px-8 sm:px-10 py-10">
              {/* Folyamatjelző */}
              <div className="mb-8 flex items-center justify-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-admin-yellow flex items-center justify-center shadow-md">
                    <span className="text-[11px] font-black text-admin-gray-900">1</span>
                  </div>
                  <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-admin-gray-900">
                    JELSZÓ
                  </span>
                </div>
                      {requireTwoFactor ? (
                        <>
                          <div className="w-10 h-[2px] bg-admin-gray-200" />
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-admin-gray-100 border border-admin-gray-200 flex items-center justify-center">
                              <span className="text-[11px] font-black text-admin-gray-400">2</span>
                            </div>
                            <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-admin-gray-400">
                              2FA
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-[10px] font-bold tracking-[0.18em] uppercase text-emerald-700">
                          2FA opcionális
                        </div>
                      )}
              </div>

              {tokenStatus === "loading" && (
                <div className="py-10 flex flex-col items-center justify-center gap-4">
                  <div className="w-10 h-10 rounded-full border-4 border-admin-yellow/30 border-t-admin-yellow animate-spin" />
                  <p className="text-sm font-semibold text-admin-gray-500 tracking-wide">
                    Meghívó ellenőrzése...
                  </p>
                </div>
              )}

              {tokenStatus === "valid" && !submitSuccess && (
                <form onSubmit={handleSubmit} className="space-y-7">
                  {/* Email user információ */}
                  <div className="rounded-2xl bg-admin-gray-50/80 border border-admin-gray-200 p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white border border-admin-gray-200 flex items-center justify-center shadow-sm">
                        <svg className="w-4 h-4 text-admin-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-black tracking-[0.18em] uppercase text-admin-gray-400 mb-0.5">
                          Bejelentkezési fiók
                        </div>
                        <div className="text-sm font-bold text-admin-gray-900 truncate">
                          {userEmail || "Meghívott felhasználó"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Password 1 */}
                  <div className="space-y-2">
                    <label htmlFor="password" className="block text-[10px] font-black tracking-[0.2em] uppercase text-admin-gray-400 ml-1">
                      Új Jelszó
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-admin-yellow/25 to-admin-red/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                      <input
                        id="password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (submitError) setSubmitError(null);
                        }}
                        type={showPassword ? "text" : "password"}
                        className="relative w-full bg-white/80 border border-admin-gray-200/60 rounded-2xl pl-5 pr-14 py-4 text-sm text-admin-gray-900 placeholder:text-admin-gray-400 outline-none transition-all duration-300 focus:bg-white focus:border-admin-yellow/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                        placeholder="Min. 10 karakter..."
                        autoComplete="new-password"
                        spellCheck={false}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full text-admin-gray-400 hover:text-admin-gray-700 hover:bg-admin-gray-100/50 transition-colors"
                      >
                        {showPassword ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223L21 21M6.228 6.228A10.451 10.451 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 01-4.293 5.774" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Password 2 */}
                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="block text-[10px] font-black tracking-[0.2em] uppercase text-admin-gray-400 ml-1">
                      Jelszó Megerősítése
                    </label>
                    <div className="relative group">
                      <div className={`absolute inset-0 rounded-2xl blur opacity-60 transition-opacity duration-300 ${passwordsMatch ? "bg-green-500/20 group-focus-within:opacity-100" : confirmPassword && !passwordsMatch ? "bg-admin-red/20 group-focus-within:opacity-100" : "bg-admin-yellow/20 group-focus-within:opacity-0"}`} />
                      <input
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (submitError) setSubmitError(null);
                        }}
                        type={showConfirmPassword ? "text" : "password"}
                        className={`relative w-full bg-white/80 rounded-2xl pl-5 pr-14 py-4 text-sm text-admin-gray-900 placeholder:text-admin-gray-400 outline-none transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] ${passwordsMatch ? "border border-green-500/40 focus:bg-white focus:border-green-500/60" : confirmPassword && !passwordsMatch ? "border border-admin-red/40 focus:bg-white focus:border-admin-red/50" : "border border-admin-gray-200/60 focus:bg-white focus:border-admin-yellow/40"}`}
                        placeholder="Írd be újra a jelszót..."
                        autoComplete="new-password"
                        spellCheck={false}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((s) => !s)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full text-admin-gray-400 hover:text-admin-gray-700 hover:bg-admin-gray-100/50 transition-colors"
                      >
                        {showConfirmPassword ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {confirmPassword && !passwordsMatch && (
                      <p className="text-[11px] font-semibold text-admin-red ml-1 animate-fade-in">
                        ⚠ A két jelszó nem egyezik meg.
                      </p>
                    )}
                  </div>

                  {/* Complexity checklist */}
                  <div className="rounded-2xl bg-admin-gray-50/80 border border-admin-gray-200 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black tracking-[0.18em] uppercase text-admin-gray-400">
                        Jelszó Biztonsági Követelmények
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-admin-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full transition-all duration-300 bg-gradient-to-r from-admin-red via-admin-yellow to-green-500"
                            style={{ width: `${(passedChecksCount / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-black text-admin-gray-500 tracking-wide">
                          {passedChecksCount}/5
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
                      {(
                        [
                          ["minLength", `Min. ${MIN_PASSWORD_LENGTH} karakter`],
                          ["hasUppercase", "Legalább egy nagybetű (A-Z)"],
                          ["hasLowercase", "Legalább egy kisbetű (a-z)"],
                          ["hasNumber", "Legalább egy szám (0-9)"],
                          ["hasSpecial", "Speciális karakter (!@#$%^&*)"],
                        ] as const
                      ).map(([key, label]) => (
                        <div key={key} className="flex items-center gap-2">
                          <div
                            className={`w-4.5 h-4.5 shrink-0 rounded-full border flex items-center justify-center transition-all duration-300 ${checks[key] ? "bg-green-500 border-green-500" : "bg-white border-admin-gray-200"}`}
                          >
                            {checks[key] ? (
                              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                            ) : null}
                          </div>
                          <span
                            className={`text-[12px] font-medium leading-relaxed ${checks[key] ? "text-admin-gray-800" : "text-admin-gray-500"}`}
                          >
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Error banner */}
                  {submitError && (
                    <div ref={resultScrollRef} className="rounded-2xl bg-admin-red/5 border border-admin-red/10 px-4 py-3 animate-fade-in flex items-center justify-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-admin-red/10 flex items-center justify-center shrink-0">
                        <span className="text-admin-red font-black text-[10px]">!</span>
                      </div>
                      <p className="text-admin-red text-xs font-semibold">{submitError}</p>
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className={`group relative w-full rounded-2xl overflow-hidden transition-all duration-300 mt-2 ${canSubmit ? "shadow-[0_8px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_25px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 active:translate-y-0" : "opacity-50 cursor-not-allowed"}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-admin-yellow via-[#F7C800] to-admin-yellow transition-colors" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#E6B800] via-[#FFD500] to-[#E6B800] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative px-6 py-4.5 flex items-center justify-center gap-2.5">
                      {isSubmitting ? (
                        <>
                          <svg className="w-4 h-4 animate-spin text-admin-gray-900/60" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          <span className="text-admin-gray-900 font-bold tracking-[0.2em] uppercase text-xs">
                            Feldolgozás...
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-admin-gray-900 font-bold tracking-[0.2em] uppercase text-xs drop-shadow-sm">
                              {requireTwoFactor ? "Tovább a 2FA beállításhoz →" : "Jelszó beállítása →"}
                          </span>
                          <svg className="w-4 h-4 text-admin-gray-900/70 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-admin-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                          </svg>
                        </>
                      )}
                    </div>
                  </button>
                </form>
              )}

              {submitSuccess && (
                <div className="py-6">
                  <div className="flex flex-col items-center gap-5 animate-fade-in-up">
                    <div className="w-20 h-20 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                      <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                    <h3 className="font-serif text-2xl font-bold tracking-tight text-admin-gray-900">
                      Jelszó beállítva!
                    </h3>
                    <p className="text-sm text-admin-gray-600 text-center font-medium">
                        {requireTwoFactor
                          ? "Átirányítás a kétfaktoros hitelesítés beállításához..."
                          : "Átirányítás a bejelentkezéshez..."}
                    </p>
                    <div className="w-10 h-1 rounded-full bg-admin-yellow animate-pulse" />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-admin-gray-50/50 backdrop-blur-md border-t border-white/40 px-8 py-5 flex items-center justify-center gap-2">
              <svg className="w-3.5 h-3.5 text-admin-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75" />
              </svg>
              <p className="text-[10px] font-bold tracking-wider uppercase text-admin-gray-400">
                Adatbázis-kompatibilis hitelesítés • HTTPS
              </p>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div
          className={`mt-10 flex items-center justify-center gap-4 text-[10px] font-bold tracking-[0.2em] text-admin-gray-400 uppercase ${isLoaded ? "animate-fade-in" : "opacity-0"}`}
          style={{ animationDelay: "0.4s", opacity: 0, animationFillMode: "forwards" }}
        >
          <span>© {new Date().getFullYear()} Pannon Transfer</span>
          <span className="w-1 h-1 rounded-full bg-admin-gray-300" />
          <div className="relative group cursor-pointer flex items-center">
            <span className="hover:text-admin-gray-900 transition-colors duration-300">Support</span>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-[280px] p-4 bg-white/90 backdrop-blur-xl border border-admin-gray-100 rounded-2xl shadow-2xl opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 z-50">
              <div className="flex flex-col items-center text-center gap-2">
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
