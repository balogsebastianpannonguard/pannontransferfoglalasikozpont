"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SchaefflerBookingsClient() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    setIsLoading(false);
    setUserEmail("partner@schaeffler.hu");
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/schaeffler-auth/logout", { method: "POST" });
      router.push("/schaeffler/login");
    } catch {
      // ignore
    }
  };

  return (
    <section className="min-h-screen bg-[#0a3f1a] text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,154,68,0.22),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(0,122,53,0.18),transparent_30%),linear-gradient(180deg,#0d2a12_0%,#0a3f1a_100%)]" />
      <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:30px_30px]" />

      <div className="relative z-10">
        {/* Header */}
        <div className="border-b border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="inline-flex items-center gap-2">
              <span className="text-[1.5rem] font-black tracking-tight text-[#009A44]">Schaeffler</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs font-semibold text-emerald-200">Bejelentkezve mint</div>
                <div className="font-bold text-white">{userEmail}</div>
              </div>
              <button
                onClick={handleLogout}
                className="h-10 px-4 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-black tracking-widest uppercase hover:bg-white/20 transition-colors"
              >
                Kijelentkezés
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="mb-10">
            <h1 className="font-serif text-4xl font-bold tracking-tight mb-2">Foglalások</h1>
            <p className="text-emerald-200 text-lg">Kezelje a Schaeffler transfer foglalásokat.</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-emerald-200 font-semibold">Betöltés...</div>
            </div>
          ) : bookings && bookings.length > 0 ? (
            <div className="grid gap-6">
              {bookings.map((booking: any, idx: number) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-white mb-1">{booking.from} → {booking.to}</h3>
                      <p className="text-emerald-200 text-sm">{booking.date}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white">{booking.price} HUF</div>
                      <div className="text-emerald-200 text-sm">{booking.status}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-12 text-center">
              <p className="text-emerald-200 text-lg mb-6">Nincsenek aktív foglalások.</p>
              <Link
                href="/schaeffler"
                className="h-12 px-6 rounded-2xl bg-[#009A44] text-white text-sm font-black tracking-widest uppercase inline-flex items-center justify-center hover:bg-[#007A35] transition-colors"
              >
                Vissza a főoldalra
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
