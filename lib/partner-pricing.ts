import { getCollection } from "./db";
import type { ObjectId } from "mongodb";

export interface PricingVehicle {
  id: string;
  name: string;
  capacity: string;
  bpBudAirport: number;
  dbDbAirport: number | null;
  newPrice2026: number;
  modification12to24h: number;
  modification0to12h: number;
  cancellation12to24h: number;
  cancellation0to12h: number;
  extraWaitingPerHour: number;
  dailyRate: number;
}

export interface PricingTerms {
  modification: {
    "12-24h": { percentage: number; description: string };
    "0-12h": { percentage: number; description: string };
  };
  cancellation: {
    "12-24h": { percentage: number; description: string };
    "0-12h": { percentage: number; description: string };
  };
}

export interface PartnerPricing {
  _id?: string | ObjectId;
  partnerKey: string;
  partnerName: string;
  isActive: boolean;
  vehicles: PricingVehicle[];
  terms: PricingTerms;
  meta?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

const COLLECTION_NAME = "partner_pricing";

// ============================================================
// DEFAULT PRICING DATA
// ============================================================

export const DEFAULT_CATL_PRICING: Omit<PartnerPricing, "_id" | "createdAt" | "updatedAt"> = {
  partnerKey: "catl",
  partnerName: "CATL Hungary Kft.",
  isActive: true,
  vehicles: [
    {
      id: "skoda",
      name: "Skoda",
      capacity: "1-3 utas",
      bpBudAirport: 60808,
      dbDbAirport: 18400,
      newPrice2026: 82550,
      modification12to24h: 102157,
      modification0to12h: 122589,
      cancellation12to24h: 34052,
      cancellation0to12h: 54484,
      extraWaitingPerHour: 7000,
      dailyRate: 65000,
    },
    {
      id: "opel_ford",
      name: "Opel/Ford",
      capacity: "3-8 utas",
      bpBudAirport: 94107,
      dbDbAirport: 25300,
      newPrice2026: 95250,
      modification12to24h: 158100,
      modification0to12h: 189720,
      cancellation12to24h: 52700,
      cancellation0to12h: 84320,
      extraWaitingPerHour: 10000,
      dailyRate: 80000,
    },
    {
      id: "v_class",
      name: "V class",
      capacity: "3-7 utas",
      bpBudAirport: 137541,
      dbDbAirport: null,
      newPrice2026: 154046,
      modification12to24h: 154046,
      modification0to12h: 277283,
      cancellation12to24h: 77023,
      cancellation0to12h: 123237,
      extraWaitingPerHour: 15000,
      dailyRate: 120000,
    },
    {
      id: "s_class",
      name: "S class",
      capacity: "1-3 utas",
      bpBudAirport: 166497,
      dbDbAirport: null,
      newPrice2026: 186477,
      modification12to24h: 186477,
      modification0to12h: 335658,
      cancellation12to24h: 93238,
      cancellation0to12h: 149181,
      extraWaitingPerHour: 25000,
      dailyRate: 150000,
    },
    {
      id: "man_bus",
      name: "MAN busz",
      capacity: "Nagy csoport",
      bpBudAirport: 173736,
      dbDbAirport: 40250,
      newPrice2026: 194584,
      modification12to24h: 194584,
      modification0to12h: 350252,
      cancellation12to24h: 97292,
      cancellation0to12h: 155667,
      extraWaitingPerHour: 20000,
      dailyRate: 145000,
    },
  ],
  terms: {
    modification: {
      "12-24h": { percentage: 150, description: "150% felár" },
      "0-12h": { percentage: 180, description: "180% felár" },
    },
    cancellation: {
      "12-24h": { percentage: 50, description: "50% kötbér" },
      "0-12h": { percentage: 80, description: "80% kötbér" },
    },
  },
};

// EcoPro Global – cián-kék – Debrecen-Budapest alapárak (2026 bruttó + módosítás/lemondás)
export const DEFAULT_ECOPRO_PRICING: Omit<PartnerPricing, "_id" | "createdAt" | "updatedAt"> = {
  partnerKey: "ecopro",
  partnerName: "EcoPro Global",
  isActive: true,
  vehicles: [
    {
      id: "skoda",
      name: "Skoda",
      capacity: "1-3 utas",
      bpBudAirport: 82550,
      dbDbAirport: null,
      newPrice2026: 92456,
      modification12to24h: 120193,
      modification0to12h: 138684,
      cancellation12to24h: 46228,
      cancellation0to12h: 73965,
      extraWaitingPerHour: 7000,
      dailyRate: 65000,
    },
    {
      id: "opel_ford",
      name: "Opel/Ford",
      capacity: "3-8 utas",
      bpBudAirport: 95250,
      dbDbAirport: null,
      newPrice2026: 106680,
      modification12to24h: 138684,
      modification0to12h: 160020,
      cancellation12to24h: 53340,
      cancellation0to12h: 85344,
      extraWaitingPerHour: 10000,
      dailyRate: 80000,
    },
    {
      id: "v_class",
      name: "V class",
      capacity: "3-7 utas",
      bpBudAirport: 127000,
      dbDbAirport: null,
      newPrice2026: 142240,
      modification12to24h: 184912,
      modification0to12h: 213360,
      cancellation12to24h: 71120,
      cancellation0to12h: 113792,
      extraWaitingPerHour: 15000,
      dailyRate: 120000,
    },
    {
      id: "s_class",
      name: "S class",
      capacity: "1-3 utas",
      bpBudAirport: 152400,
      dbDbAirport: null,
      newPrice2026: 170688,
      modification12to24h: 221894,
      modification0to12h: 256032,
      cancellation12to24h: 85344,
      cancellation0to12h: 136550,
      extraWaitingPerHour: 25000,
      dailyRate: 150000,
    },
    {
      id: "man_bus",
      name: "MAN busz",
      capacity: "Nagy csoport",
      bpBudAirport: 165100,
      dbDbAirport: null,
      newPrice2026: 184912,
      modification12to24h: 240386,
      modification0to12h: 277368,
      cancellation12to24h: 92456,
      cancellation0to12h: 147930,
      extraWaitingPerHour: 20000,
      dailyRate: 145000,
    },
  ],
  terms: {
    modification: {
      "12-24h": { percentage: 130, description: "130% felár (módosítás 12-24h)" },
      "0-12h": { percentage: 150, description: "150% extra felár (módosítás 0-12h)" },
    },
    cancellation: {
      "12-24h": { percentage: 50, description: "50% kötbér (törlés 12-24h)" },
      "0-12h": { percentage: 80, description: "80% kötbér (törlés 0-12h)" },
    },
  },
};

// Eccoino – világoskék – Debrecen-Wien és Budapest-Wien útvonalak (ÁFA nélkül)
export const DEFAULT_ECCOINO_PRICING: Omit<PartnerPricing, "_id" | "createdAt" | "updatedAt"> = {
  partnerKey: "eccoino",
  partnerName: "Eccoino",
  isActive: true,
  vehicles: [
    {
      id: "skoda_db_wien",
      name: "Skoda (Db-Wien)",
      capacity: "1-3 utas",
      bpBudAirport: 280000,
      dbDbAirport: null,
      newPrice2026: 280000,
      modification12to24h: 364000,
      modification0to12h: 420000,
      cancellation12to24h: 140000,
      cancellation0to12h: 224000,
      extraWaitingPerHour: 10000,
      dailyRate: 200000,
    },
    {
      id: "ford_db_wien",
      name: "Ford (Db-Wien)",
      capacity: "3-8 utas",
      bpBudAirport: 310000,
      dbDbAirport: null,
      newPrice2026: 310000,
      modification12to24h: 403000,
      modification0to12h: 465000,
      cancellation12to24h: 155000,
      cancellation0to12h: 248000,
      extraWaitingPerHour: 12000,
      dailyRate: 240000,
    },
    {
      id: "mercedes_db_wien",
      name: "Mercedes (Db-Wien)",
      capacity: "3-7 utas",
      bpBudAirport: 340000,
      dbDbAirport: null,
      newPrice2026: 340000,
      modification12to24h: 442000,
      modification0to12h: 510000,
      cancellation12to24h: 170000,
      cancellation0to12h: 272000,
      extraWaitingPerHour: 15000,
      dailyRate: 280000,
    },
    {
      id: "skoda_bp_wien",
      name: "Skoda (Bp-Wien)",
      capacity: "1-3 utas",
      bpBudAirport: 220000,
      dbDbAirport: null,
      newPrice2026: 220000,
      modification12to24h: 286000,
      modification0to12h: 330000,
      cancellation12to24h: 110000,
      cancellation0to12h: 176000,
      extraWaitingPerHour: 10000,
      dailyRate: 180000,
    },
    {
      id: "ford_bp_wien",
      name: "Ford (Bp-Wien)",
      capacity: "3-8 utas",
      bpBudAirport: 250000,
      dbDbAirport: null,
      newPrice2026: 250000,
      modification12to24h: 325000,
      modification0to12h: 375000,
      cancellation12to24h: 125000,
      cancellation0to12h: 200000,
      extraWaitingPerHour: 12000,
      dailyRate: 200000,
    },
    {
      id: "mercedes_bp_wien",
      name: "Mercedes (Bp-Wien)",
      capacity: "3-7 utas",
      bpBudAirport: 280000,
      dbDbAirport: null,
      newPrice2026: 280000,
      modification12to24h: 364000,
      modification0to12h: 420000,
      cancellation12to24h: 140000,
      cancellation0to12h: 224000,
      extraWaitingPerHour: 15000,
      dailyRate: 230000,
    },
  ],
  terms: {
    modification: {
      "12-24h": { percentage: 130, description: "130% felár (módosítás 12-24h)" },
      "0-12h": { percentage: 150, description: "150% extra felár (módosítás 0-12h)" },
    },
    cancellation: {
      "12-24h": { percentage: 50, description: "50% kötbér (törlés 12-24h)" },
      "0-12h": { percentage: 80, description: "80% kötbér (törlés 0-12h)" },
    },
  },
};

// Vitesco – piros – Debrecen-Budapest nettó/bruttó
export const DEFAULT_VITESCO_PRICING: Omit<PartnerPricing, "_id" | "createdAt" | "updatedAt"> = {
  partnerKey: "vitesco",
  partnerName: "Vitesco Technologies",
  isActive: true,
  vehicles: [
    {
      id: "skoda",
      name: "Skoda",
      capacity: "1-3 utas",
      bpBudAirport: 76200,
      dbDbAirport: null,
      newPrice2026: 60000,
      modification12to24h: 76200,
      modification0to12h: 76200,
      cancellation12to24h: 30000,
      cancellation0to12h: 60000,
      extraWaitingPerHour: 7000,
      dailyRate: 60000,
    },
    {
      id: "opel_ford",
      name: "Opel/Ford",
      capacity: "3-8 utas",
      bpBudAirport: 95250,
      dbDbAirport: null,
      newPrice2026: 75000,
      modification12to24h: 95250,
      modification0to12h: 95250,
      cancellation12to24h: 37500,
      cancellation0to12h: 75000,
      extraWaitingPerHour: 10000,
      dailyRate: 75000,
    },
    {
      id: "v_class",
      name: "V class",
      capacity: "3-7 utas",
      bpBudAirport: 127000,
      dbDbAirport: null,
      newPrice2026: 100000,
      modification12to24h: 127000,
      modification0to12h: 127000,
      cancellation12to24h: 50000,
      cancellation0to12h: 100000,
      extraWaitingPerHour: 15000,
      dailyRate: 100000,
    },
    {
      id: "s_class",
      name: "S class",
      capacity: "1-3 utas",
      bpBudAirport: 152400,
      dbDbAirport: null,
      newPrice2026: 120000,
      modification12to24h: 152400,
      modification0to12h: 152400,
      cancellation12to24h: 60000,
      cancellation0to12h: 120000,
      extraWaitingPerHour: 25000,
      dailyRate: 120000,
    },
    {
      id: "man_bus",
      name: "MAN busz",
      capacity: "Nagy csoport",
      bpBudAirport: 165100,
      dbDbAirport: null,
      newPrice2026: 130000,
      modification12to24h: 165100,
      modification0to12h: 165100,
      cancellation12to24h: 65000,
      cancellation0to12h: 130000,
      extraWaitingPerHour: 20000,
      dailyRate: 130000,
    },
  ],
  terms: {
    modification: {
      "12-24h": { percentage: 130, description: "130% felár (módosítás 12-24h)" },
      "0-12h": { percentage: 150, description: "150% extra felár (módosítás 0-12h)" },
    },
    cancellation: {
      "12-24h": { percentage: 50, description: "50% kötbér (törlés 12-24h)" },
      "0-12h": { percentage: 80, description: "80% kötbér (törlés 0-12h)" },
    },
  },
};

// Schaeffler – zöld – Debrecen-Budapest nettó/bruttó
export const DEFAULT_SCHAEFFLER_PRICING: Omit<PartnerPricing, "_id" | "createdAt" | "updatedAt"> = {
  partnerKey: "schaeffler",
  partnerName: "Schaeffler",
  isActive: true,
  vehicles: [
    {
      id: "skoda",
      name: "Skoda",
      capacity: "1-3 utas",
      bpBudAirport: 76200,
      dbDbAirport: null,
      newPrice2026: 60000,
      modification12to24h: 76200,
      modification0to12h: 76200,
      cancellation12to24h: 30000,
      cancellation0to12h: 60000,
      extraWaitingPerHour: 7000,
      dailyRate: 60000,
    },
    {
      id: "opel_ford",
      name: "Opel/Ford",
      capacity: "3-8 utas",
      bpBudAirport: 95250,
      dbDbAirport: null,
      newPrice2026: 75000,
      modification12to24h: 95250,
      modification0to12h: 95250,
      cancellation12to24h: 37500,
      cancellation0to12h: 75000,
      extraWaitingPerHour: 10000,
      dailyRate: 75000,
    },
    {
      id: "v_class",
      name: "V class",
      capacity: "3-7 utas",
      bpBudAirport: 127000,
      dbDbAirport: null,
      newPrice2026: 100000,
      modification12to24h: 127000,
      modification0to12h: 127000,
      cancellation12to24h: 50000,
      cancellation0to12h: 100000,
      extraWaitingPerHour: 15000,
      dailyRate: 100000,
    },
    {
      id: "s_class",
      name: "S class",
      capacity: "1-3 utas",
      bpBudAirport: 152400,
      dbDbAirport: null,
      newPrice2026: 120000,
      modification12to24h: 152400,
      modification0to12h: 152400,
      cancellation12to24h: 60000,
      cancellation0to12h: 120000,
      extraWaitingPerHour: 25000,
      dailyRate: 120000,
    },
    {
      id: "man_bus",
      name: "MAN busz",
      capacity: "Nagy csoport",
      bpBudAirport: 165100,
      dbDbAirport: null,
      newPrice2026: 130000,
      modification12to24h: 165100,
      modification0to12h: 165100,
      cancellation12to24h: 65000,
      cancellation0to12h: 130000,
      extraWaitingPerHour: 20000,
      dailyRate: 130000,
    },
  ],
  terms: {
    modification: {
      "12-24h": { percentage: 130, description: "130% felár (módosítás 12-24h)" },
      "0-12h": { percentage: 150, description: "150% extra felár (módosítás 0-12h)" },
    },
    cancellation: {
      "12-24h": { percentage: 50, description: "50% kötbér (törlés 12-24h)" },
      "0-12h": { percentage: 80, description: "80% kötbér (törlés 0-12h)" },
    },
  },
};

// Krones – sötétkék – Db-Db és Debrecen-Budapest (utalás)
export const DEFAULT_KRONES_PRICING: Omit<PartnerPricing, "_id" | "createdAt" | "updatedAt"> = {
  partnerKey: "krones",
  partnerName: "Krones AG",
  isActive: true,
  vehicles: [
    {
      id: "skoda",
      name: "Skoda",
      capacity: "1-3 utas",
      bpBudAirport: 60000,
      dbDbAirport: 15000,
      newPrice2026: 76200,
      modification12to24h: 76200,
      modification0to12h: 76200,
      cancellation12to24h: 38100,
      cancellation0to12h: 60960,
      extraWaitingPerHour: 7000,
      dailyRate: 60000,
    },
    {
      id: "opel_ford",
      name: "Opel/Ford",
      capacity: "3-8 utas",
      bpBudAirport: 75000,
      dbDbAirport: 18000,
      newPrice2026: 95250,
      modification12to24h: 95250,
      modification0to12h: 95250,
      cancellation12to24h: 47625,
      cancellation0to12h: 76200,
      extraWaitingPerHour: 10000,
      dailyRate: 75000,
    },
    {
      id: "v_class",
      name: "V class",
      capacity: "3-7 utas",
      bpBudAirport: 100000,
      dbDbAirport: 25000,
      newPrice2026: 127000,
      modification12to24h: 127000,
      modification0to12h: 127000,
      cancellation12to24h: 63500,
      cancellation0to12h: 101600,
      extraWaitingPerHour: 15000,
      dailyRate: 100000,
    },
    {
      id: "s_class",
      name: "S class",
      capacity: "1-3 utas",
      bpBudAirport: 120000,
      dbDbAirport: 40000,
      newPrice2026: 152400,
      modification12to24h: 152400,
      modification0to12h: 152400,
      cancellation12to24h: 76200,
      cancellation0to12h: 121920,
      extraWaitingPerHour: 25000,
      dailyRate: 120000,
    },
    {
      id: "man_bus",
      name: "MAN busz",
      capacity: "Nagy csoport",
      bpBudAirport: 130000,
      dbDbAirport: 45000,
      newPrice2026: 165100,
      modification12to24h: 165100,
      modification0to12h: 165100,
      cancellation12to24h: 82550,
      cancellation0to12h: 132080,
      extraWaitingPerHour: 20000,
      dailyRate: 130000,
    },
  ],
  terms: {
    modification: {
      "12-24h": { percentage: 100, description: "Nincs felár (módosítás 12-24h)" },
      "0-12h": { percentage: 100, description: "Nincs felár (módosítás 0-12h)" },
    },
    cancellation: {
      "12-24h": { percentage: 50, description: "50% kötbér (törlés 12-24h)" },
      "0-12h": { percentage: 80, description: "80% kötbér (törlés 0-12h)" },
    },
  },
};

// Enter Air – fehér-kék – Eurós csoportárak több útvonalra
export const DEFAULT_ENTERAIR_PRICING: Omit<PartnerPricing, "_id" | "createdAt" | "updatedAt"> = {
  partnerKey: "enterair",
  partnerName: "Enter Air",
  isActive: true,
  vehicles: [
    {
      id: "kis_csoport_db_nv",
      name: "1-3 fő (Db-Nv)",
      capacity: "1-3 utas",
      bpBudAirport: 90,
      dbDbAirport: null,
      newPrice2026: 99,
      modification12to24h: 99,
      modification0to12h: 99,
      cancellation12to24h: 50,
      cancellation0to12h: 80,
      extraWaitingPerHour: 15,
      dailyRate: 300,
    },
    {
      id: "nagy_csoport_db_nv",
      name: "4-8 fő (Db-Nv)",
      capacity: "4-8 utas",
      bpBudAirport: 120,
      dbDbAirport: null,
      newPrice2026: 132,
      modification12to24h: 132,
      modification0to12h: 132,
      cancellation12to24h: 66,
      cancellation0to12h: 106,
      extraWaitingPerHour: 20,
      dailyRate: 400,
    },
    {
      id: "nagybusz_db_nv",
      name: "Nagybusz (Db-Nv)",
      capacity: "Nagy csoport",
      bpBudAirport: 200,
      dbDbAirport: null,
      newPrice2026: 220,
      modification12to24h: 220,
      modification0to12h: 220,
      cancellation12to24h: 110,
      cancellation0to12h: 176,
      extraWaitingPerHour: 30,
      dailyRate: 600,
    },
    {
      id: "kis_csoport_db_bp",
      name: "1-3 fő (Db-Bp)",
      capacity: "1-3 utas",
      bpBudAirport: 200,
      dbDbAirport: null,
      newPrice2026: 220,
      modification12to24h: 220,
      modification0to12h: 220,
      cancellation12to24h: 110,
      cancellation0to12h: 176,
      extraWaitingPerHour: 15,
      dailyRate: 400,
    },
    {
      id: "nagy_csoport_db_bp",
      name: "4-8 fő (Db-Bp)",
      capacity: "4-8 utas",
      bpBudAirport: 300,
      dbDbAirport: null,
      newPrice2026: 330,
      modification12to24h: 330,
      modification0to12h: 330,
      cancellation12to24h: 165,
      cancellation0to12h: 264,
      extraWaitingPerHour: 20,
      dailyRate: 600,
    },
    {
      id: "nagybusz_db_bp",
      name: "Nagybusz (Db-Bp)",
      capacity: "Nagy csoport",
      bpBudAirport: 500,
      dbDbAirport: null,
      newPrice2026: 550,
      modification12to24h: 550,
      modification0to12h: 550,
      cancellation12to24h: 275,
      cancellation0to12h: 440,
      extraWaitingPerHour: 30,
      dailyRate: 1000,
    },
    {
      id: "kis_csoport_db_db",
      name: "1-3 fő (Db-Db)",
      capacity: "1-3 utas",
      bpBudAirport: 25,
      dbDbAirport: 25,
      newPrice2026: 28,
      modification12to24h: 28,
      modification0to12h: 28,
      cancellation12to24h: 14,
      cancellation0to12h: 22,
      extraWaitingPerHour: 10,
      dailyRate: 80,
    },
    {
      id: "nagy_csoport_db_db",
      name: "4-8 fő (Db-Db)",
      capacity: "4-8 utas",
      bpBudAirport: 40,
      dbDbAirport: 40,
      newPrice2026: 44,
      modification12to24h: 44,
      modification0to12h: 44,
      cancellation12to24h: 22,
      cancellation0to12h: 35,
      extraWaitingPerHour: 15,
      dailyRate: 120,
    },
    {
      id: "nagybusz_db_db",
      name: "Nagybusz (Db-Db)",
      capacity: "Nagy csoport",
      bpBudAirport: 70,
      dbDbAirport: 70,
      newPrice2026: 77,
      modification12to24h: 77,
      modification0to12h: 77,
      cancellation12to24h: 39,
      cancellation0to12h: 62,
      extraWaitingPerHour: 20,
      dailyRate: 200,
    },
    {
      id: "kis_csoport_db_kassa",
      name: "1-3 fő (Db-Kassa)",
      capacity: "1-3 utas",
      bpBudAirport: 300,
      dbDbAirport: null,
      newPrice2026: 330,
      modification12to24h: 330,
      modification0to12h: 330,
      cancellation12to24h: 165,
      cancellation0to12h: 264,
      extraWaitingPerHour: 15,
      dailyRate: 500,
    },
    {
      id: "nagy_csoport_db_kassa",
      name: "4-8 fő (Db-Kassa)",
      capacity: "4-8 utas",
      bpBudAirport: 400,
      dbDbAirport: null,
      newPrice2026: 440,
      modification12to24h: 440,
      modification0to12h: 440,
      cancellation12to24h: 220,
      cancellation0to12h: 352,
      extraWaitingPerHour: 20,
      dailyRate: 700,
    },
    {
      id: "nagybusz_db_kassa",
      name: "Nagybusz (Db-Kassa)",
      capacity: "Nagy csoport",
      bpBudAirport: 600,
      dbDbAirport: null,
      newPrice2026: 660,
      modification12to24h: 660,
      modification0to12h: 660,
      cancellation12to24h: 330,
      cancellation0to12h: 528,
      extraWaitingPerHour: 30,
      dailyRate: 1100,
    },
  ],
  terms: {
    modification: {
      "12-24h": { percentage: 100, description: "Nincs felár (módosítás 12-24h)" },
      "0-12h": { percentage: 110, description: "110% felár (módosítás 0-12h)" },
    },
    cancellation: {
      "12-24h": { percentage: 50, description: "50% kötbér (törlés 12-24h)" },
      "0-12h": { percentage: 80, description: "80% kötbér (törlés 0-12h)" },
    },
  },
  meta: { currency: "EUR", note: "plusz 25 EUR Debrecen 20 km-es körzetén túl" },
};

// Tama – zöld – Debrecen-B.újfalu, Debrecen-Budapest, Budapest-B.újfalu
export const DEFAULT_TAMA_PRICING: Omit<PartnerPricing, "_id" | "createdAt" | "updatedAt"> = {
  partnerKey: "tama",
  partnerName: "Tama",
  isActive: true,
  vehicles: [
    {
      id: "skoda",
      name: "Skoda",
      capacity: "1-3 utas",
      bpBudAirport: 76881,
      dbDbAirport: 26815,
      newPrice2026: 81788,
      modification12to24h: 81788,
      modification0to12h: 81788,
      cancellation12to24h: 40894,
      cancellation0to12h: 65430,
      extraWaitingPerHour: 7000,
      dailyRate: 60000,
    },
    {
      id: "opel_ford",
      name: "Opel/Ford",
      capacity: "3-8 utas",
      bpBudAirport: 98146,
      dbDbAirport: 34701,
      newPrice2026: 106324,
      modification12to24h: 106324,
      modification0to12h: 106324,
      cancellation12to24h: 53162,
      cancellation0to12h: 85059,
      extraWaitingPerHour: 10000,
      dailyRate: 78000,
    },
    {
      id: "v_class",
      name: "V class",
      capacity: "3-7 utas",
      bpBudAirport: 130861,
      dbDbAirport: 47320,
      newPrice2026: 139040,
      modification12to24h: 139040,
      modification0to12h: 139040,
      cancellation12to24h: 69520,
      cancellation0to12h: 111232,
      extraWaitingPerHour: 15000,
      dailyRate: 110000,
    },
    {
      id: "s_class",
      name: "S class",
      capacity: "1-3 utas",
      bpBudAirport: 147218,
      dbDbAirport: 63094,
      newPrice2026: 155397,
      modification12to24h: 155397,
      modification0to12h: 155397,
      cancellation12to24h: 77699,
      cancellation0to12h: 124318,
      extraWaitingPerHour: 25000,
      dailyRate: 130000,
    },
    {
      id: "man_bus",
      name: "MAN busz",
      capacity: "Nagy csoport",
      bpBudAirport: 147218,
      dbDbAirport: 39434,
      newPrice2026: 155397,
      modification12to24h: 155397,
      modification0to12h: 155397,
      cancellation12to24h: 77699,
      cancellation0to12h: 124318,
      extraWaitingPerHour: 20000,
      dailyRate: 130000,
    },
  ],
  terms: {
    modification: {
      "12-24h": { percentage: 100, description: "Nincs felár (módosítás 12-24h)" },
      "0-12h": { percentage: 100, description: "Nincs felár (módosítás 0-12h)" },
    },
    cancellation: {
      "12-24h": { percentage: 50, description: "50% kötbér (törlés 12-24h)" },
      "0-12h": { percentage: 80, description: "80% kötbér (törlés 0-12h)" },
    },
  },
};

// NI - sárga - standard transzfer és VIP Mercedes tarifák
export const DEFAULT_NI_PRICING: Omit<PartnerPricing, "_id" | "createdAt" | "updatedAt"> = {
  partnerKey: "ni",
  partnerName: "NI",
  isActive: true,
  vehicles: [],
  terms: {
    modification: {
      "12-24h": { percentage: 100, description: "Egyedi egyeztetés szerint" },
      "0-12h": { percentage: 100, description: "Egyedi egyeztetés szerint" },
    },
    cancellation: {
      "12-24h": { percentage: 100, description: "Egyedi egyeztetés szerint" },
      "0-12h": { percentage: 100, description: "Egyedi egyeztetés szerint" },
    },
  },
  meta: {
    currency: "HUF",
    pricingModel: "ni",
    standardTransfers: [
      {
        origin: "Debrecen es vonzaskorzete",
        destination: "Budapest Liszt Ferenc Nemzetkozi Repuloter",
        oldNet: 24558,
        currentNet: 31925,
        grossOnePerson: 40545,
        twoPersonNetTotal: 57466,
        twoPersonNetPerPerson: 28733,
        twoPersonGrossPerPerson: 36491,
        threePersonNetTotal: 81411,
        threePersonNetPerPerson: 27137,
        threePersonGrossPerPerson: 34464,
        fourPlusGrossPerPerson: 34464,
      },
      {
        origin: "Debrecen es vonzaskorzete",
        destination: "Budapest Belvaros",
        oldNet: 27425,
        currentNet: 35653,
        grossOnePerson: 45279,
        twoPersonNetTotal: 64176,
        twoPersonNetPerPerson: 32088,
        twoPersonGrossPerPerson: 40752,
        threePersonNetTotal: 90915,
        threePersonNetPerPerson: 30305,
        threePersonGrossPerPerson: 38487,
        fourPlusGrossPerPerson: 38487,
      },
      {
        origin: "Nyiregyhaza es vonzaskorzete",
        destination: "Budapest Liszt Ferenc Nemzetkozi Repuloter",
        oldNet: 28672,
        currentNet: 37273,
        grossOnePerson: 47337,
        twoPersonNetTotal: 67092,
        twoPersonNetPerPerson: 33546,
        twoPersonGrossPerPerson: 42603,
        threePersonNetTotal: 95046,
        threePersonNetPerPerson: 31682,
        threePersonGrossPerPerson: 40236,
        fourPlusGrossPerPerson: 40236,
      },
      {
        origin: "Nyiregyhaza es vonzaskorzete",
        destination: "Budapest Belvaros",
        oldNet: 31165,
        currentNet: 40515,
        grossOnePerson: 51544,
        twoPersonNetTotal: 72926,
        twoPersonNetPerPerson: 36463,
        twoPersonGrossPerPerson: 46308,
        threePersonNetTotal: 103311,
        threePersonNetPerPerson: 34437,
        threePersonGrossPerPerson: 43735,
        fourPlusGrossPerPerson: 43735,
      },
      {
        origin: "Miskolc es vonzaskorzete",
        destination: "Budapest Liszt Ferenc Nemzetkozi Repuloter",
        oldNet: 27425,
        currentNet: 35653,
        grossOnePerson: 45279,
        twoPersonNetTotal: 64176,
        twoPersonNetPerPerson: 32088,
        twoPersonGrossPerPerson: 40752,
        threePersonNetTotal: 90915,
        threePersonNetPerPerson: 30305,
        threePersonGrossPerPerson: 38487,
        fourPlusGrossPerPerson: 38487,
      },
      {
        origin: "Miskolc es vonzaskorzete",
        destination: "Budapest Belvaros",
        oldNet: 32412,
        currentNet: 42135,
        grossOnePerson: 53511,
        twoPersonNetTotal: 75844,
        twoPersonNetPerPerson: 37922,
        twoPersonGrossPerPerson: 48161,
        threePersonNetTotal: 107445,
        threePersonNetPerPerson: 35815,
        threePersonGrossPerPerson: 45485,
        fourPlusGrossPerPerson: 45485,
      },
    ],
    vipVClass: [
      {
        origin: "Debrecen es vonzaskorzete",
        destination: "Budapest Liszt Ferenc Nemzetkozi Repuloter",
        oldNet: 83563,
        currentNet: 91919,
        gross: 116737,
      },
      {
        origin: "Miskolc, Nyiregyhaza",
        destination: "Budapest Liszt Ferenc Nemzetkozi Repuloter",
        oldNet: 89796,
        currentNet: 98776,
        gross: 125446,
      },
      {
        origin: "Debrecen",
        destination: "Budapest Belvaros",
        oldNet: 89796,
        currentNet: 98776,
        gross: 125446,
      },
      {
        origin: "Miskolc, Nyiregyhaza",
        destination: "Budapest Belvaros",
        oldNet: 96029,
        currentNet: 105632,
        gross: 134153,
      },
    ],
    vipSClass: [
      {
        origin: "Debrecen es vonzaskorzete",
        destination: "Budapest Liszt Ferenc Nemzetkozi Repuloter",
        oldNet: 84796,
        currentNet: 93276,
        gross: 118461,
      },
      {
        origin: "Miskolc, Nyiregyhaza",
        destination: "Budapest Liszt Ferenc Nemzetkozi Repuloter",
        oldNet: 91029,
        currentNet: 100132,
        gross: 127168,
      },
      {
        origin: "Debrecen",
        destination: "Budapest Belvaros",
        oldNet: 91029,
        currentNet: 100132,
        gross: 127168,
      },
      {
        origin: "Miskolc, Nyiregyhaza",
        destination: "Budapest Belvaros",
        oldNet: 97262,
        currentNet: 106988,
        gross: 135875,
      },
    ],
  },
};

// Map of all default pricing data
const DEFAULT_PRICING_MAP: Record<string, Omit<PartnerPricing, "_id" | "createdAt" | "updatedAt">> = {
  catl: DEFAULT_CATL_PRICING,
  ecopro: DEFAULT_ECOPRO_PRICING,
  eccoino: DEFAULT_ECCOINO_PRICING,
  vitesco: DEFAULT_VITESCO_PRICING,
  schaeffler: DEFAULT_SCHAEFFLER_PRICING,
  krones: DEFAULT_KRONES_PRICING,
  enterair: DEFAULT_ENTERAIR_PRICING,
  tama: DEFAULT_TAMA_PRICING,
  ni: DEFAULT_NI_PRICING,
};

// ============================================================
// DATABASE FUNCTIONS
// ============================================================

export async function getPricingCollection() {
  return getCollection<PartnerPricing>(COLLECTION_NAME);
}

export async function initPricingIndexes() {
  const collection = await getPricingCollection();
  try {
    await collection.createIndex({ partnerKey: 1 }, { unique: true });
  } catch {
    // ignore
  }
}

export async function getAllPartnerPricing(): Promise<PartnerPricing[]> {
  const collection = await getPricingCollection();
  await initPricingIndexes();
  const docs = await collection.find({}).sort({ updatedAt: -1 }).toArray();
  return docs.map((d) => ({ ...d, _id: d._id.toString() }) as unknown as PartnerPricing);
}

export async function getPartnerPricingByKey(
  partnerKey: string,
  { seedIfMissing = true }: { seedIfMissing?: boolean } = {}
): Promise<PartnerPricing | null> {
  const collection = await getPricingCollection();
  await initPricingIndexes();
  const existing = (await collection.findOne({ partnerKey })) as PartnerPricing | null;
  if (existing) return existing;

  if (seedIfMissing && DEFAULT_PRICING_MAP[partnerKey]) {
    const now = Date.now();
    const seed: PartnerPricing = {
      ...DEFAULT_PRICING_MAP[partnerKey],
      createdAt: now,
      updatedAt: now,
    };
    const res = await collection.insertOne(seed as any);
    const created = (await collection.findOne({ _id: res.insertedId })) as PartnerPricing | null;
    return created;
  }

  return null;
}

export async function createPartnerPricing(
  data: Omit<PartnerPricing, "_id" | "createdAt" | "updatedAt">
): Promise<PartnerPricing> {
  const collection = await getPricingCollection();
  await initPricingIndexes();
  const now = Date.now();
  const doc: PartnerPricing = {
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  const res = await collection.insertOne(doc as any);
  const created = (await collection.findOne({ _id: res.insertedId })) as PartnerPricing | null;
  if (!created) throw new Error("Nem sikerült létrehozni a pricing rekordot.");
  return created;
}

export async function updatePartnerPricing(
  partnerKey: string,
  patch: Partial<Omit<PartnerPricing, "_id" | "createdAt" | "partnerKey">>
): Promise<PartnerPricing | null> {
  const collection = await getPricingCollection();
  await initPricingIndexes();
  const existing = (await collection.findOne({ partnerKey })) as PartnerPricing | null;
  if (!existing) {
    const now = Date.now();
    const defaultData = DEFAULT_PRICING_MAP[partnerKey];
    if (defaultData) {
      const seed: PartnerPricing = {
        ...defaultData,
        ...patch,
        partnerKey,
        createdAt: now,
        updatedAt: now,
      };
      const res = await collection.insertOne(seed as any);
      return (await collection.findOne({ _id: res.insertedId })) as PartnerPricing | null;
    }
    return null;
  }
  await collection.updateOne(
    { partnerKey },
    {
      $set: {
        ...patch,
        updatedAt: Date.now(),
      },
    }
  );
  return (await collection.findOne({ partnerKey })) as PartnerPricing | null;
}

export async function deletePartnerPricing(partnerKey: string): Promise<boolean> {
  const collection = await getPricingCollection();
  const res = await collection.deleteOne({ partnerKey });
  return res.deletedCount > 0;
}

export function pricingToLegacyFormat(pricing: PartnerPricing) {
  const pricingMap: Record<string, PricingVehicle> = {};
  for (const v of pricing.vehicles) pricingMap[v.id] = v;
  const prices = pricing.vehicles.map((v) => v.newPrice2026);
  return {
    pricing: pricingMap,
    terms: pricing.terms,
    count: pricing.vehicles.length,
    minPrice: prices.length ? Math.min(...prices) : 0,
    maxPrice: prices.length ? Math.max(...prices) : 0,
  };
}
