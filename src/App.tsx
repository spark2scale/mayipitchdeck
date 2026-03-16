import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PhoneOff, Clock, Layers, RefreshCw,
  Mic, Database, TrendingUp,
  DollarSign, Users, Zap, Shield,
  Brain, Activity, GitMerge,
  ChevronRight, ChevronLeft,
  Stethoscope, Eye, Smile, Sparkles as SparklesIcon, Baby,
  BarChart3, Target, Rocket,
  Phone, MessageSquare, Globe, Share2,
  Calendar, CreditCard, FileCheck,
  CheckCircle2, XCircle,
  ArrowRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

const SLIDES = [
  "hero",
  "problem",
  "loss",
  "engine",
  "capture-connect-convert",
  "roi",
  "market",
  "why-wins",
  "moats",
  "vision",
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

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [current, setCurrent] = useState(0);

  const next = useCallback(
    () => setCurrent((c) => Math.min(c + 1, SLIDES.length - 1)),
    []
  );
  const prev = useCallback(() => setCurrent((c) => Math.max(c - 1, 0)), []);

  // Keyboard navigation
  useEffect(() => {
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
  }, [next, prev]);

  const slideId = SLIDES[current];

  return (
    <div className="deck-root">
      {/* Ambient background blobs */}
      <div className="deck-bg">
        <div className="blob blob-top" />
        <div className="blob blob-right" />
        <div className="blob blob-bottom" />
      </div>

      {/* Top navigation bar */}
      <header className="deck-header">
        <div className="header-logo">
          <img
            src="/MayILogoTransparentBack.gif"
            alt="May I"
            className="logo-img"
          />
          <div>
            <div className="logo-name">May I</div>
            <div className="logo-sub">Investor Deck</div>
          </div>
        </div>

        <nav className="slide-dots" aria-label="Slide navigation">
          {SLIDES.map((id, i) => (
            <button
              key={id}
              onClick={() => setCurrent(i)}
              className={`dot ${i === current ? "dot-active" : ""}`}
              aria-label={`Slide ${i + 1}`}
              aria-current={i === current ? "true" : undefined}
            />
          ))}
        </nav>

        <a
          href="https://www.mayiguide.com"
          target="_blank"
          rel="noreferrer"
          className="btn-primary btn-sm"
        >
          Live site
        </a>
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
            {slideId === "hero" && <SlideHero />}
            {slideId === "problem" && <SlideProblem />}
            {slideId === "loss" && <SlideLoss />}
            {slideId === "engine" && <SlideEngine />}
            {slideId === "capture-connect-convert" && <SlideCCC />}
            {slideId === "roi" && <SlideROI />}
            {slideId === "market" && <SlideMarket />}
            {slideId === "why-wins" && <SlideWhyWins />}
            {slideId === "moats" && <SlideMoats />}
            {slideId === "vision" && <SlideVision />}
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
          {current + 1} / {SLIDES.length}
        </span>
        <button
          onClick={next}
          disabled={current === SLIDES.length - 1}
          className="nav-btn"
          aria-label="Next slide"
        >
          <ChevronRight size={20} />
        </button>
      </footer>
    </div>
  );
}

// ─── Slide 1: Hero ────────────────────────────────────────────────────────────

function SlideHero() {
  return (
    <div className="slide slide-hero">
      <motion.div
        className="hero-left"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={fadeUp} className="eyebrow-tag">
          Investor Pitch · 2026
        </motion.div>
        <motion.h1 variants={fadeUp} className="hero-headline">
          The AI Revenue Integrity Engine
          <span className="headline-accent"> for Retail Healthcare.</span>
        </motion.h1>
        <motion.p variants={fadeUp} className="hero-sub">
          May I captures, qualifies, and converts every high-intent patient
          inquiry — before the competition picks up the phone.
        </motion.p>
        <motion.div variants={fadeUp} className="hero-questions">
          {[
            "What is May I building?",
            "Why does it matter?",
            "Why can this become a $1B business?",
          ].map((q) => (
            <div key={q} className="question-chip">
              {q}
            </div>
          ))}
        </motion.div>
      </motion.div>

      <motion.div
        className="hero-right"
        variants={slideInRight}
        initial="hidden"
        animate="show"
      >
        <div className="hero-card">
          <div className="hero-card-label">Revenue Integrity Engine</div>
          <div className="ccc-flow">
            {[
              { label: "Capture", icon: <Mic size={22} />, color: "var(--mi-copper)" },
              { label: "Connect", icon: <Database size={22} />, color: "var(--mi-muted)" },
              { label: "Convert", icon: <TrendingUp size={22} />, color: "#5fcf8a" },
            ].map((item, i) => (
              <div key={item.label} className="ccc-step-row">
                <div
                  className="ccc-icon-wrap"
                  style={{ color: item.color }}
                >
                  {item.icon}
                </div>
                <div className="ccc-step-label" style={{ color: item.color }}>
                  {item.label}
                </div>
                {i < 2 && <ArrowRight size={14} className="ccc-arrow" />}
              </div>
            ))}
          </div>
          <div className="flow-rows">
            {[
              ["Demand in", "Calls · Texts · Web · Social · Referrals"],
              ["AI Layer", "Instant response · Intake · Qualification"],
              ["CRM Memory", "Intent · History · Sentiment · Handoff"],
              ["Workflow", "Schedule · Pre-auth · Recalls · Payment"],
              ["Revenue out", "Booked consults · Procedures · Collections"],
            ].map(([k, v], i) => (
              <div
                key={k}
                className={`flow-row ${i === 4 ? "flow-row-strong" : ""}`}
              >
                <span className="flow-key">{k}</span>
                <span className="flow-val">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
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
    <div className="slide slide-content">
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
    <div className="slide slide-content">
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
          <div className="loss-message">
            <Shield size={20} style={{ color: "var(--mi-copper)", flexShrink: 0 }} />
            <span>
              May I frames this as <strong>revenue integrity</strong> — stop
              the leak before chasing growth.
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Slide 4: Engine overview ─────────────────────────────────────────────────

function SlideEngine() {
  return (
    <div className="slide slide-content">
      <SlideHeader
        eyebrow="What May I Is Building"
        title="More than an AI receptionist."
      />
      <div className="engine-grid">
        <motion.div
          className="engine-diagram"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Inputs column */}
          <div className="engine-col">
            <div className="engine-col-label">Inputs</div>
            {[
              { icon: <Phone size={14} />, text: "Inbound calls" },
              { icon: <MessageSquare size={14} />, text: "SMS / text" },
              { icon: <Globe size={14} />, text: "Web chat" },
              { icon: <Share2 size={14} />, text: "Social leads" },
              { icon: <FileCheck size={14} />, text: "Referrals / OCR" },
            ].map(({ icon, text }) => (
              <div key={text} className="engine-chip">
                {icon}
                <span>{text}</span>
              </div>
            ))}
          </div>

          {/* Core engine */}
          <div className="engine-core">
            <div className="engine-core-label">May I Engine</div>
            <div className="engine-core-tagline">
              AI comms · CRM memory · workflow automation
            </div>
            <div className="engine-core-items">
              {[
                { icon: <Mic size={16} />, text: "Agentic voice + text" },
                { icon: <Database size={16} />, text: "CRM as memory layer" },
                { icon: <Calendar size={16} />, text: "Workflow execution" },
                { icon: <CreditCard size={16} />, text: "Revenue realization" },
              ].map(({ icon, text }) => (
                <div key={text} className="engine-core-item">
                  {icon}
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Outputs column */}
          <div className="engine-col">
            <div className="engine-col-label">Outcomes</div>
            {[
              { icon: <Calendar size={14} />, text: "Booked consults" },
              { icon: <FileCheck size={14} />, text: "Pre-auth progress" },
              { icon: <RefreshCw size={14} />, text: "Recalls" },
              { icon: <CreditCard size={14} />, text: "Collections" },
              { icon: <BarChart3 size={14} />, text: "Revenue attribution" },
            ].map(({ icon, text }) => (
              <div key={text} className="engine-chip engine-chip-out">
                {icon}
                <span>{text}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="engine-description"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          <motion.p variants={fadeUp} className="engine-desc-text">
            May I is the <strong>system of engagement</strong> — sitting
            between patients and practices, owning the conversion layer while
            EMR/PMS remains the system of record.
          </motion.p>
          <motion.div variants={fadeUp} className="engine-pillars">
            {[
              {
                icon: <Mic size={20} />,
                title: "AI Communications",
                text: "Voice, text, web — always on, always responsive",
              },
              {
                icon: <Database size={20} />,
                title: "CRM Memory",
                text: "Patient intent, history, and context — unified",
              },
              {
                icon: <GitMerge size={20} />,
                title: "Workflow Automation",
                text: "Intake, scheduling, pre-auth, billing — orchestrated",
              },
            ].map(({ icon, title, text }) => (
              <div key={title} className="engine-pillar">
                <div className="engine-pillar-icon">{icon}</div>
                <div>
                  <div className="engine-pillar-title">{title}</div>
                  <div className="engine-pillar-text">{text}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Slide 5: Capture → Connect → Convert ────────────────────────────────────

function SlideCCC() {
  const pillars = [
    {
      step: "01",
      label: "Capture",
      icon: <Mic size={40} />,
      color: "var(--mi-copper)",
      headline: "Always-on front door",
      items: [
        "Voice & SMS intake 24/7",
        "Web chat + social leads",
        "Referrals & OCR documents",
        "After-hours coverage",
      ],
    },
    {
      step: "02",
      label: "Connect",
      icon: <Database size={40} />,
      color: "var(--mi-muted)",
      headline: "CRM-powered intelligence",
      items: [
        "Unified patient memory",
        "Intent & sentiment modeling",
        "Staff handoff orchestration",
        "EMR/PMS integration",
      ],
    },
    {
      step: "03",
      label: "Convert",
      icon: <TrendingUp size={40} />,
      color: "#5fcf8a",
      headline: "Revenue loop closed",
      items: [
        "Appointment scheduling",
        "Pre-auth & eligibility",
        "Payment prompts & collections",
        "Lifecycle recalls",
      ],
    },
  ];

  return (
    <div className="slide slide-content">
      <SlideHeader
        eyebrow="The May I System"
        title="Capture → Connect → Convert."
      />
      <motion.div
        className="ccc-grid"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {pillars.map(({ step, label, icon, color, headline, items }) => (
          <motion.div key={label} variants={fadeUp} className="ccc-pillar">
            <div className="ccc-pillar-step" style={{ color }}>
              {step}
            </div>
            <div className="ccc-pillar-icon" style={{ color }}>
              {icon}
            </div>
            <div className="ccc-pillar-label" style={{ color }}>
              {label}
            </div>
            <div className="ccc-pillar-headline">{headline}</div>
            <ul className="ccc-pillar-items">
              {items.map((item) => (
                <li key={item} className="ccc-pillar-item">
                  <CheckCircle2
                    size={14}
                    style={{ color, flexShrink: 0 }}
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
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
    <div className="slide slide-content">
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
        className="roi-footer"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Target
          size={18}
          style={{ color: "var(--mi-copper)", flexShrink: 0 }}
        />
        <span>
          The wedge is operational relief. The investor story is direct revenue
          recovery and better monetization of demand practices already paid to
          generate.
        </span>
      </motion.div>
    </div>
  );
}

// ─── Slide 7: Market ──────────────────────────────────────────────────────────

function SlideMarket() {
  const sectors = [
    { icon: <Eye size={20} />, name: "Ophthalmology", tam: "$71.2B", w: 100 },
    { icon: <SparklesIcon size={20} />, name: "Plastic Surgery", tam: "$50.4B", w: 71 },
    { icon: <Smile size={20} />, name: "Orthodontics", tam: "$32.2B", w: 45 },
    { icon: <SparklesIcon size={20} />, name: "Medical Spas", tam: "$16.5B", w: 23 },
    { icon: <Baby size={20} />, name: "Fertility / IVF", tam: "$12.1B", w: 17 },
    { icon: <Brain size={20} />, name: "Psychiatry", tam: "$9.8B", w: 14 },
  ];

  return (
    <div className="slide slide-content">
      <SlideHeader
        eyebrow="Market Opportunity"
        title="$150B+ TAM in high-intent, elective healthcare."
      />
      <div className="market-grid">
        <motion.div
          className="market-left"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          {sectors.map(({ icon, name, tam, w }) => (
            <motion.div key={name} variants={fadeUp} className="market-row">
              <div className="market-sector-name">
                <span className="market-icon">{icon}</span>
                <span>{name}</span>
              </div>
              <div className="market-bar-wrap">
                <div className="market-bar-bg">
                  <motion.div
                    className="market-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${w}%` }}
                    transition={{ delay: 0.3, duration: 0.7, ease: "easeOut" }}
                  />
                </div>
                <span className="market-tam">{tam}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="market-right"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="market-thesis-card">
            <div className="market-thesis-label">Why these categories</div>
            <div className="market-thesis-items">
              {[
                {
                  icon: <Target size={20} />,
                  text: "Patient choice drives conversion — speed wins",
                },
                {
                  icon: <DollarSign size={20} />,
                  text: "High transaction values ($2K–$25K per procedure)",
                },
                {
                  icon: <Activity size={20} />,
                  text: "Meaningful revenue lift from even 5% conversion gains",
                },
                {
                  icon: <Shield size={20} />,
                  text: "Not a fit for ER, urgent care, or low-LTV primary care",
                },
              ].map(({ icon, text }) => (
                <div key={text} className="market-thesis-item">
                  <div className="market-thesis-icon">{icon}</div>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
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
    <div className="slide slide-content">
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

function SlideMoats() {
  const moats = [
    {
      icon: <Activity size={30} />,
      title: "Closed-loop Revenue Attribution",
      text: "Connects first contact → response → booking → procedure → payment.",
      color: "#5fcf8a",
    },
    {
      icon: <Brain size={30} />,
      title: "Patient Intent Graph",
      text: "Models sentiment, urgency, timing, and readiness to convert.",
      color: "var(--mi-copper)",
    },
    {
      icon: <Stethoscope size={30} />,
      title: "Procedure-Aware Models",
      text: "Specialty-specific objection handling, prep flows, and follow-up logic.",
      color: "#a78bfa",
    },
    {
      icon: <Shield size={30} />,
      title: "Dynamic Trust & Friction",
      text: "Adapts verification to risk, context, and patient intent.",
      color: "#38bdf8",
    },
    {
      icon: <Database size={30} />,
      title: "Practice Operating Memory",
      text: "Captures the language, handoffs, and behaviors that convert for each practice.",
      color: "#f59e0b",
    },
  ];

  return (
    <div className="slide slide-content">
      <SlideHeader
        eyebrow="Defensibility"
        title="The path to $1B is owning the patient conversion layer."
      />
      <div className="moats-layout">
        <motion.div
          className="moats-grid"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          {moats.map(({ icon, title, text, color }) => (
            <motion.div key={title} variants={fadeUp} className="moat-card">
              <div className="moat-icon" style={{ color }}>
                {icon}
              </div>
              <div className="moat-title">{title}</div>
              <div className="moat-text">{text}</div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="moats-logic"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className="moats-logic-title">Billion-dollar logic</div>
          <div className="moats-logic-steps">
            {[
              {
                step: "Land",
                desc: "Obvious ROI: recover missed demand + reduce staff burden",
              },
              {
                step: "Expand",
                desc: "Conversion intelligence + revenue attribution across the practice",
              },
              {
                step: "Defend",
                desc: "Practice-specific memory that becomes impossible to replicate",
              },
            ].map(({ step, desc }) => (
              <div key={step} className="moats-logic-step">
                <div className="moats-logic-step-label">{step}</div>
                <div className="moats-logic-step-desc">{desc}</div>
              </div>
            ))}
          </div>
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
      headline: "Own the workflow",
      text: "Intake, insurance, scheduling, billing, recalls — orchestrated by May I across the full patient journey.",
      color: "#a78bfa",
    },
    {
      num: "03",
      phase: "Future",
      icon: <Rocket size={32} />,
      headline: "Intelligent operating layer",
      text: "Revenue attribution, intent intelligence, and practice memory — May I becomes indispensable infrastructure.",
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
          From front-desk automation to the intelligent operating layer for
          retail healthcare.
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


