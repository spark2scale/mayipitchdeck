import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, BrainCircuit, CheckCircle2, ChevronLeft, ChevronRight, FileText, LoaderCircle, RefreshCw, Sparkles } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

type Status = "loading" | "ready" | "analyzing" | "complete" | "error";

interface RenderedPage {
  page: number;
  width: number;
  height: number;
  image: string;
}

interface Overlay {
  field: string;
  page: number;
  leftPct: number;
  topPct: number;
  widthPct: number;
  heightPct: number;
  confidence: number;
  value: string;
  evidenceLabel: string;
}

interface CheckboxOverlay {
  decisionId: string;
  page: number;
  leftPct: number;
  topPct: number;
  widthPct: number;
  heightPct: number;
  confidence: number;
  checked: true;
  evidenceLabel: string;
  selectionMarkId: string;
}

interface RenderedDocument {
  pages: RenderedPage[];
  templatePdf: string;
}

const FORM = { id: "fmla-2", name: "FMLA medical certification", file: "/populatepdfdemo/FMLA2.pdf", description: "4-page leave certification" } as const;

const CASE_ROWS = [
  ["Patient", "Alex Morgan"],
  ["DOB", "03/14/1986"],
  ["Provider", "Dr. Sarah Okonkwo, MD"],
  ["Practice", "Austin Ophthalmology Associates"],
  ["Practice e-mail", "care@austinophthalmology.demo"],
  ["Practice fax", "(512) 555-0167"],
  ["Diagnosis", "Retinal detachment, left eye (H33.22)"],
  ["Requested leave", "09/16/2026 - 10/28/2026"],
  ["Estimated duration", "6 weeks (derived from leave window)"],
  ["Attested treatment plan", "Retinal repair 09/18; follow-ups 09/25 & 10/09; no referral"],
];

const STATIC_OVERLAYS: Overlay[] = [
  { field: "patient_name", page: 1, leftPct: 28, topPct: 25, widthPct: 23, heightPct: 1.5, confidence: 0.98, value: "Alex Morgan", evidenceLabel: "Patient's Name" },
  { field: "patient_dob", page: 1, leftPct: 64, topPct: 25, widthPct: 13, heightPct: 1.5, confidence: 0.97, value: "03/14/1986", evidenceLabel: "Date of birth" },
  { field: "provider_name", page: 1, leftPct: 20, topPct: 43, widthPct: 27, heightPct: 1.5, confidence: 0.95, value: "Dr. Sarah Okonkwo, MD", evidenceLabel: "Provider name" },
  { field: "planned_treatment_dates", page: 3, leftPct: 45, topPct: 65.2, widthPct: 48, heightPct: 1.5, confidence: 0.97, value: "09/18/2026; 09/25/2026; 10/09/2026", evidenceLabel: "following date(s)" },
  { field: "planned_treatment_duration", page: 3, leftPct: 4, topPct: 80.5, widthPct: 89, heightPct: 1.5, confidence: 0.96, value: "6 weeks incl. post-operative recovery", evidenceLabel: "duration of the treatment(s)" },
];

const STATIC_CHECKBOXES: CheckboxOverlay[] = [
  { decisionId: "incapacity_plus_treatment", page: 3, leftPct: 5.1, topPct: 13.25, widthPct: 1.45, heightPct: 1.45, confidence: 0.96, checked: true, evidenceLabel: "Incapacity plus Treatment", selectionMarkId: "export-p3-m1" },
  { decisionId: "planned_treatment_will_have", page: 3, leftPct: 35.45, topPct: 63.15, widthPct: 1.45, heightPct: 1.45, confidence: 0.98, checked: true, evidenceLabel: "will have", selectionMarkId: "export-p3-m2" },
];

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

function toBase64(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  return btoa(binary);
}

async function renderPdf(file: string): Promise<RenderedDocument> {
  const templateBytes = new Uint8Array(await (await fetch(file)).arrayBuffer());
  // PDF.js transfers its input buffer to the worker. Preserve the original
  // base64 for the mapping API before handing a copy to PDF.js.
  const templatePdf = toBase64(templateBytes);
  const pdfDocument = await pdfjsLib.getDocument({ data: templateBytes.slice() }).promise;
  const pages: RenderedPage[] = [];
  for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
    try {
      const page = await pdfDocument.getPage(pageNumber);
      const base = page.getViewport({ scale: 1 });
      const scale = Math.min(1.55, 1100 / base.width);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) continue;
      await page.render({ canvas, viewport }).promise;
      pages.push({
        page: pageNumber,
        width: canvas.width,
        height: canvas.height,
        image: canvas.toDataURL("image/jpeg", 0.76),
      });
    } catch (error) {
      // Some customer templates contain optional PDF constructs a browser cannot
      // paint. Keep the usable pages available for the demo rather than failing
      // the entire document preview.
      console.warn(`Unable to render FMLA form page ${pageNumber}`, error);
    }
  }
  if (!pages.length) throw new Error("No pages could be rendered from the selected PDF.");
  return { pages, templatePdf };
}

export default function FmlaDemo({ isExportMode = false }: { isExportMode?: boolean }) {
  const [pages, setPages] = useState<RenderedPage[]>([]);
  const [templatePdf, setTemplatePdf] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [status, setStatus] = useState<Status>("loading");
  const [overlays, setOverlays] = useState<Overlay[]>(isExportMode ? STATIC_OVERLAYS : []);
  const [checkboxes, setCheckboxes] = useState<CheckboxOverlay[]>(isExportMode ? STATIC_CHECKBOXES : []);
  const [reviewItems, setReviewItems] = useState<string[]>([]);
  const [notPresentFields, setNotPresentFields] = useState<string[]>([]);
  const [notPresentCheckboxes, setNotPresentCheckboxes] = useState<string[]>([]);
  const [error, setError] = useState("");
  const activePage = pages[pageIndex];

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setPages([]);
    setTemplatePdf("");
    setPageIndex(0);
    setError("");
    setReviewItems([]);
    setNotPresentFields([]);
    setNotPresentCheckboxes([]);
    setOverlays(isExportMode ? STATIC_OVERLAYS : []);
    setCheckboxes(isExportMode ? STATIC_CHECKBOXES : []);
    void renderPdf(FORM.file)
      .then((rendered) => {
        if (cancelled) return;
        setPages(rendered.pages);
        setTemplatePdf(rendered.templatePdf);
        setStatus(isExportMode ? "complete" : "ready");
        if (isExportMode) setReviewItems(["Unattested medical narrative and certification remain in clinician review"]);
      })
      .catch(() => {
        if (!cancelled) {
          setError("The selected FMLA template could not be rendered.");
          setStatus("error");
        }
      });
    return () => { cancelled = true; };
  }, [isExportMode]);

  const analyze = useCallback(async () => {
    if (!pages.length || !templatePdf || status === "analyzing") return;
    setStatus("analyzing");
    setError("");
    setOverlays([]);
    setCheckboxes([]);
    setReviewItems([]);
    setNotPresentFields([]);
    setNotPresentCheckboxes([]);
    try {
      const response = await fetch(`${API_BASE}/api/fmla/map`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formId: FORM.id, caseId: "demo-fmla-001", pages, templatePdf }),
      });
      const data = await response.json() as { overlays?: Overlay[]; checkboxes?: CheckboxOverlay[]; reviewItems?: string[]; notPresentFields?: string[]; notPresentCheckboxes?: string[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Analysis unavailable");
      setOverlays(Array.isArray(data.overlays) ? data.overlays : []);
      setCheckboxes(Array.isArray(data.checkboxes) ? data.checkboxes : []);
      setReviewItems(Array.isArray(data.reviewItems) ? data.reviewItems : []);
      setNotPresentFields(Array.isArray(data.notPresentFields) ? data.notPresentFields : []);
      setNotPresentCheckboxes(Array.isArray(data.notPresentCheckboxes) ? data.notPresentCheckboxes : []);
      setStatus("complete");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Analysis unavailable. Please retry or review manually.");
      setStatus("error");
    }
  }, [pages, status, templatePdf]);

  return (
    <div className="slide fmla-slide">
      <div className="fmla-header">
        <div><div className="eyebrow-tag">Live AI Form Intelligence</div><h2 className="slide-title fmla-title">FMLA forms, mapped to the right answers</h2></div>
        <div className="fmla-safe-note"><Sparkles size={14} /> Synthetic demo data only</div>
      </div>

      <div className="fmla-main">
        <section className="fmla-case-panel">
          <div className="fmla-panel-label"><FileText size={15} /> Canonical FMLA case</div>
          <div className="fmla-case-subtitle">One EMR record. Patient and employee are the same demo person.</div>
          <div className="fmla-case-card">
            {CASE_ROWS.map(([label, value]) => <div className="fmla-case-row" key={label}><span>{label}</span><strong>{value}</strong></div>)}
          </div>
          <div className="fmla-case-footer"><CheckCircle2 size={14} /> 15 values + 2 checkbox decisions approved</div>
        </section>

        <section className="fmla-document-panel">
          <div className="fmla-document-toolbar">
            <div className="fmla-form-tabs"><div className="fmla-form-tab fmla-form-tab--active">{FORM.name}<small>{FORM.description}</small></div></div>
            {!isExportMode && <button className="fmla-run-btn" type="button" onClick={analyze} disabled={status === "loading" || status === "analyzing"}>
              {status === "analyzing" ? <LoaderCircle size={15} className="fmla-spin" /> : <BrainCircuit size={15} />}
              {status === "complete" ? "Run again" : "Analyze & populate"}
            </button>}
          </div>
          <div className="fmla-page-stage">
            {status === "loading" && <div className="fmla-stage-message"><LoaderCircle className="fmla-spin" /> Rendering employer form…</div>}
            {status === "error" && <div className="fmla-stage-message fmla-stage-message--error"><AlertTriangle /> {error}<button type="button" onClick={analyze}><RefreshCw size={13} /> Retry</button></div>}
            {activePage && <div className="fmla-page-canvas">
              <img src={activePage.image} alt={`${FORM.name}, page ${activePage.page}`} />
              <AnimatePresence>{overlays.filter((overlay) => overlay.page === activePage.page).map((overlay) => (
                <motion.div key={`${overlay.field}-${overlay.page}-${overlay.evidenceLabel}`} className="fmla-overlay" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.28 }} style={{ left: `${overlay.leftPct}%`, top: `${overlay.topPct}%`, width: `${overlay.widthPct}%`, minHeight: `${overlay.heightPct}%` }} title={`${overlay.evidenceLabel}: ${Math.round(overlay.confidence * 100)}% confidence`}>
                  {overlay.value}
                </motion.div>
              ))}</AnimatePresence>
              <AnimatePresence>{checkboxes.filter((checkbox) => checkbox.page === activePage.page).map((checkbox) => (
                <motion.div key={`${checkbox.decisionId}-${checkbox.page}-${checkbox.selectionMarkId}`} className="fmla-checkbox-overlay" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.22 }} style={{ left: `${checkbox.leftPct}%`, top: `${checkbox.topPct}%`, width: `${checkbox.widthPct}%`, height: `${checkbox.heightPct}%` }} title={`${checkbox.evidenceLabel}: ${Math.round(checkbox.confidence * 100)}% confidence`}>
                  ✓
                </motion.div>
              ))}</AnimatePresence>
            </div>}
          </div>
          <div className="fmla-page-footer">
            <span>Page {pages.length ? pageIndex + 1 : 0} of {pages.length || "-"}</span>
            <div><button type="button" onClick={() => setPageIndex((value) => Math.max(0, value - 1))} disabled={pageIndex === 0}><ChevronLeft size={16} /></button><button type="button" onClick={() => setPageIndex((value) => Math.min(Math.max(0, pages.length - 1), value + 1))} disabled={pageIndex >= pages.length - 1}><ChevronRight size={16} /></button></div>
          </div>
        </section>

        <section className="fmla-ai-panel">
          <div className="fmla-panel-label"><BrainCircuit size={15} /> AI mapping status</div>
          <div className={`fmla-status fmla-status--${status}`}><span />{status === "ready" ? "Ready to analyze this layout" : status === "analyzing" ? "Reading form prompts and layout…" : status === "complete" ? "Mapped and populated safely" : status === "error" ? "Manual review required" : "Preparing form pages…"}</div>
          <div className="fmla-metrics"><div><strong>{overlays.length}</strong><span>text fields</span></div><div><strong>{checkboxes.length}</strong><span>boxes checked</span></div><div><strong>{overlays.length + checkboxes.length ? `${Math.round([...overlays, ...checkboxes].reduce((sum, item) => sum + item.confidence, 0) / (overlays.length + checkboxes.length) * 100)}%` : "-"}</strong><span>avg. confidence</span></div></div>
          <div className="fmla-activity"><div className="fmla-section-heading">Activity</div><p>{status === "complete" ? `Recognized ${FORM.name} independently of its layout.` : "AI will locate labels, answer areas, and page coordinates from the selected template."}</p><p>{status === "complete" && (notPresentFields.length || notPresentCheckboxes.length) ? `${notPresentFields.length} values and ${notPresentCheckboxes.length} approved decisions are not requested by this form.` : "Only approved canonical values and decisions may be written."}</p></div>
          <div className="fmla-review"><div className="fmla-section-heading"><AlertTriangle size={13} /> Clinician review queue</div>{(reviewItems.length ? reviewItems : ["Medical narrative, restrictions, and certification remain protected."]).map((item) => <div className="fmla-review-item" key={item}>{item}</div>)}</div>
        </section>
      </div>
    </div>
  );
}
