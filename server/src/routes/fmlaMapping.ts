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
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  value: string;
}

const FORM_IDS = new Set(["blank-fmla-1", "fmla-2"]);
const FIELD_IDS = new Set<SupportedField>(Object.keys(AUTO_FILL_VALUES) as SupportedField[]);
const MAX_PAGES = 8;
const MAX_IMAGE_CHARS = 2_500_000;

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

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** Reject untrusted model output unless every overlay is bounded and allowlisted. */
export function normalizeMapping(value: unknown, pages: PageImage[]): FieldOverlay[] {
  if (!value || typeof value !== "object" || !Array.isArray((value as { overlays?: unknown }).overlays)) return [];
  const pageByNumber = new Map(pages.map((page) => [page.page, page]));
  const seen = new Set<SupportedField>();
  const safe: FieldOverlay[] = [];

  for (const item of (value as { overlays: unknown[] }).overlays) {
    if (!item || typeof item !== "object") continue;
    const candidate = item as Record<string, unknown>;
    const field = candidate.field;
    const pageNumber = asNumber(candidate.page);
    const x = asNumber(candidate.x);
    const y = asNumber(candidate.y);
    const width = asNumber(candidate.width);
    const height = asNumber(candidate.height);
    const confidence = asNumber(candidate.confidence);
    const page = pageNumber !== null ? pageByNumber.get(pageNumber) : undefined;

    if (typeof field !== "string" || !FIELD_IDS.has(field as SupportedField) || seen.has(field as SupportedField)) continue;
    if (!page || x === null || y === null || width === null || height === null || confidence === null) continue;
    if (confidence < 0 || confidence > 1 || width < 16 || height < 10 || x < 0 || y < 0) continue;
    if (x + width > page.width || y + height > page.height) continue;

    seen.add(field as SupportedField);
    safe.push({
      field: field as SupportedField,
      page: pageNumber as number,
      x,
      y,
      width,
      height,
      confidence,
      value: AUTO_FILL_VALUES[field as SupportedField],
    });
  }

  return safe;
}

export const REVIEW_ITEMS = [
  "Medical facts narrative and treatment plan",
  "Intermittent leave frequency or reduced schedule",
  "Work restrictions, prognosis, certification, and signature",
];
