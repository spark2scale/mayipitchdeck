// v3's legacy Node build supports Railway's Node 18 runtime without DOMMatrix.
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js") as {
  getDocument(input: { data: Uint8Array }): { promise: Promise<{
    numPages: number;
    getPage(page: number): Promise<{
      getViewport(options: { scale: number }): { width: number; height: number };
      getTextContent(): Promise<{ items: unknown[] }>;
    }>;
  }> };
};

export interface NormalizedRect {
  leftPct: number;
  topPct: number;
  widthPct: number;
  heightPct: number;
}

export interface LayoutToken extends NormalizedRect {
  page: number;
  text: string;
}

export interface SelectionMark extends NormalizedRect {
  id: string;
  page: number;
  confidence: number;
}

export interface LayoutResult {
  source: "native-pdf" | "document-intelligence";
  tokens: LayoutToken[];
  selectionMarks: SelectionMark[];
}

type TextItemLike = { str?: string; transform?: number[]; width?: number; height?: number };
type DiLine = { content?: string; polygon?: number[] };
type DiSelectionMark = { state?: string; confidence?: number; polygon?: number[] };
type DiPage = { width?: number; height?: number; lines?: DiLine[]; selectionMarks?: DiSelectionMark[] };
type DiResult = { status?: string; analyzeResult?: { pages?: DiPage[] } };
interface DocumentIntelligenceLayout { tokens: LayoutToken[]; selectionMarks: SelectionMark[]; }

const DI_API_VERSION = "2024-11-30";

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

function polygonRect(polygon: number[], pageWidth: number, pageHeight: number): NormalizedRect | null {
  if (polygon.length < 8 || !pageWidth || !pageHeight) return null;
  const xs = polygon.filter((_, index) => index % 2 === 0);
  const ys = polygon.filter((_, index) => index % 2 === 1);
  return {
    leftPct: clamp((Math.min(...xs) / pageWidth) * 100),
    topPct: clamp((Math.min(...ys) / pageHeight) * 100),
    widthPct: clamp(((Math.max(...xs) - Math.min(...xs)) / pageWidth) * 100),
    heightPct: clamp(((Math.max(...ys) - Math.min(...ys)) / pageHeight) * 100),
  };
}

/** Uses embedded text whenever it exists, avoiding OCR latency and ambiguity. */
export async function extractNativePdfLayout(pdfBytes: Uint8Array): Promise<LayoutToken[]> {
  const pdf = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
  const tokens: LayoutToken[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1 });
    const text = await page.getTextContent();
    for (const item of text.items as unknown as TextItemLike[]) {
      const content = item.str?.trim();
      const transform = item.transform;
      if (!content || !transform || transform.length < 6) continue;
      const width = Math.max(1, Math.abs(item.width ?? 1));
      const height = Math.max(1, Math.abs(item.height ?? Math.abs(transform[3]) ?? 1));
      tokens.push({
        page: pageNumber,
        text: content,
        leftPct: clamp((transform[4] / viewport.width) * 100),
        topPct: clamp(((viewport.height - transform[5] - height) / viewport.height) * 100),
        widthPct: clamp((width / viewport.width) * 100),
        heightPct: clamp((height / viewport.height) * 100),
      });
    }
  }
  return tokens;
}

async function waitForResult(operationUrl: string, key: string): Promise<DiResult> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const response = await fetch(operationUrl, { headers: { "Ocp-Apim-Subscription-Key": key } });
    if (!response.ok) throw new Error(`Document Intelligence polling failed (${response.status})`);
    const result = await response.json() as DiResult;
    if (result.status === "succeeded") return result;
    if (result.status === "failed") throw new Error("Document Intelligence could not read this form.");
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Document Intelligence analysis timed out.");
}

/** Reads OCR lines and printed checkbox geometry from the layout model. */
export async function extractDocumentIntelligenceLayout(pdfBytes: Uint8Array): Promise<DocumentIntelligenceLayout> {
  const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT?.replace(/\/$/, "");
  const key = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;
  if (!endpoint || !key) throw new Error("Azure Document Intelligence is not configured for scanned form layout.");
  const url = `${endpoint}/documentintelligence/documentModels/prebuilt-layout:analyze?_overload=analyzeDocument&api-version=${DI_API_VERSION}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Ocp-Apim-Subscription-Key": key },
    body: JSON.stringify({ base64Source: Buffer.from(pdfBytes).toString("base64") }),
  });
  if (response.status !== 202) throw new Error(`Document Intelligence request failed (${response.status})`);
  const operationUrl = response.headers.get("operation-location");
  if (!operationUrl) throw new Error("Document Intelligence did not return an operation location.");
  const result = await waitForResult(operationUrl, key);
  const tokens: LayoutToken[] = [];
  const selectionMarks: SelectionMark[] = [];
  for (const [index, page] of (result.analyzeResult?.pages ?? []).entries()) {
    if (!page.width || !page.height) continue;
    for (const line of page.lines ?? []) {
      const content = line.content?.trim();
      const rect = line.polygon ? polygonRect(line.polygon, page.width, page.height) : null;
      if (content && rect) tokens.push({ page: index + 1, text: content, ...rect });
    }
    for (const [markIndex, mark] of (page.selectionMarks ?? []).entries()) {
      const rect = mark.polygon ? polygonRect(mark.polygon, page.width, page.height) : null;
      const confidence = mark.confidence ?? 0;
      if (!rect || confidence < 0.7) continue;
      selectionMarks.push({ id: `p${index + 1}-m${markIndex + 1}`, page: index + 1, confidence, ...rect });
    }
  }
  return { tokens, selectionMarks };
}

/** Uses native text when available and DI selection marks for print-only boxes. */
export async function extractLayout(pdfBytes: Uint8Array, requireSelectionMarks = false): Promise<LayoutResult> {
  const nativeTokens = await extractNativePdfLayout(pdfBytes);
  if (nativeTokens.length && !requireSelectionMarks) return { source: "native-pdf", tokens: nativeTokens, selectionMarks: [] };
  const documentIntelligence = await extractDocumentIntelligenceLayout(pdfBytes);
  if (nativeTokens.length) return { source: "native-pdf", tokens: nativeTokens, selectionMarks: documentIntelligence.selectionMarks };
  return { source: "document-intelligence", tokens: documentIntelligence.tokens, selectionMarks: documentIntelligence.selectionMarks };
}

export function compactLayout(tokens: LayoutToken[]) {
  return tokens.map(({ page, text, leftPct, topPct, widthPct, heightPct }) => ({
    page, text, leftPct: Number(leftPct.toFixed(2)), topPct: Number(topPct.toFixed(2)), widthPct: Number(widthPct.toFixed(2)), heightPct: Number(heightPct.toFixed(2)),
  }));
}

export function compactSelectionMarks(selectionMarks: SelectionMark[]) {
  return selectionMarks.map(({ id, page, leftPct, topPct, widthPct, heightPct }) => ({
    id, page, leftPct: Number(leftPct.toFixed(2)), topPct: Number(topPct.toFixed(2)), widthPct: Number(widthPct.toFixed(2)), heightPct: Number(heightPct.toFixed(2)),
  }));
}
