import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import SlideDemo from "./components/demo/SlideDemo";
import { motion, AnimatePresence } from "framer-motion";
import {
  PhoneOff, Clock, Layers, RefreshCw,
  Database,
  DollarSign,
  Brain, GitMerge,
  ChevronRight, ChevronLeft,
  Rocket,
  Phone, MessageSquare, Globe, Share2,
  Calendar, FileCheck,
  CheckCircle2,
  ArrowRight, ScanText, BotMessageSquare, UserRound,
  FileSearch, MailCheck, Workflow,
  PhoneOutgoing, Stethoscope as SurgeryIcon, Banknote, MousePointerClick,
  type LucideIcon,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

const SLIDES = [
  "hero",
  "problem",
  "loss",
  "demo",
  "engine",
  "ccc-overview",
  // "roi",
  "traction",
  "founder",
  "enterprise-grade",
  "why-wins",
  "path",
  "moats",
  "vision",
  "ask",
  "appendix",
  "capture-detail",
  "connect-detail",
  "convert-detail",
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
  const navSlides = useMemo(() => {
    const askIndex = slides.indexOf("ask");
    return askIndex >= 0 ? slides.slice(0, askIndex + 1) : slides;
  }, [slides]);
  const exportSlides = isPdfExport && exportSlideId ? [exportSlideId] : SLIDES;
  const [current, setCurrent] = useState(0);
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
  const navCurrent = Math.min(current, navSlides.length - 1);

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
          {navSlides.map((id, i) => (
            <button
              key={id}
              onClick={() => setCurrent(i)}
              className={`dot ${i === navCurrent ? "dot-active" : ""}`}
              aria-label={`Slide ${i + 1}`}
              aria-current={i === navCurrent ? "true" : undefined}
            />
          ))}
        </nav>

        <div className="header-actions">
          {!isMobile && (
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              title="Download a PDF rendered from the export-safe deck."
            >
              {isDownloadingPdf ? "Generating PDF..." : "Download PDF"}
            </button>
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
          {navCurrent + 1} / {navSlides.length}
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
  if (slideId === "ccc-overview") return <SlideCCCOverview />;
  if (slideId === "traction") return <SlideTraction />;
  if (slideId === "enterprise-grade") return <SlideEnterpriseGrade />;
  if (slideId === "why-wins") return <SlideWhyWins />;
  if (slideId === "moats") return <SlideMoats />;
  if (slideId === "vision") return <SlideVision />;
  if (slideId === "path") return <SlidePath goTo={goTo} />;
  if (slideId === "ask") return <SlideAsk />;
  if (slideId === "demo") return <SlideDemo isExportMode={options.isExportMode} />;
  if (slideId === "appendix") return <SlideAppendix />;
  return null;
}

type DetailCardShade = "card-capture" | "card-connect" | "card-convert";

type DetailStage = {
  label: string;
  eyebrow: string;
  percent: string;
  friction: string;
  summary: string;
  shade: DetailCardShade;
  accent: string;
  cards: ReadonlyArray<{
    icon: LucideIcon;
    title: string;
    text: string;
    compactText: string;
  }>;
};

const CAPTURE_DETAIL: DetailStage = {
  label: "Capture",
  eyebrow: "Appendix: Capture",
  percent: "30%",
  friction: "Front office personnel spend 30% of their time manually capturing patient information and scheduling appointments.",
  summary: "of front-office time automated",
  shade: "card-capture",
  accent: CCC_COLORS.capture,
  cards: [
    {
      icon: BotMessageSquare,
      title: "AI Comms",
      text: "AI answers patient calls and texts, captures demographic and insurance information, negotiates availability, and schedules consultations in the EMR/PMS.",
      compactText: "Calls, texts, intake, insurance capture, and scheduling.",
    },
    {
      icon: ScanText,
      title: "AI Object Character Recognition",
      text: "AI extracts patient demographic and insurance information from faxes and documents and schedules consultations in the EMR/PMS.",
      compactText: "Fax and document extraction into the scheduling workflow.",
    },
    {
      icon: UserRound,
      title: "Personalization",
      text: "All customer conversations and future intent are captured in the CRM. This data is used to personalize patient engagement at every touchpoint.",
      compactText: "CRM memory that personalizes each patient touchpoint.",
    },
  ],
};

const CONNECT_DETAIL: DetailStage = {
  label: "Connect",
  eyebrow: "Appendix: Connect",
  percent: "20%",
  friction: "Front office personnel spend 20% of their time manually entering data into payer portals, and emailing or calling payers to verify insurance.",
  summary: "of front-office time automated",
  shade: "card-connect",
  accent: CCC_COLORS.connect,
  cards: [
    {
      icon: FileSearch,
      title: "AI submits patient data in payer portals",
      text: "AI navigates payer portals, enters patient data, and triggers insurance pre-authorization automatically.",
      compactText: "Portal submission and pre-auth initiation without staff entry.",
    },
    {
      icon: MailCheck,
      title: "AI analyzes emails to reconcile pre-auth",
      text: "Responses that arrive via email are reconciled, resubmitted, or flagged — without staff involvement.",
      compactText: "Email reconciliation, resubmission, and escalation automatically.",
    },
    {
      icon: Workflow,
      title: "Agentic CRM automates pipelines",
      text: "Inputs, agentic operations, and outputs are defined for each stage in the CRM and automatically moved to the next stage until complete.",
      compactText: "Stage-based CRM operations move work to completion.",
    },
  ],
};

const CONVERT_DETAIL: DetailStage = {
  label: "Convert",
  eyebrow: "Appendix: Convert",
  percent: "10%",
  friction: "Front desk personnel spend 10% of their time making outbound calls for patient recalls, scheduling surgeries, or billing.",
  summary: "of front-office time automated",
  shade: "card-convert",
  accent: CCC_COLORS.convert,
  cards: [
    {
      icon: PhoneOutgoing,
      title: "Patient Recall Automation",
      text: "AI identifies patients due for follow-ups and automatically initiates call or text outreach based on last visit date and procedure history.",
      compactText: "Follow-up outreach triggered by visit and procedure history.",
    },
    {
      icon: SurgeryIcon,
      title: "Procedure & Surgery Coordination",
      text: "AI coordinates procedure scheduling across clinics and surgery centers. Automatically confirms availability and manages paperwork.",
      compactText: "Cross-clinic scheduling, availability, and paperwork orchestration.",
    },
    {
      icon: Banknote,
      title: "Intelligent Collections",
      text: "AI agents follow up on outstanding balances through personalized calls and texts. Improves collection rates and reduces days in A/R.",
      compactText: "Personalized collections outreach that improves A/R performance.",
    },
  ],
};

const CCC_STAGES = [CAPTURE_DETAIL, CONNECT_DETAIL, CONVERT_DETAIL] as const;

const LIVE_USAGE_METRICS = [
  { value: "2", heroValue: "2", heroLabel: "practices live", tractionLabel: "Practices" },
  { value: "9", heroValue: "9", heroLabel: "providers", tractionLabel: "Providers" },
  { value: "3,082", heroValue: "3,082", heroLabel: "calls/month", tractionLabel: "Calls handled /\u00a0month" },
  { value: "381", heroValue: "381", heroLabel: "AI leads captured/month", tractionLabel: "AI leads captured /\u00a0month" },
] as const;

const TRACTION_PRIMARY_METRICS = LIVE_USAGE_METRICS.map(({ value, tractionLabel }) => ({
  value,
  label: tractionLabel,
}));

const TRACTION_SECONDARY_METRICS = [
  { value: "18.6%", label: "of call volume occurs after hours" },
  { value: "21.5%", label: "of captured leads happen after hours" },
] as const;

const TRACTION_CUSTOMERS = [
  {
    name: "Austin Face and Body",
    logoSrc: "/afbLogoBrown.png",
    logoAlt: "Austin Face and Body logo",
    logoClassName: "traction-customer-logo-light",
    profile: "7-provider plastic surgery practice in Austin, Texas",
    impact: "Validates May I in a premium, high-intent specialty where missed calls directly translate into missed consult revenue.",
  },
  {
    name: "Rosemead Eye Center",
    logoSrc: "/RosemeadEyeLogo.png",
    logoAlt: "Rosemead Eye Center logo",
    logoClassName: undefined,
    profile: "2-provider ophthalmology practice in Rosemead, California",
    impact: "Shows the platform adapts across specialties, capturing patient demand in a high-volume workflow-heavy environment.",
  },
] as const;

const OPEN_AGENT_RISKS = [
  {
    stat: "~20%",
    headline: "of ClawHub marketplace flagged as malware",
    source: "Bitdefender, Feb 2026",
  },
  {
    stat: "1,467",
    headline: "malicious skills identified",
    source: "Snyk ToxicSkills report",
  },
  {
    stat: "42,000+",
    headline: "exposed instances without authentication",
    source: "Shodan / Censys",
  },
  {
    stat: "CVE-2026-25253",
    headline: "one-click RCE, CVSS 8.8 — a severe flaw that could let an attacker take over a system with a single click",
    source: "NVD",
  },
] as const;

const ENTERPRISE_CONTROLS = [
  "HIPAA-compliant infrastructure from day one",
  "No open marketplace — curated, audited workflows",
  "Healthcare-specific guardrails and validation",
  "Human-in-the-loop for critical decisions",
  "SOC 2 compliance pathway",
  "Closed-loop system — no third-party skills",
] as const;

const ASK_ROUND_DETAILS = [
  { label: "Raising", value: "$5M" },
  { label: "Instrument", value: "Priced Seed Round" },
  { label: "Valuation cap", value: "$35M" },
  { label: "Use of funds", value: "Engineering + GTM teams, customer acquisition, tokens" },
] as const;

const ASK_MILESTONES = [
  "Hire a CTO + engineering team",
  "Hire sales / marketing lead + GTM team",
  "Product GA with first 50 paying practices",
  "Prove unit economics (CAC, LTV, payback)",
  "Build pipeline for Series A",
] as const;

function renderDetailCards(cards: DetailStage["cards"], shade: DetailCardShade) {
  return cards.map(({ icon: Icon, title, text }) => (
    <motion.div key={title} variants={fadeUp} className={`detail-card ${shade}`}>
      <div className="detail-card-title"><Icon size={20} />{title}</div>
      <div className="detail-card-text">{text}</div>
    </motion.div>
  ));
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
          A seasoned <span className="accent-highlight">technical product leader</span> who guides teams to ideate, incubate, and launch enterprise grade software. In his past five years at <span className="accent-highlight">Microsoft</span> he has been focused on <span className="accent-highlight">Health and Life Sciences</span>, specifically on the <span className="accent-highlight">Dragon Co-Pilot</span> team, including two years in its prestigious <span className="accent-highlight">Microsoft Research</span> organization. Technical acumen is complemented by an <span className="accent-highlight">MBA from Duke University</span> and experience in marketing and sales.
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
  const visibleSlides: readonly SlideId[] = isMobile
    ? SLIDES.filter((slide): slide is Exclude<SlideId, "appendix" | "demo"> => slide !== "appendix" && slide !== "demo")
    : SLIDES;
  const agendaAll: ReadonlyArray<{ num: string; label: string; slideId: SlideId }> = [
    { num: "2",  label: "The Problem",            slideId: "problem" },
    { num: "4",  label: "Live Demo",              slideId: "demo" },
    { num: "5",  label: "The May I System",       slideId: "engine" },
    // { num: "7",  label: "Business Impact",        slideId: "roi" },
    { num: "8",  label: "Traction",               slideId: "traction" },
    { num: "9",  label: "Founder & CEO",          slideId: "founder" },
    { num: "10", label: "Enterprise Security",    slideId: "enterprise-grade" },
    { num: "11", label: "Competitive Landscape",  slideId: "why-wins" },
    { num: "12", label: "Investor Case",          slideId: "path" },
    { num: "13", label: "Revenue Projections",    slideId: "moats" },
    { num: "14", label: "Vision",                 slideId: "vision" },
    { num: "15", label: "The Ask",                slideId: "ask" },
    { num: "16", label: "Appendix",               slideId: "appendix" },
  ];
  const agenda = isMobile ? agendaAll.filter((a) => a.label !== "Live Demo") : agendaAll;
  const agendaRef = useRef<HTMLDivElement>(null);
  const goToSlide = useCallback((slideId: SlideId) => {
    const slideIndex = visibleSlides.indexOf(slideId);
    if (slideIndex >= 0) {
      goTo(slideIndex);
    }
  }, [goTo, visibleSlides]);

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

      {/* ── Bottom: engine + metrics ── */}
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
          className="hero-metrics-col"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          <div className="hero-metrics-grid" aria-label="Live customer usage stats">
            {LIVE_USAGE_METRICS.map((metric) => (
              <motion.article key={metric.heroLabel} variants={fadeUp} className="hero-metric-card">
                <div className="hero-metric-value">{metric.heroValue}</div>
                <div className="hero-metric-label">{metric.heroLabel}</div>
              </motion.article>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="hero-agenda-hidden" aria-hidden="true" ref={agendaRef}>
        <div className="hero-agenda">
          <div className="agenda-title">Agenda</div>
          <div className="agenda-columns">
            {agenda.slice(0, Math.ceil(agenda.length / 2)).flatMap((left, i) => {
              const right = agenda[Math.ceil(agenda.length / 2) + i];
              return [
                <button key={`ll-${left.num}`} className="agenda-chip-label" onClick={() => goToSlide(left.slideId)}>{left.label}</button>,
                <span   key={`ln-${left.num}`} className="agenda-chip-num"   onClick={() => goToSlide(left.slideId)}>{left.num}</span>,
                right ? <button key={`rl-${right.num}`} className={`agenda-chip-label agenda-chip-label--right${right.num === "17" ? " agenda-item-appendix" : ""}`} onClick={() => goToSlide(right.slideId)}>{right.label}</button> : <span key={`rl-empty-${i}`} />,
                right ? <span   key={`rn-${right.num}`} className="agenda-chip-num"   onClick={() => goToSlide(right.slideId)}>{right.num}</span> : <span key={`rn-empty-${i}`} />,
              ];
            })}
          </div>
        </div>
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
      stat: "35%",
      statLabel: "of calls during the day are missed",
      text: "High-intent patients hit voicemail during business hours, and move on before staff recovers the lead.",
      sourceHref: "https://www.mayiguide.com",
      sourceLabel: "Source: May I - Austin Face and Body",
    },
    {
      icon: <Clock size={36} />,
      title: "Slow Speed-to-Lead",
      stat: "42hrs",
      statLabel: "Average company response time",
      text: "100× more likely to make contact and 21× more likely to qualify if lead is responded to within 5 mins",
      sourceHref: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
      sourceLabel: "Source: Harvard Business Review",
    },
    {
      icon: <Layers size={36} />,
      title: "Administrative Overload",
      stat: "2:1",
      statLabel: "More time on admin than patients",
      text: "Administrative drag cuts capacity, slows follow-up, creates bottlenecks, and fuels burnout.",
      sourceHref: "https://www.acpjournals.org/doi/10.7326/M16-0961",
      sourceLabel: "Source: Annals of Internal Medicine",
    },
    {
      icon: <RefreshCw size={36} />,
      title: "Patient Churn",
      stat: "25%",
      statLabel: "switched providers because they were unhappy",
      text: "Poor patient experience now drives measurable provider switching across healthcare.",
      sourceHref: "https://www.accenture.com/us-en/insightsnew/health/difference-between-loyalty-leaving",
      sourceLabel: "Source: Accenture",
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
        {problems.map(({ icon, title, stat, statLabel, text, sourceHref, sourceLabel }) => (
          <motion.div key={title} variants={fadeUp} className="problem-card">
            <div className="problem-stat">{stat}</div>
            <div className="problem-stat-label">{statLabel}</div>
            <div className="problem-content-row">
              <div className="problem-icon">{icon}</div>
              <div className="problem-copy">
                <h3 className="problem-title">{title}</h3>
                <p className="problem-text">{text}</p>
              </div>
            </div>
            {sourceHref && sourceLabel && (
              <a
                className="problem-source-link"
                href={sourceHref}
                target="_blank"
                rel="noreferrer"
              >
                {sourceLabel}
              </a>
            )}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Slide 3: Invisible Loss ──────────────────────────────────────────────────

function SlideLoss() {
  const losses = [
    {
      icon: <PhoneOff size={20} />,
      label: "Capture",
      impact: "$2.25M",
      impactQualifier: "per year missed consults",
      subtext: "25% conversion of 150 leads captured by AI per month at $5000 per procedure",
      sourceHref: "https://www.plasticsurgery.org/news/plastic-surgery-statistics",
      sourceLabel: "Source: ASPS statistics",
      color: CCC_COLORS.capture,
      featured: true,
      hideImpactLabel: true,
      hideSecondaryStat: true,
    },
    {
      icon: <Layers size={20} />,
      label: "Connect",
      impact: "$750K",
      impactQualifier: "per year lost to inefficiency",
      subtext: "A 5-provider practice generating $5M annually requires 30% admin effort and it leaks ~$750K (50%).",
      sourceHref: "https://www.healthaffairs.org/content/briefs/role-administrative-waste-excess-us-health-spending",
      sourceLabel: "Source: Health Affairs",
      color: CCC_COLORS.connect,
      featured: true,
      hideImpactLabel: true,
      hideSecondaryStat: true,
    },
    {
      icon: <DollarSign size={20} />,
      label: "Convert",
      impact: "$250K",
      impactQualifier: "per year lost post-visit",
      subtext: "For a 5-provider practice: ~$1.5M (30%) in patient responsibility, with ~17% ($250K+) at risk",
      sourceHref: "https://www.kff.org/health-costs/americans-challenges-with-health-care-costs/",
      sourceLabel: "Source: KFF",
      color: CCC_COLORS.convert,
      featured: true,
      hideImpactLabel: true,
      hideSecondaryStat: true,
    },
  ];

  return (
    <div className="slide slide-loss">
      <SlideHeader
        eyebrow="Invisible Loss"
        title="Revenue leaks at every step of the patient journey"
      />
      <div className="loss-body">
        <motion.div
          className="loss-summary"
          variants={fadeUp}
          initial="hidden"
          animate="show"
        >
          <span className="loss-summary-value">$3.25M</span>
          <span className="loss-summary-text">annual revenue leakage per practice</span>
        </motion.div>

        <motion.div
          className="loss-grid"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          {losses.map(({ icon, label, stat, impact, impactQualifier, subtext, sourceHref, sourceLabel, color, featured, hideImpactLabel, hideSecondaryStat }) => (
            <motion.section key={label} variants={fadeUp} className={`loss-card${featured ? " loss-card-featured" : ""}`}>
              <div className="loss-card-head">
                <div className="loss-card-label" style={{ color }}>{label}</div>
                <div className="loss-card-icon" style={{ color, borderColor: color }}>
                  {icon}
                </div>
              </div>
              <div className="loss-card-impact">{impact}</div>
              {impactQualifier && <div className="loss-card-impact-qualifier">{impactQualifier}</div>}
              {!hideImpactLabel && <div className="loss-card-impact-label">headline revenue loss</div>}
              {!hideSecondaryStat && <div className="loss-card-stat">{stat}</div>}
              {!hideSecondaryStat && <div className="loss-card-stat-label">supporting operating signal</div>}
              <div className="loss-card-copy">{subtext}</div>
              {sourceHref && sourceLabel && (
                <a
                  className="loss-card-source-link"
                  href={sourceHref}
                  target="_blank"
                  rel="noreferrer"
                >
                  {sourceLabel}
                </a>
              )}
            </motion.section>
          ))}
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
  return (
    <div className="slide slide-detail">
      <div className="detail-left">
        <div className="detail-eyebrow">{CAPTURE_DETAIL.eyebrow}</div>
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
        {renderDetailCards(CAPTURE_DETAIL.cards, CAPTURE_DETAIL.shade)}
      </motion.div>
    </div>
  );
}

// ─── Slide 6b: Connect detail ─────────────────────────────────────────────────

function SlideConnectDetail() {
  return (
    <div className="slide slide-detail">
      <div className="detail-left">
        <div className="detail-eyebrow">{CONNECT_DETAIL.eyebrow}</div>
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
        {renderDetailCards(CONNECT_DETAIL.cards, CONNECT_DETAIL.shade)}
      </motion.div>
    </div>
  );
}

// ─── Slide 6c: Convert detail ─────────────────────────────────────────────────

function SlideConvertDetail() {
  return (
    <div className="slide slide-detail">
      <div className="detail-left">
        <div className="detail-eyebrow">{CONVERT_DETAIL.eyebrow}</div>
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
        {renderDetailCards(CONVERT_DETAIL.cards, CONVERT_DETAIL.shade)}
      </motion.div>
    </div>
  );
}

function SlideCCCOverview() {
  return (
    <div className="slide slide-ccc-summary">
      <motion.div className="ccc-summary-header" variants={stagger} initial="hidden" animate="show">
        <motion.div variants={fadeUp} className="detail-eyebrow ccc-summary-eyebrow">
          The May I System
        </motion.div>
        <motion.h2 variants={fadeUp} className="ccc-summary-title">
          {CCC_STAGES.map((stage, index) => (
            <span key={stage.label} className="ccc-summary-title-segment">
              <span className="ccc-summary-title-word" style={{ color: stage.accent }}>{stage.label}</span>
              {index < CCC_STAGES.length - 1 ? <span className="ccc-summary-title-arrow">→</span> : null}
            </span>
          ))}
        </motion.h2>
        <motion.p variants={fadeUp} className="ccc-summary-subtitle">
          A single operating view of how May I automates intake, payer workflows, and downstream revenue follow-up.
        </motion.p>
      </motion.div>

      <motion.div className="ccc-summary-grid" variants={stagger} initial="hidden" animate="show">
        {CCC_STAGES.map((stage) => (
          <motion.section key={stage.label} variants={fadeUp} className={`ccc-summary-panel ${stage.shade}`}>
            <div className="ccc-summary-panel-label" style={{ color: stage.accent }}>{stage.label}</div>
            <div className="ccc-summary-metric">
              <div className="ccc-summary-percent" style={{ color: stage.accent }}>{stage.percent}</div>
              <div className="ccc-summary-metric-text">{stage.summary}</div>
            </div>
            <div className="ccc-summary-rows">
              {stage.cards.map(({ icon: Icon, title, compactText }) => (
                <div key={title} className="ccc-summary-row">
                  <div className="ccc-summary-row-title-wrap">
                    <Icon size={16} color={stage.accent} />
                    <div className="ccc-summary-row-title">{title}</div>
                  </div>
                  <div className="ccc-summary-row-text">{compactText}</div>
                </div>
              ))}
            </div>
          </motion.section>
        ))}
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="show" className="ccc-summary-footer">
        <span className="ccc-summary-footer-total">60%</span>
        <span className="ccc-summary-footer-text">of front-office time automated across capture, connect, and convert.</span>
      </motion.div>
    </div>
  );
}

// ─── Slide 6: ROI ─────────────────────────────────────────────────────────────

/*
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
      <motion.div
        className="roi-moat-strip"
        variants={fadeUp}
        initial="hidden"
        animate="show"
      >
        <div className="roi-moat-strip-head">
          <span className="roi-moat-strip-label">The Economic Moat</span>
          <span className="roi-moat-strip-tag">FTE Replacement, not SaaS</span>
        </div>
        <div className="roi-moat-strip-grid">
          {ECONOMIC_MOAT_VALUES.map(({ label, value, emphasis }) => (
            <div key={label} className={`roi-moat-strip-item${emphasis ? " roi-moat-strip-item-emphasis" : ""}`}>
              <div className="roi-moat-strip-key">{label}</div>
              <div className="roi-moat-strip-value">{value}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
*/

function SlideTraction() {
  return (
    <div className="slide slide-traction">
      <SlideHeader
        eyebrow="Traction"
        title="Early signal that the flywheel is turning."
      />
      <motion.div className="traction-layout" variants={stagger} initial="hidden" animate="show">
        <motion.section variants={fadeUp} className="traction-panel traction-panel-metrics">
          <div className="traction-panel-label">Live customer usage</div>

          <div className="traction-summary-grid">
            {TRACTION_PRIMARY_METRICS.slice(0, 2).map((metric) => (
              <div key={metric.label} className="traction-stat-card traction-stat-card-primary">
                <div className="traction-stat-value">{metric.value}</div>
                <div className="traction-stat-label">{metric.label}</div>
              </div>
            ))}
          </div>

          <div className="traction-featured-stack">
            {TRACTION_PRIMARY_METRICS.slice(2).map((metric) => (
              <div key={metric.label} className="traction-stat-card traction-stat-card-featured">
                <div className="traction-stat-value">{metric.value}</div>
                <div className="traction-stat-label">{metric.label}</div>
              </div>
            ))}
          </div>

          <div className="traction-secondary-grid">
            {TRACTION_SECONDARY_METRICS.map((metric) => (
              <div key={metric.label} className="traction-stat-card traction-stat-card-secondary">
                <div className="traction-stat-value">{metric.value}</div>
                <div className="traction-stat-label">{metric.label}</div>
              </div>
            ))}
          </div>

        </motion.section>

        <motion.section variants={fadeUp} className="traction-panel traction-panel-customers">
          <div className="traction-panel-label">Customer footprint</div>
          <div className="traction-customer-grid">
            {TRACTION_CUSTOMERS.map((customer) => (
              <article key={customer.name} className="traction-customer-card">
                <div className="traction-customer-logo-wrap">
                  <img
                    src={customer.logoSrc}
                    alt={customer.logoAlt}
                    className={`traction-customer-logo${customer.logoClassName ? ` ${customer.logoClassName}` : ""}`}
                  />
                </div>
                <div className="traction-customer-name">{customer.name}</div>
                <div className="traction-customer-profile">{customer.profile}</div>
                <p className="traction-customer-impact">{customer.impact}</p>
              </article>
            ))}
          </div>
          <p className="traction-proof-headline">
            <span className="traction-proof-accent">Real production demand</span> across two distinct specialty practices.
          </p>
          <p className="traction-proof-copy">
            May I is already live in workflows where speed to response drives revenue and patient conversion. This is production usage. It is recurring, specialty-specific call volume with measurable after-hours capture.
          </p>
          <div className="traction-customer-intro">
            Two deployments, two specialties, two states. Early evidence that the product travels across healthcare verticals without changing the core wedge.
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
}

function SlideEnterpriseGrade() {
  return (
    <div className="slide slide-enterprise-grade">
      <SlideHeader
        eyebrow="Why Enterprise-Grade Matters"
        title="Open-source AI agents are a healthcare liability."
      />
      <motion.div className="enterprise-grid" variants={stagger} initial="hidden" animate="show">
        <motion.section variants={fadeUp} className="enterprise-panel enterprise-panel-risk">
          <div className="enterprise-panel-label enterprise-panel-label-risk">The OpenClaw Crisis — Feb 2026</div>
          <div className="enterprise-risk-list">
            {OPEN_AGENT_RISKS.map(({ stat, headline, source }) => (
              <div key={stat} className="enterprise-risk-item">
                <div className="enterprise-risk-stat">{stat}</div>
                <div className="enterprise-risk-copy">
                  <div className="enterprise-risk-headline">{headline}</div>
                  <div className="enterprise-risk-source">{source}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section variants={fadeUp} className="enterprise-panel enterprise-panel-safe">
          <div className="enterprise-panel-label enterprise-panel-label-safe">May I's Enterprise Approach</div>
          <div className="enterprise-safe-list">
            {ENTERPRISE_CONTROLS.map((item) => (
              <div key={item} className="enterprise-safe-item">
                <CheckCircle2 size={18} className="enterprise-safe-icon" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </motion.section>
      </motion.div>
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="enterprise-footer-note">
        In healthcare, security isn't a feature — it's a license to operate.
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
  const rows: {
    year: string;
    providerCount: number;
    share: string;
    arr: string;
    arrValue: number;
    val: string;
    growth: string;
    milestone?: boolean;
  }[] = [
    { year: "Year 1", providerCount: 299, share: "0.02%", arr: "$2.2M", arrValue: 2.2, val: "$17.2M", growth: "—" },
    { year: "Year 2", providerCount: 1048, share: "0.07%", arr: "$7.5M", arrValue: 7.5, val: "$60.4M", growth: "241% (3.4x)" },
    { year: "Year 3", providerCount: 3742, share: "0.25%", arr: "$26.9M", arrValue: 26.9, val: "$215.5M", growth: "259% (3.6x)" },
    { year: "Year 4", providerCount: 10476, share: "0.70%", arr: "$75.4M", arrValue: 75.4, val: "$603.5M", growth: "180% (2.8x)" },
    { year: "Year 5", providerCount: 17959, share: "1.20%", arr: "$129.3M", arrValue: 129.3, val: "$1.03B", growth: "71% (1.7x)", milestone: true },
  ];

  const arrValues = rows.map((row) => row.arrValue);
  const xLabels = rows.map((_, index) => `Y${index + 1}`);

  const W = 420, H = 280;
  const PAD = { l: 52, r: 16, t: 18, b: 34 };
  const CW  = W - PAD.l - PAD.r;
  const CH  = H - PAD.t - PAD.b;
  const MAX = 140;
  const BAR_SLOT = CW / rows.length;
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
                <th>Growth</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ year, providerCount, share, arr, val, growth, milestone }) => (
                <tr key={year} className={milestone ? "rev-row-milestone" : ""}>
                  <td className="rev-year">{year}</td>
                  <td className="rev-num">{providerCount.toLocaleString("en-US")}</td>
                  <td className="rev-share">{share}</td>
                  <td className="rev-arr">{arr}</td>
                  <td className="rev-val">{val}</td>
                  <td className="rev-growth">{growth}</td>
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

function SlideAsk() {
  return (
    <div className="slide slide-ask">
      <motion.div className="ask-header" variants={stagger} initial="hidden" animate="show">
        <motion.div variants={fadeUp} className="eyebrow-tag">The Ask</motion.div>
        <motion.h2 variants={fadeUp} className="ask-title">
          Join us in building the revenue integrity layer for healthcare.
        </motion.h2>
      </motion.div>

      <motion.div className="ask-grid" variants={stagger} initial="hidden" animate="show">
        <motion.section variants={fadeUp} className="ask-panel">
          <div className="ask-panel-label">Round Details</div>
          <div className="ask-detail-list">
            {ASK_ROUND_DETAILS.map(({ label, value }) => (
              <div key={label} className="ask-detail-row">
                <div className="ask-detail-key">{label}</div>
                <div className="ask-detail-value">{value}</div>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section variants={fadeUp} className="ask-panel">
          <div className="ask-panel-label">Milestones This Capital Unlocks</div>
          <div className="ask-milestone-list">
            {ASK_MILESTONES.map((item) => (
              <div key={item} className="ask-milestone-item">
                <ArrowRight size={16} className="ask-milestone-icon" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </motion.section>
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="show" className="ask-contact-bar">
        <span>Chami Rupasinghe</span>
        <span className="ask-contact-sep">|</span>
        <span>chamir@mayiguide.com</span>
        <span className="ask-contact-sep">|</span>
        <span>www.mayiguide.com</span>
      </motion.div>
    </div>
  );
}

// ─── Slide: Path to $1B ─────────────────────────────────────────────────────

function SlidePath({ goTo }: { goTo: (i: number) => void }) {
  const isMobile = useIsMobile();
  const visibleSlides: readonly SlideId[] = isMobile
    ? SLIDES.filter((slide): slide is Exclude<SlideId, "appendix" | "demo"> => slide !== "appendix" && slide !== "demo")
    : SLIDES;
  const goToAppendix = useCallback(() => {
    const slideIndex = visibleSlides.indexOf("appendix");
    if (slideIndex >= 0) {
      goTo(slideIndex);
    }
  }, [goTo, visibleSlides]);

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
    { pct: "1.7%", users: "25,442", hl: false },
    { pct: "1.2%", users: "17,959", hl: true  },
    { pct: "0.9%", users: "13,469", hl: false },
  ];
  const prices = ["$800/mo", "$600/mo", "$400/mo"];

  type Sc = { si: number; pi: number; arr: string; val: string;
              isBillion: boolean; isSweet: boolean; isAnnotate: boolean; };
  const scenarios: Sc[] = [
    { si:0, pi:0, arr:"$244.2M", val:"$1.95B", isBillion:true,  isSweet:false, isAnnotate:false },
    { si:0, pi:1, arr:"$183.2M", val:"$1.47B", isBillion:true,  isSweet:false, isAnnotate:false },
    { si:0, pi:2, arr:"$122.1M", val:"$977M",  isBillion:false, isSweet:false, isAnnotate:false },
    { si:1, pi:0, arr:"$172.4M", val:"$1.38B", isBillion:true,  isSweet:false, isAnnotate:false },
    { si:1, pi:1, arr:"$129.3M", val:"$1.03B", isBillion:true,  isSweet:true,  isAnnotate:false },
    { si:1, pi:2, arr:"$86.2M",  val:"$690M",  isBillion:false, isSweet:false, isAnnotate:false },
    { si:2, pi:0, arr:"$129.3M", val:"$1.03B", isBillion:true,  isSweet:false, isAnnotate:true  },
    { si:2, pi:1, arr:"$97.0M",  val:"$776M",  isBillion:false, isSweet:false, isAnnotate:false },
    { si:2, pi:2, arr:"$64.7M",  val:"$517M",  isBillion:false, isSweet:false, isAnnotate:false },
  ];

  return (
    <div className="slide slide-path">
      <motion.div className="path-top" variants={stagger} initial="hidden" animate="show">
        <motion.div variants={fadeUp} className="eyebrow-tag">Investor Case</motion.div>
        <motion.h2 variants={fadeUp} className="path-headline">
          The <span className="path-accent">1.2%</span> Path to a{" "}
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
              fill="white" fontSize={20} fontWeight={700}>1.5M</text>
            <text x={ROOT.x} y={ROOT.y + 8} textAnchor="middle"
              fill="rgba(196,146,71,0.9)" fontSize={7} fontWeight={600}>PROVIDERS</text>
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

        {/* ── Right column – Segment Priority Framework ── */}
        <motion.div className="path-right-col" variants={stagger} initial="hidden" animate="show">
          <motion.div variants={fadeUp} className="priority-legend">
            <div className="priority-legend-title">Segment Priority Framework</div>
            <div className="priority-legend-rows">
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
            </div>
            <motion.button
              type="button"
              variants={fadeUp}
              className="priority-legend-link"
              onClick={goToAppendix}
              aria-label="Go to slide 16, Appendix market segment analysis"
            >
              <span>Go to slide 16: Market Segment Analysis</span>
              <ArrowRight size={14} />
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Appendix ───────────────────────────────────────────────────────────────

const APX_ROWS = [
  {
    category: "Retail",
    vertical: "Fertility (IVF)",
    practiceCount: "500",
    mdDo: "1,500",
    np: "400",
    pa: "300",
    other: "-",
    totalProviders: "2,200",
    atv: "$15,000",
    annualTransactions: "800",
    annualRevenue: "$12,000,000",
    rationale: "Highest ATV in the set. Small target list, but each missed consult is expensive and conversion speed matters.",
  },
  {
    category: "Retail",
    vertical: "Plastic Surgery",
    practiceCount: "5,500",
    mdDo: "8,000",
    np: "1,000",
    pa: "1,200",
    other: "-",
    totalProviders: "10,200",
    atv: "$2,500",
    annualTransactions: "800",
    annualRevenue: "$2,000,000",
    rationale: "Classic high-consideration retail funnel. Lead response and consult scheduling directly influence revenue capture.",
  },
  {
    category: "Retail",
    vertical: "Dentistry & Ortho",
    practiceCount: "179,000",
    mdDo: "-",
    np: "-",
    pa: "-",
    other: "213,315",
    totalProviders: "213,315",
    atv: "$350",
    annualTransactions: "5,142",
    annualRevenue: "$1,800,000",
    rationale: "Largest retail practice base. Strong fit for always-on scheduling, recall, and treatment-start conversion workflows.",
  },
  {
    category: "Retail",
    vertical: "Ophthalmology / Optom.",
    practiceCount: "45,000",
    mdDo: "-",
    np: "-",
    pa: "-",
    other: "42,000",
    totalProviders: "60,500",
    atv: "$250",
    annualTransactions: "7,200",
    annualRevenue: "$1,800,000",
    rationale: "Combines recurring exams with elective conversion opportunities, creating both throughput and revenue sensitivity.",
  },
  {
    category: "Retail",
    vertical: "Dermatology",
    practiceCount: "10,000",
    mdDo: "12,000",
    np: "1,400",
    pa: "6,200",
    other: "-",
    totalProviders: "19,600",
    atv: "$300",
    annualTransactions: "6,000",
    annualRevenue: "$1,800,000",
    rationale: "Mix of medical and cosmetic demand. Front-desk load is high, while cosmetic consults reward fast response.",
  },
  {
    category: "Retail",
    vertical: "Veterinary",
    practiceCount: "32,000",
    mdDo: "-",
    np: "-",
    pa: "-",
    other: "127,000",
    totalProviders: "127,000",
    atv: "$150",
    annualTransactions: "10,000",
    annualRevenue: "$1,500,000",
    rationale: "Fragmented market with heavy inbound demand. Automation helps with urgent scheduling, reminders, and missed-call recovery.",
  },
  {
    category: "Retail",
    vertical: "Medical Spas",
    practiceCount: "11,500",
    mdDo: "10,488",
    np: "21,500",
    pa: "10,500",
    other: "-",
    totalProviders: "42,488",
    atv: "$600",
    annualTransactions: "2,333",
    annualRevenue: "$1,400,000",
    rationale: "Highly competitive consumer acquisition environment where speed-to-lead and reactivation drive outsized ROI.",
  },
  {
    category: "Other",
    vertical: "Surgery Centers (ASCs)",
    practiceCount: "6,300",
    mdDo: "100,000",
    np: "-",
    pa: "-",
    other: "-",
    totalProviders: "100,000",
    atv: "$3,200",
    annualTransactions: "2,200",
    annualRevenue: "$7,040,000",
    rationale: "High case-value settings support premium software budgets, especially for scheduling and pre-op coordination.",
  },
  {
    category: "Other",
    vertical: "Cardiology",
    practiceCount: "15,000",
    mdDo: "40,300",
    np: "-",
    pa: "-",
    other: "-",
    totalProviders: "40,300",
    atv: "$400",
    annualTransactions: "8,750",
    annualRevenue: "$3,500,000",
    rationale: "Referral-heavy specialty with dense scheduling and pre-procedure coordination that creates real ops leverage.",
  },
  {
    category: "Other",
    vertical: "Urgent Care",
    practiceCount: "15,000",
    mdDo: "-",
    np: "-",
    pa: "-",
    other: "-",
    totalProviders: "30,000",
    atv: "$125",
    annualTransactions: "14,400",
    annualRevenue: "$1,800,000",
    rationale: "Lower ATV, but exceptional visit velocity. Small workflow gains compound immediately across high transaction volume.",
  },
  {
    category: "Other",
    vertical: "Primary Care",
    practiceCount: "230,000",
    mdDo: "743,500",
    np: "-",
    pa: "-",
    other: "-",
    totalProviders: "743,500",
    atv: "$180",
    annualTransactions: "10,000",
    annualRevenue: "$1,800,000",
    rationale: "Massive footprint and repeat utilization make it the broadest platform expansion wedge for intake and follow-up automation.",
  },
  {
    category: "Other",
    vertical: "Podiatry",
    practiceCount: "8,000",
    mdDo: "12,500",
    np: "-",
    pa: "-",
    other: "-",
    totalProviders: "12,500",
    atv: "$200",
    annualTransactions: "4,000",
    annualRevenue: "$800,000",
    rationale: "Balanced mix of repeat care and procedures. Moderate size, but operational pain is consistent and automatable.",
  },
  {
    category: "Other",
    vertical: "Psychiatry",
    practiceCount: "35,000",
    mdDo: "95,000",
    np: "-",
    pa: "-",
    other: "-",
    totalProviders: "95,000",
    atv: "$250",
    annualTransactions: "3,000",
    annualRevenue: "$750,000",
    rationale: "Persistent access bottlenecks make qualification, intake, and scheduling automation disproportionately valuable.",
  },
  {
    category: "",
    vertical: "Total",
    practiceCount: "592,800",
    mdDo: "1,023,288",
    np: "24,300",
    pa: "18,200",
    other: "382,315",
    totalProviders: "1,496,603",
    atv: "-",
    annualTransactions: "-",
    annualRevenue: "$37,990,000",
    rationale: "Blended view across retail and ambulatory care shows a broad, diversified revenue base for expansion.",
    total: true,
  },
] as const;

function SlideAppendix() {
  return (
    <div className="appendix-slide">
      <SlideHeader eyebrow="Appendix" title="Market Segment Analysis" />
      <div className="appendix-table-wrap">
        <table className="appendix-table">
          <colgroup>
            <col /><col /><col /><col /><col /><col /><col /><col /><col /><col /><col /><col />
          </colgroup>
          <thead>
            <tr>
              <th>Category</th>
              <th>Vertical</th>
              <th className="apx-th-num">Practices</th>
              <th className="apx-th-num">MD / DO</th>
              <th className="apx-th-num">NP</th>
              <th className="apx-th-num">PA</th>
              <th className="apx-th-num">Other</th>
              <th className="apx-th-num">Providers</th>
              <th className="apx-th-num">ATV</th>
              <th className="apx-th-num">Ann. Tx / Practice</th>
              <th className="apx-th-num">Ann. Rev / Practice</th>
              <th>Rationale</th>
            </tr>
          </thead>
          <tbody>
            {APX_ROWS.map((r) => (
              <tr key={r.vertical} className={`apx-row${"total" in r && r.total ? " apx-total-row" : ""}`}>
                <td className="apx-group">{r.category || "Total"}</td>
                <td className="apx-cat">{r.vertical}</td>
                <td className="apx-num">{r.practiceCount}</td>
                <td className="apx-num">{r.mdDo}</td>
                <td className="apx-num">{r.np}</td>
                <td className="apx-num">{r.pa}</td>
                <td className="apx-num">{r.other}</td>
                <td className="apx-num">{r.totalProviders}</td>
                <td className="apx-num">{r.atv}</td>
                <td className="apx-num">{r.annualTransactions}</td>
                <td className="apx-num">{r.annualRevenue}</td>
                <td className="apx-note">{r.rationale}</td>
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
