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

export interface ModelAnchor extends NormalizedCandidate {
  page: number;
  text: string;
}

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

export interface PageCalibration {
  page: number;
  anchorCount: number;
  confidence: number;
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
}

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

function parseCandidate(value: unknown): NormalizedCandidate | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const leftPct = asNumber(raw.leftPct);
  const topPct = asNumber(raw.topPct);
  const widthPct = asNumber(raw.widthPct);
  const heightPct = asNumber(raw.heightPct);
  if (leftPct === null || topPct === null || widthPct === null || heightPct === null) return null;
  if (leftPct < 0 || topPct < 0 || widthPct < 0.5 || heightPct < 0.5 || leftPct + widthPct > 100 || topPct + heightPct > 100) return null;
  return { leftPct, topPct, widthPct, heightPct };
}

function findEvidence(text: string, page: number, layout: LayoutEvidence[]) {
  const wanted = cleanText(text);
  if (wanted.length < 3) return null;
  return layout.find((item) => item.page === page && (cleanText(item.text).includes(wanted) || wanted.includes(cleanText(item.text))));
}

/** Fits per-axis affine correction from model-observed label anchors to layout geometry. */
export function calibratePages(anchors: unknown, layout: LayoutEvidence[]): Map<number, PageCalibration> {
  const grouped = new Map<number, Array<{ model: ModelAnchor; actual: LayoutEvidence }>>();
  if (!Array.isArray(anchors)) return new Map();
  for (const item of anchors) {
    if (!item || typeof item !== "object") continue;
    const raw = item as Record<string, unknown>;
    const page = asNumber(raw.page);
    const rect = parseCandidate(raw);
    if (page === null || typeof raw.text !== "string" || !rect) continue;
    const actual = findEvidence(raw.text, page, layout);
    if (!actual) continue;
    const list = grouped.get(page) ?? [];
    list.push({ model: { page, text: raw.text, ...rect }, actual });
    grouped.set(page, list);
  }
  const result = new Map<number, PageCalibration>();
  for (const [page, pairs] of grouped) {
    if (pairs.length < 3) continue;
    const solve = (modelValues: number[], actualValues: number[]) => {
      const meanModel = modelValues.reduce((sum, value) => sum + value, 0) / modelValues.length;
      const meanActual = actualValues.reduce((sum, value) => sum + value, 0) / actualValues.length;
      const variance = modelValues.reduce((sum, value) => sum + (value - meanModel) ** 2, 0);
      const covariance = modelValues.reduce((sum, value, index) => sum + (value - meanModel) * (actualValues[index] - meanActual), 0);
      const scale = variance ? covariance / variance : 1;
      return { scale, offset: meanActual - scale * meanModel };
    };
    const modelX = pairs.map(({ model }) => model.leftPct + model.widthPct / 2);
    const modelY = pairs.map(({ model }) => model.topPct + model.heightPct / 2);
    const actualX = pairs.map(({ actual }) => actual.leftPct + actual.widthPct / 2);
    const actualY = pairs.map(({ actual }) => actual.topPct + actual.heightPct / 2);
    const x = solve(modelX, actualX);
    const y = solve(modelY, actualY);
    const errors = pairs.map(({ model, actual }) => Math.hypot(
      x.scale * (model.leftPct + model.widthPct / 2) + x.offset - (actual.leftPct + actual.widthPct / 2),
      y.scale * (model.topPct + model.heightPct / 2) + y.offset - (actual.topPct + actual.heightPct / 2),
    ));
    const meanError = errors.reduce((sum, value) => sum + value, 0) / errors.length;
    const confidence = Math.max(0, Math.min(1, 1 - meanError / 8));
    if (confidence >= 0.7 && x.scale > 0.5 && x.scale < 1.8 && y.scale > 0.5 && y.scale < 1.8) {
      result.set(page, { page, anchorCount: pairs.length, confidence, scaleX: x.scale, scaleY: y.scale, offsetX: x.offset, offsetY: y.offset });
    }
  }
  return result;
}

/** Reject candidates without evidence label matching or a reliable calibration. */
export function normalizeMapping(value: unknown, layout: LayoutEvidence[]): { overlays: FieldOverlay[]; reviewItems: string[]; calibration: PageCalibration[] } {
  if (!value || typeof value !== "object" || !Array.isArray((value as { overlays?: unknown }).overlays)) return { overlays: [], reviewItems: ["AI returned an invalid mapping response."], calibration: [] };
  const raw = value as { overlays: unknown[]; anchors?: unknown };
  const calibrations = calibratePages(raw.anchors, layout);
  const seen = new Set<SupportedField>();
  const safe: FieldOverlay[] = [];
  const reviewItems: string[] = [];

  for (const item of raw.overlays) {
    if (!item || typeof item !== "object") continue;
    const rawCandidate = item as Record<string, unknown>;
    const field = rawCandidate.field;
    const pageNumber = asNumber(rawCandidate.page);
    const confidence = asNumber(rawCandidate.confidence);
    const rect = parseCandidate(rawCandidate);
    const evidenceLabel = typeof rawCandidate.evidenceLabel === "string" ? rawCandidate.evidenceLabel : "";

    if (typeof field !== "string" || !FIELD_IDS.has(field as SupportedField) || seen.has(field as SupportedField)) continue;
    if (pageNumber === null || !rect || confidence === null || confidence < 0.7 || confidence > 1) { reviewItems.push(`${field}: insufficient placement confidence.`); continue; }
    const calibration = calibrations.get(pageNumber);
    const evidence = findEvidence(evidenceLabel, pageNumber, layout);
    if (!calibration || !evidence) { reviewItems.push(`${field}: missing calibrated label evidence.`); continue; }
    const leftPct = calibration.scaleX * rect.leftPct + calibration.offsetX;
    const topPct = calibration.scaleY * rect.topPct + calibration.offsetY;
    const widthPct = calibration.scaleX * rect.widthPct;
    const heightPct = calibration.scaleY * rect.heightPct;
    if (leftPct < 0 || topPct < 0 || widthPct < 0.5 || heightPct < 0.5 || leftPct + widthPct > 100 || topPct + heightPct > 100) { reviewItems.push(`${field}: calibrated region is outside the page.`); continue; }

    seen.add(field as SupportedField);
    safe.push({
      field: field as SupportedField,
      page: pageNumber as number,
      leftPct,
      topPct,
      widthPct,
      heightPct,
      confidence,
      value: AUTO_FILL_VALUES[field as SupportedField],
      evidenceLabel: evidence.text,
    });
  }

  return { overlays: safe, reviewItems, calibration: [...calibrations.values()] };
}

export const REVIEW_ITEMS = [
  "Medical facts narrative and treatment plan",
  "Intermittent leave frequency or reduced schedule",
  "Work restrictions, prognosis, certification, and signature",
];
