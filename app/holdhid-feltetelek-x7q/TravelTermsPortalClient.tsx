"use client";

import { useEffect, useState } from "react";
import type { PartnerPricing, PricingVehicle, PricingTerms } from "@/lib/partner-pricing";
import {
  PARTNER_PORTAL_CONFIGS,
  PARTNER_PORTAL_ORDER,
  type PartnerPortalConfig,
} from "@/lib/partner-pricing-config";

interface Props {
  accessToken: string | null;
}

interface PortalResponse {
  success: boolean;
  partners?: PartnerPricing[];
  partnerConfigs?: Record<string, PartnerPortalConfig>;
  shareUrl?: string;
  message?: string;
}

const PARTNER_CONFIGS: Record<string, PartnerPortalConfig> = PARTNER_PORTAL_CONFIGS;
const PARTNER_ORDER = PARTNER_PORTAL_ORDER;

function formatHuf(n: number | null | undefined) {
  if (n == null) return "-";
  return new Intl.NumberFormat("hu-HU", { style: "currency", currency: "HUF", maximumFractionDigits: 0 }).format(n);
}

function formatEur(n: number | null | undefined) {
  if (n == null) return "-";
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

function createEmptyVehicle(): PricingVehicle {
  return {
    id: `uj-jarmu-${Date.now()}`,
    name: "Uj jarmu",
    capacity: "",
    bpBudAirport: 0,
    dbDbAirport: 0,
    newPrice2026: 0,
    modification12to24h: 0,
    modification0to12h: 0,
    cancellation12to24h: 0,
    cancellation0to12h: 0,
    extraWaitingPerHour: 0,
    dailyRate: 0,
  };
}

function createEmptyTerms(): PricingTerms {
  return {
    modification: {
      "12-24h": { percentage: 0, description: "" },
      "0-12h": { percentage: 0, description: "" },
    },
    cancellation: {
      "12-24h": { percentage: 0, description: "" },
      "0-12h": { percentage: 0, description: "" },
    },
  };
}

// Route-based pricing rows used by partners with a custom "meta.pricingModel"
// (currently NI), stored inside PartnerPricing.meta since they don't fit the
// generic vehicle-category table above.
interface RouteStandardPricingRow {
  origin: string;
  destination: string;
  oldNet?: number;
  currentNet?: number;
  grossOnePerson?: number;
  twoPersonNetTotal?: number;
  twoPersonNetPerPerson?: number;
  twoPersonGrossPerPerson?: number;
  threePersonNetTotal?: number;
  threePersonNetPerPerson?: number;
  threePersonGrossPerPerson?: number;
  fourPlusGrossPerPerson?: number;
}

interface RouteVipPricingRow {
  origin: string;
  destination: string;
  oldNet?: number;
  currentNet?: number;
  gross?: number;
}

export default function TravelTermsPortalClient({ accessToken }: Props) {
  const [partners, setPartners] = useState<PartnerPricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusText, setStatusText] = useState("Betoltes folyamatban...");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState<PartnerPricing | null>(null);
  const [createKey, setCreateKey] = useState("");
  const [createName, setCreateName] = useState("");
  const [creating, setCreating] = useState(false);

  const selectedPartner = partners.find((p) => p.partnerKey === selectedKey) || null;
  const activeCfg = selectedKey ? PARTNER_CONFIGS[selectedKey] || null : null;
  const primaryColor = activeCfg?.color || "#0047BA";
  const secondaryColor = activeCfg?.colorSecondary || "#00B4D8";
  const isEur = activeCfg?.currency === "EUR";

  function formatPrice(n: number | null | undefined) {
    return isEur ? formatEur(n) : formatHuf(n);
  }

  async function loadPortal() {
    setLoading(true);
    try {
      const res = await fetch("/api/travel-terms/partners", {
        headers: accessToken ? { "x-travel-terms-access": accessToken } : undefined,
        cache: "no-store",
      });
      const data = (await res.json()) as PortalResponse;
      if (!res.ok || !data.success) throw new Error(data.message || "Nem sikerult betolteni.");
      const nextPartners = data.partners || [];
      setPartners(nextPartners);
      setSelectedKey((cur) => (cur && nextPartners.some((p) => p.partnerKey === cur) ? cur : null));
      setStatusText("Partnerek betoltve.");
    } catch (e) {
      setStatusText(e instanceof Error ? e.message : "Hiba tortent.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadPortal(); }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    const events = new EventSource(
      `/api/travel-terms/partners/stream?kulcs=${encodeURIComponent(accessToken)}`
    );
    events.addEventListener("partners_snapshot", (e) => {
      const payload = JSON.parse((e as MessageEvent).data);
      if (payload.partners) {
        setPartners(payload.partners);
        setSelectedKey((cur) =>
          cur && payload.partners.some((p: PartnerPricing) => p.partnerKey === cur) ? cur : null
        );
      }
    });
    events.addEventListener("partner_pricing_updated", (e) => {
      const payload = JSON.parse((e as MessageEvent).data);
      if (payload.partners) setPartners(payload.partners);
    });
    events.addEventListener("partner_pricing_deleted", (e) => {
      const payload = JSON.parse((e as MessageEvent).data);
      if (payload.partners) setPartners(payload.partners);
    });
    events.onerror = () => setStatusText("Kapcsolat ujracsatlakozik...");
    return () => events.close();
  }, [accessToken]);

  function startEdit(partner: PartnerPricing) {
    setDraft(JSON.parse(JSON.stringify(partner)));
    setEditMode(true);
    setStatusText("Szerkesztesi mod aktiv.");
  }

  function cancelEdit() {
    setDraft(null);
    setEditMode(false);
    setStatusText("Szerkesztes megszakitva.");
  }

  function updateVehicle(idx: number, changes: Partial<PricingVehicle>) {
    setDraft((prev) => {
      if (!prev) return prev;
      const vehicles = prev.vehicles.map((v, i) => i === idx ? { ...v, ...changes } : v);
      return { ...prev, vehicles };
    });
  }

  function addVehicle() {
    setDraft((prev) => prev ? { ...prev, vehicles: [...prev.vehicles, createEmptyVehicle()] } : prev);
  }

  function removeVehicle(idx: number) {
    setDraft((prev) => prev ? { ...prev, vehicles: prev.vehicles.filter((_, i) => i !== idx) } : prev);
  }

  function updateTerms(section: keyof PricingTerms, sub: "12-24h" | "0-12h", key: "percentage" | "description", val: string | number) {
    setDraft((prev) => {
      if (!prev) return prev;
      const terms = JSON.parse(JSON.stringify(prev.terms || createEmptyTerms()));
      if (!terms[section]) terms[section] = {};
      if (!terms[section][sub]) terms[section][sub] = { percentage: 0, description: "" };
      terms[section][sub][key] = val;
      return { ...prev, terms };
    });
  }

  async function savePartner() {
    if (!draft) return;
    setSaving(true);
    setStatusText("Mentes folyamatban...");
    try {
      const res = await fetch(
        `/api/travel-terms/partners?partnerKey=${encodeURIComponent(draft.partnerKey)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { "x-travel-terms-access": accessToken } : {}),
          },
          body: JSON.stringify({
            partnerName: draft.partnerName,
            isActive: draft.isActive,
            vehicles: draft.vehicles,
            terms: draft.terms,
            meta: draft.meta || {},
          }),
        }
      );
      const data = (await res.json()) as PortalResponse & { partner?: PartnerPricing };
      if (!res.ok || !data.success) throw new Error(data.message || "Mentesi hiba.");
      if (data.partners) setPartners(data.partners);
      setDraft(null);
      setEditMode(false);
      setStatusText("Sikeresen mentve.");
    } catch (e) {
      setStatusText(e instanceof Error ? e.message : "Hiba tortent mentes kozben.");
    } finally {
      setSaving(false);
    }
  }

  async function createPartner() {
    if (!createKey.trim() || !createName.trim()) {
      setStatusText("Add meg a partner kulcsot es nevet.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/travel-terms/partners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { "x-travel-terms-access": accessToken } : {}),
        },
        body: JSON.stringify({
          partnerKey: createKey.trim().toLowerCase(),
          partnerName: createName.trim(),
          isActive: true,
          vehicles: [],
          terms: createEmptyTerms(),
          meta: {},
        }),
      });
      const data = (await res.json()) as PortalResponse & { partner?: PartnerPricing };
      if (!res.ok || !data.success) throw new Error(data.message || "Nem sikerult letrehozni.");
      if (data.partners) setPartners(data.partners);
      if (data.partner) setSelectedKey(data.partner.partnerKey);
      setCreateKey("");
      setCreateName("");
      setStatusText("Uj partner letrehozva.");
    } catch (e) {
      setStatusText(e instanceof Error ? e.message : "Hiba tortent.");
    } finally {
      setCreating(false);
    }
  }

  async function deletePartner() {
    if (!selectedPartner) return;
    if (!window.confirm(`${selectedPartner.partnerName} torlese - biztosan folytatod?`)) return;
    try {
      const res = await fetch(
        `/api/travel-terms/partners?partnerKey=${encodeURIComponent(selectedPartner.partnerKey)}`,
        {
          method: "DELETE",
          headers: accessToken ? { "x-travel-terms-access": accessToken } : undefined,
        }
      );
      const data = (await res.json()) as PortalResponse;
      if (!res.ok || !data.success) throw new Error(data.message || "Torlesi hiba.");
      const next = data.partners || [];
      setPartners(next);
      setSelectedKey(next[0]?.partnerKey || null);
      setDraft(null);
      setEditMode(false);
      setStatusText("Partner torolve.");
    } catch (e) {
      setStatusText(e instanceof Error ? e.message : "Torlesi hiba.");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center">
        <div className="bg-white rounded-3xl p-12 shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-black/5 text-center max-w-md w-full">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0047BA] to-[#00B4D8] flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-3">Pannon Transfer</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Utazasi feltetelek</h1>
          <p className="text-sm text-slate-500">{statusText}</p>
        </div>
      </div>
    );
  }

  const displayDraft = editMode && draft ? draft : selectedPartner;

  const routeStandardRows = (displayDraft?.meta?.standardTransfers as RouteStandardPricingRow[] | undefined) || [];
  const routeVipVRows = (displayDraft?.meta?.vipVClass as RouteVipPricingRow[] | undefined) || [];
  const routeVipSRows = (displayDraft?.meta?.vipSClass as RouteVipPricingRow[] | undefined) || [];
  const hasRouteBasedPricing = routeStandardRows.length > 0 || routeVipVRows.length > 0 || routeVipSRows.length > 0;

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">

        {/* Fejlec */}
        <div className="mb-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-1">Pannon Transfer</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Utazasi feltetelek</h1>
          <p className="mt-1 text-sm text-slate-500">Valasszon egy partnert a reszletes arak es feltetelek megtekinteshez es szerkeszteshez.</p>
          {statusText && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-600 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {statusText}
            </div>
          )}
        </div>

        {/* Fo tartalom */}
        {!selectedKey ? (
          <>
            {/* Partner kartya lista */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
              {PARTNER_ORDER.map((key) => {
                const partner = partners.find((p) => p.partnerKey === key);
                if (!partner) return null;
                const cfg = PARTNER_CONFIGS[key];
                if (!cfg) return null;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => { setSelectedKey(key); setEditMode(false); setDraft(null); }}
                    className="group text-left bg-white rounded-3xl p-1 border border-black/5 shadow-[0_20px_60px_rgba(0,0,0,0.05)] hover:shadow-[0_30px_80px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-500 relative overflow-hidden flex flex-col min-h-[300px]"
                  >
                    <div className="absolute inset-1 rounded-[22px] bg-gradient-to-b from-white to-slate-50/50 -z-10" />
                    <div
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[2px] opacity-60 group-hover:opacity-100 transition-opacity duration-500"
                      style={{ background: `linear-gradient(to right, transparent, ${cfg.color}, transparent)` }}
                    />
                    <div className="p-7 flex flex-col h-full relative z-10">
                      <div className="flex items-start justify-between mb-6">
                        <div
                          className="w-16 h-16 rounded-[1.25rem] flex items-center justify-center shadow-lg relative"
                          style={{
                            background: `linear-gradient(135deg, ${cfg.color}, ${cfg.colorSecondary})`,
                            boxShadow: `0 10px 30px ${cfg.color}30`,
                          }}
                        >
                          <div className="absolute inset-0 rounded-[1.25rem] bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <span className="text-white font-black text-xs tracking-tighter relative z-10 px-1 text-center leading-tight">{cfg.shortLabel}</span>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span
                            className={`px-3 py-1 border rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 ${partner.isActive ? "bg-green-50 text-green-600 border-green-100" : "bg-slate-100 text-slate-500 border-slate-200"}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${partner.isActive ? "bg-green-500 animate-pulse" : "bg-slate-400"}`} />
                            {partner.isActive ? "Aktiv" : "Inaktiv"}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">{cfg.tag}</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3
                          className="text-xl font-bold text-slate-900 mb-1.5 group-hover:transition-colors duration-300"
                          style={{ color: undefined }}
                        >
                          {partner.partnerName}
                        </h3>
                        <p className="text-sm text-slate-500 leading-relaxed mb-4">{cfg.description}</p>
                        <span
                          className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-lg border"
                          style={{ color: cfg.textColor, borderColor: `${cfg.color}30`, backgroundColor: `${cfg.color}08` }}
                        >
                          {cfg.currency === "EUR" ? "€ Euro" : "Ft HUF"}
                        </span>
                      </div>
                      <div className="mt-5 pt-5 border-t border-slate-100/80 flex items-center justify-between">
                        <span className="text-xs font-bold tracking-widest uppercase text-slate-400">Reszletek</span>
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300"
                          style={{ backgroundColor: `${cfg.color}0D` }}
                        >
                          <svg
                            className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300"
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                            style={{ color: cfg.color }}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Uj partner */}
            <div className="bg-white rounded-3xl border border-black/5 shadow-[0_20px_60px_rgba(0,0,0,0.04)] p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Uj partner hozzaadasa</h2>
              <div className="flex flex-wrap gap-3 items-end">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Partner kulcs</label>
                  <input
                    value={createKey}
                    onChange={(e) => setCreateKey(e.target.value)}
                    placeholder="pl: vitesco"
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400 w-48"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Partner neve</label>
                  <input
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="Partner Kft."
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400 w-52"
                  />
                </div>
                <button
                  type="button"
                  onClick={createPartner}
                  disabled={creating}
                  className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:bg-slate-300 flex items-center gap-2"
                >
                  {creating ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  )}
                  {creating ? "Letrehozas..." : "Uj partner letrehozasa"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Vissza + fejlec */}
            <div className="mb-8">
              <button
                type="button"
                onClick={() => { setSelectedKey(null); setEditMode(false); setDraft(null); }}
                className="group inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 transition-all duration-300 shadow-sm mb-5"
              >
                <svg className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                <span className="text-xs font-bold tracking-wider uppercase">Vissza az attekinteshez</span>
              </button>

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
                    <span>Utazasi feltetelek</span>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                    <span className="text-slate-900">{activeCfg?.name}</span>
                  </div>
                  <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
                    {editMode ? `${activeCfg?.name} — Szerkesztes` : `${activeCfg?.name} utazasi feltetelek`}
                  </h2>
                  <p className="text-slate-500 font-medium">
                    {editMode
                      ? "Modositsa az arakat es felteteleket. Mentes utan az adatbazisban frissulnek."
                      : `${activeCfg?.name} vallalati arazasanak es feltételeinek attekintese.`}
                  </p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  {editMode ? (
                    <>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={saving}
                        className="px-5 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all text-xs font-bold tracking-wider uppercase shadow-sm disabled:opacity-50"
                      >
                        Megse
                      </button>
                      <button
                        type="button"
                        onClick={savePartner}
                        disabled={saving}
                        className="px-6 py-3 rounded-xl text-white transition-all text-xs font-bold tracking-wider uppercase shadow-lg disabled:opacity-50 flex items-center gap-2"
                        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`, boxShadow: `0 4px 20px ${primaryColor}40` }}
                      >
                        {saving ? (
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                        {saving ? "Mentes..." : "Mentes az adatbazisba"}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => selectedPartner && startEdit(selectedPartner)}
                        className="px-6 py-3 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black text-white transition-all text-xs font-bold tracking-wider uppercase shadow-lg hover:shadow-xl flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                        Szerkesztes
                      </button>
                      <button
                        type="button"
                        onClick={deletePartner}
                        className="px-5 py-3 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 transition-all text-xs font-bold tracking-wider uppercase shadow-sm flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                        Torles
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Partner kártya */}
            <div className={`bg-white rounded-3xl p-1 border shadow-[0_20px_60px_rgba(0,0,0,0.05)] relative overflow-hidden transition-all ${editMode ? "border-amber-200 ring-2 ring-amber-200/40" : "border-black/5"}`}>
              <div className="absolute inset-1 rounded-[22px] bg-gradient-to-b from-white to-slate-50/30 -z-10" />
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[2px] opacity-70"
                style={{ background: `linear-gradient(to right, transparent, ${primaryColor}, transparent)` }}
              />
              {editMode && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black tracking-widest uppercase shadow-lg flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  Szerkesztesi mod aktiv
                </div>
              )}
              <div className="p-8 md:p-10 relative z-10">

                {/* Partner fejlec */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10 pb-8 border-b border-slate-100">
                  <div className="flex items-center gap-5">
                    <div
                      className="w-20 h-20 rounded-[1.5rem] flex items-center justify-center shadow-xl relative shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                        boxShadow: `0 12px 40px ${primaryColor}30`,
                      }}
                    >
                      <div className="absolute inset-0 rounded-[1.5rem] bg-gradient-to-t from-white/10 to-transparent" />
                      <span className="text-white font-black text-base tracking-tighter relative z-10 px-1 text-center leading-tight">{activeCfg?.shortLabel}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        {editMode && draft ? (
                          <input
                            type="text"
                            value={draft.partnerName}
                            onChange={(e) => setDraft((prev) => prev ? { ...prev, partnerName: e.target.value } : prev)}
                            className="text-2xl font-bold tracking-tight text-slate-900 bg-white border-2 border-amber-200 focus:border-amber-400 outline-none rounded-xl px-4 py-2 w-72 shadow-sm"
                          />
                        ) : (
                          <h3 className="text-2xl font-bold tracking-tight text-slate-900">{displayDraft?.partnerName || activeCfg?.name} szerzodes</h3>
                        )}
                        {editMode && draft ? (
                          <label className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border-2 border-amber-200 text-[10px] font-black tracking-widest uppercase text-slate-700 cursor-pointer hover:bg-amber-50 transition">
                            <input
                              type="checkbox"
                              checked={!!draft.isActive}
                              onChange={(e) => setDraft((prev) => prev ? { ...prev, isActive: e.target.checked } : prev)}
                              className="w-3.5 h-3.5 rounded accent-emerald-500"
                            />
                            Aktiv
                          </label>
                        ) : (
                          <span className={`px-3 py-1 border rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 ${displayDraft?.isActive !== false ? "bg-green-50 text-green-600 border-green-100" : "bg-slate-50 text-slate-500 border-slate-200"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${displayDraft?.isActive !== false ? "bg-green-500 animate-pulse" : "bg-slate-400"}`} />
                            {displayDraft?.isActive !== false ? "Aktiv 2026" : "Inaktiv"}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500 font-medium max-w-xl">{activeCfg?.description}</p>
                      {isEur && (
                        <p className="mt-2 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5 inline-block">
                          Arak Euro-ban (EUR) ertendok
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Jarmuvek */}
                <div className="mb-10">
                  <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md shrink-0"
                        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                      >
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                        </svg>
                      </div>
                      <h4 className="font-bold text-lg tracking-tight text-slate-900">Jarmukategoriak es arak</h4>
                      <div className="hidden md:block flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
                    </div>
                    {editMode && (
                      <button
                        type="button"
                        onClick={addVehicle}
                        className="px-4 py-2 rounded-xl border text-xs font-bold tracking-wider uppercase shadow-sm flex items-center gap-2 transition-all"
                        style={{ borderColor: `${primaryColor}30`, color: primaryColor, backgroundColor: `${primaryColor}08` }}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Uj jarmu
                      </button>
                    )}
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-sm">
                    <div
                      className={`grid text-white px-5 py-4 text-[10px] font-black tracking-widest uppercase min-w-[860px] ${editMode ? "grid-cols-[2fr_1.2fr_1.2fr_1.2fr_1.8fr_0.6fr]" : "grid-cols-[2fr_1.2fr_1.2fr_1.2fr_1.8fr]"}`}
                      style={{ backgroundColor: primaryColor }}
                    >
                      <div>Jarmu / ID / Kapacitas</div>
                      <div className="text-right">Alap / BP</div>
                      <div className="text-right">DB / Helyi</div>
                      <div className="text-right">2026 Ar ({activeCfg?.currency || "HUF"})</div>
                      <div className="text-right">Modositas / Lemondas</div>
                      {editMode && <div className="text-center">Del</div>}
                    </div>
                    {(displayDraft?.vehicles || []).map((vehicle, idx) => (
                      <div
                        key={vehicle.id || idx}
                        className={`grid px-5 py-4 text-sm min-w-[860px] ${editMode ? "grid-cols-[2fr_1.2fr_1.2fr_1.2fr_1.8fr_0.6fr]" : "grid-cols-[2fr_1.2fr_1.2fr_1.2fr_1.8fr]"} items-center ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"} ${idx !== (displayDraft?.vehicles?.length || 1) - 1 ? "border-b border-slate-100/70" : ""}`}
                      >
                        {/* Jarmu nev / id / kapacitas */}
                        <div className="flex items-center gap-4 pr-3">
                          <div
                            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-md"
                            style={{ background: `linear-gradient(135deg, ${primaryColor}CC, ${secondaryColor}CC)` }}
                          >
                            <span className="text-white font-black text-xs">{(vehicle.name?.substring(0, 3) || "V").toUpperCase()}</span>
                          </div>
                          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                            {editMode ? (
                              <>
                                <input
                                  type="text"
                                  value={vehicle.name}
                                  onChange={(e) => updateVehicle(idx, { name: e.target.value })}
                                  className="w-full font-bold text-slate-900 bg-white border border-amber-200 focus:border-amber-400 outline-none rounded-lg px-3 py-1.5 text-sm shadow-sm"
                                />
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={vehicle.id}
                                    onChange={(e) => updateVehicle(idx, { id: e.target.value })}
                                    className="flex-1 text-[11px] font-mono font-semibold text-slate-500 bg-slate-50 border border-amber-200 focus:border-amber-400 outline-none rounded-md px-2.5 py-1"
                                  />
                                  <input
                                    type="text"
                                    value={vehicle.capacity}
                                    onChange={(e) => updateVehicle(idx, { capacity: e.target.value })}
                                    className="flex-1 text-[11px] font-semibold text-slate-700 bg-slate-50 border border-amber-200 focus:border-amber-400 outline-none rounded-md px-2.5 py-1"
                                  />
                                </div>
                              </>
                            ) : (
                              <>
                                <span className="font-bold text-slate-900 truncate">{vehicle.name}</span>
                                <div className="flex gap-2 items-center flex-wrap">
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 font-mono font-bold text-[10px]">{vehicle.id}</span>
                                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[11px]">{vehicle.capacity}</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Alap / BP */}
                        <div className="text-right pl-2">
                          {editMode ? (
                            <input
                              type="number"
                              value={vehicle.bpBudAirport ?? 0}
                              onChange={(e) => updateVehicle(idx, { bpBudAirport: Number(e.target.value) || 0 })}
                              className="w-full text-right font-mono font-bold text-slate-800 bg-white border border-amber-200 focus:border-amber-400 outline-none rounded-lg px-3 py-2 text-[12px] shadow-sm"
                            />
                          ) : (
                            <span className="font-mono font-semibold text-slate-800 text-[13px]">{formatPrice(vehicle.bpBudAirport)}</span>
                          )}
                        </div>

                        {/* DB / Helyi */}
                        <div className="text-right pl-2">
                          {editMode ? (
                            <input
                              type="number"
                              value={vehicle.dbDbAirport ?? ""}
                              placeholder="null"
                              onChange={(e) => updateVehicle(idx, { dbDbAirport: e.target.value === "" ? null : Number(e.target.value) || null })}
                              className="w-full text-right font-mono font-bold text-slate-800 bg-white border border-amber-200 focus:border-amber-400 outline-none rounded-lg px-3 py-2 text-[12px] shadow-sm placeholder:text-slate-400 placeholder:italic"
                            />
                          ) : (
                            <div className="font-mono font-semibold text-[13px]">
                              {vehicle.dbDbAirport != null
                                ? <span className="text-slate-800">{formatPrice(vehicle.dbDbAirport)}</span>
                                : <span className="text-slate-400 italic">-</span>}
                            </div>
                          )}
                        </div>

                        {/* 2026 Ar */}
                        <div className="text-right pl-2">
                          {editMode ? (
                            <input
                              type="number"
                              value={vehicle.newPrice2026 ?? 0}
                              onChange={(e) => updateVehicle(idx, { newPrice2026: Number(e.target.value) || 0 })}
                              className="w-full text-right font-mono font-black bg-white border-2 focus:outline-none rounded-xl px-3 py-2 text-[13px] shadow-sm"
                              style={{ borderColor: `${primaryColor}40`, color: primaryColor }}
                            />
                          ) : (
                            <span
                              className="inline-block px-3 py-1.5 rounded-xl font-black text-sm font-mono tracking-tight"
                              style={{ backgroundColor: `${primaryColor}12`, border: `1px solid ${primaryColor}20`, color: primaryColor }}
                            >
                              {formatPrice(vehicle.newPrice2026)}
                            </span>
                          )}
                        </div>

                        {/* Modositas / Lemondas */}
                        <div className="pl-2 pr-1">
                          {editMode ? (
                            <div className="grid grid-cols-2 gap-1.5">
                              {(["modification12to24h", "modification0to12h", "cancellation12to24h", "cancellation0to12h"] as const).map((field) => (
                                <input
                                  key={field}
                                  type="number"
                                  value={vehicle[field] ?? 0}
                                  onChange={(e) => updateVehicle(idx, { [field]: Number(e.target.value) || 0 })}
                                  className="w-full text-right font-mono text-[11px] font-semibold text-slate-700 bg-white border border-amber-200 focus:border-amber-400 outline-none rounded px-2 py-1 shadow-sm"
                                />
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

                        {/* Torles gomb */}
                        {editMode && (
                          <div className="flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => removeVehicle(idx)}
                              className="w-10 h-10 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 flex items-center justify-center transition-all group"
                            >
                              <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    {(displayDraft?.vehicles || []).length === 0 && (
                      <div className="min-w-[860px] py-10 text-center text-sm text-slate-400">
                        Nincs jarmu hozzaadva. {editMode && "Kattints az \"Uj jarmu\" gombra."}
                      </div>
                    )}
                  </div>
                </div>

                {/* Utvonal alapu arazas (pl. NI standard + VIP Mercedes tablak) */}
                {hasRouteBasedPricing && (
                  <div className="mb-10 space-y-8">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md shrink-0"
                        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                      >
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503-9.502l4.997 2.497c.883.441 1.5 1.348 1.5 2.39v9.023c0 .375-.437.577-.706.365l-4.5-3.54a1.5 1.5 0 00-1.795 0l-3.909 3.075a1.5 1.5 0 01-1.795 0l-4.5-3.539c-.169-.13-.297-.34-.297-.565V6.35c0-1.25 1.36-2.032 2.454-1.412l4.697 2.674a.5.5 0 00.503-.011z" />
                        </svg>
                      </div>
                      <h4 className="font-bold text-lg tracking-tight text-slate-900">Utvonal alapu arazas</h4>
                      <div className="hidden md:block flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
                    </div>

                    {routeStandardRows.length > 0 && (
                      <div>
                        <h5 className="font-bold text-sm tracking-tight text-slate-800 mb-1">Standard transzfer (/ fo)</h5>
                        <p className="text-xs text-slate-500 mb-3">1 fo, 2 fo, 3 fo es 4+ fo arak egy tablaban.</p>
                        <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-sm">
                          <table className="w-full min-w-[1360px] text-sm border-collapse">
                            <thead>
                              <tr className="text-white text-[10px] font-black tracking-widest uppercase" style={{ backgroundColor: primaryColor }}>
                                <th className="text-left px-4 py-3">Indulas</th>
                                <th className="text-left px-4 py-3">Erkezes</th>
                                <th className="text-right px-4 py-3">Regi netto</th>
                                <th className="text-right px-4 py-3">Jelenlegi netto</th>
                                <th className="text-right px-4 py-3">Brutto 1 fo</th>
                                <th className="text-right px-4 py-3">2 fo netto ossz</th>
                                <th className="text-right px-4 py-3">2 fo netto / fo</th>
                                <th className="text-right px-4 py-3">2 fo brutto / fo</th>
                                <th className="text-right px-4 py-3">3 fo netto ossz</th>
                                <th className="text-right px-4 py-3">3 fo netto / fo</th>
                                <th className="text-right px-4 py-3">3 fo brutto / fo</th>
                                <th className="text-right px-4 py-3">4+ fo brutto / fo</th>
                              </tr>
                            </thead>
                            <tbody>
                              {routeStandardRows.map((row, idx) => (
                                <tr key={`${row.origin}-${row.destination}-${idx}`} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"}>
                                  <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{row.origin}</td>
                                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{row.destination}</td>
                                  <td className="px-4 py-3 text-right font-mono text-slate-500">{formatPrice(row.oldNet)}</td>
                                  <td className="px-4 py-3 text-right font-mono text-slate-500">{formatPrice(row.currentNet)}</td>
                                  <td className="px-4 py-3 text-right font-mono font-bold" style={{ color: primaryColor }}>{formatPrice(row.grossOnePerson)}</td>
                                  <td className="px-4 py-3 text-right font-mono text-slate-500">{formatPrice(row.twoPersonNetTotal)}</td>
                                  <td className="px-4 py-3 text-right font-mono text-slate-500">{formatPrice(row.twoPersonNetPerPerson)}</td>
                                  <td className="px-4 py-3 text-right font-mono font-bold" style={{ color: primaryColor }}>{formatPrice(row.twoPersonGrossPerPerson)}</td>
                                  <td className="px-4 py-3 text-right font-mono text-slate-500">{formatPrice(row.threePersonNetTotal)}</td>
                                  <td className="px-4 py-3 text-right font-mono text-slate-500">{formatPrice(row.threePersonNetPerPerson)}</td>
                                  <td className="px-4 py-3 text-right font-mono font-bold" style={{ color: primaryColor }}>{formatPrice(row.threePersonGrossPerPerson)}</td>
                                  <td className="px-4 py-3 text-right font-mono font-bold" style={{ color: primaryColor }}>{formatPrice(row.fourPlusGrossPerPerson)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {[
                      { rows: routeVipVRows, title: "VIP - Mercedes V Osztaly", subtitle: "VIP transzfer tarifa" },
                      { rows: routeVipSRows, title: "VIP - Mercedes S Osztaly", subtitle: "VIP premium tarifa" },
                    ].map(
                      (vip) =>
                        vip.rows.length > 0 && (
                          <div key={vip.title}>
                            <h5 className="font-bold text-sm tracking-tight text-slate-800 mb-1">{vip.title}</h5>
                            <p className="text-xs text-slate-500 mb-3">{vip.subtitle}</p>
                            <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-sm">
                              <table className="w-full min-w-[640px] text-sm border-collapse">
                                <thead>
                                  <tr className="text-white text-[10px] font-black tracking-widest uppercase" style={{ backgroundColor: primaryColor }}>
                                    <th className="text-left px-4 py-3">Indulas</th>
                                    <th className="text-left px-4 py-3">Erkezes</th>
                                    <th className="text-right px-4 py-3">Regi netto</th>
                                    <th className="text-right px-4 py-3">Jelenlegi netto</th>
                                    <th className="text-right px-4 py-3">Brutto</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {vip.rows.map((row, idx) => (
                                    <tr key={`${row.origin}-${row.destination}-${idx}`} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"}>
                                      <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{row.origin}</td>
                                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{row.destination}</td>
                                      <td className="px-4 py-3 text-right font-mono text-slate-500">{formatPrice(row.oldNet)}</td>
                                      <td className="px-4 py-3 text-right font-mono text-slate-500">{formatPrice(row.currentNet)}</td>
                                      <td className="px-4 py-3 text-right font-mono font-bold" style={{ color: primaryColor }}>{formatPrice(row.gross)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )
                    )}
                  </div>
                )}

                {/* Foglalasi feltetelek */}
                <div className="mb-2">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-500/20 shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                      </svg>
                    </div>
                    <h4 className="font-bold text-lg tracking-tight text-slate-900">Foglalasi feltetelek</h4>
                    <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                    {(
                      [
                        { key: "mod", sub: "12-24h", gradient: "from-amber-50 to-orange-50", border: "border-amber-100", badge: "from-amber-500 to-orange-600", shadow: "shadow-amber-500/30", text: "text-amber-700", textStrong: "text-amber-900", bFocus: "border-amber-200" },
                        { key: "mod", sub: "0-12h", gradient: "from-rose-50 to-red-50", border: "border-rose-100", badge: "from-rose-500 to-red-600", shadow: "shadow-rose-500/30", text: "text-rose-700", textStrong: "text-rose-900", bFocus: "border-rose-200" },
                        { key: "cancel", sub: "12-24h", gradient: "from-sky-50 to-blue-50", border: "border-sky-100", badge: "from-sky-500 to-blue-600", shadow: "shadow-sky-500/30", text: "text-sky-700", textStrong: "text-sky-900", bFocus: "border-sky-200" },
                        { key: "cancel", sub: "0-12h", gradient: "from-indigo-50 to-violet-50", border: "border-indigo-100", badge: "from-indigo-500 to-violet-600", shadow: "shadow-indigo-500/30", text: "text-indigo-700", textStrong: "text-indigo-900", bFocus: "border-indigo-200" },
                      ] as const
                    ).map((spec) => {
                      const section: keyof PricingTerms = spec.key === "mod" ? "modification" : "cancellation";
                      const subKey = spec.sub as "12-24h" | "0-12h";
                      const value = displayDraft?.terms?.[section]?.[subKey];
                      return (
                        <div
                          key={spec.key + spec.sub}
                          className={`rounded-2xl bg-gradient-to-br ${spec.gradient} border ${spec.border} p-6 relative overflow-hidden group hover:shadow-lg transition-all duration-300`}
                        >
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
                                <input
                                  type="number"
                                  value={value?.percentage ?? 0}
                                  onChange={(e) => updateTerms(section, subKey, "percentage", Number(e.target.value) || 0)}
                                  className={`w-24 font-black bg-white border-2 focus:outline-none rounded-xl px-3 py-2 text-2xl shadow-sm ${spec.textStrong} ${spec.bFocus}`}
                                />
                              ) : (
                                <span className={`text-3xl font-black ${spec.textStrong}`}>{value?.percentage ?? "-"}%</span>
                              )}
                            </div>
                            <div className={`text-xs font-bold ${spec.text} mb-1 uppercase tracking-wider`}>
                              {spec.key === "mod" ? "Modositas felar" : "Lemondas kotber"}
                            </div>
                            {editMode ? (
                              <input
                                type="text"
                                value={value?.description ?? ""}
                                onChange={(e) => updateTerms(section, subKey, "description", e.target.value)}
                                className={`w-full text-[11px] font-medium leading-relaxed bg-white border-2 ${spec.border} focus:outline-none rounded-lg px-2.5 py-1.5 ${spec.text}`}
                              />
                            ) : (
                              <p className={`text-[11px] ${spec.text} font-medium leading-relaxed`}>{value?.description} az alaparbol</p>
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
    </div>
  );
}
