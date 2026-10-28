const HTML_MAX = 150000;
const TEXT_MAX = 20000;

/** Titkok kimaszkolása a naplózott levéltörzsből: tokenek, egyedi linkek, belépési kódok. */
export function redactEmailSecrets(input: string | undefined | null): string | undefined {
  if (!input) return undefined;
  let out = String(input);
  // ?token=... / &token=... / #token=... (minden érték)
  out = out.replace(/(token=)[^&"'\s<>#)]+/gi, "$1[redacted]");
  // URL-ek útvonal-szegmensei: legalább 20 karakteres azonosító jellegű rész (pl. /feedback/<token>, /track/<token>)
  out = out.replace(/(https?:\/\/[^\s"'<>]+?)\/([A-Za-z0-9_-]{20,})(?=[/?#"'\s<>)]|$)/g, "$1/[redacted]");
  // "kód: 123456", "code 123456", "2FA: 123456"
  out = out.replace(/((?:k[óo]d|code|2fa|otp)[^0-9\n<]{0,20})(\d{6})(?!\d)/gi, "$1[redacted]");
  return out;
}

function toList(value: unknown): string[] {
  const raw = Array.isArray(value) ? value : value ? [value] : [];
  return raw
    .flatMap((v) => String(typeof v === "object" && v && "address" in (v as object) ? (v as { address: string }).address : v).split(","))
    .map((v) => {
      const m = v.match(/<([^>]+)>/);
      return (m ? m[1] : v).trim().toLowerCase();
    })
    .filter(Boolean);
}

export interface EmailLogInput {
  app: string;
  to: unknown;
  cc?: unknown;
  from?: string;
  subject: string;
  kind?: string;
  status: "sent" | "failed";
  error?: string;
  messageId?: string;
  html?: string;
  text?: string;
}

export function buildEmailLogDoc(input: EmailLogInput) {
  const doc: Record<string, unknown> = {
    sentAt: Date.now(),
    app: input.app,
    to: toList(input.to),
    subject: input.subject,
    status: input.status,
  };
  const cc = toList(input.cc);
  if (cc.length > 0) doc.cc = cc;
  if (input.from) doc.from = input.from;
  if (input.kind) doc.kind = input.kind;
  if (input.error) doc.error = input.error;
  if (input.messageId) doc.messageId = input.messageId;
  const html = redactEmailSecrets(input.html);
  const text = redactEmailSecrets(input.text);
  if (html) doc.html = html.slice(0, HTML_MAX);
  if (text) doc.text = text.slice(0, TEXT_MAX);
  return doc;
}

/** Fire-and-forget: sosem dob hibát, és nem blokkolja a küldést. */
export function logEmail(input: EmailLogInput): void {
  void (async () => {
    try {
      const { getCollection } = await import("./db");
      const col = await getCollection("email_logs");
      await col.insertOne(buildEmailLogDoc(input));
    } catch (error) {
      console.error("[email-log] mentés sikertelen", error instanceof Error ? error.message : error);
    }
  })();
}
