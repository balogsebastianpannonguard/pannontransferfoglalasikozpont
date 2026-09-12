"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  TravelTermsAccessUser,
  TravelTermsDocument,
  TravelTermsRole,
  TravelTermsSection,
} from "@/lib/travel-terms";

interface PortalUser {
  email: string;
  portalRole: TravelTermsRole;
  displayName: string;
}

interface Props {
  initialDocument: TravelTermsDocument | null;
  initialAccessUsers: TravelTermsAccessUser[];
  initialSessionUser: PortalUser | null;
  initialShareUrl: string;
  accessToken: string | null;
}

interface StreamSnapshotPayload {
  document?: TravelTermsDocument;
  accessUsers?: TravelTermsAccessUser[];
  shareUrl?: string;
}

function sectionToneLabel(tone: TravelTermsSection["tone"]) {
  if (tone === "important") return "Fontos";
  if (tone === "highlight") return "Kiemelt";
  return "Normál";
}

function emptySection(index: number): TravelTermsSection {
  return {
    id: `uj-szakasz-${Date.now()}-${index}`,
    title: `Új szakasz ${index + 1}`,
    content: "",
    tone: "standard",
  };
}

export default function TravelTermsPortalClient({
  initialDocument,
  initialAccessUsers,
  initialSessionUser,
  initialShareUrl,
  accessToken,
}: Props) {
  const [document, setDocument] = useState<TravelTermsDocument | null>(initialDocument);
  const [accessUsers, setAccessUsers] = useState<TravelTermsAccessUser[]>(initialAccessUsers);
  const [sessionUser, setSessionUser] = useState<PortalUser | null>(initialSessionUser);
  const [shareUrl, setShareUrl] = useState(initialShareUrl);
  const [loading, setLoading] = useState(!initialDocument);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusText, setStatusText] = useState(
    initialDocument ? "Minden változás szinkronban." : "Betöltés folyamatban..."
  );
  const [incomingRemoteDocument, setIncomingRemoteDocument] = useState<TravelTermsDocument | null>(null);
  const [inviteState, setInviteState] = useState({
    email: "",
    displayName: "Évike - pénzügy",
    role: "editor" as TravelTermsRole,
    sendInvite: true,
    busy: false,
    info: "",
  });

  const isOwner = sessionUser?.portalRole === "owner";
  const canEdit = sessionUser?.portalRole === "owner" || sessionUser?.portalRole === "editor";
  const lastUpdatedLabel = useMemo(
    () =>
      new Date(document?.updatedAt || Date.now()).toLocaleString("hu-HU", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
    [document?.updatedAt]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadPortal() {
      try {
        const response = await fetch("/api/travel-terms", {
          headers: accessToken ? { "x-travel-terms-access": accessToken } : undefined,
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Nem sikerült betölteni az oldalt.");
        }

        if (cancelled) return;
        setDocument(data.document);
        setAccessUsers(data.accessUsers || []);
        setSessionUser(data.sessionUser || null);
        setShareUrl(data.shareUrl || window.location.href);
        setStatusText("Minden változás szinkronban.");
      } catch (error) {
        if (cancelled) return;
        setStatusText(error instanceof Error ? error.message : "Nem sikerült betölteni az oldalt.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (!initialDocument) {
      loadPortal();
    } else {
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [accessToken, initialDocument]);

  useEffect(() => {
    if (!document) return;

    const streamUrl = accessToken
      ? `/api/travel-terms/stream?kulcs=${encodeURIComponent(accessToken)}`
      : "/api/travel-terms/stream";
    const events = new EventSource(streamUrl);

    const applySnapshot = (payload: StreamSnapshotPayload) => {
      if (payload?.accessUsers) setAccessUsers(payload.accessUsers);
      if (!payload?.document) return;

      const nextDocument = payload.document as TravelTermsDocument;
      if (payload?.shareUrl) setShareUrl(payload.shareUrl);
      if (dirty && nextDocument.version !== document.version) {
        setIncomingRemoteDocument(nextDocument);
        setStatusText("Távoli módosítás érkezett. Döntsd el, hogy átveszed-e.");
        return;
      }

      setDocument(nextDocument);
      setIncomingRemoteDocument(null);
      setStatusText("Valós idejű frissítés megérkezett.");
    };

    events.addEventListener("snapshot", (event) => {
      applySnapshot(JSON.parse((event as MessageEvent).data));
    });

    events.addEventListener("terms_updated", (event) => {
      applySnapshot(JSON.parse((event as MessageEvent).data));
    });

    events.addEventListener("access_updated", (event) => {
      const payload = JSON.parse((event as MessageEvent).data);
      if (payload?.accessUsers) {
        setAccessUsers(payload.accessUsers);
        setStatusText("A hozzáférési lista frissült.");
      }
    });

    events.onerror = () => {
      setStatusText("Az élő kapcsolat újracsatlakozik...");
    };

    return () => {
      events.close();
    };
  }, [accessToken, dirty, document]);

  function updateField<K extends keyof TravelTermsDocument>(key: K, value: TravelTermsDocument[K]) {
    if (!document) return;
    setDocument((current) => (current ? { ...current, [key]: value } : current));
    setDirty(true);
    setStatusText("Mentésre váró módosítások.");
  }

  function updateSection(index: number, patch: Partial<TravelTermsSection>) {
    if (!document) return;
    setDocument((current) => ({
      ...(current as TravelTermsDocument),
      sections: (current?.sections || []).map((section, sectionIndex) =>
        sectionIndex === index ? { ...section, ...patch } : section
      ),
    }));
    setDirty(true);
    setStatusText("Mentésre váró módosítások.");
  }

  function addSection() {
    if (!document) return;
    setDocument((current) => ({
      ...(current as TravelTermsDocument),
      sections: [...(current?.sections || []), emptySection((current?.sections || []).length)],
    }));
    setDirty(true);
  }

  function removeSection(index: number) {
    if (!document) return;
    setDocument((current) => ({
      ...(current as TravelTermsDocument),
      sections: (current?.sections || []).filter((_, sectionIndex) => sectionIndex !== index),
    }));
    setDirty(true);
  }

  async function saveDocument() {
    if (!canEdit || !document) return;
    setSaving(true);
    setStatusText("Mentés folyamatban...");

    try {
      const response = await fetch("/api/travel-terms", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { "x-travel-terms-access": accessToken } : {}),
        },
        body: JSON.stringify({ document }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Nem sikerült a mentés.");
      }

      setDocument(data.document);
      setAccessUsers(data.accessUsers || accessUsers);
      setDirty(false);
      setIncomingRemoteDocument(null);
      setStatusText("Minden változás mentve és szinkronizálva.");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Mentési hiba történt.");
    } finally {
      setSaving(false);
    }
  }

  async function saveAccessUser() {
    if (!isOwner || !inviteState.email.trim()) return;

    setInviteState((current) => ({ ...current, busy: true, info: "" }));
    try {
      const response = await fetch("/api/travel-terms/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteState.email,
          displayName: inviteState.displayName,
          role: inviteState.role,
          sendInvite: inviteState.sendInvite,
          isActive: true,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Nem sikerült a hozzáférés mentése.");
      }

      setAccessUsers(data.accessUsers || []);
      setInviteState({
        email: "",
        displayName: "Évike - pénzügy",
        role: "editor",
        sendInvite: true,
        busy: false,
        info: data.invite?.setupUrl
          ? `Meghívó elkészült: ${data.invite.setupUrl}`
          : "Hozzáférés mentve.",
      });
    } catch (error) {
      setInviteState((current) => ({
        ...current,
        busy: false,
        info: error instanceof Error ? error.message : "Nem sikerült a hozzáférés mentése.",
      }));
    }
  }

  async function copyShareUrl() {
    try {
      await navigator.clipboard.writeText(shareUrl || window.location.href);
      setStatusText("A megosztható link a vágólapra került.");
    } catch {
      setStatusText("A link másolása most nem sikerült.");
    }
  }

  if (loading || !document) {
    return (
      <main className="min-h-screen bg-[#F7F7F5] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-[28px] border border-black/5 bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.05)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
            Utazási feltételek
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Szerkesztő felület betöltése</h1>
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
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Dedikált felület
                </p>
                <h1 className="text-3xl font-semibold tracking-tight">Utazási feltételek kezelése</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  Ez a külön útvonal kizárólag az utazási feltételekhez tartozik. A mentések valós időben
                  megjelennek minden megnyitott nézetben.
                </p>
              </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <div className="font-medium text-slate-900">
                    {sessionUser?.displayName || "Megosztott szerkeszto link"}
                  </div>
                  <div>{sessionUser?.email || "titkos-megosztott-link"}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                    {sessionUser?.portalRole || "editor"}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Utolsó mentés</div>
                <div className="mt-2 font-medium">{lastUpdatedLabel}</div>
                <div className="mt-1 text-sm text-slate-500">{document.updatedBy}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Állapot</div>
                <div className="mt-2 font-medium">{statusText}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Szekciók</div>
                <div className="mt-2 font-medium">{document.sections.length} db</div>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-black/5 bg-[#111827] p-6 text-white shadow-[0_20px_60px_rgba(17,24,39,0.22)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/50">
              Megosztás
            </div>
            <h2 className="mt-2 text-xl font-semibold">Rejtettebb külön oldal</h2>
            <p className="mt-3 text-sm leading-6 text-white/70">
              Ezt a titkos linket elkuldheted barkinek, es a link birtokaban azonnal szerkeszthet.
            </p>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm break-all">
              {shareUrl}
            </div>
            <button
              type="button"
              onClick={copyShareUrl}
              className="mt-4 inline-flex rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Link másolása
            </button>
            <p className="mt-3 text-xs leading-5 text-white/55">
              Nem kell kulon admin belepes, a linkben levo kulcs maga adja a szerkesztesi jogot.
            </p>
          </section>
        </div>

        {incomingRemoteDocument && (
          <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            Távoli módosítás érkezett, miközben helyi változtatásaid is vannak.
            <button
              type="button"
              onClick={() => {
                setDocument(incomingRemoteDocument);
                setIncomingRemoteDocument(null);
                setDirty(false);
                setStatusText("A távoli változat betöltve.");
              }}
              className="ml-3 rounded-xl bg-amber-900 px-3 py-2 font-medium text-white"
            >
              Távoli változat betöltése
            </button>
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
          <section className="rounded-[28px] border border-black/5 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.04)]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Tartalom</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Az összes mező itt szerkeszthető, és mentés után azonnal szinkronizálódik.
                </p>
              </div>
              <button
                type="button"
                onClick={saveDocument}
                disabled={!canEdit || saving || !dirty}
                className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {saving ? "Mentés..." : dirty ? "Mentés" : "Mentve"}
              </button>
            </div>

            <div className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Oldal címe</span>
                <input
                  value={document.pageTitle}
                  onChange={(event) => updateField("pageTitle", event.target.value)}
                  disabled={!canEdit}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400 disabled:bg-slate-50"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Bevezető</span>
                <textarea
                  value={document.lead}
                  onChange={(event) => updateField("lead", event.target.value)}
                  disabled={!canEdit}
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400 disabled:bg-slate-50"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Kiemelt megjegyzés</span>
                <textarea
                  value={document.highlight}
                  onChange={(event) => updateField("highlight", event.target.value)}
                  disabled={!canEdit}
                  rows={3}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400 disabled:bg-slate-50"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Kapcsolati e-mail</span>
                  <input
                    value={document.supportEmail}
                    onChange={(event) => updateField("supportEmail", event.target.value)}
                    disabled={!canEdit}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400 disabled:bg-slate-50"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Kapcsolati telefon</span>
                  <input
                    value={document.supportPhone}
                    onChange={(event) => updateField("supportPhone", event.target.value)}
                    disabled={!canEdit}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400 disabled:bg-slate-50"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Pénzügyi kapcsolattartó</span>
                  <input
                    value={document.billingContactName}
                    onChange={(event) => updateField("billingContactName", event.target.value)}
                    disabled={!canEdit}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400 disabled:bg-slate-50"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Megosztási megjegyzés</span>
                  <input
                    value={document.sharingNote}
                    onChange={(event) => updateField("sharingNote", event.target.value)}
                    disabled={!canEdit}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400 disabled:bg-slate-50"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Számlázási megjegyzés</span>
                <textarea
                  value={document.billingNote}
                  onChange={(event) => updateField("billingNote", event.target.value)}
                  disabled={!canEdit}
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400 disabled:bg-slate-50"
                />
              </label>
            </div>

            <div className="mt-8 border-t border-slate-200 pt-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Szakaszok</h3>
                  <p className="text-sm text-slate-500">Tetszőlegesen bővíthető és átrendezhető tartalmi blokkok.</p>
                </div>
                {canEdit && (
                  <button
                    type="button"
                    onClick={addSection}
                    className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                  >
                    Új szakasz
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {document.sections.map((section, index) => (
                  <div key={section.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        {index + 1}. blokk • {sectionToneLabel(section.tone)}
                      </div>
                      {canEdit && document.sections.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSection(index)}
                          className="text-sm font-medium text-rose-600"
                        >
                          Törlés
                        </button>
                      )}
                    </div>
                    <div className="grid gap-4 md:grid-cols-[1.4fr_220px]">
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-700">Cím</span>
                        <input
                          value={section.title}
                          onChange={(event) => updateSection(index, { title: event.target.value })}
                          disabled={!canEdit}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-400 disabled:bg-slate-100"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-700">Kiemelés típusa</span>
                        <select
                          value={section.tone}
                          onChange={(event) =>
                            updateSection(index, { tone: event.target.value as TravelTermsSection["tone"] })
                          }
                          disabled={!canEdit}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-400 disabled:bg-slate-100"
                        >
                          <option value="standard">Normál</option>
                          <option value="important">Fontos</option>
                          <option value="highlight">Kiemelt</option>
                        </select>
                      </label>
                    </div>
                    <label className="mt-4 block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">Tartalom</span>
                      <textarea
                        value={section.content}
                        onChange={(event) => updateSection(index, { content: event.target.value })}
                        disabled={!canEdit}
                        rows={5}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-400 disabled:bg-slate-100"
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[28px] border border-black/5 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.04)]">
              <h2 className="text-xl font-semibold">Aktív hozzáférések</h2>
              <p className="mt-1 text-sm text-slate-500">
                Csak ezek az e-mail címek láthatják és kezelhetik az oldalt.
              </p>

              <div className="mt-5 space-y-3">
                {accessUsers.map((user) => (
                  <div key={`${user.normalizedEmail}-${user.role}`} className="rounded-2xl border border-slate-200 p-4">
                    <div className="font-medium text-slate-900">{user.displayName}</div>
                    <div className="mt-1 break-all text-sm text-slate-500">{user.email}</div>
                    <div className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {user.role}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {isOwner && (
              <section className="rounded-[28px] border border-black/5 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.04)]">
                <h2 className="text-xl font-semibold">Új hozzáférés</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Itt tudod létrehozni Évike vagy más jogosult munkatárs hozzáférését.
                </p>

                <div className="mt-5 space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Név</span>
                    <input
                      value={inviteState.displayName}
                      onChange={(event) =>
                        setInviteState((current) => ({ ...current, displayName: event.target.value }))
                      }
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">E-mail cím</span>
                    <input
                      value={inviteState.email}
                      onChange={(event) =>
                        setInviteState((current) => ({ ...current, email: event.target.value }))
                      }
                      placeholder="evike@ceg.hu"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Jogosultság</span>
                    <select
                      value={inviteState.role}
                      onChange={(event) =>
                        setInviteState((current) => ({
                          ...current,
                          role: event.target.value as TravelTermsRole,
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
                    >
                      <option value="viewer">Megtekintő</option>
                      <option value="editor">Szerkesztő</option>
                      <option value="owner">Tulajdonos</option>
                    </select>
                  </label>

                  <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={inviteState.sendInvite}
                      onChange={(event) =>
                        setInviteState((current) => ({ ...current, sendInvite: event.target.checked }))
                      }
                    />
                    <span className="text-sm text-slate-700">Azonnali meghívó link küldése és generálása</span>
                  </label>

                  <button
                    type="button"
                    onClick={saveAccessUser}
                    disabled={inviteState.busy || !inviteState.email.trim()}
                    className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {inviteState.busy ? "Mentés..." : "Hozzáférés létrehozása"}
                  </button>

                  {inviteState.info && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 break-all">
                      {inviteState.info}
                    </div>
                  )}
                </div>
              </section>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
