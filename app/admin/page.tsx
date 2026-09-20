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

// A dedikált partnerportálok (CATL, NI, stb.) éles URL-je. FONTOS: ez a CRM admin
// domainjétől (pannontransferkomplexxfoglalasikozp.vercel.app) FÜGGETLEN, külön Vercel
// projekt (pannontransferpartnercegek). A meghívó e-mailek linkjének mindig erre kell
// mutatnia, soha nem a CRM admin saját domainjére, mert az illetéktelenek elől rejtett.
const PARTNER_PORTAL_BASE_URL =
  process.env.NEXT_PUBLIC_PARTNER_PORTAL_URL || "https://pannontransferkomplexxpartnerceg.vercel.app";

// A diszpécseri rendszer éles URL-je. FONTOS: ez is a CRM admin domainjétől
// (pannontransferkomplexxfoglalasikozp.vercel.app) FÜGGETLEN, külön Vercel projekt
// (pannontransferkozpontifoglalasrendszerdiszpecher). A diszpécser/admin meghívó
// e-mailek linkjének mindig erre kell mutatnia, soha nem a CRM admin saját domainjére,
// különben a link rögtön lejártnak/érvénytelennek tűnik a másik alkalmazásban.
const DISPATCHER_PORTAL_BASE_URL =
  process.env.NEXT_PUBLIC_DISPATCHER_PORTAL_URL || "https://pannontransferkomplexxdiszpecheri.vercel.app";

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
    id: "driver-invites",
    label: "Sofőrök meghívó",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
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
  const [activeTermsSubpage, setActiveTermsSubpage] = useState<"list" | "catl" | "ecopro" | "eccoino" | "vitesco" | "schaeffler" | "krones" | "enterair" | "tama" | "ni">("list");

  useEffect(() => {
    setActiveTermsSubpage("list");
  }, [active]);

  const [editMode, setEditMode] = useState(false);
  const [catlPricingDraft, setCatlPricingDraft] = useState<any>(null);
  const [activePartnerDraft, setActivePartnerDraft] = useState<any>(null);
  const [activePartnerLoading, setActivePartnerLoading] = useState(false);
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
  const [catlInviteResending, setCatlInviteResending] = useState<string | null>(null);
  const [ecoproInvites, setEcoproInvites] = useState<any[] | null>(null);
  const [ecoproInvitesMeta, setEcoproInvitesMeta] = useState<any>({ total: 0, activated: 0, pending: 0, require2fa: 0 });
  const [ecoproInvitesLoading, setEcoproInvitesLoading] = useState(false);
  const displayEcoproInvites: any[] =
    ecoproInvites && ecoproInvites.length > 0 ? ecoproInvites : [];
  const derivedEcoproMeta = (() => {
    if (ecoproInvitesLoading || displayEcoproInvites.length === 0) {
      if (ecoproInvitesLoading) {
        return {
          total: null as number | null,
          activated: null as number | null,
          pending: null as number | null,
          require2fa: null as number | null,
        };
      }
      return {
        total: ecoproInvitesMeta?.total ?? 0,
        activated: ecoproInvitesMeta?.activated ?? 0,
        pending: ecoproInvitesMeta?.pending ?? 0,
        require2fa: ecoproInvitesMeta?.require2fa ?? 0,
      };
    }
    const total = displayEcoproInvites.length;
    let activated = 0;
    let pending = 0;
    let require2fa = 0;
    for (const u of displayEcoproInvites) {
      if (u?.requireTwoFactor) require2fa++;
      if (u?.isActivated) activated++;
      else pending++;
    }
    return { total, activated, pending, require2fa };
  })();
  const [ecoproInviteRecipients, setEcoproInviteRecipients] = useState("");
  const [ecoproInvite2FA, setEcoproInvite2FA] = useState(false);
  const [ecoproInviteSending, setEcoproInviteSending] = useState(false);
  const [ecoproInviteDeleting, setEcoproInviteDeleting] = useState<string | null>(null);
  const [ecoproInviteResending, setEcoproInviteResending] = useState<string | null>(null);

  // Eccoino invites management
  const [eccoinoInvites, setEccoinoInvites] = useState<any[] | null>(null);
  const [eccoinoInvitesMeta, setEccoinoInvitesMeta] = useState<any>({ total: 0, activated: 0, pending: 0, require2fa: 0 });
  const [eccoinoInvitesLoading, setEccoinoInvitesLoading] = useState(false);
  const displayEccoinoInvites: any[] = eccoinoInvites && eccoinoInvites.length > 0 ? eccoinoInvites : [];
  const [eccoinoInviteRecipients, setEccoinoInviteRecipients] = useState("");
  const [eccoinoInvite2FA, setEccoinoInvite2FA] = useState(false);
  const [eccoinoInviteSending, setEccoinoInviteSending] = useState(false);
  const [eccoinoInviteDeleting, setEccoinoInviteDeleting] = useState<string | null>(null);
  const [eccoinoInviteResending, setEccoinoInviteResending] = useState<string | null>(null);

  // Vitesco invites management
  const [vitescoInvites, setVitescoInvites] = useState<any[] | null>(null);
  const [vitescoInvitesMeta, setVitescoInvitesMeta] = useState<any>({ total: 0, activated: 0, pending: 0, require2fa: 0 });
  const [vitescoInvitesLoading, setVitescoInvitesLoading] = useState(false);
  const displayVitescoInvites: any[] = vitescoInvites && vitescoInvites.length > 0 ? vitescoInvites : [];
  const [vitescoInviteRecipients, setVitescoInviteRecipients] = useState("");
  const [vitescoInvite2FA, setVitescoInvite2FA] = useState(false);
  const [vitescoInviteSending, setVitescoInviteSending] = useState(false);
  const [vitescoInviteDeleting, setVitescoInviteDeleting] = useState<string | null>(null);
  const [vitescoInviteResending, setVitescoInviteResending] = useState<string | null>(null);

  // Schaeffler invites management
  const [schaefflerInvites, setSchaefflerInvites] = useState<any[] | null>(null);
  const [schaefflerInvitesMeta, setSchaefflerInvitesMeta] = useState<any>({ total: 0, activated: 0, pending: 0, require2fa: 0 });
  const [schaefflerInvitesLoading, setSchaefflerInvitesLoading] = useState(false);
  const displaySchaefflerInvites: any[] = schaefflerInvites && schaefflerInvites.length > 0 ? schaefflerInvites : [];
  const [schaefflerInviteRecipients, setSchaefflerInviteRecipients] = useState("");
  const [schaefflerInvite2FA, setSchaefflerInvite2FA] = useState(false);
  const [schaefflerInviteSending, setSchaefflerInviteSending] = useState(false);
  const [schaefflerInviteDeleting, setSchaefflerInviteDeleting] = useState<string | null>(null);
  const [schaefflerInviteResending, setSchaefflerInviteResending] = useState<string | null>(null);

  // Krones invites management
  const [kronesInvites, setKronesInvites] = useState<any[] | null>(null);
  const [kronesInvitesMeta, setKronesInvitesMeta] = useState<any>({ total: 0, activated: 0, pending: 0, require2fa: 0 });
  const [kronesInvitesLoading, setKronesInvitesLoading] = useState(false);
  const displayKronesInvites: any[] = kronesInvites && kronesInvites.length > 0 ? kronesInvites : [];
  const [kronesInviteRecipients, setKronesInviteRecipients] = useState("");
  const [kronesInvite2FA, setKronesInvite2FA] = useState(false);
  const [kronesInviteSending, setKronesInviteSending] = useState(false);
  const [kronesInviteDeleting, setKronesInviteDeleting] = useState<string | null>(null);
  const [kronesInviteResending, setKronesInviteResending] = useState<string | null>(null);

  // Enter Air invites management
  const [enterairInvites, setEnterairInvites] = useState<any[] | null>(null);
  const [enterairInvitesMeta, setEnterairInvitesMeta] = useState<any>({ total: 0, activated: 0, pending: 0, require2fa: 0 });
  const [enterairInvitesLoading, setEnterairInvitesLoading] = useState(false);
  const displayEnterairInvites: any[] = enterairInvites && enterairInvites.length > 0 ? enterairInvites : [];
  const [enterairInviteRecipients, setEnterairInviteRecipients] = useState("");
  const [enterairInvite2FA, setEnterairInvite2FA] = useState(false);
  const [enterairInviteSending, setEnterairInviteSending] = useState(false);
  const [enterairInviteDeleting, setEnterairInviteDeleting] = useState<string | null>(null);
  const [enterairInviteResending, setEnterairInviteResending] = useState<string | null>(null);

  // Tama invites management
  const [tamaInvites, setTamaInvites] = useState<any[] | null>(null);
  const [tamaInvitesMeta, setTamaInvitesMeta] = useState<any>({ total: 0, activated: 0, pending: 0, require2fa: 0 });
  const [tamaInvitesLoading, setTamaInvitesLoading] = useState(false);
  const displayTamaInvites: any[] = tamaInvites && tamaInvites.length > 0 ? tamaInvites : [];
  const [tamaInviteRecipients, setTamaInviteRecipients] = useState("");
  const [tamaInvite2FA, setTamaInvite2FA] = useState(false);
  const [tamaInviteSending, setTamaInviteSending] = useState(false);
  const [tamaInviteDeleting, setTamaInviteDeleting] = useState<string | null>(null);
  const [tamaInviteResending, setTamaInviteResending] = useState<string | null>(null);

  // NI invites management
  const [niInvites, setNiInvites] = useState<any[] | null>(null);
  const [niInvitesMeta, setNiInvitesMeta] = useState<any>({ total: 0, activated: 0, pending: 0, require2fa: 0 });
  const [niInvitesLoading, setNiInvitesLoading] = useState(false);
  const displayNiInvites: any[] = niInvites && niInvites.length > 0 ? niInvites : [];
  const [niInviteRecipients, setNiInviteRecipients] = useState("");
  const [niInvite2FA, setNiInvite2FA] = useState(false);
  const [niInviteSending, setNiInviteSending] = useState(false);
  const [niInviteDeleting, setNiInviteDeleting] = useState<string | null>(null);
  const [niInviteResending, setNiInviteResending] = useState<string | null>(null);
  const [niInviteRole, setNiInviteRole] = useState<"normal" | "admin-ni">("admin-ni");
  const [niInviteRecipientName, setNiInviteRecipientName] = useState("");

  const [staffInviteRecipients, setStaffInviteRecipients] = useState("");
  const [staffInviteRole, setStaffInviteRole] = useState<"admin" | "dispatcher">("dispatcher");
  const [staffInvite2FA, setStaffInvite2FA] = useState(false);
  const [staffInviteSending, setStaffInviteSending] = useState(false);
  const [staffInvites, setStaffInvites] = useState<any[] | null>(null);
  const [staffInvitesMeta, setStaffInvitesMeta] = useState<any>({ total: 0, activated: 0, pending: 0, require2fa: 0 });
  const [staffInvitesLoading, setStaffInvitesLoading] = useState(false);
  const [staffInviteDeleting, setStaffInviteDeleting] = useState<string | null>(null);
  const [driverInviteRecipients, setDriverInviteRecipients] = useState("");
  const [driverInviteSending, setDriverInviteSending] = useState(false);
  const [driverInvites, setDriverInvites] = useState<any[] | null>(null);
  const [driverInvitesLoading, setDriverInvitesLoading] = useState(false);
  const [driverInviteDeleting, setDriverInviteDeleting] = useState<string | null>(null);

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
        body: JSON.stringify({ email }),
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

  async function handleDeleteEcoproUser(id: string, email: string) {
    if (!window.confirm(`Biztosan törlöd a(z) ${email} felhasználót és az általa használt EcoPro hozzáférést?\n\nA művelet nem visszavonható.`)) {
      return;
    }
    setEcoproInviteDeleting(id);
    try {
      const res = await fetch("/api/ecopro-invites/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setToast({ type: "error", message: json?.message || "Hiba történt a törlés közben." });
      } else {
        setToast({ type: "success", message: json.message || "EcoPro felhasználó törölve." });
        const listRes = await fetch("/api/ecopro-invites/list", { cache: "no-store" });
        const listJson = await listRes.json().catch(() => null);
        if (listRes.ok && listJson?.success) {
          setEcoproInvites(listJson.users || []);
          setEcoproInvitesMeta(listJson.counts || ecoproInvitesMeta);
        }
      }
    } catch {
      setToast({ type: "error", message: "Hálózati hiba törlés közben." });
    } finally {
      setEcoproInviteDeleting(null);
    }
  }


  useEffect(() => {
    setEditMode(false);
    setCatlPricingDraft(null);
    setActivePartnerDraft(null);
    (async () => {
      if (active === "terms" && activeTermsSubpage !== "list") {
        const key = activeTermsSubpage;
        setActivePartnerLoading(true);
        try {
          const res = await fetch(`/api/partner-pricing?partnerKey=${key}`, { cache: "no-store" });
          if (res.ok) {
            const json = await res.json();
            if (json?.success && json.data) {
              if (key === "catl") setCatlPricingDraft(json.data);
              setActivePartnerDraft(json.data);
            }
          }
        } catch {}
        finally { setActivePartnerLoading(false); }
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
    if (active !== "ecopro-invites") return;
    setEcoproInvitesLoading(true);
    (async () => {
      try {
        const res = await fetch("/api/ecopro-invites/list", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (json?.success && Array.isArray(json.users)) {
            setEcoproInvites(json.users);
            setEcoproInvitesMeta(json.counts || { total: json.users.length, activated: 0, pending: 0, require2fa: 0 });
          } else {
            setEcoproInvites(null);
          }
        } else setEcoproInvites(null);
      } catch {
        setEcoproInvites(null);
      } finally {
        setEcoproInvitesLoading(false);
      }
    })();
  }, [active]);

  useEffect(() => {
    if (active !== "driver-invites") return;
    setDriverInvitesLoading(true);
    (async () => {
      try {
        const res = await fetch("/api/driver-invites/list", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (json?.success && Array.isArray(json.users)) {
            setDriverInvites(json.users);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setDriverInvitesLoading(false);
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

  // Eccoino useEffect
  useEffect(() => {
    if (active !== "eccoino-invites") return;
    setEccoinoInvitesLoading(true);
    (async () => {
      try {
        const res = await fetch("/api/eccoino-invites/list", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (json?.success && Array.isArray(json.users)) {
            setEccoinoInvites(json.users);
            setEccoinoInvitesMeta(json.counts || { total: json.users.length, activated: 0, pending: 0, require2fa: 0 });
          } else {
            setEccoinoInvites(null);
          }
        } else setEccoinoInvites(null);
      } catch {
        setEccoinoInvites(null);
      } finally {
        setEccoinoInvitesLoading(false);
      }
    })();
  }, [active]);

  // Vitesco useEffect
  useEffect(() => {
    if (active !== "vitesco-invites") return;
    setVitescoInvitesLoading(true);
    (async () => {
      try {
        const res = await fetch("/api/vitesco-invites/list", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (json?.success && Array.isArray(json.users)) {
            setVitescoInvites(json.users);
            setVitescoInvitesMeta(json.counts || { total: json.users.length, activated: 0, pending: 0, require2fa: 0 });
          } else {
            setVitescoInvites(null);
          }
        } else setVitescoInvites(null);
      } catch {
        setVitescoInvites(null);
      } finally {
        setVitescoInvitesLoading(false);
      }
    })();
  }, [active]);

  // Schaeffler useEffect
  useEffect(() => {
    if (active !== "schaeffler-invites") return;
    setSchaefflerInvitesLoading(true);
    (async () => {
      try {
        const res = await fetch("/api/schaeffler-invites/list", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (json?.success && Array.isArray(json.users)) {
            setSchaefflerInvites(json.users);
            setSchaefflerInvitesMeta(json.counts || { total: json.users.length, activated: 0, pending: 0, require2fa: 0 });
          } else {
            setSchaefflerInvites(null);
          }
        } else setSchaefflerInvites(null);
      } catch {
        setSchaefflerInvites(null);
      } finally {
        setSchaefflerInvitesLoading(false);
      }
    })();
  }, [active]);

  // Krones useEffect
  useEffect(() => {
    if (active !== "krones-invites") return;
    setKronesInvitesLoading(true);
    (async () => {
      try {
        const res = await fetch("/api/krones-invites/list", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (json?.success && Array.isArray(json.users)) {
            setKronesInvites(json.users);
            setKronesInvitesMeta(json.counts || { total: json.users.length, activated: 0, pending: 0, require2fa: 0 });
          } else {
            setKronesInvites(null);
          }
        } else setKronesInvites(null);
      } catch {
        setKronesInvites(null);
      } finally {
        setKronesInvitesLoading(false);
      }
    })();
  }, [active]);

  // EnterAir useEffect
  useEffect(() => {
    if (active !== "enterair-invites") return;
    setEnterairInvitesLoading(true);
    (async () => {
      try {
        const res = await fetch("/api/enterair-invites/list", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (json?.success && Array.isArray(json.users)) {
            setEnterairInvites(json.users);
            setEnterairInvitesMeta(json.counts || { total: json.users.length, activated: 0, pending: 0, require2fa: 0 });
          } else {
            setEnterairInvites(null);
          }
        } else setEnterairInvites(null);
      } catch {
        setEnterairInvites(null);
      } finally {
        setEnterairInvitesLoading(false);
      }
    })();
  }, [active]);

  // Tama useEffect
  useEffect(() => {
    if (active !== "tama-invites") return;
    setTamaInvitesLoading(true);
    (async () => {
      try {
        const res = await fetch("/api/tama-invites/list", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (json?.success && Array.isArray(json.users)) {
            setTamaInvites(json.users);
            setTamaInvitesMeta(json.counts || { total: json.users.length, activated: 0, pending: 0, require2fa: 0 });
          } else {
            setTamaInvites(null);
          }
        } else setTamaInvites(null);
      } catch {
        setTamaInvites(null);
      } finally {
        setTamaInvitesLoading(false);
      }
    })();
  }, [active]);

  // NI useEffect
  useEffect(() => {
    if (active !== "ni-invites") return;
    setNiInvitesLoading(true);
    (async () => {
      try {
        const res = await fetch("/api/ni-invites/list", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (json?.success && Array.isArray(json.users)) {
            setNiInvites(json.users);
            setNiInvitesMeta(json.counts || { total: json.users.length, activated: 0, pending: 0, require2fa: 0 });
          } else {
            setNiInvites(null);
          }
        } else setNiInvites(null);
      } catch {
        setNiInvites(null);
      } finally {
        setNiInvitesLoading(false);
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
    let catlPartnerBase = PARTNER_PORTAL_BASE_URL;
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.origin);
        if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
          url.port = "3001";
          catlPartnerBase = url.origin;
        }
      } catch {
        // Marad a PARTNER_PORTAL_BASE_URL (production) alapertelmezes.
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
        const detailedError = json?.results?.find((r: any) => !r?.success)?.error;
        setToast({ type: "error", message: detailedError || json?.message || "Hiba történt a küldés közben." });
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

  async function handleSendEcoproInvite() {
    const recipients = ecoproInviteRecipients
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

    let ecoproPartnerBase = PARTNER_PORTAL_BASE_URL;
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.origin);
        if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
          url.port = "3001";
          ecoproPartnerBase = url.origin;
        }
      } catch {
        // Marad a PARTNER_PORTAL_BASE_URL (production) alapertelmezes.
      }
    }

    setEcoproInviteSending(true);
    try {
      const res = await fetch("/api/ecopro-invites/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients,
          requireTwoFactor: !!ecoproInvite2FA,
          loginBaseUrl: ecoproPartnerBase,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        const detailedError = json?.results?.find((r: any) => !r?.success)?.error;
        setToast({ type: "error", message: detailedError || json?.message || "Hiba történt a küldés közben." });
      } else {
        setToast({ type: "success", message: json.message || "EcoPro meghívók sikeresen elküldve." });
        setEcoproInviteRecipients("");
        setEcoproInvite2FA(false);
        const listRes = await fetch("/api/ecopro-invites/list", { cache: "no-store" });
        if (listRes.ok) {
          const j2 = await listRes.json();
          if (j2?.success) {
            setEcoproInvites(j2.users);
            setEcoproInvitesMeta(j2.counts || {});
          }
        }
      }
    } catch {
      setToast({ type: "error", message: "Hálózati hiba a küldés közben." });
    } finally {
      setEcoproInviteSending(false);
    }
  }

  async function handleResendCatlInvite(id: string, email: string, requireTwoFactor: boolean) {
    let catlPartnerBase = PARTNER_PORTAL_BASE_URL;
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.origin);
        if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
          url.port = "3001";
          catlPartnerBase = url.origin;
        }
      } catch {
        // Marad a PARTNER_PORTAL_BASE_URL (production) alapertelmezes.
      }
    }

    setCatlInviteResending(id);
    try {
      const res = await fetch("/api/catl-invites/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: [email],
          requireTwoFactor,
          loginBaseUrl: catlPartnerBase,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        const detailedError = json?.results?.find((r: any) => !r?.success)?.error;
        setToast({ type: "error", message: detailedError || json?.message || "A meghívó újraküldése nem sikerült." });
      } else {
        setToast({ type: "success", message: `${email} részére a CATL meghívó újra kiküldve.` });
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
      setToast({ type: "error", message: "Hálózati hiba a meghívó újraküldése közben." });
    } finally {
      setCatlInviteResending(null);
    }
  }

  async function handleResendEcoproInvite(id: string, email: string, requireTwoFactor: boolean) {
    let ecoproPartnerBase = PARTNER_PORTAL_BASE_URL;
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.origin);
        if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
          url.port = "3001";
          ecoproPartnerBase = url.origin;
        }
      } catch {
        // Marad a PARTNER_PORTAL_BASE_URL (production) alapertelmezes.
      }
    }

    setEcoproInviteResending(id);
    try {
      const res = await fetch("/api/ecopro-invites/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: [email],
          requireTwoFactor,
          loginBaseUrl: ecoproPartnerBase,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        const detailedError = json?.results?.find((r: any) => !r?.success)?.error;
        setToast({ type: "error", message: detailedError || json?.message || "Az EcoPro meghívó újraküldése nem sikerült." });
      } else {
        setToast({ type: "success", message: `${email} részére az EcoPro meghívó újra kiküldve.` });
        const listRes = await fetch("/api/ecopro-invites/list", { cache: "no-store" });
        if (listRes.ok) {
          const j2 = await listRes.json();
          if (j2?.success) {
            setEcoproInvites(j2.users);
            setEcoproInvitesMeta(j2.counts || {});
          }
        }
      }
    } catch {
      setToast({ type: "error", message: "Hálózati hiba az EcoPro meghívó újraküldése közben." });
    } finally {
      setEcoproInviteResending(null);
    }
  }

  // Eccoino handlers
  async function handleSendEccoinoInvite() {
    const recipients = eccoinoInviteRecipients
      .split(/[,;\n]/)
      .map((s: string) => s.trim())
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

    let eccoinoPartnerBase = PARTNER_PORTAL_BASE_URL;
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.origin);
        if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
          url.port = "3001";
          eccoinoPartnerBase = url.origin;
        }
      } catch {
        // Marad a PARTNER_PORTAL_BASE_URL (production) alapertelmezes.
      }
    }

    setEccoinoInviteSending(true);
    try {
      const res = await fetch("/api/eccoino-invites/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients,
          requireTwoFactor: eccoinoInvite2FA,
          loginBaseUrl: eccoinoPartnerBase,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        const detailedError = json?.results?.find((r: any) => !r?.success)?.error;
        setToast({ type: "error", message: detailedError || json?.message || "Hiba történt a küldés közben." });
      } else {
        setToast({ type: "success", message: json.message || "Eccoino meghívók sikeresen elküldve." });
        setEccoinoInviteRecipients("");
        setEccoinoInvite2FA(false);
        const listRes = await fetch("/api/eccoino-invites/list", { cache: "no-store" });
        if (listRes.ok) {
          const j2 = await listRes.json();
          if (j2?.success) {
            setEccoinoInvites(j2.users);
            setEccoinoInvitesMeta(j2.counts || {});
          }
        }
      }
    } catch {
      setToast({ type: "error", message: "Hálózati hiba a küldés közben." });
    } finally {
      setEccoinoInviteSending(false);
    }
  }

  async function handleDeleteEccoinoUser(id: string, email: string) {
    if (!confirm(`Biztosan törölni szeretnéd a(z) ${email} felhasználót?`)) return;
    setEccoinoInviteDeleting(id);
    try {
      const res = await fetch("/api/eccoino-invites/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setToast({ type: "error", message: json?.message || "Hiba történt a törlés során." });
      } else {
        setToast({ type: "success", message: "Felhasználó törölve." });
        const listRes = await fetch("/api/eccoino-invites/list", { cache: "no-store" });
        if (listRes.ok) {
          const j2 = await listRes.json();
          if (j2?.success) {
            setEccoinoInvites(j2.users);
            setEccoinoInvitesMeta(j2.counts || {});
          }
        }
      }
    } catch {
      setToast({ type: "error", message: "Hálózati hiba a törlés közben." });
    } finally {
      setEccoinoInviteDeleting(null);
    }
  }

  async function handleResendEccoinoInvite(id: string, email: string, requireTwoFactor: boolean) {
    let eccoinoPartnerBase = PARTNER_PORTAL_BASE_URL;
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.origin);
        if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
          url.port = "3001";
          eccoinoPartnerBase = url.origin;
        }
      } catch {
        // Marad a PARTNER_PORTAL_BASE_URL (production) alapertelmezes.
      }
    }

    setEccoinoInviteResending(id);
    try {
      const res = await fetch("/api/eccoino-invites/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: [email],
          requireTwoFactor,
          loginBaseUrl: eccoinoPartnerBase,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        const detailedError = json?.results?.find((r: any) => !r?.success)?.error;
        setToast({ type: "error", message: detailedError || json?.message || "A meghívó újraküldése nem sikerült." });
      } else {
        setToast({ type: "success", message: `${email} részére az Eccoino meghívó újra kiküldve.` });
        const listRes = await fetch("/api/eccoino-invites/list", { cache: "no-store" });
        if (listRes.ok) {
          const j2 = await listRes.json();
          if (j2?.success) {
            setEccoinoInvites(j2.users);
            setEccoinoInvitesMeta(j2.counts || {});
          }
        }
      }
    } catch {
      setToast({ type: "error", message: "Hálózati hiba a meghívó újraküldése közben." });
    } finally {
      setEccoinoInviteResending(null);
    }
  }

  // Vitesco handlers
  async function handleSendVitescoInvite() {
    const recipients = vitescoInviteRecipients
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

    let vitescoPartnerBase = PARTNER_PORTAL_BASE_URL;
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.origin);
        if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
          url.port = "3001";
          vitescoPartnerBase = url.origin;
        }
      } catch {
        // Marad a PARTNER_PORTAL_BASE_URL (production) alapertelmezes.
      }
    }

    setVitescoInviteSending(true);
    try {
      const res = await fetch("/api/vitesco-invites/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients,
          requireTwoFactor: !!vitescoInvite2FA,
          loginBaseUrl: vitescoPartnerBase,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        const detailedError = json?.results?.find((r: any) => !r?.success)?.error;
        setToast({ type: "error", message: detailedError || json?.message || "Hiba történt a küldés közben." });
      } else {
        setToast({ type: "success", message: json.message || "Vitesco meghívók sikeresen elküldve." });
        setVitescoInviteRecipients("");
        setVitescoInvite2FA(false);
        const listRes = await fetch("/api/vitesco-invites/list", { cache: "no-store" });
        if (listRes.ok) {
          const j2 = await listRes.json();
          if (j2?.success) {
            setVitescoInvites(j2.users);
            setVitescoInvitesMeta(j2.counts || {});
          }
        }
      }
    } catch {
      setToast({ type: "error", message: "Hálózati hiba a küldés közben." });
    } finally {
      setVitescoInviteSending(false);
    }
  }

  async function handleDeleteVitescoUser(id: string, email: string) {
    if (!window.confirm(`Biztosan törlöd a(z) ${email} felhasználót és az általa használt Vitesco hozzáférést?\n\nA művelet nem visszavonható.`)) {
      return;
    }
    setVitescoInviteDeleting(id);
    try {
      const res = await fetch("/api/vitesco-invites/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setToast({ type: "error", message: json?.message || "Hiba történt a törlés közben." });
      } else {
        setToast({ type: "success", message: json.message || "Vitesco felhasználó törölve." });
        const listRes = await fetch("/api/vitesco-invites/list", { cache: "no-store" });
        const listJson = await listRes.json().catch(() => null);
        if (listRes.ok && listJson?.success) {
          setVitescoInvites(listJson.users || []);
          setVitescoInvitesMeta(listJson.counts || vitescoInvitesMeta);
        }
      }
    } catch {
      setToast({ type: "error", message: "Hálózati hiba törlés közben." });
    } finally {
      setVitescoInviteDeleting(null);
    }
  }

  async function handleResendVitescoInvite(id: string, email: string, requireTwoFactor: boolean) {
    let vitescoPartnerBase = PARTNER_PORTAL_BASE_URL;
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.origin);
        if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
          url.port = "3001";
          vitescoPartnerBase = url.origin;
        }
      } catch {
        // Marad a PARTNER_PORTAL_BASE_URL (production) alapertelmezes.
      }
    }

    setVitescoInviteResending(id);
    try {
      const res = await fetch("/api/vitesco-invites/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: [email],
          requireTwoFactor,
          loginBaseUrl: vitescoPartnerBase,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        const detailedError = json?.results?.find((r: any) => !r?.success)?.error;
        setToast({ type: "error", message: detailedError || json?.message || "A Vitesco meghívó újraküldése nem sikerült." });
      } else {
        setToast({ type: "success", message: `${email} részére a Vitesco meghívó újra kiküldve.` });
        const listRes = await fetch("/api/vitesco-invites/list", { cache: "no-store" });
        if (listRes.ok) {
          const j2 = await listRes.json();
          if (j2?.success) {
            setVitescoInvites(j2.users);
            setVitescoInvitesMeta(j2.counts || {});
          }
        }
      }
    } catch {
      setToast({ type: "error", message: "Hálózati hiba a Vitesco meghívó újraküldése közben." });
    } finally {
      setVitescoInviteResending(null);
    }
  }

  // Schaeffler handlers
  async function handleSendSchaefflerInvite() {
    const recipients = schaefflerInviteRecipients
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

    let schaefflerPartnerBase = PARTNER_PORTAL_BASE_URL;
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.origin);
        if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
          url.port = "3001";
          schaefflerPartnerBase = url.origin;
        }
      } catch {
        // Marad a PARTNER_PORTAL_BASE_URL (production) alapertelmezes.
      }
    }

    setSchaefflerInviteSending(true);
    try {
      const res = await fetch("/api/schaeffler-invites/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients,
          requireTwoFactor: !!schaefflerInvite2FA,
          loginBaseUrl: schaefflerPartnerBase,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        const detailedError = json?.results?.find((r: any) => !r?.success)?.error;
        setToast({ type: "error", message: detailedError || json?.message || "Hiba történt a küldés közben." });
      } else {
        setToast({ type: "success", message: json.message || "Schaeffler meghívók sikeresen elküldve." });
        setSchaefflerInviteRecipients("");
        setSchaefflerInvite2FA(false);
        const listRes = await fetch("/api/schaeffler-invites/list", { cache: "no-store" });
        if (listRes.ok) {
          const j2 = await listRes.json();
          if (j2?.success) {
            setSchaefflerInvites(j2.users);
            setSchaefflerInvitesMeta(j2.counts || {});
          }
        }
      }
    } catch {
      setToast({ type: "error", message: "Hálózati hiba a küldés közben." });
    } finally {
      setSchaefflerInviteSending(false);
    }
  }

  async function handleDeleteSchaefflerUser(id: string, email: string) {
    if (!window.confirm(`Biztosan törlöd a(z) ${email} felhasználót és az általa használt Schaeffler hozzáférést?\n\nA művelet nem visszavonható.`)) {
      return;
    }
    setSchaefflerInviteDeleting(id);
    try {
      const res = await fetch("/api/schaeffler-invites/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setToast({ type: "error", message: json?.message || "Hiba történt a törlés közben." });
      } else {
        setToast({ type: "success", message: json.message || "Schaeffler felhasználó törölve." });
        const listRes = await fetch("/api/schaeffler-invites/list", { cache: "no-store" });
        const listJson = await listRes.json().catch(() => null);
        if (listRes.ok && listJson?.success) {
          setSchaefflerInvites(listJson.users || []);
          setSchaefflerInvitesMeta(listJson.counts || schaefflerInvitesMeta);
        }
      }
    } catch {
      setToast({ type: "error", message: "Hálózati hiba törlés közben." });
    } finally {
      setSchaefflerInviteDeleting(null);
    }
  }

  async function handleResendSchaefflerInvite(id: string, email: string, requireTwoFactor: boolean) {
    let schaefflerPartnerBase = PARTNER_PORTAL_BASE_URL;
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.origin);
        if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
          url.port = "3001";
          schaefflerPartnerBase = url.origin;
        }
      } catch {
        // Marad a PARTNER_PORTAL_BASE_URL (production) alapertelmezes.
      }
    }

    setSchaefflerInviteResending(id);
    try {
      const res = await fetch("/api/schaeffler-invites/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: [email],
          requireTwoFactor,
          loginBaseUrl: schaefflerPartnerBase,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        const detailedError = json?.results?.find((r: any) => !r?.success)?.error;
        setToast({ type: "error", message: detailedError || json?.message || "A Schaeffler meghívó újraküldése nem sikerült." });
      } else {
        setToast({ type: "success", message: `${email} részére a Schaeffler meghívó újra kiküldve.` });
        const listRes = await fetch("/api/schaeffler-invites/list", { cache: "no-store" });
        if (listRes.ok) {
          const j2 = await listRes.json();
          if (j2?.success) {
            setSchaefflerInvites(j2.users);
            setSchaefflerInvitesMeta(j2.counts || {});
          }
        }
      }
    } catch {
      setToast({ type: "error", message: "Hálózati hiba a Schaeffler meghívó újraküldése közben." });
    } finally {
      setSchaefflerInviteResending(null);
    }
  }

  // Krones handlers
  async function handleSendKronesInvite() {
    const recipients = kronesInviteRecipients
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

    let kronesPartnerBase = PARTNER_PORTAL_BASE_URL;
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.origin);
        if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
          url.port = "3001";
          kronesPartnerBase = url.origin;
        }
      } catch {
        // Marad a PARTNER_PORTAL_BASE_URL (production) alapertelmezes.
      }
    }

    setKronesInviteSending(true);
    try {
      const res = await fetch("/api/krones-invites/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients,
          requireTwoFactor: !!kronesInvite2FA,
          loginBaseUrl: kronesPartnerBase,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        const detailedError = json?.results?.find((r: any) => !r?.success)?.error;
        setToast({ type: "error", message: detailedError || json?.message || "Hiba történt a küldés közben." });
      } else {
        setToast({ type: "success", message: json.message || "Krones meghívók sikeresen elküldve." });
        setKronesInviteRecipients("");
        setKronesInvite2FA(false);
        const listRes = await fetch("/api/krones-invites/list", { cache: "no-store" });
        if (listRes.ok) {
          const j2 = await listRes.json();
          if (j2?.success) {
            setKronesInvites(j2.users);
            setKronesInvitesMeta(j2.counts || {});
          }
        }
      }
    } catch {
      setToast({ type: "error", message: "Hálózati hiba a küldés közben." });
    } finally {
      setKronesInviteSending(false);
    }
  }

  async function handleDeleteKronesUser(id: string, email: string) {
    if (!window.confirm(`Biztosan törlöd a(z) ${email} felhasználót és az általa használt Krones hozzáférést?\n\nA művelet nem visszavonható.`)) {
      return;
    }
    setKronesInviteDeleting(id);
    try {
      const res = await fetch("/api/krones-invites/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setToast({ type: "error", message: json?.message || "Hiba történt a törlés közben." });
      } else {
        setToast({ type: "success", message: json.message || "Krones felhasználó törölve." });
        const listRes = await fetch("/api/krones-invites/list", { cache: "no-store" });
        const listJson = await listRes.json().catch(() => null);
        if (listRes.ok && listJson?.success) {
          setKronesInvites(listJson.users || []);
          setKronesInvitesMeta(listJson.counts || kronesInvitesMeta);
        }
      }
    } catch {
      setToast({ type: "error", message: "Hálózati hiba törlés közben." });
    } finally {
      setKronesInviteDeleting(null);
    }
  }

  async function handleResendKronesInvite(id: string, email: string, requireTwoFactor: boolean) {
    let kronesPartnerBase = PARTNER_PORTAL_BASE_URL;
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.origin);
        if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
          url.port = "3001";
          kronesPartnerBase = url.origin;
        }
      } catch {
        // Marad a PARTNER_PORTAL_BASE_URL (production) alapertelmezes.
      }
    }

    setKronesInviteResending(id);
    try {
      const res = await fetch("/api/krones-invites/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: [email],
          requireTwoFactor,
          loginBaseUrl: kronesPartnerBase,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        const detailedError = json?.results?.find((r: any) => !r?.success)?.error;
        setToast({ type: "error", message: detailedError || json?.message || "A Krones meghívó újraküldése nem sikerült." });
      } else {
        setToast({ type: "success", message: `${email} részére a Krones meghívó újra kiküldve.` });
        const listRes = await fetch("/api/krones-invites/list", { cache: "no-store" });
        if (listRes.ok) {
          const j2 = await listRes.json();
          if (j2?.success) {
            setKronesInvites(j2.users);
            setKronesInvitesMeta(j2.counts || {});
          }
        }
      }
    } catch {
      setToast({ type: "error", message: "Hálózati hiba a Krones meghívó újraküldése közben." });
    } finally {
      setKronesInviteResending(null);
    }
  }

  // EnterAir handlers
  async function handleSendEnterairInvite() {
    const recipients = enterairInviteRecipients
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

    let enterairPartnerBase = PARTNER_PORTAL_BASE_URL;
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.origin);
        if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
          url.port = "3001";
          enterairPartnerBase = url.origin;
        }
      } catch {
        // Marad a PARTNER_PORTAL_BASE_URL (production) alapertelmezes.
      }
    }

    setEnterairInviteSending(true);
    try {
      const res = await fetch("/api/enterair-invites/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients,
          requireTwoFactor: !!enterairInvite2FA,
          loginBaseUrl: enterairPartnerBase,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        const detailedError = json?.results?.find((r: any) => !r?.success)?.error;
        setToast({ type: "error", message: detailedError || json?.message || "Hiba történt a küldés közben." });
      } else {
        setToast({ type: "success", message: json.message || "EnterAir meghívók sikeresen elküldve." });
        setEnterairInviteRecipients("");
        setEnterairInvite2FA(false);
        const listRes = await fetch("/api/enterair-invites/list", { cache: "no-store" });
        if (listRes.ok) {
          const j2 = await listRes.json();
          if (j2?.success) {
            setEnterairInvites(j2.users);
            setEnterairInvitesMeta(j2.counts || {});
          }
        }
      }
    } catch {
      setToast({ type: "error", message: "Hálózati hiba a küldés közben." });
    } finally {
      setEnterairInviteSending(false);
    }
  }

  async function handleDeleteEnterairUser(id: string, email: string) {
    if (!window.confirm(`Biztosan törlöd a(z) ${email} felhasználót és az általa használt EnterAir hozzáférést?\n\nA művelet nem visszavonható.`)) {
      return;
    }
    setEnterairInviteDeleting(id);
    try {
      const res = await fetch("/api/enterair-invites/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setToast({ type: "error", message: json?.message || "Hiba történt a törlés közben." });
      } else {
        setToast({ type: "success", message: json.message || "EnterAir felhasználó törölve." });
        const listRes = await fetch("/api/enterair-invites/list", { cache: "no-store" });
        const listJson = await listRes.json().catch(() => null);
        if (listRes.ok && listJson?.success) {
          setEnterairInvites(listJson.users || []);
          setEnterairInvitesMeta(listJson.counts || enterairInvitesMeta);
        }
      }
    } catch {
      setToast({ type: "error", message: "Hálózati hiba törlés közben." });
    } finally {
      setEnterairInviteDeleting(null);
    }
  }

  async function handleResendEnterairInvite(id: string, email: string, requireTwoFactor: boolean) {
    let enterairPartnerBase = PARTNER_PORTAL_BASE_URL;
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.origin);
        if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
          url.port = "3001";
          enterairPartnerBase = url.origin;
        }
      } catch {
        // Marad a PARTNER_PORTAL_BASE_URL (production) alapertelmezes.
      }
    }

    setEnterairInviteResending(id);
    try {
      const res = await fetch("/api/enterair-invites/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: [email],
          requireTwoFactor,
          loginBaseUrl: enterairPartnerBase,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        const detailedError = json?.results?.find((r: any) => !r?.success)?.error;
        setToast({ type: "error", message: detailedError || json?.message || "Az EnterAir meghívó újraküldése nem sikerült." });
      } else {
        setToast({ type: "success", message: `${email} részére az EnterAir meghívó újra kiküldve.` });
        const listRes = await fetch("/api/enterair-invites/list", { cache: "no-store" });
        if (listRes.ok) {
          const j2 = await listRes.json();
          if (j2?.success) {
            setEnterairInvites(j2.users);
            setEnterairInvitesMeta(j2.counts || {});
          }
        }
      }
    } catch {
      setToast({ type: "error", message: "Hálózati hiba az EnterAir meghívó újraküldése közben." });
    } finally {
      setEnterairInviteResending(null);
    }
  }

  // Tama handlers
  async function handleSendTamaInvite() {
    const recipients = tamaInviteRecipients
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

    let tamaPartnerBase = PARTNER_PORTAL_BASE_URL;
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.origin);
        if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
          url.port = "3001";
          tamaPartnerBase = url.origin;
        }
      } catch {
        // Marad a PARTNER_PORTAL_BASE_URL (production) alapertelmezes.
      }
    }

    setTamaInviteSending(true);
    try {
      const res = await fetch("/api/tama-invites/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients,
          requireTwoFactor: !!tamaInvite2FA,
          loginBaseUrl: tamaPartnerBase,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        const detailedError = json?.results?.find((r: any) => !r?.success)?.error;
        setToast({ type: "error", message: detailedError || json?.message || "Hiba történt a küldés közben." });
      } else {
        setToast({ type: "success", message: json.message || "Tama meghívók sikeresen elküldve." });
        setTamaInviteRecipients("");
        setTamaInvite2FA(false);
        const listRes = await fetch("/api/tama-invites/list", { cache: "no-store" });
        if (listRes.ok) {
          const j2 = await listRes.json();
          if (j2?.success) {
            setTamaInvites(j2.users);
            setTamaInvitesMeta(j2.counts || {});
          }
        }
      }
    } catch {
      setToast({ type: "error", message: "Hálózati hiba a küldés közben." });
    } finally {
      setTamaInviteSending(false);
    }
  }

  async function handleDeleteTamaUser(id: string, email: string) {
    if (!window.confirm(`Biztosan törlöd a(z) ${email} felhasználót és az általa használt Tama hozzáférést?\n\nA művelet nem visszavonható.`)) {
      return;
    }
    setTamaInviteDeleting(id);
    try {
      const res = await fetch("/api/tama-invites/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setToast({ type: "error", message: json?.message || "Hiba történt a törlés közben." });
      } else {
        setToast({ type: "success", message: json.message || "Tama felhasználó törölve." });
        const listRes = await fetch("/api/tama-invites/list", { cache: "no-store" });
        const listJson = await listRes.json().catch(() => null);
        if (listRes.ok && listJson?.success) {
          setTamaInvites(listJson.users || []);
          setTamaInvitesMeta(listJson.counts || tamaInvitesMeta);
        }
      }
    } catch {
      setToast({ type: "error", message: "Hálózati hiba törlés közben." });
    } finally {
      setTamaInviteDeleting(null);
    }
  }

  async function handleResendTamaInvite(id: string, email: string, requireTwoFactor: boolean) {
    let tamaPartnerBase = PARTNER_PORTAL_BASE_URL;
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.origin);
        if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
          url.port = "3001";
          tamaPartnerBase = url.origin;
        }
      } catch {
        // Marad a PARTNER_PORTAL_BASE_URL (production) alapertelmezes.
      }
    }

    setTamaInviteResending(id);
    try {
      const res = await fetch("/api/tama-invites/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: [email],
          requireTwoFactor,
          loginBaseUrl: tamaPartnerBase,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        const detailedError = json?.results?.find((r: any) => !r?.success)?.error;
        setToast({ type: "error", message: detailedError || json?.message || "A Tama meghívó újraküldése nem sikerült." });
      } else {
        setToast({ type: "success", message: `${email} részére a Tama meghívó újra kiküldve.` });
        const listRes = await fetch("/api/tama-invites/list", { cache: "no-store" });
        if (listRes.ok) {
          const j2 = await listRes.json();
          if (j2?.success) {
            setTamaInvites(j2.users);
            setTamaInvitesMeta(j2.counts || {});
          }
        }
      }
    } catch {
      setToast({ type: "error", message: "Hálózati hiba a Tama meghívó újraküldése közben." });
    } finally {
      setTamaInviteResending(null);
    }
  }

  // NI handlers
  async function handleSendNiInvite() {
    const recipients = niInviteRecipients
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
    if (niInviteRole === "admin-ni" && recipients.length > 1) {
      setToast({ type: "error", message: "Admin NI foglaló jogosultsággal egyszerre csak egy címzettnek küldhetsz meghívót." });
      return;
    }
    if (niInviteRole === "admin-ni" && !niInviteRecipientName.trim()) {
      setToast({ type: "error", message: "Admin NI foglaló meghívásához add meg a meghívott nevét." });
      return;
    }

    let niPartnerBase = PARTNER_PORTAL_BASE_URL;
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.origin);
        if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
          url.port = "3001";
          niPartnerBase = url.origin;
        }
      } catch {
        // Marad a PARTNER_PORTAL_BASE_URL (production) alapertelmezes.
      }
    }

    setNiInviteSending(true);
    try {
      const res = await fetch("/api/ni-invites/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients,
          requireTwoFactor: !!niInvite2FA,
          loginBaseUrl: niPartnerBase,
          inviteRole: niInviteRole,
          recipientName: niInviteRole === "admin-ni" ? niInviteRecipientName.trim() : undefined,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        const detailedError = json?.results?.find((r: any) => !r?.success)?.error;
        setToast({ type: "error", message: detailedError || json?.message || "Hiba történt a küldés közben." });
      } else {
        setToast({ type: "success", message: json.message || "NI meghívók sikeresen elküldve." });
        setNiInviteRecipients("");
        setNiInvite2FA(false);
        setNiInviteRecipientName("");
        const listRes = await fetch("/api/ni-invites/list", { cache: "no-store" });
        if (listRes.ok) {
          const j2 = await listRes.json();
          if (j2?.success) {
            setNiInvites(j2.users);
            setNiInvitesMeta(j2.counts || {});
          }
        }
      }
    } catch {
      setToast({ type: "error", message: "Hálózati hiba a küldés közben." });
    } finally {
      setNiInviteSending(false);
    }
  }

  async function handleDeleteNiUser(id: string, email: string) {
    if (!window.confirm(`Biztosan törlöd a(z) ${email} felhasználót és az általa használt NI hozzáférést?\n\nA művelet nem visszavonható.`)) {
      return;
    }
    setNiInviteDeleting(id);
    try {
      const res = await fetch("/api/ni-invites/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setToast({ type: "error", message: json?.message || "Hiba történt a törlés közben." });
      } else {
        setToast({ type: "success", message: json.message || "NI felhasználó törölve." });
        const listRes = await fetch("/api/ni-invites/list", { cache: "no-store" });
        const listJson = await listRes.json().catch(() => null);
        if (listRes.ok && listJson?.success) {
          setNiInvites(listJson.users || []);
          setNiInvitesMeta(listJson.counts || niInvitesMeta);
        }
      }
    } catch {
      setToast({ type: "error", message: "Hálózati hiba törlés közben." });
    } finally {
      setNiInviteDeleting(null);
    }
  }

  async function handleResendNiInvite(
    id: string,
    email: string,
    requireTwoFactor: boolean,
    existingRole?: "admin-ni" | "normal",
    existingDisplayName?: string | null
  ) {
    let niPartnerBase = PARTNER_PORTAL_BASE_URL;
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.origin);
        if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
          url.port = "3001";
          niPartnerBase = url.origin;
        }
      } catch {
        // Marad a PARTNER_PORTAL_BASE_URL (production) alapertelmezes.
      }
    }

    setNiInviteResending(id);
    try {
      const res = await fetch("/api/ni-invites/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: [email],
          requireTwoFactor,
          loginBaseUrl: niPartnerBase,
          inviteRole: existingRole === "admin-ni" ? "admin-ni" : "normal",
          recipientName: existingRole === "admin-ni" ? existingDisplayName || undefined : undefined,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        const detailedError = json?.results?.find((r: any) => !r?.success)?.error;
        setToast({ type: "error", message: detailedError || json?.message || "Az NI meghívó újraküldése nem sikerült." });
      } else {
        setToast({ type: "success", message: `${email} részére az NI meghívó újra kiküldve.` });
        const listRes = await fetch("/api/ni-invites/list", { cache: "no-store" });
        if (listRes.ok) {
          const j2 = await listRes.json();
          if (j2?.success) {
            setNiInvites(j2.users);
            setNiInvitesMeta(j2.counts || {});
          }
        }
      }
    } catch {
      setToast({ type: "error", message: "Hálózati hiba az NI meghívó újraküldése közben." });
    } finally {
      setNiInviteResending(null);
    }
  }

  async function handleApproveNiInvite(email: string) {
    try {
      const res = await fetch("/api/ni-invites/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setToast({ type: "error", message: json?.message || "A meghívás jóváhagyása nem sikerült." });
        return;
      }
      setToast({ type: "success", message: `${email} meghívása jóváhagyva.` });
      const listRes = await fetch("/api/ni-invites/list", { cache: "no-store" });
      const listJson = await listRes.json().catch(() => null);
      if (listRes.ok && listJson?.success) {
        setNiInvites(listJson.users || []);
        setNiInvitesMeta(listJson.counts || {});
      }
    } catch {
      setToast({ type: "error", message: "Hálózati hiba jóváhagyás közben." });
    }
  }

  async function handleSendDriverInvite() {
    if (!driverInviteRecipients.trim()) {
      setToast({ type: "error", message: "Adj meg legalább egy email címet!" });
      return;
    }

    const recipients = driverInviteRecipients
      .split(/[,;\n]+/)
      .map((r) => r.trim())
      .filter(Boolean);

    if (recipients.length === 0) {
      setToast({ type: "error", message: "Nincs érvényes email cím." });
      return;
    }

    let driverBase = "";
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.origin);
        if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
          url.port = "3003";
        }
        driverBase = url.origin;
      } catch {
        driverBase = window.location.origin;
      }
    }

    setDriverInviteSending(true);
    try {
      const res = await fetch("/api/driver-invites/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients,
          loginBaseUrl: driverBase,
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setToast({ type: "error", message: json?.message || "Hiba a meghívó küldésekor." });
      } else {
        setToast({ type: "success", message: json.message || "Sikeres meghívó küldés." });
        setDriverInviteRecipients("");
        // Refresh driver list
        try {
          const listRes = await fetch("/api/driver-invites/list", { cache: "no-store" });
          if (listRes.ok) {
            const j2 = await listRes.json();
            if (j2?.success) {
              setDriverInvites(j2.users);
            }
          }
        } catch {}
      }
    } catch (err: any) {
      setToast({ type: "error", message: "Hálózati hiba történt." });
    } finally {
      setDriverInviteSending(false);
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

    let staffBase = DISPATCHER_PORTAL_BASE_URL;
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.origin);
        if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
          url.port = "3002";
          staffBase = url.origin;
        }
      } catch {}
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

  async function handleDeleteDriverUser(id: string, email: string) {
    if (!confirm(`Biztosan törlöd a következő sofőrt: ${email}?`)) return;
    setDriverInviteDeleting(id);
    try {
      const res = await fetch("/api/driver-invites/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setToast({ type: "error", message: json?.message || "Hiba történt a törlés közben." });
      } else {
        setToast({ type: "success", message: json.message || "Sofőr véglegesen törölve." });
        const listRes = await fetch("/api/driver-invites/list", { cache: "no-store" });
        const listJson = await listRes.json().catch(() => null);
        if (listRes.ok && listJson?.success) {
          setDriverInvites(listJson.users || []);
        }
      }
    } catch (err: any) {
      setToast({ type: "error", message: "Hálózati hiba történt." });
    } finally {
      setDriverInviteDeleting(null);
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
    setActivePartnerDraft((prev: any) => {
      if (!prev) return prev;
      const vehicles = [...prev.vehicles];
      vehicles[idx] = { ...vehicles[idx], ...patch };
      return { ...prev, vehicles };
    });
    if (activeTermsSubpage === "catl") {
      setCatlPricingDraft((prev: any) => {
        if (!prev) return prev;
        const vehicles = [...prev.vehicles];
        vehicles[idx] = { ...vehicles[idx], ...patch };
        return { ...prev, vehicles };
      });
    }
  }

  function addVehicle() {
    const newId = `vehicle_${Date.now()}`;
    const empty = {
      id: newId,
      name: "Új jármű",
      capacity: "0 utas",
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
    setActivePartnerDraft((prev: any) => prev ? { ...prev, vehicles: [...prev.vehicles, empty] } : prev);
    if (activeTermsSubpage === "catl") setCatlPricingDraft((prev: any) => prev ? { ...prev, vehicles: [...prev.vehicles, empty] } : prev);
  }

  function removeVehicle(idx: number) {
    setActivePartnerDraft((prev: any) => {
      if (!prev) return prev;
      const vehicles = prev.vehicles.filter((_: any, i: number) => i !== idx);
      return { ...prev, vehicles };
    });
    if (activeTermsSubpage === "catl") {
      setCatlPricingDraft((prev: any) => {
        if (!prev) return prev;
        const vehicles = prev.vehicles.filter((_: any, i: number) => i !== idx);
        return { ...prev, vehicles };
      });
    }
  }

  function updatePartnerMeta(mutator: (meta: any) => any) {
    setActivePartnerDraft((prev: any) => {
      if (!prev) return prev;
      const nextMeta = mutator(JSON.parse(JSON.stringify(prev.meta || {})));
      return { ...prev, meta: nextMeta };
    });
  }

  function updateNiRow(section: "standardTransfers" | "vipVClass" | "vipSClass", idx: number, patch: any) {
    updatePartnerMeta((meta) => {
      const rows = Array.isArray(meta?.[section]) ? [...meta[section]] : [];
      rows[idx] = { ...(rows[idx] || {}), ...patch };
      return { ...meta, [section]: rows };
    });
  }

  function addNiRow(section: "standardTransfers" | "vipVClass" | "vipSClass") {
    const emptyRow =
      section === "standardTransfers"
        ? {
            origin: "Uj indulasi pont",
            destination: "Uj erkezesi pont",
            oldNet: 0,
            currentNet: 0,
            grossOnePerson: 0,
            twoPersonNetTotal: 0,
            twoPersonNetPerPerson: 0,
            twoPersonGrossPerPerson: 0,
            threePersonNetTotal: 0,
            threePersonNetPerPerson: 0,
            threePersonGrossPerPerson: 0,
            fourPlusGrossPerPerson: 0,
          }
        : {
            origin: "Uj indulasi pont",
            destination: "Uj erkezesi pont",
            oldNet: 0,
            currentNet: 0,
            gross: 0,
          };

    updatePartnerMeta((meta) => {
      const rows = Array.isArray(meta?.[section]) ? [...meta[section]] : [];
      rows.push(emptyRow);
      return { ...meta, [section]: rows };
    });
  }

  function removeNiRow(section: "standardTransfers" | "vipVClass" | "vipSClass", idx: number) {
    updatePartnerMeta((meta) => {
      const rows = Array.isArray(meta?.[section]) ? meta[section].filter((_: any, rowIdx: number) => rowIdx !== idx) : [];
      return { ...meta, [section]: rows };
    });
  }

  async function handleSave() {
    const draft = activePartnerDraft;
    const key = activeTermsSubpage;
    if (!draft || key === "list") return;
    setLoading(true);
    try {
      const res = await fetch(`/api/partner-pricing?partnerKey=${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerName: draft.partnerName,
          isActive: draft.isActive,
          vehicles: draft.vehicles,
          terms: draft.terms,
          meta: draft.meta,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActivePartnerDraft(data.data);
        if (key === "catl") setCatlPricingDraft(data.data);
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
    const key = activeTermsSubpage;
    if (key === "list") return;
    (async () => {
      try {
        const res = await fetch(`/api/partner-pricing?partnerKey=${key}`, { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (json?.success && json.data) {
            setActivePartnerDraft(json.data);
            if (key === "catl") setCatlPricingDraft(json.data);
          }
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

  const featuredClients: Array<{
    key: string;
    name: string;
    shortLabel: string;
    color: string;
    colorSecondary: string;
    tag: string;
    description: string;
    portalPath: string;
    accessLabel: string;
    isLive: boolean;
    onAccess?: () => void;
  }> = [
    {
      key: "catl",
      name: "CATL Hungary Kft.",
      shortLabel: "CATL",
      color: "#0047BA",
      colorSecondary: "#00B4D8",
      tag: "Enterprise",
      description: "Hivatalos delegációs és dolgozói transzferek. Speciális árazás és feltételek.",
      portalPath: "/catl",
      accessLabel: "CATL Meghívások",
      isLive: true,
      onAccess: () => setActive("catl-invites"),
    },
    {
      key: "ecopro",
      name: "EcoPro Global",
      shortLabel: "EP",
      color: "#00B4D8",
      colorSecondary: "#0096B4",
      tag: "Ipari",
      description: "Debrecen-Budapest és repülőtéri transzferek vállalati kezelőfelülete.",
      portalPath: "/ecopro",
        accessLabel: "EcoPro Meghívások",
        isLive: true,
        onAccess: () => setActive("ecopro-invites"),
    },
    {
      key: "eccoino",
      name: "Eccoino",
      shortLabel: "EC",
      color: "#60B8FF",
      colorSecondary: "#3A9FEE",
      tag: "Nemzetközi",
      description: "Nemzetközi Wien útvonalak és partnerfoglalások előkészített felülete.",
      portalPath: "/eccoino",
      accessLabel: "Eccoino Meghívások",
      isLive: true,
      onAccess: () => setActive("eccoino-invites"),
    },
    {
      key: "vitesco",
      name: "Vitesco Technologies",
      shortLabel: "VT",
      color: "#E30613",
      colorSecondary: "#B80010",
      tag: "Autóipar",
      description: "Debrecen-Budapest vállalati transzferek és partnerbeállítások felülete.",
      portalPath: "/vitesco",
      accessLabel: "Vitesco Meghívások",
      isLive: true,
      onAccess: () => setActive("vitesco-invites"),
    },
    {
      key: "schaeffler",
      name: "Schaeffler",
      shortLabel: "SCH",
      color: "#009A44",
      colorSecondary: "#007A35",
      tag: "Autóipar",
      description: "Schaeffler céges fuvarok és delegációs igények kezelőnézete.",
      portalPath: "/schaeffler",
      accessLabel: "Schaeffler Meghívások",
      isLive: true,
      onAccess: () => setActive("schaeffler-invites"),
    },
    {
      key: "krones",
      name: "Krones AG",
      shortLabel: "KR",
      color: "#003F8A",
      colorSecondary: "#002D6A",
      tag: "Gyártás",
      description: "Db-Db és Debrecen-Budapest vállalati transzferek dedikált felülete.",
      portalPath: "/krones",
      accessLabel: "Krones Meghívások",
      isLive: true,
      onAccess: () => setActive("krones-invites"),
    },
    {
      key: "enterair",
      name: "Enter Air",
      shortLabel: "EA",
      color: "#005BAA",
      colorSecondary: "#0078D4",
      tag: "Légi",
      description: "Euro alapú csoportos transzferek és partnerhozzáférések előnézete.",
      portalPath: "/enterair",
      accessLabel: "Enter Air Meghívások",
      isLive: true,
      onAccess: () => setActive("enterair-invites"),
    },
    {
      key: "tama",
      name: "Tama",
      shortLabel: "TM",
      color: "#5CA700",
      colorSecondary: "#438000",
      tag: "Logisztika",
      description: "Debrecen, Budapest és B.újfalu útvonalak partnerkártyás megjelenítése.",
      portalPath: "/tama",
      accessLabel: "Tama Meghívások",
      isLive: true,
      onAccess: () => setActive("tama-invites"),
    },
    {
      key: "ni",
      name: "NI",
      shortLabel: "NI",
      color: "#F5D000",
      colorSecondary: "#D8A800",
      tag: "Technológia",
      description: "Standard transzfer és VIP Mercedes tarifák vizuális partnerfelülete.",
      portalPath: "/ni",
      accessLabel: "NI Meghívások",
      isLive: true,
      onAccess: () => setActive("ni-invites"),
    },
  ];

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
                {featuredClients.map((client) => (
                  <div key={client.key} className="bg-white rounded-3xl p-1 border border-admin-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.05)] hover:shadow-[0_30px_80px_rgba(0,0,0,0.1)] transition-all duration-500 group relative overflow-hidden flex flex-col min-h-[340px]">
                    <div className="absolute inset-1 rounded-[22px] bg-gradient-to-b from-white to-admin-gray-50/50 -z-10" />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[2px] opacity-60 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(to right, transparent, ${client.color}, transparent)` }} />
                    <div className="absolute -top-24 -right-24 w-56 h-56 rounded-full blur-[40px] group-hover:scale-150 transition-transform duration-700 pointer-events-none" style={{ background: `linear-gradient(135deg, ${client.color}1A, ${client.colorSecondary}1A)` }} />

                    <div className="p-7 flex flex-col h-full relative z-10">
                      <div className="flex items-start justify-between mb-8">
                        <div className="w-16 h-16 rounded-[1.25rem] flex items-center justify-center shadow-lg relative" style={{ background: `linear-gradient(135deg, ${client.color}, ${client.colorSecondary})`, boxShadow: `0 10px 30px ${client.color}30` }}>
                          <div className="absolute inset-0 rounded-[1.25rem] bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <span className="text-white font-black text-base tracking-tighter relative z-10">{client.shortLabel}</span>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 border ${client.isLive ? "bg-green-50 text-green-600 border-green-100" : "bg-amber-50 text-amber-700 border-amber-100"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${client.isLive ? "bg-green-500 animate-pulse" : "bg-amber-500"}`} />
                            {client.isLive ? "Aktív" : "Előkészítés"}
                          </span>
                          <span className="text-[10px] font-bold text-admin-gray-400 tracking-wider uppercase">
                            {client.tag}
                          </span>
                        </div>
                      </div>

                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-admin-gray-900 mb-2">{client.name}</h3>
                        <p className="text-sm text-admin-gray-500 leading-relaxed mb-5">
                          {client.description}
                        </p>
                      </div>

                      <div className="mt-6 pt-6 border-t border-admin-gray-100/80">
                        <div className="flex items-center justify-between mb-6">
                          <span className="text-xs font-bold tracking-widest uppercase text-admin-gray-400">Portál elérés</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold transition-colors" style={{ color: client.color }}>{client.portalPath}</span>
                            <div className="w-6 h-6 rounded-full flex items-center justify-center transition-colors" style={{ backgroundColor: `${client.color}0D` }}>
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: client.color }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        <motion.button
                          onClick={() => client.onAccess?.()}
                          whileHover={client.isLive ? "hover" : undefined}
                          whileTap={client.isLive ? { scale: 0.97 } : undefined}
                          disabled={!client.isLive}
                          className={`relative w-full h-[68px] mb-6 rounded-2xl bg-white border overflow-hidden group/vip flex items-center justify-between px-5 transition-all duration-500 ${client.isLive ? "border-admin-gray-200 cursor-pointer" : "border-admin-gray-100 cursor-default opacity-90"}`}
                        >
                          {client.isLive && (
                            <>
                              <div className="absolute inset-0 opacity-0 group-hover/vip:opacity-100 transition-opacity duration-700 pointer-events-none">
                                <div className="absolute right-0 top-0 w-32 h-32 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2" style={{ background: `linear-gradient(to bottom left, ${client.color}1A, transparent)` }} />
                                <div className="absolute left-0 bottom-0 w-24 h-24 rounded-full blur-xl transform -translate-x-1/2 translate-y-1/2" style={{ background: `linear-gradient(to top right, ${client.colorSecondary}1A, transparent)` }} />
                              </div>
                              <motion.div
                                className="absolute top-0 bottom-0 w-[200%] skew-x-[-20deg]"
                                style={{ background: `linear-gradient(to right, transparent, ${client.color}08, transparent)` }}
                                variants={{ hover: { left: ["-100%", "100%"] } }}
                                initial={{ left: "-100%" }}
                                transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.5 }}
                              />
                            </>
                          )}

                          <div className="relative flex items-center gap-4 z-10">
                            <div className="w-12 h-12 rounded-[14px] bg-admin-gray-50 flex items-center justify-center">
                              <MailOpen className="w-5 h-5 text-admin-gray-700" />
                            </div>

                            <div className="flex flex-col text-left">
                              <span className="text-[10px] font-bold tracking-[0.2em] text-admin-gray-400 uppercase leading-none mb-1.5">
                                {client.isLive ? "Hozzáférések kezelése" : "Hamarosan"}
                              </span>
                              <span className="text-admin-gray-900 font-extrabold tracking-wide text-[16px] leading-none">
                                {client.isLive ? client.accessLabel : `${client.shortLabel} Felület`}
                              </span>
                            </div>
                          </div>

                          <div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-admin-gray-50 border border-admin-gray-100 shadow-sm">
                            <ArrowRight className="w-4.5 h-4.5 text-admin-gray-600" />
                          </div>
                        </motion.button>

                        <div className="flex gap-3 mt-4">
                          <button disabled={!client.isLive} className={`flex-1 py-3 rounded-xl text-xs font-bold tracking-wider uppercase transition-colors border shadow-sm ${client.isLive ? "bg-white hover:bg-admin-gray-50 text-admin-gray-900 border-admin-gray-200" : "bg-admin-gray-50 text-admin-gray-400 border-admin-gray-100 cursor-default"}`}>
                            Beállítások
                          </button>
                          <button disabled={!client.isLive} className={`flex-1 py-3 rounded-xl text-xs font-bold tracking-wider uppercase transition-colors ${client.isLive ? "bg-admin-gray-900 hover:bg-admin-black text-white shadow-[0_4px_14px_rgba(0,0,0,0.1)]" : "bg-admin-gray-100 text-admin-gray-400 cursor-default"}`}>
                            Foglalások
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : active.endsWith("-invites") && !["driver-invites", "staff-invites"].includes(active) ? (
            (() => {
              const partnerKey = active.replace("-invites", "");
              const configs: Record<string, any> = {
                catl: {
                  title: "CATL Meghívások", shortLabel: "CATL", description: "Kezelje a CATL portálhoz hozzáféréssel rendelkező felhasználókat és delegációkat.",
                  recipients: catlInviteRecipients, setRecipients: setCatlInviteRecipients,
                  twoFA: catlInvite2FA, setTwoFA: setCatlInvite2FA,
                  sending: catlInviteSending, deleting: catlInviteDeleting, resending: catlInviteResending,
                  loading: catlInvitesLoading, users: catlInvites, meta: catlInvitesMeta, display: displayCatlInvites,
                  handleSend: handleSendCatlInvite, handleDelete: handleDeleteCatlUser, handleResend: handleResendCatlInvite,
                  color: "#0047BA", secondaryColor: "#00B4D8", placeholder: "pelda@catl.hu, catl.ugyvezeto@hu.com; dolgozo@pannon.hu",
                },
                ecopro: {
                  title: "EcoPro Meghívások", shortLabel: "EcoPro", description: "Kezelje az EcoPro portálhoz hozzáféréssel rendelkező felhasználókat és delegációkat.",
                  recipients: ecoproInviteRecipients, setRecipients: setEcoproInviteRecipients,
                  twoFA: ecoproInvite2FA, setTwoFA: setEcoproInvite2FA,
                  sending: ecoproInviteSending, deleting: ecoproInviteDeleting, resending: ecoproInviteResending,
                  loading: ecoproInvitesLoading, users: ecoproInvites, meta: ecoproInvitesMeta, display: displayEcoproInvites,
                  handleSend: handleSendEcoproInvite, handleDelete: handleDeleteEcoproUser, handleResend: handleResendEcoproInvite,
                  color: "#00B4D8", secondaryColor: "#0096B4", placeholder: "partner@ecopro.hu, manager@ecopro.hu; dolgozo@pannon.hu",
                },
                eccoino: {
                  title: "Eccoino Meghívások", shortLabel: "Eccoino", description: "Kezelje az Eccoino portálhoz hozzáféréssel rendelkező felhasználókat.",
                  recipients: eccoinoInviteRecipients, setRecipients: setEccoinoInviteRecipients,
                  twoFA: eccoinoInvite2FA, setTwoFA: setEccoinoInvite2FA,
                  sending: eccoinoInviteSending, deleting: eccoinoInviteDeleting, resending: eccoinoInviteResending,
                  loading: eccoinoInvitesLoading, users: eccoinoInvites, meta: eccoinoInvitesMeta, display: displayEccoinoInvites,
                  handleSend: handleSendEccoinoInvite, handleDelete: handleDeleteEccoinoUser, handleResend: handleResendEccoinoInvite,
                  color: "#60B8FF", secondaryColor: "#3A9FEE", placeholder: "partner@eccoino.hu; dolgozo@pannon.hu",
                },
                vitesco: {
                  title: "Vitesco Meghívások", shortLabel: "Vitesco", description: "Kezelje a Vitesco portálhoz hozzáféréssel rendelkező felhasználókat.",
                  recipients: vitescoInviteRecipients, setRecipients: setVitescoInviteRecipients,
                  twoFA: vitescoInvite2FA, setTwoFA: setVitescoInvite2FA,
                  sending: vitescoInviteSending, deleting: vitescoInviteDeleting, resending: vitescoInviteResending,
                  loading: vitescoInvitesLoading, users: vitescoInvites, meta: vitescoInvitesMeta, display: displayVitescoInvites,
                  handleSend: handleSendVitescoInvite, handleDelete: handleDeleteVitescoUser, handleResend: handleResendVitescoInvite,
                  color: "#E30613", secondaryColor: "#B80010", placeholder: "partner@vitesco.hu; dolgozo@pannon.hu",
                },
                schaeffler: {
                  title: "Schaeffler Meghívások", shortLabel: "Schaeffler", description: "Kezelje a Schaeffler portálhoz hozzáféréssel rendelkező felhasználókat.",
                  recipients: schaefflerInviteRecipients, setRecipients: setSchaefflerInviteRecipients,
                  twoFA: schaefflerInvite2FA, setTwoFA: setSchaefflerInvite2FA,
                  sending: schaefflerInviteSending, deleting: schaefflerInviteDeleting, resending: schaefflerInviteResending,
                  loading: schaefflerInvitesLoading, users: schaefflerInvites, meta: schaefflerInvitesMeta, display: displaySchaefflerInvites,
                  handleSend: handleSendSchaefflerInvite, handleDelete: handleDeleteSchaefflerUser, handleResend: handleResendSchaefflerInvite,
                  color: "#009A44", secondaryColor: "#007A35", placeholder: "partner@schaeffler.hu; dolgozo@pannon.hu",
                },
                krones: {
                  title: "Krones Meghívások", shortLabel: "Krones", description: "Kezelje a Krones portálhoz hozzáféréssel rendelkező felhasználókat.",
                  recipients: kronesInviteRecipients, setRecipients: setKronesInviteRecipients,
                  twoFA: kronesInvite2FA, setTwoFA: setKronesInvite2FA,
                  sending: kronesInviteSending, deleting: kronesInviteDeleting, resending: kronesInviteResending,
                  loading: kronesInvitesLoading, users: kronesInvites, meta: kronesInvitesMeta, display: displayKronesInvites,
                  handleSend: handleSendKronesInvite, handleDelete: handleDeleteKronesUser, handleResend: handleResendKronesInvite,
                  color: "#003F8A", secondaryColor: "#002D6A", placeholder: "partner@krones.hu; dolgozo@pannon.hu",
                },
                enterair: {
                  title: "Enter Air Meghívások", shortLabel: "Enter Air", description: "Kezelje az Enter Air portálhoz hozzáféréssel rendelkező felhasználókat.",
                  recipients: enterairInviteRecipients, setRecipients: setEnterairInviteRecipients,
                  twoFA: enterairInvite2FA, setTwoFA: setEnterairInvite2FA,
                  sending: enterairInviteSending, deleting: enterairInviteDeleting, resending: enterairInviteResending,
                  loading: enterairInvitesLoading, users: enterairInvites, meta: enterairInvitesMeta, display: displayEnterairInvites,
                  handleSend: handleSendEnterairInvite, handleDelete: handleDeleteEnterairUser, handleResend: handleResendEnterairInvite,
                  color: "#005BAA", secondaryColor: "#0078D4", placeholder: "partner@enterair.hu; dolgozo@pannon.hu",
                },
                tama: {
                  title: "Tama Meghívások", shortLabel: "Tama", description: "Kezelje a Tama portálhoz hozzáféréssel rendelkező felhasználókat.",
                  recipients: tamaInviteRecipients, setRecipients: setTamaInviteRecipients,
                  twoFA: tamaInvite2FA, setTwoFA: setTamaInvite2FA,
                  sending: tamaInviteSending, deleting: tamaInviteDeleting, resending: tamaInviteResending,
                  loading: tamaInvitesLoading, users: tamaInvites, meta: tamaInvitesMeta, display: displayTamaInvites,
                  handleSend: handleSendTamaInvite, handleDelete: handleDeleteTamaUser, handleResend: handleResendTamaInvite,
                  color: "#5CA700", secondaryColor: "#438000", placeholder: "partner@tama.hu; dolgozo@pannon.hu",
                },
                ni: {
                  title: "NI Meghívások", shortLabel: "NI", description: "Kezelje az NI portálhoz hozzáféréssel rendelkező felhasználókat.",
                  recipients: niInviteRecipients, setRecipients: setNiInviteRecipients,
                  twoFA: niInvite2FA, setTwoFA: setNiInvite2FA,
                  sending: niInviteSending, deleting: niInviteDeleting, resending: niInviteResending,
                  loading: niInvitesLoading, users: niInvites, meta: niInvitesMeta, display: displayNiInvites,
                  handleSend: handleSendNiInvite, handleDelete: handleDeleteNiUser, handleResend: handleResendNiInvite,
                  color: "#F5D000", secondaryColor: "#D8A800", placeholder: "partner@ni.hu; dolgozo@pannon.hu",
                },
              };

              const conf = configs[partnerKey] || configs.catl;

              const invitePortalKey = partnerKey;
              const inviteTitle = conf.title;
              const inviteShortLabel = conf.shortLabel;
              const inviteDescription = conf.description;
              const inviteRecipients = conf.recipients;
              const setInviteRecipients = conf.setRecipients;
              const invite2FA = conf.twoFA;
              const setInvite2FA = conf.setTwoFA;
              const inviteSending = conf.sending;
              const inviteDeleting = conf.deleting;
              const inviteResending = conf.resending;
              const inviteLoading = conf.loading;
              const inviteUsers = conf.users;
              const handleSendInvite = conf.handleSend;
              const handleDeleteInviteUser = conf.handleDelete;
              const handleResendInviteUser = conf.handleResend;
              const inviteColor = conf.color;
              const inviteSecondaryColor = conf.secondaryColor;
              const inviteCheckboxId = `${partnerKey}-2fa-flag`;
              const invitePlaceholder = conf.placeholder;

              const derivedInviteMeta = (() => {
                const isLoading = conf.loading;
                const displayList = conf.display || [];
                const metaObj = conf.meta;
                if (isLoading || displayList.length === 0) {
                  if (isLoading) {
                    return { total: null, activated: null, pending: null, require2fa: null };
                  }
                  return {
                    total: metaObj?.total ?? 0,
                    activated: metaObj?.activated ?? 0,
                    pending: metaObj?.pending ?? 0,
                    require2fa: metaObj?.require2fa ?? 0,
                  };
                }
                const total = displayList.length;
                let activated = 0;
                let pending = 0;
                let require2fa = 0;
                for (const u of displayList) {
                  if (u?.requireTwoFactor) require2fa++;
                  if (u?.isActivated) activated++;
                  else pending++;
                }
                return { total, activated, pending, require2fa };
              })();

              const invitePortalUrl = (() => {
                if (typeof window === "undefined") return `${PARTNER_PORTAL_BASE_URL}/${invitePortalKey}`;
                try {
                  const u = new URL(window.location.origin);
                  if (u.hostname === "localhost" || u.hostname === "127.0.0.1") {
                    u.port = "3001";
                    return `${u.origin}/${invitePortalKey}`;
                  }
                  return `${PARTNER_PORTAL_BASE_URL}/${invitePortalKey}`;
                } catch {
                  return `${PARTNER_PORTAL_BASE_URL}/${invitePortalKey}`;
                }
              })();

              return <div className="max-w-7xl mx-auto w-full">
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
                    {inviteTitle}
                  </h2>
                  <p className="text-admin-gray-500 font-medium">
                    {inviteDescription}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white border border-admin-gray-200 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${inviteColor}1A` }}>
                      <Users className="w-6 h-6" style={{ color: inviteColor }} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-admin-gray-500">Összes profil</div>
                      <div className="text-2xl font-black text-admin-gray-900 mt-0.5">
                        {derivedInviteMeta.total === null ? "—" : (derivedInviteMeta.total ?? 0)}
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
                        {derivedInviteMeta.activated === null ? "—" : (derivedInviteMeta.activated ?? 0)}
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
                        {derivedInviteMeta.pending === null ? "—" : (derivedInviteMeta.pending ?? 0)}
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
                        {derivedInviteMeta.require2fa === null ? "—" : (derivedInviteMeta.require2fa ?? 0)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Invite Form */}
              <div className="bg-white border border-admin-gray-200 rounded-3xl p-8 shadow-sm mb-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center border" style={{ background: `linear-gradient(135deg, ${inviteColor}12, ${inviteSecondaryColor}16)`, borderColor: `${inviteColor}25` }}>
                    <MailOpen className="w-7 h-7" style={{ color: inviteColor }} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-admin-gray-900 font-serif mb-1">Új Meghívó Küldés</h3>
                    <p className="text-admin-gray-500 font-medium">
                      {`Küldj meghívót a ${inviteShortLabel} dedikált portál felhasználók számára.`}
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
                        {inviteRecipients.split(/[,;\n]/).map((s: string) => s.trim()).filter(Boolean).length} címzett
                      </span>
                    </div>
                    <textarea
                      value={inviteRecipients}
                      onChange={(e) => setInviteRecipients(e.target.value)}
                      rows={3}
                      placeholder={invitePlaceholder}
                      className="w-full px-5 py-4 bg-admin-gray-50 border border-admin-gray-200 rounded-2xl text-admin-gray-900 placeholder:text-admin-gray-400 font-medium transition-all resize-y min-h-[90px]"
                      style={{ outline: "none" }}
                    />
                    <p className="text-xs text-admin-gray-400 mt-2 pl-1">
                      Több email cím is megadható vesszővel (,) , pontosvesszővel (;) vagy új sorral elválasztva.
                    </p>
                  </div>

                  {partnerKey === "ni" && (
                    <div className="bg-admin-gray-50 border border-admin-gray-200 rounded-2xl p-5">
                      <label className="text-xs font-black tracking-[0.2em] uppercase text-admin-gray-500 mb-3 block">
                        Jogosultsági típus
                      </label>
                      <div className="p-4 rounded-2xl border-2 border-[#F5D000] bg-[#FFFBE6] mb-4">
                        <div className="font-bold text-admin-gray-900 mb-1">Admin NI foglaló</div>
                        <div className="text-xs text-admin-gray-500 leading-relaxed">
                          Az NI portálon egyéni/normál felhasználói fiók nem hozható létre — a munkatársak a céges
                          foglalási linken (bejelentkezés nélkül) foglalnak. Ez a meghívó egy admin fiókot hoz létre,
                          aki a céges foglalási linket tudja generálni és az összes céges foglalást áttekintheti.
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-black tracking-[0.2em] uppercase text-admin-gray-500 mb-2 block">
                          Meghívott neve
                        </label>
                        <input
                          type="text"
                          value={niInviteRecipientName}
                          onChange={(e) => setNiInviteRecipientName(e.target.value)}
                          placeholder="pl. Kovács János"
                          className="w-full px-5 py-3 bg-white border border-admin-gray-200 rounded-2xl text-admin-gray-900 placeholder:text-admin-gray-400 font-medium transition-all"
                          style={{ outline: "none" }}
                        />
                        <p className="text-xs text-admin-gray-400 mt-2 pl-1">
                          A meghívó csak egyetlen címzettnek küldhető egyszerre, a nevét a levél megszólításában is használjuk.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-admin-gray-50 border border-admin-gray-200 rounded-2xl p-5">
                      <label className="flex items-start gap-4 cursor-pointer group">
                        <div className="relative flex items-center mt-1">
                          <div className="relative">
                            <input
                              id={inviteCheckboxId}
                              type="checkbox"
                              checked={invite2FA}
                              onChange={(e) => setInvite2FA(e.target.checked)}
                              className="w-6 h-6 rounded-lg border-2 border-admin-gray-300 bg-white cursor-pointer appearance-none transition-colors"
                              style={{ accentColor: inviteColor }}
                            />
                            {invite2FA && (
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
                            htmlFor={inviteCheckboxId}
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
                          {invitePortalUrl}
                        </div>
                      </div>
                      <p className="text-xs text-admin-gray-400">
                        A meghívottak <strong>kizárólag</strong> az emailben küldött egyedi linken keresztül tudnak majd belépni.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-2">
                    <button
                      onClick={handleSendInvite}
                      disabled={inviteSending}
                      className="h-[56px] px-8 rounded-2xl text-white font-black text-sm tracking-widest uppercase hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center gap-3"
                      style={{ background: `linear-gradient(to right, ${inviteColor}, ${inviteSecondaryColor})`, boxShadow: `0 10px 30px ${inviteColor}40` }}
                    >
                      {inviteSending ? (
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
                {inviteLoading && (
                  <span className="text-sm text-admin-gray-400 font-medium animate-pulse">Betöltés...</span>
                )}
              </div>

              {inviteLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {[0, 1, 2].map((i) => (
                    <div key={`${invitePortalKey}-sk-${i}`} className="bg-white border border-admin-gray-200 rounded-3xl p-6 shadow-sm animate-pulse">
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
              ) : !inviteUsers || inviteUsers.length === 0 ? (
                <div className="py-20 flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 border" style={{ backgroundColor: `${inviteColor}0D`, borderColor: `${inviteColor}20` }}>
                    <MailOpen className="w-9 h-9" style={{ color: inviteColor }} />
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-admin-gray-900 mb-2">Még nincs meghívott felhasználó</h3>
                  <p className="text-admin-gray-500 font-medium max-w-md mb-8 leading-relaxed">
                    {`Küldj ki egyedi meghívót a ${inviteShortLabel} felhasználók számára az oldalon levő űrlapon keresztül — itt fognak megjelenni a lista elején amint elkészült a meghívás.`}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {inviteUsers.map((u: any, idx: number) => {
                    const monogram = (u.email.split("@")[0] || "U")
                      .split(/[._-]/)
                      .map((s: string) => s[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();
                    const activated = !!u.isActivated;
                    return (
                      <div
                        key={u.id || `${invitePortalKey}-${idx}`}
                        className="bg-white border border-admin-gray-200 rounded-3xl p-6 shadow-sm hover:shadow-[0_15px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-500 relative overflow-hidden"
                      >
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-[2px] opacity-40" style={{ background: `linear-gradient(to right, transparent, ${inviteColor}66, transparent)` }} />
                        <div className="flex items-start gap-4 mb-5">
                          <div className="w-14 h-14 rounded-2xl flex items-center justify-center border shadow-inner" style={{ background: `linear-gradient(135deg, ${inviteColor}26, ${inviteSecondaryColor}26)`, borderColor: `${inviteColor}20` }}>
                            <span className="font-black text-xl tracking-tight" style={{ color: inviteColor }}>
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
                                  {partnerKey === "ni" && u.role === "admin-ni" && (
                                    <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-full text-[10px] font-black tracking-widest uppercase">
                                      Admin NI foglaló
                                    </span>
                                  )}
                                  {partnerKey === "ni" && u.inviteStatus === "pending_approval" && (
                                    <button
                                      onClick={() => handleApproveNiInvite(u.email)}
                                      className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-[10px] font-black tracking-widest uppercase"
                                    >
                                      Jóváhagyás
                                    </button>
                                  )}
                                </div>
                                <div className="font-bold text-admin-gray-900 truncate text-base">
                                  {u.email.split("@")[0]}
                                </div>
                                {partnerKey === "ni" && u.displayName && (
                                  <div className="text-[11px] text-admin-gray-500 mt-1 truncate">
                                    Meghívott neve: {u.displayName}
                                  </div>
                                )}
                                {partnerKey === "ni" && u.invitedByEmail && (
                                  <div className="text-[11px] text-admin-gray-500 mt-1 truncate">
                                    Meghívta: {u.invitedByEmail}
                                  </div>
                                )}
                              </div>
                              {u.id && (
                                <button
                                  onClick={() => handleDeleteInviteUser(u.id as string, u.email)}
                                  disabled={inviteDeleting === u.id}
                                  title="Felhasználó és hozzáférés törlése"
                                  className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                                    inviteDeleting === u.id
                                      ? "bg-rose-100 text-rose-400 cursor-progress"
                                      : "text-admin-gray-400 hover:text-rose-600 hover:bg-rose-50 hover:border hover:border-rose-200"
                                  }`}
                                >
                                  <Trash2
                                    className={`w-4 h-4 ${inviteDeleting === u.id ? "animate-pulse" : ""}`}
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
                            <button
                              onClick={() => handleResendInviteUser(u.id as string, u.email, !!u.requireTwoFactor, u.role, u.displayName)}
                              disabled={inviteResending === u.id || inviteDeleting === u.id}
                              className="flex-1 h-11 bg-white border rounded-xl text-xs font-black tracking-wider uppercase transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                              style={{ borderColor: `${inviteColor}33`, color: inviteColor }}
                            >
                              {inviteResending === u.id ? "Küldés..." : activated ? "Új jelszó" : "Meghívás újra"}
                            </button>
                          </div>
                          {u.id && (
                            <button
                              onClick={() => handleDeleteInviteUser(u.id as string, u.email)}
                              disabled={inviteDeleting === u.id}
                              className={`w-full h-11 flex items-center justify-center gap-2 border rounded-xl text-xs font-black tracking-wider uppercase transition-colors ${
                                inviteDeleting === u.id
                                  ? "bg-rose-100 border-rose-200 text-rose-400 cursor-progress"
                                  : "bg-white border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300"
                              }`}
                            >
                              <Trash2 className={`w-4 h-4 ${inviteDeleting === u.id ? "animate-pulse" : ""}`} />
                              {inviteDeleting === u.id ? "Törlés..." : "Felhasználó törlése"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>;
            })()
          ) : active === "terms" ? (
            (() => {
              const PARTNER_CONFIGS: Record<string, { key: string; name: string; shortLabel: string; color: string; colorSecondary: string; textColor: string; description: string; currency: string; tag: string; }> = {
                catl: { key: "catl", name: "CATL Hungary Kft.", shortLabel: "CATL", color: "#0047BA", colorSecondary: "#00B4D8", textColor: "#0047BA", description: "Delegációs és dolgozói transzferekhez kötött egyedi vállalati szerződés.", currency: "HUF", tag: "Enterprise" },
                ecopro: { key: "ecopro", name: "EcoPro Global", shortLabel: "EP", color: "#00B4D8", colorSecondary: "#0096B4", textColor: "#006E8A", description: "Debrecen-Budapest és repülőtéri transzferek, 130%/150% módosítási feltételekkel.", currency: "HUF", tag: "Ipari" },
                eccoino: { key: "eccoino", name: "Eccoino", shortLabel: "EC", color: "#60B8FF", colorSecondary: "#3A9FEE", textColor: "#1A6FB8", description: "Debrecen-Wien és Budapest-Wien útvonalak, ÁFA nélküli árakkal.", currency: "HUF", tag: "Nemzetközi" },
                vitesco: { key: "vitesco", name: "Vitesco Technologies", shortLabel: "VT", color: "#E30613", colorSecondary: "#B80010", textColor: "#B80010", description: "Debrecen-Budapest nettó és bruttó vállalati transzferárak.", currency: "HUF", tag: "Autóipar" },
                schaeffler: { key: "schaeffler", name: "Schaeffler", shortLabel: "SCH", color: "#009A44", colorSecondary: "#007A35", textColor: "#007A35", description: "Debrecen-Budapest nettó és bruttó vállalati transzferárak.", currency: "HUF", tag: "Autóipar" },
                krones: { key: "krones", name: "Krones AG", shortLabel: "KR", color: "#003F8A", colorSecondary: "#002D6A", textColor: "#002D6A", description: "Db-Db és Debrecen-Budapest (utalás) vállalati szállítási árak.", currency: "HUF", tag: "Gyártás" },
                enterair: { key: "enterair", name: "Enter Air", shortLabel: "EA", color: "#005BAA", colorSecondary: "#0078D4", textColor: "#005BAA", description: "Csoportméret alapú Euro árak több útvonalra (Db-Nv, Db-Bp, Db-Db, Db-Kassa).", currency: "EUR", tag: "Légi" },
                tama: { key: "tama", name: "Tama", shortLabel: "TM", color: "#5CA700", colorSecondary: "#438000", textColor: "#3A6F00", description: "Debrecen-B.újfalu, Debrecen-Budapest, Budapest-B.újfalu útvonalak.", currency: "HUF", tag: "Logisztika" },
                ni: { key: "ni", name: "NI", shortLabel: "NI", color: "#F5D000", colorSecondary: "#D8A800", textColor: "#8A6A00", description: "Standard transzfer / fo, valamint VIP Mercedes V es S osztaly arak Debrecen, Nyiregyhaza es Miskolc indulassal.", currency: "HUF", tag: "Technologia" },
              };
              const PARTNER_ORDER = ["catl","ecopro","eccoino","vitesco","schaeffler","krones","enterair","tama","ni"];
              const activeCfg = activeTermsSubpage !== "list" ? PARTNER_CONFIGS[activeTermsSubpage] : null;
              const draft = activePartnerDraft;
              const primaryColor = activeCfg?.color || "#0047BA";
              const secondaryColor = activeCfg?.colorSecondary || "#00B4D8";
              const isEur = activeCfg?.currency === "EUR";
              const isNiPartner = activeCfg?.key === "ni";
              const niMeta = (draft?.meta || {}) as any;
              const formatPrice = (n: number) => isEur
                ? new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n)
                : formatHuf(n);
              return (
                <div className="max-w-7xl mx-auto w-full">
                  {activeTermsSubpage === "list" ? (
                    <>
                      <div className="mb-10">
                        <h2 className="font-serif text-3xl font-bold tracking-tight text-admin-gray-900 mb-2">Utazási feltételek</h2>
                        <p className="text-admin-gray-500 font-medium">Válasszon egy partnert a részletes árak és feltételek megtekintéséhez.</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {PARTNER_ORDER.map((key) => {
                          const cfg = PARTNER_CONFIGS[key];
                          return (
                            <button key={key} onClick={() => setActiveTermsSubpage(key as any)}
                              className="group text-left bg-white rounded-3xl p-1 border border-admin-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.05)] hover:shadow-[0_30px_80px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-500 relative overflow-hidden flex flex-col min-h-[320px]">
                              <div className="absolute inset-1 rounded-[22px] bg-gradient-to-b from-white to-admin-gray-50/50 -z-10" />
                              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[2px] opacity-60 group-hover:opacity-100 transition-opacity duration-500"
                                style={{ background: `linear-gradient(to right, transparent, ${cfg.color}, transparent)` }} />
                              <div className="p-7 flex flex-col h-full relative z-10">
                                <div className="flex items-start justify-between mb-6">
                                  <div className="w-16 h-16 rounded-[1.25rem] flex items-center justify-center shadow-lg relative"
                                    style={{ background: `linear-gradient(135deg, ${cfg.color}, ${cfg.colorSecondary})`, boxShadow: `0 10px 30px ${cfg.color}30` }}>
                                    <div className="absolute inset-0 rounded-[1.25rem] bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <span className="text-white font-black text-xs tracking-tighter relative z-10 px-1 text-center leading-tight">{cfg.shortLabel}</span>
                                  </div>
                                  <div className="flex flex-col items-end gap-2">
                                    <span className="px-3 py-1 bg-green-50 text-green-600 border border-green-100 rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />Aktív
                                    </span>
                                    <span className="text-[10px] font-bold text-admin-gray-400 tracking-wider uppercase">{cfg.tag}</span>
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-xl font-bold text-admin-gray-900 mb-1.5 group-hover:text-[--partner-color] transition-colors duration-300"
                                    style={{ "--partner-color": cfg.color } as React.CSSProperties}>{cfg.name}</h3>
                                  <p className="text-sm text-admin-gray-500 leading-relaxed mb-4">{cfg.description}</p>
                                  <span className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-lg border"
                                    style={{ color: cfg.textColor, borderColor: `${cfg.color}30`, backgroundColor: `${cfg.color}08` }}>
                                    {cfg.currency === "EUR" ? "€ Euro" : "Ft HUF"}
                                  </span>
                                </div>
                                <div className="mt-5 pt-5 border-t border-admin-gray-100/80 flex items-center justify-between">
                                  <span className="text-xs font-bold tracking-widest uppercase text-admin-gray-400">Részletek</span>
                                  <div className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300"
                                    style={{ backgroundColor: `${cfg.color}0D` }}>
                                    <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                                      style={{ color: cfg.color }}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  ) : activeCfg ? (
                    <>
                      <div className="mb-8">
                        <button onClick={() => { setActiveTermsSubpage("list"); setEditMode(false); }}
                          className="group inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-admin-gray-200 bg-white hover:bg-admin-gray-50 hover:border-admin-gray-300 text-admin-gray-700 hover:text-admin-gray-900 transition-all duration-300 shadow-sm mb-5">
                          <svg className="w-4 h-4 text-admin-gray-500 group-hover:-translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
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
                              <span className="text-admin-gray-900">{activeCfg.name}</span>
                            </div>
                            <h2 className="font-serif text-3xl font-bold tracking-tight text-admin-gray-900 mb-2">
                              {editMode ? `${activeCfg.name} — Szerkesztés` : `${activeCfg.name} utazási feltételek`}
                            </h2>
                            <p className="text-admin-gray-500 font-medium">
                              {editMode ? "Módosítsa az árakat és feltételeket. Mentés után az adatbázisban frissülnek." : `${activeCfg.name} vállalati árazásának és feltételeinek áttekintése.`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2.5 shrink-0">
                            {editMode ? (
                              <>
                                <button onClick={handleCancel} disabled={loading}
                                  className="px-5 py-3 rounded-xl border border-admin-gray-200 bg-white hover:bg-admin-gray-50 text-admin-gray-700 transition-all text-xs font-bold tracking-wider uppercase shadow-sm disabled:opacity-50">
                                  Mégse
                                </button>
                                <button onClick={handleSave} disabled={loading}
                                  className="px-6 py-3 rounded-xl text-white transition-all text-xs font-bold tracking-wider uppercase shadow-lg disabled:opacity-50 flex items-center gap-2"
                                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`, boxShadow: `0 4px 20px ${primaryColor}40` }}>
                                  {loading ? (
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
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
                              <button onClick={() => setEditMode(true)}
                                className="px-6 py-3 rounded-xl bg-gradient-to-br from-admin-gray-800 to-admin-gray-900 hover:from-admin-gray-900 hover:to-black text-white transition-all text-xs font-bold tracking-wider uppercase shadow-lg hover:shadow-xl flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                </svg>
                                Szerkesztés
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className={`bg-white rounded-3xl p-1 border shadow-[0_20px_60px_rgba(0,0,0,0.05)] relative overflow-hidden transition-all ${editMode ? "border-amber-200 ring-2 ring-amber-200/40" : "border-admin-gray-100"}`}>
                        <div className="absolute inset-1 rounded-[22px] bg-gradient-to-b from-white to-admin-gray-50/30 -z-10" />
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[2px] opacity-70"
                          style={{ background: `linear-gradient(to right, transparent, ${primaryColor}, transparent)` }} />
                        {editMode && (
                          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black tracking-widest uppercase shadow-lg flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            Szerkesztési mód aktív
                          </div>
                        )}
                        <div className="p-8 md:p-10 relative z-10">
                          {/* Header */}
                          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10 pb-8 border-b border-admin-gray-100">
                            <div className="flex items-center gap-5">
                              <div className="w-20 h-20 rounded-[1.5rem] flex items-center justify-center shadow-xl relative shrink-0"
                                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`, boxShadow: `0 12px 40px ${primaryColor}30` }}>
                                <div className="absolute inset-0 rounded-[1.5rem] bg-gradient-to-t from-white/10 to-transparent" />
                                <span className="text-white font-black text-base tracking-tighter relative z-10 px-1 text-center leading-tight">{activeCfg.shortLabel}</span>
                              </div>
                              <div>
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                  {editMode ? (
                                    <input type="text" value={draft?.partnerName || ""}
                                      onChange={(e) => setActivePartnerDraft((prev: any) => prev ? { ...prev, partnerName: e.target.value } : prev)}
                                      className="font-serif text-2xl font-bold tracking-tight text-admin-gray-900 bg-white border-2 border-amber-200 focus:border-amber-400 outline-none rounded-xl px-4 py-2 w-72 shadow-sm" />
                                  ) : (
                                    <h3 className="font-serif text-2xl font-bold tracking-tight text-admin-gray-900">{draft?.partnerName || activeCfg.name} szerződés</h3>
                                  )}
                                  {editMode ? (
                                    <label className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border-2 border-amber-200 text-[10px] font-black tracking-widest uppercase text-admin-gray-700 cursor-pointer hover:bg-amber-50 transition">
                                      <input type="checkbox" checked={!!draft?.isActive}
                                        onChange={(e) => setActivePartnerDraft((prev: any) => prev ? { ...prev, isActive: e.target.checked } : prev)}
                                        className="w-3.5 h-3.5 rounded accent-emerald-500" />
                                      Aktív
                                    </label>
                                  ) : (
                                    <span className={`px-3 py-1 border rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 ${draft?.isActive !== false ? "bg-green-50 text-green-600 border-green-100" : "bg-admin-gray-50 text-admin-gray-500 border-admin-gray-200"}`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${draft?.isActive !== false ? "bg-green-500 animate-pulse" : "bg-admin-gray-400"}`} />
                                      {draft?.isActive !== false ? "Aktív 2026" : "Inaktív"}
                                    </span>
                                  )}
                                </div>
                                <p className="text-admin-gray-500 font-medium max-w-xl">{activeCfg.description}</p>
                                {isEur && (
                                  <p className="mt-2 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5 inline-block">
                                    ⚡ Árak Euro-ban (EUR) értendők
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          {isNiPartner ? (
                            <div className="space-y-8">
                              <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 px-5 py-4">
                                <div className="flex items-start gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F5D000] to-[#D8A800] flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
                                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-admin-gray-900">NI artabla</h4>
                                    <p className="text-sm text-admin-gray-600">
                                      Standard transzfer per fo, valamint VIP Mercedes V es S osztaly. Minden ertek adatbazisba mentheto.
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="rounded-2xl border border-admin-gray-100 bg-white shadow-sm overflow-hidden">
                                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-admin-gray-100">
                                  <div>
                                    <h4 className="font-bold text-lg text-admin-gray-900">Standard transzfer (/ fo)</h4>
                                    <p className="text-sm text-admin-gray-500">1 fo, 2 fo, 3 fo es 4+ fo arak egy tablaban.</p>
                                  </div>
                                  {editMode && (
                                    <button
                                      onClick={() => addNiRow("standardTransfers")}
                                      className="px-4 py-2 rounded-xl border text-xs font-bold tracking-wider uppercase shadow-sm flex items-center gap-2 transition-all"
                                      style={{ borderColor: `${primaryColor}30`, color: activeCfg.textColor, backgroundColor: `${primaryColor}10` }}
                                    >
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                      </svg>
                                      Uj sor
                                    </button>
                                  )}
                                </div>
                                <div className="overflow-x-auto">
                                  <table className="min-w-[1480px] w-full text-sm">
                                    <thead style={{ backgroundColor: primaryColor }}>
                                      <tr className="text-white text-[10px] font-black tracking-widest uppercase">
                                        <th className="px-4 py-3 text-left">Indulas</th>
                                        <th className="px-4 py-3 text-left">Erkezes</th>
                                        <th className="px-4 py-3 text-right">Regi netto</th>
                                        <th className="px-4 py-3 text-right">Jelenlegi netto</th>
                                        <th className="px-4 py-3 text-right">Brutto 1 fo</th>
                                        <th className="px-4 py-3 text-right">2 fo netto ossz.</th>
                                        <th className="px-4 py-3 text-right">2 fo netto / fo</th>
                                        <th className="px-4 py-3 text-right">2 fo brutto / fo</th>
                                        <th className="px-4 py-3 text-right">3 fo netto ossz.</th>
                                        <th className="px-4 py-3 text-right">3 fo netto / fo</th>
                                        <th className="px-4 py-3 text-right">3 fo brutto / fo</th>
                                        <th className="px-4 py-3 text-right">4+ brutto / fo</th>
                                        {editMode && <th className="px-4 py-3 text-center">Del</th>}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {(niMeta.standardTransfers || []).map((row: any, idx: number) => (
                                        <tr key={`ni-standard-${idx}`} className={idx % 2 === 0 ? "bg-white" : "bg-admin-gray-50/40"}>
                                          <td className="px-4 py-3 min-w-[220px]">
                                            {editMode ? (
                                              <input type="text" value={row.origin || ""} onChange={(e) => updateNiRow("standardTransfers", idx, { origin: e.target.value })}
                                                className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm font-semibold text-admin-gray-800 outline-none focus:border-amber-400" />
                                            ) : (
                                              <span className="font-semibold text-admin-gray-900">{row.origin}</span>
                                            )}
                                          </td>
                                          <td className="px-4 py-3 min-w-[240px]">
                                            {editMode ? (
                                              <input type="text" value={row.destination || ""} onChange={(e) => updateNiRow("standardTransfers", idx, { destination: e.target.value })}
                                                className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm font-semibold text-admin-gray-800 outline-none focus:border-amber-400" />
                                            ) : (
                                              <span className="font-semibold text-admin-gray-700">{row.destination}</span>
                                            )}
                                          </td>
                                          {([
                                            "oldNet",
                                            "currentNet",
                                            "grossOnePerson",
                                            "twoPersonNetTotal",
                                            "twoPersonNetPerPerson",
                                            "twoPersonGrossPerPerson",
                                            "threePersonNetTotal",
                                            "threePersonNetPerPerson",
                                            "threePersonGrossPerPerson",
                                            "fourPlusGrossPerPerson",
                                          ] as const).map((field) => (
                                            <td key={field} className="px-4 py-3 text-right">
                                              {editMode ? (
                                                <input type="number" value={row[field] ?? 0} onChange={(e) => updateNiRow("standardTransfers", idx, { [field]: Number(e.target.value) || 0 })}
                                                  className="w-28 rounded-lg border border-amber-200 px-3 py-2 text-right text-sm font-mono font-bold text-admin-gray-800 outline-none focus:border-amber-400" />
                                              ) : (
                                                <span className={`font-mono font-bold ${field === "grossOnePerson" || field === "twoPersonGrossPerPerson" || field === "threePersonGrossPerPerson" || field === "fourPlusGrossPerPerson" ? "text-[#8A6A00]" : "text-admin-gray-800"}`}>
                                                  {formatHuf(row[field] ?? 0)}
                                                </span>
                                              )}
                                            </td>
                                          ))}
                                          {editMode && (
                                            <td className="px-4 py-3 text-center">
                                              <button onClick={() => removeNiRow("standardTransfers", idx)}
                                                className="w-10 h-10 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 inline-flex items-center justify-center transition-all">
                                                <Trash2 className="w-4 h-4" />
                                              </button>
                                            </td>
                                          )}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              {([
                                { key: "vipVClass", title: "VIP - Mercedes V Osztaly", subtitle: "VIP transzfer tarifa", accent: "from-amber-400 to-yellow-500" },
                                { key: "vipSClass", title: "VIP - Mercedes S Osztaly", subtitle: "VIP premium tarifa", accent: "from-yellow-500 to-amber-600" },
                              ] as const).map((section) => (
                                <div key={section.key} className="rounded-2xl border border-admin-gray-100 bg-white shadow-sm overflow-hidden">
                                  <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-admin-gray-100">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${section.accent} flex items-center justify-center shadow-md shadow-amber-500/20`}>
                                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                                        </svg>
                                      </div>
                                      <div>
                                        <h4 className="font-bold text-lg text-admin-gray-900">{section.title}</h4>
                                        <p className="text-sm text-admin-gray-500">{section.subtitle}</p>
                                      </div>
                                    </div>
                                    {editMode && (
                                      <button
                                        onClick={() => addNiRow(section.key)}
                                        className="px-4 py-2 rounded-xl border text-xs font-bold tracking-wider uppercase shadow-sm flex items-center gap-2 transition-all"
                                        style={{ borderColor: `${primaryColor}30`, color: activeCfg.textColor, backgroundColor: `${primaryColor}10` }}
                                      >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                        </svg>
                                        Uj sor
                                      </button>
                                    )}
                                  </div>
                                  <div className="overflow-x-auto">
                                    <table className="min-w-[860px] w-full text-sm">
                                      <thead style={{ backgroundColor: primaryColor }}>
                                        <tr className="text-white text-[10px] font-black tracking-widest uppercase">
                                          <th className="px-4 py-3 text-left">Indulas</th>
                                          <th className="px-4 py-3 text-left">Erkezes</th>
                                          <th className="px-4 py-3 text-right">Regi netto</th>
                                          <th className="px-4 py-3 text-right">Jelenlegi netto</th>
                                          <th className="px-4 py-3 text-right">Brutto</th>
                                          {editMode && <th className="px-4 py-3 text-center">Del</th>}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {(niMeta[section.key] || []).map((row: any, idx: number) => (
                                          <tr key={`${section.key}-${idx}`} className={idx % 2 === 0 ? "bg-white" : "bg-admin-gray-50/40"}>
                                            <td className="px-4 py-3 min-w-[220px]">
                                              {editMode ? (
                                                <input type="text" value={row.origin || ""} onChange={(e) => updateNiRow(section.key, idx, { origin: e.target.value })}
                                                  className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm font-semibold text-admin-gray-800 outline-none focus:border-amber-400" />
                                              ) : (
                                                <span className="font-semibold text-admin-gray-900">{row.origin}</span>
                                              )}
                                            </td>
                                            <td className="px-4 py-3 min-w-[240px]">
                                              {editMode ? (
                                                <input type="text" value={row.destination || ""} onChange={(e) => updateNiRow(section.key, idx, { destination: e.target.value })}
                                                  className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm font-semibold text-admin-gray-800 outline-none focus:border-amber-400" />
                                              ) : (
                                                <span className="font-semibold text-admin-gray-700">{row.destination}</span>
                                              )}
                                            </td>
                                            {(["oldNet", "currentNet", "gross"] as const).map((field) => (
                                              <td key={field} className="px-4 py-3 text-right">
                                                {editMode ? (
                                                  <input type="number" value={row[field] ?? 0} onChange={(e) => updateNiRow(section.key, idx, { [field]: Number(e.target.value) || 0 })}
                                                    className="w-32 rounded-lg border border-amber-200 px-3 py-2 text-right text-sm font-mono font-bold text-admin-gray-800 outline-none focus:border-amber-400" />
                                                ) : (
                                                  <span className={`font-mono font-bold ${field === "gross" ? "text-[#8A6A00]" : "text-admin-gray-800"}`}>
                                                    {formatHuf(row[field] ?? 0)}
                                                  </span>
                                                )}
                                              </td>
                                            ))}
                                            {editMode && (
                                              <td className="px-4 py-3 text-center">
                                                <button onClick={() => removeNiRow(section.key, idx)}
                                                  className="w-10 h-10 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 inline-flex items-center justify-center transition-all">
                                                  <Trash2 className="w-4 h-4" />
                                                </button>
                                              </td>
                                            )}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <>
                              {/* Vehicles */}
                              <div className="mb-10">
                                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
                                  <div className="flex items-center gap-3 flex-1">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md shrink-0"
                                      style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
                                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                                      </svg>
                                    </div>
                                    <h4 className="font-bold text-lg tracking-tight text-admin-gray-900">Jarmukategoriak es arak</h4>
                                    <div className="hidden md:block flex-1 h-px bg-gradient-to-r from-admin-gray-200 to-transparent" />
                                  </div>
                                  {editMode && (
                                    <button onClick={addVehicle}
                                      className="px-4 py-2 rounded-xl border text-xs font-bold tracking-wider uppercase shadow-sm flex items-center gap-2 transition-all"
                                      style={{ borderColor: `${primaryColor}30`, color: primaryColor, backgroundColor: `${primaryColor}08` }}>
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                      </svg>
                                      Uj jarmu
                                    </button>
                                  )}
                                </div>
                                {activePartnerLoading ? (
                                  <div className="h-40 rounded-2xl border border-admin-gray-100 flex items-center justify-center">
                                    <svg className="w-7 h-7 animate-spin" fill="none" viewBox="0 0 24 24" style={{ color: primaryColor }}>
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                  </div>
                                ) : (
                                  <div className="overflow-x-auto rounded-2xl border border-admin-gray-100 shadow-sm">
                                    <div className={`grid text-white px-5 py-4 text-[10px] font-black tracking-widest uppercase min-w-[860px] ${editMode ? "grid-cols-[2fr_1.2fr_1.2fr_1.2fr_1.8fr_0.6fr]" : "grid-cols-[2fr_1.2fr_1.2fr_1.2fr_1.8fr]"}`}
                                      style={{ backgroundColor: primaryColor }}>
                                      <div>Jarmu / ID / Kapacitas</div>
                                      <div className="text-right">Alap / BP</div>
                                      <div className="text-right">DB / Helyi</div>
                                      <div className="text-right">2026 Ar ({activeCfg.currency})</div>
                                      <div className="text-right">Modositas / Lemondas</div>
                                      {editMode && <div className="text-center">Del</div>}
                                    </div>
                                    {(draft?.vehicles || []).map((vehicle: any, idx: number) => (
                                      <div key={vehicle.id || idx}
                                        className={`grid px-5 py-4 text-sm min-w-[860px] ${editMode ? "grid-cols-[2fr_1.2fr_1.2fr_1.2fr_1.8fr_0.6fr]" : "grid-cols-[2fr_1.2fr_1.2fr_1.2fr_1.8fr]"} items-center ${idx % 2 === 0 ? "bg-white" : "bg-admin-gray-50/40"} ${idx !== (draft?.vehicles?.length || 1) - 1 ? "border-b border-admin-gray-100/70" : ""}`}>
                                        <div className="flex items-center gap-4 pr-3">
                                          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-md"
                                            style={{ background: `linear-gradient(135deg, ${primaryColor}CC, ${secondaryColor}CC)` }}>
                                            <span className="text-white font-black text-xs">{(vehicle.name?.substring(0,3) || "V").toUpperCase()}</span>
                                          </div>
                                          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                                            {editMode ? (
                                              <>
                                                <input type="text" value={vehicle.name} onChange={(e) => updateVehicle(idx, { name: e.target.value })}
                                                  className="w-full font-bold text-admin-gray-900 bg-white border border-amber-200 focus:border-amber-400 outline-none rounded-lg px-3 py-1.5 text-sm shadow-sm" />
                                                <div className="flex gap-2">
                                                  <input type="text" value={vehicle.id} onChange={(e) => updateVehicle(idx, { id: e.target.value })}
                                                    className="flex-1 text-[11px] font-mono font-semibold text-admin-gray-500 bg-admin-gray-50 border border-amber-200 focus:border-amber-400 outline-none rounded-md px-2.5 py-1" />
                                                  <input type="text" value={vehicle.capacity} onChange={(e) => updateVehicle(idx, { capacity: e.target.value })}
                                                    className="flex-1 text-[11px] font-semibold text-admin-gray-700 bg-admin-gray-50 border border-amber-200 focus:border-amber-400 outline-none rounded-md px-2.5 py-1" />
                                                </div>
                                              </>
                                            ) : (
                                              <>
                                                <span className="font-bold text-admin-gray-900 truncate">{vehicle.name}</span>
                                                <div className="flex gap-2 items-center flex-wrap">
                                                  <span className="px-2 py-0.5 rounded-md bg-admin-gray-100 text-admin-gray-500 font-mono font-bold text-[10px]">{vehicle.id}</span>
                                                  <span className="px-2.5 py-1 rounded-lg bg-admin-gray-100 text-admin-gray-700 font-semibold text-[11px]">{vehicle.capacity}</span>
                                                </div>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                        <div className="text-right pl-2">
                                          {editMode ? (
                                            <input type="number" value={vehicle.bpBudAirport ?? 0} onChange={(e) => updateVehicle(idx, { bpBudAirport: Number(e.target.value) || 0 })}
                                              className="w-full text-right font-mono font-bold text-admin-gray-800 bg-white border border-amber-200 focus:border-amber-400 outline-none rounded-lg px-3 py-2 text-[12px] shadow-sm" />
                                          ) : (
                                            <span className="font-mono font-semibold text-admin-gray-800 text-[13px]">{formatPrice(vehicle.bpBudAirport)}</span>
                                          )}
                                        </div>
                                        <div className="text-right pl-2">
                                          {editMode ? (
                                            <input type="number" value={vehicle.dbDbAirport ?? ""} placeholder="null"
                                              onChange={(e) => updateVehicle(idx, { dbDbAirport: e.target.value === "" ? null : Number(e.target.value) || null })}
                                              className="w-full text-right font-mono font-bold text-admin-gray-800 bg-white border border-amber-200 focus:border-amber-400 outline-none rounded-lg px-3 py-2 text-[12px] shadow-sm placeholder:text-admin-gray-400 placeholder:italic" />
                                          ) : (
                                            <div className="font-mono font-semibold text-[13px]">
                                              {vehicle.dbDbAirport != null ? <span className="text-admin-gray-800">{formatPrice(vehicle.dbDbAirport)}</span> : <span className="text-admin-gray-400 italic">-</span>}
                                            </div>
                                          )}
                                        </div>
                                        <div className="text-right pl-2">
                                          {editMode ? (
                                            <input type="number" value={vehicle.newPrice2026 ?? 0} onChange={(e) => updateVehicle(idx, { newPrice2026: Number(e.target.value) || 0 })}
                                              className="w-full text-right font-mono font-black bg-white border-2 focus:outline-none rounded-xl px-3 py-2 text-[13px] shadow-sm"
                                              style={{ borderColor: `${primaryColor}40`, color: primaryColor }} />
                                          ) : (
                                            <span className="inline-block px-3 py-1.5 rounded-xl font-black text-sm font-mono tracking-tight"
                                              style={{ backgroundColor: `${primaryColor}12`, border: `1px solid ${primaryColor}20`, color: primaryColor }}>
                                              {formatPrice(vehicle.newPrice2026)}
                                            </span>
                                          )}
                                        </div>
                                        <div className="pl-2 pr-1">
                                          {editMode ? (
                                            <div className="grid grid-cols-2 gap-1.5">
                                              {(["modification12to24h","modification0to12h","cancellation12to24h","cancellation0to12h"] as const).map((field) => (
                                                <input key={field} type="number" value={vehicle[field] ?? 0} onChange={(e) => updateVehicle(idx, { [field]: Number(e.target.value) || 0 })}
                                                  className="w-full text-right font-mono text-[11px] font-semibold text-admin-gray-700 bg-white border border-amber-200 focus:border-amber-400 outline-none rounded px-2 py-1 shadow-sm" />
                                              ))}
                                            </div>
                                          ) : (
                                            <div className="text-[10px] space-y-0.5">
                                              <div className="flex justify-between font-semibold"><span className="text-amber-700">Mod 12-24:</span><span className="font-mono">{formatPrice(vehicle.modification12to24h)}</span></div>
                                              <div className="flex justify-between font-semibold"><span className="text-rose-700">Mod 0-12:</span><span className="font-mono">{formatPrice(vehicle.modification0to12h)}</span></div>
                                              <div className="flex justify-between font-semibold"><span className="text-sky-700">Lem 12-24:</span><span className="font-mono">{formatPrice(vehicle.cancellation12to24h)}</span></div>
                                              <div className="flex justify-between font-semibold"><span className="text-indigo-700">Lem 0-12:</span><span className="font-mono">{formatPrice(vehicle.cancellation0to12h)}</span></div>
                                            </div>
                                          )}
                                        </div>
                                        {editMode && (
                                          <div className="flex items-center justify-center">
                                            <button onClick={() => removeVehicle(idx)}
                                              className="w-10 h-10 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 flex items-center justify-center transition-all group">
                                              <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                              </svg>
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Terms cards */}
                              <div className="mb-2">
                                <div className="flex items-center gap-3 mb-6">
                                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-500/20 shrink-0">
                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                    </svg>
                                  </div>
                                  <h4 className="font-bold text-lg tracking-tight text-admin-gray-900">Foglalasi feltetelek</h4>
                                  <div className="flex-1 h-px bg-gradient-to-r from-admin-gray-200 to-transparent" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                                  {([
                                    { key: "mod", sub: "12-24h", gradient: "from-amber-50 to-orange-50", border: "border-amber-100", badge: "from-amber-500 to-orange-600", shadow: "shadow-amber-500/30", text: "text-amber-700", textStrong: "text-amber-900", bFocus: "border-amber-200" },
                                    { key: "mod", sub: "0-12h", gradient: "from-rose-50 to-red-50", border: "border-rose-100", badge: "from-rose-500 to-red-600", shadow: "shadow-rose-500/30", text: "text-rose-700", textStrong: "text-rose-900", bFocus: "border-rose-200" },
                                    { key: "cancel", sub: "12-24h", gradient: "from-sky-50 to-blue-50", border: "border-sky-100", badge: "from-sky-500 to-blue-600", shadow: "shadow-sky-500/30", text: "text-sky-700", textStrong: "text-sky-900", bFocus: "border-sky-200" },
                                    { key: "cancel", sub: "0-12h", gradient: "from-indigo-50 to-violet-50", border: "border-indigo-100", badge: "from-indigo-500 to-violet-600", shadow: "shadow-indigo-500/30", text: "text-indigo-700", textStrong: "text-indigo-900", bFocus: "border-indigo-200" },
                                  ] as const).map((spec) => {
                                    const section = spec.key === "mod" ? "modification" : "cancellation";
                                    const subKey = spec.sub as "12-24h" | "0-12h";
                                    const value = (draft?.terms as any)?.[section]?.[subKey];
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
                                              <span className={`text-[10px] font-black tracking-widest uppercase ${spec.text}`}>{spec.sub}</span>
                                            </div>
                                            {editMode && <span className={`text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full bg-white border ${spec.border} ${spec.text}`}>EDIT</span>}
                                          </div>
                                          <div className="mb-2 flex items-baseline gap-2 flex-wrap">
                                            {editMode ? (
                                              <input type="number" value={value?.percentage ?? 0}
                                                onChange={(e) => {
                                                  const pct = Number(e.target.value) || 0;
                                                  setActivePartnerDraft((prev: any) => {
                                                    if (!prev) return prev;
                                                    const next = { ...prev, terms: JSON.parse(JSON.stringify(prev.terms || {})) };
                                                    if (!next.terms[section]) next.terms[section] = {};
                                                    if (!next.terms[section][subKey]) next.terms[section][subKey] = {};
                                                    next.terms[section][subKey].percentage = pct;
                                                    return next;
                                                  });
                                                }}
                                                className={`w-24 font-black bg-white border-2 focus:outline-none rounded-xl px-3 py-2 text-2xl shadow-sm ${spec.textStrong} ${spec.bFocus}`} />
                                            ) : (
                                              <span className={`text-3xl font-black ${spec.textStrong}`}>{value?.percentage ?? "-" }%</span>
                                            )}
                                          </div>
                                          <div className={`text-xs font-bold ${spec.text} mb-1 uppercase tracking-wider`}>
                                            {spec.key === "mod" ? "Modositas felar" : "Lemondas kotber"}
                                          </div>
                                          {editMode ? (
                                            <input type="text" value={value?.description ?? ""}
                                              onChange={(e) => {
                                                setActivePartnerDraft((prev: any) => {
                                                  if (!prev) return prev;
                                                  const next = { ...prev, terms: JSON.parse(JSON.stringify(prev.terms || {})) };
                                                  if (!next.terms[section]) next.terms[section] = {};
                                                  if (!next.terms[section][subKey]) next.terms[section][subKey] = {};
                                                  next.terms[section][subKey].description = e.target.value;
                                                  return next;
                                                });
                                              }}
                                              className={`w-full text-[11px] font-medium leading-relaxed bg-white border-2 ${spec.border} focus:outline-none rounded-lg px-2.5 py-1.5 ${spec.text}`} />
                                          ) : (
                                            <p className={`text-[11px] ${spec.text} font-medium leading-relaxed`}>{value?.description} az alaparbol</p>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              );
            })()
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
                            Küldj meghívót Adminisztrátornak vagy Diszpécsernek - a meghívott személyre szabott emailben kapja az aktiválási linket, és utána a Diszpécser Központban tud belépni.
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
                                    Teljes admin jogosultság a Pannon Diszpécser Központban. Foglalások, munkatársak és rendszer-szintű beállítások kezelése.
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
                                  // Ez mindig a különálló Diszpécser Központ (pannontransferkomplexxdiszpecheri.vercel.app)
                                  // saját domainjét mutatja, SOHA nem ennek a CRM admin oldalnak a saját domainjét,
                                  // mert a meghívottak oda lépnek be, nem ide.
                                  let base = DISPATCHER_PORTAL_BASE_URL;
                                  if (typeof window !== "undefined") {
                                    try {
                                      const u = new URL(window.location.origin);
                                      if (u.hostname === "localhost" || u.hostname === "127.0.0.1") {
                                        u.port = "3002";
                                        base = u.origin;
                                      }
                                    } catch {}
                                  }
                                  return `${base}/login`;
                                })()}
                              </div>
                            </div>
                            <p className="text-xs text-admin-gray-400">
                              A meghívottak <strong>kizárólag</strong> az emailben küldött egyedi linken keresztül tudják aktiválni a fiókjukat, utána a Diszpécser Központ <strong>/login</strong> oldalán tudnak belépni. Admin szerepkör esetén is a Diszpécser Központba lépnek be, csak magasabb jogosultsággal.
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
          ) : active === "driver-invites" ? (
            <div className="max-w-7xl mx-auto w-full">
              <div className="mb-10 flex flex-col md:flex-row md:items-start gap-5 md:justify-between">
                <div>
                  <h2 className="font-serif text-3xl font-bold tracking-tight text-admin-gray-900 mb-2">
                    Sofőrök meghívó
                  </h2>
                  <p className="text-admin-gray-500 font-medium">
                    Sofőrök meghívása a Pannon Transfer rendszerébe.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Bal oszlop - Form */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  <div className="bg-white rounded-3xl border border-admin-gray-200 shadow-sm p-6 overflow-hidden relative">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0056D2] to-[#003F9F]"></div>
                    <h3 className="text-lg font-black tracking-tight text-admin-gray-900 mb-5 flex items-center gap-2">
                      <MailOpen className="w-5 h-5 text-[#0056D2]" />
                      Új meghívó küldése
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-black tracking-wider text-admin-gray-600 uppercase mb-2">
                          Email címek (vesszővel elválasztva)
                        </label>
                        <textarea
                          value={driverInviteRecipients}
                          onChange={(e) => setDriverInviteRecipients(e.target.value)}
                          placeholder="sofor1@pelda.hu, sofor2@pelda.hu"
                          className="w-full bg-admin-gray-50 border-2 border-admin-gray-200 rounded-2xl p-4 text-sm font-medium text-admin-gray-900 focus:outline-none focus:border-[#0056D2] focus:bg-white transition-all placeholder:text-admin-gray-400 min-h-[120px] resize-y"
                        />
                      </div>

                      <button
                        onClick={handleSendDriverInvite}
                        disabled={driverInviteSending || !driverInviteRecipients.trim()}
                        className="w-full relative overflow-hidden group bg-[#0056D2] text-white rounded-2xl p-4 font-bold tracking-wider text-sm transition-all hover:bg-[#0047BA] shadow-lg shadow-[#0056D2]/25 hover:shadow-xl hover:shadow-[#0056D2]/40 disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none flex items-center justify-center gap-2"
                      >
                        {driverInviteSending ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>KÜLDÉS FOLYAMATBAN...</span>
                          </>
                        ) : (
                          <>
                            <MailOpen className="w-5 h-5" />
                            <span>MEGHÍVÓK KÜLDÉSE</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Jobb oszlop - Lista */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                  <div className="bg-white rounded-3xl border border-admin-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
                    <div className="p-6 border-b border-admin-gray-100 flex items-center justify-between bg-admin-gray-50/50">
                      <h3 className="text-lg font-black tracking-tight text-admin-gray-900 flex items-center gap-2">
                        <Users className="w-5 h-5 text-admin-gray-500" />
                        Meghívott sofőrök listája
                      </h3>
                    </div>

                    <div className="p-0 overflow-x-auto flex-1">
                      {driverInvitesLoading && (!driverInvites || driverInvites.length === 0) ? (
                        <div className="p-12 flex flex-col items-center justify-center text-admin-gray-400">
                          <div className="w-8 h-8 border-2 border-admin-gray-200 border-t-[#0056D2] rounded-full animate-spin mb-4"></div>
                          <span className="text-sm font-bold tracking-wider uppercase">Betöltés folyamatban...</span>
                        </div>
                      ) : !driverInvites || driverInvites.length === 0 ? (
                        <div className="p-16 flex flex-col items-center justify-center text-center">
                          <div className="w-16 h-16 rounded-2xl bg-admin-gray-50 border-2 border-admin-gray-100 flex items-center justify-center mb-4">
                            <Users className="w-8 h-8 text-admin-gray-300" />
                          </div>
                          <h4 className="text-admin-gray-900 font-bold text-lg mb-1">Nincsenek meghívott sofőrök</h4>
                          <p className="text-admin-gray-500 font-medium text-sm">Még nem küldtél meghívót egyetlen sofőrnek sem.</p>
                        </div>
                      ) : (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-admin-gray-50/80 text-admin-gray-500 text-[10px] uppercase tracking-widest font-black border-b border-admin-gray-200">
                              <th className="px-6 py-4">Fiók</th>
                              <th className="px-6 py-4">Státusz</th>
                              <th className="px-6 py-4 text-right">Műveletek</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-admin-gray-100">
                            {driverInvites.map((u: any, idx: number) => {
                              const activated = u.isActivated && u.hasPassword;
                              const isLocked = u.isLocked;
                              return (
                                <tr key={u._id || u.id || idx} className="hover:bg-admin-gray-50/50 transition-colors group">
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-admin-gray-100 flex items-center justify-center text-admin-gray-600 font-bold text-sm">
                                        {(u.name || u.email || "?")[0].toUpperCase()}
                                      </div>
                                      <div>
                                        <div className="font-bold text-admin-gray-900 text-sm">
                                          {u.name || u.email.split("@")[0]}
                                        </div>
                                        <div className="text-xs font-medium text-admin-gray-500">
                                          {u.email}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    {isLocked ? (
                                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200">
                                        Letiltva
                                      </span>
                                    ) : activated ? (
                                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200">
                                        Aktív
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-200">
                                        Függőben
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <button
                                      onClick={() => handleDeleteDriverUser(u._id || u.id, u.email)}
                                      disabled={driverInviteDeleting === (u._id || u.id)}
                                      className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-admin-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-all disabled:opacity-50"
                                      title="Törlés"
                                    >
                                      {driverInviteDeleting === (u._id || u.id) ? (
                                        <div className="w-4 h-4 border-2 border-rose-200 border-t-rose-600 rounded-full animate-spin"></div>
                                      ) : (
                                        <Trash2 className="w-4 h-4" />
                                      )}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              </div>
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
