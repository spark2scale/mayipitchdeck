import { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generatePatientData } from "./generatePatientData";
import PatientDataCard from "./PatientDataCard";
import AuthorizationForm from "./AuthorizationForm";
import DemoAIPanel from "./DemoAIPanel";
import { useDemoLoop } from "./useDemoLoop";
import { EXPORT_FORM_VALUES, EXPORT_LOG_TEXT } from "./exportDemoState";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

interface SlideDemoProps {
  isExportMode?: boolean;
}

export default function SlideDemo({ isExportMode = false }: SlideDemoProps) {
  if (isExportMode) {
    return <ExportSlideDemo />;
  }

  return <InteractiveSlideDemo />;
}

function InteractiveSlideDemo() {
  const demoAreaRef = useRef<HTMLDivElement>(null);

  // Patient data — regenerated on each refresh
  const [patientData, setPatientData] = useState(() => generatePatientData());

  const [state, actions] = useDemoLoop(demoAreaRef, patientData);

  const handleRefresh = useCallback(() => {
    setPatientData(generatePatientData());
    actions.refresh();
  }, [actions]);

  const handleNext = useCallback(() => {
    // The AI will click this button programmatically; also allow manual click
    // useDemoLoop handles page transition internally when AI clicks it,
    // but we expose this for manual navigation during the demo.
  }, []);

  return (
    <div className="slide demo-slide">
      {/* Slide header */}
      <motion.div
        className="demo-slide-header"
        variants={fadeUp}
        initial="hidden"
        animate="show"
      >
        <div className="eyebrow-tag">Live Demo</div>
        <h2 className="slide-title demo-slide-title">
          AI Agentic Computer Use
          <span className="demo-slide-subtitle"> — Insurance Prior-Authorization Workflow</span>
        </h2>
      </motion.div>

      {/* Main demo area */}
      <div className="demo-main">
        {/* Left: demo pages (captured by html2canvas) */}
        <div className="demo-area-wrap" ref={demoAreaRef}>
          <AnimatePresence mode="wait">
            {state.demoPage === "data" ? (
              <motion.div
                key="data-page"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35 }}
                className="demo-page"
              >
                <PatientDataCard
                  data={patientData}
                  onNext={() => {
                    /* manual click forwarded; AI-driven click handled in loop  */
                    handleNext();
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                key="form-page"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.35 }}
                className="demo-page"
              >
                <AuthorizationForm
                  values={state.formValues}
                  activeField={state.activeField}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cursor ripple overlay */}
          {state.cursorRipples.map((ripple) => (
            <div
              key={ripple.id}
              className="demo-cursor-ripple"
              style={{
                left: `${ripple.x}%`,
                top: `${ripple.y}%`,
              }}
            />
          ))}
        </div>

        {/* Right: AI panel */}
        <div className="demo-panel-wrap">
          <DemoAIPanel
            status={state.status}
            logs={state.logs}
            onStart={actions.startDemo}
            onRefresh={handleRefresh}
          />
        </div>
      </div>
    </div>
  );
}

function ExportSlideDemo() {
  const exportLogs = EXPORT_LOG_TEXT.map((text, index) => ({
    id: index,
    time: "",
    text,
  }));

  return (
    <div className="slide demo-slide demo-slide-export">
      <div className="demo-slide-header">
        <div className="eyebrow-tag">Live Demo</div>
        <h2 className="slide-title demo-slide-title">
          AI Agentic Computer Use
          <span className="demo-slide-subtitle"> — Insurance Prior-Authorization Workflow</span>
        </h2>
      </div>

      <div className="demo-main">
        <div className="demo-area-wrap">
          <div className="demo-page demo-page-export">
            <AuthorizationForm values={EXPORT_FORM_VALUES} activeField={null} />
          </div>
        </div>

        <div className="demo-panel-wrap">
          <DemoAIPanel
            status="done"
            logs={exportLogs}
            onStart={() => {}}
            onRefresh={() => {}}
            staticMode
          />
        </div>
      </div>
    </div>
  );
}
