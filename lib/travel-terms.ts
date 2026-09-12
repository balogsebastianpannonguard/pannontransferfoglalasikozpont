import { getCollection } from "@/lib/db";
import { TRAVEL_TERMS_DOCUMENT_KEY, TRAVEL_TERMS_PORTAL_PATH } from "@/lib/travel-terms-config";

export type TravelTermsRole = "owner" | "editor" | "viewer";

export interface TravelTermsSection {
  id: string;
  title: string;
  content: string;
  tone: "standard" | "important" | "highlight";
}

export interface TravelTermsDocument {
  key: string;
  pageTitle: string;
  lead: string;
  highlight: string;
  supportEmail: string;
  supportPhone: string;
  billingContactName: string;
  billingNote: string;
  sharingNote: string;
  sections: TravelTermsSection[];
  updatedAt: number;
  updatedBy: string;
  version: number;
}

export interface TravelTermsAccessUser {
  _id?: string | import("mongodb").ObjectId;
  email: string;
  normalizedEmail: string;
  displayName: string;
  role: TravelTermsRole;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

const DOCUMENT_COLLECTION = "travel_terms_documents";
const ACCESS_COLLECTION = "travel_terms_access_users";

export async function getTravelTermsDocumentCollection() {
  return getCollection<TravelTermsDocument>(DOCUMENT_COLLECTION);
}

export async function getTravelTermsAccessCollection() {
  return getCollection<TravelTermsAccessUser>(ACCESS_COLLECTION);
}

export function normalizeTravelTermsEmail(email: string) {
  return email.trim().toLowerCase();
}

function slugifySectionId(value: string) {
  const core = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return core || `szakasz-${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeSection(input: Partial<TravelTermsSection>, index: number): TravelTermsSection {
  const title = String(input.title || "").trim() || `Szakasz ${index + 1}`;
  const content = String(input.content || "").trim();
  const toneValue = input.tone === "important" || input.tone === "highlight" ? input.tone : "standard";
  return {
    id: String(input.id || "").trim() || slugifySectionId(title),
    title,
    content,
    tone: toneValue,
  };
}

export function buildDefaultTravelTermsDocument(updatedBy: string): TravelTermsDocument {
  const now = Date.now();
  return {
    key: TRAVEL_TERMS_DOCUMENT_KEY,
    pageTitle: "Utazási feltételek",
    lead:
      "Ezen a felületen a Pannon Transfer utazási feltételei egységesen, valós időben szerkeszthetők. A módosítások azonnal megjelennek minden megnyitott nézetben.",
    highlight:
      "Kérjük, minden fontos módosítás előtt ellenőrizd a fizetési, lemondási és időpont-módosítási szabályokat is.",
    supportEmail: "info@pannontransfer.hu",
    supportPhone: "+36 30 000 0000",
    billingContactName: "Évike - pénzügy",
    billingNote:
      "A számlázási és pénzügyi megjegyzések ezen az oldalon közvetlenül frissíthetők, így a legfrissebb változat jelenik meg minden érintett számára.",
    sharingNote: `Megosztható dedikált útvonal: ${TRAVEL_TERMS_PORTAL_PATH}`,
    sections: [
      {
        id: "foglalas",
        title: "Foglalás és visszaigazolás",
        content:
          "A foglalás a Pannon Transfer visszaigazolásával válik véglegessé. A szolgáltatás részletei, az indulási időpont és a díjazás minden esetben a jóváhagyott visszaigazolás szerint érvényesek.",
        tone: "standard",
      },
      {
        id: "lemondas",
        title: "Lemondási feltételek",
        content:
          "A lemondás vagy módosítás feltételeit az aktuális megállapodás és a visszaigazolt szolgáltatás jellege határozza meg. Kérjük, minden változást a lehető leghamarabb jelezz.",
        tone: "important",
      },
      {
        id: "fizetes",
        title: "Fizetés és számlázás",
        content:
          "A számlázás a visszaigazolt szolgáltatás alapján történik. Egyedi pénzügyi kérések, előleg vagy halasztott fizetés esetén a megjegyzés rovatban rögzített információ az irányadó.",
        tone: "highlight",
      },
    ],
    updatedAt: now,
    updatedBy,
    version: 1,
  };
}

export async function initTravelTermsIndexes() {
  const accessCollection = await getTravelTermsAccessCollection();
  try {
    await accessCollection.createIndex({ normalizedEmail: 1 }, { unique: true });
    await accessCollection.createIndex({ role: 1, isActive: 1 });
  } catch {
    // Nincs további teendő, ha már léteznek.
  }

  const docCollection = await getTravelTermsDocumentCollection();
  try {
    await docCollection.createIndex({ key: 1 }, { unique: true });
  } catch {
    // Nincs további teendő, ha már léteznek.
  }
}

export async function ensureTravelTermsDefaults() {
  await initTravelTermsIndexes();

  const ownerEmail = normalizeTravelTermsEmail(
    process.env.ADMIN_EMAIL || "balog.sebastian@pannonguard.hu"
  );
  const financeEmail = normalizeTravelTermsEmail(process.env.TRAVEL_TERMS_FINANCE_EMAIL || "");
  const accessCollection = await getTravelTermsAccessCollection();
  const now = Date.now();

  const seeds = [
    { email: ownerEmail, displayName: "Sebastian - tulajdonos", role: "owner" as const },
    ...(financeEmail
      ? [{ email: financeEmail, displayName: "Évike - pénzügy", role: "editor" as const }]
      : []),
  ];

  for (const seed of seeds) {
    if (!seed.email) continue;
    await accessCollection.updateOne(
      { normalizedEmail: normalizeTravelTermsEmail(seed.email) },
      {
        $setOnInsert: {
          email: seed.email,
          normalizedEmail: normalizeTravelTermsEmail(seed.email),
          displayName: seed.displayName,
          role: seed.role,
          isActive: true,
          createdAt: now,
          updatedAt: now,
          createdBy: ownerEmail,
        },
      },
      { upsert: true }
    );
  }

  const docCollection = await getTravelTermsDocumentCollection();
  const existing = await docCollection.findOne({ key: TRAVEL_TERMS_DOCUMENT_KEY });
  if (!existing) {
    await docCollection.insertOne(buildDefaultTravelTermsDocument(ownerEmail));
  }
}

export async function getTravelTermsDocument() {
  await ensureTravelTermsDefaults();
  const collection = await getTravelTermsDocumentCollection();
  const existing = await collection.findOne({ key: TRAVEL_TERMS_DOCUMENT_KEY });
  if (existing) return existing as TravelTermsDocument;

  const ownerEmail = normalizeTravelTermsEmail(
    process.env.ADMIN_EMAIL || "balog.sebastian@pannonguard.hu"
  );
  const fallback = buildDefaultTravelTermsDocument(ownerEmail);
  await collection.insertOne(fallback);
  return fallback;
}

export async function saveTravelTermsDocument(
  input: Partial<TravelTermsDocument>,
  updatedBy: string
) {
  await ensureTravelTermsDefaults();
  const current = await getTravelTermsDocument();
  const nextSections = Array.isArray(input.sections)
    ? input.sections.map((section, index) => sanitizeSection(section, index))
    : current.sections;

  const nextDocument: TravelTermsDocument = {
    key: TRAVEL_TERMS_DOCUMENT_KEY,
    pageTitle: String(input.pageTitle || current.pageTitle).trim() || "Utazási feltételek",
    lead: String(input.lead || current.lead).trim(),
    highlight: String(input.highlight || current.highlight).trim(),
    supportEmail: String(input.supportEmail || current.supportEmail).trim(),
    supportPhone: String(input.supportPhone || current.supportPhone).trim(),
    billingContactName: String(input.billingContactName || current.billingContactName).trim(),
    billingNote: String(input.billingNote || current.billingNote).trim(),
    sharingNote: String(input.sharingNote || current.sharingNote).trim(),
    sections: nextSections,
    updatedAt: Date.now(),
    updatedBy: normalizeTravelTermsEmail(updatedBy),
    version: (current.version || 1) + 1,
  };

  const collection = await getTravelTermsDocumentCollection();
  await collection.updateOne(
    { key: TRAVEL_TERMS_DOCUMENT_KEY },
    { $set: nextDocument },
    { upsert: true }
  );

  return nextDocument;
}

export async function listTravelTermsAccessUsers() {
  await ensureTravelTermsDefaults();
  const collection = await getTravelTermsAccessCollection();
  const docs = await collection.find({}).sort({ role: 1, displayName: 1 }).toArray();
  return docs.map((doc) => ({
    ...doc,
    _id: String(doc._id),
  })) as unknown as TravelTermsAccessUser[];
}

export async function findTravelTermsAccessUserByEmail(email: string) {
  await ensureTravelTermsDefaults();
  const collection = await getTravelTermsAccessCollection();
  const normalizedEmail = normalizeTravelTermsEmail(email);
  const doc = await collection.findOne({ normalizedEmail, isActive: true });
  return (doc as TravelTermsAccessUser | null) || null;
}

export async function upsertTravelTermsAccessUser(input: {
  email: string;
  displayName?: string;
  role: TravelTermsRole;
  isActive?: boolean;
  actorEmail: string;
}) {
  await ensureTravelTermsDefaults();
  const collection = await getTravelTermsAccessCollection();
  const email = normalizeTravelTermsEmail(input.email);
  const now = Date.now();

  const payload: TravelTermsAccessUser = {
    email,
    normalizedEmail: email,
    displayName: String(input.displayName || email.split("@")[0]).trim(),
    role: input.role,
    isActive: input.isActive ?? true,
    createdAt: now,
    updatedAt: now,
    createdBy: normalizeTravelTermsEmail(input.actorEmail),
  };

  await collection.updateOne(
    { normalizedEmail: email },
    {
      $set: {
        email: payload.email,
        normalizedEmail: payload.normalizedEmail,
        displayName: payload.displayName,
        role: payload.role,
        isActive: payload.isActive,
        updatedAt: now,
        createdBy: payload.createdBy,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true }
  );

  const fresh = (await collection.findOne({
    normalizedEmail: email,
  })) as (TravelTermsAccessUser & { _id?: { toString(): string } | string }) | null;
  return {
    ...(fresh as TravelTermsAccessUser),
    _id: fresh?._id ? String(fresh._id) : undefined,
  } as TravelTermsAccessUser;
}

export function hasTravelTermsRole(
  userRole: TravelTermsRole,
  requiredRoles: TravelTermsRole[]
) {
  const order: Record<TravelTermsRole, number> = {
    viewer: 1,
    editor: 2,
    owner: 3,
  };
  return requiredRoles.some((required) => order[userRole] >= order[required]);
}
