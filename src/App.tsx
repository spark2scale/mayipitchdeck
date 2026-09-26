import { useState, useEffect, useCallback, useRef, useMemo } from "react";
// SlideDemo/FmlaDemo kept for later restoration — see renderSlide() below.
// import SlideDemo from "./components/demo/SlideDemo";
// import FmlaDemo from "./components/demo/FmlaDemo";
import { motion, AnimatePresence } from "framer-motion";
import { SLIDES, type SlideId } from "../shared/slides.js";
import {
  PhoneOff, Layers,
  Database,
  DollarSign,
  Brain, ShieldAlert,
  ChevronRight, ChevronLeft,
  Phone, MessageSquare, Globe, Share2,
  FileCheck,
  ArrowRight, ScanText, BotMessageSquare, UserRound, Users,
  MailCheck, Workflow, ScanSearch,
  PhoneOutgoing, Stethoscope as SurgeryIcon, Banknote,
  AudioLines, Printer, ShieldCheck, BadgeDollarSign, HeartHandshake,
  type LucideIcon,
} from "lucide-react";

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
  const slides = SLIDES;
  const navSlides = useMemo(() => {
    const askIndex = slides.indexOf("ask");
    return askIndex >= 0 ? slides.slice(0, askIndex + 1) : slides;
  }, [slides]);
  const exportSlides = isPdfExport && exportSlideId ? [exportSlideId] : SLIDES;
  const [current, setCurrent] = useState(() => {
    if (!exportSlideId) {
      return 0;
    }

    const exportIndex = SLIDES.indexOf(exportSlideId);
    return exportIndex >= 0 ? exportIndex : 0;
  });
  const [problemBuilt, setProblemBuilt] = useState(isPdfExport);
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

  useEffect(() => {
    if (isPdfExport) {
      setProblemBuilt(true);
    }
  }, [isPdfExport]);

  useEffect(() => {
    if (!isPdfExport || !exportSlideId) {
      return;
    }

    const exportIndex = SLIDES.indexOf(exportSlideId);
    if (exportIndex >= 0) {
      setCurrent(exportIndex);
    }
    setProblemBuilt(true);
  }, [exportSlideId, isPdfExport]);

  const goToSlideIndex = useCallback(
    (index: number) => {
      const targetIndex = Math.max(0, Math.min(index, slides.length - 1));
      const targetSlide = slides[targetIndex];
      setCurrent(targetIndex);
      setProblemBuilt(isPdfExport ? true : false);
      if (targetSlide === "problem" && isPdfExport) {
        setProblemBuilt(true);
      }
    },
    [isPdfExport, slides]
  );

  const next = useCallback(
    () => {
      const currentSlide = slides[current];

      if (currentSlide === "problem" && !problemBuilt) {
        setProblemBuilt(true);
        return;
      }

      const nextIndex = Math.min(current + 1, slides.length - 1);
      const nextSlide = slides[nextIndex];

      setCurrent(nextIndex);
      setProblemBuilt(nextSlide === "problem" ? false : false);
    },
    [current, problemBuilt, slides]
  );
  const prev = useCallback(() => {
    const currentSlide = slides[current];

    if (currentSlide === "problem" && problemBuilt) {
      setProblemBuilt(false);
      return;
    }

    const prevIndex = Math.max(current - 1, 0);
    const prevSlide = slides[prevIndex];

    setCurrent(prevIndex);
    setProblemBuilt(prevSlide === "problem");
  }, [current, problemBuilt, slides]);

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
    <div className="deck-root">
      {/* Ambient background blobs */}
      <div className="deck-bg">
        <div className="blob blob-top" />
        <div className="blob blob-right" />
        <div className="blob blob-bottom" />
      </div>

      {!isPdfExport && (
        <header className="deck-header">
          <button className="header-logo" onClick={() => goToSlideIndex(0)} aria-label="Go to slide 1">
            <img
              src="/may_i_vectorized.svg"
              alt="May I"
              className="logo-img"
            />
            <div>
              <div className="logo-name">May I</div>
              <div className="logo-sub">Customer Deck</div>
            </div>
          </button>

          <nav className="slide-dots" aria-label="Slide navigation">
            {navSlides.map((id, i) => (
              <button
                key={id}
                onClick={() => goToSlideIndex(i)}
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
      )}

      {/* Slide area */}
      <main className="deck-main">
        {isPdfExport ? (
          <div className="slide-wrap" data-export-capture="true">
            {renderSlide(slideId, goToSlideIndex, { isExportMode: true, problemBuilt })}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={slideId}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.38 }}
              className="slide-wrap"
            >
              {renderSlide(slideId, goToSlideIndex, { isExportMode: false, problemBuilt })}
              {/* slideId === "color-options" && <SlideColorOptions /> */}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {!isPdfExport && (
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
      )}
    </div>

    {!isPdfExport && (
      <div className="print-deck" aria-hidden="true">
        {exportSlides.map((id) => (
          <div key={id} className="print-slide">
            {renderSlide(id, () => {}, { isExportMode: false, problemBuilt: id === "problem" ? true : problemBuilt })}
          </div>
        ))}
      </div>
    )}
    </>
  );
}

function renderSlide(
  slideId: (typeof SLIDES)[number],
  goTo: (index: number) => void,
  options: { isExportMode: boolean; problemBuilt: boolean },
) {
  if (slideId === "founder") return <SlideFounder />;
  if (slideId === "hero") return <SlideHero goTo={goTo} />;
  if (slideId === "problem") return <SlideProblem isBuilt={options.problemBuilt || options.isExportMode} />;
  if (slideId === "loss") return <SlideLoss />;
  if (slideId === "everyday-benefits") return <SlideEverydayBenefits />;
  if (slideId === "voice-agent") return <SlideVoiceAgent />;
  if (slideId === "qualify") return <SlideQualify />;
  if (slideId === "qualify-experience") return <SlideQualifyExperience />;
  if (slideId === "confirm") return <SlideConfirm />;
  if (slideId === "engine") return <SlideEngine />;
  if (slideId === "capture-detail") return <SlideCaptureDetail />;
  if (slideId === "connect-detail") return <SlideConnectDetail />;
  if (slideId === "convert-detail") return <SlideConvertDetail />;
  if (slideId === "traction") return <SlideTraction />;
  if (slideId === "vision") return <SlideVision />;
  if (slideId === "ask") return <SlideAsk />;
  // "demo" and "fmla-demo" removed from SLIDES (shared/slides.js) at the user's
  // request — components kept intact below. To restore: add the ids back to
  // SLIDES and uncomment the two lines below.
  // if (slideId === "demo") return <SlideDemo isExportMode={options.isExportMode} />;
  // if (slideId === "fmla-demo") return <FmlaDemo isExportMode={options.isExportMode} />;
  return null;
}

type DetailCardShade = "card-capture" | "card-connect" | "card-convert";

type DetailStage = {
  label: string;
  eyebrow: string;
  impact: string;
  impactQualifier: string;
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
  impact: "$1.8M",
  impactQualifier: "per year missed consults",
  percent: "15%",
  friction: "Front office personnel spend 30% of their time manually capturing patient information and scheduling appointments.",
  summary: "of front-office time automated",
  shade: "card-capture",
  accent: CCC_COLORS.capture,
  cards: [
    {
      icon: BotMessageSquare,
      title: "Booked Consults",
      text: "AI answers patient calls and texts, captures demographic and insurance information, negotiates availability, and schedules consultations in the EMR/PMS.",
      compactText: "Schedule with captured information from calls, texts, or images.",
    },
    {
      icon: ScanText,
      title: "Engagement with Information",
      text: "AI extracts patient demographic and insurance information from faxes and documents and schedules consultations in the EMR/PMS.",
      compactText: "Answers questions about the practice or appointment.",
    },
    {
      icon: UserRound,
      title: "Personalized Responses",
      text: "All customer conversations and future intent are captured in the CRM. This data is used to personalize patient engagement at every touchpoint.",
      compactText: "CRM memory that personalizes each patient touchpoint.",
    },
  ],
};

const CONNECT_DETAIL: DetailStage = {
  label: "Connect",
  eyebrow: "Appendix: Connect",
  impact: "$750K",
  impactQualifier: "per year lost to inefficiency",
  percent: "10%",
  friction: "Back-office personnel spend 20% of their time manually entering data into the EMR, and fielding patient billing and status requests.",
  summary: "of back-office time automated",
  shade: "card-connect",
  accent: CCC_COLORS.connect,
  cards: [
    {
      icon: ScanText,
      title: "Conversation Intelligence Agent",
      text: "AI analyzes call and text transcripts to extract structured intelligence — procedure, intent, willingness to pay — and labels the case automatically.",
      compactText: "Extracts procedure, intent, and willingness-to-pay signals from every conversation.",
    },
    {
      icon: Database,
      title: "Patient Context Agent",
      text: "AI pulls relevant context from the EMR/PMS — patient history, prior procedures, appointments, provider relationships, medications/records where appropriate — and uses it to inform the interaction.",
      compactText: "Pulls patient history and context from the EMR/PMS to inform every interaction.",
    },
    {
      icon: Workflow,
      title: "CRM Orchestrator Agents",
      text: "Inputs, agentic operations, and outputs are defined for each stage in the CRM and automatically moved to the next stage until complete.",
      compactText: "Stage-based CRM operations move work to completion.",
    },
  ],
};

const CONVERT_DETAIL: DetailStage = {
  label: "Convert",
  eyebrow: "Appendix: Convert",
  impact: "$2.0M",
  impactQualifier: "per year patient lifetime revenue expansion potential",
  percent: "10%",
  friction: "Back-office personnel spend 10% of their time making outbound calls for patient recalls, targeted marketing, or billing.",
  summary: "of back-office time automated",
  shade: "card-convert",
  accent: CCC_COLORS.convert,
  cards: [
    {
      icon: PhoneOutgoing,
      title: "Lead Generation",
      text: "AI identifies patients due for follow-ups and automatically initiates call or text outreach based on last visit date and procedure history.",
      compactText: "Personalized outreach campaigns drive visits and conversion.",
    },
    {
      icon: SurgeryIcon,
      title: "Patient Recall, Upsell / Cross Sell",
      text: "AI identifies patient segments, unused benefits, and timing signals to trigger personalized outreach that drives additional visits and product conversion.",
      compactText: "Follow-up outreach triggered by visit and procedure history.",
    },
    {
      icon: Banknote,
      title: "Revenue Recovery",
      text: "AI agents follow up on outstanding balances through personalized calls and texts. Improves collection rates and reduces days in A/R.",
      compactText: "Personalized collections outreach improves A/R performance.",
    },
  ],
};

type RevenueCycleSolution = {
  icon: LucideIcon;
  title: string;
  employeeType: "Agentic Front Office Employee" | "May I Communications Agents" | "Agentic Back Office Employee" | "May I Qualification Agents" | "May I Growth & Retention Agents";
  functionLabel: string;
};

type RevenueCycleStage = {
  id: string;
  stage: string;
  persona: "Demand Capture" | "Demand Connect" | "Demand Convert" | "Care";
  metricTitle: string;
  metricValue: string;
  metricLabel: string;
  commentary: string;
  sourceHref: string;
  sourceLabel: string;
  challenge: string;
  accent: string;
  showMetricCard?: boolean;
  separatorAfter?: boolean;
  solutions: ReadonlyArray<RevenueCycleSolution>;
};

function getRevenueCycleSolution(
  source: DetailStage,
  title: string,
  employeeType: RevenueCycleSolution["employeeType"],
  functionLabel: string,
): RevenueCycleSolution {
  const card = source.cards.find((entry) => entry.title === title);

  if (!card) {
    throw new Error(`Missing solution card: ${title}`);
  }

  return {
    icon: card.icon,
    title: card.title,
    employeeType,
    functionLabel,
  };
}

const REVENUE_CYCLE_STAGES: ReadonlyArray<RevenueCycleStage> = [
  {
    id: "intake",
    stage: "Patient Intake",
    persona: "Demand Capture",
    metricTitle: "Missed Demand",
    metricValue: "35%",
    metricLabel: "of calls during the day are missed",
    commentary: "High-intent patients hit voicemail during business hours, and move on before staff recovers the lead.",
    sourceHref: "https://www.mayiguide.com",
    sourceLabel: "Source: May I - Austin Face and Body",
    challenge: "Fragmented intake, missed patient information, and scheduling friction at first contact.",
    accent: CCC_COLORS.capture,
    solutions: [
      getRevenueCycleSolution(CAPTURE_DETAIL, "Booked Consults", "May I Communications Agents", "Answers calls, texts, and books consults"),
      getRevenueCycleSolution(CAPTURE_DETAIL, "Engagement with Information", "May I Communications Agents", "Extract patient and insurance data from IDs"),
      getRevenueCycleSolution(CAPTURE_DETAIL, "Personalized Responses", "May I Communications Agents", "Personalizes responses with patient data"),
    ],
  },
  {
    id: "preauth",
    stage: "Patient Qualification",
    persona: "Demand Connect",
    metricTitle: "Slow Speed-to-Lead",
    metricValue: "42hrs",
    metricLabel: "average company response time",
    commentary: "Responding within 5 minutes makes contact 100x more likely — but patient intent is scattered.",
    sourceHref: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
    sourceLabel: "Source: Harvard Business Review",
    challenge: "Captured demand goes unqualified and unenriched, so practices can't act on it fast enough.",
    accent: CCC_COLORS.connect,
    separatorAfter: true,
    solutions: [
      getRevenueCycleSolution(CONNECT_DETAIL, "Conversation Intelligence Agent", "May I Qualification Agents", "Extracts procedure, intent, and sentiment"),
      getRevenueCycleSolution(CONNECT_DETAIL, "Patient Context Agent", "May I Qualification Agents", "Enriches interactions with EMR/PMS context"),
      getRevenueCycleSolution(CONNECT_DETAIL, "CRM Orchestrator Agents", "May I Qualification Agents", "Orchestrates the next best action"),
    ],
  },
  {
    id: "consult",
    stage: "Consult",
    persona: "Care",
    metricTitle: "",
    metricValue: "",
    metricLabel: "",
    commentary: "",
    sourceHref: "",
    sourceLabel: "",
    challenge: "The clinician delivers care and the EMR/PMS remains the system of record.",
    accent: "var(--mi-copper)",
    showMetricCard: false,
    solutions: [],
  },
  {
    id: "recall",
    stage: "Patient Growth & Retention",
    persona: "Demand Convert",
    metricTitle: "Patient Churn",
    metricValue: "25%",
    metricLabel: "switched providers because they were unhappy",
    commentary: "Poor patient experience now drives measurable provider switching across healthcare.",
    sourceHref: "https://www.accenture.com/us-en/insightsnew/health/difference-between-loyalty-leaving",
    sourceLabel: "Source: Accenture",
    challenge: "Dormant patient relationships go unmanaged once the encounter ends.",
    accent: CCC_COLORS.convert,
    solutions: [
      getRevenueCycleSolution(CONVERT_DETAIL, "Lead Generation", "May I Growth & Retention Agents", "Runs patient recall and reactivation outreach"),
      getRevenueCycleSolution(CONVERT_DETAIL, "Patient Recall, Upsell / Cross Sell", "May I Growth & Retention Agents", "Runs targeted patient marketing"),
      getRevenueCycleSolution(CONVERT_DETAIL, "Revenue Recovery", "May I Growth & Retention Agents", "Follows up on outstanding balances"),
    ],
  },
] as const;

const LIVE_USAGE_METRICS = [
  { value: "2", heroValue: "2", heroLabel: "practices live", tractionLabel: "Practices" },
  { value: "9", heroValue: "9", heroLabel: "providers", tractionLabel: "Providers" },
  { value: "3,082", heroValue: "3,082", heroLabel: "calls/month", tractionLabel: "Calls handled /\u00a0month" },
  { value: "381", heroValue: "381", heroLabel: "AI leads captured/month", tractionLabel: "AI leads captured /\u00a0month" },
] as const;

const HERO_USAGE_METRICS = LIVE_USAGE_METRICS.filter(
  ({ heroLabel }) => heroLabel !== "practices live" && heroLabel !== "providers"
);

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

function renderDetailCards(cards: DetailStage["cards"], shade: DetailCardShade) {
  return cards.map(({ title, text }) => (
    <motion.div key={title} variants={fadeUp} className={`detail-card ${shade}`}>
      <div className="detail-card-title">
        <span className="benefit-bullet" aria-hidden="true" />
        {title}
      </div>
      <div className="detail-card-text">{text}</div>
    </motion.div>
  ));
}

function renderDetailFrictionText(friction: string, percent: string) {
  const match = friction.match(/\d+%/);
  if (!match || match.index == null) {
    return friction;
  }

  const start = friction.slice(0, match.index);
  const end = friction.slice(match.index + match[0].length);

  return (
    <>
      {start}
      <span className="detail-pct">{percent}</span>
      {end}
    </>
  );
}

function getStageGroupLabel(stageId: RevenueCycleStage["id"]) {
  if (stageId === "intake") return "Capture";
  if (stageId === "preauth") return "Connect";
  if (stageId === "recall") return "Convert";
  return "";
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
  const visibleSlides: readonly SlideId[] = SLIDES;
  const agendaAll: ReadonlyArray<{ num: string; label: string; slideId: SlideId }> = [
    { num: "2",  label: "The Problem",            slideId: "problem" },
    { num: "3",  label: "Revenue Opportunity",    slideId: "loss" },
    { num: "4",  label: "Benefits Beyond ROI",    slideId: "everyday-benefits" },
    { num: "5",  label: "The May I System",       slideId: "engine" },
    { num: "6",  label: "Voice Agent Demo",       slideId: "voice-agent" },
    { num: "7",  label: "Patient Intelligence",   slideId: "qualify-experience" },
    { num: "8",  label: "Agentic CRM",            slideId: "qualify" },
    { num: "9",  label: "Confirmation Agent",     slideId: "confirm" },
    { num: "10", label: "Traction",               slideId: "traction" },
    { num: "11", label: "Founder & CEO",          slideId: "founder" },
    { num: "12", label: "Vision",                 slideId: "vision" },
    { num: "13", label: "Next Steps",             slideId: "ask" },
  ];
  const agenda = agendaAll;
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
          The AI Patient Revenue Engine
          <span className="headline-accent"> for Healthcare.</span>
        </motion.h1>
        <motion.p variants={fadeUp} className="hero-sub">
          <strong>May I deploys agentic employees</strong> to capture demand, run patient operations, and grow patient lifetime value.
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
            <div className="flow-rows flow-rows-demand">
              <div className="flow-row flow-row-demand">
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
                <img src="/may_i_vectorized.svg" alt="May I" className="hero-engine-logo" />
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
                    { label: "Capture", role: <>Comms<br />Agents</>, color: CCC_COLORS.capture, align: "right" },
                    { label: "Connect", role: <>Qualification<br />Agents</>, color: CCC_COLORS.connect },
                    { label: "Convert", role: <>Growth &amp;<br />Retention<br />Agents</>, color: CCC_COLORS.convert },
                  ].map(({ label, role, color, align }, i) => (
                    <>
                      <span key={label} className={`hero-ccc-label-group${align === "right" ? " hero-ccc-label-group-right" : ""}`}>
                        <span className="hero-ccc-label" style={{ color }}>{label}</span>
                        <span className="hero-ccc-role">{role}</span>
                      </span>
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
          <motion.div variants={fadeUp} className="hero-metrics-panel">
            <div className="hero-metrics-heading">
              LIVE MAY I COMMUNICATIONS AGENTS ANSWER INCOMING CALLS AND BOOK CONSULTS
            </div>
            <div className="hero-metrics-grid" aria-label="Live customer usage stats">
              {HERO_USAGE_METRICS.map((metric) => (
                <motion.article key={metric.heroLabel} variants={fadeUp} className="hero-metric-card">
                  <div className="hero-metric-value">{metric.heroValue}</div>
                  <div className="hero-metric-label">{metric.heroLabel}</div>
                </motion.article>
              ))}
            </div>
          </motion.div>
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

function SlideProblem({ isBuilt }: { isBuilt: boolean }) {
  return (
    <div className="slide slide-problem">
      <SlideHeader
        eyebrow="The Problem"
        title="Practice experience is stuck in 1985."
      />
      <motion.div
        className="problem-layout"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        <div className="problem-timeline">
          {REVENUE_CYCLE_STAGES.map(({ id, stage, persona, metricTitle, metricValue, metricLabel, commentary, sourceHref, sourceLabel, accent, showMetricCard = true, separatorAfter = false }, index) => (
            <motion.section
              key={stage}
              layout
              variants={fadeUp}
              className={`problem-stage${separatorAfter ? " problem-stage-separator-after" : ""}`}
              data-stage-id={id}
              transition={{ layout: { duration: 0.42, ease: "easeInOut" } }}
            >
              {showMetricCard ? (
                <motion.div
                  layout
                  className={`problem-challenge-card${isBuilt ? " problem-challenge-card-built" : ""}`}
                  style={{ borderTopColor: accent }}
                  transition={{ layout: { duration: 0.42, ease: "easeInOut" } }}
                >
                  <Users size={28} className="problem-staff-card-icon" aria-hidden="true" />
                  <div className="problem-card-label">{metricTitle}</div>
                  <div className="problem-stage-stat" style={{ color: accent }}>{metricValue}</div>
                  <div className="problem-stage-stat-label">{metricLabel}</div>
                  <AnimatePresence initial={false}>
                    {!isBuilt ? (
                      <motion.div
                        key="problem-card-body"
                        initial={{ opacity: 1, y: 0 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                      >
                        <div className="problem-stage-commentary">{commentary}</div>
                        <a
                          className="problem-source-link"
                          href={sourceHref}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {sourceLabel}
                        </a>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <motion.div
                  layout
                  className={`problem-card-placeholder${isBuilt ? " problem-card-placeholder-built" : ""}`}
                  aria-hidden="true"
                  transition={{ layout: { duration: 0.42, ease: "easeInOut" } }}
                />
              )}

              <motion.div
                layout
                className="problem-stage-track"
                transition={{ layout: { duration: 0.42, ease: "easeInOut" } }}
              >
                <div className="problem-stage-line" aria-hidden="true" />
                <div className="problem-stage-marker" style={{ borderColor: accent, backgroundColor: accent }} aria-hidden="true" />
                <div className="problem-stage-meta">
                  <div className="problem-stage-title">{stage}</div>
                  <div className="problem-persona-badge" style={{ color: accent, borderColor: accent }}>
                    {persona}
                  </div>
                </div>
                {index < REVENUE_CYCLE_STAGES.length - 1 ? (
                  <ArrowRight
                    size={16}
                    className="problem-stage-arrow"
                    style={{ color: accent }}
                    aria-hidden="true"
                  />
                ) : null}
              </motion.div>
            </motion.section>
          ))}
        </div>

        <AnimatePresence initial={false}>
          {isBuilt ? (
            <motion.div
              className="problem-attribution-line"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.32, ease: "easeOut" }}
            >
              <span className="problem-attribution-rule" aria-hidden="true" />
              <span className="problem-attribution-label">Revenue Attribution</span>
              <span className="problem-attribution-rule" aria-hidden="true" />
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {isBuilt ? (
            <motion.div
              className="problem-timeline problem-solutions-row"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 28 }}
              transition={{ duration: 0.38, ease: "easeOut" }}
            >
              {REVENUE_CYCLE_STAGES.map(({ id, stage, accent, solutions }) => (
                solutions.length > 0 ? (
                  <div key={stage} className="problem-solutions">
                    <div className="problem-solution-card" style={{ borderTopColor: accent }}>
                      <div className="problem-solutions-label" style={{ color: accent }}>
                        <img
                          src="/may_i_vectorized.svg"
                          alt="May I"
                          className="problem-solutions-logo"
                        />
                        <div className="problem-solutions-label-text">
                          <span className="problem-solutions-label-stage" style={{ color: accent }}>
                            {getStageGroupLabel(id)}
                          </span>
                          <span className="problem-solutions-label-brand">May I</span>
                          <span className="problem-solutions-label-role">
                            {solutions[0].employeeType.replace(/^May I\s+/, "")}
                          </span>
                        </div>
                      </div>
                      <div className="problem-solution-group">
                        {solutions.map(({ icon: Icon, title, functionLabel }) => (
                          <div key={title} className="problem-solution-row">
                            <div className="problem-solution-title">
                              <Icon size={16} />
                              <span>{functionLabel}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : <div key={stage} aria-hidden="true" />
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>
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
      impact: "$1.8M",
      impactQualifier: "per year missed consults",
      subtext: "AI captures missed-calls of which 10% are leads. Of the 150 leads/month, 20% convert at $5K/proc",
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
      subtext: "A 5-provider practice generating $5M annually requires 30% admin effort and 50% leaks.",
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
      impact: "$2.0M",
      impactQualifier: "per year patient lifetime revenue expansion potential",
      subtext: "Existing patients are 12x more likely to return than new patients are to convert. A 5% increase in retention can increase profits by 25–95%.",
      sourceHref: "https://www.bain.com/insights/retaining-customers-is-the-real-challenge",
      sourceLabel: "Source: Bain & Company",
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
        title="Revenue is lost - or left on the table - at every step"
      />
      <div className="loss-body">
        <motion.div
          className="loss-grid"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          {losses.map(({ icon, label, impact, impactQualifier, subtext, sourceHref, sourceLabel, color, featured }) => (
            <motion.section key={label} variants={fadeUp} className={`loss-card${featured ? " loss-card-featured" : ""}`}>
              <div className="loss-card-head">
                <div className="loss-card-label" style={{ color }}>{label}</div>
                <div className="loss-card-icon" style={{ color, borderColor: color }}>
                  {icon}
                </div>
              </div>
              <div className="loss-card-main">
                <div className="loss-card-stat-wrap">
                  <div className="loss-card-impact">{impact}</div>
                  {impactQualifier && <div className="loss-card-impact-qualifier">{impactQualifier}</div>}
                </div>
                <div className="loss-card-text-wrap">
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
                </div>
              </div>
            </motion.section>
          ))}
        </motion.div>

        <motion.div
          className="loss-summary"
          variants={fadeUp}
          initial="hidden"
          animate="show"
        >
          <span className="loss-summary-value">$4.6</span>
          <span className="loss-summary-text">Million</span>
          <span className="loss-summary-caption">per practice per year revenue opportunity</span>
        </motion.div>

      </div>
    </div>
  );
}

// ─── Slide 4: Everyday Benefits ─────────────────────────────────────────────

function SlideEverydayBenefits() {
  const benefits = [
    {
      icon: ShieldCheck,
      label: "Peace of Mind",
      headline: "Your front desk stays on, so you can switch off.",
      copy: "Know every patient is supported, even after hours—without staffing gaps, turnover, or constant front-desk fire drills.",
      outcome: "Confidence that the practice is covered.",
    },
    {
      icon: BadgeDollarSign,
      label: "Get Paid Faster",
      headline: "Fewer gaps between care and payment.",
      copy: "Automated intake, follow-up, and payment workflows keep revenue from slipping through the cracks.",
      outcome: "More predictable cash flow.",
    },
    {
      icon: HeartHandshake,
      label: "Higher Patient Satisfaction",
      headline: "Every patient gets an immediate, helpful response.",
      copy: "Personalized, context-aware conversations make scheduling and getting answers effortless.",
      outcome: "A practice patients want to return to.",
    },
  ];

  return (
    <div className="slide slide-everyday-benefits">
      <SlideHeader
        eyebrow="Beyond ROI"
        title="Benefits you feel every day"
      />
      <p className="everyday-benefits-intro">
        Measurable ROI is only the beginning. May I makes the practice easier to run—and better to experience.
      </p>
      <motion.div
        className="everyday-benefits-grid"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {benefits.map(({ icon: Icon, label, headline, copy, outcome }) => (
          <motion.section key={label} className="everyday-benefit" variants={fadeUp}>
            <div className="everyday-benefit-icon"><Icon size={30} strokeWidth={1.6} /></div>
            <div className="everyday-benefit-label">{label}</div>
            <h3>{headline}</h3>
            <p>{copy}</p>
            <div className="everyday-benefit-outcome">{outcome}</div>
          </motion.section>
        ))}
      </motion.div>
    </div>
  );
}

function SlideVoiceAgent() {
  const capabilities = [
    "Customizable multi-lingual agent",
    "Intelligent responses specific to Envision Eye Group",
    "Patient intake and scheduling",
    "Personalized greeting for returning patients",
    "Patient schedule lookup with two-factor authentication",
    "Call routing",
    "Route to booking app",
  ];

  const exampleQuestions = [
    "Tell me about Dr. Laiyin Ma.",
    "What services are offered at the practice?",
    "Is EVO ICL right for me?",
    "Do I have an upcoming appointment? (birthdate: 4-12-1988)",
    "I'd like to schedule an appointment.",
  ];

  return (
    <div className="slide slide-voice-agent">
      <SlideHeader
        eyebrow="Capture - Voice Agent Demo"
        title={<>Multi-lingual Voice Agent for<br /><span style={{ whiteSpace: "nowrap" }}>Envision Eye Group</span></>}
      />

      <div className="voice-agent-layout">
        <motion.section
          className="voice-agent-panel"
          variants={fadeUp}
          initial="hidden"
          animate="show"
        >
          <div className="voice-agent-call-panel hero-engine-box">
            <div className="hero-engine-box-header">
              <img src="/may_i_vectorized.svg" alt="May I" className="hero-engine-logo" />
              <div>
                <div className="hero-engine-box-label">Call</div>
                <div className="voice-agent-call-value">386-202-9994</div>
              </div>
            </div>
          </div>
          <div className="voice-agent-panel-label">Voice Agent Features</div>
          <div className="voice-agent-list">
            {capabilities.map((item, index) => (
              <div key={item} className="voice-agent-list-item">
                <span className="voice-agent-list-index">{index + 1}</span>
                <span className="voice-agent-list-text">{item}</span>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          className="voice-agent-panel"
          variants={fadeUp}
          initial="hidden"
          animate="show"
        >
          <div className="voice-agent-panel-label">Sample Questions To Ask The Agent</div>
          <div className="voice-agent-question-list">
            {exampleQuestions.map((item) => (
              <div key={item} className="voice-agent-question-card">
                <MessageSquare size={18} className="voice-agent-question-icon" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  );
}

// ─── Slide 5: Engine overview ─────────────────────────────────────────────────

function SlideQualify() {
  return (
    <div className="slide slide-qualify">
      <SlideHeader
        eyebrow="CONNECT - AGENTIC CRM"
        title="AI Organizes the Work—Your Team Elevates the Patient Experience"
      />
      <motion.figure
        className="qualify-figure"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <img
          src="/capture_screenshot.png"
          alt="May I CRM workspace showing patient communication and workflow details"
          className="qualify-image"
        />
      </motion.figure>
    </div>
  );
}

function SlideConfirm() {
  return (
    <div className="slide slide-qualify">
      <SlideHeader
        eyebrow="CONVERT - APPOINTMENT CONFIRMATION"
        title="Protect Revenue With Automated, Multi-Lingual Reminders"
      />
      <motion.figure
        className="qualify-figure"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <img
          src="/confirm_screenshot.png"
          alt="May I confirmation calendar showing appointment status and automated reminder controls"
          className="qualify-image"
        />
      </motion.figure>
    </div>
  );
}

function SlideQualifyExperience() {
  return (
    <div className="slide slide-qualify">
      <SlideHeader
        eyebrow="Capture - PATIENT INTELLIGENCE"
        title="Empower Your Staff with Patient Intelligence for Every Call and Text"
      />
      <motion.figure
        className="qualify-figure"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <img
          src="/qualify_screenshot.png"
          alt="May I Qualify workspace showing appointment capacity, patient context, and AI-recommended actions"
          className="qualify-image"
        />
      </motion.figure>
    </div>
  );
}

// ─── Slide 5: Engine overview ─────────────────────────────────────────────────

function SlideEngine() {
  const captureOutcomes = [
    { icon: <Phone size={16} />, text: "Voice Agents" },
    { icon: <Printer size={16} />, text: "Referral Fax Agents" },
    { icon: <MessageSquare size={16} />, text: "Text Agents" },
  ];
  const connectOutcomes = [
    { icon: <ScanText size={16} />, text: "Conversation Intelligence Agent" },
    { icon: <Database size={16} />, text: "Patient Context Agent" },
    { icon: <Workflow size={16} />, text: "CRM Orchestrator Agents" },
  ];
  const convertOutcomes = [
    { icon: <PhoneOutgoing size={16} />, text: "Patient Recall Agents" },
    { icon: <FileCheck size={16} />, text: "Targeted Marketing Agents" },
    { icon: <Banknote size={16} />, text: "Collections Agents" },
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
        May I is the <strong>system of engagement</strong> — capturing patient
        intent, orchestrating action, and attributing revenue from demand
        generation through conversion.
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
            <img src="/may_i_vectorized.svg" alt="May I" className="engine-core-logo" />
            <div>
              <div className="engine-core-label">May I Engine</div>
              <div className="engine-core-tagline">Critical System of Engagement</div>
            </div>
          </div>
          <div className="engine-core-items">
            {[
              {
                icon: <Brain size={30} color="var(--mi-copper)" strokeWidth={1.6} />,
                label: "Agentic Voice, Text, Vision, & Computer Use",
                text: <>Agentic Voice, Text, Vision,<br />&amp; Computer Use</>,
              },
              { icon: <AudioLines size={30} color="var(--mi-copper)" strokeWidth={1.6} />, label: "Communications as a Service", text: "Communications as a Service" },
              { icon: <Database size={30} color="var(--mi-copper)" strokeWidth={1.6} />, label: "CRM and Patient Intent Store", text: "CRM and Patient Intent Store" },
            ].map(({ icon, label, text }) => (
              <div key={label} className="engine-core-item">
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
            <div className="engine-group-agent engine-group-agent-capture">Communications Agents</div>
            {captureOutcomes.map(({ icon, text }) => (
              <div key={text} className="engine-chip engine-chip-out engine-chip-capture">{icon}<span>{text}</span></div>
            ))}
          </div>
          <div className="engine-group">
            <div className="engine-group-label engine-group-connect">Connect</div>
            <div className="engine-group-agent engine-group-agent-connect">Qualification Agents</div>
            {connectOutcomes.map(({ icon, text }) => (
              <div key={text} className="engine-chip engine-chip-out engine-chip-connect">{icon}<span>{text}</span></div>
            ))}
          </div>
          <div className="engine-group">
            <div className="engine-group-label engine-group-convert">Convert</div>
            <div className="engine-group-agent engine-group-agent-convert">Growth &amp; Retention Agents</div>
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
          {renderDetailFrictionText(CAPTURE_DETAIL.friction, CAPTURE_DETAIL.percent)}
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
          {renderDetailFrictionText(CONNECT_DETAIL.friction, CONNECT_DETAIL.percent)}
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
          {renderDetailFrictionText(CONVERT_DETAIL.friction, CONVERT_DETAIL.percent)}
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

// ─── Slide 8: Why May I Wins ──────────────────────────────────────────────────

// ─── Slide 9: Moats ───────────────────────────────────────────────────────────
// ─── Slide 10: Vision ─────────────────────────────────────────────────────────

function SlideVision() {
  const phases = [
    {
      num: "01",
      phase: "Today",
      stageLabel: "Capture",
      agentTitle: "Communications Agents",
      icon: <ShieldAlert size={22} />,
      headline: "Stop the leak",
      text: "Inbound capture, instant response, appointment booking — the wedge that pays for itself.",
      color: CCC_COLORS.capture,
    },
    {
      num: "02",
      phase: "Tomorrow",
      stageLabel: "Connect",
      agentTitle: "Qualification Agents",
      icon: <ScanSearch size={22} />,
      headline: "Own the workflow, capture the data",
      text: "Insurance Pre-auth, Billing, Patient recalls — orchestrated by May I across the full patient journey.",
      color: CCC_COLORS.connect,
    },
    {
      num: "03",
      phase: "Future",
      stageLabel: "Convert",
      agentTitle: "Growth & Retention Agents",
      icon: <Brain size={22} />,
      headline: "Predict and action on the data",
      text: "Intent intelligence, Targeted Marketing, and Personalization — May I becomes indispensable infrastructure.",
      color: CCC_COLORS.convert,
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
          <span className="vision-title-line">From front-desk automation to</span>
          <span className="vision-title-line">the intelligent operating layer for healthcare.</span>
        </motion.h2>
      </motion.div>

      <motion.div
        className="vision-phases"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {phases.map(({ phase, stageLabel, agentTitle, icon, headline, text, color }) => (
          <motion.div key={phase} variants={fadeUp} className="vision-phase">
            <div className="vision-phase-label" style={{ color }}>
              {phase}
            </div>
            <div className="vision-phase-headline">
              <span className="vision-phase-icon" style={{ color }}>
                {icon}
              </span>
              <span>{headline}</span>
            </div>
            <div className="vision-phase-stage" style={{ color }}>
              {stageLabel}
            </div>
            <div className="vision-phase-agent" style={{ color }}>
              {agentTitle}
            </div>
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
  const customerNextSteps = [
    "Multi-lingual AI Comms Agent",
    "AI Booking Intake App",
    "Appointment Reminders",
  ];

  return (
    <div className="slide slide-ask">
      <motion.div className="ask-header" variants={stagger} initial="hidden" animate="show">
        <motion.div variants={fadeUp} className="eyebrow-tag">Next Steps</motion.div>
        <motion.h2 variants={fadeUp} className="ask-title">
          Start with one workflow.
          <br />
          Prove the ROI. Expand from there.
        </motion.h2>
      </motion.div>

      <motion.div className="ask-grid" variants={stagger} initial="hidden" animate="show">
        <motion.section variants={fadeUp} className="ask-panel ask-panel-primary">
          <div className="ask-panel-main">
            <div className="ask-panel-brand">
              <img
                src="/may_i_vectorized.svg"
                alt="May I"
                className="ask-panel-logo"
              />
            </div>

            <div className="ask-panel-content">
              <div className="ask-panel-label">Recommended First Deployment</div>
              <div className="ask-milestone-list">
                {customerNextSteps.map((item) => (
                  <div key={item} className="ask-milestone-item">
                    <ArrowRight size={16} className="ask-milestone-icon" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>
      </motion.div>

      <motion.div variants={fadeUp} className="ask-contact-footer">
        <div className="ask-contact-list">
          <span className="ask-contact-item ask-contact-item-primary">
            <UserRound size={18} className="ask-contact-icon" strokeWidth={1.8} />
            <span className="ask-contact-text ask-contact-text-primary">
              <span className="ask-contact-first">Chami</span>{" "}
              <span className="ask-contact-last">Rupasinghe</span>
            </span>
          </span>
          <span className="ask-contact-item ask-contact-item-secondary">
            <MailCheck size={18} className="ask-contact-icon" strokeWidth={1.8} />
            <span className="ask-contact-text ask-contact-text-secondary">chamir@mayiguide.com</span>
          </span>
          <span className="ask-contact-item ask-contact-item-secondary">
            <Globe size={18} className="ask-contact-icon" strokeWidth={1.8} />
            <span className="ask-contact-text ask-contact-text-secondary">www.mayiguide.com</span>
          </span>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Shared components ────────────────────────────────────────────────────────

function SlideHeader({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: React.ReactNode;
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
