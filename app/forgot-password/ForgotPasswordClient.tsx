"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordClient() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || "Email elküldve.");
        setEmail("");
      } else {
        setErrorMsg(data.message || "Hiba történt.");
      }
    } catch {
      setErrorMsg("Hálózati hiba történt.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans p-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-red-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[40%] h-[40%] bg-amber-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>
      </div>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl p-8 sm:p-12 relative z-10 border border-white">
        <div className="mb-10 text-center">
          <div className="w-16 h-16 bg-gray-900 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-lg shadow-gray-900/20">
            <span className="font-serif text-2xl font-bold text-amber-400 tracking-tighter">PT</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-gray-900 mb-2 tracking-tight">Elfelejtett Jelszó</h1>
          <p className="text-sm text-gray-500 font-medium">Add meg az email címed a visszaállításhoz</p>
        </div>

        {successMsg ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm text-green-700 font-medium bg-green-50 p-4 rounded-xl border border-green-100 mb-6">
              {successMsg}
            </p>
            <Link href="/login" className="text-sm font-semibold text-gray-900 hover:text-gray-600 transition-colors">
              &larr; Vissza a bejelentkezéshez
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-[11px] font-black tracking-widest text-gray-400 uppercase mb-2 ml-1">Email cím</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm outline-none focus:bg-white focus:border-gray-900 transition-all shadow-sm"
                placeholder="pelda@pannon.hu"
              />
            </div>

            {errorMsg && (
              <p className="text-sm text-red-600 font-medium bg-red-50 p-3 rounded-lg border border-red-100 text-center">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full bg-gray-900 text-white rounded-xl py-3.5 text-sm font-bold tracking-wide uppercase hover:bg-gray-800 focus:ring-4 focus:ring-gray-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-gray-900/20"
            >
              {isLoading ? "Küldés..." : "Visszaállító link küldése"}
            </button>

            <div className="text-center pt-4">
              <Link href="/login" className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">
                &larr; Vissza a bejelentkezéshez
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}