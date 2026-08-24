"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, MailOpen, Users, ArrowRight, Trash2 } from "lucide-react";
import {
  CATL_VEHICLE_COUNT,
  CATL_MIN_PRICE,
  CATL_MAX_PRICE,
  CATL_PRICING,
  CATL_TERMS,
  formatHuf,
} from "@/lib/catl-pricing";

type SidebarItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
};

const sidebarItems: SidebarItem[] = [
  {
    id: "dashboard",
    label: "Irányítópult",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    id: "clients",
    label: "Ügyfelek",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    id: "admin-accounts",
    label: "Adminisztrációs fiókok",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    id: "profiles",
    label: "Profilok",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: "history",
    label: "Előzmények",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: "stats",
    label: "Statisztikák",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    id: "terms",
    label: "Utazási feltételek",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [active, setActive] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [dbStatus, setDbStatus] = useState<"loading" | "connected" | "disconnected">("loading");
  const [sessionEmail, setSessionEmail] = useState<string>("");
  const [activeTermsSubpage, setActiveTermsSubpage] = useState<"list" | "catl">("list");

  useEffect(() => {
    setActiveTermsSubpage("list");
  }, [active]);

  const [editMode, setEditMode] = useState(false);
  const [catlPricingDraft, setCatlPricingDraft] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [crmUsers, setCrmUsers] = useState<any[] | null>(null);
  const [crmUsersMeta, setCrmUsersMeta] = useState<any>({ total: 0, pending: 0, active: 0 });
  const [crmUsersLoading, setCrmUsersLoading] = useState(false);

  // Számolt (derivált) CRM profil meta — MINDIG szinkronban a ténylegesen megjelenített listával
  const displayCrmUsers: any[] = (() => {
    if (crmUsers && crmUsers.length > 0) return crmUsers;
    if (crmUsersLoading) return [];
    if (sessionEmail) return [
      {
        id: "current-admin",
        email: sessionEmail,
        isInviteAccepted: true,
        role: "admin",
        hasPassword: true,
        twoFactorEnabled: true,
        isLocked: false,
        createdAt: Date.now() - 86400000 * 30,
        lastLoginAt: Date.now() - 3600000 * 2,
      },
    ];
    return [];
  })();
  const derivedCrmMeta = (() => {
    const list = displayCrmUsers;
    if (crmUsersLoading || list.length === 0) {
      // Ha tölt vagy nincs listánk, akkor a backend által adott meta tartalék
      if (crmUsersLoading) return { total: null as number | null, active: null as number | null, pending: null as number | null };
      return {
        total: crmUsersMeta?.total ?? 0,
        active: crmUsersMeta?.active ?? 0,
        pending: crmUsersMeta?.pending ?? 0,
      };
    }
    // Egyébként MINDIG a listából számolunk, hogy szinkron legyen a kártyákkal
    const total = list.length;
    let active = 0;
    let pending = 0;
    for (const u of list) {
      if (u?.isLocked) continue;
      if (!u?.isInviteAccepted) pending++;
      else if (u?.hasPassword) active++;
    }
    return { total, active, pending };
  })();
  const [catlInvites, setCatlInvites] = useState<any[] | null>(null);
  const [catlInvitesMeta, setCatlInvitesMeta] = useState<any>({ total: 0, activated: 0, pending: 0, require2fa: 0 });
  const [catlInvitesLoading, setCatlInvitesLoading] = useState(false);

  // Számolt (derivált) CATL meghívott meta — mindig szinkronban a tényleges listával
  const displayCatlInvites: any[] =
    catlInvites && catlInvites.length > 0 ? catlInvites : [];
  const derivedCatlMeta = (() => {
    if (catlInvitesLoading || displayCatlInvites.length === 0) {
      if (catlInvitesLoading) {
        return {
          total: null as number | null,
          activated: null as number | null,
          pending: null as number | null,
          require2fa: null as number | null,
        };
      }
      // Ha nincs adat, és nem tölt, akkor a backend meta tartalék
      return {
        total: catlInvitesMeta?.total ?? 0,
        activated: catlInvitesMeta?.activated ?? 0,
        pending: catlInvitesMeta?.pending ?? 0,
        require2fa: catlInvitesMeta?.require2fa ?? 0,
      };
    }
    const total = displayCatlInvites.length;
    let activated = 0;
    let pending = 0;
    let require2fa = 0;
    for (const u of displayCatlInvites) {
      if (u?.requireTwoFactor) require2fa++;
      if (u?.isActivated) activated++;
      else pending++;
    }
    return { total, activated, pending, require2fa };
  })();
  const [catlInviteRecipients, setCatlInviteRecipients] = useState("");
  const [catlInvite2FA, setCatlInvite2FA] = useState(false);
  const [catlInviteSending, setCatlInviteSending] = useState(false);
  const [catlInviteDeleting, setCatlInviteDeleting] = useState<string | null>(null);

  const [staffInviteRecipients, setStaffInviteRecipients] = useState("");
  const [staffInviteRole, setStaffInviteRole] = useState<"admin" | "dispatcher">("dispatcher");
  const [staffInvite2FA, setStaffInvite2FA] = useState(false);
  const [staffInviteSending, setStaffInviteSending] = useState(false);
  const [staffInvites, setStaffInvites] = useState<any[] | null>(null);
  const [staffInvitesMeta, setStaffInvitesMeta] = useState<any>({ total: 0, activated: 0, pending: 0, require2fa: 0 });
  const [staffInvitesLoading, setStaffInvitesLoading] = useState(false);
  const [staffInviteDeleting, setStaffInviteDeleting] = useState<string | null>(null);
  const [staffDeleteTarget, setStaffDeleteTarget] = useState<{ id: string; email: string; name?: string; role?: string } | null>(null);

  async function handleDeleteCatlUser(id: string, email: string) {
    if (!window.confirm(`Biztosan törlöd a(z) ${email} felhasználót és az általa használt CATL hozzáférést?\n\nA művelet nem visszavonható.`)) {
      return;
    }
    setCatlInviteDeleting(id);
    try {
      const res = await fetch("/api/catl-invites/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setToast({ type: "error", message: json?.message || "Hiba történt a törlés közben." });
      } else {
        setToast({ type: "success", message: json.message || "Felhasználó törölve." });
        const listRes = await fetch("/api/catl-invites/list", { cache: "no-store" });
        const listJson = await listRes.json().catch(() => null);
        if (listRes.ok && listJson?.success) {
          setCatlInvites(listJson.users || []);
          setCatlInvitesMeta(listJson.counts || catlInvitesMeta);
        }
      }
    } catch (e) {
      setToast({ type: "error", message: "Hálózati hiba törlés közben." });
    } finally {
      setCatlInviteDeleting(null);
    }
  }


  useEffect(() => {
    setEditMode(false);
    setCatlPricingDraft(null);
    (async () => {
      if (active === "terms" && activeTermsSubpage === "catl") {
        try {
          const res = await fetch("/api/partner-pricing?partnerKey=catl", { cache: "no-store" });
          if (res.ok) {
            const json = await res.json();
            if (json?.success && json.data) {
              setCatlPricingDraft(json.data);
            }
          }
        } catch {}
      }
    })();
  }, [active, activeTermsSubpage]);

  useEffect(() => {
    if (active !== "profiles") return;
    setCrmUsersLoading(true);
    (async () => {
      try {
        const res = await fetch("/api/email-admin/users", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (json?.success && Array.isArray(json.users)) {
            setCrmUsers(json.users);
            setCrmUsersMeta(json.counts || { total: json.users.length, pending: 0, active: 0 });
          } else {
            setCrmUsers(null);
          }
        } else {
          setCrmUsers(null);
        }
      } catch {
        setCrmUsers(null);
      } finally {
        setCrmUsersLoading(false);
      }
    })();
  }, [active]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (active !== "catl-invites") return;
    setCatlInvitesLoading(true);
    (async () => {
      try {
        const res = await fetch("/api/catl-invites/list", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (json?.success && Array.isArray(json.users)) {
            setCatlInvites(json.users);
            setCatlInvitesMeta(json.counts || { total: json.users.length, activated: 0, pending: 0, require2fa: 0 });
          } else {
            setCatlInvites(null);
          }
        } else setCatlInvites(null);
      } catch {
        setCatlInvites(null);
      } finally {
        setCatlInvitesLoading(false);
      }
    })();
  }, [active]);

  useEffect(() => {
    if (active !== "admin-accounts") return;
    setStaffInvitesLoading(true);
    (async () => {
      try {
        const res = await fetch("/api/staff-invites/list", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (json?.success && Array.isArray(json.users)) {
            setStaffInvites(json.users);
            setStaffInvitesMeta(
              json.counts || {
                total: json.users.length,
                activated: 0,
                pending: 0,
                require2fa: 0,
              }
            );
          } else {
            setStaffInvites(null);
          }
        } else setStaffInvites(null);
      } catch {
        setStaffInvites(null);
      } finally {
        setStaffInvitesLoading(false);
      }
    })();
  }, [active]);

  async function handleSendCatlInvite() {
    const recipients = catlInviteRecipients
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (recipients.length === 0) {
      setToast({ type: "error", message: "Legalább egy címzett email címét add meg." });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const e of recipients) {
      if (!emailRegex.test(e)) {
        setToast({ type: "error", message: `Érvénytelen email cím: ${e}` });
        return;
      }
    }

    // CATL partner URL számítása: ha a CRM localhost-on 3000-es porton fut,
    // akkor a CATL oldal 3001-es porton fut (ahogy a terminálban látszik)
    let catlPartnerBase = "";
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.origin);
        if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
          url.port = "3001";
        }
        catlPartnerBase = url.origin;
      } catch {
        catlPartnerBase = window.location.origin;
      }
    }

    setCatlInviteSending(true);
    try {
      const res = await fetch("/api/catl-invites/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients,
          requireTwoFactor: !!catlInvite2FA,
          loginBaseUrl: catlPartnerBase,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setToast({ type: "error", message: json?.message || "Hiba történt a küldés közben." });
      } else {
        setToast({ type: "success", message: json.message || "Sikeres küldés." });
        setCatlInviteRecipients("");
        setCatlInvite2FA(false);
        const listRes = await fetch("/api/catl-invites/list", { cache: "no-store" });
        if (listRes.ok) {
          const j2 = await listRes.json();
          if (j2?.success) {
            setCatlInvites(j2.users);
            setCatlInvitesMeta(j2.counts || {});
          }
        }
      }
    } catch {
      setToast({ type: "error", message: "Hálózati hiba a küldés közben." });
    } finally {
      setCatlInviteSending(false);
    }
  }

  async function handleSendStaffInvite() {
    const recipients = staffInviteRecipients
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (recipients.length === 0) {
      setToast({ type: "error", message: "Legalább egy címzett email címét add meg." });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const e of recipients) {
      if (!emailRegex.test(e)) {
        setToast({ type: "error", message: `Érvénytelen email cím: ${e}` });
        return;
      }
    }

    let staffBase = "";
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.origin);
        if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
          url.port = staffInviteRole === "dispatcher" ? "3002" : url.port;
        }
        staffBase = url.origin;
      } catch {
        staffBase = window.location.origin;
      }
    }

    setStaffInviteSending(true);
    try {
      const res = await fetch("/api/staff-invites/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients,
          requireTwoFactor: !!staffInvite2FA,
          loginBaseUrl: staffBase,
          role: staffInviteRole,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setToast({ type: "error", message: json?.message || "Hiba történt a küldés közben." });
      } else {
        setToast({ type: "success", message: json.message || "Sikeres meghívó küldés." });
        setStaffInviteRecipients("");
        setStaffInvite2FA(false);
        // Refresh staff list
        try {
          const listRes = await fetch("/api/staff-invites/list", { cache: "no-store" });
          if (listRes.ok) {
            const j2 = await listRes.json();
            if (j2?.success) {
              setStaffInvites(j2.users);
              setStaffInvitesMeta(j2.counts || {});
            }
          }
        } catch {}
      }
    } catch {
      setToast({ type: "error", message: "Hálózati hiba a küldés közben." });
    } finally {
      setStaffInviteSending(false);
    }
  }

  function openStaffDeleteModal(id: string, email: string, name?: string, role?: string) {
    setStaffDeleteTarget({ id, email, name, role });
  }

  async function handleConfirmStaffDelete() {
    if (!staffDeleteTarget) return;
    const { id, email } = staffDeleteTarget;
    setStaffInviteDeleting(id);
    try {
      const res = await fetch("/api/staff-invites/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setToast({ type: "error", message: json?.message || "Hiba történt a törlés közben." });
      } else {
        setToast({ type: "success", message: json.message || "Staff felhasználó véglegesen törölve." });
        const listRes = await fetch("/api/staff-invites/list", { cache: "no-store" });
        const listJson = await listRes.json().catch(() => null);
        if (listRes.ok && listJson?.success) {
          setStaffInvites(listJson.users || []);
          setStaffInvitesMeta(listJson.counts || staffInvitesMeta);
        }
      }
    } catch (e) {
      setToast({ type: "error", message: "Hálózati hiba törlés közben." });
    } finally {
      setStaffInviteDeleting(null);
      setStaffDeleteTarget(null);
    }
  }

  async function handleDeleteStaffUser(id: string, email: string) {
    openStaffDeleteModal(id, email);
  }

  useEffect(() => {
    setIsLoaded(true);
    (async () => {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = await res.json();
          if (data?.user?.email) setSessionEmail(data.user.email);
        }
        const statusRes = await fetch("/api/status");
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setDbStatus(statusData?.services?.database?.success ? "connected" : "disconnected");
        } else {
          setDbStatus("disconnected");
        }
      } catch {
        setDbStatus("disconnected");
      }
    })();
  }, []);

  function updateVehicle(idx: number, patch: any) {
    setCatlPricingDraft((prev: any) => {
      if (!prev) return prev;
      const vehicles = [...prev.vehicles];
      vehicles[idx] = { ...vehicles[idx], ...patch };
      return { ...prev, vehicles };
    });
  }

  function addVehicle() {
    const newId = `vehicle_${Date.now()}`;
    const empty = {
      id: newId,
      name: "Új jármű",
      capacity: "0 passenger",
      bpBudAirport: 0,
      dbDbAirport: null,
      newPrice2026: 0,
      modification12to24h: 0,
      modification0to12h: 0,
      cancellation12to24h: 0,
      cancellation0to12h: 0,
      extraWaitingPerHour: 0,
      dailyRate: 0,
    };
    setCatlPricingDraft((prev: any) => prev ? { ...prev, vehicles: [...prev.vehicles, empty] } : prev);
  }

  function removeVehicle(idx: number) {
    setCatlPricingDraft((prev: any) => {
      if (!prev) return prev;
      const vehicles = prev.vehicles.filter((_: any, i: number) => i !== idx);
      return { ...prev, vehicles };
    });
  }

  async function handleSave() {
    if (!catlPricingDraft) return;
    setLoading(true);
    try {
      const res = await fetch("/api/partner-pricing?partnerKey=catl", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerName: catlPricingDraft.partnerName,
          isActive: catlPricingDraft.isActive,
          vehicles: catlPricingDraft.vehicles,
          terms: catlPricingDraft.terms,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCatlPricingDraft(data.data);
        setEditMode(false);
        setToast({ type: "success", message: "✓ Módosítások sikeresen elmentve az adatbázisba." });
      } else {
        setToast({ type: "error", message: `Hiba: ${data.error || "Ismeretlen hiba."}` });
      }
    } catch {
      setToast({ type: "error", message: "Hálózati hiba történt a mentés során." });
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    setEditMode(false);
    (async () => {
      try {
        const res = await fetch("/api/partner-pricing?partnerKey=catl", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (json?.success && json.data) setCatlPricingDraft(json.data);
        }
      } catch {}
    })();
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <section className="relative min-h-screen w-full bg-admin-gray-50 text-admin-gray-900 font-sans flex selection:bg-admin-red selection:text-white">
      {/* ============================================================ */}
      {/* SIDEBAR                                                        */}
      {/* ============================================================ */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-[280px] shrink-0 bg-white border-r border-admin-gray-200 flex flex-col transition-transform duration-500 shadow-[4px_0_24px_rgba(0,0,0,0.02)] ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Sidebar Brand */}
        <div className="px-8 py-8 border-b border-admin-gray-100 flex items-center gap-4">
          <div className="w-10 h-10 bg-admin-gray-900 rounded-xl flex items-center justify-center shadow-sm shrink-0">
            <span className="text-white font-black text-lg tracking-tighter">PT</span>
          </div>
          <div className="min-w-0">
            <div className="font-serif text-lg font-bold tracking-tight text-admin-gray-900 leading-tight">
              CRM Panel
            </div>
            <div className="text-[10px] font-medium tracking-widest text-admin-gray-500 uppercase mt-0.5">
              Pannon Transfer
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
          <div className="px-4 pb-3">
            <span className="text-[10px] font-bold tracking-widest uppercase text-admin-gray-400">
              Főmenü
            </span>
          </div>
          {sidebarItems.map((item) => {
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActive(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 ${
                  isActive 
                    ? "bg-admin-gray-900 text-white shadow-md" 
                    : "text-admin-gray-600 hover:bg-admin-gray-100 hover:text-admin-gray-900"
                }`}
              >
                <div className={`w-5 h-5 ${isActive ? "text-white" : "text-admin-gray-400"}`}>
                  {item.icon}
                </div>
                <span className={`text-sm font-medium tracking-tight flex-1 text-left`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar footer - User */}
        <div className="p-4 border-t border-admin-gray-100">
          <div className="p-4 rounded-xl bg-admin-gray-50 border border-admin-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white border border-admin-gray-200 flex items-center justify-center shrink-0 shadow-sm">
                <span className="font-bold text-admin-gray-700 text-xs">
                  {sessionEmail ? sessionEmail.charAt(0).toUpperCase() : "AD"}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-admin-gray-900 font-semibold text-sm truncate">
                  Balog Sebastian Máté
                </div>
                <div className="text-[10px] font-medium text-admin-gray-500 truncate">
                  {sessionEmail || "Rendszergazda"}
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

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-admin-gray-900/40 backdrop-blur-sm lg:hidden animate-fade-in"
        />
      )}

      {/* ============================================================ */}
      {/* MAIN CONTENT                                                   */}
      {/* ============================================================ */}
      <div className="flex-1 min-w-0 flex flex-col relative">
        
        {/* --------------------- TOP BAR --------------------- */}
        <header className="sticky top-0 z-30 border-b border-admin-gray-200 bg-white/80 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4 px-8 py-5 h-[80px]">
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen((s) => !s)}
                className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl border border-admin-gray-200 text-admin-gray-600 hover:text-admin-gray-900 hover:bg-admin-gray-50 transition-colors bg-white shadow-sm"
                aria-label="Menü"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>

              <div>
                <h1 className="font-serif text-2xl font-bold tracking-tight text-admin-gray-900">
                  {sidebarItems.find((s) => s.id === active)?.label}
                </h1>
              </div>
            </div>

            {/* Status Indicator */}
            <div className="hidden md:flex items-center gap-3 bg-admin-gray-50 border border-admin-gray-200 px-4 py-2 rounded-full shadow-sm">
              <div
                className={`w-2 h-2 rounded-full ${
                  dbStatus === "connected"
                    ? "bg-green-500"
                    : dbStatus === "loading"
                      ? "bg-admin-yellow animate-pulse"
                      : "bg-admin-gray-400"
                }`}
              />
              <span className="text-[10px] font-bold tracking-widest uppercase text-admin-gray-500">
                {dbStatus === "connected"
                  ? "Adatbázis Online"
                  : dbStatus === "loading"
                    ? "Csatlakozás..."
                    : "Nincs Adatbázis"}
              </span>
            </div>

          </div>
        </header>

        {/* --------------------- DYNAMIC CONTENT --------------------- */}
        <main className={`flex-1 p-8 lg:p-12 flex flex-col ${isLoaded ? "animate-fade-in" : "opacity-0"}`}>
          
          {active === "dashboard" ? (
            <div className="max-w-2xl w-full mx-auto flex flex-col items-center text-center my-auto">
              {/* Elegant Icon */}
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-admin-gray-100 relative group">
                <div className="absolute inset-0 border border-admin-gray-200 rounded-full scale-110 opacity-0 group-hover:scale-125 group-hover:opacity-100 transition-all duration-700" />
                <svg className="w-10 h-10 text-admin-gray-400 group-hover:text-admin-gray-900 transition-colors duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015-1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              
              <h2 className="font-serif text-3xl font-bold tracking-tight text-admin-gray-900 mb-4">
                {dbStatus === "connected" ? "Irányítópult fejlesztés alatt" : "Nincs csatlakoztatott adatbázis"}
              </h2>
              <p className="text-admin-gray-500 font-medium text-base leading-relaxed max-w-lg mb-10">
                {dbStatus === "connected"
                  ? "A központi irányítópult statisztikái hamarosan itt fognak megjelenni. Addig is használd a bal oldali menüpontokat."
                  : "A CRM modul jelenleg üresjáratban van. Kérjük, konfigurálja az adatbázis kapcsolatot az ügyfelek, profilok és statisztikák betöltéséhez. A CATL árstruktúra szerkesztése és egyéb funkciók a bal oldali menüből elérhetőek még most is."}
              </p>
              
              <div className="flex flex-wrap gap-3 items-center justify-center">
                {dbStatus !== "connected" && (
                  <button className="px-6 py-3 bg-admin-gray-900 hover:bg-admin-black text-white rounded-xl font-semibold text-sm transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5">
                    Adatbázis konfigurálása
                  </button>
                )}
                <button
                  onClick={() => setActive("terms")}
                  className="px-6 py-3 bg-gradient-to-br from-[#0047BA] to-[#00B4D8] hover:shadow-lg hover:shadow-[#0047BA]/25 text-white rounded-xl font-semibold text-sm transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                  CATL árstruktúra szerkesztése
                </button>
              </div>
            </div>
          ) : active === "clients" ? (
            <div className="max-w-7xl mx-auto w-full">
              <div className="mb-10">
                <h2 className="font-serif text-3xl font-bold tracking-tight text-admin-gray-900 mb-2">Kiemelt Ügyfelek</h2>
                <p className="text-admin-gray-500 font-medium">Kezelje a partnercégek és delegációk foglalási rendszereit.</p>
              </div>

              {/* Client Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                
                {/* PREMIUM CATL Card */}
                <div className="bg-white rounded-3xl p-1 border border-admin-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.05)] hover:shadow-[0_30px_80px_rgba(0,0,0,0.1)] transition-all duration-500 group relative overflow-hidden flex flex-col min-h-[340px]">
                  
                  {/* Subtle inner border and padding container */}
                  <div className="absolute inset-1 rounded-[22px] bg-gradient-to-b from-white to-admin-gray-50/50 -z-10" />
                  
                  {/* Glowing top accent line */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[2px] bg-gradient-to-r from-transparent via-[#0047BA] to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Decorative background glow */}
                  <div className="absolute -top-24 -right-24 w-56 h-56 bg-gradient-to-br from-[#0047BA]/10 to-[#00B4D8]/10 rounded-full blur-[40px] group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
                  
                  <div className="p-7 flex flex-col h-full relative z-10">
                    <div className="flex items-start justify-between mb-8">
                      <div className="w-16 h-16 rounded-[1.25rem] bg-gradient-to-br from-[#0047BA] to-[#00B4D8] flex items-center justify-center shadow-lg shadow-[#0047BA]/20 relative">
                        <div className="absolute inset-0 rounded-[1.25rem] bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <span className="text-white font-black text-xl tracking-tighter relative z-10">CATL</span>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="px-3 py-1 bg-green-50 text-green-600 border border-green-100 rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          Aktív
                        </span>
                        <span className="text-[10px] font-bold text-admin-gray-400 tracking-wider uppercase">
                          Enterprise
                        </span>
                      </div>
                    </div>

                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-admin-gray-900 mb-2">CATL Hungary Kft.</h3>
                      <p className="text-sm text-admin-gray-500 leading-relaxed mb-5">
                        Hivatalos delegációs és dolgozói transzferek. Speciális árazás és feltételek.
                      </p>
                      
                    </div>

                    <div className="mt-6 pt-6 border-t border-admin-gray-100/80">
                      <div className="flex items-center justify-between mb-6">
                        <span className="text-xs font-bold tracking-widest uppercase text-admin-gray-400">Portál elérés</span>
                        <a href="http://localhost:3000/catl" target="_blank" rel="noopener noreferrer" className="group/link flex items-center gap-1.5">
                          <span className="text-sm font-bold text-[#0047BA] group-hover/link:text-[#00B4D8] transition-colors">/catl</span>
                          <div className="w-6 h-6 rounded-full bg-[#0047BA]/5 flex items-center justify-center group-hover/link:bg-[#00B4D8]/10 transition-colors">
                            <svg className="w-3 h-3 text-[#0047BA] group-hover/link:text-[#00B4D8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                            </svg>
                          </div>
                        </a>
                      </div>

                      {/* ULTRA-MINIMALIST YET SPECTACULAR PREMIUM BUTTON */}
                      <motion.button 
                        onClick={() => setActive("catl-invites")}
                        whileHover="hover"
                        whileTap={{ scale: 0.97 }}
                        className="relative w-full h-[68px] mb-6 rounded-2xl bg-white border border-admin-gray-200 overflow-hidden group/vip flex items-center justify-between px-5 transition-all duration-500 hover:border-[#0047BA]/30 hover:shadow-[0_12px_40px_rgba(0,71,186,0.12)]"
                      >
                        {/* Subtle, elegant gradient glow that fades in */}
                        <div className="absolute inset-0 opacity-0 group-hover/vip:opacity-100 transition-opacity duration-700 pointer-events-none">
                          <div className="absolute right-0 top-0 w-32 h-32 bg-gradient-to-bl from-[#0047BA]/10 to-transparent rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2" />
                          <div className="absolute left-0 bottom-0 w-24 h-24 bg-gradient-to-tr from-[#00B4D8]/10 to-transparent rounded-full blur-xl transform -translate-x-1/2 translate-y-1/2" />
                        </div>
                        
                        {/* Liquid sweep - highly elegant */}
                        <motion.div 
                          className="absolute top-0 bottom-0 w-[200%] bg-gradient-to-r from-transparent via-[#0047BA]/[0.03] to-transparent skew-x-[-20deg]"
                          variants={{
                            hover: { left: ["-100%", "100%"] }
                          }}
                          initial={{ left: "-100%" }}
                          transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.5 }}
                        />

                        <div className="relative flex items-center gap-4 z-10">
                          {/* Minimalist Icon */}
                          <div className="w-12 h-12 rounded-[14px] bg-admin-gray-50 flex items-center justify-center group-hover/vip:bg-[#0047BA]/5 transition-colors duration-500">
                            <MailOpen className="w-5 h-5 text-admin-gray-700 group-hover/vip:text-[#0047BA] transition-colors duration-500" />
                          </div>
                          
                          <div className="flex flex-col text-left">
                            <span className="text-[10px] font-bold tracking-[0.2em] text-admin-gray-400 uppercase leading-none mb-1.5 transition-colors duration-500 group-hover/vip:text-[#0047BA]/70">
                              Hozzáférések kezelése
                            </span>
                            <span className="text-admin-gray-900 font-extrabold tracking-wide text-[16px] leading-none transition-colors duration-500">
                              CATL Meghívások
                            </span>
                          </div>
                        </div>

                        {/* Elegant Action Button inside the button */}
                        <div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-admin-gray-50 border border-admin-gray-100 transition-all duration-500 group-hover/vip:bg-[#0047BA] group-hover/vip:border-[#0047BA] group-hover/vip:scale-110 shadow-sm">
                          <ArrowRight className="w-4.5 h-4.5 text-admin-gray-600 transition-colors duration-500 group-hover/vip:text-white" />
                        </div>
                      </motion.button>

                      <div className="flex gap-3 mt-4">
                        <button className="flex-1 py-3 bg-white hover:bg-admin-gray-50 text-admin-gray-900 rounded-xl text-xs font-bold tracking-wider uppercase transition-colors border border-admin-gray-200 shadow-sm">
                          Beállítások
                        </button>
                        <button className="flex-1 py-3 bg-admin-gray-900 hover:bg-admin-black text-white rounded-xl text-xs font-bold tracking-wider uppercase transition-colors shadow-[0_4px_14px_rgba(0,0,0,0.1)]">
                          Foglalások
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ) : active === "catl-invites" ? (
            <div className="max-w-7xl mx-auto w-full">
              <div className="mb-10 flex items-center gap-4">
                <button
                  onClick={() => setActive("clients")}
                  className="w-10 h-10 rounded-full bg-white border border-admin-gray-200 flex items-center justify-center text-admin-gray-500 hover:text-admin-gray-900 hover:bg-admin-gray-50 transition-colors shadow-sm"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                </button>
                <div>
                  <h2 className="font-serif text-3xl font-bold tracking-tight text-admin-gray-900 mb-2">
                    CATL Meghívások
                  </h2>
                  <p className="text-admin-gray-500 font-medium">
                    Kezelje a CATL portálhoz hozzáféréssel rendelkező felhasználókat és delegációkat.
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white border border-admin-gray-200 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#0047BA]/10 flex items-center justify-center">
                      <Users className="w-6 h-6 text-[#0047BA]" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-admin-gray-500">Összes profil</div>
                      <div className="text-2xl font-black text-admin-gray-900 mt-0.5">
                        {derivedCatlMeta.total === null ? "—" : (derivedCatlMeta.total ?? 0)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white border border-admin-gray-200 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-admin-gray-500">Aktív / Aktivált</div>
                      <div className="text-2xl font-black text-admin-gray-900 mt-0.5">
                        {derivedCatlMeta.activated === null ? "—" : (derivedCatlMeta.activated ?? 0)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white border border-admin-gray-200 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center">
                      <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-admin-gray-500">Függőben (jelszó)</div>
                      <div className="text-2xl font-black text-admin-gray-900 mt-0.5">
                        {derivedCatlMeta.pending === null ? "—" : (derivedCatlMeta.pending ?? 0)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white border border-admin-gray-200 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center">
                      <svg className="w-6 h-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-admin-gray-500">2FA kötelező</div>
                      <div className="text-2xl font-black text-admin-gray-900 mt-0.5">
                        {derivedCatlMeta.require2fa === null ? "—" : (derivedCatlMeta.require2fa ?? 0)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Invite Form */}
              <div className="bg-white border border-admin-gray-200 rounded-3xl p-8 shadow-sm mb-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-50 to-rose-50 flex items-center justify-center border border-amber-100">
                    <MailOpen className="w-7 h-7 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-admin-gray-900 font-serif mb-1">Új Meghívó Küldés</h3>
                    <p className="text-admin-gray-500 font-medium">
                      Küldj meghívót a CATL dedikált portál felhasználók számára.
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs font-black tracking-[0.2em] uppercase text-admin-gray-500">
                        Címzettek
                      </label>
                      <span className="text-xs font-bold text-admin-gray-400">
                        {catlInviteRecipients.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean).length} címzett
                      </span>
                    </div>
                    <textarea
                      value={catlInviteRecipients}
                      onChange={(e) => setCatlInviteRecipients(e.target.value)}
                      rows={3}
                      placeholder="pelda@catl.hu, catl.ugyvezeto@hu.com; dolgozo@pannon.hu"
                      className="w-full px-5 py-4 bg-admin-gray-50 border border-admin-gray-200 rounded-2xl text-admin-gray-900 placeholder:text-admin-gray-400 font-medium focus:outline-none focus:ring-2 focus:ring-[#0047BA]/20 focus:border-[#0047BA] transition-all resize-y min-h-[90px]"
                    />
                    <p className="text-xs text-admin-gray-400 mt-2 pl-1">
                      Több email cím is megadható vesszővel (,) , pontosvesszővel (;) vagy új sorral elválasztva.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-admin-gray-50 border border-admin-gray-200 rounded-2xl p-5">
                      <label className="flex items-start gap-4 cursor-pointer group">
                        <div className="relative flex items-center mt-1">
                          <div className="relative">
                            <input
                              id="catl-2fa-flag"
                              type="checkbox"
                              checked={catlInvite2FA}
                              onChange={(e) => setCatlInvite2FA(e.target.checked)}
                              className="w-6 h-6 rounded-lg border-2 border-admin-gray-300 bg-white text-[#0047BA] focus:ring-[#0047BA] cursor-pointer appearance-none checked:bg-[#0047BA] checked:border-[#0047BA] transition-colors"
                            />
                            {catlInvite2FA && (
                              <svg
                                className="absolute inset-0 w-6 h-6 p-1.5 text-white pointer-events-none"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={3}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <div className="flex-1">
                          <label
                            htmlFor="catl-2fa-flag"
                            className="block font-bold text-admin-gray-900 mb-1 cursor-pointer select-none"
                          >
                            Kétfaktoros hitelesítés kötelező (2FA)
                          </label>
                          <p className="text-sm text-admin-gray-500 leading-relaxed">
                            Ha bekapcsolod, a meghívott felhasználók <strong>muszáj bekapcsolják</strong> a telefonos
                            kétfaktoros hitelesítést a jelszó beállítása után.
                          </p>
                        </div>
                      </label>
                    </div>

                    <div className="bg-admin-gray-50 border border-admin-gray-200 rounded-2xl p-5 flex flex-col justify-between gap-3">
                      <div>
                        <label className="block text-xs font-black tracking-[0.2em] uppercase text-admin-gray-500 mb-2">
                          Belépési URL (A link az emailben lesz)
                        </label>
                        <div className="px-4 py-3 bg-white border border-admin-gray-200 rounded-xl text-xs font-mono text-admin-gray-700 break-all">
                          {(() => {
                            if (typeof window === "undefined") return "http://localhost:3001/catl";
                            try {
                              const u = new URL(window.location.origin);
                              if (u.hostname === "localhost" || u.hostname === "127.0.0.1") u.port = "3001";
                              return `${u.origin}/catl`;
                            } catch {
                              return "http://localhost:3001/catl";
                            }
                          })()}
                        </div>
                      </div>
                      <p className="text-xs text-admin-gray-400">
                        A meghívottak <strong>kizárólag</strong> az emailben küldött egyedi linken keresztül tudnak majd belépni.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-2">
                    <button
                      onClick={handleSendCatlInvite}
                      disabled={catlInviteSending}
                      className="h-[56px] px-8 rounded-2xl bg-gradient-to-r from-[#0047BA] via-[#0052CC] to-[#00B4D8] text-white font-black text-sm tracking-widest uppercase shadow-[0_10px_30px_rgba(0,71,186,0.25)] hover:shadow-[0_15px_40px_rgba(0,71,186,0.4)] hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_10px_30px_rgba(0,71,186,0.25)] flex items-center gap-3"
                    >
                      {catlInviteSending ? (
                        <>
                          <svg
                            className="w-4.5 h-4.5 animate-spin text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                            ></path>
                          </svg>
                          KÜLDÉS FOLYAMATBAN...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4.5 h-4.5" />
                          Meghívók kiküldése
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Invites list */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-serif text-2xl font-bold text-admin-gray-900">
                  Meghívott felhasználók
                </h3>
                {catlInvitesLoading && (
                  <span className="text-sm text-admin-gray-400 font-medium animate-pulse">Betöltés...</span>
                )}
              </div>

              {catlInvitesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {[0, 1, 2].map((i) => (
                    <div key={`catl-sk-${i}`} className="bg-white border border-admin-gray-200 rounded-3xl p-6 shadow-sm animate-pulse">
                      <div className="flex items-start gap-4 mb-5">
                        <div className="w-14 h-14 rounded-2xl bg-admin-gray-100" />
                        <div className="flex-1 space-y-2.5">
                          <div className="h-4 w-1/2 bg-admin-gray-100 rounded-md" />
                          <div className="h-3.5 w-3/5 bg-admin-gray-100 rounded-md" />
                        </div>
                      </div>
                      <div className="space-y-2.5">
                        <div className="h-3 w-full bg-admin-gray-100 rounded" />
                        <div className="h-3 w-4/5 bg-admin-gray-100 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !catlInvites || catlInvites.length === 0 ? (
                <div className="py-20 flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-2xl bg-[#0047BA]/5 border border-[#0047BA]/10 flex items-center justify-center mb-6">
                    <MailOpen className="w-9 h-9 text-[#0047BA]" />
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-admin-gray-900 mb-2">Még nincs meghívott felhasználó</h3>
                  <p className="text-admin-gray-500 font-medium max-w-md mb-8 leading-relaxed">
                    Küldj ki egyedi meghívót a CATL felhasználók számára az oldalon levő űrlapon keresztül — itt fognak megjelenni a lista elején amint elkészült a meghívás.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {catlInvites.map((u: any, idx: number) => {
                    const monogram = (u.email.split("@")[0] || "U")
                      .split(/[._-]/)
                      .map((s: string) => s[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();
                    const activated = !!u.isActivated;
                    return (
                      <div
                        key={u.id || `catl-${idx}`}
                        className="bg-white border border-admin-gray-200 rounded-3xl p-6 shadow-sm hover:shadow-[0_15px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-500 relative overflow-hidden"
                      >
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-[2px] bg-gradient-to-r from-transparent via-[#0047BA]/40 to-transparent opacity-40" />
                        <div className="flex items-start gap-4 mb-5">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0047BA]/15 to-[#00B4D8]/15 flex items-center justify-center border border-[#0047BA]/10 shadow-inner">
                            <span className="font-black text-[#0047BA] text-xl tracking-tight">
                              {monogram || "U"}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1.5">
                                  {activated ? (
                                    <span className="px-2.5 py-1 bg-green-50 border border-green-200 text-green-700 rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                      Aktivált
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                      Függőben
                                    </span>
                                  )}
                                  {u.requireTwoFactor && (
                                    <span className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 rounded-full text-[10px] font-black tracking-widest uppercase">
                                      2FA
                                    </span>
                                  )}
                                </div>
                                <div className="font-bold text-admin-gray-900 truncate text-base">
                                  {u.email.split("@")[0]}
                                </div>
                              </div>
                              {u.id && (
                                <button
                                  onClick={() => handleDeleteCatlUser(u.id as string, u.email)}
                                  disabled={catlInviteDeleting === u.id}
                                  title="Felhasználó és hozzáférés törlése"
                                  className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                                    catlInviteDeleting === u.id
                                      ? "bg-rose-100 text-rose-400 cursor-progress"
                                      : "text-admin-gray-400 hover:text-rose-600 hover:bg-rose-50 hover:border hover:border-rose-200"
                                  }`}
                                >
                                  <Trash2
                                    className={`w-4 h-4 ${catlInviteDeleting === u.id ? "animate-pulse" : ""}`}
                                  />
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-2 text-sm text-admin-gray-600 font-medium min-w-0">
                              <svg className="w-4 h-4 text-admin-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                              </svg>
                              <span className="truncate text-xs">{u.email}</span>
                            </div>
                          </div>
                        </div>
                        <div className="border-t border-admin-gray-100/80 pt-4 space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-admin-gray-500 text-xs font-medium">Létrehozva</span>
                            <span className="text-admin-gray-800 font-bold text-xs">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString("hu-HU") : "-"}
                            </span>
                          </div>
                          {u.activatedAt && (
                            <div className="flex items-center justify-between">
                              <span className="text-admin-gray-500 text-xs font-medium">Aktiválás</span>
                              <span className="text-green-700 font-bold text-xs">
                                {new Date(u.activatedAt).toLocaleDateString("hu-HU")}
                              </span>
                            </div>
                          )}
                          {u.lastLoginAt && (
                            <div className="flex items-center justify-between">
                              <span className="text-admin-gray-500 text-xs font-medium">Utolsó belépés</span>
                              <span className="text-admin-gray-800 font-bold text-xs">
                                {new Date(u.lastLoginAt).toLocaleDateString("hu-HU")}
                              </span>
                            </div>
                          )}
                          {u.inviteExpiresAt && !activated && (
                            <div className="flex items-center justify-between">
                              <span className="text-admin-gray-500 text-xs font-medium">Link érvényessége</span>
                              <span
                                className={`font-bold text-xs ${
                                  u.inviteExpiresAt < Date.now() ? "text-rose-600" : "text-amber-700"
                                }`}
                              >
                                {new Date(u.inviteExpiresAt).toLocaleDateString("hu-HU")}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="mt-5 pt-4 border-t border-admin-gray-100/80 flex flex-col gap-3">
                          <div className="flex gap-3">
                            <button className="flex-1 h-11 bg-admin-gray-50 hover:bg-admin-gray-100 border border-admin-gray-200 rounded-xl text-admin-gray-800 text-xs font-black tracking-wider uppercase transition-colors">
                              Beállítások
                            </button>
                            <button className="flex-1 h-11 bg-white hover:bg-[#0047BA]/5 border border-[#0047BA]/20 hover:border-[#0047BA]/40 rounded-xl text-[#0047BA] text-xs font-black tracking-wider uppercase transition-colors">
                              {activated ? "Új jelszó" : "Meghívás újra"}
                            </button>
                          </div>
                          {u.id && (
                            <button
                              onClick={() => handleDeleteCatlUser(u.id as string, u.email)}
                              disabled={catlInviteDeleting === u.id}
                              className={`w-full h-11 flex items-center justify-center gap-2 border rounded-xl text-xs font-black tracking-wider uppercase transition-colors ${
                                catlInviteDeleting === u.id
                                  ? "bg-rose-100 border-rose-200 text-rose-400 cursor-progress"
                                  : "bg-white border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300"
                              }`}
                            >
                              <Trash2 className={`w-4 h-4 ${catlInviteDeleting === u.id ? "animate-pulse" : ""}`} />
                              {catlInviteDeleting === u.id ? "Törlés..." : "Felhasználó törlése"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : active === "terms" ? (

            <div className="max-w-7xl mx-auto w-full">
              
              {activeTermsSubpage === "list" ? (
                <>
                  <div className="mb-10">
                    <h2 className="font-serif text-3xl font-bold tracking-tight text-admin-gray-900 mb-2">Utazási feltételek</h2>
                    <p className="text-admin-gray-500 font-medium">Válasszon egy partnert a részletes árak és foglalási feltételek megtekintéséhez.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    
                    <button
                      onClick={() => setActiveTermsSubpage("catl")}
                      className="group text-left bg-white rounded-3xl p-1 border border-admin-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.05)] hover:shadow-[0_30px_80px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-500 relative overflow-hidden flex flex-col min-h-[380px]"
                    >
                      <div className="absolute inset-1 rounded-[22px] bg-gradient-to-b from-white to-admin-gray-50/50 -z-10" />
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[2px] bg-gradient-to-r from-transparent via-[#0047BA] to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="absolute -top-24 -right-24 w-56 h-56 bg-gradient-to-br from-[#0047BA]/12 to-[#00B4D8]/10 rounded-full blur-[40px] group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
                      
                      <div className="p-7 flex flex-col h-full relative z-10">
                        <div className="flex items-start justify-between mb-8">
                          <div className="w-16 h-16 rounded-[1.25rem] bg-gradient-to-br from-[#0047BA] to-[#00B4D8] flex items-center justify-center shadow-lg shadow-[#0047BA]/25 relative">
                            <div className="absolute inset-0 rounded-[1.25rem] bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <span className="text-white font-black text-xl tracking-tighter relative z-10">CATL</span>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className="px-3 py-1 bg-green-50 text-green-600 border border-green-100 rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                              Aktív 2026
                            </span>
                            <span className="text-[10px] font-bold text-admin-gray-400 tracking-wider uppercase">
                              Enterprise
                            </span>
                          </div>
                        </div>

                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-admin-gray-900 mb-2 group-hover:text-[#0047BA] transition-colors duration-300">CATL utazási feltételek</h3>
                          <p className="text-sm text-admin-gray-500 leading-relaxed mb-6">
                            CATL Hungary Kft. delegációs és dolgozói transzferekhez kötött egyedi vállalati szerződés. Részletes árak és feltételek.
                          </p>
                          
                        </div>

                        <div className="mt-6 pt-6 border-t border-admin-gray-100/80 flex items-center justify-between">
                          <span className="text-xs font-bold tracking-widest uppercase text-admin-gray-400">Részletek megtekintése</span>
                          <div className="w-10 h-10 rounded-full bg-[#0047BA]/5 flex items-center justify-center group-hover:bg-[#0047BA] group-hover:shadow-lg group-hover:shadow-[#0047BA]/25 transition-all duration-300">
                            <svg className="w-4 h-4 text-[#0047BA] group-hover:text-white transition-colors duration-300 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </button>

                  </div>
                </>
              ) : (
                <>
                  <div className="mb-8">
                    <button
                      onClick={() => setActiveTermsSubpage("list")}
                      className="group inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-admin-gray-200 bg-white hover:bg-admin-gray-50 hover:border-admin-gray-300 text-admin-gray-700 hover:text-admin-gray-900 transition-all duration-300 shadow-sm mb-5"
                    >
                      <svg className="w-4 h-4 text-admin-gray-500 group-hover:text-[#0047BA] group-hover:-translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                      </svg>
                      <span className="text-xs font-bold tracking-wider uppercase">Vissza az áttekintéshez</span>
                    </button>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-admin-gray-500 mb-2">
                          <span>Utazási feltételek</span>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                          <span className="text-admin-gray-900">CATL részletek</span>
                        </div>
                        <h2 className="font-serif text-3xl font-bold tracking-tight text-admin-gray-900 mb-2">
                          {editMode ? "CATL utazási feltételek — Szerkesztés" : "CATL utazási feltételek"}
                        </h2>
                        <p className="text-admin-gray-500 font-medium">
                          {editMode
                            ? "Módosítsa az árakat és feltételeket. A mentés után az adatok közvetlenül az adatbázisban frissülnek mindkét projekt számára."
                            : "CATL Hungary Kft. egyedi vállalati árazásának és foglalási feltételeinek részletes áttekintése."}
                        </p>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        {editMode ? (
                          <>
                            <button
                              onClick={handleCancel}
                              disabled={loading}
                              className="px-5 py-3 rounded-xl border border-admin-gray-200 bg-white hover:bg-admin-gray-50 text-admin-gray-700 hover:text-admin-gray-900 transition-all text-xs font-bold tracking-wider uppercase shadow-sm disabled:opacity-50"
                            >
                              Mégse
                            </button>
                            <button
                              onClick={handleSave}
                              disabled={loading}
                              className="px-6 py-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white transition-all text-xs font-bold tracking-wider uppercase shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 disabled:opacity-50 flex items-center gap-2"
                            >
                              {loading ? (
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                              )}
                              {loading ? "Mentés..." : "Mentés az adatbázisba"}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setEditMode(true)}
                            className="px-6 py-3 rounded-xl bg-gradient-to-br from-admin-gray-800 to-admin-gray-900 hover:from-admin-gray-900 hover:to-black text-white transition-all text-xs font-bold tracking-wider uppercase shadow-lg shadow-admin-gray-900/20 hover:shadow-xl flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                            Szerkesztés
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
                    
                    <div className={`xl:col-span-3 bg-white rounded-3xl p-1 border shadow-[0_20px_60px_rgba(0,0,0,0.05)] relative overflow-hidden group transition-all ${editMode ? "border-amber-200 ring-2 ring-amber-200/40" : "border-admin-gray-100"}`}>
                      <div className="absolute inset-1 rounded-[22px] bg-gradient-to-b from-white to-admin-gray-50/30 -z-10" />
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-[#0047BA] to-transparent opacity-70" />
                      <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-[#0047BA]/8 to-[#00B4D8]/5 rounded-full blur-[60px] pointer-events-none" />
                      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-gradient-to-tr from-[#0047BA]/5 to-[#00B4D8]/5 rounded-full blur-[60px] pointer-events-none" />
                      {editMode && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black tracking-widest uppercase shadow-lg shadow-amber-500/30 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          Szerkesztési mód aktív
                        </div>
                      )}

                      <div className="p-8 md:p-10 relative z-10">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10 pb-8 border-b border-admin-gray-100">
                          <div className="flex items-center gap-5">
                            <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-[#0047BA] to-[#00B4D8] flex items-center justify-center shadow-xl shadow-[#0047BA]/25 relative shrink-0">
                              <div className="absolute inset-0 rounded-[1.5rem] bg-gradient-to-t from-white/10 to-transparent" />
                              <span className="text-white font-black text-2xl tracking-tighter relative z-10">CATL</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-3 mb-2 flex-wrap">
                                {editMode ? (
                                  <input
                                    type="text"
                                    value={catlPricingDraft?.partnerName || ""}
                                    onChange={(e) => setCatlPricingDraft((prev: any) => prev ? { ...prev, partnerName: e.target.value } : prev)}
                                    className="font-serif text-2xl font-bold tracking-tight text-admin-gray-900 bg-white border-2 border-amber-200 focus:border-amber-400 outline-none rounded-xl px-4 py-2 w-80 shadow-sm"
                                    placeholder="Partner neve..."
                                  />
                                ) : (
                                  <h3 className="font-serif text-2xl font-bold tracking-tight text-admin-gray-900">
                                    {(catlPricingDraft?.partnerName as string) || "CATL Hungary Kft."} szerződés
                                  </h3>
                                )}
                                {editMode ? (
                                  <label className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border-2 border-amber-200 text-[10px] font-black tracking-widest uppercase text-admin-gray-700 cursor-pointer hover:bg-amber-50 transition">
                                    <input
                                      type="checkbox"
                                      checked={!!catlPricingDraft?.isActive}
                                      onChange={(e) => setCatlPricingDraft((prev: any) => prev ? { ...prev, isActive: e.target.checked } : prev)}
                                      className="w-3.5 h-3.5 rounded accent-emerald-500"
                                    />
                                    Aktív
                                  </label>
                                ) : (
                                  <span className={`px-3 py-1 border rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 ${catlPricingDraft?.isActive !== false ? "bg-green-50 text-green-600 border-green-100" : "bg-admin-gray-50 text-admin-gray-500 border-admin-gray-200"}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${catlPricingDraft?.isActive !== false ? "bg-green-500 animate-pulse" : "bg-admin-gray-400"}`} />
                                    {catlPricingDraft?.isActive !== false ? "Aktív 2026" : "Inaktív"}
                                  </span>
                                )}
                              </div>
                              <p className="text-admin-gray-500 font-medium max-w-xl">
                                Delegációs és dolgozói transzferekhez kötött egyedi vállalati szerződés. Bruttó árak, módosítási és lemondási feltételek.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mb-10">
                          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0047BA] to-[#00B4D8] flex items-center justify-center shadow-md shadow-[#0047BA]/20 shrink-0">
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                                </svg>
                              </div>
                              <h4 className="font-bold text-lg tracking-tight text-admin-gray-900">Járműkategóriák és árak</h4>
                              <div className="hidden md:block flex-1 h-px bg-gradient-to-r from-admin-gray-200 to-transparent" />
                            </div>
                            {editMode && (
                              <button
                                onClick={addVehicle}
                                className="px-4 py-2 rounded-xl bg-gradient-to-br from-[#0047BA]/5 to-[#00B4D8]/5 hover:from-[#0047BA]/10 hover:to-[#00B4D8]/10 border border-[#0047BA]/20 text-[#0047BA] transition-all text-xs font-bold tracking-wider uppercase shadow-sm flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                Új jármű hozzáadása
                              </button>
                            )}
                          </div>

                          <div className="overflow-hidden rounded-2xl border border-admin-gray-100 shadow-sm">
                            <div className="grid grid-cols-[2fr_1.5fr_1.5fr_1.5fr_2fr_0.7fr] bg-admin-gray-900 text-white px-5 py-4 text-[10px] font-black tracking-widest uppercase min-w-[1100px]">
                              <div>Járműtípus / ID / Kapacitás</div>
                              <div className="text-right">BP Airport</div>
                              <div className="text-right">DB Airport</div>
                              <div className="text-right">2026 Bruttó alapár</div>
                              <div className="text-right">Módosítás / Lemondás</div>
                              {editMode && <div className="text-center">Törlés</div>}
                            </div>
                            {(catlPricingDraft?.vehicles?.length ? catlPricingDraft.vehicles : Object.values(CATL_PRICING)).map((vehicle: any, idx: number) => {
                              const palette = [
                                "from-gray-700 to-gray-900",
                                "from-slate-600 to-slate-800",
                                "from-indigo-600 to-violet-800",
                                "from-amber-600 to-orange-700",
                                "from-emerald-700 to-teal-800",
                                "from-purple-700 to-fuchsia-800",
                                "from-pink-600 to-rose-700",
                                "from-cyan-700 to-sky-800",
                              ];
                              const monograms = ["Šk", "O/F", "V", "S", "M", "Új", "X", "Y", "Z"];
                              const gradient = palette[idx % palette.length];
                              const mono = vehicle.name?.substring(0, 2) || monograms[idx % monograms.length];
                              return (
                                <div
                                  key={vehicle.id || idx}
                                  className={`grid grid-cols-[2fr_1.5fr_1.5fr_1.5fr_2fr_0.7fr] items-center px-5 py-5 text-sm transition-colors hover:bg-[#0047BA]/[0.02] min-w-[1100px] ${
                                    idx % 2 === 0 ? "bg-white" : "bg-admin-gray-50/40"
                                  } ${
                                    idx !== (catlPricingDraft?.vehicles?.length ?? Object.values(CATL_PRICING).length) - 1
                                      ? "border-b border-admin-gray-100/70"
                                      : ""
                                  }`}
                                >
                                  <div className="flex items-center gap-4 pr-3">
                                    <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-md`}>
                                      <span className="text-white font-black text-xs">
                                        {mono.length > 3 ? mono.substring(0,3).toUpperCase() : mono.toUpperCase()}
                                      </span>
                                    </div>
                                    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                                      {editMode ? (
                                        <>
                                          <input
                                            type="text"
                                            value={vehicle.name}
                                            onChange={(e) => updateVehicle(idx, { name: e.target.value })}
                                            className="w-full font-bold text-admin-gray-900 bg-white border border-amber-200 focus:border-amber-400 outline-none rounded-lg px-3 py-1.5 text-sm shadow-sm"
                                            placeholder="Név..."
                                          />
                                          <div className="flex gap-2">
                                            <input
                                              type="text"
                                              value={vehicle.id}
                                              onChange={(e) => updateVehicle(idx, { id: e.target.value })}
                                              className="flex-1 text-[11px] font-mono font-semibold text-admin-gray-500 bg-admin-gray-50 border border-amber-200 focus:border-amber-400 outline-none rounded-md px-2.5 py-1"
                                              placeholder="azonosító"
                                            />
                                            <input
                                              type="text"
                                              value={vehicle.capacity}
                                              onChange={(e) => updateVehicle(idx, { capacity: e.target.value })}
                                              className="flex-1 text-[11px] font-semibold text-admin-gray-700 bg-admin-gray-50 border border-amber-200 focus:border-amber-400 outline-none rounded-md px-2.5 py-1"
                                              placeholder="kapacitás"
                                            />
                                          </div>
                                        </>
                                      ) : (
                                        <>
                                          <span className="font-bold text-admin-gray-900 truncate">{vehicle.name}</span>
                                          <div className="flex gap-2 items-center">
                                            <span className="px-2 py-0.5 rounded-md bg-admin-gray-100 text-admin-gray-500 font-mono font-bold text-[10px]">{vehicle.id}</span>
                                            <span className="px-2.5 py-1 rounded-lg bg-admin-gray-100 text-admin-gray-700 font-semibold text-[11px] inline-block">
                                              {vehicle.capacity}
                                            </span>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right pl-2">
                                    {editMode ? (
                                      <input
                                        type="number"
                                        value={vehicle.bpBudAirport ?? 0}
                                        onChange={(e) => updateVehicle(idx, { bpBudAirport: Number(e.target.value) || 0 })}
                                        className="w-full text-right font-mono font-bold text-admin-gray-800 bg-white border border-amber-200 focus:border-amber-400 outline-none rounded-lg px-3 py-2 text-[12px] shadow-sm"
                                      />
                                    ) : (
                                      <span className="font-mono font-semibold text-admin-gray-800 text-[13px]">{formatHuf(vehicle.bpBudAirport)}</span>
                                    )}
                                  </div>
                                  <div className="text-right pl-2">
                                    {editMode ? (
                                      <div className="flex flex-col gap-1">
                                        <label className="text-[9px] font-bold tracking-wider uppercase text-admin-gray-400 text-right">null = nincs</label>
                                        <input
                                          type="number"
                                          value={vehicle.dbDbAirport ?? ""}
                                          placeholder="null"
                                          onChange={(e) =>
                                            updateVehicle(idx, {
                                              dbDbAirport: e.target.value === "" ? null : Number(e.target.value) || null,
                                            })
                                          }
                                          className="w-full text-right font-mono font-bold text-admin-gray-800 bg-white border border-amber-200 focus:border-amber-400 outline-none rounded-lg px-3 py-2 text-[12px] shadow-sm placeholder:text-admin-gray-400 placeholder:italic"
                                        />
                                      </div>
                                    ) : (
                                      <div className="font-mono font-semibold text-[13px]">
                                        {vehicle.dbDbAirport ? (
                                          <span className="text-admin-gray-800">{formatHuf(vehicle.dbDbAirport)}</span>
                                        ) : (
                                          <span className="text-admin-gray-400 italic">—</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-right pl-2">
                                    {editMode ? (
                                      <input
                                        type="number"
                                        value={vehicle.newPrice2026 ?? 0}
                                        onChange={(e) => updateVehicle(idx, { newPrice2026: Number(e.target.value) || 0 })}
                                        className="w-full text-right font-mono font-black bg-gradient-to-br from-[#0047BA]/5 to-[#00B4D8]/5 border border-[#0047BA]/25 focus:border-[#0047BA] text-[#0047BA] outline-none rounded-xl px-3 py-2 text-[13px] shadow-sm"
                                      />
                                    ) : (
                                      <span className="inline-block px-3 py-1.5 rounded-xl bg-gradient-to-br from-[#0047BA]/10 to-[#00B4D8]/10 border border-[#0047BA]/15 text-[#0047BA] font-black text-sm font-mono tracking-tight">
                                        {formatHuf(vehicle.newPrice2026)}
                                      </span>
                                    )}
                                  </div>
                                  <div className="pl-2 pr-1">
                                    {editMode ? (
                                      <div className="grid grid-cols-2 gap-1.5">
                                        <input
                                          type="number"
                                          title="Módosítás 12-24h"
                                          value={vehicle.modification12to24h ?? 0}
                                          onChange={(e) => updateVehicle(idx, { modification12to24h: Number(e.target.value) || 0 })}
                                          className="w-full text-right font-mono text-[11px] font-semibold text-admin-gray-700 bg-white border border-amber-200 focus:border-amber-400 outline-none rounded px-2 py-1 shadow-sm"
                                          placeholder="M12-24"
                                        />
                                        <input
                                          type="number"
                                          title="Módosítás 0-12h"
                                          value={vehicle.modification0to12h ?? 0}
                                          onChange={(e) => updateVehicle(idx, { modification0to12h: Number(e.target.value) || 0 })}
                                          className="w-full text-right font-mono text-[11px] font-semibold text-admin-gray-700 bg-white border border-amber-200 focus:border-amber-400 outline-none rounded px-2 py-1 shadow-sm"
                                          placeholder="M0-12"
                                        />
                                        <input
                                          type="number"
                                          title="Lemondás 12-24h"
                                          value={vehicle.cancellation12to24h ?? 0}
                                          onChange={(e) => updateVehicle(idx, { cancellation12to24h: Number(e.target.value) || 0 })}
                                          className="w-full text-right font-mono text-[11px] font-semibold text-admin-gray-700 bg-white border border-amber-200 focus:border-amber-400 outline-none rounded px-2 py-1 shadow-sm"
                                          placeholder="L12-24"
                                        />
                                        <input
                                          type="number"
                                          title="Lemondás 0-12h"
                                          value={vehicle.cancellation0to12h ?? 0}
                                          onChange={(e) => updateVehicle(idx, { cancellation0to12h: Number(e.target.value) || 0 })}
                                          className="w-full text-right font-mono text-[11px] font-semibold text-admin-gray-700 bg-white border border-amber-200 focus:border-amber-400 outline-none rounded px-2 py-1 shadow-sm"
                                          placeholder="L0-12"
                                        />
                                      </div>
                                    ) : (
                                      <div className="text-[10px] space-y-0.5">
                                        <div className="flex justify-between font-semibold">
                                          <span className="text-amber-700">Mód 12-24:</span>
                                          <span className="font-mono text-admin-gray-800">{formatHuf(vehicle.modification12to24h)}</span>
                                        </div>
                                        <div className="flex justify-between font-semibold">
                                          <span className="text-rose-700">Mód 0-12:</span>
                                          <span className="font-mono text-admin-gray-800">{formatHuf(vehicle.modification0to12h)}</span>
                                        </div>
                                        <div className="flex justify-between font-semibold">
                                          <span className="text-sky-700">Lem 12-24:</span>
                                          <span className="font-mono text-admin-gray-800">{formatHuf(vehicle.cancellation12to24h)}</span>
                                        </div>
                                        <div className="flex justify-between font-semibold">
                                          <span className="text-indigo-700">Lem 0-12:</span>
                                          <span className="font-mono text-admin-gray-800">{formatHuf(vehicle.cancellation0to12h)}</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  {editMode && (
                                    <div className="flex items-center justify-center">
                                      <button
                                        onClick={() => removeVehicle(idx)}
                                        className="w-10 h-10 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 flex items-center justify-center transition-all group"
                                        title={`${vehicle.name} törlése`}
                                      >
                                        <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.3}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                        </svg>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="mb-2">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-500/20 shrink-0">
                              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                              </svg>
                            </div>
                            <h4 className="font-bold text-lg tracking-tight text-admin-gray-900">Foglalási feltételek (százalékos táblázat)</h4>
                            <div className="flex-1 h-px bg-gradient-to-r from-admin-gray-200 to-transparent" />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                            {[
                              { key: "mod", sub: "12-24h", title: "Módosítás 12-24h", color: "amber", gradient: "from-amber-50 to-orange-50", border: "border-amber-100", badge: "from-amber-500 to-orange-600", shadow: "shadow-amber-500/30", text: "text-amber-700", textStrong: "text-amber-900" },
                              { key: "mod", sub: "0-12h", title: "Módosítás 0-12h", color: "rose", gradient: "from-rose-50 to-red-50", border: "border-rose-100", badge: "from-rose-500 to-red-600", shadow: "shadow-rose-500/30", text: "text-rose-700", textStrong: "text-rose-900" },
                              { key: "cancel", sub: "12-24h", title: "Lemondás 12-24h", color: "sky", gradient: "from-sky-50 to-blue-50", border: "border-sky-100", badge: "from-sky-500 to-blue-600", shadow: "shadow-sky-500/30", text: "text-sky-700", textStrong: "text-sky-900" },
                              { key: "cancel", sub: "0-12h", title: "Lemondás 0-12h", color: "indigo", gradient: "from-indigo-50 to-violet-50", border: "border-indigo-100", badge: "from-indigo-500 to-violet-600", shadow: "shadow-indigo-500/30", text: "text-indigo-700", textStrong: "text-indigo-900" },
                            ].map((spec) => {
                              const section = spec.key === "mod" ? "modification" : "cancellation";
                              const subKey = spec.sub as "12-24h" | "0-12h";
                              const value =
                                (((catlPricingDraft?.terms as any)?.[section] as any)?.[subKey] as any) ??
                                (CATL_TERMS as any)[section][subKey];
                              return (
                                <div key={spec.key + spec.sub} className={`rounded-2xl bg-gradient-to-br ${spec.gradient} border ${spec.border} p-6 relative overflow-hidden group hover:shadow-lg transition-all duration-300`}>
                                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${spec.badge} opacity-20 rounded-full blur-2xl -translate-y-8 translate-x-8`} />
                                  <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-4 gap-2">
                                      <div className="flex items-center gap-2">
                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${spec.badge} flex items-center justify-center shadow-md ${spec.shadow}`}>
                                          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d={spec.sub === "12-24h" ? "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" : "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"} />
                                          </svg>
                                        </div>
                                        <span className={`text-[10px] font-black tracking-widest uppercase ${spec.text}`}>{spec.sub} óra</span>
                                      </div>
                                      {editMode && (
                                        <span className={`text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full bg-white border ${spec.border} ${spec.text}`}>
                                          EDIT
                                        </span>
                                      )}
                                    </div>
                                    <div className="mb-2 flex items-baseline gap-2 flex-wrap">
                                      {editMode ? (
                                        <input
                                          type="number"
                                          value={value?.percentage ?? 0}
                                          onChange={(e) => {
                                            const pct = Number(e.target.value) || 0;
                                            setCatlPricingDraft((prev: any) => {
                                              if (!prev) return prev;
                                              const next = { ...prev, terms: JSON.parse(JSON.stringify(prev.terms || CATL_TERMS)) };
                                              next.terms[section][spec.sub].percentage = pct;
                                              return next;
                                            });
                                          }}
                                          className={`w-24 font-black bg-white border-2 focus:outline-none rounded-xl px-3 py-2 text-2xl shadow-sm ${spec.textStrong} border-${spec.color}-200 focus:border-${spec.color}-400`}
                                        />
                                      ) : (
                                        <span className={`text-3xl font-black ${spec.textStrong}`}>{value?.percentage}%</span>
                                      )}
                                    </div>
                                    <div className={`text-xs font-bold ${spec.text} mb-1 uppercase tracking-wider`}>
                                      {spec.key === "mod" ? "Módosítás felár" : "Lemondás kötbér"}
                                    </div>
                                    {editMode ? (
                                      <input
                                        type="text"
                                        value={value?.description ?? ""}
                                        onChange={(e) => {
                                          setCatlPricingDraft((prev: any) => {
                                            if (!prev) return prev;
                                            const next = { ...prev, terms: JSON.parse(JSON.stringify(prev.terms || CATL_TERMS)) };
                                            next.terms[section][spec.sub].description = e.target.value;
                                            return next;
                                          });
                                        }}
                                        className={`w-full text-[11px] font-medium leading-relaxed bg-white border-2 ${spec.border} focus:outline-none rounded-lg px-2.5 py-1.5 ${spec.text}`}
                                      />
                                    ) : (
                                      <p className={`text-[11px] ${spec.text}/80 font-medium leading-relaxed`}>
                                        {value?.description} az alapárból
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="mt-10 pt-8 border-t border-admin-gray-100 grid grid-cols-1 md:grid-cols-2 gap-5">
                          {(catlPricingDraft?.vehicles?.length ? catlPricingDraft.vehicles : Object.values(CATL_PRICING)).map((vRef: any, idx: number) => {
                            if (idx > 1) return null;
                            const vehicle = (catlPricingDraft?.vehicles?.length ? catlPricingDraft.vehicles : Object.values(CATL_PRICING))[idx === 0 ? 0 : 3] as any;
                            const isDaily = idx === 1;
                            const label = isDaily ? "Napi díj (S class felső határ)" : "Extra várakozás (Skoda alap)";
                            const field = isDaily ? "dailyRate" : "extraWaitingPerHour";
                            const suffix = isDaily ? "" : "/óra";
                            const iconLeft = isDaily
                              ? "from-[#0047BA] to-[#00B4D8]"
                              : "from-admin-gray-800 to-admin-gray-900";
                            const iconSvg = isDaily
                              ? "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                              : "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z";
                            return (
                              <div key={label} className="rounded-2xl bg-white border border-admin-gray-100 p-6 flex items-center gap-5 hover:border-admin-gray-200 transition-colors shadow-sm">
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${iconLeft} flex items-center justify-center shadow-md shrink-0`}>
                                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d={iconSvg} />
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-[10px] font-black tracking-widest uppercase text-admin-gray-400 mb-1">{label}</div>
                                  {editMode ? (
                                    <div className="flex items-baseline gap-2 flex-wrap">
                                      <input
                                        type="number"
                                        value={vehicle?.[field] ?? 0}
                                        onChange={(e) => {
                                          const source = catlPricingDraft?.vehicles?.length ? catlPricingDraft.vehicles : Object.values(CATL_PRICING);
                                          const targetIdx = catlPricingDraft?.vehicles?.length ? (isDaily ? 3 : 0) : (isDaily ? 3 : 0);
                                          if (source[targetIdx]) {
                                            updateVehicle(targetIdx, { [field]: Number(e.target.value) || 0 });
                                          }
                                        }}
                                        className="text-xl font-black text-admin-gray-900 font-mono bg-white border border-amber-200 focus:border-amber-400 outline-none rounded-lg px-3 py-2 shadow-sm w-40"
                                      />
                                      {suffix && <span className="text-sm font-semibold text-admin-gray-500">{suffix}</span>}
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-admin-gray-100 text-admin-gray-500 uppercase tracking-wider">+ Áfa</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-baseline gap-2 flex-wrap">
                                      <span className="text-xl font-black text-admin-gray-900 font-mono">
                                        {isDaily
                                          ? `${formatHuf((catlPricingDraft?.vehicles?.[0]?.dailyRate ?? CATL_PRICING.skoda.dailyRate) || 0)} – ${formatHuf((catlPricingDraft?.vehicles?.[3]?.dailyRate ?? CATL_PRICING.s_class.dailyRate) || 0)}`
                                          : formatHuf(vehicle?.[field] ?? 0)
                                        }
                                      </span>
                                      {suffix && <span className="text-sm font-semibold text-admin-gray-500">{suffix}</span>}
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-admin-gray-100 text-admin-gray-500 uppercase tracking-wider">+ Áfa</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                      </div>
                    </div>

                  </div>
                </>
              )}
            </div>
          ) : active === "admin-accounts" ? (
            <div className="max-w-7xl mx-auto w-full">
              <div className="mb-10 flex flex-col md:flex-row md:items-start gap-5 md:justify-between">
                <div>
                  <h2 className="font-serif text-3xl font-bold tracking-tight text-admin-gray-900 mb-2">
                    Adminisztrációs fiókok
                  </h2>
                  <p className="text-admin-gray-500 font-medium">
                    Adminisztrátor és Diszpécser fiókok kezelése, meghívások küldése és hozzáférések áttekintése.
                  </p>
                </div>
                <div className="flex items-center gap-2.5 flex-wrap justify-start md:justify-end">
                  <button
                    onClick={() => setActive("profiles")}
                    className="px-5 py-3 rounded-xl bg-white hover:bg-admin-gray-50 text-admin-gray-800 transition-all text-xs font-bold tracking-wider uppercase shadow-sm border border-admin-gray-200 flex items-center gap-2 shrink-0"
                  >
                    <Users className="w-4 h-4 text-admin-gray-500" />
                    Összes profil
                  </button>
                </div>
              </div>

              {(() => {
                const legacyAdmins = displayCrmUsers.filter((u: any) => u.role === "admin").map((u: any, i: number) => ({
                  id: `legacy-${i}-${u.email}`,
                  email: u.email,
                  name: (u.email || "").split("@")[0],
                  role: "admin" as const,
                  isActivated: !!u.isInviteAccepted,
                  requireTwoFactor: false,
                  twoFactorEnabled: !!u.twoFactorEnabled,
                  hasPassword: !!u.hasPassword,
                  createdAt: u.createdAt,
                  lastLoginAt: u.lastLoginAt,
                  isLocked: !!u.isLocked,
                  legacy: true,
                }));
                const list = staffInvites && staffInvites.length > 0 ? [...staffInvites, ...legacyAdmins] : legacyAdmins;
                const allMeta = {
                  total: staffInvitesLoading && list.length === 0 ? null : list.length,
                  activated: staffInvitesLoading && list.length === 0 ? null : list.filter((u: any) => u.isActivated && u.hasPassword && !u.isLocked).length,
                  twofa: staffInvitesLoading && list.length === 0 ? null : list.filter((u: any) => u.twoFactorEnabled).length,
                  pending: staffInvitesLoading && list.length === 0 ? null : list.filter((u: any) => !u.isActivated || !u.hasPassword).length,
                };
                const accent = staffInviteRole === "dispatcher"
                  ? {
                      primary: "#0056D2",
                      gradient: "from-[#0056D2] via-[#0047BA] to-[#003F9F]",
                      shadow: "0_10px_30px_rgba(0,86,210,0.25)",
                      hoverShadow: "0_15px_40px_rgba(0,86,210,0.4)",
                      soft: "#0056D2",
                      badge: "[#0056D2]/5",
                      badgeBorder: "[#0056D2]/15",
                    }
                  : {
                      primary: "#111827",
                      gradient: "from-admin-gray-800 via-admin-gray-900 to-black",
                      shadow: "0_10px_30px_rgba(17,24,39,0.25)",
                      hoverShadow: "0_15px_40px_rgba(17,24,39,0.45)",
                      soft: "admin-gray-900",
                      badge: "admin-gray-900/5",
                      badgeBorder: "admin-gray-900/15",
                    };
                return (
                  <>
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                      <div className="rounded-2xl bg-gradient-to-br from-admin-gray-900/5 to-admin-gray-800/5 border border-admin-gray-200 p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-[10px] font-black tracking-widest uppercase text-admin-gray-500">Összes fiók</div>
                            <div className="text-3xl font-black text-admin-gray-900 mt-2 leading-none">
                              {allMeta.total === null ? "—" : allMeta.total}
                            </div>
                          </div>
                          <div className="w-11 h-11 rounded-xl bg-white border border-admin-gray-100 flex items-center justify-center shadow-sm">
                            <svg className="w-5 h-5 text-admin-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-[10px] font-black tracking-widest uppercase text-admin-gray-500">Aktív fiókok</div>
                            <div className="text-3xl font-black text-emerald-700 mt-2 leading-none">
                              {allMeta.activated === null ? "—" : allMeta.activated}
                            </div>
                          </div>
                          <div className="w-11 h-11 rounded-xl bg-white border border-admin-gray-100 flex items-center justify-center shadow-sm">
                            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-2xl bg-[#0047BA]/5 border border-[#0047BA]/15 p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-[10px] font-black tracking-widest uppercase text-admin-gray-500">2FA bekapcsolva</div>
                            <div className="text-3xl font-black text-[#0047BA] mt-2 leading-none">
                              {allMeta.twofa === null ? "—" : allMeta.twofa}
                            </div>
                          </div>
                          <div className="w-11 h-11 rounded-xl bg-white border border-admin-gray-100 flex items-center justify-center shadow-sm">
                            <svg className="w-5 h-5 text-[#0047BA]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-2xl bg-amber-50 border border-amber-100 p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-[10px] font-black tracking-widest uppercase text-admin-gray-500">Függőben (jelszó)</div>
                            <div className="text-3xl font-black text-amber-700 mt-2 leading-none">
                              {allMeta.pending === null ? "—" : allMeta.pending}
                            </div>
                          </div>
                          <div className="w-11 h-11 rounded-xl bg-white border border-admin-gray-100 flex items-center justify-center shadow-sm">
                            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Invite Form */}
                    <div className="bg-white border border-admin-gray-200 rounded-3xl p-8 shadow-sm mb-10">
                      <div className="flex items-center gap-4 mb-8">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-50 to-rose-50 flex items-center justify-center border border-amber-100`}>
                          <MailOpen className="w-7 h-7 text-amber-700" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-admin-gray-900 font-serif mb-1">Új Fiók Meghívó</h3>
                          <p className="text-admin-gray-500 font-medium">
                            Küldj meghívót Adminisztrátornak vagy Diszpecsernek – a meghívott személyre szabott emailben kapja az aktiválási linket.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        {/* Role selector */}
                        <div>
                          <label className="block text-xs font-black tracking-[0.2em] uppercase text-admin-gray-500 mb-3">
                            Szerepkör
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                              type="button"
                              onClick={() => setStaffInviteRole("dispatcher")}
                              className={`relative overflow-hidden group rounded-2xl border-2 transition-all duration-300 p-5 text-left ${
                                staffInviteRole === "dispatcher"
                                  ? "border-[#0056D2] bg-gradient-to-br from-[#0056D2]/5 via-[#0047BA]/5 to-[#003F9F]/5 shadow-[0_10px_30px_rgba(0,86,210,0.18)]"
                                  : "border-admin-gray-200 bg-admin-gray-50/50 hover:border-[#0056D2]/40 hover:bg-[#0056D2]/5"
                              }`}
                            >
                              <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-xl shrink-0 flex items-center justify-center transition-all duration-300 shadow-md ${
                                  staffInviteRole === "dispatcher"
                                    ? "bg-gradient-to-br from-[#0056D2] to-[#003F9F] shadow-[0_6px_20px_rgba(0,86,210,0.35)]"
                                    : "bg-gradient-to-br from-[#0056D2]/60 to-[#003F9F]/60"
                                }`}>
                                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375c-.621 0-1.125-.504-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V17.5a6 6 0 00-.176-1.472 6.003 6.003 0 00-.423-1.078M4.5 14.25h15M4.5 14.25v-3a1.125 1.125 0 01.897-1.104A12.038 12.038 0 0112 9c2.327 0 4.528.474 6.603 1.146a1.125 1.125 0 01.897 1.104v3" />
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <h4 className={`font-black tracking-tight text-lg transition-colors ${
                                      staffInviteRole === "dispatcher" ? "text-[#0056D2]" : "text-admin-gray-900"
                                    }`}>Diszpécser</h4>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black tracking-wider uppercase border ${
                                      staffInviteRole === "dispatcher"
                                        ? "bg-[#0056D2]/10 border-[#0056D2]/25 text-[#0056D2]"
                                        : "bg-admin-gray-100 border-admin-gray-200 text-admin-gray-500"
                                    }`}>
                                      ⭐ Fő szerepkör
                                    </span>
                                  </div>
                                  <p className="text-sm font-medium text-admin-gray-500 leading-relaxed">
                                    A Pannon Diszpécser Központba jelentkezhet be. Foglalási feladatok, menetrendi és kommunikációs feladatok ellátása.
                                  </p>
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 transition-all ${
                                  staffInviteRole === "dispatcher"
                                    ? "border-[#0056D2] bg-[#0056D2]"
                                    : "border-admin-gray-300 bg-white"
                                }`}>
                                  {staffInviteRole === "dispatcher" && (
                                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => setStaffInviteRole("admin")}
                              className={`relative overflow-hidden group rounded-2xl border-2 transition-all duration-300 p-5 text-left ${
                                staffInviteRole === "admin"
                                  ? "border-admin-gray-900 bg-gradient-to-br from-admin-gray-900/5 via-admin-gray-800/5 to-black/5 shadow-[0_10px_30px_rgba(17,24,39,0.15)]"
                                  : "border-admin-gray-200 bg-admin-gray-50/50 hover:border-admin-gray-500/60 hover:bg-admin-gray-100"
                              }`}
                            >
                              <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-xl shrink-0 flex items-center justify-center transition-all duration-300 shadow-md ${
                                  staffInviteRole === "admin"
                                    ? "bg-gradient-to-br from-admin-gray-800 to-black shadow-[0_6px_20px_rgba(17,24,39,0.35)]"
                                    : "bg-gradient-to-br from-admin-gray-800/60 to-black/60"
                                }`}>
                                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75V4.5m0 2.25a5.25 5.25 0 100 10.5 5.25 5.25 0 000-10.5zM4.5 20.25a7.5 7.5 0 0115 0" />
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <h4 className={`font-black tracking-tight text-lg transition-colors ${
                                      staffInviteRole === "admin" ? "text-admin-gray-900" : "text-admin-gray-900"
                                    }`}>Adminisztrátor</h4>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black tracking-wider uppercase border ${
                                      staffInviteRole === "admin"
                                        ? "bg-admin-gray-900/10 border-admin-gray-900/25 text-admin-gray-900"
                                        : "bg-admin-gray-100 border-admin-gray-200 text-admin-gray-500"
                                    }`}>
                                      CRM Admin
                                    </span>
                                  </div>
                                  <p className="text-sm font-medium text-admin-gray-500 leading-relaxed">
                                    Teljes hozzáférés a CRM Admin Panelhez. Profilok, statisztikák, ügyfelek és fiókok kezelése.
                                  </p>
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 transition-all ${
                                  staffInviteRole === "admin"
                                    ? "border-admin-gray-900 bg-admin-gray-900"
                                    : "border-admin-gray-300 bg-white"
                                }`}>
                                  {staffInviteRole === "admin" && (
                                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                            </button>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <label className="text-xs font-black tracking-[0.2em] uppercase text-admin-gray-500">
                              Címzettek
                            </label>
                            <span className="text-xs font-bold text-admin-gray-400">
                              {staffInviteRecipients.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean).length} címzett
                            </span>
                          </div>
                          <textarea
                            value={staffInviteRecipients}
                            onChange={(e) => setStaffInviteRecipients(e.target.value)}
                            rows={3}
                            placeholder={`diszpecser@pannon.hu, vezetodiszpecser@hu.com${staffInviteRole === "admin" ? "; admin@pannon.hu" : ""}`}
                            className="w-full px-5 py-4 bg-admin-gray-50 border border-admin-gray-200 rounded-2xl text-admin-gray-900 placeholder:text-admin-gray-400 font-medium focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus,rgba(0,86,210,0.2))] focus:border-[var(--ring-border,#0056D2)] transition-all resize-y min-h-[90px]"
                            style={{
                              // eslint-disable-next-line @typescript-eslint/prefer-as-const
                              ["--ring-focus" as any]: staffInviteRole === "dispatcher"
                                ? "rgba(0,86,210,0.2)"
                                : "rgba(17,24,39,0.2)",
                              ["--ring-border" as any]: staffInviteRole === "dispatcher" ? "#0056D2" : "#111827",
                            }}
                          />
                          <p className="text-xs text-admin-gray-400 mt-2 pl-1">
                            Több email cím is megadható vesszővel (,) , pontosvesszővel (;) vagy új sorral elválasztva.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className={`rounded-2xl p-5 border ${
                            staffInviteRole === "dispatcher"
                              ? "bg-[#0056D2]/[0.04] border-[#0056D2]/15"
                              : "bg-admin-gray-900/[0.04] border-admin-gray-900/15"
                          }`}>
                            <label className="flex items-start gap-4 cursor-pointer group">
                              <div className="relative flex items-center mt-1">
                                <div className="relative">
                                  <input
                                    id="staff-2fa-flag"
                                    type="checkbox"
                                    checked={staffInvite2FA}
                                    onChange={(e) => setStaffInvite2FA(e.target.checked)}
                                    className={`w-6 h-6 rounded-lg border-2 bg-white cursor-pointer appearance-none transition-colors ${
                                      staffInviteRole === "dispatcher"
                                        ? "border-[#0056D2]/60 text-[#0056D2] focus:ring-[#0056D2] checked:bg-[#0056D2] checked:border-[#0056D2]"
                                        : "border-admin-gray-500 text-admin-gray-900 focus:ring-admin-gray-900 checked:bg-admin-gray-900 checked:border-admin-gray-900"
                                    }`}
                                  />
                                  {staffInvite2FA && (
                                    <svg
                                      className="absolute inset-0 w-6 h-6 p-1.5 text-white pointer-events-none"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                      strokeWidth={3}
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                              <div className="flex-1">
                                <label
                                  htmlFor="staff-2fa-flag"
                                  className="block font-bold text-admin-gray-900 mb-1 cursor-pointer select-none"
                                >
                                  Kétfaktoros hitelesítés kötelező (2FA)
                                </label>
                                <p className="text-sm text-admin-gray-500 leading-relaxed">
                                  Ha bekapcsolod, a meghívott felhasználók <strong>muszáj bekapcsolják</strong> a telefonos kétfaktoros hitelesítést a jelszó beállítása után.
                                </p>
                              </div>
                            </label>
                          </div>

                          <div className={`rounded-2xl p-5 flex flex-col justify-between gap-3 border ${
                            staffInviteRole === "dispatcher"
                              ? "bg-[#0056D2]/[0.03] border-[#0056D2]/15"
                              : "bg-admin-gray-900/[0.03] border-admin-gray-900/15"
                          }`}>
                            <div>
                              <label className="block text-xs font-black tracking-[0.2em] uppercase text-admin-gray-500 mb-2">
                                {staffInviteRole === "dispatcher" ? "Diszpécser Belépési URL" : "Admin Belépési URL"}
                              </label>
                              <div className="px-4 py-3 bg-white border border-admin-gray-200 rounded-xl text-xs font-mono text-admin-gray-700 break-all">
                                {(() => {
                                  if (typeof window === "undefined") {
                                    return staffInviteRole === "dispatcher"
                                      ? "http://localhost:3002"
                                      : "http://localhost:3000/admin";
                                  }
                                  try {
                                    const u = new URL(window.location.origin);
                                    if (u.hostname === "localhost" || u.hostname === "127.0.0.1") {
                                      if (staffInviteRole === "dispatcher") u.port = "3002";
                                    }
                                    return staffInviteRole === "dispatcher"
                                      ? u.origin
                                      : `${u.origin}/admin`;
                                  } catch {
                                    return staffInviteRole === "dispatcher"
                                      ? "http://localhost:3002"
                                      : "http://localhost:3000/admin";
                                  }
                                })()}
                              </div>
                            </div>
                            <p className="text-xs text-admin-gray-400">
                              A meghívottak <strong>kizárólag</strong> az emailben küldött egyedi linken keresztül tudják aktiválni a fiókjukat.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-end pt-2">
                          <button
                            onClick={handleSendStaffInvite}
                            disabled={staffInviteSending}
                            className={`h-[56px] px-8 rounded-2xl text-white font-black text-sm tracking-widest uppercase hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center gap-3 bg-gradient-to-r ${accent.gradient}`}
                            style={{ boxShadow: staffInviteSending ? accent.shadow : accent.shadow }}
                            onMouseEnter={(e) => {
                              if (!staffInviteSending) (e.currentTarget.style.boxShadow = accent.hoverShadow);
                            }}
                            onMouseLeave={(e) => {
                              if (!staffInviteSending) (e.currentTarget.style.boxShadow = accent.shadow);
                            }}
                          >
                            {staffInviteSending ? (
                              <>
                                <svg className="w-4.5 h-4.5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                </svg>
                                KÜLDÉS FOLYAMATBAN...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4.5 h-4.5" />
                                Meghívók kiküldése
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Staff list */}
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-serif text-2xl font-bold text-admin-gray-900">
                        Fiókok listája
                      </h3>
                      {staffInvitesLoading && (
                        <span className="text-sm text-admin-gray-400 font-medium animate-pulse">Betöltés...</span>
                      )}
                    </div>

                    {staffInvitesLoading && list.length === 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {[0, 1, 2].map((i) => (
                          <div key={`st-sk-${i}`} className="bg-white border border-admin-gray-200 rounded-3xl p-6 shadow-sm animate-pulse">
                            <div className="flex items-start gap-4 mb-5">
                              <div className="w-14 h-14 rounded-2xl bg-admin-gray-100" />
                              <div className="flex-1 space-y-2.5">
                                <div className="h-4 w-1/2 bg-admin-gray-100 rounded-md" />
                                <div className="h-3.5 w-3/5 bg-admin-gray-100 rounded-md" />
                              </div>
                            </div>
                            <div className="space-y-2.5">
                              <div className="h-3 w-full bg-admin-gray-100 rounded" />
                              <div className="h-3 w-4/5 bg-admin-gray-100 rounded" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : list.length === 0 ? (
                      <div className="py-20 flex flex-col items-center text-center">
                        <div className={`w-20 h-20 rounded-2xl border flex items-center justify-center mb-6 ${
                          staffInviteRole === "dispatcher" ? "bg-[#0056D2]/5 border-[#0056D2]/15" : "bg-admin-gray-900/5 border-admin-gray-200"
                        }`}>
                          <MailOpen className={`w-9 h-9 ${staffInviteRole === "dispatcher" ? "text-[#0056D2]" : "text-admin-gray-900"}`} />
                        </div>
                        <h3 className="font-serif text-2xl font-bold text-admin-gray-900 mb-2">Jelenleg nincsenek fiókok</h3>
                        <p className="text-admin-gray-500 font-medium max-w-md mb-8 leading-relaxed">
                          Küldj ki egyedi meghívót a fenti űrlapon keresztül a Diszpecser vagy Adminisztrátor fiókok létrehozásához.
                        </p>
                        <div className="flex gap-3 flex-wrap items-center justify-center">
                          <button
                            onClick={() => setActive("profiles")}
                            className="px-6 py-3 bg-white hover:bg-admin-gray-50 text-admin-gray-900 rounded-xl font-semibold text-sm transition-all duration-300 border border-admin-gray-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                          >
                            Profilok megtekintése
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {list.map((u: any, idx: number) => {
                          const role = (u.role || "admin") as "admin" | "dispatcher";
                          const namePart = (u.name || (u.email || "").split("@")[0] || "staff").toString();
                          const nameDisplay =
                            typeof u.name === "string" && u.name.trim()
                              ? u.name.trim().split(/[._-]/).map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ")
                              : namePart.split(/[._-]/).map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
                          const monogram = (
                            (namePart.charAt(0) || "D").toUpperCase() +
                            (((u.email || "").split("@")[1] || "").charAt(0) || "C").toUpperCase()
                          ).slice(0, 2);
                          const fmtHu = (ts: number | null | undefined) => ts ? new Date(ts).toLocaleDateString("hu-HU", { year: "numeric", month: "short", day: "numeric" }) : "–";

                          let statusBadge: any;
                          if (u.isLocked) statusBadge = { label: "Lezárva", color: "bg-rose-50 text-rose-700 border-rose-100", dot: "bg-rose-500" };
                          else if (!u.isActivated) statusBadge = { label: "Meghívva", color: "bg-amber-50 text-amber-700 border-amber-100", dot: "bg-amber-500 animate-pulse" };
                          else if (u.hasPassword) statusBadge = { label: "Aktív", color: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500" };
                          else statusBadge = { label: "Inaktív", color: "bg-admin-gray-50 text-admin-gray-600 border-admin-gray-100", dot: "bg-admin-gray-400" };

                          const roleGradient =
                            role === "dispatcher"
                              ? "from-[#0056D2] via-[#0047BA] to-[#003F9F]"
                              : "from-admin-gray-800 to-admin-gray-900";
                          const roleBadge =
                            role === "dispatcher"
                              ? {
                                  label: "DISZPÉCSER",
                                  gradient: "from-[#0056D2] to-[#003F9F]",
                                  color: "text-white",
                                  border: "border-[#0056D2]",
                                  hasStar: true,
                                }
                              : {
                                  label: "ADMIN",
                                  gradient: "from-admin-gray-900 to-black",
                                  color: "text-white",
                                  border: "border-admin-gray-900",
                                  hasStar: true,
                                };

                          const accentGlow =
                            role === "dispatcher"
                              ? "from-[#0056D2] via-[#0047BA] to-transparent"
                              : "from-admin-gray-900 via-admin-gray-800 to-transparent";
                          const accentTop =
                            role === "dispatcher" ? "via-[#0056D2]/50" : "via-admin-gray-800/60";

                          return (
                            <div
                              key={u.id || `st-${idx}-${u.email}`}
                              className="bg-white rounded-3xl p-1 border border-admin-gray-200 shadow-[0_20px_60px_rgba(0,0,0,0.06)] hover:shadow-[0_30px_80px_rgba(0,0,0,0.12)] transition-all duration-500 group relative overflow-hidden"
                            >
                              <div className={`absolute -top-24 -right-24 w-56 h-56 bg-gradient-to-br ${accentGlow} opacity-0 group-hover:opacity-[0.1] rounded-full blur-[40px] transition-opacity duration-500 pointer-events-none`} />
                              <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[2px] bg-gradient-to-r from-transparent ${accentTop} to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-500`} />

                              <div className="p-7 flex flex-col h-full relative z-10">
                                <div className="flex items-start gap-4 mb-6">
                                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${roleGradient} flex items-center justify-center shadow-lg shrink-0 relative`}>
                                    <span className="text-white font-black text-lg tracking-tight">{monogram}</span>
                                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-white shadow-sm flex items-center justify-center">
                                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8 5.8 21.3l2.4-7.4L2 9.4h7.6z" />
                                      </svg>
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                      <h3 className="font-bold text-lg text-admin-gray-900 truncate">{nameDisplay}</h3>
                                      <span className={`px-2 py-0.5 border rounded-full text-[10px] font-black tracking-wider uppercase shrink-0 ${statusBadge.color}`}>
                                        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${statusBadge.dot}`} />
                                        {statusBadge.label}
                                      </span>
                                      {u.id && (
                                        <button
                                          onClick={() => openStaffDeleteModal(u.id as string, u.email, nameDisplay, roleBadge.label)}
                                          disabled={staffInviteDeleting === u.id}
                                          title="Felhasználó és hozzáférés VÉGLEGES törlése"
                                          className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all ml-auto ${
                                            staffInviteDeleting === u.id
                                              ? "bg-rose-100 text-rose-400 cursor-progress"
                                              : "text-admin-gray-300 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 hover:shadow-sm"
                                          }`}
                                        >
                                          <Trash2 className="w-[18px] h-[18px]" />
                                        </button>
                                      )}
                                    </div>
                                    <div className="text-sm font-semibold text-admin-gray-500 truncate mb-2 flex items-center gap-1.5">
                                      <svg className="w-4 h-4 text-admin-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                      </svg>
                                      {u.email}
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[10px] font-black tracking-wider uppercase bg-gradient-to-br ${roleBadge.gradient} ${roleBadge.color} shadow-sm`}>
                                        {roleBadge.hasStar && (
                                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8 5.8 21.3l2.4-7.4L2 9.4h7.6z" />
                                          </svg>
                                        )}
                                        {roleBadge.label}
                                      </span>
                                      {u.twoFactorEnabled && (
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg border text-[10px] font-black tracking-wider uppercase bg-[#0047BA]/5 text-[#0047BA] border-[#0047BA]/20">
                                          2FA ✓
                                        </span>
                                      )}
                                      {u.requireTwoFactor && !u.twoFactorEnabled && (
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg border text-[10px] font-black tracking-wider uppercase bg-amber-50 text-amber-700 border-amber-200">
                                          2FA Kötelező
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2.5 mb-6">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-admin-gray-500 font-medium">Létrehozva</span>
                                    <span className="font-bold text-admin-gray-800">{fmtHu(u.createdAt || u.inviteIssuedAt)}</span>
                                  </div>
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-admin-gray-500 font-medium">Utolsó bejelentkezés</span>
                                    <span className="font-bold text-admin-gray-800">{fmtHu(u.lastLoginAt)}</span>
                                  </div>
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-admin-gray-500 font-medium">Kétfaktoros védelem</span>
                                    <span className={`font-bold ${u.twoFactorEnabled ? "text-emerald-700" : "text-admin-gray-400"}`}>
                                      {u.twoFactorEnabled ? "Bekapcsolva" : "Kikapcsolva"}
                                    </span>
                                  </div>
                                </div>

                                <div className="mt-auto pt-5 border-t border-admin-gray-100/80">
                                  <div className="flex gap-2.5">
                                    <button
                                      onClick={() => setToast({ type: "success", message: `⚙️ ${u.email} beállításai hamarosan elérhetőek.` })}
                                      className="flex-1 py-2.5 bg-white hover:bg-admin-gray-50 text-admin-gray-900 rounded-xl text-xs font-bold tracking-wider uppercase transition-colors border border-admin-gray-200 shadow-sm"
                                    >
                                      Beállítások
                                    </button>
                                    <button
                                      onClick={() => setToast({ type: u.isActivated ? "success" : "success", message: u.isActivated ? `🔐 ${u.email} jelszó-visszaállítási email küldve.` : `💌 ${u.email} meghívója újraküldve.` })}
                                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-colors border shadow-sm ${
                                        role === "dispatcher"
                                          ? "bg-[#0056D2]/5 hover:bg-[#0056D2]/10 text-[#0056D2] border-[#0056D2]/20"
                                          : "bg-admin-gray-900/5 hover:bg-admin-gray-900/10 text-admin-gray-900 border-admin-gray-200"
                                      }`}
                                    >
                                      {u.isActivated ? "Új jelszó" : "Meghívás újra"}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          ) : active === "profiles" ? (
            <div className="max-w-7xl mx-auto w-full">
              <div className="mb-10 flex flex-col md:flex-row md:items-start gap-5 md:justify-between">
                <div>
                  <h2 className="font-serif text-3xl font-bold tracking-tight text-admin-gray-900 mb-2">CRM Profilok</h2>
                  <p className="text-admin-gray-500 font-medium">Azoknak a felhasználóknak a listája, akiknek már hozzáférése van a CRM rendszerhez.</p>
                </div>
                <button
                  onClick={() => setToast({ type: "success", message: "💌 Meghívási rendszer hamarosan itt, addig használd az Email admin felületet." })}
                  className="px-5 py-3 rounded-xl bg-gradient-to-br from-[#0047BA] to-[#00B4D8] hover:shadow-lg hover:shadow-[#0047BA]/25 text-white transition-all text-xs font-bold tracking-wider uppercase hover:-translate-y-0.5 shadow-md shadow-[#0047BA]/15 flex items-center gap-2 shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Új meghívás
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="rounded-2xl bg-gradient-to-br from-[#0047BA]/5 to-[#00B4D8]/5 border border-[#0047BA]/10 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-black tracking-widest uppercase text-admin-gray-500">Összes profil</div>
                      <div className="text-3xl font-black text-[#0047BA] mt-2 leading-none">{derivedCrmMeta.total === null ? "—" : (derivedCrmMeta.total ?? 0)}</div>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-white border border-admin-gray-100 flex items-center justify-center shadow-sm">
                      <svg className="w-5 h-5 text-[#0047BA]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-black tracking-widest uppercase text-admin-gray-500">Aktívak</div>
                      <div className="text-3xl font-black text-emerald-700 mt-2 leading-none">{derivedCrmMeta.active === null ? "—" : (derivedCrmMeta.active ?? 0)}</div>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-white border border-admin-gray-100 flex items-center justify-center shadow-sm">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl bg-amber-50 border border-amber-100 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-black tracking-widest uppercase text-admin-gray-500">Függőben</div>
                      <div className="text-3xl font-black text-amber-700 mt-2 leading-none">{derivedCrmMeta.pending === null ? "—" : (derivedCrmMeta.pending ?? 0)}</div>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-white border border-admin-gray-100 flex items-center justify-center shadow-sm">
                      <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {crmUsersLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {[0].map((i) => (
                    <div key={`crm-sk-${i}`} className="bg-white rounded-3xl p-1 border border-admin-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.05)] animate-pulse">
                      <div className="p-7">
                        <div className="flex items-start gap-4 mb-6">
                          <div className="w-14 h-14 rounded-2xl bg-admin-gray-100" />
                          <div className="flex-1 space-y-2.5">
                            <div className="h-4 w-1/2 bg-admin-gray-100 rounded-md" />
                            <div className="h-3.5 w-3/4 bg-admin-gray-100 rounded-md" />
                            <div className="h-3 w-1/3 bg-admin-gray-100 rounded-md" />
                          </div>
                        </div>
                        <div className="space-y-2.5">
                          <div className="h-3 w-full bg-admin-gray-100 rounded" />
                          <div className="h-3 w-4/5 bg-admin-gray-100 rounded" />
                          <div className="h-3 w-2/3 bg-admin-gray-100 rounded" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : displayCrmUsers.length === 0 ? (
                <div className="py-20 flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-2xl bg-[#0047BA]/5 border border-[#0047BA]/10 flex items-center justify-center mb-6">
                    <Users className="w-9 h-9 text-[#0047BA]" />
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-admin-gray-900 mb-2">Jelenleg nincsenek CRM profilok</h3>
                  <p className="text-admin-gray-500 font-medium max-w-md leading-relaxed">
                    Amint a felhasználói listázási API elérhetővé válik, a rendszer itt fogja megjeleníteni az összes CRM rendszerhez rendelt profilt.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {displayCrmUsers.map((user: any) => {
                    const namePart = (user.email || "user@crm.hu").split("@")[0] || "user";
                    const nameDisplay = namePart.split(/[._-]/).map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ") || "CRM Felhasználó";
                    const monogram = (
                      (namePart.charAt(0) || "U").toUpperCase() +
                      (((user.email || "").split("@")[1] || "").charAt(0) || "C").toUpperCase()
                    ).slice(0, 2);
                    const roleInfo: Record<string, { label: string; color: string; text: string; border: string; gradient: string }> = {
                      admin: { label: "Admin", color: "bg-[#0047BA]/5", text: "text-[#0047BA]", border: "border-[#0047BA]/20", gradient: "from-[#0047BA] to-[#00B4D8]" },
                      owner: { label: "Tulajdonos", color: "bg-orange-50", text: "text-orange-700", border: "border-orange-100", gradient: "from-orange-500 to-red-500" },
                      sales: { label: "Értékesítés", color: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100", gradient: "from-emerald-500 to-teal-600" },
                      support: { label: "Ügyfélszolgálat", color: "bg-sky-50", text: "text-sky-700", border: "border-sky-100", gradient: "from-sky-500 to-blue-600" },
                      operator: { label: "Operátor", color: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-100", gradient: "from-indigo-500 to-violet-600" },
                    };
                    const role = roleInfo[(user.role || "support") as string] || { label: "Felhasználó", color: "bg-admin-gray-50", text: "text-admin-gray-600", border: "border-admin-gray-100", gradient: "from-admin-gray-500 to-admin-gray-700" };
                    const fmtHu = (ts: number | null | undefined) => ts ? new Date(ts).toLocaleDateString("hu-HU", { year: "numeric", month: "short", day: "numeric" }) : "–";

                    let statusBadge: any;
                    if (user.isLocked) statusBadge = { label: "Lezárva", color: "bg-rose-50 text-rose-700 border-rose-100", dot: "bg-rose-500" };
                    else if (!user.isInviteAccepted) statusBadge = { label: "Meghívva", color: "bg-amber-50 text-amber-700 border-amber-100", dot: "bg-amber-500 animate-pulse" };
                    else if (user.hasPassword) statusBadge = { label: "Aktív", color: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500" };
                    else statusBadge = { label: "Inaktív", color: "bg-admin-gray-50 text-admin-gray-600 border-admin-gray-100", dot: "bg-admin-gray-400" };

                    return (
                      <div key={user.id || `crm-${user.email}`} className="bg-white rounded-3xl p-1 border border-admin-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.05)] hover:shadow-[0_30px_80px_rgba(0,0,0,0.1)] transition-all duration-500 group relative overflow-hidden">
                        <div className={`absolute -top-24 -right-24 w-56 h-56 bg-gradient-to-br ${role.gradient} opacity-0 group-hover:opacity-10 rounded-full blur-[40px] transition-opacity duration-500 pointer-events-none`} />
                        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[2px] bg-gradient-to-r from-transparent via-[#0047BA] to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-500`} />

                        <div className="p-7 flex flex-col h-full relative z-10">
                          <div className="flex items-start gap-4 mb-6">
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${role.gradient} flex items-center justify-center shadow-lg shrink-0 relative`}>
                              <span className="text-white font-black text-lg tracking-tight">{monogram}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="font-bold text-lg text-admin-gray-900 truncate">{nameDisplay}</h3>
                                <span className={`px-2 py-0.5 border rounded-full text-[10px] font-black tracking-wider uppercase shrink-0 ${statusBadge.color}`}>
                                  <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${statusBadge.dot}`} />
                                  {statusBadge.label}
                                </span>
                              </div>
                              <div className="text-sm font-semibold text-admin-gray-500 truncate mb-2 flex items-center gap-1.5">
                                <svg className="w-4 h-4 text-admin-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                </svg>
                                {user.email}
                              </div>
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[10px] font-black tracking-wider uppercase ${role.color} ${role.text} ${role.border}`}>
                                {role.label}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2.5 mb-6">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-admin-gray-500 font-medium">Létrehozva</span>
                              <span className="font-bold text-admin-gray-800">{fmtHu(user.createdAt)}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-admin-gray-500 font-medium">Utolsó bejelentkezés</span>
                              <span className="font-bold text-admin-gray-800">{fmtHu(user.lastLoginAt)}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-admin-gray-500 font-medium">2FA</span>
                              <span className={`font-bold ${user.twoFactorEnabled ? "text-emerald-700" : "text-admin-gray-400"}`}>
                                {user.twoFactorEnabled ? "Bekapcsolva" : "Kikapcsolva"}
                              </span>
                            </div>
                            {typeof user.failedLoginAttempts === "number" && user.failedLoginAttempts > 0 && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-admin-gray-500 font-medium">Sikertelen próbálkozások</span>
                                <span className="font-bold text-amber-700">{user.failedLoginAttempts}</span>
                              </div>
                            )}
                          </div>

                          <div className="mt-auto pt-5 border-t border-admin-gray-100/80">
                            <div className="flex gap-2.5">
                              <button
                                onClick={() => setToast({ type: "success", message: `⚙️ ${user.email} beállításai hamarosan elérhetőek.` })}
                                className="flex-1 py-2.5 bg-white hover:bg-admin-gray-50 text-admin-gray-900 rounded-xl text-xs font-bold tracking-wider uppercase transition-colors border border-admin-gray-200 shadow-sm"
                              >
                                Beállítások
                              </button>
                              <button
                                onClick={() => setToast({ type: user.isInviteAccepted ? "success" : "success", message: user.isInviteAccepted ? `🔐 ${user.email} jelszó-visszaállítási email küldve.` : `💌 ${user.email} meghívója újraküldve.` })}
                                className="flex-1 py-2.5 bg-gradient-to-br from-[#0047BA]/5 to-[#00B4D8]/5 hover:from-[#0047BA]/10 hover:to-[#00B4D8]/10 text-[#0047BA] rounded-xl text-xs font-bold tracking-wider uppercase transition-colors border border-[#0047BA]/20 shadow-sm"
                              >
                                {user.isInviteAccepted ? "Új jelszó" : "Meghívás újra"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : active === "history" ? (
            <div className="max-w-4xl mx-auto w-full my-auto">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-2xl flex items-center justify-center mb-8 border border-indigo-100">
                  <svg className="w-9 h-9 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="font-serif text-3xl font-bold tracking-tight text-admin-gray-900 mb-3">Előzmények</h2>
                <p className="text-admin-gray-500 font-medium max-w-lg mb-8 text-base leading-relaxed">
                  A foglalások és CRM műveletek idővonalának részletes áttekintése hamarosan itt következik.
                </p>
                <button onClick={() => setActive("dashboard")} className="px-6 py-3 bg-admin-gray-900 hover:bg-admin-black text-white rounded-xl font-semibold text-sm transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5">
                  Vissza az Irányítópultra
                </button>
              </div>
            </div>
          ) : active === "statistics" ? (
            <div className="max-w-4xl mx-auto w-full my-auto">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center mb-8 border border-emerald-100">
                  <svg className="w-9 h-9 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                </div>
                <h2 className="font-serif text-3xl font-bold tracking-tight text-admin-gray-900 mb-3">Statisztikák</h2>
                <p className="text-admin-gray-500 font-medium max-w-lg mb-8 text-base leading-relaxed">
                  Futások, bevétel és kitöltöttség részletes diagramjai és riportjai hamarosan érkeznek.
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <button onClick={() => setActive("clients")} className="px-6 py-3 bg-gradient-to-br from-[#0047BA] to-[#00B4D8] hover:shadow-lg hover:shadow-[#0047BA]/25 text-white rounded-xl font-semibold text-sm transition-all duration-300 hover:-translate-y-0.5 shadow-md shadow-[#0047BA]/15">
                    Ügyfelek áttekintése
                  </button>
                  <button onClick={() => setActive("dashboard")} className="px-6 py-3 bg-white hover:bg-admin-gray-50 text-admin-gray-900 rounded-xl font-semibold text-sm transition-all duration-300 border border-admin-gray-200 shadow-md hover:shadow-lg hover:-translate-y-0.5">
                    Vissza az Irányítópultra
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl w-full mx-auto flex flex-col items-center text-center my-auto">
              {/* Elegant Icon */}
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-admin-gray-100 relative group">
                <div className="absolute inset-0 border border-admin-gray-200 rounded-full scale-110 opacity-0 group-hover:scale-125 group-hover:opacity-100 transition-all duration-700" />
                <svg className="w-10 h-10 text-admin-gray-400 group-hover:text-admin-gray-900 transition-colors duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              
              <h2 className="font-serif text-3xl font-bold tracking-tight text-admin-gray-900 mb-4">
                Ismeretlen oldal
              </h2>
              <p className="text-admin-gray-500 font-medium text-base leading-relaxed max-w-lg mb-10">
                A kért oldal nem található. Válassz egy menüpontot a bal oldali navigációból, vagy menj vissza az Irányítópultra.
              </p>

              <div className="flex flex-wrap gap-3 items-center justify-center">
                <button
                  onClick={() => setActive("dashboard")}
                  className="px-6 py-3 bg-admin-gray-900 hover:bg-admin-black text-white rounded-xl font-semibold text-sm transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                >
                  Vissza az Irányítópultra
                </button>
                <button
                  onClick={() => setActive("terms")}
                  className="px-6 py-3 bg-gradient-to-br from-[#0047BA] to-[#00B4D8] hover:shadow-lg hover:shadow-[#0047BA]/25 text-white rounded-xl font-semibold text-sm transition-all duration-300 hover:-translate-y-0.5"
                >
                  CATL árstruktúra
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {staffDeleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 sm:px-6 animate-[fadeIn_0.15s_ease-out]">
          <div
            className="absolute inset-0 bg-admin-gray-900/50 backdrop-blur-sm"
            onClick={() => !staffInviteDeleting && setStaffDeleteTarget(null)}
          />
          <div className="relative w-full max-w-md bg-white rounded-[28px] shadow-[0_40px_120px_rgba(15,23,42,0.25)] border border-admin-gray-100 overflow-hidden animate-[popIn_0.2s_ease]">
            <div className="absolute -top-24 -right-24 w-56 h-56 rounded-full bg-gradient-to-br from-rose-500 to-red-600 opacity-10 blur-3xl pointer-events-none" />

            <div className="p-8 sm:p-9">
              <div className="flex items-start gap-5 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-50 to-red-50 border-2 border-rose-100 flex items-center justify-center shrink-0 shadow-inner">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 shadow-md shadow-rose-500/25 flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-white" strokeWidth={2.2} />
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="font-serif text-2xl font-bold tracking-tight text-admin-gray-900 mb-1.5">
                    Végleges törlés
                  </h3>
                  <p className="text-sm text-admin-gray-500 font-medium leading-relaxed">
                    A művelet nem visszavonható. A felhasználó és az összes hozzáférése véglegesen elvész.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50/60 to-red-50/30 p-5 mb-7">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-rose-100 flex items-center justify-center shrink-0 shadow-sm">
                    <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-admin-gray-900 truncate">
                      {staffDeleteTarget.name || staffDeleteTarget.email.split("@")[0]}
                    </div>
                    {staffDeleteTarget.role && (
                      <div className="text-[10px] font-black tracking-widest uppercase text-rose-700 mt-0.5">
                        {staffDeleteTarget.role} · Staff fiók
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-sm font-semibold text-admin-gray-600 flex items-center gap-2 pl-0.5">
                  <svg className="w-4 h-4 text-admin-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  {staffDeleteTarget.email}
                </div>
              </div>

              <div className="mb-7">
                <div className="text-[11px] font-black tracking-[0.18em] uppercase text-admin-gray-500 mb-2.5 pl-1">
                  Mi törlődik
                </div>
                <ul className="space-y-2">
                  {[
                    "A felhasználó személyes adatai (név, email)",
                    "Bejelentkezési jelszó és biztonsági beállítások (2FA)",
                    "Hozzáférés a CRM-hez és a Diszpécser Központhoz",
                    "Aktív meghívók és munkamenetek",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-admin-gray-600 font-medium">
                      <svg className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => !staffInviteDeleting && setStaffDeleteTarget(null)}
                  disabled={!!staffInviteDeleting}
                  className="flex-1 py-3.5 rounded-2xl bg-white hover:bg-admin-gray-50 text-admin-gray-900 text-xs font-black tracking-[0.16em] uppercase border border-admin-gray-200 transition-all hover:-translate-y-0.5 hover:shadow-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  Mégsem
                </button>
                <button
                  type="button"
                  onClick={handleConfirmStaffDelete}
                  disabled={!!staffInviteDeleting}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white text-xs font-black tracking-[0.16em] uppercase shadow-lg shadow-rose-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-rose-500/35 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                >
                  {staffInviteDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Törlés...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Végleges törlés
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-[fadeIn_0.2s_ease-out]">
          <div
            className={`rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-3 border ${
              toast.type === "success"
                ? "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200"
                : "bg-gradient-to-br from-rose-50 to-red-50 border-rose-200"
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                toast.type === "success"
                  ? "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/20"
                  : "bg-gradient-to-br from-rose-500 to-red-600 shadow-md shadow-rose-500/20"
              }`}
            >
              <svg
                className={`w-5 h-5 text-white`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                {toast.type === "success" ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                )}
              </svg>
            </div>
            <div>
              <div
                className={`text-[11px] font-black tracking-widest uppercase mb-0.5 ${
                  toast.type === "success" ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                {toast.type === "success" ? "Sikeres művelet" : "Hiba történt"}
              </div>
              <div className={`text-sm font-semibold ${toast.type === "success" ? "text-emerald-900" : "text-rose-900"}`}>
                {toast.message}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
