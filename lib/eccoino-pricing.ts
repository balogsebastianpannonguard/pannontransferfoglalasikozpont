export interface EccoinoVehiclePricing {
  id: string;
  name: string;
  capacity: string;
  bpWien: number;
  newPrice2026: number;
  modification12to24h: number;
  modification0to12h: number;
  cancellation12to24h: number;
  cancellation0to12h: number;
  extraWaitingPerHour: number;
  dailyRate: number;
}

export interface PricingVehicle extends EccoinoVehiclePricing {}

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
  _id?: unknown;
  partnerKey: string;
  partnerName: string;
  isActive: boolean;
  vehicles: PricingVehicle[];
  terms: PricingTerms;
  meta?: Record<string, unknown>;
  createdAt?: number;
  updatedAt?: number;
}

export const ECCOINO_PRICING: Record<string, PricingVehicle> = {
  skoda: {
    id: "skoda",
    name: "Skoda",
    capacity: "1-3 passenger",
    bpWien: 55000,
    newPrice2026: 62000,
    modification12to24h: 77000,
    modification0to12h: 88000,
    cancellation12to24h: 30250,
    cancellation0to12h: 46750,
    extraWaitingPerHour: 6000,
    dailyRate: 55000,
  },
  opel_ford: {
    id: "opel_ford",
    name: "Opel/Ford",
    capacity: "3-8 passenger",
    bpWien: 80000,
    newPrice2026: 90000,
    modification12to24h: 112000,
    modification0to12h: 128000,
    cancellation12to24h: 44000,
    cancellation0to12h: 68000,
    extraWaitingPerHour: 9000,
    dailyRate: 80000,
  },
  v_class: {
    id: "v_class",
    name: "V class",
    capacity: "3-7 passenger",
    bpWien: 110000,
    newPrice2026: 125000,
    modification12to24h: 154000,
    modification0to12h: 176000,
    cancellation12to24h: 60500,
    cancellation0to12h: 93500,
    extraWaitingPerHour: 13000,
    dailyRate: 110000,
  },
  s_class: {
    id: "s_class",
    name: "S class",
    capacity: "1-3 passenger",
    bpWien: 140000,
    newPrice2026: 160000,
    modification12to24h: 196000,
    modification0to12h: 224000,
    cancellation12to24h: 77000,
    cancellation0to12h: 119000,
    extraWaitingPerHour: 20000,
    dailyRate: 140000,
  },
  man_bus: {
    id: "man_bus",
    name: "MAN busz",
    capacity: "Large group",
    bpWien: 160000,
    newPrice2026: 180000,
    modification12to24h: 224000,
    modification0to12h: 256000,
    cancellation12to24h: 88000,
    cancellation0to12h: 136000,
    extraWaitingPerHour: 18000,
    dailyRate: 160000,
  },
};

export const ECCOINO_TERMS: PricingTerms = {
  modification: {
    "12-24h": { percentage: 140, description: "140% felár" },
    "0-12h": { percentage: 160, description: "160% felár" },
  },
  cancellation: {
    "12-24h": { percentage: 55, description: "55% kötbér" },
    "0-12h": { percentage: 85, description: "85% kötbér" },
  },
};

export const ECCOINO_VEHICLE_COUNT = 5;
export const ECCOINO_MIN_PRICE = 55000;
export const ECCOINO_MAX_PRICE = 180000;

export function formatHuf(amount: number): string {
  return new Intl.NumberFormat("hu-HU", {
    style: "currency",
    currency: "HUF",
    maximumFractionDigits: 0,
  }).format(amount);
}
