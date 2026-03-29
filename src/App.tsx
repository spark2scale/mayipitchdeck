import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import SlideDemo from "./components/demo/SlideDemo";
import { motion, AnimatePresence } from "framer-motion";
import {
  PhoneOff, Clock, Layers, RefreshCw,
  Database,
  DollarSign, Users, Zap, Shield,
  Brain, GitMerge,
  ChevronRight, ChevronLeft,
  Rocket,
  Phone, MessageSquare, Globe, Share2,
  Calendar, FileCheck,
  CheckCircle2, XCircle,
  ArrowRight, ScanText, BotMessageSquare, UserRound,
  FileSearch, MailCheck, Workflow,
  PhoneOutgoing, Stethoscope as SurgeryIcon, Banknote, MousePointerClick,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

const SLIDES = [
  "hero",
  "founder",
  "problem",
  "loss",
  "engine",
  "capture-detail",
  "connect-detail",
  "convert-detail",
  "roi",
  "why-wins",
  "path",
  "moats",
  "vision",
  "demo",
  "appendix",
  // "color-options",
] as const;

// ─── Animation variants ───────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};
const slideInRight = {
  hidden: { opacity: 0, x: 60 },
  show: { opacity: 1, x: 0, transition: { duration: 0.55 } },
};

// ─── CCC Brand Colors (Option A — Light to Dark) ──────────────────────────────
export const CCC_COLORS = {
  capture: "#fcd34d",
  connect: "#f59e0b",
  convert: "#b45309",
} as const;

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";
const PDF_EXPORT_SETTLE_MS = 2600;
type SlideId = (typeof SLIDES)[number];

function getApiOrigin() {
  if (import.meta.env.DEV) {
    return `${window.location.protocol}//${window.location.hostname}:3001`;
  }

  if (API_BASE) {
    return new URL(API_BASE, window.location.origin).toString();
  }

  return window.location.origin;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia("(max-width: 768px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  const isMobile = useIsMobile();
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const isPdfExport = useMemo(() => {
    return searchParams.get("export") === "pdf";
  }, [searchParams]);
  const exportSlideId = useMemo<SlideId | null>(() => {
    const slide = searchParams.get("slide");
    if (!slide) {
      return null;
    }

    return SLIDES.find((candidate) => candidate === slide) ?? null;
  }, [searchParams]);
  const slides = isMobile && !isPdfExport ? SLIDES.filter((s) => s !== "appendix" && s !== "demo") : SLIDES;
  const exportSlides = isPdfExport && exportSlideId ? [exportSlideId] : SLIDES;
  const [current, setCurrent] = useState(0);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const handlePrint = useCallback(() => {
    window.print();
  }, []);
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

  // Sync CCC brand colors to CSS custom properties so all CSS can reference them
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
      pdfWindow.__PDF_READY__ = false;
      return;
    }

    root.dataset.exportMode = "pdf";
    root.dataset.pdfReady = "false";
    if (exportSlideId) {
      root.dataset.exportSlide = exportSlideId;
    }
    pdfWindow.__PDF_READY__ = false;

    let cancelled = false;
    const waitForFonts = document.fonts.ready.catch(() => undefined);
    const waitForImages = Promise.all(
      Array.from(document.images).map(
        (image) => new Promise<void>((resolve) => {
          if (image.complete) {
            resolve();
            return;
          }

          image.addEventListener("load", () => resolve(), { once: true });
          image.addEventListener("error", () => resolve(), { once: true });
        })
      )
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

  const next = useCallback(
    () => setCurrent((c) => Math.min(c + 1, slides.length - 1)),
    [slides.length]
  );
  const prev = useCallback(() => setCurrent((c) => Math.max(c - 1, 0)), []);

  // Keyboard navigation
  useEffect(() => {
    if (isPdfExport) {
      return;
    }

    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        next();
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isPdfExport, next, prev]);

  // Touch swipe navigation
  useEffect(() => {
    if (isPdfExport) {
      return;
    }

    let startX = 0;
    let startY = 0;
    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      const dx = startX - e.changedTouches[0].clientX;
      const dy = startY - e.changedTouches[0].clientY;
      // Only trigger on primarily horizontal swipes
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
        dx > 0 ? next() : prev();
      }
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [isPdfExport, next, prev]);

  const slideId = slides[current];

  return (
    <>
    {!isPdfExport && <div className="deck-root">
      {/* Ambient background blobs */}
      <div className="deck-bg">
        <div className="blob blob-top" />
        <div className="blob blob-right" />
        <div className="blob blob-bottom" />
      </div>

      {/* Top navigation bar */}
      <header className="deck-header">
        <button className="header-logo" onClick={() => setCurrent(0)} aria-label="Go to slide 1">
          <img
            src="/MayILogoTransparentBack.gif"
            alt="May I"
            className="logo-img"
          />
          <div>
            <div className="logo-name">May I</div>
            <div className="logo-sub">Investor Deck</div>
          </div>
        </button>

        <nav className="slide-dots" aria-label="Slide navigation">
          {slides.map((id, i) => (
            <button
              key={id}
              onClick={() => setCurrent(i)}
              className={`dot ${i === current ? "dot-active" : ""}`}
              aria-label={`Slide ${i + 1}`}
              aria-current={i === current ? "true" : undefined}
            />
          ))}
        </nav>

        <div className="header-actions">
          {!isMobile && (
            <>
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                title="Download a PDF rendered from the export-safe deck."
              >
                {isDownloadingPdf ? "Generating PDF..." : "Download PDF"}
              </button>
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={handlePrint}
                title="Print in landscape or save as PDF. Enable backgrounds in the print dialog for best results."
              >
                Print / Save PDF
              </button>
            </>
          )}
          <a
            href="https://www.mayiguide.com"
            target="_blank"
            rel="noreferrer"
            className="btn-primary btn-sm"
          >
            Live site
          </a>
        </div>
      </header>

      {/* Slide area */}
      <main className="deck-main">
        <AnimatePresence mode="wait">
          <motion.div
            key={slideId}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.38 }}
            className="slide-wrap"
          >
            {renderSlide(slideId, setCurrent, { isExportMode: false })}
            {/* slideId === "color-options" && <SlideColorOptions /> */}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom prev/next controls */}
      <footer className="deck-footer">
        <button
          onClick={prev}
          disabled={current === 0}
          className="nav-btn"
          aria-label="Previous slide"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="slide-counter">
          {current + 1} / {slides.length}
        </span>
        <button
          onClick={next}
          disabled={current === slides.length - 1}
          className="nav-btn"
          aria-label="Next slide"
        >
          <ChevronRight size={20} />
        </button>
      </footer>
    </div>}

    {/* Print-only deck: all slides rendered simultaneously, one per page */}
    <div className="print-deck" aria-hidden={isPdfExport ? undefined : "true"}>
      {exportSlides.map((id) => (
        <div key={id} className="print-slide">
          {renderSlide(id, () => {}, { isExportMode: isPdfExport })}
        </div>
      ))}
    </div>
    </>
  );
}

function renderSlide(
  slideId: (typeof SLIDES)[number],
  goTo: (index: number) => void,
  options: { isExportMode: boolean },
) {
  if (slideId === "founder") return <SlideFounder />;
  if (slideId === "hero") return <SlideHero goTo={goTo} />;
  if (slideId === "problem") return <SlideProblem />;
  if (slideId === "loss") return <SlideLoss />;
  if (slideId === "engine") return <SlideEngine />;
  if (slideId === "capture-detail") return <SlideCaptureDetail />;
  if (slideId === "connect-detail") return <SlideConnectDetail />;
  if (slideId === "convert-detail") return <SlideConvertDetail />;
  if (slideId === "roi") return <SlideROI />;
  if (slideId === "why-wins") return <SlideWhyWins />;
  if (slideId === "moats") return <SlideMoats />;
  if (slideId === "vision") return <SlideVision />;
  if (slideId === "path") return <SlidePath />;
  if (slideId === "demo") return <SlideDemo isExportMode={options.isExportMode} />;
  if (slideId === "appendix") return <SlideAppendix />;
  return null;
}

// ─── Slide 0: Founder ───────────────────────────────────────────────────────────

function SlideFounder() {
  const stats = [
    { value: "15+", label: "Years Leading" },
    { value: "6", label: "Products Launched" },
    { value: "$148M", label: "Annual Revenue" },
  ];

  return (
    <div className="slide slide-founder">
      <motion.div
        className="founder-left"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={fadeUp} className="founder-eyebrow">
          <span className="founder-dot" />
          Founder &amp; CEO · May I
        </motion.div>

        <motion.div variants={fadeUp} className="founder-name">
          <div className="founder-first">Chami</div>
          <div className="founder-last">Rupasinghe</div>
        </motion.div>

        <motion.p variants={fadeUp} className="founder-tagline">
          A seasoned <span className="accent-highlight">product leader</span> who guides teams to ideate, incubate, and launch enterprise grade software. In his past five years at <span className="accent-highlight">Microsoft</span> he has been focused on <span className="accent-highlight">Health and Life Sciences</span>, including two years in its prestigious <span className="accent-highlight">Microsoft Research</span> organization. Technical acumen is complemented by an <span className="accent-highlight">MBA from Duke University</span> and experience in marketing and sales.
        </motion.p>

        <motion.div variants={fadeUp} className="founder-stats">
          {stats.map(({ value, label }) => (
            <div key={label} className="founder-stat">
              <div className="founder-stat-value">{value}</div>
              <div className="founder-stat-label">{label}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      <motion.div
        className="founder-right"
        variants={slideInRight}
        initial="hidden"
        animate="show"
      >
        <img
          src="/chami_headshot.png"
          alt="Chami Rupasinghe"
          className="founder-photo"
        />
      </motion.div>
    </div>
  );
}

// ─── Slide 1: Hero ────────────────────────────────────────────────────────────

function SlideHero({ goTo }: { goTo: (i: number) => void }) {
  const isMobile = useIsMobile();
  const agendaAll = [
    { num: "2",  label: "Founder & CEO",         slide: 1  },
    { num: "3",  label: "The Problem",            slide: 2  },
    { num: "5",  label: "The May I System",       slide: 4  },
    { num: "9",  label: "Business Impact",        slide: 8  },
    { num: "10", label: "Competitive Landscape",  slide: 9  },
    { num: "11", label: "Investor Case",          slide: 10 },
    { num: "12", label: "Revenue Projections",    slide: 11 },
    { num: "13", label: "Vision",                 slide: 12 },
    { num: "14", label: "Live Demo",              slide: 13 },
    { num: "15", label: "Appendix",               slide: 14 },
  ];
  const agenda = isMobile ? agendaAll.filter((a) => a.label !== "Live Demo") : agendaAll;
  const agendaRef = useRef<HTMLDivElement>(null);

  return (
    <div className="slide slide-hero">

      {/* ── Top: header ── */}
      <motion.div
        className="hero-header"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={fadeUp} className="eyebrow-tag">
          Investor Pitch · 2026
        </motion.div>
        <motion.h1 variants={fadeUp} className="hero-headline">
          The AI Revenue Integrity Engine
          <span className="headline-accent"> for Healthcare.</span>
        </motion.h1>
        <motion.p variants={fadeUp} className="hero-sub">
          May I captures, qualifies, and converts every high-intent patient inquiry — before the competition picks up the phone.
        </motion.p>
      </motion.div>

      {/* ── Bottom: card + agenda ── */}
      <div className="hero-body">
        <motion.div
          className="hero-card-col"
          variants={slideInRight}
          initial="hidden"
          animate="show"
        >
          <div className="hero-card">
            <div className="hero-card-label">Revenue Integrity Engine</div>
            <div className="flow-rows">
              <div className="flow-row">
                <span className="flow-key">Demand in</span>
                <span className="flow-val">
                  {"Calls · Texts · "}
                  <span className="hide-mobile">{"Web · "}</span>
                  {"Social · Referrals"}
                </span>
              </div>
            </div>
            <div className="hero-engine-box">
              <div className="hero-engine-box-header">
                <img src="/MayILogoTransparentBack.gif" alt="May I" className="hero-engine-logo" />
                <div>
                  <div className="hero-engine-box-label">May I Engine</div>
                  <div className="hero-engine-box-tagline">System of Engagement</div>
                </div>
              </div>
            </div>
            <div className="flow-rows">
              <div className="flow-row">
                <span className="flow-key">Revenue out</span>
                <span className="flow-val hero-ccc-row">
                  {[
                    { label: "Capture", color: CCC_COLORS.capture },
                    { label: "Connect", color: CCC_COLORS.connect },
                    { label: "Convert", color: CCC_COLORS.convert },
                  ].map(({ label, color }, i) => (
                    <>
                      <span key={label} className="hero-ccc-label" style={{ color }}>{label}</span>
                      {i < 2 && <ArrowRight key={`arr-${i}`} size={14} className="hero-ccc-arrow" />}
                    </>
                  ))}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="hero-agenda-col"
          variants={stagger}
          initial="hidden"
          animate="show"
          ref={agendaRef}
        >
          <div className="hero-agenda">
            <div className="agenda-title">Agenda</div>
            <div className="agenda-columns">
              {agenda.slice(0, Math.ceil(agenda.length / 2)).flatMap((left, i) => {
                const right = agenda[Math.ceil(agenda.length / 2) + i];
                return [
                  <motion.button key={`ll-${left.num}`} variants={fadeUp} className="agenda-chip-label" onClick={() => goTo(left.slide)}>{left.label}</motion.button>,
                  <motion.span   key={`ln-${left.num}`} variants={fadeUp} className="agenda-chip-num"   onClick={() => goTo(left.slide)}>{left.num}</motion.span>,
                  right ? <motion.button key={`rl-${right.num}`} variants={fadeUp} className={`agenda-chip-label agenda-chip-label--right${right.num === "15" ? " agenda-item-appendix" : ""}`} onClick={() => goTo(right.slide)}>{right.label}</motion.button> : <span key={`rl-empty-${i}`} />,
                  right ? <motion.span   key={`rn-${right.num}`} variants={fadeUp} className="agenda-chip-num"   onClick={() => goTo(right.slide)}>{right.num}</motion.span> : <span key={`rn-empty-${i}`} />,
                ];
              })}
            </div>
          </div>
        </motion.div>
      </div>

    </div>
  );
}

// ─── Slide 2: Problem ─────────────────────────────────────────────────────────

function SlideProblem() {
  const problems = [
    {
      icon: <PhoneOff size={36} />,
      title: "Missed Demand",
      stat: "62%",
      statLabel: "of calls go unanswered after hours",
      text: "High-intent patients call, hit voicemail, and book elsewhere — sometimes within minutes.",
    },
    {
      icon: <Clock size={36} />,
      title: "Slow Speed-to-Lead",
      stat: "11×",
      statLabel: "drop in contact rate after 5 minutes",
      text: "Every minute of delay collapses the probability of converting a caller into a patient.",
    },
    {
      icon: <Layers size={36} />,
      title: "Fragmented Workflows",
      stat: "5–9",
      statLabel: "disconnected tools per practice",
      text: "Calls, texts, intake, scheduling, payer work — each in a separate silo.",
    },
    {
      icon: <RefreshCw size={36} />,
      title: "Manual Patient Ops",
      stat: "3×",
      statLabel: "patients re-enter the same info",
      text: "Patients repeat themselves. Staff re-enter the same data. Everyone loses.",
    },
  ];

  return (
    <div className="slide slide-problem">
      <SlideHeader
        eyebrow="The Problem"
        title="Patient experience is stuck in 1985."
      />
      <motion.div
        className="problem-grid"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {problems.map(({ icon, title, stat, statLabel, text }) => (
          <motion.div key={title} variants={fadeUp} className="problem-card">
            <div className="problem-icon">{icon}</div>
            <div className="problem-stat">{stat}</div>
            <div className="problem-stat-label">{statLabel}</div>
            <h3 className="problem-title">{title}</h3>
            <p className="problem-text">{text}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Slide 3: Invisible Loss ──────────────────────────────────────────────────

function SlideLoss() {
  const stages = [
    {
      icon: <DollarSign size={28} />,
      label: "Marketing Spend",
      sub: "Demand generated",
      color: "#5fcf8a",
    },
    {
      icon: <PhoneOff size={28} />,
      label: "Missed Call",
      sub: "Voicemail or no answer",
      color: "#f59e0b",
    },
    {
      icon: <Clock size={28} />,
      label: "Slow Follow-up",
      sub: "Intent cools within hours",
      color: "#f97316",
    },
    {
      icon: <XCircle size={28} />,
      label: "Lost Procedure",
      sub: "Revenue to competitors",
      color: "#ef4444",
    },
  ];

  return (
    <div className="slide slide-loss">
      <SlideHeader
        eyebrow="Invisible Loss"
        title="Practices lose revenue they cannot see."
      />
      <div className="loss-body">
        <motion.div
          className="leak-funnel"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          {stages.map(({ icon, label, sub, color }, i) => (
            <motion.div key={label} variants={fadeUp} className="leak-stage">
              <div
                className="leak-icon-wrap"
                style={{ borderColor: color, color }}
              >
                {icon}
              </div>
              <div className="leak-label">{label}</div>
              <div className="leak-sub">{sub}</div>
              {i < stages.length - 1 && (
                <ArrowRight size={18} className="leak-arrow" />
              )}
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="loss-callout"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.45 }}
        >
          <div className="loss-callout-inner">
            <div className="loss-big-stat">$5,000+</div>
            <div className="loss-big-label">
              average procedure value lost per missed call in elective healthcare
            </div>
          </div>
          <div className="loss-callout-inner">
            <div className="loss-big-stat">30–40%</div>
            <div className="loss-big-label">
              of first-time inquiries never receive a timely callback
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Slide 4: Engine overview ─────────────────────────────────────────────────

function SlideEngine() {
  const captureOutcomes = [
    { icon: <Calendar size={16} />, text: "Booked consults" },
    { icon: <ScanText size={16} />, text: "OCR intake" },
    { icon: <UserRound size={16} />, text: "Personalization" },
  ];
  const connectOutcomes = [
    { icon: <Globe size={16} />, text: "Payer portal submission" },
    { icon: <MailCheck size={16} />, text: "Pre-auth reconciliation" },
    { icon: <Workflow size={16} />, text: "CRM pipelines" },
  ];
  const convertOutcomes = [
    { icon: <PhoneOutgoing size={16} />, text: "Patient recalls" },
    { icon: <FileCheck size={16} />, text: "Surgery coordination" },
    { icon: <Banknote size={16} />, text: "Collections" },
  ];

  return (
    <div className="slide slide-engine">
      <SlideHeader
        eyebrow="The May I System"
        title="Capture → Connect → Convert"
      />
      <motion.p
        className="engine-subtitle"
        variants={fadeUp}
        initial="hidden"
        animate="show"
      >
        May I is the <strong>system of engagement</strong> — sitting between
        patients and practices, owning the conversion layer while EMR/PMS
        remains the system of record.
      </motion.p>
      <motion.div
        className="engine-diagram"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        {/* Inputs column */}
        <div className="engine-col engine-col-inputs">
          {[
            { icon: <Phone size={16} />, text: "Inbound calls" },
            { icon: <MessageSquare size={16} />, text: "SMS / text" },
            { icon: <Globe size={16} />, text: "Web chat" },
            { icon: <Share2 size={16} />, text: "Social leads" },
            { icon: <FileCheck size={16} />, text: "Referrals (Fax)" },
            { icon: <Database size={16} />, text: "EMR/PMS" },
          ].map(({ icon, text }) => (
            <div key={text} className="engine-chip">
              {icon}
              <span>{text}</span>
            </div>
          ))}
        </div>

        {/* Core engine with flanking labels */}
        <div className="engine-core-wrap engine-col-core">
          <div className="engine-side-label engine-side-label-inputs">Inputs</div>
          <div className="engine-core">
          <div className="engine-core-header">
            <img src="/MayILogoTransparentBack.gif" alt="May I" className="engine-core-logo" />
            <div>
              <div className="engine-core-label">May I Engine</div>
              <div className="engine-core-tagline">System of Engagement</div>
            </div>
          </div>
          <div className="engine-core-items">
            {[
              { icon: <BotMessageSquare size={26} />, text: "Agentic Voice + Text + Vision" },
              { icon: <Brain size={26} />, text: "Agentic CRM Orchestrator & Memory" },
              { icon: <MousePointerClick size={26} />, text: "Agentic Computer Use" },
            ].map(({ icon, text }) => (
              <div key={text} className="engine-core-item">
                {icon}
                <span>{text}</span>
              </div>
            ))}
          </div>
          </div>
          <div className="engine-side-label engine-side-label-outcomes">Outcomes</div>
        </div>

        {/* Outcomes column — grouped by Capture / Connect / Convert */}
        <div className="engine-col engine-col-outcomes">
          <div className="engine-group">
            <div className="engine-group-label engine-group-capture">Capture</div>
            {captureOutcomes.map(({ icon, text }) => (
              <div key={text} className="engine-chip engine-chip-out engine-chip-capture">{icon}<span>{text}</span></div>
            ))}
          </div>
          <div className="engine-group">
            <div className="engine-group-label engine-group-connect">Connect</div>
            {connectOutcomes.map(({ icon, text }) => (
              <div key={text} className="engine-chip engine-chip-out engine-chip-connect">{icon}<span>{text}</span></div>
            ))}
          </div>
          <div className="engine-group">
            <div className="engine-group-label engine-group-convert">Convert</div>
            {convertOutcomes.map(({ icon, text }) => (
              <div key={text} className="engine-chip engine-chip-out engine-chip-convert">{icon}<span>{text}</span></div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Slide 5: CCC Overview (circular diagram) ────────────────────────────────

// ─── Slide 6a: Capture detail ─────────────────────────────────────────────────

function SlideCaptureDetail() {
  const cards = [
    {
      icon: <BotMessageSquare size={20} />,
      title: "AI Comms",
      text: "AI answers patient calls and texts, captures demographic and insurance information, negotiates availability, and schedules consultations in the EMR/PMS.",
      shade: "card-capture",
    },
    {
      icon: <ScanText size={20} />,
      title: "AI Object Character Recognition",
      text: "AI extracts patient demographic and insurance information from faxes and documents and schedules consultations in the EMR/PMS.",
      shade: "card-capture",
    },
    {
      icon: <UserRound size={20} />,
      title: "Personalization",
      text: "All customer conversations and future intent are captured in the CRM. This data is used to personalize patient engagement at every touchpoint.",
      shade: "card-capture",
    },
  ];

  return (
    <div className="slide slide-detail">
      <div className="detail-left">
        <div className="detail-eyebrow">Capture</div>
        <div className="detail-friction">
          Front office personnel spend{" "}
          <span className="detail-pct">30%</span> of their time manually
          capturing patient information and scheduling appointments.
        </div>
      </div>
      <motion.div
        className="detail-right"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {cards.map(({ icon, title, text, shade }) => (
          <motion.div key={title} variants={fadeUp} className={`detail-card ${shade}`}>
            <div className="detail-card-title">{icon}{title}</div>
            <div className="detail-card-text">{text}</div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Slide 6b: Connect detail ─────────────────────────────────────────────────

function SlideConnectDetail() {
  const cards = [
    {
      icon: <FileSearch size={20} />,
      title: "AI submits patient data in payer portals",
      text: "AI navigates payer portals, enters patient data, and triggers insurance pre-authorization automatically.",
      shade: "card-connect",
    },
    {
      icon: <MailCheck size={20} />,
      title: "AI analyzes emails to reconcile pre-auth",
      text: "Responses that arrive via email are reconciled, resubmitted, or flagged — without staff involvement.",
      shade: "card-connect",
    },
    {
      icon: <Workflow size={20} />,
      title: "Agentic CRM automates pipelines",
      text: "Inputs, agentic operations, and outputs are defined for each stage in the CRM and automatically moved to the next stage until complete.",
      shade: "card-connect",
    },
  ];

  return (
    <div className="slide slide-detail">
      <div className="detail-left">
        <div className="detail-eyebrow">Connect</div>
        <div className="detail-friction">
          Front office personnel spend{" "}
          <span className="detail-pct">20%</span> of their time manually
          entering data into payer portals, and emailing or calling payers
          to verify insurance.
        </div>
      </div>
      <motion.div
        className="detail-right"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {cards.map(({ icon, title, text, shade }) => (
          <motion.div key={title} variants={fadeUp} className={`detail-card ${shade}`}>
            <div className="detail-card-title">{icon}{title}</div>
            <div className="detail-card-text">{text}</div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Slide 6c: Convert detail ─────────────────────────────────────────────────

function SlideConvertDetail() {
  const cards = [
    {
      icon: <PhoneOutgoing size={20} />,
      title: "Patient Recall Automation",
      text: "AI identifies patients due for follow-ups and automatically initiates call or text outreach based on last visit date and procedure history.",
      shade: "card-convert",
    },
    {
      icon: <SurgeryIcon size={20} />,
      title: "Procedure & Surgery Coordination",
      text: "AI coordinates procedure scheduling across clinics and surgery centers. Automatically confirms availability and manages paperwork.",
      shade: "card-convert",
    },
    {
      icon: <Banknote size={20} />,
      title: "Intelligent Collections",
      text: "AI agents follow up on outstanding balances through personalized calls and texts. Improves collection rates and reduces days in A/R.",
      shade: "card-convert",
    },
  ];

  return (
    <div className="slide slide-detail">
      <div className="detail-left">
        <div className="detail-eyebrow">Convert</div>
        <div className="detail-friction">
          Front desk personnel spend{" "}
          <span className="detail-pct">10%</span> of their time making
          outbound calls for patient recalls, scheduling surgeries, or
          billing.
        </div>
      </div>
      <motion.div
        className="detail-right"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {cards.map(({ icon, title, text, shade }) => (
          <motion.div key={title} variants={fadeUp} className={`detail-card ${shade}`}>
            <div className="detail-card-title">{icon}{title}</div>
            <div className="detail-card-text">{text}</div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Slide 6: ROI ─────────────────────────────────────────────────────────────

function SlideROI() {
  const metrics = [
    {
      icon: <DollarSign size={32} />,
      value: "+$68K",
      label: "Revenue recovered per doctor / year",
      color: "#5fcf8a",
    },
    {
      icon: <Users size={32} />,
      value: "−$45K",
      label: "Annual staff cost pressure reduced",
      color: "var(--mi-copper)",
    },
    {
      icon: <Zap size={32} />,
      value: "~35%",
      label: "Front-desk workload automated",
      color: "#a78bfa",
    },
    {
      icon: <Shield size={32} />,
      value: "24/7",
      label: "Concierge coverage without turnover",
      color: "#38bdf8",
    },
  ];

  return (
    <div className="slide slide-roi">
      <SlideHeader
        eyebrow="Business Impact"
        title="Built to recover revenue, not just reduce overhead."
      />
      <motion.div
        className="roi-grid"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {metrics.map(({ icon, value, label, color }) => (
          <motion.div key={label} variants={fadeUp} className="roi-card">
            <div className="roi-icon" style={{ color }}>
              {icon}
            </div>
            <div className="roi-value" style={{ color }}>
              {value}
            </div>
            <div className="roi-label">{label}</div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Slide 8: Why May I Wins ──────────────────────────────────────────────────

function SlideWhyWins() {
  const rows = [
    {
      competitor: "Generic AI Telephony",
      does: "Answers calls",
      gap: "No workflow execution or specialty revenue logic",
      isMayI: false,
    },
    {
      competitor: "Answering Services",
      does: "Takes messages",
      gap: "Adds labor, delays follow-up, no conversion ownership",
      isMayI: false,
    },
    {
      competitor: "Patient Engagement Tools",
      does: "Post-visit comms",
      gap: "Lives downstream of the missed-call problem",
      isMayI: false,
    },
    {
      competitor: "May I",
      does: "AI comms + CRM memory + workflow + revenue outcomes",
      gap: "Owns the full patient conversion layer",
      isMayI: true,
    },
  ];

  return (
    <div className="slide slide-why-wins">
      <SlideHeader
        eyebrow="Competitive Landscape"
        title="Generic AI answers calls. May I drives outcomes."
      />
      <motion.div
        className="compare-table"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        <div className="compare-header">
          <div className="compare-col-a">Solution</div>
          <div className="compare-col-b">What it does</div>
          <div className="compare-col-c">Gap / May I advantage</div>
        </div>
        {rows.map(({ competitor, does, gap, isMayI }) => (
          <motion.div
            key={competitor}
            variants={fadeUp}
            className={`compare-row ${isMayI ? "compare-row-mayi" : ""}`}
          >
            <div className="compare-col-a">
              {isMayI ? (
                <span className="compare-badge">
                  <CheckCircle2 size={14} />
                  {competitor}
                </span>
              ) : (
                <span className="compare-competitor">{competitor}</span>
              )}
            </div>
            <div className="compare-col-b">{does}</div>
            <div
              className={`compare-col-c ${
                isMayI ? "compare-mayi-text" : "compare-gap-text"
              }`}
            >
              {gap}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Slide 9: Moats ───────────────────────────────────────────────────────────

/* COMMENTED OUT — original Defensibility/Moats content
function SlideMoats_original() {
  const moats = [
    { icon: <Activity size={30} />, title: "Closed-loop Revenue Attribution", text: "Connects first contact → response → booking → procedure → payment.", color: "#5fcf8a" },
    { icon: <Brain size={30} />, title: "Patient Intent Graph", text: "Models sentiment, urgency, timing, and readiness to convert.", color: "var(--mi-copper)" },
    { icon: <Stethoscope size={30} />, title: "Procedure-Aware Models", text: "Specialty-specific objection handling, prep flows, and follow-up logic.", color: "#a78bfa" },
    { icon: <Shield size={30} />, title: "Dynamic Trust & Friction", text: "Adapts verification to risk, context, and patient intent.", color: "#38bdf8" },
    { icon: <Database size={30} />, title: "Practice Operating Memory", text: "Captures the language, handoffs, and behaviors that convert for each practice.", color: "#f59e0b" },
  ];
  return (
    <div className="slide slide-moats">
      <SlideHeader eyebrow="Defensibility" title="The path to $1B is owning the patient conversion layer." />
      <div className="moats-layout">
        <motion.div className="moats-grid" variants={stagger} initial="hidden" animate="show">
          {moats.map(({ icon, title, text, color }) => (
            <motion.div key={title} variants={fadeUp} className="moat-card">
              <div className="moat-icon" style={{ color }}>{icon}</div>
              <div className="moat-title">{title}</div>
              <div className="moat-text">{text}</div>
            </motion.div>
          ))}
        </motion.div>
        <motion.div className="moats-logic" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 0.5 }}>
          <div className="moats-logic-title">Billion-dollar logic</div>
          <div className="moats-logic-steps">
            {[{step:"Land",desc:"Obvious ROI: recover missed demand + reduce staff burden"},{step:"Expand",desc:"Conversion intelligence + revenue attribution across the practice"},{step:"Defend",desc:"Practice-specific memory that becomes impossible to replicate"}].map(({ step, desc }) => (
              <div key={step} className="moats-logic-step"><div className="moats-logic-step-label">{step}</div><div className="moats-logic-step-desc">{desc}</div></div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
END COMMENTED OUT */

function SlideMoats() {
  const rows: { year: string; providers: string; share: string; arr: string; val: string; milestone?: boolean }[] = [
    { year: "Year 1", providers: "150",    share: "0.01%", arr: "$1.08M",   val: "$8.6M"           },
    { year: "Year 2", providers: "450",    share: "0.04%", arr: "$3.24M",   val: "$25.9M"          },
    { year: "Year 3", providers: "1,125",  share: "0.10%", arr: "$8.10M",   val: "$64.8M"          },
    { year: "Year 4", providers: "2,475",  share: "0.23%", arr: "$17.82M",  val: "$142.5M"         },
    { year: "Year 5", providers: "4,950",  share: "0.45%", arr: "$35.64M",  val: "$285.1M"         },
    { year: "Year 6", providers: "8,415",  share: "0.77%", arr: "$60.58M",  val: "$484.7M"         },
    { year: "Year 7", providers: "12,622", share: "1.15%", arr: "$90.88M",  val: "$727.0M"         },
    { year: "Year 8", providers: "17,600", share: "1.60%", arr: "$126.72M", val: "$1.01B", milestone: true },
  ];

  const arrValues = [1.08, 3.24, 8.10, 17.82, 35.64, 60.58, 90.88, 126.72];
  const xLabels   = ["Y1", "Y2", "Y3", "Y4", "Y5", "Y6", "Y7", "Y8"];

  const W = 420, H = 280;
  const PAD = { l: 52, r: 16, t: 18, b: 34 };
  const CW  = W - PAD.l - PAD.r;
  const CH  = H - PAD.t - PAD.b;
  const MAX = 140;
  const BAR_SLOT = CW / 8;
  const BAR_W    = BAR_SLOT * 0.58;
  const BAR_OFF  = (BAR_SLOT - BAR_W) / 2;
  const chartBottom = PAD.t + CH;
  const toY  = (v: number) => PAD.t + CH * (1 - v / MAX);
  const toBH = (v: number) => CH * (v / MAX);
  const barX  = (i: number) => PAD.l + i * BAR_SLOT + BAR_OFF;
  const barCX = (i: number) => PAD.l + i * BAR_SLOT + BAR_SLOT / 2;
  const yTicks = [0, 25, 50, 75, 100, 125];
  const linePath = arrValues
    .map((v, i) => `${i === 0 ? "M" : "L"} ${barCX(i).toFixed(1)},${toY(v).toFixed(1)}`)
    .join(" ");

  return (
    <div className="slide slide-moats">
      <SlideHeader
        eyebrow="Revenue Projection"
        title="The path to $1B is owning the patient conversion layer."
      />
      <div className="rev-layout">

        {/* ── Bar chart ── */}
        <motion.div
          className="rev-chart-col"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <svg viewBox={`0 0 ${W} ${H}`} className="rev-chart-svg" aria-label="ARR by year">
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#fcd34d" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#b45309" stopOpacity="0.55" />
              </linearGradient>
              <linearGradient id="barGradHi" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#fcd34d" stopOpacity="1"   />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.9" />
              </linearGradient>
            </defs>

            {yTicks.map((t) => {
              const y = toY(t);
              return (
                <g key={t}>
                  <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y}
                    stroke="rgba(255,255,255,0.07)" strokeWidth="1"
                    strokeDasharray={t === 0 ? undefined : "3 5"} />
                  <text x={PAD.l - 6} y={y + 3.5} textAnchor="end"
                    fontSize="9" fill="rgba(168,196,184,0.65)">
                    {t === 0 ? "0" : `$${t}M`}
                  </text>
                </g>
              );
            })}

            <line x1={PAD.l} y1={chartBottom} x2={W - PAD.r} y2={chartBottom}
              stroke="rgba(255,255,255,0.18)" strokeWidth="1" />

            <text x={11} y={H / 2} textAnchor="middle" fontSize="9"
              fill="rgba(168,196,184,0.5)" transform={`rotate(-90,11,${H / 2})`}>
              ARR ($M)
            </text>

            {arrValues.map((v, i) => (
              <motion.rect key={i}
                x={barX(i)} width={BAR_W} rx="3"
                fill={i === 7 ? "url(#barGradHi)" : "url(#barGrad)"}
                initial={{ height: 0, y: chartBottom }}
                animate={{ height: toBH(v), y: chartBottom - toBH(v) }}
                transition={{ duration: 0.55, delay: 0.3 + i * 0.07, ease: "easeOut" }}
              />
            ))}

            <motion.path d={linePath} fill="none"
              stroke="#fcd34d" strokeWidth="1.5" strokeOpacity="0.5" strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.85, ease: "easeInOut" }}
            />

            {arrValues.map((v, i) => (
              <motion.circle key={i} cx={barCX(i)} cy={toY(v)} r="2.8"
                fill="#fcd34d"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: 1.0 + i * 0.06 }}
              />
            ))}

            {xLabels.map((lbl, i) => (
              <text key={lbl} x={barCX(i)} y={H - PAD.b + 14}
                textAnchor="middle" fontSize="9" fill="rgba(168,196,184,0.7)">
                {lbl}
              </text>
            ))}
          </svg>
        </motion.div>

        {/* ── Table ── */}
        <motion.div
          className="rev-table-wrap"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <table className="rev-table">
            <thead>
              <tr>
                <th>Year</th>
                <th>Providers</th>
                <th>Share</th>
                <th>ARR</th>
                <th>Valuation (8×)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ year, providers, share, arr, val, milestone }) => (
                <tr key={year} className={milestone ? "rev-row-milestone" : ""}>
                  <td className="rev-year">{year}</td>
                  <td className="rev-num">{providers}</td>
                  <td className="rev-share">{share}</td>
                  <td className="rev-arr">{arr}</td>
                  <td className="rev-val">{val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

      </div>
    </div>
  );
}

// ─── Slide 10: Vision ─────────────────────────────────────────────────────────

function SlideVision() {
  const phases = [
    {
      num: "01",
      phase: "Today",
      icon: <Phone size={32} />,
      headline: "Stop the leak",
      text: "Inbound capture, instant response, appointment booking — the wedge that pays for itself.",
      color: "var(--mi-copper)",
    },
    {
      num: "02",
      phase: "Tomorrow",
      icon: <GitMerge size={32} />,
      headline: "Own the workflow, capture the data",
      text: "Insurance Pre-auth, Billing, Patient recalls — orchestrated by May I across the full patient journey.",
      color: "#a78bfa",
    },
    {
      num: "03",
      phase: "Future",
      icon: <Rocket size={32} />,
      headline: "Predict and action on the data",
      text: "Intent intelligence, Targeted Marketing, and Personalization — May I becomes indispensable infrastructure.",
      color: "#5fcf8a",
    },
  ];

  return (
    <div className="slide slide-vision">
      <motion.div
        className="vision-header"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={fadeUp} className="eyebrow-tag">
          Vision
        </motion.div>
        <motion.h2 variants={fadeUp} className="vision-title">
          From front-desk automation
          <br />
          to the intelligent operating layer for healthcare.
        </motion.h2>
      </motion.div>

      <motion.div
        className="vision-phases"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {phases.map(({ num, phase, icon, headline, text, color }) => (
          <motion.div key={phase} variants={fadeUp} className="vision-phase">
            <div className="vision-phase-num" style={{ color }}>
              {num}
            </div>
            <div className="vision-phase-icon" style={{ color }}>
              {icon}
            </div>
            <div className="vision-phase-label" style={{ color }}>
              {phase}
            </div>
            <div className="vision-phase-headline">{headline}</div>
            <div className="vision-phase-text">{text}</div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="vision-cta"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
      >
        <div className="vision-cta-text">
          Capture every inquiry. Convert more patients. Compound revenue
          intelligence.
        </div>
        <a
          href="https://www.mayiguide.com"
          target="_blank"
          rel="noreferrer"
          className="btn-primary"
        >
          Visit mayiguide.com
        </a>
      </motion.div>
    </div>
  );
}

// ─── Slide: Path to $1B ─────────────────────────────────────────────────────

function SlidePath() {
  // ── Layout constants (SVG user-space coords) ──
  const W = 820, H = 436;
  const ROWS = 9;
  const TTOP = 16; // top margin for column labels
  const rH = (H - TTOP) / ROWS; // ~46.7

  const ROOT  = { x: 52,  y: TTOP + 4.5 * rH, r: 40 };
  const SHAREX = 172; const SHARER = 28;
  const PRICEX = 318; const PRICER = 20;
  const ARRX   = 476; const ARRHW = 38; const ARRHH = 13;
  const VALX   = 672; const VALHW = 50; const VALHH = 16;

  const sy = (si: number) => TTOP + (si * 3 + 1.5) * rH;
  const py = (i:  number) => TTOP + (i  + 0.5)     * rH;

  // Returns line segment from edge of source circle to just before target edge
  const edge = (x1: number, y1: number, r1: number, x2: number, y2: number, gap: number) => {
    const dx = x2 - x1, dy = y2 - y1;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    const ux = dx / d, uy = dy / d;
    return { x1: x1 + ux * r1, y1: y1 + uy * r1, x2: x2 - ux * gap, y2: y2 - uy * gap };
  };

  const shareData = [
    { pct: "2.2%", users: "24,200", hl: false },
    { pct: "1.6%", users: "17,600", hl: true  },
    { pct: "1.0%", users: "11,000", hl: false },
  ];
  const prices = ["$800/mo", "$600/mo", "$400/mo"];

  type Sc = { si: number; pi: number; arr: string; val: string;
              isBillion: boolean; isSweet: boolean; isAnnotate: boolean; };
  const scenarios: Sc[] = [
    { si:0, pi:0, arr:"$232.3M", val:"$1.86B", isBillion:true,  isSweet:false, isAnnotate:false },
    { si:0, pi:1, arr:"$174.2M", val:"$1.39B", isBillion:true,  isSweet:false, isAnnotate:false },
    { si:0, pi:2, arr:"$116.2M", val:"$929M",  isBillion:false, isSweet:false, isAnnotate:false },
    { si:1, pi:0, arr:"$168.9M", val:"$1.35B", isBillion:true,  isSweet:false, isAnnotate:false },
    { si:1, pi:1, arr:"$126.7M", val:"$1.01B", isBillion:true,  isSweet:true,  isAnnotate:false },
    { si:1, pi:2, arr:"$84.5M",  val:"$676M",  isBillion:false, isSweet:false, isAnnotate:false },
    { si:2, pi:0, arr:"$105.6M", val:"$845M",  isBillion:false, isSweet:false, isAnnotate:true  },
    { si:2, pi:1, arr:"$79.2M",  val:"$634M",  isBillion:false, isSweet:false, isAnnotate:false },
    { si:2, pi:2, arr:"$52.8M",  val:"$422M",  isBillion:false, isSweet:false, isAnnotate:false },
  ];

  return (
    <div className="slide slide-path">
      <motion.div className="path-top" variants={stagger} initial="hidden" animate="show">
        <motion.div variants={fadeUp} className="eyebrow-tag">Investor Case</motion.div>
        <motion.h2 variants={fadeUp} className="path-headline">
          The <span className="path-accent">1.6%</span> Path to a{" "}
          <span className="path-accent">$1B</span> Valuation.
        </motion.h2>
      </motion.div>

      <div className="path-body">
        {/* ── SVG Decision Tree ── */}
        <motion.div className="path-tree-area" variants={stagger} initial="hidden" animate="show">
          <motion.svg
            variants={fadeUp}
            viewBox={`0 0 ${W} ${H}`}
            className="dt-svg"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {(["muted","gold","green"] as const).map((n) => (
                <marker key={n} id={`arr-${n}`}
                  markerWidth="8" markerHeight="8" refX="6" refY="4"
                  orient="auto" markerUnits="userSpaceOnUse">
                  <path d="M0,0.5 L0,7.5 L8,4 z" fill={
                    n==="gold"  ? "rgba(196,146,71,0.9)" :
                    n==="green" ? "rgba(95,207,138,0.8)" :
                                  "rgba(168,196,184,0.35)"
                  } />
                </marker>
              ))}
            </defs>

            {/* Column labels */}
            {(["TAM", "SHARE", "PRICING", "ARR", "VALUATION × 8"] as const).map((lbl, i) => (
              <text key={lbl}
                x={[ROOT.x, SHAREX, PRICEX, ARRX, VALX][i]}
                y={10} textAnchor="middle"
                fill="rgba(168,196,184,0.4)" fontSize={7.5} fontWeight={600}
              >{lbl}</text>
            ))}

            {/* ── Root → Share arrows ── */}
            {shareData.map((sd, si) => {
              const a = edge(ROOT.x, ROOT.y, ROOT.r, SHAREX, sy(si), SHARER + 6);
              return (
                <line key={`rs${si}`} x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2}
                  stroke={sd.hl ? "rgba(196,146,71,0.7)" : "rgba(168,196,184,0.18)"}
                  strokeWidth={sd.hl ? 1.6 : 0.8}
                  strokeDasharray={sd.hl ? undefined : "4 4"}
                  markerEnd={sd.hl ? "url(#arr-gold)" : "url(#arr-muted)"} />
              );
            })}

            {/* ── Share → Price arrows ── */}
            {scenarios.map((s, i) => {
              const a = edge(SHAREX, sy(s.si), SHARER, PRICEX, py(i), PRICER + 6);
              const hl = s.isSweet;
              const dimHl = s.si === 1;
              return (
                <line key={`sp${i}`} x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2}
                  stroke={hl ? "rgba(196,146,71,0.75)" : dimHl ? "rgba(196,146,71,0.22)" : "rgba(168,196,184,0.13)"}
                  strokeWidth={hl ? 1.6 : 0.7}
                  strokeDasharray={hl ? undefined : "3 4"}
                  markerEnd={hl ? "url(#arr-gold)" : "url(#arr-muted)"} />
              );
            })}

            {/* ── Price → ARR arrows ── */}
            {scenarios.map((s, i) => {
              const iy = py(i);
              return (
                <line key={`pa${i}`}
                  x1={PRICEX + PRICER} y1={iy}
                  x2={ARRX - ARRHW - 5} y2={iy}
                  stroke={s.isSweet ? "rgba(196,146,71,0.75)" : s.isBillion ? "rgba(95,207,138,0.3)" : "rgba(168,196,184,0.12)"}
                  strokeWidth={s.isSweet ? 1.6 : 0.7}
                  strokeDasharray={s.isSweet ? undefined : "3 4"}
                  markerEnd={s.isSweet ? "url(#arr-gold)" : s.isBillion ? "url(#arr-green)" : "url(#arr-muted)"} />
              );
            })}

            {/* ── ARR → Val arrows ── */}
            {scenarios.map((s, i) => {
              const iy = py(i);
              return (
                <line key={`av${i}`}
                  x1={ARRX + ARRHW} y1={iy}
                  x2={VALX - VALHW - 5} y2={iy}
                  stroke={s.isSweet ? "rgba(196,146,71,0.75)" : s.isBillion ? "rgba(95,207,138,0.3)" : "rgba(168,196,184,0.12)"}
                  strokeWidth={s.isSweet ? 1.6 : 0.7}
                  strokeDasharray={s.isSweet ? undefined : "3 4"}
                  markerEnd={s.isSweet ? "url(#arr-gold)" : s.isBillion ? "url(#arr-green)" : "url(#arr-muted)"} />
              );
            })}

            {/* ── Root node ── */}
            <circle cx={ROOT.x} cy={ROOT.y} r={ROOT.r}
              fill="rgba(0,51,32,0.75)" stroke="rgba(0,74,46,0.9)" strokeWidth={1.5} />
            {/* inner glow ring */}
            <circle cx={ROOT.x} cy={ROOT.y} r={ROOT.r - 5}
              fill="none" stroke="rgba(0,74,46,0.35)" strokeWidth={0.75} />
            <text x={ROOT.x} y={ROOT.y - 7} textAnchor="middle"
              fill="white" fontSize={20} fontWeight={700}>1.1M</text>
            <text x={ROOT.x} y={ROOT.y + 8} textAnchor="middle"
              fill="rgba(196,146,71,0.9)" fontSize={7} fontWeight={600}>PRACTITIONERS</text>
            <text x={ROOT.x} y={ROOT.y + 20} textAnchor="middle"
              fill="rgba(168,196,184,0.5)" fontSize={6.5}>Total Market</text>

            {/* ── Share nodes ── */}
            {shareData.map((sd, si) => {
              const cy = sy(si);
              return (
                <g key={`sn${si}`}>
                  <circle cx={SHAREX} cy={cy} r={SHARER}
                    fill={sd.hl ? "rgba(144,99,35,0.25)" : "rgba(0,51,32,0.65)"}
                    stroke={sd.hl ? "rgba(196,146,71,0.9)" : "rgba(0,74,46,0.5)"}
                    strokeWidth={sd.hl ? 1.75 : 0.8} />
                  {sd.hl && (
                    <circle cx={SHAREX} cy={cy} r={SHARER - 4}
                      fill="none" stroke="rgba(196,146,71,0.25)" strokeWidth={0.75} />
                  )}
                  <text x={SHAREX} y={cy - 4} textAnchor="middle"
                    fill={sd.hl ? "rgba(196,146,71,1)" : "rgba(255,255,255,0.9)"}
                    fontSize={sd.hl ? 14 : 12} fontWeight={700}>{sd.pct}</text>
                  <text x={SHAREX} y={cy + 9} textAnchor="middle"
                    fill="rgba(168,196,184,0.65)" fontSize={6.5}>{sd.users}</text>
                  {sd.hl && (
                    <text x={SHAREX} y={cy + SHARER + 11} textAnchor="middle"
                      fill="rgba(196,146,71,0.8)" fontSize={6.5} fontWeight={600}>▲ Primary Target</text>
                  )}
                </g>
              );
            })}

            {/* ── Price nodes ── */}
            {scenarios.map((s, i) => {
              const iy = py(i);
              const hl = s.isSweet;
              return (
                <g key={`pn${i}`}>
                  <circle cx={PRICEX} cy={iy} r={PRICER}
                    fill={hl ? "rgba(144,99,35,0.28)" : "rgba(0,51,32,0.6)"}
                    stroke={hl ? "rgba(196,146,71,0.9)" : "rgba(0,74,46,0.4)"}
                    strokeWidth={hl ? 1.5 : 0.7} />
                  <text x={PRICEX} y={iy + 4} textAnchor="middle"
                    fill={hl ? "rgba(196,146,71,1)" : "rgba(255,255,255,0.85)"}
                    fontSize={hl ? 9.5 : 8} fontWeight={hl ? 700 : 500}>{prices[s.pi]}</text>
                </g>
              );
            })}

            {/* ── ARR pills ── */}
            {scenarios.map((s, i) => {
              const iy = py(i);
              const stroke = s.isSweet ? "rgba(196,146,71,0.7)"  : s.isBillion ? "rgba(95,207,138,0.45)" : "rgba(0,74,46,0.32)";
              const fill   = s.isSweet ? "rgba(144,99,35,0.2)"   : s.isBillion ? "rgba(95,207,138,0.07)" : "rgba(0,51,32,0.35)";
              const tFill  = s.isSweet ? "rgba(196,146,71,0.95)" : s.isBillion ? "rgba(95,207,138,0.85)" : "rgba(168,196,184,0.7)";
              return (
                <g key={`an${i}`}>
                  <rect x={ARRX - ARRHW} y={iy - ARRHH}
                    width={ARRHW * 2} height={ARRHH * 2} rx={ARRHH}
                    fill={fill} stroke={stroke} strokeWidth={s.isSweet ? 1.2 : 0.7} />
                  <text x={ARRX} y={iy + 4} textAnchor="middle"
                    fill={tFill} fontSize={s.isSweet ? 9 : 8}
                    fontWeight={s.isSweet ? 700 : 500}>{s.arr}</text>
                </g>
              );
            })}

            {/* ── Valuation leaf nodes (pills) ── */}
            {scenarios.map((s, i) => {
              const iy = py(i);
              const stroke = s.isSweet ? "rgba(196,146,71,0.9)" : s.isBillion ? "rgba(95,207,138,0.55)" : "rgba(0,74,46,0.35)";
              const fill   = s.isSweet ? "rgba(144,99,35,0.28)"  : s.isBillion ? "rgba(95,207,138,0.1)"  : "rgba(0,51,32,0.45)";
              const tFill  = s.isSweet ? "rgba(196,146,71,1)"    : s.isBillion ? "#5fcf8a"               : "rgba(168,196,184,0.85)";
              return (
                <g key={`vn${i}`}>
                  <rect x={VALX - VALHW} y={iy - VALHH}
                    width={VALHW * 2} height={VALHH * 2} rx={VALHH}
                    fill={fill} stroke={stroke}
                    strokeWidth={s.isSweet ? 1.5 : 0.75} />
                  <text x={VALX} y={iy + 4} textAnchor="middle"
                    fill={tFill} fontSize={s.isSweet ? 11 : 9.5}
                    fontWeight={s.isBillion ? 700 : 600}>{s.val}</text>
                  {s.isSweet && (
                    <text x={VALX + VALHW + 6} y={iy + 4} textAnchor="start"
                      fill="rgba(196,146,71,0.85)" fontSize={7.5} fontWeight={700}>★</text>
                  )}
                </g>
              );
            })}
          </motion.svg>

          {/* Callout bar */}
          <motion.div variants={fadeUp} className="dt-callout">
            <span className="dt-callout-label">Pricing</span>
            <span className="dt-callout-text">Designed as per provider per month.</span>
          </motion.div>
        </motion.div>

        {/* ── Right column – Economic Moat + Sensitivity ── */}
        <motion.div className="path-right-col" variants={stagger} initial="hidden" animate="show">
          <motion.div variants={fadeUp} className="path-col-label">The Economic Moat</motion.div>
          <motion.div variants={fadeUp} className="moat-block">
            <div className="moat-tag-line">FTE Replacement, not SaaS</div>
            {([
              ["Hours saved / week", "10 hrs charting", false],
              ["Annual labor value", "$50,000", true],
              ["May I annual price", "$7,200", false],
              ["Practitioner ROI", "7× — no-brainer", true],
            ] as const).map(([k, v, bold]) => (
              <div key={k} className={`moat-row${bold ? " moat-row-bold" : ""}`}>
                <span className="moat-k">{k}</span>
                <span className="moat-v">{v}</span>
              </div>
            ))}
          </motion.div>

          <motion.div variants={fadeUp} className="priority-legend">
            <div className="priority-legend-title">Segment Priority Framework</div>
            {([
              [1, "High-Yield Retail",     "Massive ATV; every lead is a \u201cmust-win\u201d."],
              [2, "Velocity Hubs",          "High transaction counts; ROI comes from time saved."],
              [3, "Specialty Segments",     "High complexity; ROI comes from billing/auth accuracy."],
              [4, "Infrastructure Tier",    "The \u201clong-game\u201d volume play."],
            ] as const).map(([num, label, desc]) => (
              <div key={num} className={`pl-row pl-row-${num}`}>
                <span className="pl-badge">{num}</span>
                <span className="pl-label">{label}</span>
                <span className="pl-desc">{desc}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Appendix ───────────────────────────────────────────────────────────────

const APX_ROWS = [
  { cat: "Orthodontics",    prac: "~16,000",  pract: "~21,000",   atv: "$6,200",  trans: "~350 (Starts)",  tam: "~$35B",   sam: "$171.8M", pri: 1, note: 'High value \u201cStarts\u201d and extreme consumer shopping behavior. Predictable buying unit.' },
  { cat: "Medical Spas",    prac: "~10,500",  pract: "~25,000",   atv: "$536",    trans: "~2,940",         tam: "~$17B",   sam: "$112.8M", pri: 1, note: 'Hyper-competitive retail environment. Highest demand for \u201cInstant Response\u201d AI agents.' },
  { cat: "Plastic Surgery", prac: "~4,500",   pract: "~7,200",    atv: "$7,887",  trans: "~1,400",         tam: "~$50B",   sam: "$48.3M",  pri: 1, note: 'High ATV + High Lead Sensitivity. One \u201csaved\u201d lead pays for your tool for 10 years.' },
  { cat: "Fertility (IVF)", prac: "~500",     pract: "~1,500",    atv: "$16,500", trans: "~950",           tam: "~$8B",    sam: "$5.4M",   pri: 1, note: 'Lowest practice count but highest ATV. Critical \u201cwhite glove\u201d service requirements.' },
  { cat: "Urgent Care",     prac: "~12,000",  pract: "~45,000",   atv: "$220",    trans: "~11,000",        tam: "~$29B",   sam: "$128.9M", pri: 2, note: 'High velocity. AI value is in \u201cTriage\u201d and \u201cWait Time\u201d management, not just sales.' },
  { cat: "Psychiatry",      prac: "~11,000",  pract: "~38,000",   atv: "$260",    trans: "~3,800",         tam: "~$11B",   sam: "$118.1M", pri: 2, note: 'Massive supply/demand imbalance. AI handles the overwhelming \u201cIntake\u201d volume.' },
  { cat: "Weight Loss",     prac: "~4,000",   pract: "~8,000",    atv: "$350",    trans: "~2,500",         tam: "~$3.5B",  sam: "$42.9M",  pri: 2, note: 'Booming sector (GLP-1s). High volume of recurring \u201cCheck-in\u201d calls.' },
  { cat: "Diagnostics",     prac: "~29,000",  pract: "~150,000",  atv: "$90",     trans: "~50,000+",       tam: "~$100B+", sam: "$311.5M", pri: 3, note: "B2B heavy. AI needs to talk to other doctors' offices more than patients." },
  { cat: "Podiatry",        prac: "~9,900",   pract: "~19,000",   atv: "$185",    trans: "~5,000",         tam: "~$9B",    sam: "$106.3M", pri: 3, note: 'Moderate velocity. Transition to \u201cretail\u201d foot care (custom orthotics) is growing.' },
  { cat: "Ophthalmology",   prac: "~3,700",   pract: "~19,000",   atv: "$3,500",  trans: "~5,500",         tam: "~$70B",   sam: "$39.7M",  pri: 3, note: 'Complex surgical billing. AI value moves from \u201cLeads\u201d to \u201cInsurance Pre-Auth.\u201d' },
  { cat: "Primary Care",    prac: "~133,000", pract: "~502,000",  atv: "$200",    trans: "~5,500",         tam: "~$280B",  sam: "$1.43B",  pri: 4, note: 'Bureaucratic. High churn and low margin. Requires \u201cEnterprise\u201d sales motion.' },
  { cat: "Hospitals",       prac: "~6,100",   pract: "~900,000",  atv: "$2,800+", trans: "~5,800 (Adm)",   tam: "~$1.3T",  sam: "$65.5M",  pri: 4, note: 'Massive sales cycles (18mo+). Requires deep Epic/Cerner native integrations.' },
] as const;

function SlideAppendix() {
  return (
    <div className="appendix-slide">
      <SlideHeader eyebrow="Appendix" title="Market Segment Analysis" />
      <div className="appendix-table-wrap">
        <table className="appendix-table">
          <colgroup>
            <col /><col /><col /><col /><col /><col /><col /><col /><col />
          </colgroup>
          <thead>
            <tr>
              <th className="apx-th-num">Priority</th>
              <th>Category</th>
              <th className="apx-th-num">Practices</th>
              <th className="apx-th-num">Practitioners</th>
              <th className="apx-th-num">ATV</th>
              <th className="apx-th-num">Ann. Trans.</th>
              <th className="apx-th-num">TAM</th>
              <th className="apx-th-num">SAM (ARR)</th>
              <th>Rationale</th>
            </tr>
          </thead>
          <tbody>
            {APX_ROWS.map((r) => (
              <tr key={r.cat} className={`apx-row apx-pri${r.pri}`}>
                <td className="apx-num"><span className={`apx-pri-badge p${r.pri}`}>{r.pri}</span></td>
                <td className="apx-cat">{r.cat}</td>
                <td className="apx-num">{r.prac}</td>
                <td className="apx-num">{r.pract}</td>
                <td className="apx-num">{r.atv}</td>
                <td className="apx-num">{r.trans}</td>
                <td className="apx-num">{r.tam}</td>
                <td className="apx-num">{r.sam}</td>
                <td className="apx-note">{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Shared components ────────────────────────────────────────────────────────

function SlideHeader({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <motion.div
      className="slide-header"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={fadeUp} className="eyebrow-tag">
        {eyebrow}
      </motion.div>
      <motion.h2 variants={fadeUp} className="slide-title">
        {title}
      </motion.h2>
    </motion.div>
  );
}


