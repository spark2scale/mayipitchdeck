export const DEMO_CASE_ID = "demo-fmla-001";

export const AUTO_FILL_VALUES = {
  patient_name: "Alex Morgan",
  patient_dob: "03/14/1986",
  patient_phone: "(512) 555-0184",
  patient_address: "214 Cedar Lane, Austin, TX 78704",
  provider_name: "Dr. Sarah Okonkwo, MD",
  provider_npi: "1679834021",
  diagnosis: "Lumbar disc degeneration (M51.16)",
  leave_start_date: "09/16/2026",
  leave_end_date: "10/28/2026",
} as const;

export type SupportedField = keyof typeof AUTO_FILL_VALUES;

export interface PageImage {
  page: number;
  width: number;
  height: number;
  image: string;
}

export interface FieldOverlay {
  field: SupportedField;
  page: number;
  leftPct: number;
  topPct: number;
  widthPct: number;
  heightPct: number;
  confidence: number;
  value: string;
  evidenceLabel: string;
}

const FORM_IDS = new Set(["blank-fmla-1", "fmla-2"]);
const FIELD_IDS = new Set<SupportedField>(Object.keys(AUTO_FILL_VALUES) as SupportedField[]);
const MAX_PAGES = 8;
const MAX_IMAGE_CHARS = 2_500_000;
const MAX_PDF_CHARS = 3_000_000;

export interface NormalizedCandidate {
  leftPct: number;
  topPct: number;
  widthPct: number;
  heightPct: number;
}

export interface LayoutEvidence extends NormalizedCandidate {
  page: number;
  text: string;
}

export type PlacementRelation = "right_of_label" | "below_label";

const FIELD_LABELS: Record<SupportedField, readonly string[]> = {
  patient_name: ["employee name", "patient name", "patient s name", "name"],
  patient_dob: ["date of birth", "birth date", "dob"],
  patient_phone: ["telephone", "home phone", "phone"],
  patient_address: ["address", "street address"],
  provider_name: ["health care provider s name", "health care provider name", "provider name"],
  provider_npi: ["npi", "national provider identifier"],
  diagnosis: ["diagnosis", "medical facts", "medical condition"],
  leave_start_date: ["date you desire to begin leave", "begin leave", "leave start", "condition started"],
  leave_end_date: ["date of anticipated return to work", "return to work", "leave end"],
};

export function isKnownFormId(value: unknown): value is "blank-fmla-1" | "fmla-2" {
  return typeof value === "string" && FORM_IDS.has(value);
}

export function parsePageImages(value: unknown): PageImage[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_PAGES) return null;
  const pages: PageImage[] = [];
  const seen = new Set<number>();

  for (const item of value) {
    if (!item || typeof item !== "object") return null;
    const candidate = item as Partial<PageImage>;
    const validImage = typeof candidate.image === "string" &&
      /^data:image\/(jpeg|png);base64,/.test(candidate.image) &&
      candidate.image.length <= MAX_IMAGE_CHARS;
    if (!Number.isInteger(candidate.page) || (candidate.page ?? 0) < 1 || seen.has(candidate.page as number)) return null;
    if (!Number.isFinite(candidate.width) || !Number.isFinite(candidate.height) || (candidate.width ?? 0) < 200 || (candidate.height ?? 0) < 200) return null;
    if (!validImage) return null;
    seen.add(candidate.page as number);
    pages.push({
      page: candidate.page as number,
      width: Math.round(candidate.width as number),
      height: Math.round(candidate.height as number),
      image: candidate.image as string,
    });
  }

  return pages.sort((a, b) => a.page - b.page);
}

export function parseTemplatePdf(value: unknown): Uint8Array | null {
  if (typeof value !== "string" || value.length < 100 || value.length > MAX_PDF_CHARS || !/^[A-Za-z0-9+/=]+$/.test(value)) return null;
  const bytes = Buffer.from(value, "base64");
  // PDF.js rejects Node's Buffer subclass even though it is a Uint8Array.
  // Copy it into a plain Uint8Array before passing it to getDocument().
  return bytes.subarray(0, 4).toString("ascii") === "%PDF" ? new Uint8Array(bytes) : null;
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function cleanText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function findEvidence(text: string, page: number, layout: LayoutEvidence[]) {
  const wanted = cleanText(text);
  if (wanted.length < 3) return null;
  const exact = layout.filter((item) => item.page === page && cleanText(item.text) === wanted);
  if (exact.length === 1) return exact[0];
  if (exact.length > 1) return null;
  const partial = layout.filter((item) => {
    const candidate = cleanText(item.text);
    return item.page === page && candidate.length >= 3 && (candidate.includes(wanted) || wanted.includes(candidate));
  });
  return partial.length === 1 ? partial[0] : null;
}

function isExpectedEvidence(field: SupportedField, evidence: LayoutEvidence) {
  const text = cleanText(evidence.text);
  return FIELD_LABELS[field].some((label) => {
    // "Name" is an intentional fallback for the scanned employer form, but
    // must be the complete printed label rather than matching every name-like
    // label on a page.
    if (label === "name") return text === label;
    return text.includes(label) || label.includes(text);
  });
}

function hasExpectedEvidence(field: SupportedField, layout: LayoutEvidence[]) {
  return layout.some((item) => isExpectedEvidence(field, item));
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function regionRightOfLabel(label: LayoutEvidence, layout: LayoutEvidence[]): NormalizedCandidate {
  const labelRight = label.leftPct + label.widthPct;
  const labelCenter = label.topPct + label.heightPct / 2;
  const neighbor = layout
    .filter((item) => item.page === label.page && item.leftPct > labelRight && Math.abs(item.topPct + item.heightPct / 2 - labelCenter) < Math.max(2.2, label.heightPct * 2))
    .sort((a, b) => a.leftPct - b.leftPct)[0];
  const leftPct = clamp(labelRight + 0.8, 0, 94);
  const rightPct = clamp((neighbor?.leftPct ?? 96) - 0.7, leftPct + 6, 96);
  return { leftPct, topPct: clamp(label.topPct - 0.25, 0, 98), widthPct: rightPct - leftPct, heightPct: clamp(Math.max(1.6, label.heightPct * 1.45), 1.6, 3.2) };
}

function regionBelowLabel(label: LayoutEvidence, layout: LayoutEvidence[]): NormalizedCandidate {
  const labelBottom = label.topPct + label.heightPct;
  const next = layout
    .filter((item) => item.page === label.page && item.topPct > labelBottom && item.leftPct < label.leftPct + Math.max(35, label.widthPct * 2) && item.leftPct + item.widthPct > label.leftPct)
    .sort((a, b) => a.topPct - b.topPct)[0];
  const leftPct = clamp(label.leftPct, 1, 88);
  const topPct = clamp(labelBottom + 0.8, 0, 96);
  const bottomPct = clamp((next?.topPct ?? topPct + 4) - 0.6, topPct + 1.6, 98);
  return { leftPct, topPct, widthPct: clamp(Math.max(20, Math.min(70, 96 - leftPct)), 8, 78), heightPct: bottomPct - topPct };
}

export function answerRegion(label: LayoutEvidence, relation: PlacementRelation, layout: LayoutEvidence[]) {
  return relation === "below_label" ? regionBelowLabel(label, layout) : regionRightOfLabel(label, layout);
}

/** Accept only verified labels; the server derives the final answer rectangle. */
export function normalizeMapping(value: unknown, layout: LayoutEvidence[]): { overlays: FieldOverlay[]; reviewItems: string[]; notPresentFields: SupportedField[] } {
  if (!value || typeof value !== "object" || !Array.isArray((value as { overlays?: unknown }).overlays)) return { overlays: [], reviewItems: ["AI returned an invalid mapping response."], notPresentFields: [] };
  const raw = value as { overlays: unknown[] };
  const seen = new Set<SupportedField>();
  const safe: FieldOverlay[] = [];
  const reviewItems: string[] = [];

  for (const item of raw.overlays) {
    if (!item || typeof item !== "object") continue;
    const rawCandidate = item as Record<string, unknown>;
    const field = rawCandidate.field;
    const pageNumber = asNumber(rawCandidate.page);
    const confidence = asNumber(rawCandidate.confidence);
    const evidenceLabel = typeof rawCandidate.evidenceLabel === "string" ? rawCandidate.evidenceLabel : "";
    const relation = rawCandidate.placement === "below_label" ? "below_label" : rawCandidate.placement === "right_of_label" ? "right_of_label" : null;

    if (typeof field !== "string" || !FIELD_IDS.has(field as SupportedField) || seen.has(field as SupportedField)) continue;
    if (pageNumber === null || !relation || confidence === null || confidence < 0.7 || confidence > 1) { reviewItems.push(`${field}: insufficient placement confidence.`); continue; }
    const evidence = findEvidence(evidenceLabel, pageNumber, layout);
    if (!evidence || !isExpectedEvidence(field as SupportedField, evidence)) { reviewItems.push(`${field}: missing verified label evidence.`); continue; }
    const region = answerRegion(evidence, relation, layout);

    seen.add(field as SupportedField);
    safe.push({
      field: field as SupportedField,
      page: pageNumber as number,
      ...region,
      confidence,
      value: AUTO_FILL_VALUES[field as SupportedField],
      evidenceLabel: evidence.text,
    });
  }

  const notPresentFields = (Object.keys(AUTO_FILL_VALUES) as SupportedField[]).filter((field) => !seen.has(field) && !hasExpectedEvidence(field, layout));
  for (const field of (Object.keys(AUTO_FILL_VALUES) as SupportedField[])) {
    if (!seen.has(field) && !notPresentFields.includes(field) && !reviewItems.some((item) => item.startsWith(`${field}:`))) {
      reviewItems.push(`${field}: matching label found but not selected by AI.`);
    }
  }
  return { overlays: safe, reviewItems, notPresentFields };
}

export const REVIEW_ITEMS = [
  "Medical facts narrative and treatment plan",
  "Intermittent leave frequency or reduced schedule",
  "Work restrictions, prognosis, certification, and signature",
];
