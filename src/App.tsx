import type { ComponentType, ReactNode, SVGProps } from "react";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0 },
};

const investorQuestions = [
  "What is May I building?",
  "Why does it matter?",
  "Why can this become a billion-dollar business?",
];

const problemCards = [
  {
    icon: PhoneCall,
    title: "Missed demand",
    text: "High-intent patients call after hours, hit voicemail, and book elsewhere.",
  },
  {
    icon: Clock3,
    title: "Slow speed-to-lead",
    text: "Delayed callbacks create invisible revenue loss in categories where each procedure matters.",
  },
  {
    icon: LayoutPanelTop,
    title: "Fragmented workflows",
    text: "Calls, texts, intake, payer work, and scheduling live across disconnected systems.",
  },
  {
    icon: FileHeart,
    title: "Manual patient experience",
    text: "Patients repeat themselves while staff re-enter the same data across multiple tools.",
  },
];

const enginePillars = [
  {
    step: "Capture",
    icon: MessageSquareText,
    title: "Always-on intake and lead capture",
    text: "Voice, text, web, social, referrals, OCR intake, and after-hours coverage in one front door.",
  },
  {
    step: "Connect",
    icon: Database,
    title: "CRM memory and workflow orchestration",
    text: "May I connects patient intent to CRM context, staff handoffs, payer workflows, and EMR/PMS actions.",
  },
  {
    step: "Convert",
    icon: BadgeDollarSign,
    title: "Appointments, procedures, and payments",
    text: "Scheduling, recalls, pre-auth, collections, and follow-up become part of one revenue loop.",
  },
];

const outcomes = [
  { value: "+$68K", label: "Revenue recovered per doctor / year" },
  { value: "-$45K", label: "Annual staff cost pressure reduced" },
  { value: "~35%", label: "Front-desk workload automated" },
  { value: "24/7", label: "Concierge coverage without turnover" },
];

const sectors = [
  "Plastic Surgery",
  "Ophthalmology",
  "Orthodontics",
  "Medical Spas",
  "Fertility / IVF",
  "Psychiatry",
  "Podiatry",
  "Weight Loss",
];

const moatCards = [
  {
    icon: CircleDollarSign,
    title: "Closed-loop revenue attribution",
    text: "Connects first contact, response latency, booking, procedure completion, and payment settlement.",
  },
  {
    icon: BrainCircuit,
    title: "Patient Intent Graph",
    text: "Models sentiment, urgency, timing, and readiness to convert across every interaction.",
  },
  {
    icon: Stethoscope,
    title: "Procedure-aware models",
    text: "Learns the operational nuances, objections, prep flows, and follow-up patterns of each specialty.",
  },
  {
    icon: ShieldCheck,
    title: "Dynamic trust and friction",
    text: "Balances conversion and security by adapting verification to risk, context, and intent.",
  },
  {
    icon: Activity,
    title: "Practice operating memory",
    text: "Captures the language, handoffs, and behaviors that convert for each individual practice.",
  },
];

const comparison = [
  {
    title: "Generic AI telephony",
    weakness: "Answers calls, but stops short of workflow execution and specialty-specific revenue logic.",
  },
  {
    title: "Answering services",
    weakness: "Add labor, delay follow-up, and rarely own the full conversion system.",
  },
  {
    title: "Patient engagement tools",
    weakness: "Often live downstream of the missed-call problem and lack real-time front-door capture.",
  },
  {
    title: "May I",
    weakness: "Unifies comms, CRM memory, workflow automation, and revenue outcomes into one operating layer.",
  },
];

const roadmap = [
  "Land with inbound call + text handling",
  "Expand into intake, scheduling, and insurance workflows",
  "Own recalls, collections, and payment realization",
  "Layer in revenue attribution, intent intelligence, and broader RCM automation",
];

type IconProps = SVGProps<SVGSVGElement>;

function SvgIcon({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

function Activity(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M3 12h4l2-5 4 10 2-5h6" />
    </SvgIcon>
  );
}
function ArrowRight(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </SvgIcon>
  );
}
function BadgeDollarSign(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M12 3 9 4 6 3 4 6 3 9l1 3-1 3 3 2 2 3 3-1 3 1 2-3 3-2-1-3 1-3-2-3-3-1-3-1Z" />
      <path d="M12 8v8" />
      <path d="M15 10.5c0-1.1-1.3-2-3-2s-3 .9-3 2 1 1.5 3 2 3 .9 3 2-1.3 2-3 2-3-.9-3-2" />
    </SvgIcon>
  );
}
function BrainCircuit(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M10 4a3 3 0 0 0-6 1v1a3 3 0 0 0 1 5v1a3 3 0 0 0 5 2" />
      <path d="M14 4a3 3 0 0 1 6 1v1a3 3 0 0 1-1 5v1a3 3 0 0 1-5 2" />
      <path d="M12 6v12" />
      <path d="M9 10h3" />
      <path d="M12 14h3" />
      <circle cx="9" cy="10" r="1" />
      <circle cx="15" cy="14" r="1" />
    </SvgIcon>
  );
}
function CalendarDays(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
      <path d="M8 14h.01M12 14h.01M16 14h.01" />
    </SvgIcon>
  );
}
function ChartNoAxesCombined(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="m7 14 3-3 3 2 4-5" />
    </SvgIcon>
  );
}
function Check(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="m5 12 4 4L19 6" />
    </SvgIcon>
  );
}
function ChevronRight(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="m9 6 6 6-6 6" />
    </SvgIcon>
  );
}
function CircleDollarSign(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10" />
      <path d="M15 9.5c0-1.1-1.3-2-3-2s-3 .9-3 2 1 1.5 3 2 3 .9 3 2-1.3 2-3 2-3-.9-3-2" />
    </SvgIcon>
  );
}
function Clock3(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l4 2" />
    </SvgIcon>
  );
}
function Database(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
      <path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
    </SvgIcon>
  );
}
function FileHeart(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v5h5" />
      <path d="M12 18s-3-1.8-3-4.2A1.8 1.8 0 0 1 12 12a1.8 1.8 0 0 1 3 1.8C15 16.2 12 18 12 18Z" />
    </SvgIcon>
  );
}
function HeartHandshake(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M8 12 5.5 9.5A3 3 0 0 1 9.7 5.3L12 7.6l2.3-2.3a3 3 0 1 1 4.2 4.2L16 12" />
      <path d="m7 14 2-2 2 2 2-2 4 4" />
      <path d="M5 16l3 3M16 13l3 3" />
    </SvgIcon>
  );
}
function LayoutPanelTop(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18" />
    </SvgIcon>
  );
}
function MessageSquareText(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M4 5h16v11H8l-4 3Z" />
      <path d="M8 9h8M8 12h6" />
    </SvgIcon>
  );
}
function PhoneCall(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 11.2 19 19.3 19.3 0 0 1 5 12.8 19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7l.4 2.6a2 2 0 0 1-.6 1.7l-1.8 1.8a16 16 0 0 0 7 7l1.8-1.8a2 2 0 0 1 1.7-.6l2.6.4A2 2 0 0 1 22 16.9Z" />
      <path d="M15 4a5 5 0 0 1 5 5" />
      <path d="M15 1a8 8 0 0 1 8 8" />
    </SvgIcon>
  );
}
function ShieldCheck(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="m12 3 7 3v5c0 5-3.2 8.7-7 10-3.8-1.3-7-5-7-10V6Z" />
      <path d="m9 12 2 2 4-4" />
    </SvgIcon>
  );
}
function Sparkles(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6Z" />
      <path d="m5 18 .8 2.2L8 21l-2.2.8L5 24l-.8-2.2L2 21l2.2-.8Z" />
      <path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z" />
    </SvgIcon>
  );
}
function Stethoscope(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M6 3v6a4 4 0 1 0 8 0V3" />
      <path d="M10 17a6 6 0 0 0 12 0v-1" />
      <circle cx="19" cy="14" r="2" />
    </SvgIcon>
  );
}
function Wallet(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M3 7h15a3 3 0 0 1 3 3v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
      <path d="M3 7V6a2 2 0 0 1 2-2h12" />
      <path d="M16 13h3" />
    </SvgIcon>
  );
}

function App() {
  return (
    <div className="relative overflow-x-hidden bg-[var(--mi-bg)] text-[var(--mi-text)]">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-[-260px] h-[560px] w-[980px] -translate-x-1/2 bg-gradient-to-b from-[var(--mi-primary)]/20 to-transparent blur-3xl" />
        <div className="absolute right-[-180px] top-[140px] h-[420px] w-[420px] bg-[var(--mi-surface)]/40 blur-3xl" />
      </div>

      <Header />

      <main>
        <section id="top" className="mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 lg:px-8 lg:pt-20">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <motion.div
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.08 } } }}
              className="max-w-3xl"
            >
              <motion.div variants={fadeUp} className="mb-5 inline-flex items-center gap-2 border border-[color:var(--mi-border)] bg-[var(--mi-surface)]/45 px-3 py-2 text-xs uppercase tracking-[0.22em] text-[var(--mi-muted)] backdrop-blur">
                Investor Deck Website
              </motion.div>
              <motion.h1 variants={fadeUp} className="text-5xl font-semibold leading-[0.94] tracking-tight sm:text-6xl lg:text-7xl">
                The AI revenue integrity engine for retail healthcare.
              </motion.h1>
              <motion.p variants={fadeUp} className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--mi-muted)] sm:text-xl">
                May I captures, qualifies, schedules, nurtures, and monetizes every high-intent
                patient inquiry for specialty practices where missed calls mean lost procedures.
              </motion.p>
              <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#engine"
                  className="inline-flex items-center justify-center bg-[var(--mi-primary)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--mi-primary2)]"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 20% 30%, rgba(255, 215, 100, 0.25) 0%, transparent 35%), radial-gradient(circle at 75% 60%, rgba(255, 215, 100, 0.18) 0%, transparent 30%), linear-gradient(135deg, #906323, #7A531D)",
                  }}
                >
                  See the system <ArrowRight className="ml-2 h-4 w-4" />
                </a>
                <a
                  href="#moats"
                  className="inline-flex items-center justify-center border border-[color:var(--mi-border)] bg-[var(--mi-surface)]/30 px-6 py-3 text-sm font-medium text-[var(--mi-text)] backdrop-blur transition hover:bg-[var(--mi-border)]/25"
                >
                  Why this can scale
                </a>
              </motion.div>
              <motion.div variants={fadeUp} className="mt-10 grid gap-3 sm:grid-cols-3">
                {investorQuestions.map((question) => (
                  <div
                    key={question}
                    className="border border-[color:var(--mi-border)] bg-[var(--mi-surface)]/35 p-4 text-sm text-[var(--mi-muted)] backdrop-blur"
                  >
                    {question}
                  </div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="relative"
            >
              <div className="border border-[color:var(--mi-border)] bg-[var(--mi-surface)]/45 p-6 shadow-2xl backdrop-blur">
                <div className="flex items-center justify-between border-b border-[color:var(--mi-border)] pb-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-[var(--mi-muted)]">
                      Revenue Integrity Engine
                    </div>
                    <div className="mt-2 text-2xl font-semibold">
                      Capture {"->"} Connect {"->"} Convert
                    </div>
                  </div>
                  <Sparkles className="h-8 w-8 text-[var(--mi-copper)]" />
                </div>

                <div className="mt-5 space-y-4">
                  <FlowRow title="Inbound demand" value="Call, text, web, social, referrals" />
                  <FlowRow title="AI comms layer" value="Instant response, intake, qualification" />
                  <FlowRow title="CRM memory" value="Intent, history, sentiment, handoff context" />
                  <FlowRow title="Workflow execution" value="Scheduling, pre-auth, recalls, payment prompts" />
                  <FlowRow title="Revenue outcome" value="Booked consults, procedures, collections" strong />
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <SignalCard
                    icon={ChartNoAxesCombined}
                    title="System of engagement"
                    text="Owns the patient conversion layer while the EMR remains the system of record."
                  />
                  <SignalCard
                    icon={HeartHandshake}
                    title="White-glove experience"
                    text="Personalized, premium interactions that preserve the practice brand."
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <SectionShell
          id="problem"
          eyebrow="Why It Matters"
          title="The patient experience is still stuck in the 70s."
          intro="Practices invest to generate demand, then lose it through voicemail, delays, disconnected workflows, and repetitive front-desk work."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {problemCards.map(({ icon: Icon, title, text }) => (
              <GlassCard key={title}>
                <Icon className="h-8 w-8 text-[var(--mi-copper)]" />
                <h3 className="mt-5 text-xl font-semibold">{title}</h3>
                <p className="mt-3 text-[var(--mi-muted)]">{text}</p>
              </GlassCard>
            ))}
          </div>
        </SectionShell>

        <SectionShell
          id="loss"
          eyebrow="Invisible Loss"
          title="The leak practices feel in revenue, but cannot see in workflow."
          intro="For high-intent, elective healthcare, every delayed response can mean losing a $5,000+ procedure before a staff member ever gets a second chance."
        >
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <GlassCard className="p-8">
              <div className="grid gap-4 sm:grid-cols-4">
                <LeakStage title="Marketing spend" text="Demand enters the funnel." />
                <LeakStage title="Missed call" text="Voicemail captures nothing." />
                <LeakStage title="Slow follow-up" text="Intent cools off fast." />
                <LeakStage title="Lost procedure" text="Revenue goes to competitors." />
              </div>
            </GlassCard>
            <GlassCard className="p-8">
              <div className="text-sm uppercase tracking-[0.18em] text-[var(--mi-muted)]">Commercial framing</div>
              <h3 className="mt-4 text-3xl font-semibold">Loss aversion first. Growth second.</h3>
              <p className="mt-4 text-lg leading-relaxed text-[var(--mi-muted)]">
                May I is best positioned as a revenue integrity engine, not a cost-cutting utility.
                The hook is invisible loss. The long-term value is revenue growth through a better,
                faster, more personalized patient journey.
              </p>
            </GlassCard>
          </div>
        </SectionShell>

        <SectionShell
          id="engine"
          eyebrow="What May I Is Building"
          title="More than an AI receptionist."
          intro="May I is building the system of engagement across patients, practices, payors, and providers by combining communications, CRM memory, and workflow automation."
        >
          <div className="grid gap-5 lg:grid-cols-3">
            {enginePillars.map(({ step, icon: Icon, title, text }) => (
              <GlassCard key={step} className="p-8">
                <div className="flex items-center justify-between">
                  <div className="text-sm uppercase tracking-[0.18em] text-[var(--mi-muted)]">{step}</div>
                  <Icon className="h-7 w-7 text-[var(--mi-copper)]" />
                </div>
                <h3 className="mt-5 text-2xl font-semibold">{title}</h3>
                <p className="mt-4 text-[var(--mi-muted)]">{text}</p>
              </GlassCard>
            ))}
          </div>

          <div className="mt-6 grid gap-4 border border-[color:var(--mi-border)] bg-[var(--mi-surface)]/30 p-6 backdrop-blur lg:grid-cols-[0.8fr_1.4fr_0.8fr]">
            <SystemColumn
              title="Inputs"
              items={["Calls", "Texts", "Web chat", "Social leads", "Referrals", "OCR intake"]}
            />
            <SystemCore />
            <SystemColumn
              title="Outcomes"
              items={["Booked consults", "Pre-auth progress", "Recalls", "Collections", "Lifecycle outreach", "Revenue attribution"]}
            />
          </div>
        </SectionShell>

        <SectionShell
          id="roi"
          eyebrow="Business Impact"
          title="Built to increase revenue, not just reduce overhead."
          intro="The wedge is operational relief, but the investor story is direct revenue recovery and better monetization of demand practices already paid to generate."
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {outcomes.map(({ value, label }) => (
              <GlassCard key={label} className="p-7">
                <div className="text-4xl font-semibold tracking-tight text-[var(--mi-primary)]">{value}</div>
                <div className="mt-3 max-w-[14rem] text-sm leading-relaxed text-[var(--mi-muted)]">
                  {label}
                </div>
              </GlassCard>
            ))}
          </div>
        </SectionShell>

        <SectionShell
          id="market"
          eyebrow="Ideal Customer + Market"
          title="Built for high-intent, elective healthcare."
          intro="The right customers are specialty and retail healthcare practices where patient choice is high, transaction values are meaningful, and speed-to-lead directly affects conversion."
        >
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <GlassCard className="p-8">
              <div className="text-sm uppercase tracking-[0.18em] text-[var(--mi-muted)]">Target sectors</div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {sectors.map((sector) => (
                  <div
                    key={sector}
                    className="border border-[color:var(--mi-border)] bg-[var(--mi-border)]/18 px-4 py-3 text-sm font-medium text-[var(--mi-text)]"
                  >
                    {sector}
                  </div>
                ))}
              </div>
              <p className="mt-5 text-sm leading-relaxed text-[var(--mi-muted)]">
                Not a fit for commodity care settings like ER, urgent care, or low-LTV primary care
                workflows.
              </p>
            </GlassCard>
            <GlassCard className="p-8">
              <div className="text-sm uppercase tracking-[0.18em] text-[var(--mi-muted)]">Market thesis</div>
              <h3 className="mt-4 text-3xl font-semibold">Retail healthcare categories represent ~$150B+ of TAM.</h3>
              <p className="mt-4 text-lg leading-relaxed text-[var(--mi-muted)]">
                Categories like ophthalmology, plastic surgery, orthodontics, and medical aesthetics
                combine large practice counts with high transaction value. That makes revenue
                integrity, conversion lift, and patient experience economically meaningful.
              </p>
              <div className="mt-6 space-y-4">
                <Bar label="Ophthalmology" value="71.2B" width="w-full" />
                <Bar label="Plastic Surgery" value="50.4B" width="w-10/12" />
                <Bar label="Orthodontics" value="32.2B" width="w-7/12" />
                <Bar label="Medical Spas" value="16.5B" width="w-4/12" />
              </div>
            </GlassCard>
          </div>
        </SectionShell>

        <SectionShell
          id="comparison"
          eyebrow="Why May I Wins"
          title="Generic AI answers calls. May I drives outcomes."
          intro="The difference is not voice quality alone. It is whether the system owns patient intent, executes workflows, and ties behavior to actual revenue results."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            {comparison.map((item, index) => (
              <GlassCard key={item.title} className={`p-7 ${index === 3 ? "ring-1 ring-[var(--mi-primary)]" : ""}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  {index === 3 ? <Check className="h-5 w-5 text-[var(--mi-copper)]" /> : <ChevronRight className="h-5 w-5 text-[var(--mi-muted)]" />}
                </div>
                <p className="mt-4 text-[var(--mi-muted)]">{item.weakness}</p>
              </GlassCard>
            ))}
          </div>
        </SectionShell>

        <SectionShell
          id="moats"
          eyebrow="Why This Can Be Very Large"
          title="The path to a billion-dollar business is owning the patient conversion layer."
          intro="May I can become large because it sits where demand, workflow, and revenue meet. Over time, that creates both data moats and platform expansion."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {moatCards.map(({ icon: Icon, title, text }) => (
              <GlassCard key={title}>
                <Icon className="h-8 w-8 text-[var(--mi-copper)]" />
                <h3 className="mt-5 text-xl font-semibold">{title}</h3>
                <p className="mt-3 text-[var(--mi-muted)]">{text}</p>
              </GlassCard>
            ))}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.95fr]">
            <GlassCard className="p-8">
              <div className="text-sm uppercase tracking-[0.18em] text-[var(--mi-muted)]">Expansion story</div>
              <div className="mt-5 grid gap-4">
                {roadmap.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-[var(--mi-primary)]" />
                    <p className="text-[var(--mi-muted)]">{item}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
            <GlassCard className="p-8">
              <div className="text-sm uppercase tracking-[0.18em] text-[var(--mi-muted)]">Billion-dollar logic</div>
              <h3 className="mt-4 text-3xl font-semibold">Land with ROI. Expand with intelligence. Defend with memory.</h3>
              <p className="mt-4 text-lg leading-relaxed text-[var(--mi-muted)]">
                The platform starts with obvious ROI around missed demand and staff burden. It grows
                into a system that practices depend on for conversion intelligence, revenue attribution,
                and practice-specific operating memory. That is how May I moves from wedge to
                operating layer.
              </p>
            </GlassCard>
          </div>
        </SectionShell>

        <section id="vision" className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          <div className="border border-[color:var(--mi-border)] bg-[linear-gradient(180deg,rgba(0,51,32,0.56),rgba(0,24,16,0.9))] p-8 shadow-xl backdrop-blur md:p-12">
            <div className="grid gap-10 lg:grid-cols-3">
              <VisionColumn
                title="Today"
                text="Multiple staff coordinate repetitive workflows between patients, payors, and providers. Growth means hiring more front-office labor."
              />
              <VisionColumn
                title="Tomorrow"
                text="May I orchestrates repetitive workflows across voice, text, intake, scheduling, pre-auth, and payments while preserving the human touch for high-value moments."
              />
              <VisionColumn
                title="Future"
                text="May I becomes the intelligent operating layer for patient conversion, revenue realization, and personalized care journeys across retail healthcare."
              />
            </div>

            <div className="mt-12 border-t border-[color:var(--mi-border)] pt-8">
              <div className="max-w-4xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                Capture every inquiry. Convert more patients. Compound revenue intelligence.
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Header() {
  const navItems = [
    ["Problem", "#problem"],
    ["Engine", "#engine"],
    ["ROI", "#roi"],
    ["Market", "#market"],
    ["Moats", "#moats"],
    ["Vision", "#vision"],
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--mi-border)] bg-[var(--mi-surface)]/70 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <a href="#top" className="flex items-center gap-3">
          <img src="/MayILogoTransparentBack.gif" alt="May I logo" className="h-10 w-10 object-cover" />
          <div className="leading-tight">
            <div className="text-sm font-semibold">May I</div>
            <div className="text-xs text-[var(--mi-muted)]">Investor Pitch Website</div>
          </div>
        </a>

        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map(([label, href]) => (
            <a key={label} href={href} className="text-sm text-[var(--mi-muted)] transition hover:text-[var(--mi-text)]">
              {label}
            </a>
          ))}
        </nav>

        <a
          href="https://www.mayiguide.com"
          className="inline-flex items-center justify-center bg-[var(--mi-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--mi-primary2)]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, rgba(255, 215, 100, 0.25) 0%, transparent 35%), radial-gradient(circle at 75% 60%, rgba(255, 215, 100, 0.18) 0%, transparent 30%), linear-gradient(135deg, #906323, #7A531D)",
          }}
        >
          Live site
        </a>
      </div>
    </header>
  );
}

function SectionShell({
  id,
  eyebrow,
  title,
  intro,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        variants={{ show: { transition: { staggerChildren: 0.06 } } }}
      >
        <motion.div variants={fadeUp} className="text-sm uppercase tracking-[0.22em] text-[var(--mi-muted)]">
          {eyebrow}
        </motion.div>
        <motion.h2 variants={fadeUp} className="mt-4 max-w-4xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          {title}
        </motion.h2>
        <motion.p variants={fadeUp} className="mt-5 max-w-3xl text-lg leading-relaxed text-[var(--mi-muted)]">
          {intro}
        </motion.p>
        <motion.div variants={fadeUp} className="mt-10">
          {children}
        </motion.div>
      </motion.div>
    </section>
  );
}

function GlassCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`border border-[color:var(--mi-border)] bg-[var(--mi-surface)]/42 p-6 shadow-lg backdrop-blur ${className}`}>
      {children}
    </div>
  );
}

function FlowRow({
  title,
  value,
  strong = false,
}: {
  title: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border border-[color:var(--mi-border)] bg-[var(--mi-border)]/18 p-3">
      <div className="text-sm text-[var(--mi-muted)]">{title}</div>
      <div className={`text-right text-sm ${strong ? "font-semibold text-[var(--mi-text)]" : "text-[var(--mi-text)]"}`}>
        {value}
      </div>
    </div>
  );
}

function SignalCard({
  icon: Icon,
  title,
  text,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  text: string;
}) {
  return (
    <div className="border border-[color:var(--mi-border)] bg-[var(--mi-border)]/18 p-4">
      <Icon className="h-6 w-6 text-[var(--mi-copper)]" />
      <div className="mt-3 text-sm font-semibold">{title}</div>
      <div className="mt-2 text-sm text-[var(--mi-muted)]">{text}</div>
    </div>
  );
}

function LeakStage({ title, text }: { title: string; text: string }) {
  return (
    <div className="relative border border-[color:var(--mi-border)] bg-[var(--mi-border)]/15 p-4">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-2 text-sm text-[var(--mi-muted)]">{text}</div>
      <div className="mt-4 flex items-center gap-2 text-xs text-[var(--mi-primary)]">
        <ArrowRight className="h-3.5 w-3.5" />
        Revenue pressure compounds
      </div>
    </div>
  );
}

function SystemColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="text-sm uppercase tracking-[0.18em] text-[var(--mi-muted)]">{title}</div>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item} className="border border-[color:var(--mi-border)] bg-[var(--mi-border)]/18 px-4 py-3 text-sm">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function SystemCore() {
  const coreItems = [
    { icon: PhoneCall, label: "Agentic voice + text" },
    { icon: Database, label: "CRM as memory layer" },
    { icon: CalendarDays, label: "Workflow execution" },
    { icon: Wallet, label: "Revenue realization" },
  ];

  return (
    <div className="border border-[color:var(--mi-primary)] bg-[linear-gradient(180deg,rgba(144,99,35,0.16),rgba(0,51,32,0.18))] p-6">
      <div className="text-sm uppercase tracking-[0.18em] text-[var(--mi-muted)]">May I engine</div>
      <h3 className="mt-4 text-3xl font-semibold">AI comms + CRM + workflow automation</h3>
      <p className="mt-3 max-w-2xl text-[var(--mi-muted)]">
        The product becomes the system of engagement by hosting conversation history, intent,
        orchestration logic, and the actions that move patients from inquiry to revenue.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {coreItems.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-3 border border-[color:var(--mi-border)] bg-[var(--mi-border)]/18 px-4 py-3 text-sm">
            <Icon className="h-5 w-5 text-[var(--mi-copper)]" />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

function Bar({
  label,
  value,
  width,
}: {
  label: string;
  value: string;
  width: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="text-[var(--mi-muted)]">${value}</span>
      </div>
      <div className="h-3 bg-[var(--mi-border)]/20">
        <div className={`h-3 ${width}`} style={{ backgroundImage: "linear-gradient(90deg, #906323, #c49247)" }} />
      </div>
    </div>
  );
}

function VisionColumn({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <div className="text-sm uppercase tracking-[0.18em] text-[var(--mi-muted)]">{title}</div>
      <p className="mt-4 text-lg leading-relaxed text-[var(--mi-text)]/90">{text}</p>
    </div>
  );
}

export default App;
