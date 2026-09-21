"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MIN_PASSWORD_LENGTH } from "@/lib/password-rules";

interface PasswordCheckState {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export default function NISetupPasswordClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [tokenStatus, setTokenStatus] = useState<"loading" | "valid" | "invalid">("loading");
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
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
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      if (!token) {
        setTokenStatus("invalid");
        setTokenError("Hiányzó meghívó token. Kérjük, használd az emailben kapott teljes linket.");
        return;
      }
      try {
        const response = await fetch(`/api/ni-setup-password/validate-token?token=${encodeURIComponent(token)}`);
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
        setTokenError(err instanceof Error ? err.message : "Hálózati hiba a token ellenőrzésekor.");
      }
    })();
  }, [token]);

  useEffect(() => {
    setChecks({
      minLength: password.length >= MIN_PASSWORD_LENGTH,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[^A-Za-z0-9]/.test(password),
    });
  }, [password]);

  const passedChecks = useMemo(() => Object.values(checks).filter(Boolean).length, [checks]);
  const passwordsMatch = !!password && !!confirmPassword && password === confirmPassword;
  const canSubmit = tokenStatus === "valid" && !isSubmitting && passedChecks === 5 && passwordsMatch && !submitSuccess;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/ni-setup-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setSubmitError(data.message || "Hiba történt a jelszó beállításakor.");
        return;
      }
      setSubmitSuccess(true);
      setTimeout(() => {
        window.location.href = data.redirectTo || "/ni";
      }, 700);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Hálózati hiba történt.");
    } finally {
      setIsSubmitting(false);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
  }

  const rules = [
    { ok: checks.minLength, label: `Legalább ${MIN_PASSWORD_LENGTH} karakter` },
    { ok: checks.hasUppercase, label: "Nagybetű" },
    { ok: checks.hasLowercase, label: "Kisbetű" },
    { ok: checks.hasNumber, label: "Szám" },
    { ok: checks.hasSpecial, label: "Speciális karakter" },
  ];

  return (
    <section className="min-h-screen bg-[#0f3d24] text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.22),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(21,128,61,0.18),transparent_30%),linear-gradient(180deg,#0a2e1e_0%,#0f3d24_100%)]" />
      <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:30px_30px]" />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-[560px]">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 bg-white rounded-[1.5rem] px-6 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.2)] mb-6">
              <span className="text-[2rem] font-black tracking-tight text-[#22C55E]">NI</span>
            </div>
            <h1 className="font-serif text-4xl font-bold tracking-tight mb-2">Partnerportál aktiválás</h1>
            <p className="text-sm text-emerald-100/90 font-medium">Állítsd be a jelszavad az NI dedikált felületéhez.</p>
          </div>

          <div ref={resultRef} className="rounded-[2rem] border border-white/10 bg-white/95 text-admin-gray-900 shadow-[0_30px_80px_rgba(0,0,0,0.25)] overflow-hidden">
            <div className="h-1.5 bg-[linear-gradient(90deg,#22C55E_0%,#16A34A_60%,#22C55E_100%)]" />
            <div className="p-8 sm:p-10">
              {tokenStatus === "invalid" ? (
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 mx-auto mb-5 flex items-center justify-center">
                    <span className="text-2xl text-rose-600">!</span>
                  </div>
                  <h2 className="font-serif text-2xl font-bold mb-3">Érvénytelen vagy lejárt link</h2>
                  <p className="text-sm text-admin-gray-600 leading-relaxed mb-6">{tokenError}</p>
                  <p className="text-xs text-admin-gray-500">
                    Kérjen új meghívó linket a Pannon Transfer kapcsolattartójától.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <div className="text-xs font-black tracking-[0.22em] uppercase text-admin-gray-400 mb-2">Belépési fiók</div>
                    <div className="rounded-2xl border border-admin-gray-200 bg-admin-gray-50 px-5 py-4 text-sm font-bold text-admin-gray-800 break-all">
                      {tokenStatus === "loading" ? "Ellenőrzés..." : userEmail}
                    </div>
                    {requireTwoFactor && (
                      <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                        2FA kötelező ennél a hozzáférésnél
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <label className="block">
                      <span className="text-xs font-black tracking-[0.22em] uppercase text-admin-gray-400 mb-2 block">Új jelszó</span>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full rounded-2xl border border-admin-gray-200 bg-admin-gray-50 px-5 py-4 pr-16 text-sm font-semibold outline-none"
                          placeholder="Új jelszó"
                        />
                        <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-admin-gray-500">
                          {showPassword ? "Rejt" : "Mutat"}
                        </button>
                      </div>
                    </label>

                    <label className="block">
                      <span className="text-xs font-black tracking-[0.22em] uppercase text-admin-gray-400 mb-2 block">Jelszó megerősítése</span>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full rounded-2xl border border-admin-gray-200 bg-admin-gray-50 px-5 py-4 pr-16 text-sm font-semibold outline-none"
                          placeholder="Jelszó ismét"
                        />
                        <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-admin-gray-500">
                          {showConfirmPassword ? "Rejt" : "Mutat"}
                        </button>
                      </div>
                    </label>
                  </div>

                  <div className="rounded-2xl border border-admin-gray-200 bg-admin-gray-50 p-5">
                    <div className="text-xs font-black tracking-[0.22em] uppercase text-admin-gray-400 mb-4">Jelszó követelmények</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {rules.map((rule) => (
                        <div key={rule.label} className={`rounded-xl px-3 py-2 text-sm font-semibold ${rule.ok ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-white text-admin-gray-500 border border-admin-gray-200"}`}>
                          {rule.label}
                        </div>
                      ))}
                    </div>
                    {!!confirmPassword && (
                      <div className={`mt-4 text-sm font-bold ${passwordsMatch ? "text-emerald-700" : "text-rose-600"}`}>
                        {passwordsMatch ? "A két jelszó egyezik." : "A két jelszó még nem egyezik."}
                      </div>
                    )}
                  </div>

                  {submitError && (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                      {submitError}
                    </div>
                  )}

                  {submitSuccess && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                      Sikeres aktiválás, átirányítás folyamatban...
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="w-full h-14 rounded-2xl text-white text-sm font-black tracking-[0.2em] uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: "linear-gradient(90deg, #22C55E 0%, #16A34A 60%, #22C55E 100%)" }}
                  >
                    {isSubmitting ? "Aktiválás..." : "Jelszó beállítása"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
