"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function EnterAirLoginClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const resultRef = React.useRef<HTMLDivElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/enterair-auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, totpCode: totpCode.trim() }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setLoginError(data.message || "Hiba történt a bejelentkezéskor.");
        if (data.code === "MISSING_2FA") {
          setRequiresTwoFactor(true);
        }
        return;
      }
      setTimeout(() => {
        window.location.href = data.redirectTo || "/enterair";
      }, 500);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Hálózati hiba történt.");
    } finally {
      setIsSubmitting(false);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
  }

  return (
    <section className="min-h-screen bg-[#00334d] text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,91,170,0.22),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(0,120,212,0.18),transparent_30%),linear-gradient(180deg,#001a2e_0%,#00334d_100%)]" />
      <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:30px_30px]" />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-[560px]">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 bg-white rounded-[1.5rem] px-6 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.2)] mb-6">
              <span className="text-[2rem] font-black tracking-tight text-[#005BAA]">Enter Air</span>
            </div>
            <h1 className="font-serif text-4xl font-bold tracking-tight mb-2">Partner Bejelentkezés</h1>
            <p className="text-sm text-cyan-100/90 font-medium">Bejelentkezés az Enter Air dedikált partnerportálra.</p>
          </div>

          <div ref={resultRef} className="rounded-[2rem] border border-white/10 bg-white/95 text-admin-gray-900 shadow-[0_30px_80px_rgba(0,0,0,0.25)] overflow-hidden">
            <div className="h-1.5 bg-[linear-gradient(90deg,#005BAA_0%,#0078D4_60%,#005BAA_100%)]" />
            <div className="p-8 sm:p-10">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block">
                    <span className="text-xs font-black tracking-[0.22em] uppercase text-admin-gray-400 mb-2 block">Email cím</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full rounded-2xl border border-admin-gray-200 bg-admin-gray-50 px-5 py-4 text-sm font-semibold outline-none disabled:opacity-50"
                      placeholder="partner@email.hu"
                      required
                    />
                  </label>
                </div>

                <div>
                  <label className="block">
                    <span className="text-xs font-black tracking-[0.22em] uppercase text-admin-gray-400 mb-2 block">Jelszó</span>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full rounded-2xl border border-admin-gray-200 bg-admin-gray-50 px-5 py-4 pr-16 text-sm font-semibold outline-none disabled:opacity-50"
                        placeholder="Jelszó"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-admin-gray-500"
                        disabled={isSubmitting}
                      >
                        {showPassword ? "Rejt" : "Mutat"}
                      </button>
                    </div>
                  </label>
                </div>

                {requiresTwoFactor && (
                  <div>
                    <label className="block">
                      <span className="text-xs font-black tracking-[0.22em] uppercase text-admin-gray-400 mb-2 block">2FA Kód</span>
                      <input
                        type="text"
                        value={totpCode}
                        onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                        disabled={isSubmitting}
                        className="w-full rounded-2xl border border-admin-gray-200 bg-admin-gray-50 px-5 py-4 text-sm font-semibold outline-none disabled:opacity-50"
                        placeholder="000000"
                        maxLength={6}
                        required
                      />
                    </label>
                  </div>
                )}

                {loginError && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                    {loginError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !email || !password}
                  className="w-full h-14 rounded-2xl text-white text-sm font-black tracking-[0.2em] uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(90deg, #005BAA 0%, #0078D4 60%, #005BAA 100%)" }}
                >
                  {isSubmitting ? "Bejelentkezés..." : "Bejelentkezés"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
