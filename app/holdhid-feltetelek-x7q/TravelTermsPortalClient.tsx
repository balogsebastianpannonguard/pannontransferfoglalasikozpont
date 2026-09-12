"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  PartnerPricing,
  PricingTerms,
  PricingVehicle,
} from "@/lib/partner-pricing";
import {
  PARTNER_PORTAL_CONFIGS,
  PARTNER_PORTAL_ORDER,
  type PartnerPortalConfig,
} from "@/lib/partner-pricing-config";
import type { TravelTermsRole } from "@/lib/travel-terms";

interface PortalUser {
  email: string;
  portalRole: TravelTermsRole;
  displayName: string;
}

interface Props {
  accessToken: string | null;
}

interface PortalResponse {
  success: boolean;
  partners?: PartnerPricing[];
  partnerConfigs?: Record<string, PartnerPortalConfig>;
  shareUrl?: string;
  sessionUser?: PortalUser | null;
  message?: string;
}

interface StreamPayload {
  partners?: PartnerPricing[];
  shareUrl?: string;
}

interface DraftState {
  partner: PartnerPricing;
  metaText: string;
}

interface CreateState {
  partnerKey: string;
  partnerName: string;
  busy: boolean;
}

function deepClonePartner(partner: PartnerPricing): PartnerPricing {
  return JSON.parse(JSON.stringify(partner)) as PartnerPricing;
}

function createEmptyVehicle(index: number): PricingVehicle {
  return {
    id: `uj-jarmu-${Date.now()}-${index}`,
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

function formatMoney(value: number | null | undefined, currency: string) {
  if (value === null || value === undefined) return "-";
  if (currency === "EUR") {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);
  }
  return new Intl.NumberFormat("hu-HU", {
    style: "currency",
    currency: "HUF",
    maximumFractionDigits: 0,
  }).format(value);
}

function parseNumberInput(value: string) {
  const normalized = value.replace(",", ".").trim();
  if (!normalized) return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function TravelTermsPortalClient({ accessToken }: Props) {
  const [partners, setPartners] = useState<PartnerPricing[]>([]);
  const [partnerConfigs, setPartnerConfigs] =
    useState<Record<string, PartnerPortalConfig>>(PARTNER_PORTAL_CONFIGS);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [shareUrl, setShareUrl] = useState("");
  const [sessionUser, setSessionUser] = useState<PortalUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statusText, setStatusText] = useState("Betoltes folyamatban...");
  const [createState, setCreateState] = useState<CreateState>({
    partnerKey: "",
    partnerName: "",
    busy: false,
  });

  const selectedPartner = useMemo(
    () => partners.find((item) => item.partnerKey === selectedKey) || null,
    [partners, selectedKey]
  );
  const selectedConfig = selectedPartner
    ? partnerConfigs[selectedPartner.partnerKey] || null
    : null;
  const editMode = !!draft;

  async function loadPortal() {
    setLoading(true);
    try {
      const response = await fetch("/api/travel-terms/partners", {
        headers: accessToken ? { "x-travel-terms-access": accessToken } : undefined,
        cache: "no-store",
      });
      const data = (await response.json()) as PortalResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Nem sikerult betolteni az oldalt.");
      }

      const nextPartners = data.partners || [];
      setPartners(nextPartners);
      setPartnerConfigs(data.partnerConfigs || PARTNER_PORTAL_CONFIGS);
      setShareUrl(data.shareUrl || window.location.href);
      setSessionUser(data.sessionUser || null);
      setSelectedKey((current) =>
        current && nextPartners.some((item) => item.partnerKey === current)
          ? current
          : nextPartners[0]?.partnerKey || null
      );
      setStatusText("A partnerlista betoltve.");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Nem sikerult betolteni az oldalt.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPortal();
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;

    const events = new EventSource(
      `/api/travel-terms/partners/stream?kulcs=${encodeURIComponent(accessToken)}`
    );

    const applyPartnerSnapshot = (payload: StreamPayload) => {
      if (payload.partners) {
        setPartners(payload.partners);
        setSelectedKey((current) =>
          current && payload.partners!.some((item) => item.partnerKey === current)
            ? current
            : payload.partners![0]?.partnerKey || null
        );
      }
      if (payload.shareUrl) setShareUrl(payload.shareUrl);
      setStatusText("Valos ideju frissites megerkezett.");
    };

    events.addEventListener("partners_snapshot", (event) => {
      applyPartnerSnapshot(JSON.parse((event as MessageEvent).data));
    });

    events.addEventListener("partner_pricing_updated", (event) => {
      applyPartnerSnapshot(JSON.parse((event as MessageEvent).data));
    });

    events.addEventListener("partner_pricing_deleted", (event) => {
      applyPartnerSnapshot(JSON.parse((event as MessageEvent).data));
    });

    events.onerror = () => {
      setStatusText("Az elo kapcsolat ujracsatlakozik...");
    };

    return () => {
      events.close();
    };
  }, [accessToken]);

  function startEdit(partner: PartnerPricing) {
    const partnerClone = deepClonePartner(partner);
    setDraft({
      partner: partnerClone,
      metaText: JSON.stringify(partnerClone.meta || {}, null, 2),
    });
    setStatusText("Szerkesztesi mod aktiv.");
  }

  function cancelEdit() {
    setDraft(null);
    setStatusText("A valtoztatasok elvetve.");
  }

  function updateDraftField<K extends keyof PartnerPricing>(
    key: K,
    value: PartnerPricing[K]
  ) {
    setDraft((current) =>
      current
        ? {
            ...current,
            partner: {
              ...current.partner,
              [key]: value,
            },
          }
        : current
    );
  }

  function updateVehicleField(
    index: number,
    key: keyof PricingVehicle,
    value: string | number | null
  ) {
    setDraft((current) => {
      if (!current) return current;
      const nextVehicles = current.partner.vehicles.map((vehicle, vehicleIndex) =>
        vehicleIndex === index ? { ...vehicle, [key]: value } : vehicle
      );
      return {
        ...current,
        partner: {
          ...current.partner,
          vehicles: nextVehicles,
        },
      };
    });
  }

  function addVehicle() {
    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        partner: {
          ...current.partner,
          vehicles: [...current.partner.vehicles, createEmptyVehicle(current.partner.vehicles.length)],
        },
      };
    });
  }

  function removeVehicle(index: number) {
    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        partner: {
          ...current.partner,
          vehicles: current.partner.vehicles.filter((_, vehicleIndex) => vehicleIndex !== index),
        },
      };
    });
  }

  function updateTermField(
    section: keyof PricingTerms,
    windowKey: "12-24h" | "0-12h",
    key: "percentage" | "description",
    value: string | number
  ) {
    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        partner: {
          ...current.partner,
          terms: {
            ...current.partner.terms,
            [section]: {
              ...current.partner.terms[section],
              [windowKey]: {
                ...current.partner.terms[section][windowKey],
                [key]: value,
              },
            },
          },
        },
      };
    });
  }

  async function savePartner() {
    if (!draft) return;

    setSaving(true);
    setStatusText("Mentes folyamatban...");

    try {
      const parsedMeta = draft.metaText.trim() ? JSON.parse(draft.metaText) : {};
      const response = await fetch(
        `/api/travel-terms/partners?partnerKey=${encodeURIComponent(draft.partner.partnerKey)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { "x-travel-terms-access": accessToken } : {}),
          },
          body: JSON.stringify({
            partnerName: draft.partner.partnerName,
            isActive: draft.partner.isActive,
            vehicles: draft.partner.vehicles,
            terms: draft.partner.terms,
            meta: parsedMeta,
          }),
        }
      );

      const data = (await response.json()) as PortalResponse & { partner?: PartnerPricing };
      if (!response.ok || !data.success || !data.partner) {
        throw new Error(data.message || "Nem sikerult menteni a partnert.");
      }

      setPartners(data.partners || []);
      setShareUrl(data.shareUrl || shareUrl);
      setDraft(null);
      setSelectedKey(data.partner.partnerKey);
      setStatusText("A partner adatai sikeresen frissultek.");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Mentési hiba tortent.");
    } finally {
      setSaving(false);
    }
  }

  async function deletePartner() {
    if (!selectedPartner) return;
    const confirmed = window.confirm(
      `${selectedPartner.partnerName} torlese utan a rekord kikerul a kulon linkes feluletrol. Folytassam?`
    );
    if (!confirmed) return;

    setDeleting(true);
    setStatusText("Partner torlese folyamatban...");

    try {
      const response = await fetch(
        `/api/travel-terms/partners?partnerKey=${encodeURIComponent(selectedPartner.partnerKey)}`,
        {
          method: "DELETE",
          headers: accessToken ? { "x-travel-terms-access": accessToken } : undefined,
        }
      );
      const data = (await response.json()) as PortalResponse;
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Nem sikerult torolni a partnert.");
      }

      const nextPartners = data.partners || [];
      setPartners(nextPartners);
      setSelectedKey(nextPartners[0]?.partnerKey || null);
      setDraft(null);
      setShareUrl(data.shareUrl || shareUrl);
      setStatusText("A partner torolve lett.");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Torlesi hiba tortent.");
    } finally {
      setDeleting(false);
    }
  }

  async function createPartner() {
    if (!createState.partnerKey.trim() || !createState.partnerName.trim()) {
      setStatusText("Adj meg partner kulcsot es nevet is.");
      return;
    }

    setCreateState((current) => ({ ...current, busy: true }));
    try {
      const response = await fetch("/api/travel-terms/partners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { "x-travel-terms-access": accessToken } : {}),
        },
        body: JSON.stringify({
          partnerKey: createState.partnerKey.trim().toLowerCase(),
          partnerName: createState.partnerName.trim(),
          isActive: true,
          vehicles: [],
          terms: createEmptyTerms(),
          meta: {},
        }),
      });
      const data = (await response.json()) as PortalResponse & { partner?: PartnerPricing };
      if (!response.ok || !data.success || !data.partner) {
        throw new Error(data.message || "Nem sikerult letrehozni az uj partnert.");
      }

      setPartners(data.partners || []);
      setSelectedKey(data.partner.partnerKey);
      setCreateState({ partnerKey: "", partnerName: "", busy: false });
      setStatusText("Az uj partner letrejott.");
    } catch (error) {
      setCreateState((current) => ({ ...current, busy: false }));
      setStatusText(error instanceof Error ? error.message : "Nem sikerult letrehozni az uj partnert.");
    }
  }

  async function copyShareUrl() {
    try {
      await navigator.clipboard.writeText(shareUrl || window.location.href);
      setStatusText("A megoszthato link a vagolapra kerult.");
    } catch {
      setStatusText("A link masolasa most nem sikerult.");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F7F7F5] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-[28px] border border-black/5 bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.05)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
            Kulon linkes felulet
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Partner utazasi feltetelek betoltese
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{statusText}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F7F5] text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 grid gap-4 lg:grid-cols-[1.7fr_1fr]">
          <section className="rounded-[28px] border border-black/5 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.05)]">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
              Kulon partnerportal
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              Utazasi feltetelek es partnerarak
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Ez a kulon megoszthato oldal ugyanazokat a ceges utazasi felteteleket mutatja,
              mint az admin felulet, de onallo linken is kezelheto.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Partnerek</div>
                <div className="mt-2 text-2xl font-semibold">{partners.length}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Statusz</div>
                <div className="mt-2 text-sm font-medium">{statusText}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Felhasznalo</div>
                <div className="mt-2 text-sm font-medium">
                  {sessionUser?.displayName || "Megosztott szerkeszto link"}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {sessionUser?.portalRole || "editor"}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-black/5 bg-[#111827] p-6 text-white shadow-[0_20px_60px_rgba(17,24,39,0.22)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/50">
              Megosztas
            </div>
            <h2 className="mt-2 text-xl font-semibold">Kulon szerkesztoi link</h2>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm break-all">
              {shareUrl}
            </div>
            <button
              type="button"
              onClick={copyShareUrl}
              className="mt-4 inline-flex rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Link masolasa
            </button>
            <p className="mt-3 text-xs leading-5 text-white/55">
              A link birtokaban a partnerlista itt kulon is megnyithato es frissen tarthato.
            </p>
          </section>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_1.4fr]">
          <section className="rounded-[28px] border border-black/5 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.04)]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Partnerlista</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Ugyanazok a cegek jelennek meg itt is, mint az adminban.
                </p>
              </div>
            </div>

            <div className="mb-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 text-sm font-semibold text-slate-900">Uj partner hozzaadasa</div>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  value={createState.partnerKey}
                  onChange={(event) =>
                    setCreateState((current) => ({ ...current, partnerKey: event.target.value }))
                  }
                  placeholder="partner-key"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                />
                <input
                  value={createState.partnerName}
                  onChange={(event) =>
                    setCreateState((current) => ({ ...current, partnerName: event.target.value }))
                  }
                  placeholder="Partner neve"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                />
              </div>
              <button
                type="button"
                onClick={createPartner}
                disabled={createState.busy}
                className="mt-3 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:bg-slate-300"
              >
                {createState.busy ? "Letrehozas..." : "Uj partner letrehozasa"}
              </button>
            </div>

            <div className="space-y-3">
              {PARTNER_PORTAL_ORDER.map((key) => {
                const partner = partners.find((item) => item.partnerKey === key);
                if (!partner) return null;
                const cfg = partnerConfigs[key] || PARTNER_PORTAL_CONFIGS[key];
                return (
                  <button
                    key={partner.partnerKey}
                    type="button"
                    onClick={() => {
                      setSelectedKey(partner.partnerKey);
                      setDraft(null);
                    }}
                    className={`w-full rounded-3xl border p-4 text-left transition ${
                      selectedKey === partner.partnerKey
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div
                          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-sm font-black text-white shadow-lg"
                          style={{
                            background: `linear-gradient(135deg, ${cfg.color}, ${cfg.colorSecondary})`,
                          }}
                        >
                          {cfg.shortLabel}
                        </div>
                        <div>
                          <div className="font-semibold">{partner.partnerName}</div>
                          <div
                            className={`mt-1 text-sm ${
                              selectedKey === partner.partnerKey ? "text-white/70" : "text-slate-500"
                            }`}
                          >
                            {cfg.description}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${
                            partner.isActive
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {partner.isActive ? "Aktiv" : "Inaktiv"}
                        </div>
                        <div
                          className={`mt-2 text-xs ${
                            selectedKey === partner.partnerKey ? "text-white/55" : "text-slate-400"
                          }`}
                        >
                          {cfg.currency}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-[28px] border border-black/5 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.04)]">
            {!selectedPartner ? (
              <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-sm text-slate-500">
                Valassz egy partnert a listabol.
              </div>
            ) : (
              <>
                <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {selectedConfig?.tag || "Partner"}
                    </div>
                    <h2 className="mt-2 text-2xl font-semibold">
                      {editMode ? "Partner szerkesztese" : selectedPartner.partnerName}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {selectedConfig?.description || "Partner adatok es utazasi feltetelek."}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {editMode ? (
                      <>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
                        >
                          Megse
                        </button>
                        <button
                          type="button"
                          onClick={savePartner}
                          disabled={saving}
                          className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:bg-slate-300"
                        >
                          {saving ? "Mentes..." : "Mentes"}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEdit(selectedPartner)}
                        className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
                      >
                        Szerkesztes
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={deletePartner}
                      disabled={deleting}
                      className="rounded-2xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-600 disabled:text-rose-300"
                    >
                      {deleting ? "Torles..." : "Partner torlese"}
                    </button>
                  </div>
                </div>

                {editMode && draft ? (
                  <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-700">
                          Partner neve
                        </span>
                        <input
                          value={draft.partner.partnerName}
                          onChange={(event) =>
                            updateDraftField("partnerName", event.target.value)
                          }
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
                        />
                      </label>
                      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={draft.partner.isActive}
                          onChange={(event) =>
                            updateDraftField("isActive", event.target.checked)
                          }
                        />
                        <span className="text-sm text-slate-700">Partner aktiv</span>
                      </label>
                    </div>

                    <div className="rounded-3xl border border-slate-200 p-5">
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">Jarmuvek es arak</h3>
                          <p className="text-sm text-slate-500">
                            Itt tudod frissiteni, torolni vagy bovitni a sorokat.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={addVehicle}
                          className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                        >
                          Uj sor
                        </button>
                      </div>

                      <div className="space-y-4">
                        {draft.partner.vehicles.map((vehicle, index) => (
                          <div key={vehicle.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                            <div className="mb-4 flex items-center justify-between">
                              <div className="font-medium text-slate-900">
                                {index + 1}. jarmu
                              </div>
                              <button
                                type="button"
                                onClick={() => removeVehicle(index)}
                                className="text-sm font-semibold text-rose-600"
                              >
                                Sor torlese
                              </button>
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                              <label className="block">
                                <span className="mb-2 block text-sm text-slate-600">Azonosito</span>
                                <input
                                  value={vehicle.id}
                                  onChange={(event) =>
                                    updateVehicleField(index, "id", event.target.value)
                                  }
                                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400"
                                />
                              </label>
                              <label className="block">
                                <span className="mb-2 block text-sm text-slate-600">Nev</span>
                                <input
                                  value={vehicle.name}
                                  onChange={(event) =>
                                    updateVehicleField(index, "name", event.target.value)
                                  }
                                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400"
                                />
                              </label>
                              <label className="block">
                                <span className="mb-2 block text-sm text-slate-600">Kapacitas</span>
                                <input
                                  value={vehicle.capacity}
                                  onChange={(event) =>
                                    updateVehicleField(index, "capacity", event.target.value)
                                  }
                                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400"
                                />
                              </label>
                            </div>

                            <div className="mt-4 grid gap-4 md:grid-cols-3">
                              {(
                                [
                                  ["bpBudAirport", "Bp-Bud Airport"],
                                  ["dbDbAirport", "Db-Db Airport"],
                                  ["newPrice2026", "2026 uj ar"],
                                  ["modification12to24h", "Mod. 12-24h"],
                                  ["modification0to12h", "Mod. 0-12h"],
                                  ["cancellation12to24h", "Torles 12-24h"],
                                  ["cancellation0to12h", "Torles 0-12h"],
                                  ["extraWaitingPerHour", "Varakozas / ora"],
                                  ["dailyRate", "Napidij"],
                                ] as Array<[keyof PricingVehicle, string]>
                              ).map(([field, label]) => (
                                <label key={String(field)} className="block">
                                  <span className="mb-2 block text-sm text-slate-600">{label}</span>
                                  <input
                                    value={vehicle[field] ?? ""}
                                    onChange={(event) =>
                                      updateVehicleField(
                                        index,
                                        field,
                                        field === "dbDbAirport" && event.target.value.trim() === ""
                                          ? null
                                          : parseNumberInput(event.target.value)
                                      )
                                    }
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400"
                                  />
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      {(["modification", "cancellation"] as Array<keyof PricingTerms>).map((section) => (
                        <div key={section} className="rounded-3xl border border-slate-200 p-5">
                          <h3 className="text-lg font-semibold">
                            {section === "modification" ? "Modositas" : "Torles"}
                          </h3>
                          <div className="mt-4 space-y-4">
                            {(["12-24h", "0-12h"] as const).map((windowKey) => (
                              <div key={windowKey} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="mb-3 text-sm font-medium text-slate-800">{windowKey}</div>
                                <div className="grid gap-4">
                                  <label className="block">
                                    <span className="mb-2 block text-sm text-slate-600">Szazalek</span>
                                    <input
                                      value={draft.partner.terms[section][windowKey].percentage}
                                      onChange={(event) =>
                                        updateTermField(
                                          section,
                                          windowKey,
                                          "percentage",
                                          parseNumberInput(event.target.value)
                                        )
                                      }
                                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400"
                                    />
                                  </label>
                                  <label className="block">
                                    <span className="mb-2 block text-sm text-slate-600">Leiras</span>
                                    <input
                                      value={draft.partner.terms[section][windowKey].description}
                                      onChange={(event) =>
                                        updateTermField(
                                          section,
                                          windowKey,
                                          "description",
                                          event.target.value
                                        )
                                      }
                                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400"
                                    />
                                  </label>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        Meta JSON
                      </span>
                      <textarea
                        value={draft.metaText}
                        onChange={(event) =>
                          setDraft((current) =>
                            current ? { ...current, metaText: event.target.value } : current
                          )
                        }
                        rows={12}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-mono text-sm outline-none focus:border-slate-400"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="rounded-2xl border border-slate-200 p-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Allapot</div>
                        <div className="mt-2 font-medium">
                          {selectedPartner.isActive ? "Aktiv" : "Inaktiv"}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-slate-200 p-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Jarmuvek</div>
                        <div className="mt-2 font-medium">{selectedPartner.vehicles.length} db</div>
                      </div>
                      <div className="rounded-2xl border border-slate-200 p-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Penznem</div>
                        <div className="mt-2 font-medium">{selectedConfig?.currency || "HUF"}</div>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 p-5">
                      <h3 className="text-lg font-semibold">Jarmuvek es arak</h3>
                      <div className="mt-4 space-y-4">
                        {selectedPartner.vehicles.map((vehicle) => (
                          <div key={vehicle.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div>
                                <div className="font-semibold text-slate-900">{vehicle.name}</div>
                                <div className="mt-1 text-sm text-slate-500">{vehicle.capacity}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-slate-500">2026-os ar</div>
                                <div className="font-semibold text-slate-900">
                                  {formatMoney(vehicle.newPrice2026, selectedConfig?.currency || "HUF")}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      {(["modification", "cancellation"] as Array<keyof PricingTerms>).map((section) => (
                        <div key={section} className="rounded-3xl border border-slate-200 p-5">
                          <h3 className="text-lg font-semibold">
                            {section === "modification" ? "Modositas" : "Torles"}
                          </h3>
                          <div className="mt-4 space-y-3">
                            {(["12-24h", "0-12h"] as const).map((windowKey) => (
                              <div key={windowKey} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="text-sm font-medium text-slate-800">{windowKey}</div>
                                <div className="mt-2 text-sm text-slate-600">
                                  {selectedPartner.terms[section][windowKey].percentage}% -{" "}
                                  {selectedPartner.terms[section][windowKey].description}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {selectedPartner.meta && Object.keys(selectedPartner.meta).length > 0 && (
                      <div className="rounded-3xl border border-slate-200 p-5">
                        <h3 className="text-lg font-semibold">Meta adatok</h3>
                        <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">
                          {JSON.stringify(selectedPartner.meta, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
