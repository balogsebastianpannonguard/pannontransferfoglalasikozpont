export interface PartnerPortalConfig {
  key: string;
  name: string;
  shortLabel: string;
  color: string;
  colorSecondary: string;
  textColor: string;
  description: string;
  currency: string;
  tag: string;
}

export const PARTNER_PORTAL_CONFIGS: Record<string, PartnerPortalConfig> = {
  catl: {
    key: "catl",
    name: "CATL",
    shortLabel: "CATL",
    color: "#0047BA",
    colorSecondary: "#00B4D8",
    textColor: "#0047BA",
    description: "Delegacios es dolgozoi transzferekhez kotott egyedi vallalati szerzodes.",
    currency: "HUF",
    tag: "Enterprise",
  },
  ecoproinnovation: {
    key: "ecoproinnovation",
    name: "Ecopro Innovation",
    shortLabel: "EI",
    color: "#00B4D8",
    colorSecondary: "#0096B4",
    textColor: "#006E8A",
    description: "Debrecen-Budapest es repuloteri transzferek, 130%/150% modositasi feltetelekkel.",
    currency: "HUF",
    tag: "Ipari",
  },
  ecoprobm: {
    key: "ecoprobm",
    name: "Ecopro BM",
    shortLabel: "EB",
    color: "#00B4D8",
    colorSecondary: "#0096B4",
    textColor: "#006E8A",
    description: "Debrecen-Budapest es repuloteri transzferek, 130%/150% modositasi feltetelekkel.",
    currency: "HUF",
    tag: "Ipari",
  },
  schaefflermotion: {
    key: "schaefflermotion",
    name: "Schaeffler Motion",
    shortLabel: "SM",
    color: "#009A44",
    colorSecondary: "#007A35",
    textColor: "#007A35",
    description: "Debrecen-Budapest netto es brutto vallalati transzferarak.",
    currency: "HUF",
    tag: "Autoipar",
  },
  schaefflerdebrecen: {
    key: "schaefflerdebrecen",
    name: "Schaeffler Debrecen",
    shortLabel: "SD",
    color: "#009A44",
    colorSecondary: "#007A35",
    textColor: "#007A35",
    description: "Debrecen-Budapest netto es brutto vallalati transzferarak.",
    currency: "HUF",
    tag: "Autoipar",
  },
  ibusz: {
    key: "ibusz",
    name: "IBUSZ Hungary Kft.",
    shortLabel: "IB",
    color: "#D71920",
    colorSecondary: "#A8121A",
    textColor: "#A8121A",
    description: "Vallalati transzferarak.",
    currency: "HUF",
    tag: "Utazas",
  },
  tama: {
    key: "tama",
    name: "TAMA Hungary Kft.",
    shortLabel: "TM",
    color: "#5CA700",
    colorSecondary: "#438000",
    textColor: "#3A6F00",
    description: "Debrecen, Budapest es Berettyoujfalu utvonalak partnerkartya megjelenitessel.",
    currency: "HUF",
    tag: "Logisztika",
  },
  ni: {
    key: "ni",
    name: "NI",
    shortLabel: "NI",
    color: "#22C55E",
    colorSecondary: "#16A34A",
    textColor: "#166534",
    description: "Standard transzfer es VIP Mercedes tarifak kulon partnerfeluleten.",
    currency: "HUF",
    tag: "Technologia",
  },
};

export const PARTNER_PORTAL_ORDER = [
  "catl",
  "ecoproinnovation",
  "ecoprobm",
  "schaefflermotion",
  "schaefflerdebrecen",
  "ibusz",
  "tama",
  "ni",
];
