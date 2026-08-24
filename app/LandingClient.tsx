"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingClient() {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerType, setRegisterType] = useState<
    | "crm-invite"
    | "crm-create"
    | "email-admin-invite"
    | "email-admin-create"
    | null
  >(null);

  // CRM Create (direct user)
  const [crmCreateEmail, setCrmCreateEmail] = useState("");
  const [crmCreatePassword, setCrmCreatePassword] = useState("");

  // Email Admin Create
  const [emailAdminCreateEmail, setEmailAdminCreateEmail] = useState("");
  const [emailAdminCreatePassword, setEmailAdminCreatePassword] = useState("");

  // CRM Invite
  const [crmInviteRecipients, setCrmInviteRecipients] = useState("");
  const [crmInviteRequire2fa, setCrmInviteRequire2fa] = useState(true);
  const [crmInviteResults, setCrmInviteResults] = useState<null | {
    total: number;
    success: number;
    failed: number;
    details: { recipient: string; success: boolean; error?: string | null }[];
  }>(null);

  // Email Admin Invite
  const [emailAdminInviteRecipients, setEmailAdminInviteRecipients] = useState("");
  const [emailAdminInviteResults, setEmailAdminInviteResults] = useState<null | {
    total: number;
    success: number;
    failed: number;
    details: { recipient: string; success: boolean; error?: string | null }[];
  }>(null);

  // Generic
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const handleCrmCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: crmCreateEmail, password: crmCreatePassword }),
      });
      const data = await res.json();
      if (data.success) {
        setToast({ type: "success", message: "CRM felhasználó sikeresen létrehozva!" });
        setCrmCreateEmail("");
        setCrmCreatePassword("");
        setRegisterType(null);
        setShowRegisterModal(false);
      } else {
        setToast({ type: "error", message: data.message || "Hiba történt." });
      }
    } catch (err) {
      setToast({ type: "error", message: "Hálózati hiba." });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAdminCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/email-admin/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailAdminCreateEmail, password: emailAdminCreatePassword }),
      });
      const data = await res.json();
      if (data.success) {
        setToast({ type: "success", message: "Email Admin sikeresen létrehozva!" });
        setEmailAdminCreateEmail("");
        setEmailAdminCreatePassword("");
        setRegisterType(null);
        setShowRegisterModal(false);
      } else {
        setToast({ type: "error", message: data.message || "Hiba történt." });
      }
    } catch (err) {
      setToast({ type: "error", message: "Hálózati hiba." });
    } finally {
      setLoading(false);
    }
  };

  const handleCrmInviteSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setCrmInviteResults(null);
    try {
      const recipients = crmInviteRecipients
        .split(/[\n,;]+/g)
        .map((s) => s.trim())
        .filter(Boolean);

      if (recipients.length === 0) {
        setToast({ type: "error", message: "Kérjük, adj meg legalább egy e-mail címet." });
        setLoading(false);
        return;
      }

      const res = await fetch("/api/invites/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients,
          require2fa: crmInviteRequire2fa,
        }),
      });
      const data = await res.json();

      if (data.success || (data.summary && data.summary.success > 0)) {
        setCrmInviteResults({
          total: data.summary?.total ?? recipients.length,
          success: data.summary?.success ?? 0,
          failed: data.summary?.failed ?? 0,
          details:
            data.results?.map((r: any) => ({
              recipient: r.recipient,
              success: r.success,
              error: r.error,
            })) ?? [],
        });
        setToast({
          type: data.success ? "success" : "error",
          message:
            data.message ||
            `${data.summary?.success ?? 0}/${data.summary?.total ?? recipients.length} meghívó elküldve.`,
        });
        if (data.success) setCrmInviteRecipients("");
      } else {
        setToast({ type: "error", message: data.message || "Hiba történt a meghívók küldése közben." });
      }
    } catch (err) {
      setToast({ type: "error", message: "Hálózati hiba." });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAdminInviteSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setEmailAdminInviteResults(null);
    try {
      const recipients = emailAdminInviteRecipients
        .split(/[\n,;]+/g)
        .map((s) => s.trim())
        .filter(Boolean);

      if (recipients.length === 0) {
        setToast({ type: "error", message: "Kérjük, adj meg legalább egy e-mail címet." });
        setLoading(false);
        return;
      }

      const res = await fetch("/api/email-admin/invites/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipients }),
      });
      const data = await res.json();

      if (data.success || (data.summary && data.summary.success > 0)) {
        setEmailAdminInviteResults({
          total: data.summary?.total ?? recipients.length,
          success: data.summary?.success ?? 0,
          failed: data.summary?.failed ?? 0,
          details:
            data.results?.map((r: any) => ({
              recipient: r.recipient,
              success: r.success,
              error: r.error,
            })) ?? [],
        });
        setToast({
          type: data.success ? "success" : "error",
          message:
            data.message ||
            `${data.summary?.success ?? 0}/${data.summary?.total ?? recipients.length} meghívó elküldve.`,
        });
        if (data.success) setEmailAdminInviteRecipients("");
      } else {
        setToast({ type: "error", message: data.message || "Hiba történt a meghívók küldése közben." });
      }
    } catch (err) {
      setToast({ type: "error", message: "Hálózati hiba." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative h-screen w-full bg-[#F7F7F9] text-admin-black font-sans flex flex-col items-center justify-center p-6 lg:p-12 selection:bg-admin-red selection:text-white overflow-hidden">
      {/* ============ ULTRA PREMIUM BACKGROUND ============ */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-[#F7F7F9]" />

        <div className="absolute top-0 left-0 -translate-x-1/4 -translate-y-1/4 w-[1200px] h-[1200px] bg-gradient-to-br from-admin-red/20 to-transparent rounded-full mix-blend-multiply filter blur-[140px] animate-float opacity-80" />
        <div
          className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 w-[1200px] h-[1200px] bg-gradient-to-tl from-admin-yellow/25 to-transparent rounded-full mix-blend-multiply filter blur-[140px] animate-float opacity-80"
          style={{ animationDelay: "2s" }}
        />

        <div className="absolute inset-0 opacity-[0.02] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#000000_1px,transparent_1px),linear-gradient(to_bottom,#000000_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_70%_50%_at_50%_50%,#000_60%,transparent_100%)]" />
      </div>

      {/* ============ TOP RIGHT ACTION BUBBLE ============ */}
      <button
        onClick={() => {
          setShowRegisterModal(true);
          setRegisterType(null);
          setCrmInviteResults(null);
          setEmailAdminInviteResults(null);
        }}
        className={`absolute top-6 right-6 lg:top-10 lg:right-10 z-50 w-12 h-12 rounded-full bg-white/80 backdrop-blur-xl border border-admin-gray-200 shadow-[0_8px_30px_rgba(0,0,0,0.08)] flex items-center justify-center group hover:scale-110 hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] transition-all duration-300 ${isLoaded ? "animate-fade-in" : "opacity-0"}`}
        style={{ animationDelay: "0.5s" }}
        title="Meghívók küldése és új felhasználók létrehozása"
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-admin-red/10 to-admin-yellow/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <svg
          className="w-5 h-5 text-admin-gray-600 group-hover:text-admin-gray-900 transition-colors relative z-10"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 8.688c0-.99.665-1.864 1.615-2.13l5.923-1.692A3 3 0 0112 4.5h0a3 3 0 011.462.366l5.923 1.692A2.25 2.25 0 0121 8.688v5.624c0 .99-.665 1.864-1.615 2.13l-5.923 1.692a3 3 0 01-2.924 0L4.615 16.442A2.25 2.25 0 013 15.312V8.688zM7.5 12.75h9M7.5 9.75h6"
          />
        </svg>
      </button>

      <div className="relative z-10 w-full max-w-[1400px] flex flex-col items-center justify-center h-full max-h-[900px]">
        {/* ============ HEADER ============ */}
        <div
          className={`text-center mb-10 lg:mb-14 flex flex-col items-center shrink-0 ${isLoaded ? "animate-fade-in-up" : "opacity-0"}`}
          style={{ animationDelay: "0.1s", opacity: 0, animationFillMode: "forwards" }}
        >
          <div className="relative flex items-center justify-center w-16 h-16 bg-white rounded-[1.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,1)] border border-admin-gray-200/50 mb-6 group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-admin-gray-50 to-white" />
            <span className="relative font-black text-2xl tracking-tighter bg-gradient-to-br from-admin-red via-admin-yellow to-admin-gray-900 bg-clip-text text-transparent drop-shadow-sm">
              PT
            </span>
          </div>
          <h1 className="font-serif text-4xl lg:text-6xl font-bold tracking-tight text-admin-gray-900 mb-4 drop-shadow-sm">
            Pannon Transfer
          </h1>
          <p className="text-[10px] lg:text-xs font-bold tracking-[0.3em] uppercase text-admin-gray-500">
            Központi Rendszer
          </p>
        </div>

        {/* ============ TWO CARDS ============ */}
        <div className="flex flex-col lg:flex-row items-stretch justify-center gap-6 lg:gap-10 w-full shrink-0 px-4">
          {/* ===== CARD 1: CRM PANEL ===== */}
          <div
            className={`group relative w-full lg:w-[500px] text-left bg-white/70 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_12px_40px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.02)] border border-white/60 hover:border-admin-red/20 overflow-hidden transition-all duration-500 hover:shadow-[0_30px_80px_rgba(229,9,20,0.08),0_0_0_1px_rgba(229,9,20,0.05)] hover:-translate-y-2 flex flex-col ${isLoaded ? "animate-fade-in-up" : "opacity-0"}`}
            style={{ animationDelay: "0.2s", opacity: 0, animationFillMode: "forwards" }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent opacity-100" />

            <div className="p-8 lg:p-12 flex flex-col h-full">
              <div className="flex items-center justify-between mb-8 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-white to-admin-gray-50 flex items-center justify-center shadow-[0_4px_16px_rgba(229,9,20,0.08)] border border-admin-gray-100">
                    <span className="font-black text-xl tracking-tighter text-admin-red">PT</span>
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl font-bold tracking-tight text-admin-gray-900 leading-tight">
                      CRM Panel
                    </h2>
                    <p className="text-[10px] font-black tracking-[0.25em] uppercase text-admin-red/70 mt-1">
                      Client Management
                    </p>
                  </div>
                </div>
                <span className="w-3 h-3 rounded-full bg-admin-red animate-pulse shadow-[0_0_12px_rgba(229,9,20,0.6)]" />
              </div>

              <div className="bg-admin-gray-50/50 rounded-[1.5rem] border border-admin-gray-100/60 p-6 mb-8 space-y-4 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] shrink-0">
                {[
                  "Ügyfelek és partnercégek kezelése",
                  "Foglalási rendszerek és delegációk",
                  "Kétfaktoros hitelesítés (2FA)",
                  "Cégek portál hozzáférések",
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-4 group/item">
                    <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm border border-admin-gray-200/60 group-hover/item:border-admin-red/40 transition-colors">
                      <svg
                        className="w-3.5 h-3.5 text-admin-red/60 group-hover/item:text-admin-red transition-colors"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                    <span className="text-[15px] font-semibold text-admin-gray-600 group-hover/item:text-admin-gray-900 transition-colors">
                      {f}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => router.push("/login")}
                className="mt-auto relative w-full h-14 rounded-2xl bg-admin-gray-900 text-white overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.12)] group-hover:shadow-[0_16px_40px_rgba(229,9,20,0.2)] transition-all duration-300 flex items-center justify-between px-6 group/btn shrink-0"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-admin-red/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500" />
                <span className="relative z-10 font-black tracking-[0.2em] uppercase text-[11px]">
                  Belépés a CRM-be
                </span>
                <div className="relative z-10 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center group-hover/btn:bg-white/20 group-hover/btn:translate-x-1 border border-white/5 transition-all duration-300">
                  <svg
                    className="w-3.5 h-3.5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                  </svg>
                </div>
              </button>
            </div>
          </div>

          {/* ===== CARD 2: EMAIL ADMIN (INVITE CENTER) ===== */}
          <div
            className={`group relative w-full lg:w-[500px] text-left bg-white/70 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_12px_40px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.02)] border border-white/60 hover:border-admin-yellow/40 overflow-hidden transition-all duration-500 hover:shadow-[0_30px_80px_rgba(230,184,0,0.12),0_0_0_1px_rgba(230,184,0,0.08)] hover:-translate-y-2 flex flex-col ${isLoaded ? "animate-fade-in-up" : "opacity-0"}`}
            style={{ animationDelay: "0.3s", opacity: 0, animationFillMode: "forwards" }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent opacity-100" />

            <div className="p-8 lg:p-12 flex flex-col h-full">
              <div className="flex items-center justify-between mb-8 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-white to-admin-gray-50 flex items-center justify-center shadow-[0_4px_16px_rgba(230,184,0,0.12)] border border-admin-gray-100">
                    <span className="font-black text-xl tracking-tighter text-[#C9A000]">PT</span>
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl font-bold tracking-tight text-admin-gray-900 leading-tight">
                      Email Küldő
                    </h2>
                    <p className="text-[10px] font-black tracking-[0.25em] uppercase text-[#B8860B] mt-1">
                      Invite Center
                    </p>
                  </div>
                </div>
                <span className="w-3 h-3 rounded-full bg-admin-yellow animate-pulse shadow-[0_0_12px_rgba(230,184,0,0.6)]" />
              </div>

              <div className="bg-admin-gray-50/50 rounded-[1.5rem] border border-admin-gray-100/60 p-6 mb-8 space-y-4 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] shrink-0">
                {[
                  "Meghívók és emailek küldése",
                  "Partner és delegált felhasználók",
                  "E-mail alapú hitelesítés",
                  "Központi invite menedzsment",
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-4 group/item">
                    <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm border border-admin-gray-200/60 group-hover/item:border-admin-yellow/60 transition-colors">
                      <svg
                        className="w-3.5 h-3.5 text-[#B8860B]/60 group-hover/item:text-[#B8860B] transition-colors"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                    <span className="text-[15px] font-semibold text-admin-gray-600 group-hover/item:text-admin-gray-900 transition-colors">
                      {f}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => router.push("/email-admin/login")}
                className="mt-auto relative w-full h-14 rounded-2xl bg-gradient-to-r from-[#E6B800] to-[#F7C800] text-admin-gray-900 overflow-hidden shadow-[0_8px_24px_rgba(230,184,0,0.2)] group-hover:shadow-[0_16px_40px_rgba(230,184,0,0.35)] transition-all duration-300 flex items-center justify-between px-6 group/btn shrink-0"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/20 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 font-black tracking-[0.2em] uppercase text-[11px] drop-shadow-sm">
                  Belépés az Invite Centerbe
                </span>
                <div className="relative z-10 w-7 h-7 rounded-full bg-admin-gray-900/10 flex items-center justify-center group-hover/btn:bg-admin-gray-900/20 group-hover/btn:translate-x-1 border border-admin-gray-900/5 transition-all duration-300">
                  <svg
                    className="w-3.5 h-3.5 text-admin-gray-900"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                  </svg>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ============ REGISTRATION / INVITE MODAL ============ */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-white/40 backdrop-blur-xl animate-fade-in"
            onClick={() => {
              setShowRegisterModal(false);
              setCrmInviteResults(null);
              setEmailAdminInviteResults(null);
            }}
          />

          <div className="relative w-full max-w-5xl bg-white/90 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.1)] border border-white p-8 lg:p-12 animate-fade-in-up flex flex-col max-h-[90vh] overflow-hidden">
            <button
              onClick={() => {
                setShowRegisterModal(false);
                setCrmInviteResults(null);
                setEmailAdminInviteResults(null);
              }}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-admin-gray-50 flex items-center justify-center text-admin-gray-500 hover:text-admin-gray-900 hover:bg-admin-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-6 shrink-0">
              <h2 className="font-serif text-3xl font-bold tracking-tight text-admin-gray-900 mb-2">
                Meghívók &amp; Fiókok
              </h2>
              <p className="text-xs font-bold tracking-[0.2em] uppercase text-admin-gray-500">
                Mindkét rendszerhez küldj meghívót vagy hozz létre direkt fiókot
              </p>
            </div>

            {toast && (
              <div
                className={`mb-4 p-4 rounded-xl text-center text-sm font-bold animate-fade-in shrink-0 ${
                  toast.type === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {toast.message}
              </div>
            )}

            {!registerType ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 flex-1 overflow-y-auto mt-4 px-1">
                {/* ======== CRM OSZLOP ======== */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full bg-admin-red shadow-[0_0_12px_rgba(229,9,20,0.5)]" />
                      <p className="text-[11px] font-black tracking-[0.28em] uppercase text-admin-red/80">CRM Panel</p>
                    </div>
                    <span className="text-[10px] font-bold tracking-widest uppercase text-admin-gray-400">
                      Partnercégek
                    </span>
                  </div>

                  <button
                    onClick={() => setRegisterType("crm-invite")}
                    className="group relative p-6 rounded-[1.75rem] border border-admin-gray-200 bg-white hover:border-admin-yellow/50 hover:shadow-[0_20px_40px_rgba(230,184,0,0.12)] transition-all duration-500 text-left flex items-center gap-5 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-admin-yellow/10 to-admin-red/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative w-14 h-14 rounded-2xl bg-white border border-admin-gray-100 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-500">
                      <svg
                        className="w-7 h-7 text-[#B8860B]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.8}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 8.688c0-.99.665-1.864 1.615-2.13l5.923-1.692A3 3 0 0112 4.5h0a3 3 0 011.462.366l5.923 1.692A2.25 2.25 0 0121 8.688v5.624c0 .99-.665 1.864-1.615 2.13l-5.923 1.692a3 3 0 01-2.924 0L4.615 16.442A2.25 2.25 0 013 15.312V8.688zM7.5 12.75h9M7.5 9.75h6"
                        />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="relative font-serif text-xl font-bold text-admin-gray-900 mb-1">
                        Partner Meghívása
                      </h3>
                      <p className="relative text-[13px] text-admin-gray-500 leading-relaxed">
                        Több felhasználó egyszerre meghívása emailben. Egyedi linkkel állíthatják be a jelszavat.
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-admin-gray-50 flex items-center justify-center shrink-0 group-hover:translate-x-1 transition-all text-admin-gray-400 group-hover:text-admin-red">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </div>
                  </button>

                  <button
                    onClick={() => setRegisterType("crm-create")}
                    className="group relative p-6 rounded-[1.75rem] border border-admin-gray-200 bg-white hover:border-admin-red/30 hover:shadow-[0_20px_40px_rgba(229,9,20,0.08)] transition-all duration-500 text-left flex items-center gap-5 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-admin-red/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative w-14 h-14 rounded-2xl bg-white border border-admin-gray-100 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-500">
                      <span className="font-black text-xl tracking-tighter text-admin-red">PT</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="relative font-serif text-xl font-bold text-admin-gray-900 mb-1">
                        Fiók Létrehozása
                      </h3>
                      <p className="relative text-[13px] text-admin-gray-500 leading-relaxed">
                        Közvetlen CRM user létrehozása előre megadott jelszóval. Azonnal be tud jelentkezni.
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-admin-gray-50 flex items-center justify-center shrink-0 group-hover:translate-x-1 transition-all text-admin-gray-400 group-hover:text-admin-red">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </div>
                  </button>
                </div>

                {/* ======== EMAIL ADMIN OSZLOP ======== */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full bg-admin-yellow shadow-[0_0_12px_rgba(230,184,0,0.5)]" />
                      <p className="text-[11px] font-black tracking-[0.28em] uppercase text-[#B8860B]">Email Admin</p>
                    </div>
                    <span className="text-[10px] font-bold tracking-widest uppercase text-admin-gray-400">
                      Invite Center
                    </span>
                  </div>

                  <button
                    onClick={() => setRegisterType("email-admin-invite")}
                    className="group relative p-6 rounded-[1.75rem] border border-admin-gray-200 bg-white hover:border-admin-yellow/60 hover:shadow-[0_20px_40px_rgba(230,184,0,0.18)] transition-all duration-500 text-left flex items-center gap-5 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-admin-yellow/12 via-admin-yellow/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative w-14 h-14 rounded-2xl bg-white border border-admin-gray-100 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-500">
                      <div className="flex flex-col items-center">
                        <span className="font-black text-lg tracking-tighter text-[#B8860B] -mb-0.5">PT</span>
                        <svg
                          className="w-5 h-5 text-[#B8860B]/70 mt-0.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.8}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 8.688c0-.99.665-1.864 1.615-2.13l5.923-1.692A3 3 0 0112 4.5h0a3 3 0 011.462.366l5.923 1.692A2.25 2.25 0 0121 8.688v5.624c0 .99-.665 1.864-1.615 2.13l-5.923 1.692a3 3 0 01-2.924 0L4.615 16.442A2.25 2.25 0 013 15.312V8.688zM7.5 12.75h9M7.5 9.75h6"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="relative font-serif text-xl font-bold text-admin-gray-900 mb-1">
                        Admin Meghívása
                      </h3>
                      <p className="relative text-[13px] text-admin-gray-500 leading-relaxed">
                        Több admin egyszerre meghívása emailben. Egyedi linkkel állíthatják be az admin jelszavat.
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-admin-gray-50 flex items-center justify-center shrink-0 group-hover:translate-x-1 transition-all text-admin-gray-400 group-hover:text-[#B8860B]">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </div>
                  </button>

                  <button
                    onClick={() => setRegisterType("email-admin-create")}
                    className="group relative p-6 rounded-[1.75rem] border border-admin-gray-200 bg-white hover:border-admin-yellow/50 hover:shadow-[0_20px_40px_rgba(230,184,0,0.15)] transition-all duration-500 text-left flex items-center gap-5 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-admin-yellow/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative w-14 h-14 rounded-2xl bg-white border border-admin-gray-100 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-500">
                      <span className="font-black text-xl tracking-tighter text-[#B8860B]">PT</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="relative font-serif text-xl font-bold text-admin-gray-900 mb-1">
                        Admin Létrehozása
                      </h3>
                      <p className="relative text-[13px] text-admin-gray-500 leading-relaxed">
                        Közvetlen Invite Center admin létrehozása e-mail + jelszó párossal. Azonnal be tud lépni.
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-admin-gray-50 flex items-center justify-center shrink-0 group-hover:translate-x-1 transition-all text-admin-gray-400 group-hover:text-[#B8860B]">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center w-full max-w-[640px] mx-auto mt-2 overflow-y-auto pr-1">
                {/* Back button (iOS style, top left of the form area) */}
                <div className="w-full flex justify-start mb-5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setRegisterType(null);
                      setCrmInviteResults(null);
                      setEmailAdminInviteResults(null);
                    }}
                    className="group flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-admin-gray-400 hover:text-admin-gray-900 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-admin-gray-50 border border-admin-gray-200 flex items-center justify-center group-hover:bg-admin-gray-100 group-hover:border-admin-gray-300 transition-all">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                      </svg>
                    </div>
                    Vissza
                  </button>
                </div>

                {/* ======== FORM 1: CRM CREATE ======== */}
                {registerType === "crm-create" && (
                  <div className="w-full bg-admin-gray-50/50 rounded-[2rem] border border-admin-gray-100/60 p-8 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] animate-fade-in-up shrink-0">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm border border-admin-red/10">
                        <span className="font-black text-xl tracking-tighter text-admin-red">PT</span>
                      </div>
                      <div>
                        <h3 className="font-serif text-xl font-bold text-admin-gray-900">CRM Fiók Létrehozása</h3>
                        <p className="text-[9px] font-black tracking-[0.2em] uppercase text-admin-red/70 mt-0.5">
                          Központi CRM Rendszer • Direct
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleCrmCreate} className="w-full space-y-5">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black tracking-[0.2em] uppercase text-admin-gray-500 ml-1">
                          E-mail cím
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-0 bg-gradient-to-r from-admin-red/20 to-admin-yellow/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-admin-gray-400 group-focus-within:text-admin-red transition-colors z-10">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                              />
                            </svg>
                          </div>
                          <input
                            type="email"
                            required
                            value={crmCreateEmail}
                            onChange={(e) => setCrmCreateEmail(e.target.value)}
                            className="relative w-full bg-white border border-admin-gray-200/80 rounded-2xl pl-12 pr-6 py-4 text-sm font-medium text-admin-gray-900 outline-none focus:border-admin-red/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all"
                            placeholder="pelda@ceg.hu"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black tracking-[0.2em] uppercase text-admin-gray-500 ml-1">
                          Jelszó
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-0 bg-gradient-to-r from-admin-red/20 to-admin-yellow/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-admin-gray-400 group-focus-within:text-admin-red transition-colors z-10">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                              />
                            </svg>
                          </div>
                          <input
                            type="password"
                            required
                            value={crmCreatePassword}
                            onChange={(e) => setCrmCreatePassword(e.target.value)}
                            className="relative w-full bg-white border border-admin-gray-200/80 rounded-2xl pl-12 pr-6 py-4 text-sm font-medium text-admin-gray-900 outline-none focus:border-admin-red/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all"
                            placeholder="••••••••"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="group relative w-full mt-6 rounded-2xl bg-admin-gray-900 text-white overflow-hidden shadow-[0_8px_20px_rgba(0,0,0,0.12)] hover:shadow-[0_16px_32px_rgba(229,9,20,0.25)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-admin-red/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative px-6 py-4 flex items-center justify-center gap-3">
                          <span className="font-black tracking-[0.2em] uppercase text-[11px] drop-shadow-sm">
                            {loading ? "Létrehozás..." : "CRM Fiók Létrehozása"}
                          </span>
                          {!loading && (
                            <svg
                              className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2.5}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                          )}
                        </div>
                      </button>
                    </form>
                  </div>
                )}

                {/* ======== FORM 2: EMAIL ADMIN CREATE ======== */}
                {registerType === "email-admin-create" && (
                  <div className="w-full bg-admin-gray-50/50 rounded-[2rem] border border-admin-gray-100/60 p-8 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] animate-fade-in-up shrink-0">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm border border-admin-yellow/20">
                        <span className="font-black text-xl tracking-tighter text-[#B8860B]">PT</span>
                      </div>
                      <div>
                        <h3 className="font-serif text-xl font-bold text-admin-gray-900">Email Admin Létrehozása</h3>
                        <p className="text-[9px] font-black tracking-[0.2em] uppercase text-[#B8860B] mt-0.5">
                          Invite Center • Admin Jogok • Direct
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleEmailAdminCreate} className="w-full space-y-5">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black tracking-[0.2em] uppercase text-admin-gray-500 ml-1">
                          E-mail cím
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-0 bg-gradient-to-r from-admin-yellow/30 to-admin-red/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-admin-gray-400 group-focus-within:text-[#B8860B] transition-colors z-10">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                              />
                            </svg>
                          </div>
                          <input
                            type="email"
                            required
                            value={emailAdminCreateEmail}
                            onChange={(e) => setEmailAdminCreateEmail(e.target.value)}
                            className="relative w-full bg-white border border-admin-gray-200/80 rounded-2xl pl-12 pr-6 py-4 text-sm font-medium text-admin-gray-900 outline-none focus:border-admin-yellow/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all"
                            placeholder="admin@pannon.hu"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black tracking-[0.2em] uppercase text-admin-gray-500 ml-1">
                          Jelszó
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-0 bg-gradient-to-r from-admin-yellow/30 to-admin-red/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-admin-gray-400 group-focus-within:text-[#B8860B] transition-colors z-10">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                              />
                            </svg>
                          </div>
                          <input
                            type="password"
                            required
                            value={emailAdminCreatePassword}
                            onChange={(e) => setEmailAdminCreatePassword(e.target.value)}
                            className="relative w-full bg-white border border-admin-gray-200/80 rounded-2xl pl-12 pr-6 py-4 text-sm font-medium text-admin-gray-900 outline-none focus:border-admin-yellow/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all"
                            placeholder="••••••••"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="group relative w-full mt-6 rounded-2xl bg-gradient-to-r from-[#E6B800] to-[#F7C800] text-admin-gray-900 overflow-hidden shadow-[0_8px_20px_rgba(230,184,0,0.2)] hover:shadow-[0_16px_32px_rgba(230,184,0,0.35)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="relative px-6 py-4 flex items-center justify-center gap-3">
                          <span className="font-black tracking-[0.2em] uppercase text-[11px] drop-shadow-sm">
                            {loading ? "Létrehozás..." : "Email Admin Létrehozása"}
                          </span>
                          {!loading && (
                            <svg
                              className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2.5}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                          )}
                        </div>
                      </button>
                    </form>
                  </div>
                )}

                {/* ======== FORM 3: CRM INVITE ======== */}
                {registerType === "crm-invite" && (
                  <div className="w-full bg-admin-gray-50/50 rounded-[2rem] border border-admin-gray-100/60 p-8 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] animate-fade-in-up shrink-0">
                    <div className="flex items-center gap-4 mb-7">
                      <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm border border-admin-gray-100">
                        <svg
                          className="w-6 h-6 text-admin-red"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.8}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 8.688c0-.99.665-1.864 1.615-2.13l5.923-1.692A3 3 0 0112 4.5h0a3 3 0 011.462.366l5.923 1.692A2.25 2.25 0 0121 8.688v5.624c0 .99-.665 1.864-1.615 2.13l-5.923 1.692a3 3 0 01-2.924 0L4.615 16.442A2.25 2.25 0 013 15.312V8.688zM7.5 12.75h9M7.5 9.75h6"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-serif text-xl font-bold text-admin-gray-900">CRM Partner Meghívása</h3>
                        <p className="text-[9px] font-black tracking-[0.2em] uppercase text-admin-red/70 mt-0.5">
                          E-mailben küldött meghívók • Token
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleCrmInviteSend} className="w-full space-y-5">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black tracking-[0.2em] uppercase text-admin-gray-500 ml-1">
                          Címzettek (több is, új sor vagy vesszővel elválasztva)
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-0 bg-gradient-to-r from-admin-red/15 to-admin-yellow/25 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                          <div className="absolute left-4 top-4 text-admin-gray-400 group-focus-within:text-admin-red transition-colors z-10">
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                          </div>
                          <textarea
                            required
                            rows={4}
                            value={crmInviteRecipients}
                            onChange={(e) => setCrmInviteRecipients(e.target.value)}
                            placeholder={"ceg1@pannon.hu\nceg2@pannon.hu, ceg3@pannon.hu"}
                            className="relative w-full bg-white border border-admin-gray-200/80 rounded-2xl pl-12 pr-6 py-4 text-sm font-medium text-admin-gray-900 outline-none focus:border-admin-red/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all resize-y min-h-[110px] font-sans"
                          />
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/80 border border-admin-gray-100/60">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={crmInviteRequire2fa}
                          onClick={() => setCrmInviteRequire2fa((v) => !v)}
                          className={`relative w-12 h-7 rounded-full transition-colors duration-300 shrink-0 mt-0.5 ${crmInviteRequire2fa ? "bg-admin-red" : "bg-admin-gray-200"}`}
                        >
                          <span
                            className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-transform duration-300 ${crmInviteRequire2fa ? "translate-x-5" : "translate-x-0"}`}
                          />
                        </button>
                        <div className="flex-1 min-w-0">
                          <label className="block text-[11px] font-black tracking-[0.2em] uppercase text-admin-gray-600 mb-1">
                            Kétfaktoros hitelesítés kötelező
                          </label>
                          <p className="text-xs text-admin-gray-500 leading-relaxed">
                            Kapcsolt állapotban a meghívottaknek első belépéskor be kell állítaniuk a Google
                            Authenticatorral a 2FÁ-t.
                          </p>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="group relative w-full mt-2 rounded-2xl bg-admin-gray-900 text-white overflow-hidden shadow-[0_8px_20px_rgba(0,0,0,0.12)] hover:shadow-[0_16px_32px_rgba(229,9,20,0.25)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-admin-red/20 to-admin-yellow/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="relative px-6 py-4 flex items-center justify-center gap-3">
                          {loading ? (
                            <>
                              <svg
                                className="w-4 h-4 animate-spin text-white/60"
                                viewBox="0 0 24 24"
                                fill="none"
                              >
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              <span className="font-black tracking-[0.2em] uppercase text-[11px]">
                                Küldés folyamatban...
                              </span>
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2.2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                                />
                              </svg>
                              <span className="font-black tracking-[0.2em] uppercase text-[11px]">
                                CRM Meghívók Küldése
                              </span>
                            </>
                          )}
                        </div>
                      </button>
                    </form>

                    {crmInviteResults && (
                      <div className="mt-6 space-y-2 animate-fade-in">
                        <div
                          className={`flex items-center justify-between gap-4 p-3 rounded-xl border ${crmInviteResults.failed === 0 ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"}`}
                        >
                          <div>
                            <div className="text-[10px] font-black tracking-[0.2em] uppercase text-admin-gray-500 mb-0.5">
                              Összegzés
                            </div>
                            <div className="text-sm font-bold text-admin-gray-800">
                              {crmInviteResults.success}/{crmInviteResults.total} sikeres meghívó
                              {crmInviteResults.failed > 0 && (
                                <span className="text-red-600"> • {crmInviteResults.failed} sikertelen</span>
                              )}
                            </div>
                          </div>
                          <div
                            className={`rounded-full px-3 py-1 text-[10px] font-black tracking-widest uppercase ${crmInviteResults.failed === 0 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-800"}`}
                          >
                            {crmInviteResults.failed === 0 ? "Minden rendben" : "Részleges siker"}
                          </div>
                        </div>
                        {crmInviteResults.details.length > 0 &&
                          crmInviteResults.details.some((d) => !d.success) && (
                            <div className="rounded-xl bg-white/80 border border-admin-gray-100 overflow-hidden">
                              <div className="px-4 py-2 bg-admin-gray-50 border-b border-admin-gray-100">
                                <p className="text-[10px] font-black tracking-[0.2em] uppercase text-admin-gray-500">
                                  Sikertelen címzettek
                                </p>
                              </div>
                              <ul className="divide-y divide-admin-gray-100 max-h-32 overflow-y-auto">
                                {crmInviteResults.details
                                  .filter((d) => !d.success)
                                  .map((d, i) => (
                                    <li key={i} className="px-4 py-2.5 flex items-start gap-3">
                                      <svg
                                        className="w-4 h-4 text-red-500 shrink-0 mt-0.5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2.5}
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                                        />
                                      </svg>
                                      <div className="min-w-0 flex-1">
                                        <div className="text-xs font-semibold text-admin-gray-800 break-all">
                                          {d.recipient}
                                        </div>
                                        <div className="text-[11px] text-red-600 mt-0.5">{d.error || "Ismeretlen hiba"}</div>
                                      </div>
                                    </li>
                                  ))}
                              </ul>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                )}

                {/* ======== FORM 4: EMAIL ADMIN INVITE ======== */}
                {registerType === "email-admin-invite" && (
                  <div className="w-full bg-admin-gray-50/50 rounded-[2rem] border border-admin-gray-100/60 p-8 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] animate-fade-in-up shrink-0">
                    <div className="flex items-center gap-4 mb-7">
                      <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm border border-admin-yellow/20">
                        <svg
                          className="w-6 h-6 text-[#B8860B]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.8}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 8.688c0-.99.665-1.864 1.615-2.13l5.923-1.692A3 3 0 0112 4.5h0a3 3 0 011.462.366l5.923 1.692A2.25 2.25 0 0121 8.688v5.624c0 .99-.665 1.864-1.615 2.13l-5.923 1.692a3 3 0 01-2.924 0L4.615 16.442A2.25 2.25 0 013 15.312V8.688zM7.5 12.75h9M7.5 9.75h6"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-serif text-xl font-bold text-admin-gray-900">Email Admin Meghívása</h3>
                        <p className="text-[9px] font-black tracking-[0.2em] uppercase text-[#B8860B] mt-0.5">
                          Invite Center Adminok • E-mailben
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleEmailAdminInviteSend} className="w-full space-y-5">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black tracking-[0.2em] uppercase text-admin-gray-500 ml-1">
                          Admin Címzettek (több is, új sor vagy vesszővel elválasztva)
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-0 bg-gradient-to-r from-admin-yellow/30 to-admin-yellow/10 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                          <div className="absolute left-4 top-4 text-admin-gray-400 group-focus-within:text-[#B8860B] transition-colors z-10">
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                          </div>
                          <textarea
                            required
                            rows={4}
                            value={emailAdminInviteRecipients}
                            onChange={(e) => setEmailAdminInviteRecipients(e.target.value)}
                            placeholder={"admin1@pannon.hu\nadmin2@pannon.hu, admin3@pannon.hu"}
                            className="relative w-full bg-white border border-admin-gray-200/80 rounded-2xl pl-12 pr-6 py-4 text-sm font-medium text-admin-gray-900 outline-none focus:border-admin-yellow/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all resize-y min-h-[110px] font-sans"
                          />
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white/80 border border-admin-gray-100/60 p-4 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-admin-yellow/15 border border-admin-yellow/25 flex items-center justify-center shrink-0 mt-0.5">
                          <svg
                            className="w-4 h-4 text-[#B8860B]"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-black tracking-[0.2em] uppercase text-[#B8860B]/80 mb-1">
                            Admin Jogok
                          </p>
                          <p className="text-xs text-admin-gray-500 leading-relaxed">
                            A meghívottak admin jogokkal fognak rendelkezni az Invite Centerben. A meghívók
                            kizárólag új fiókokhoz használhatók, a már létező adminokra nincs hatással.
                          </p>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="group relative w-full mt-2 rounded-2xl bg-gradient-to-r from-[#E6B800] to-[#F7C800] text-admin-gray-900 overflow-hidden shadow-[0_8px_20px_rgba(230,184,0,0.2)] hover:shadow-[0_16px_32px_rgba(230,184,0,0.35)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="relative px-6 py-4 flex items-center justify-center gap-3">
                          {loading ? (
                            <>
                              <svg
                                className="w-4 h-4 animate-spin text-admin-gray-900/60"
                                viewBox="0 0 24 24"
                                fill="none"
                              >
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              <span className="font-black tracking-[0.2em] uppercase text-[11px] drop-shadow-sm">
                                Küldés folyamatban...
                              </span>
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2.2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                                />
                              </svg>
                              <span className="font-black tracking-[0.2em] uppercase text-[11px] drop-shadow-sm">
                                Admin Meghívók Küldése
                              </span>
                            </>
                          )}
                        </div>
                      </button>
                    </form>

                    {emailAdminInviteResults && (
                      <div className="mt-6 space-y-2 animate-fade-in">
                        <div
                          className={`flex items-center justify-between gap-4 p-3 rounded-xl border ${emailAdminInviteResults.failed === 0 ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"}`}
                        >
                          <div>
                            <div className="text-[10px] font-black tracking-[0.2em] uppercase text-admin-gray-500 mb-0.5">
                              Összegzés
                            </div>
                            <div className="text-sm font-bold text-admin-gray-800">
                              {emailAdminInviteResults.success}/{emailAdminInviteResults.total} sikeres admin meghívó
                              {emailAdminInviteResults.failed > 0 && (
                                <span className="text-red-600"> • {emailAdminInviteResults.failed} sikertelen</span>
                              )}
                            </div>
                          </div>
                          <div
                            className={`rounded-full px-3 py-1 text-[10px] font-black tracking-widest uppercase ${emailAdminInviteResults.failed === 0 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-800"}`}
                          >
                            {emailAdminInviteResults.failed === 0 ? "Minden rendben" : "Részleges siker"}
                          </div>
                        </div>
                        {emailAdminInviteResults.details.length > 0 &&
                          emailAdminInviteResults.details.some((d) => !d.success) && (
                            <div className="rounded-xl bg-white/80 border border-admin-gray-100 overflow-hidden">
                              <div className="px-4 py-2 bg-admin-gray-50 border-b border-admin-gray-100">
                                <p className="text-[10px] font-black tracking-[0.2em] uppercase text-admin-gray-500">
                                  Sikertelen címzettek
                                </p>
                              </div>
                              <ul className="divide-y divide-admin-gray-100 max-h-32 overflow-y-auto">
                                {emailAdminInviteResults.details
                                  .filter((d) => !d.success)
                                  .map((d, i) => (
                                    <li key={i} className="px-4 py-2.5 flex items-start gap-3">
                                      <svg
                                        className="w-4 h-4 text-red-500 shrink-0 mt-0.5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2.5}
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                                        />
                                      </svg>
                                      <div className="min-w-0 flex-1">
                                        <div className="text-xs font-semibold text-admin-gray-800 break-all">
                                          {d.recipient}
                                        </div>
                                        <div className="text-[11px] text-red-600 mt-0.5">{d.error || "Ismeretlen hiba"}</div>
                                      </div>
                                    </li>
                                  ))}
                              </ul>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ FOOTER (ABSOLUTE BOTTOM) ============ */}
      <div
        className={`absolute bottom-6 lg:bottom-8 left-1/2 -translate-x-1/2 flex items-center justify-center gap-6 text-[10px] font-bold tracking-[0.25em] text-admin-gray-400 uppercase ${isLoaded ? "animate-fade-in" : "opacity-0"}`}
        style={{ animationDelay: "0.4s", opacity: 0, animationFillMode: "forwards" }}
      >
        <span>© {new Date().getFullYear()} Pannon Transfer</span>

        <div className="relative group cursor-pointer flex items-center">
          <span className="w-1.5 h-1.5 rounded-full bg-admin-gray-300 mx-4 group-hover:bg-admin-gray-900 transition-colors" />
          <span className="hover:text-admin-gray-900 transition-colors duration-300">Support</span>

          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-[280px] p-4 bg-white/95 backdrop-blur-xl border border-admin-gray-100 rounded-2xl shadow-2xl opacity-0 translate-y-4 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 z-50">
            <div className="flex flex-col items-center text-center gap-2">
              <p className="text-admin-gray-900 font-black text-sm normal-case tracking-normal">Balog Sebastian Máté</p>
              <div className="w-full h-px bg-admin-gray-100 my-1" />
              <a
                href="mailto:balog.sebastian@pannonguard.hu"
                className="text-admin-red hover:text-admin-red-dark transition-colors normal-case tracking-normal text-xs font-semibold"
              >
                balog.sebastian@pannonguard.hu
              </a>
              <a
                href="tel:+36306654135"
                className="text-admin-gray-600 hover:text-admin-gray-900 transition-colors normal-case tracking-normal text-xs font-mono font-bold"
              >
                +36 30 665 4135
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
