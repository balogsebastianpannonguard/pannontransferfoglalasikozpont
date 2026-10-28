import { getCollection } from "./db";
import type { ObjectId } from "mongodb";
import { PARTNER_PORTAL_ORDER } from "./partner-pricing-config";

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
  partnerName: "CATL",
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

// Ecopro Innovation – cián-kék – Debrecen-Budapest alapárak
export const DEFAULT_ECOPROINNOVATION_PRICING: Omit<PartnerPricing, "_id" | "createdAt" | "updatedAt"> = {
  partnerKey: "ecoproinnovation",
  partnerName: "Ecopro Innovation",
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

// Ecopro BM – cián-kék – Debrecen-Budapest alapárak
export const DEFAULT_ECOPROBM_PRICING: Omit<PartnerPricing, "_id" | "createdAt" | "updatedAt"> = {
  partnerKey: "ecoprobm",
  partnerName: "Ecopro BM",
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

// Schaeffler Motion – zöld – Debrecen-Budapest nettó/bruttó
export const DEFAULT_SCHAEFFLERMOTION_PRICING: Omit<PartnerPricing, "_id" | "createdAt" | "updatedAt"> = {
  partnerKey: "schaefflermotion",
  partnerName: "Schaeffler Motion",
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

// Schaeffler Debrecen – zöld – Debrecen-Budapest nettó/bruttó
export const DEFAULT_SCHAEFFLERDEBRECEN_PRICING: Omit<PartnerPricing, "_id" | "createdAt" | "updatedAt"> = {
  partnerKey: "schaefflerdebrecen",
  partnerName: "Schaeffler Debrecen",
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

// IBUSZ Hungary Kft. – vállalati transzferárak (Schaeffler-alapú induló árlista)
export const DEFAULT_IBUSZ_PRICING: Omit<PartnerPricing, "_id" | "createdAt" | "updatedAt"> = {
  partnerKey: "ibusz",
  partnerName: "IBUSZ Hungary Kft.",
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

// Tama – zöld – Debrecen-B.újfalu, Debrecen-Budapest, Budapest-B.újfalu
export const DEFAULT_TAMA_PRICING: Omit<PartnerPricing, "_id" | "createdAt" | "updatedAt"> = {
  partnerKey: "tama",
  partnerName: "TAMA Hungary Kft.",
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
  ecoproinnovation: DEFAULT_ECOPROINNOVATION_PRICING,
  ecoprobm: DEFAULT_ECOPROBM_PRICING,
  schaefflermotion: DEFAULT_SCHAEFFLERMOTION_PRICING,
  schaefflerdebrecen: DEFAULT_SCHAEFFLERDEBRECEN_PRICING,
  ibusz: DEFAULT_IBUSZ_PRICING,
  tama: DEFAULT_TAMA_PRICING,
  ni: DEFAULT_NI_PRICING,
};

export function getDefaultPartnerPricingRecords(): PartnerPricing[] {
  const now = Date.now();
  return PARTNER_PORTAL_ORDER.map((partnerKey) => {
    const source = DEFAULT_PRICING_MAP[partnerKey];
    return {
      ...source,
      createdAt: now,
      updatedAt: now,
    };
  });
}

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
  const docs = await collection
    .find({ partnerKey: { $in: PARTNER_PORTAL_ORDER } })
    .sort({ updatedAt: -1 })
    .toArray();
  return docs.map(
    (d) =>
      ({
        ...d,
        _id: d._id.toString(),
        partnerName: DEFAULT_PRICING_MAP[d.partnerKey]?.partnerName ?? d.partnerName,
      }) as unknown as PartnerPricing
  );
}

export async function ensureDefaultPartnerPricing() {
  await Promise.all(
    PARTNER_PORTAL_ORDER.map((partnerKey) =>
      getPartnerPricingByKey(partnerKey, { seedIfMissing: true })
    )
  );
}

export async function getAllPartnerPricingWithDefaults(): Promise<PartnerPricing[]> {
  await ensureDefaultPartnerPricing();
  return getAllPartnerPricing();
}

export async function getPartnerPricingByKey(
  partnerKey: string,
  { seedIfMissing = true }: { seedIfMissing?: boolean } = {}
): Promise<PartnerPricing | null> {
  const collection = await getPricingCollection();
  await initPricingIndexes();
  const existing = (await collection.findOne({ partnerKey })) as PartnerPricing | null;
  if (existing) {
    const canonicalName = DEFAULT_PRICING_MAP[partnerKey]?.partnerName;
    return canonicalName ? { ...existing, partnerName: canonicalName } : existing;
  }

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
