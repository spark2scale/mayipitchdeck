import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, BrainCircuit, CheckCircle2, ChevronLeft, ChevronRight, FileText, LoaderCircle, RefreshCw, Sparkles } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

type FormId = "blank-fmla-1" | "fmla-2";
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

interface RenderedDocument {
  pages: RenderedPage[];
  templatePdf: string;
}

const FORMS: Array<{ id: FormId; name: string; file: string; description: string }> = [
  { id: "blank-fmla-1", name: "Employer Form A", file: "/populatepdfdemo/blankFMLA1.pdf", description: "3-page medical certification" },
  { id: "fmla-2", name: "Employer Form B", file: "/populatepdfdemo/FMLA2.pdf", description: "4-page leave certification" },
];

const CASE_ROWS = [
  ["Patient", "Alex Morgan"],
  ["DOB", "03/14/1986"],
  ["Provider", "Dr. Sarah Okonkwo, MD"],
  ["Diagnosis", "Lumbar disc degeneration (M51.16)"],
  ["Requested leave", "09/16/2026 - 10/28/2026"],
];

const STATIC_OVERLAYS: Overlay[] = [
  { field: "patient_name", page: 1, leftPct: 28, topPct: 25, widthPct: 23, heightPct: 1.5, confidence: 0.98, value: "Alex Morgan", evidenceLabel: "Patient's Name" },
  { field: "patient_dob", page: 1, leftPct: 64, topPct: 25, widthPct: 13, heightPct: 1.5, confidence: 0.97, value: "03/14/1986", evidenceLabel: "Date of birth" },
  { field: "provider_name", page: 1, leftPct: 20, topPct: 43, widthPct: 27, heightPct: 1.5, confidence: 0.95, value: "Dr. Sarah Okonkwo, MD", evidenceLabel: "Provider name" },
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
  const [formId, setFormId] = useState<FormId>(isExportMode ? "fmla-2" : "blank-fmla-1");
  const [pages, setPages] = useState<RenderedPage[]>([]);
  const [templatePdf, setTemplatePdf] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [status, setStatus] = useState<Status>("loading");
  const [overlays, setOverlays] = useState<Overlay[]>(isExportMode ? STATIC_OVERLAYS : []);
  const [reviewItems, setReviewItems] = useState<string[]>([]);
  const [error, setError] = useState("");
  const activeForm = useMemo(() => FORMS.find((form) => form.id === formId)!, [formId]);
  const activePage = pages[pageIndex];

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setPages([]);
    setTemplatePdf("");
    setPageIndex(0);
    setError("");
    setReviewItems([]);
    setOverlays(isExportMode ? STATIC_OVERLAYS : []);
    void renderPdf(activeForm.file)
      .then((rendered) => {
        if (cancelled) return;
        setPages(rendered.pages);
        setTemplatePdf(rendered.templatePdf);
        setStatus(isExportMode ? "complete" : "ready");
        if (isExportMode) setReviewItems(["3 clinical decisions routed to clinician review"]);
      })
      .catch(() => {
        if (!cancelled) {
          setError("The selected FMLA template could not be rendered.");
          setStatus("error");
        }
      });
    return () => { cancelled = true; };
  }, [activeForm.file, isExportMode]);

  const analyze = useCallback(async () => {
    if (!pages.length || !templatePdf || status === "analyzing") return;
    setStatus("analyzing");
    setError("");
    setOverlays([]);
    setReviewItems([]);
    try {
      const response = await fetch(`${API_BASE}/api/fmla/map`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formId, caseId: "demo-fmla-001", pages, templatePdf }),
      });
      const data = await response.json() as { overlays?: Overlay[]; reviewItems?: string[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Analysis unavailable");
      setOverlays(Array.isArray(data.overlays) ? data.overlays : []);
      setReviewItems(Array.isArray(data.reviewItems) ? data.reviewItems : []);
      setStatus("complete");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Analysis unavailable. Please retry or review manually.");
      setStatus("error");
    }
  }, [formId, pages, status, templatePdf]);

  const selectForm = (nextForm: FormId) => {
    if (nextForm !== formId && status !== "analyzing") setFormId(nextForm);
  };

  return (
    <div className="slide fmla-slide">
      <div className="fmla-header">
        <div><div className="eyebrow-tag">Live AI Form Intelligence</div><h2 className="slide-title fmla-title">FMLA forms, mapped to the right answers</h2></div>
        <div className="fmla-safe-note"><Sparkles size={14} /> Synthetic demo data only</div>
      </div>

      <div className="fmla-main">
        <section className="fmla-case-panel">
          <div className="fmla-panel-label"><FileText size={15} /> Canonical FMLA case</div>
          <div className="fmla-case-subtitle">One EMR record. Any employer layout.</div>
          <div className="fmla-case-card">
            {CASE_ROWS.map(([label, value]) => <div className="fmla-case-row" key={label}><span>{label}</span><strong>{value}</strong></div>)}
          </div>
          <div className="fmla-case-footer"><CheckCircle2 size={14} /> 9 values approved for auto-fill</div>
        </section>

        <section className="fmla-document-panel">
          <div className="fmla-document-toolbar">
            <div className="fmla-form-tabs" role="tablist" aria-label="FMLA form template">
              {FORMS.map((form) => <button key={form.id} type="button" className={form.id === formId ? "fmla-form-tab fmla-form-tab--active" : "fmla-form-tab"} onClick={() => selectForm(form.id)} disabled={status === "analyzing"}>
                {form.name}<small>{form.description}</small>
              </button>)}
            </div>
            {!isExportMode && <button className="fmla-run-btn" type="button" onClick={analyze} disabled={status === "loading" || status === "analyzing"}>
              {status === "analyzing" ? <LoaderCircle size={15} className="fmla-spin" /> : <BrainCircuit size={15} />}
              {status === "complete" ? "Run again" : "Analyze & populate"}
            </button>}
          </div>
          <div className="fmla-page-stage">
            {status === "loading" && <div className="fmla-stage-message"><LoaderCircle className="fmla-spin" /> Rendering employer form…</div>}
            {status === "error" && <div className="fmla-stage-message fmla-stage-message--error"><AlertTriangle /> {error}<button type="button" onClick={analyze}><RefreshCw size={13} /> Retry</button></div>}
            {activePage && <div className="fmla-page-canvas">
              <img src={activePage.image} alt={`${activeForm.name}, page ${activePage.page}`} />
              <AnimatePresence>{overlays.filter((overlay) => overlay.page === activePage.page).map((overlay) => (
                <motion.div key={overlay.field} className="fmla-overlay" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.28 }} style={{ left: `${overlay.leftPct}%`, top: `${overlay.topPct}%`, width: `${overlay.widthPct}%`, minHeight: `${overlay.heightPct}%` }} title={`${overlay.evidenceLabel}: ${Math.round(overlay.confidence * 100)}% confidence`}>
                  {overlay.value}
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
          <div className="fmla-metrics"><div><strong>{overlays.length}</strong><span>fields populated</span></div><div><strong>{overlays.length ? `${Math.round(overlays.reduce((sum, item) => sum + item.confidence, 0) / overlays.length * 100)}%` : "-"}</strong><span>avg. confidence</span></div></div>
          <div className="fmla-activity"><div className="fmla-section-heading">Activity</div><p>{status === "complete" ? `Recognized ${activeForm.name} independently of its layout.` : "AI will locate labels, answer areas, and page coordinates from the selected template."}</p><p>Only approved canonical values may be written.</p></div>
          <div className="fmla-review"><div className="fmla-section-heading"><AlertTriangle size={13} /> Clinician review queue</div>{(reviewItems.length ? reviewItems : ["Medical narrative, restrictions, and certification remain protected."]).map((item) => <div className="fmla-review-item" key={item}>{item}</div>)}</div>
        </section>
      </div>
    </div>
  );
}
