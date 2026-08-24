"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface SendResult {
  recipient: string;
  success: boolean;
  messageId: string | null;
  error: string | null;
  setupLink?: string | null;
  expiresAt?: number | null;
}

interface HistoryEntry {
  id: string;
  timestamp: number;
  subject: string;
  recipients: string[];
  summary: { total: number; success: number; failed: number };
}

interface DbUserItem {
  id: string;
  email: string;
  normalizedEmail: string;
  isInviteAccepted: boolean;
  twoFactorEnabled: boolean;
  hasPassword: boolean;
  failedLoginAttempts: number;
  isLocked: boolean;
  lockedUntil: number | null;
  createdAt: number;
  updatedAt: number;
  lastLoginAt: number | null;
  role: "admin" | "user";
}

interface DbUserCounts {
  total: number;
  pending: number;
  active: number;
}

const DEFAULT_SUBJECT = "Meghívás a Pannon Transfer CRM rendszerhez";

function getHistoryFromStorage(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("pannon_email_invite_history");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setHistoryToStorage(history: HistoryEntry[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("pannon_email_invite_history", JSON.stringify(history.slice(0, 50)));
  } catch {
    // ignore
  }
}

export default function EmailAdminDashboard() {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);
  const [username, setUsername] = useState("admin");
  const [smtpStatus, setSmtpStatus] = useState<"loading" | "connected" | "disconnected">("loading");
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const [recipientsText, setRecipientsText] = useState("");
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [customMessage, setCustomMessage] = useState("");
  const [loginBaseUrl, setLoginBaseUrl] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [lastResults, setLastResults] = useState<SendResult[] | null>(null);
  const [lastSummary, setLastSummary] = useState<{ total: number; success: number; failed: number } | null>(null);

  const resultScrollRef = useRef<HTMLDivElement>(null);

  // DB Users (Előzmények / Felhasználók panel)
  const [dbUsers, setDbUsers] = useState<DbUserItem[]>([]);
  const [dbUsersLoading, setDbUsersLoading] = useState(false);
  const [dbCounts, setDbCounts] = useState<DbUserCounts | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; email: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<"invite" | "history" | "users">("invite");

  async function fetchDbUsers() {
    setDbUsersLoading(true);
    try {
      const res = await fetch("/api/email-admin/users", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setDbUsers(Array.isArray(data.users) ? data.users : []);
          setDbCounts(data.counts || null);
        }
      }
    } catch {
      // ignore
    } finally {
      setDbUsersLoading(false);
    }
  }

  useEffect(() => {
    setIsLoaded(true);
    setHistory(getHistoryFromStorage());
    if (typeof window !== "undefined") {
      setLoginBaseUrl(`${window.location.protocol}//${window.location.host}`);
    }
    (async () => {
      try {
        const res = await fetch("/api/email-admin/session");
        if (res.ok) {
          const data = await res.json();
          if (data?.user?.username) setUsername(data.user.username);
        }
        const statusRes = await fetch("/api/status");
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setSmtpStatus(statusData?.services?.smtp?.success ? "connected" : "disconnected");
        } else {
          setSmtpStatus("disconnected");
        }
      } catch {
        setSmtpStatus("disconnected");
      }
    })();
    fetchDbUsers();
  }, []);

  async function toggleUserLock(id: string, currentLockStatus: boolean) {
    if (!confirm(`Biztosan ${currentLockStatus ? "feloldod" : "zárolod"} ezt a felhasználót?`)) return;
    try {
      const res = await fetch("/api/email-admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isLocked: !currentLockStatus }),
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          await fetchDbUsers();
        } else {
          alert(data.message || "Hiba történt a módosítás során.");
        }
      } else {
        alert("Hiba történt a kérés során.");
      }
    } catch {
      alert("Hálózati hiba történt.");
    }
  }

  async function executeDeleteConfirm() {
    if (!confirmDelete) return;
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/email-admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: confirmDelete.id }),
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setConfirmDelete(null);
          await fetchDbUsers();
        } else {
          alert(data.message || "Nem sikerült törölni a felhasználót.");
        }
      } else {
        let msg = "Hiba történt a törlés során.";
        try {
          const data = await res.json();
          if (data?.message) msg = data.message;
        } catch {}
        alert(msg);
      }
    } catch {
      alert("Hálózati hiba történt. Kérjük, próbálja újra.");
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/email-admin/logout", { method: "POST" });
    } catch {
      // ignore
    }
    router.push("/email-admin/login");
    router.refresh();
  }

  function parseRecipients(text: string): string[] {
    return text
      .split(/[\n,;]+/)
      .map((r) => r.trim())
      .filter(Boolean);
  }

  function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError(null);
    setIsLoading(true);
    setLastResults(null);
    setLastSummary(null);

    const recipients = parseRecipients(recipientsText);
    if (recipients.length === 0) {
      setGlobalError("Kérjük, add meg a címzett email címét (vesszővel vagy új sorral elválasztva többet is).");
      setIsLoading(false);
      return;
    }

    const invalid = recipients.filter((r) => !isValidEmail(r));
    if (invalid.length > 0) {
      setGlobalError(`Érvénytelen címzettek: ${invalid.join(", ")}`);
      setIsLoading(false);
      return;
    }

    try {
        const response = await fetch("/api/email-admin/invites/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients,
          loginBaseUrl: loginBaseUrl.trim(),
        }),
      });

      const data = await response.json();

      if (data.results) setLastResults(data.results as SendResult[]);
      if (data.summary) setLastSummary(data.summary);

      if (!response.ok || !data.success) {
        setGlobalError(data.message || "Hiba történt az email küldése közben.");
      }

      if (data.summary) {
        const entry: HistoryEntry = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          timestamp: Date.now(),
          subject: subject.trim() || DEFAULT_SUBJECT,
          recipients,
          summary: data.summary,
        };
        const newHistory = [entry, ...history];
        setHistory(newHistory);
        setHistoryToStorage(newHistory);
      }

      if (data.success) {
        setRecipientsText("");
      }

      setTimeout(() => {
        resultScrollRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    } catch {
      setGlobalError("Hálózati hiba történt. Kérjük, próbálja újra.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="relative min-h-screen w-full bg-admin-gray-50 text-admin-gray-900 font-sans flex selection:bg-admin-yellow selection:text-white">

      {/* ================= SIDEBAR ================= */}
      <aside className="fixed lg:static inset-y-0 left-0 z-50 w-[280px] shrink-0 bg-white border-r border-admin-gray-200 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        {/* Sidebar Brand */}
        <div className="px-8 py-8 border-b border-admin-gray-100 flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-admin-yellow to-admin-red rounded-xl flex items-center justify-center shadow-sm shrink-0">
            <span className="text-white font-black text-lg tracking-tighter">PT</span>
          </div>
          <div className="min-w-0">
            <div className="font-serif text-lg font-bold tracking-tight text-admin-gray-900 leading-tight">
              Email Admin
            </div>
            <div className="text-[10px] font-medium tracking-widest text-admin-gray-500 uppercase mt-0.5">
              Pannon Transfer Invite
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
          <div className="px-4 pb-3">
            <span className="text-[10px] font-bold tracking-widest uppercase text-admin-gray-400">
              Vezérlés
            </span>
          </div>
          <button 
            onClick={() => setActiveTab("invite")}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-colors ${activeTab === "invite" ? "bg-admin-gray-900 text-white shadow-md cursor-default" : "text-admin-gray-600 hover:bg-admin-gray-100 hover:text-admin-gray-900"}`}>
            <div className={`w-5 h-5 shrink-0 ${activeTab === "invite" ? "text-white" : "text-admin-gray-400"}`}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <span className="text-sm font-medium tracking-tight flex-1 text-left">Invite Küldés</span>
          </button>

          <button 
            onClick={() => setActiveTab("history")}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-colors ${activeTab === "history" ? "bg-admin-gray-900 text-white shadow-md cursor-default" : "text-admin-gray-600 hover:bg-admin-gray-100 hover:text-admin-gray-900"}`}>
            <div className={`w-5 h-5 shrink-0 ${activeTab === "history" ? "text-white" : "text-admin-gray-400"}`}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium tracking-tight flex-1 text-left">Előzmények</span>
            {history.length > 0 && (
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${activeTab === "history" ? "bg-white/20 text-white" : "bg-admin-yellow/15 text-admin-gray-900"}`}>
                {history.length}
              </span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab("users")}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-colors ${activeTab === "users" ? "bg-admin-gray-900 text-white shadow-md cursor-default" : "text-admin-gray-600 hover:bg-admin-gray-100 hover:text-admin-gray-900"}`}>
            <div className={`w-5 h-5 shrink-0 ${activeTab === "users" ? "text-white" : "text-admin-gray-400"}`}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium tracking-tight flex-1 text-left">Emberek</span>
            {dbCounts && (
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${activeTab === "users" ? "bg-white/20 text-white" : "bg-admin-yellow/15 text-admin-gray-900"}`}>
                {dbCounts.total}
              </span>
            )}
          </button>
        </nav>

        {/* Sidebar footer - User */}
        <div className="p-4 border-t border-admin-gray-100">
          <div className="p-4 rounded-xl bg-admin-gray-50 border border-admin-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white border border-admin-gray-200 flex items-center justify-center shrink-0 shadow-sm">
                <span className="font-bold text-admin-gray-700 text-xs">
                  {username ? username.charAt(0).toUpperCase() : "E"}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-admin-gray-900 font-semibold text-sm truncate capitalize">
                  {username || "Email Admin"}
                </div>
                <div className="text-[10px] font-medium text-admin-gray-500 truncate">
                  Invite Center
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-admin-gray-200 rounded-lg text-admin-gray-600 hover:text-admin-red hover:border-admin-red/30 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              <span className="text-[11px] font-bold tracking-wider uppercase">Kijelentkezés</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <div className="flex-1 min-w-0 flex flex-col relative">

        {/* ---------- TOP BAR ---------- */}
        <header className="sticky top-0 z-30 border-b border-admin-gray-200 bg-white/80 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4 px-8 py-5 h-[80px]">
            <div>
              <div className="text-[10px] font-black tracking-widest uppercase text-admin-gray-400 mb-1">
                Pannon Transfer • Invite Center
              </div>
              <h1 className="font-serif text-2xl font-bold tracking-tight text-admin-gray-900">
                CRM Meghívó Küldés
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-3 bg-admin-gray-50 border border-admin-gray-200 px-4 py-2 rounded-full shadow-sm">
                <div
                  className={`w-2 h-2 rounded-full ${smtpStatus === "connected" ? "bg-green-500" : smtpStatus === "loading" ? "bg-admin-yellow animate-pulse" : "bg-admin-gray-400"}`}
                />
                <span className="text-[10px] font-bold tracking-widest uppercase text-admin-gray-500">
                  {smtpStatus === "connected"
                    ? "SMTP Online"
                    : smtpStatus === "loading"
                      ? "Csatlakozás..."
                      : "SMTP Offline"}
                </span>
              </div>
              <a
                href="/login"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-admin-gray-100 hover:bg-admin-gray-900 hover:text-white text-admin-gray-700 border border-admin-gray-200 hover:border-admin-gray-900 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-[11px] font-bold tracking-wider uppercase">CRM Login</span>
              </a>
            </div>
          </div>
        </header>

        {/* ---------- BODY ---------- */}
        <main className={`flex-1 p-8 lg:p-12 space-y-10 ${isLoaded ? "animate-fade-in" : "opacity-0"}`}>

          {/* ---------- KÜLDŐ FORM ---------- */}
          {activeTab === "invite" && (
            <section className="max-w-4xl mx-auto">
              <div className="relative bg-white/70 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-white/60 overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-admin-yellow/40 to-transparent opacity-80" />

              <div className="px-8 sm:px-12 py-10 sm:py-12">
                <div className="mb-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-admin-yellow/20 to-admin-red/10 border border-admin-yellow/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-admin-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-admin-gray-900">
                        Új Meghívó Küldés
                      </h2>
                      <p className="text-admin-gray-500 text-sm font-medium mt-1">
                        Küldj meghívót a Pannon Transfer CRM rendszerbe való belépéshez.
                      </p>
                    </div>
                  </div>
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-admin-gray-200 to-transparent" />
                </div>

                <form onSubmit={handleSend} className="space-y-8">

                  {/* RECIPIENTS */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between ml-1">
                      <label htmlFor="recipients" className="text-[10px] font-black tracking-[0.2em] uppercase text-admin-gray-400">
                        Címzettek
                      </label>
                      <span className="text-[10px] font-bold tracking-wider uppercase text-admin-gray-400">
                        {parseRecipients(recipientsText).length} címzett
                      </span>
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-admin-yellow/20 to-admin-red/15 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                      <textarea
                        id="recipients"
                        value={recipientsText}
                        onChange={(e) => {
                          setRecipientsText(e.target.value);
                          if (globalError) setGlobalError(null);
                        }}
                        rows={3}
                        className="relative w-full bg-white/80 border border-admin-gray-200/60 rounded-2xl px-5 py-4 text-sm text-admin-gray-900 placeholder:text-admin-gray-400 outline-none transition-all duration-300 focus:bg-white focus:border-admin-yellow/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] resize-none"
                        placeholder="pelda@pannon.hu, masik@partner.hu"
                        spellCheck={false}
                      />
                    </div>
                    <p className="text-[11px] text-admin-gray-500 font-medium ml-1 leading-relaxed">
                      Több email cím is megadható vesszővel ( , ), pontosvesszővel ( ; ) vagy új sorral elválasztva.
                    </p>
                  </div>

                  {/* SUBJECT */}
                  <div className="space-y-2">
                    <label htmlFor="subject" className="block text-[10px] font-black tracking-[0.2em] uppercase text-admin-gray-400 ml-1">
                      Email tárgya
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-admin-yellow/15 to-admin-red/10 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                      <input
                        id="subject"
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="relative w-full bg-white/80 border border-admin-gray-200/60 rounded-2xl px-5 py-4 text-sm text-admin-gray-900 placeholder:text-admin-gray-400 outline-none transition-all duration-300 focus:bg-white focus:border-admin-yellow/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                        placeholder="Email tárgya..."
                      />
                    </div>
                  </div>

                  {/* LOGIN URL */}
                  <div className="space-y-2">
                    <label htmlFor="loginUrl" className="block text-[10px] font-black tracking-[0.2em] uppercase text-admin-gray-400 ml-1">
                      CRM Belépési URL (a link ami az emailben lesz)
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-admin-yellow/15 to-admin-red/10 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                      <input
                        id="loginUrl"
                        type="url"
                        value={loginBaseUrl}
                        onChange={(e) => setLoginBaseUrl(e.target.value)}
                        className="relative w-full bg-white/80 border border-admin-gray-200/60 rounded-2xl px-5 py-4 pr-24 text-sm text-admin-gray-900 placeholder:text-admin-gray-400 outline-none transition-all duration-300 focus:bg-white focus:border-admin-yellow/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] font-mono"
                        placeholder="https://pannontransfer.hu"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof window !== "undefined") {
                            setLoginBaseUrl(`${window.location.protocol}//${window.location.host}`);
                          }
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-2 rounded-xl bg-admin-gray-50 hover:bg-admin-gray-100 text-admin-gray-600 hover:text-admin-gray-900 text-[10px] font-bold tracking-wider uppercase border border-admin-gray-200 transition-colors"
                      >
                        Auto
                      </button>
                    </div>
                  </div>

                  {/* CUSTOM MESSAGE */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between ml-1">
                      <label htmlFor="message" className="text-[10px] font-black tracking-[0.2em] uppercase text-admin-gray-400">
                        Egyéni üzenet (opcionális)
                      </label>
                      <span className="text-[10px] font-bold tracking-wider uppercase text-admin-gray-400">
                        {customMessage.length} karakter
                      </span>
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-admin-yellow/10 to-admin-red/5 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                      <textarea
                        id="message"
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        rows={5}
                        className="relative w-full bg-white/80 border border-admin-gray-200/60 rounded-2xl px-5 py-4 text-sm text-admin-gray-900 placeholder:text-admin-gray-400 outline-none transition-all duration-300 focus:bg-white focus:border-admin-yellow/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                        placeholder="Szeretnénk meghívni a CRM rendszerbe. A belépéshez használd az alábbi linket..."
                      />
                    </div>
                  </div>

                  {/* GLOBAL ERROR */}
                  {globalError && (
                    <div className="rounded-2xl bg-admin-red/5 border border-admin-red/10 px-4 py-3 animate-fade-in flex items-center justify-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-admin-red/10 flex items-center justify-center shrink-0">
                        <span className="text-admin-red font-black text-[10px]">!</span>
                      </div>
                      <p className="text-admin-red text-xs font-semibold">{globalError}</p>
                    </div>
                  )}

                  {/* SUBMIT */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`group relative w-full rounded-2xl overflow-hidden transition-all duration-300 shadow-[0_8px_20px_rgba(0,0,0,0.08)] ${isLoading ? "opacity-80 cursor-wait" : "hover:shadow-[0_12px_25px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 active:translate-y-0"}`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-admin-yellow via-[#F7C800] to-admin-yellow transition-colors" />
                      <div className="absolute inset-0 bg-gradient-to-r from-[#E6B800] via-[#FFD500] to-[#E6B800] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="relative px-6 py-5 flex items-center justify-center gap-3">
                        {isLoading ? (
                          <>
                            <svg className="w-4 h-4 animate-spin text-admin-gray-900/60" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                              <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            <span className="text-admin-gray-900 font-bold tracking-[0.2em] uppercase text-xs">Küldés folyamatban...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 text-admin-gray-900 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                            </svg>
                            <span className="text-admin-gray-900 font-bold tracking-[0.2em] uppercase text-xs drop-shadow-sm">
                              Meghívó Elküldése
                            </span>
                          </>
                        )}
                      </div>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </section>
          )}

          {/* ---------- RESULTS ---------- */}
          {activeTab === "invite" && (lastResults || lastSummary) && (
            <section ref={resultScrollRef} className="max-w-4xl mx-auto">
              <div className="relative bg-white/70 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-white/60 overflow-hidden">
                <div className="px-8 sm:px-12 py-10">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-admin-gray-900">
                      Küldés Eredmények
                    </h3>
                    {lastSummary && (
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${lastSummary.failed === 0 ? "bg-green-500/10" : "bg-admin-yellow/10"}`}>
                        <span className={`text-[11px] font-black tracking-wider uppercase ${lastSummary.failed === 0 ? "text-green-600" : "text-admin-gray-900"}`}>
                          {lastSummary.success}/{lastSummary.total} sikerült
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {lastResults?.map((res, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-4 px-4 py-3 rounded-2xl border ${res.success ? "bg-green-500/5 border-green-500/10" : "bg-admin-red/5 border-admin-red/10"}`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${res.success ? "bg-green-500/10" : "bg-admin-red/10"}`}>
                          {res.success ? (
                            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-admin-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-semibold truncate ${res.success ? "text-admin-gray-900" : "text-admin-red"}`}>
                            {res.recipient}
                          </p>
                          <div className="min-w-0">
                            {res.success && res.setupLink ? (
                              <div className="mt-1 rounded-xl bg-blue-50 border border-blue-100 px-3 py-2 flex items-center gap-2 group">
                                <svg className="w-3.5 h-3.5 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                                </svg>
                                <p className="text-[11px] font-semibold text-blue-700 truncate font-mono">
                                  Setup link:
                                  <a href={res.setupLink} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 ml-1">
                                    {res.setupLink}
                                  </a>
                                </p>
                              </div>
                            ) : null}
                            {!res.success && res.error ? (
                              <p className="text-[11px] font-medium truncate text-admin-red">{`Hiba: ${res.error}`}</p>
                            ) : null}
                            {res.success && !res.setupLink ? (
                              <p className="text-[11px] font-medium truncate text-admin-gray-500">{`MessageID: ${res.messageId || "Küldve"}`}</p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ---------- DB FELHASZNÁLÓK (EMBEREK) ---------- */}
          {activeTab === "users" && (
            <section className="max-w-4xl mx-auto">
              <div className="relative bg-white/70 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-white/60 overflow-hidden">
                <div className="px-8 sm:px-12 py-10">
                  {/* Header: Felhasználó ikon + Emberek + Badge */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 shrink-0 rounded-3xl bg-white border border-admin-gray-100 shadow-sm flex items-center justify-center">
                        <svg className="w-11 h-11 text-admin-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="font-serif text-5xl sm:text-6xl font-bold tracking-tight text-admin-gray-800 leading-none">
                          Emberek
                        </h2>
                      </div>
                  </div>
                  {dbCounts && (
                    <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-50 to-amber-100/80 border border-amber-200/60" />
                      <div className="absolute inset-2 rounded-full bg-white/60 backdrop-blur-sm" />
                      <span className="relative font-black text-4xl text-admin-gray-900 tracking-tighter font-mono">
                        {dbCounts.total}
                      </span>
                    </div>
                  )}
                </div>

                {/* Counts Badges SOR */}
                {dbCounts && (
                  <div className="flex flex-wrap items-center gap-3 mb-6 -mt-2">
                    <div className="px-4 py-2 rounded-full bg-admin-gray-900 text-white shadow-sm flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-white/70" />
                      <span className="text-[10px] font-black tracking-[0.2em] uppercase">Összes</span>
                      <span className="font-mono text-sm font-bold">{dbCounts.total}</span>
                    </div>
                    <div className={`px-4 py-2 rounded-full shadow-sm flex items-center gap-2 ${dbCounts.pending > 0 ? "bg-admin-yellow/90 text-admin-gray-900" : "bg-admin-gray-100 text-admin-gray-500"}`}>
                      <span className={`w-2 h-2 rounded-full ${dbCounts.pending > 0 ? "bg-white" : "bg-admin-gray-400"}`} />
                      <span className="text-[10px] font-black tracking-[0.2em] uppercase">Várakozik</span>
                      <span className="font-mono text-sm font-bold">{dbCounts.pending}</span>
                    </div>
                    <div className={`px-4 py-2 rounded-full shadow-sm flex items-center gap-2 ${dbCounts.active > 0 ? "bg-green-500 text-white" : "bg-admin-gray-100 text-admin-gray-500"}`}>
                      <span className={`w-2 h-2 rounded-full ${dbCounts.active > 0 ? "bg-white" : "bg-admin-gray-400"}`} />
                      <span className="text-[10px] font-black tracking-[0.2em] uppercase">Aktív</span>
                      <span className="font-mono text-sm font-bold">{dbCounts.active}</span>
                    </div>
                    <button
                      onClick={fetchDbUsers}
                      disabled={dbUsersLoading}
                      className="ml-auto px-3.5 py-2 rounded-full bg-white border border-admin-gray-200 text-admin-gray-600 hover:border-admin-gray-400 hover:text-admin-gray-900 transition-colors flex items-center gap-1.5 disabled:opacity-60 shadow-sm"
                      title="Frissítés"
                    >
                      <svg className={`w-3.5 h-3.5 ${dbUsersLoading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                      <span className="text-[10px] font-bold tracking-widest uppercase">Frissítés</span>
                    </button>
                  </div>
                )}

                <div className="h-px w-full bg-gradient-to-r from-transparent via-admin-gray-200 to-transparent mb-8" />

                {/* LIST */}
                {dbUsersLoading && dbUsers.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-3">
                    <svg className="w-8 h-8 text-admin-gray-400 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <p className="text-sm font-semibold text-admin-gray-500">Felhasználók betöltése...</p>
                  </div>
                ) : dbUsers.length === 0 ? (
                  <div className="py-16 flex flex-col items-center justify-center gap-4 text-center">
                    <div className="w-16 h-16 rounded-full bg-admin-gray-100 flex items-center justify-center">
                      <svg className="w-8 h-8 text-admin-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-base font-bold text-admin-gray-900 mb-1">Még nincsenek meghívott felhasználók</p>
                      <p className="text-sm font-medium text-admin-gray-500">Küldj el egy meghívót fentről, és itt jelennek meg a felhasználók.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dbUsers.map((user) => {
                      const isPending = !user.isInviteAccepted;
                      return (
                        <div
                          key={user.id}
                          className={`group relative flex items-center gap-4 sm:gap-5 px-5 py-4 rounded-3xl border bg-white hover:shadow-lg transition-all duration-300 ${
                            isPending
                              ? "border-amber-200/70 bg-gradient-to-br from-white via-amber-50/40 to-white"
                              : "border-admin-gray-200"
                          }`}
                        >
                          {/* Avatar */}
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                            isPending
                              ? "bg-gradient-to-br from-amber-100 to-amber-200 border border-amber-200"
                              : user.role === "admin"
                                ? "bg-gradient-to-br from-admin-red/20 to-admin-yellow/20 border border-admin-yellow/30"
                                : "bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-200"
                          }`}>
                            <span className={`font-black text-lg tracking-tighter ${
                              isPending ? "text-amber-800" : user.role === "admin" ? "text-admin-gray-900" : "text-blue-800"
                            }`}>
                              {user.email.charAt(0).toUpperCase()}
                            </span>
                          </div>

                          {/* Középső rész */}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <p className="text-base font-bold text-admin-gray-900 truncate">
                                {user.email}
                              </p>
                              {user.role === "admin" && (
                                <span className="px-2 py-0.5 rounded-full bg-admin-gray-900 text-white text-[9px] font-black tracking-[0.18em] uppercase">
                                  Admin
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              {isPending ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/90 text-amber-800 border border-amber-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                  <span className="text-[10px] font-black tracking-[0.18em] uppercase">Várakozik</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                  <span className="text-[10px] font-black tracking-[0.18em] uppercase">Aktív</span>
                                </span>
                              )}
                              {user.twoFactorEnabled ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                                  </svg>
                                  <span className="text-[10px] font-black tracking-[0.18em] uppercase">2FA BE</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-admin-gray-100 text-admin-gray-500 border border-admin-gray-200">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                  </svg>
                                  <span className="text-[10px] font-black tracking-[0.18em] uppercase">2FA Nincs</span>
                                </span>
                              )}
                              {user.isLocked && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-admin-red/10 text-admin-red border border-admin-red/20">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                  </svg>
                                  <span className="text-[10px] font-black tracking-[0.18em] uppercase">Zárolva</span>
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2.5 text-[11px] font-medium text-admin-gray-500">
                              <span>Létrehozva: <span className="font-semibold text-admin-gray-700 font-mono">{new Date(user.createdAt).toLocaleString("hu-HU", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</span></span>
                              {user.lastLoginAt ? (
                                <span>Belépés: <span className="font-semibold text-admin-gray-700 font-mono">{new Date(user.lastLoginAt).toLocaleString("hu-HU", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</span></span>
                              ) : (
                                <span className="text-amber-600 font-semibold">Még nem jelentkezett be</span>
                              )}
                              {user.failedLoginAttempts > 0 && !user.isLocked && (
                                <span className="text-admin-red font-semibold">Hibák: {user.failedLoginAttempts}</span>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2 shrink-0">
                            <button
                              onClick={() => toggleUserLock(user.id, user.isLocked)}
                              className={`relative w-11 h-11 rounded-2xl flex items-center justify-center border transition-all ${
                                user.isLocked
                                  ? "bg-admin-red/10 border-admin-red/30 text-admin-red hover:bg-admin-red/20"
                                  : "bg-white border-admin-gray-200 text-admin-gray-400 hover:text-admin-gray-900 hover:border-admin-gray-400 hover:bg-admin-gray-50"
                              }`}
                              title={user.isLocked ? "Felhasználó feloldása" : "Felhasználó zárolása"}
                            >
                              {user.isLocked ? (
                                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                </svg>
                              ) : (
                                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                </svg>
                              )}
                            </button>
                            <button
                              onClick={() => setConfirmDelete({ id: user.id, email: user.email })}
                              className="relative w-11 h-11 rounded-2xl flex items-center justify-center bg-white border border-admin-gray-200 text-admin-gray-400 hover:text-admin-red hover:border-admin-red/30 hover:bg-admin-red/5 transition-all group-hover:shadow-sm"
                              title={`${user.email} törlése az adatbázisból`}
                            >
                              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>
          )}

          {/* ---------- HISTORY (localStorage) ---------- */}
          {activeTab === "history" && history.length > 0 && (
            <section className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-5 ml-1">
                <div className="w-10 h-10 rounded-xl bg-admin-gray-100 border border-admin-gray-200 flex items-center justify-center">
                  <svg className="w-5 h-5 text-admin-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold tracking-tight text-admin-gray-900">
                    Legutóbbi küldések
                  </h3>
                  <p className="text-admin-gray-500 text-sm font-medium">
                    A gépeden tárolt előzmények (max 50 tétel)
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-admin-gray-200 overflow-hidden divide-y divide-admin-gray-100">
                {history.slice(0, 10).map((entry) => (
                  <div key={entry.id} className="px-6 py-4 flex items-center gap-4 hover:bg-admin-gray-50 transition-colors">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${entry.summary.failed === 0 ? "bg-green-500/10" : "bg-admin-yellow/10"}`}>
                      <span className={`text-[11px] font-black tracking-tighter ${entry.summary.failed === 0 ? "text-green-600" : "text-admin-gray-900"}`}>
                        {entry.summary.success}/{entry.summary.total}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-admin-gray-900 truncate">{entry.subject}</p>
                      <p className="text-[11px] text-admin-gray-500 font-medium truncate">
                        {entry.recipients.slice(0, 3).join(", ")}
                        {entry.recipients.length > 3 ? ` +${entry.recipients.length - 3} további` : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-admin-gray-400">
                        {new Date(entry.timestamp).toLocaleString("hu-HU", {
                          hour: "2-digit",
                          minute: "2-digit",
                          month: "2-digit",
                          day: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </main>
      </div>

      {/* =========== CONFIRM DELETE MODAL =========== */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-admin-gray-900/60 backdrop-blur-md"
            onClick={() => !deleteLoading && setConfirmDelete(null)}
          />

          {/* Modal card */}
          <div className="relative w-full max-w-md mx-auto animate-modal-in">
            <div className="relative bg-white rounded-[2rem] shadow-[0_30px_80px_rgba(0,0,0,0.2)] overflow-hidden border border-white">
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-admin-red via-admin-yellow to-admin-yellow" />

              <div className="px-8 py-8">
                {/* Icon + Cím */}
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-admin-red/10 border border-admin-red/20 flex items-center justify-center mb-5">
                    <svg className="w-10 h-10 text-admin-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                  </div>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-admin-gray-900 mb-2">
                    Felhasználó törlése
                  </h3>
                  <p className="text-sm text-admin-gray-500 font-medium leading-relaxed max-w-xs">
                    A következő felhasználó és <strong>minden kapcsolódó meghívó tokenje</strong> véglegesen törlődik az adatbázisból:
                  </p>
                </div>

                {/* Email pill */}
                <div className="rounded-2xl bg-admin-gray-50 border border-admin-gray-200 px-4 py-3.5 mb-7 flex items-center justify-center">
                  <span className="text-sm font-bold text-admin-gray-900 font-mono truncate max-w-full">
                    {confirmDelete.email}
                  </span>
                </div>

                {/* Gombok */}
                <div className="flex flex-col sm:flex-row items-stretch gap-3">
                  <button
                    onClick={() => !deleteLoading && setConfirmDelete(null)}
                    disabled={deleteLoading}
                    className="flex-1 px-5 py-4 rounded-2xl border border-admin-gray-200 bg-white text-admin-gray-700 text-xs font-black tracking-[0.2em] uppercase hover:bg-admin-gray-50 hover:border-admin-gray-300 transition-colors disabled:opacity-60 shadow-sm"
                  >
                    Mégse
                  </button>
                  <button
                    onClick={executeDeleteConfirm}
                    disabled={deleteLoading}
                    className={`relative flex-1 px-5 py-4 rounded-2xl overflow-hidden text-white text-xs font-black tracking-[0.2em] uppercase transition-all shadow-[0_10px_25px_rgba(217,26,42,0.25)] disabled:opacity-70 disabled:cursor-wait ${
                      deleteLoading ? "" : "hover:shadow-[0_15px_30px_rgba(217,26,42,0.35)] hover:-translate-y-0.5"
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-admin-red to-red-700" />
                    <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-admin-red opacity-0 hover:opacity-100 transition-opacity" />
                    <div className="relative flex items-center justify-center gap-2">
                      {deleteLoading ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          <span>TÖRLÉS...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                          <span>Véglegesen Töröl</span>
                        </>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
