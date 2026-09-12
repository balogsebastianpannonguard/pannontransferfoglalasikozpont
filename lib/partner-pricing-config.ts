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
    name: "CATL Hungary Kft.",
    shortLabel: "CATL",
    color: "#0047BA",
    colorSecondary: "#00B4D8",
    textColor: "#0047BA",
    description: "Delegacios es dolgozoi transzferekhez kotott egyedi vallalati szerzodes.",
    currency: "HUF",
    tag: "Enterprise",
  },
  ecopro: {
    key: "ecopro",
    name: "EcoPro Global",
    shortLabel: "EP",
    color: "#00B4D8",
    colorSecondary: "#0096B4",
    textColor: "#006E8A",
    description: "Debrecen-Budapest es repuloteri transzferek, 130%/150% modositasi feltetelekkel.",
    currency: "HUF",
    tag: "Ipari",
  },
  eccoino: {
    key: "eccoino",
    name: "Eccoino",
    shortLabel: "EC",
    color: "#60B8FF",
    colorSecondary: "#3A9FEE",
    textColor: "#1A6FB8",
    description: "Debrecen-Wien es Budapest-Wien utvonalak, AFA nelkuli arakkal.",
    currency: "HUF",
    tag: "Nemzetkozi",
  },
  vitesco: {
    key: "vitesco",
    name: "Vitesco Technologies",
    shortLabel: "VT",
    color: "#E30613",
    colorSecondary: "#B80010",
    textColor: "#B80010",
    description: "Debrecen-Budapest netto es brutto vallalati transzferarak.",
    currency: "HUF",
    tag: "Autoipar",
  },
  schaeffler: {
    key: "schaeffler",
    name: "Schaeffler",
    shortLabel: "SCH",
    color: "#009A44",
    colorSecondary: "#007A35",
    textColor: "#007A35",
    description: "Debrecen-Budapest netto es brutto vallalati transzferarak.",
    currency: "HUF",
    tag: "Autoipar",
  },
  krones: {
    key: "krones",
    name: "Krones AG",
    shortLabel: "KR",
    color: "#003F8A",
    colorSecondary: "#002D6A",
    textColor: "#002D6A",
    description: "Db-Db es Debrecen-Budapest utalasos vallalati szallitasi arak.",
    currency: "HUF",
    tag: "Gyartas",
  },
  enterair: {
    key: "enterair",
    name: "Enter Air",
    shortLabel: "EA",
    color: "#005BAA",
    colorSecondary: "#0078D4",
    textColor: "#005BAA",
    description: "Euro alapu csoportos transzferek es partnerhozzaferesek elonezete.",
    currency: "EUR",
    tag: "Legi",
  },
  tama: {
    key: "tama",
    name: "Tama",
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
    color: "#F5D000",
    colorSecondary: "#D8A800",
    textColor: "#8A6A00",
    description: "Standard transzfer es VIP Mercedes tarifak kulon partnerfeluleten.",
    currency: "HUF",
    tag: "Technologia",
  },
};

export const PARTNER_PORTAL_ORDER = [
  "catl",
  "ecopro",
  "eccoino",
  "vitesco",
  "schaeffler",
  "krones",
  "enterair",
  "tama",
  "ni",
];
