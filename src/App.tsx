import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Database,
  FileCheck,
  Globe,
  Landmark,
  MessageSquare,
  Phone,
  ScanSearch,
  Share2,
  Shield,
  Workflow,
} from "lucide-react";
import { SLIDES, type SlideId } from "../shared/slides.js";

export const CCC_COLORS = {
  capture: "#fcd34d",
  connect: "#f59e0b",
  convert: "#b45309",
} as const;

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";
const PDF_EXPORT_SETTLE_MS = 2600;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const WORKFLOW_STEPS = [
  {
    label: "Capture",
    title: "Answer every patient inquiry",
    impact: "$1.8M",
    impactLabel: "missed consult opportunity",
    percent: "15%",
    summary: "of front-office time automated",
    benefits: [
      "Schedule with captured information from calls, texts, or images.",
      "Answers questions about the practice or appointment.",
      "CRM memory that personalizes each patient touchpoint.",
    ],
    accent: CCC_COLORS.capture,
    icon: Phone,
  },
  {
    label: "Connect",
    title: "Move work through intake and admin",
    impact: "$750K",
    impactLabel: "admin leakage opportunity",
    percent: "10%",
    summary: "of back-office time automated",
    benefits: [
      "Portal submission and pre-auth initiation without staff entry.",
      "Patient history and spend signals help prioritize calls and outreach.",
      "Stage-based CRM operations move work to completion.",
    ],
    accent: CCC_COLORS.connect,
    icon: Workflow,
  },
  {
    label: "Convert",
    title: "Follow up until revenue is realized",
    impact: "$2.0M",
    impactLabel: "retention revenue opportunity",
    percent: "10%",
    summary: "of back-office time automated",
    benefits: [
      "Personalized outreach campaigns drive visits and conversion.",
      "Follow-up outreach triggered by visit and procedure history.",
      "Personalized collections outreach improves A/R performance.",
    ],
    accent: CCC_COLORS.convert,
    icon: Landmark,
  },
] as const;

const PROOF_METRICS = [
  { value: "24/7", label: "patient inquiry coverage", icon: Clock },
  { value: "35%", label: "of daytime calls are missed", icon: Phone },
  { value: "381", label: "AI consults captured per month", icon: Share2 },
  { value: "21.5%", label: "of consults captured after hours", icon: Workflow },
] as const;

const PAIN_POINTS = [
  "Missed daytime calls and after-hours inquiries leak consult revenue before staff can recover the lead.",
  "Manual intake, pre-auth, and workflow handoffs slow patients down between first contact and scheduled care.",
  "Follow-up depends on staff memory, so recall, reactivation, and collections opportunities often go quiet.",
] as const;

const DIFFERENTIATORS = [
  {
    title: "System of engagement",
    text: "May I sits between demand, workflow, and revenue while the EMR/PMS remains the system of record.",
    icon: Database,
  },
  {
    title: "Healthcare-native execution",
    text: "More than call handling: intake, qualification, admin follow-through, recall, and revenue recovery.",
    icon: FileCheck,
  },
  {
    title: "Practice-ready control",
    text: "Built for specialty workflows where reliability, escalation, and patient trust matter.",
    icon: Shield,
  },
] as const;

function getApiOrigin() {
  if (import.meta.env.DEV) {
    return `${window.location.protocol}//${window.location.hostname}:3001`;
  }

  if (API_BASE) {
    return new URL(API_BASE, window.location.origin).toString();
  }

  return window.location.origin;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia("(max-width: 900px)").matches);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const handler = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isMobile;
}

export default function App() {
  const isMobile = useIsMobile();
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const isPdfExport = useMemo(() => searchParams.get("export") === "pdf", [searchParams]);
  const exportSlideId = useMemo<SlideId | null>(() => {
    const slide = searchParams.get("slide");
    return slide === "handout" ? "handout" : null;
  }, [searchParams]);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const handleDownloadPdf = useCallback(() => {
    if (isDownloadingPdf) {
      return;
    }

    setIsDownloadingPdf(true);
    const exportUrl = new URL("/api/export/pdf", getApiOrigin());
    exportUrl.searchParams.set("baseUrl", window.location.origin);

    const anchor = document.createElement("a");
    anchor.href = exportUrl.toString();
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    window.setTimeout(() => {
      setIsDownloadingPdf(false);
    }, 1500);
  }, [isDownloadingPdf]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--ccc-capture", CCC_COLORS.capture);
    root.style.setProperty("--ccc-connect", CCC_COLORS.connect);
    root.style.setProperty("--ccc-convert", CCC_COLORS.convert);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const pdfWindow = window as Window & { __PDF_READY__?: boolean };

    if (!isPdfExport) {
      delete root.dataset.exportMode;
      delete root.dataset.pdfReady;
      delete root.dataset.exportSlide;
      pdfWindow.__PDF_READY__ = false;
      return;
    }

    root.dataset.exportMode = "pdf";
    root.dataset.pdfReady = "false";
    root.dataset.exportSlide = exportSlideId ?? "handout";
    pdfWindow.__PDF_READY__ = false;

    let cancelled = false;
    const waitForFonts = document.fonts.ready.catch(() => undefined);
    const waitForImages = Promise.all(
      Array.from(document.images).map(
        (image) =>
          new Promise<void>((resolve) => {
            if (image.complete) {
              resolve();
              return;
            }

            image.addEventListener("load", () => resolve(), { once: true });
            image.addEventListener("error", () => resolve(), { once: true });
          }),
      ),
    );

    const markReady = async () => {
      await waitForFonts;
      await waitForImages;
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      });
      await new Promise((resolve) => setTimeout(resolve, PDF_EXPORT_SETTLE_MS));

      if (cancelled) {
        return;
      }

      root.dataset.pdfReady = "true";
      pdfWindow.__PDF_READY__ = true;
    };

    void markReady();

    return () => {
      cancelled = true;
      delete root.dataset.exportMode;
      delete root.dataset.pdfReady;
      delete root.dataset.exportSlide;
      pdfWindow.__PDF_READY__ = false;
    };
  }, [exportSlideId, isPdfExport]);

  return (
    <>
      <div className="deck-root">
        <div className="deck-bg">
          <div className="blob blob-top" />
          <div className="blob blob-right" />
          <div className="blob blob-bottom" />
        </div>

        {!isPdfExport && (
          <header className="deck-header">
            <a className="header-logo" href="https://www.mayiguide.com" target="_blank" rel="noreferrer">
              <img src="/MayILogoTransparentBack.gif" alt="May I" className="logo-img" />
              <div>
                <div className="logo-name">May I</div>
                <div className="logo-sub">Practice Handout</div>
              </div>
            </a>

            <div className="header-actions">
              {!isMobile && (
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                  title="Download the handout as a print-ready PDF."
                >
                  {isDownloadingPdf ? "Generating PDF..." : "Download PDF"}
                </button>
              )}
              <a href="https://www.mayiguide.com" target="_blank" rel="noreferrer" className="btn-primary btn-sm">
                Book a Workflow Review
              </a>
            </div>
          </header>
        )}

        <main className="deck-main deck-main-handout">
          <div className="slide-wrap slide-wrap-handout" data-export-capture={isPdfExport ? "true" : undefined}>
            <HandoutPage />
          </div>
        </main>
      </div>

      {!isPdfExport && (
        <div className="print-deck" aria-hidden="true">
          {SLIDES.map((id) => (
            <div key={id} className="print-slide print-slide-handout">
              <HandoutPage />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function HandoutPage() {
  return (
    <motion.article className="slide slide-handout" variants={stagger} initial="hidden" animate="show">
      <motion.section variants={fadeUp} className="handout-hero">
        <div className="handout-hero-grid">
          <div className="handout-hero-copy">
            <div className="handout-kicker">For Specialty Practices</div>
            <div className="handout-brand-row">
              <img src="/MayILogoTransparentBack.gif" alt="May I" className="handout-brand-logo" />
              <div className="handout-brand-copy">
                <div className="handout-brand-name">May I</div>
                <div className="handout-brand-tag">Revenue recovery for every patient inquiry</div>
              </div>
            </div>
            <h1 className="handout-headline">Recover missed revenue from every patient inquiry.</h1>
            <p className="handout-subhead">
              May I helps specialty practices capture demand, automate intake and admin workflows, and convert more patients without adding headcount.
            </p>
            <div className="handout-channel-row">
              <span className="handout-channel-label">Demand in</span>
              <div className="handout-channel-list">
                <span className="handout-chip"><Phone size={14} /> Calls</span>
                <span className="handout-chip"><MessageSquare size={14} /> Texts</span>
                <span className="handout-chip"><Globe size={14} /> Web</span>
                <span className="handout-chip"><Share2 size={14} /> Referrals</span>
              </div>
            </div>
          </div>

          <div className="handout-hero-proof">
            <div className="handout-proof-topline">Demand May I recovers</div>
            <div className="handout-proof-list">
              {PROOF_METRICS.map(({ value, label, icon: Icon }) => (
                <div key={label} className="handout-proof-row">
                  <Icon size={16} />
                  <div>
                    <div className="handout-proof-value">{value}</div>
                    <div className="handout-proof-label">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section variants={fadeUp} className="handout-revenue-strip">
        <div className="handout-strip-copy">
          <div className="handout-panel-eyebrow">Where Revenue Slips</div>
          <h2>The problem is not just missed calls. It is missed conversion.</h2>
        </div>
        <div className="handout-problem-list">
          {PAIN_POINTS.map((item) => (
            <div key={item} className="handout-problem-item">
              <CheckCircle2 size={16} />
              <p>{item}</p>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section variants={fadeUp} className="handout-workflow-section">
        <div className="handout-section-head">
          <div>
            <div className="handout-panel-eyebrow">How May I Works</div>
            <h2>Capture demand. Connect the workflow. Convert the revenue.</h2>
          </div>
        </div>
        <div className="handout-workflow">
          {WORKFLOW_STEPS.map(({ label, title, impact, impactLabel, percent, summary, benefits, accent, icon: Icon }, index) => (
            <div key={label} className="handout-stage" style={{ "--stage-accent": accent } as CSSProperties}>
              <div className="handout-stage-number">0{index + 1}</div>
              <div className="handout-stage-badge">{label}</div>
              <div className="handout-stage-head">
                <div className="handout-stage-icon">
                  <Icon size={19} />
                </div>
                <h3 className="handout-stage-title">{title}</h3>
              </div>
              <div className="handout-stage-proof">
                <div className="handout-stage-impact">
                  <span>{impact}</span>
                  <small>{impactLabel}</small>
                </div>
                <div className="handout-stage-time">
                  <span>{percent}</span>
                  <small>{summary}</small>
                </div>
              </div>
              <ul className="handout-benefit-list">
                {benefits.map((benefit) => (
                  <li key={benefit}>
                    <span className="handout-benefit-bullet" aria-hidden="true" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
              {index < WORKFLOW_STEPS.length - 1 ? <ArrowRight className="handout-stage-arrow-inline" size={17} /> : null}
            </div>
          ))}
        </div>
        <p className="handout-model-note">
          Modeled annual opportunity per 5-provider specialty practice. Capture assumes missed calls, 10% lead rate, 20% conversion, and $5K/procedure. Connect assumes $5M revenue, 30% admin effort, and 50% leakage. Convert is based on retention/reactivation upside from existing patients. Sources: ASPS, Health Affairs, Bain &amp; Company.
        </p>
      </motion.section>

      <motion.section variants={fadeUp} className="handout-bottom">
        <div className="handout-difference">
          <div className="handout-panel-eyebrow">What Makes May I Different</div>
          <div className="handout-side-points">
            {DIFFERENTIATORS.map(({ title, text, icon: Icon }) => (
              <div key={title} className="handout-side-point">
                <Icon size={18} />
                <div>
                  <div className="handout-side-title">{title}</div>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="handout-cta-panel">
          <div className="handout-cta-title">Ready for a workflow review?</div>
          <p>See where patient demand is leaking today, then map the highest-value automation opportunities across capture, intake, and follow-up.</p>
          <a href="https://www.mayiguide.com" target="_blank" rel="noreferrer" className="handout-cta-link">
            Book a workflow review
            <ArrowRight size={15} />
          </a>
          <div className="handout-footer-meta">
            <span><ScanSearch size={14} /> Capture demand faster</span>
            <span><Workflow size={14} /> Reduce admin drag</span>
            <span><Landmark size={14} /> Convert more revenue</span>
          </div>
        </div>
      </motion.section>
    </motion.article>
  );
}
