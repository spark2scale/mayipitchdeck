import { useCallback, useRef, useState } from "react";
import html2canvas from "html2canvas";
import type { PatientData } from "./generatePatientData";
import type { FormValues } from "./AuthorizationForm";
import type { DemoStatus, LogEntry } from "./DemoAIPanel";

// ─── Types from the backend API ───────────────────────────────────────────────

interface ComputerAction {
  type: "screenshot" | "click" | "double_click" | "type" | "scroll" | "keypress" | "move" | "drag" | "wait";
  x?: number;
  y?: number;
  button?: string;
  text?: string;
  keys?: string[];
  scrollX?: number;
  scrollY?: number;
}

interface ApiResponse {
  callId: string;
  responseId: string;
  actions: ComputerAction[];
  logs: string[];
  done: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CAPTURE_WIDTH = 1440;
const CAPTURE_HEIGHT = 900;
const TYPE_DELAY_MS = 40; // delay between each character

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface CursorRipple {
  id: number;
  x: number;  // percent within demo area (0–100)
  y: number;
}

export interface DemoLoopState {
  status: DemoStatus;
  logs: LogEntry[];
  demoPage: "data" | "form";
  formValues: FormValues;
  activeField: keyof PatientData | null;
  cursorRipples: CursorRipple[];
}

export interface DemoLoopActions {
  startDemo: () => Promise<void>;
  refresh: () => void;
}

export function useDemoLoop(
  demoAreaRef: React.RefObject<HTMLElement | null>,
  _patientData: PatientData
): [DemoLoopState, DemoLoopActions] {
  const [status, setStatus] = useState<DemoStatus>("idle");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [demoPage, setDemoPage] = useState<"data" | "form">("data");
  const [formValues, setFormValues] = useState<FormValues>({});
  const [activeField, setActiveField] = useState<keyof PatientData | null>(null);
  const [cursorRipples, setCursorRipples] = useState<CursorRipple[]>([]);

  const logSeq = useRef(0);
  const rippleSeq = useRef(0);
  // Store current demoPage in a ref so async callbacks always read the latest value
  const demoPageRef = useRef<"data" | "form">("data");

  // ── Helpers ────────────────────────────────────────────────────────────────

  const addLogs = useCallback((entries: string[]) => {
    const now = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setLogs((prev) => [
      ...prev,
      ...entries.map((text) => ({ id: logSeq.current++, time: now, text })),
    ]);
  }, []);

  /** Capture the demo area and normalise it to CAPTURE_WIDTH x CAPTURE_HEIGHT. */
  const captureScreenshot = useCallback(async (): Promise<string> => {
    const el = demoAreaRef.current;
    if (!el) throw new Error("Demo area ref not set");

    addLogs(["📸 Capturing screenshot of current screen"]);

    const canvas = await html2canvas(el as HTMLElement, {
      scale: 1,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#001810",
      logging: false,
    });

    // Normalise to fixed 1440×900 for consistent AI coordinate space
    const out = document.createElement("canvas");
    out.width = CAPTURE_WIDTH;
    out.height = CAPTURE_HEIGHT;
    const ctx = out.getContext("2d")!;
    ctx.drawImage(canvas, 0, 0, CAPTURE_WIDTH, CAPTURE_HEIGHT);

    return out.toDataURL("image/png").replace(/^data:image\/png;base64,/, "");
  }, [demoAreaRef, addLogs]);

  /** Show an animated ripple at (xPct, yPct) percent coordinates within demo area. */
  const showRipple = useCallback((xPct: number, yPct: number) => {
    const id = rippleSeq.current++;
    setCursorRipples((prev) => [...prev, { id, x: xPct, y: yPct }]);
    setTimeout(() => {
      setCursorRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
  }, []);

  /**
   * Map model coordinates (in 1440×900 space) to actual DOM coordinates
   * within the demo area element.
   */
  const mapCoords = useCallback(
    (mx: number, my: number): { domX: number; domY: number; pctX: number; pctY: number } => {
      const el = demoAreaRef.current;
      if (!el) return { domX: mx, domY: my, pctX: 50, pctY: 50 };
      const rect = el.getBoundingClientRect();
      const domX = rect.left + (mx / CAPTURE_WIDTH) * rect.width;
      const domY = rect.top + (my / CAPTURE_HEIGHT) * rect.height;
      const pctX = (mx / CAPTURE_WIDTH) * 100;
      const pctY = (my / CAPTURE_HEIGHT) * 100;
      return { domX, domY, pctX, pctY };
    },
    [demoAreaRef]
  );

  /** Animate typing a string into a target form field, one character at a time. */
  const animateType = useCallback(
    async (fieldKey: keyof PatientData, text: string): Promise<void> => {
      setActiveField(fieldKey);
      for (let i = 0; i <= text.length; i++) {
        const partial = text.slice(0, i);
        setFormValues((prev) => ({ ...prev, [fieldKey]: partial }));
        await new Promise((r) => setTimeout(r, TYPE_DELAY_MS));
      }
      setActiveField(null);
    },
    []
  );

  /**
   * Given a click at (domX, domY), figure out which form field (if any)
   * the AI is targeting, based on the element at that point and its data-field attribute.
   */
  const resolveFieldKey = useCallback(
    (domX: number, domY: number): keyof PatientData | null => {
      const el = document.elementFromPoint(domX, domY);
      if (!el) return null;
      const closest = el.closest("[data-field]") as HTMLElement | null;
      if (closest) {
        return (closest.dataset.field as keyof PatientData) ?? null;
      }
      return null;
    },
    []
  );

  /**
   * Execute a single batch of actions returned by the model. Returns whether
   * a screenshot was requested mid-batch (meaning we should re-send immediately).
   */
  const executeActions = useCallback(
    async (
      actions: ComputerAction[],
      currentCallId: string,
      currentResponseId: string
    ): Promise<{ callId: string; responseId: string; done: boolean }> => {
      let callId = currentCallId;
      let responseId = currentResponseId;
      let done = false;

      for (const action of actions) {
        switch (action.type) {
          case "screenshot": {
            // Take a screenshot now and continue the loop
            const b64 = await captureScreenshot();
            addLogs(["🔄 Sending screenshot back to AI for analysis"]);
            const resp = await fetch(`${API_BASE}/api/computer-use/continue`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ screenshot: b64, callId, responseId }),
            });
            if (!resp.ok) throw new Error(`API error: ${resp.status}`);
            const data: ApiResponse = await resp.json();
            addLogs(data.logs);
            callId = data.callId;
            responseId = data.responseId;
            done = data.done;
            if (!done && data.actions.length > 0) {
              const result = await executeActions(data.actions, callId, responseId);
              return result;
            }
            return { callId, responseId, done };
          }

          case "click":
          case "double_click": {
            const { domX, domY, pctX, pctY } = mapCoords(action.x ?? 0, action.y ?? 0);
            showRipple(pctX, pctY);

            // Check if this click targets the "Next Page" button
            const targetEl = document.elementFromPoint(domX, domY) as HTMLElement | null;
            if (targetEl) {
              const btn = targetEl.closest("#next-page-btn, [id='next-page-btn']") as HTMLElement | null;
              if (btn ?? targetEl.id === "next-page-btn") {
                addLogs(["🖱️ Clicking 'Next Page →' button"]);
                setDemoPage("form");
                demoPageRef.current = "form";
                await new Promise((r) => setTimeout(r, 800)); // wait for transition
              } else {
                // Log which field is being clicked
                const fieldKey = resolveFieldKey(domX, domY);
                if (fieldKey) {
                  addLogs([`🖱️ Clicking field: ${fieldKey}`]);
                } else {
                  addLogs([`🖱️ Clicking at (${Math.round(action.x ?? 0)}, ${Math.round(action.y ?? 0)})`]);
                  (targetEl as HTMLElement)?.click?.();
                }
              }
            }
            await new Promise((r) => setTimeout(r, 300));
            break;
          }

          case "type": {
            const text = action.text ?? "";
            // Find the currently active field by probing the last-clicked coords
            // Fallback: iterate form values to find the first empty field
            let target: keyof PatientData | null = activeField;
            if (!target) {
              // Try to find by active element
              const ae = document.activeElement as HTMLElement | null;
              if (ae?.dataset?.field) {
                target = ae.dataset.field as keyof PatientData;
              }
            }
            if (target) {
              addLogs([`⌨️ Typing "${text}" into ${target}`]);
              await animateType(target, text);
            } else {
              addLogs([`⌨️ Typing "${text}"`]);
            }
            break;
          }

          case "scroll": {
            const el = demoAreaRef.current;
            if (el) {
              el.scrollBy({ left: action.scrollX ?? 0, top: action.scrollY ?? 0, behavior: "smooth" });
            }
            addLogs(["🖱️ Scrolling page"]);
            await new Promise((r) => setTimeout(r, 400));
            break;
          }

          case "keypress": {
            (action.keys ?? []).forEach((key) => {
              const event = new KeyboardEvent("keydown", { key, bubbles: true });
              (document.activeElement ?? document.body).dispatchEvent(event);
            });
            break;
          }

          case "wait": {
            addLogs(["🕐 Waiting…"]);
            await new Promise((r) => setTimeout(r, 1500));
            break;
          }

          default:
            break;
        }
      }

      return { callId, responseId, done };
    },
    [
      captureScreenshot,
      addLogs,
      mapCoords,
      showRipple,
      resolveFieldKey,
      animateType,
      demoAreaRef,
      activeField,
    ]
  );

  // ── Main start function ───────────────────────────────────────────────────

  const startDemo = useCallback(async () => {
    if (status === "running") return;
    setStatus("running");
    addLogs(["🧠 AI agent initializing…"]);

    try {
      const b64 = await captureScreenshot();
      addLogs(["🔄 Sending initial screenshot to Azure OpenAI"]);

      const task = [
        "You are automating a healthcare prior-authorization workflow.",
        "STEP 1: You are viewing a Patient Data Card with patient demographics, insurance, clinical, and provider information.",
        "Take a screenshot and read ALL the information carefully.",
        "STEP 2: Click the button labeled 'Next Page →' at the bottom of the card.",
        "STEP 3: You are now on the Authorization Form. Fill in EVERY input field using the exact values from the Patient Data Card.",
        "Match each field precisely: firstName → First Name, lastName → Last Name, dob → Date of Birth, phone → Phone, address → Address, insurance → Insurance Carrier, memberId → Member ID, groupNumber → Group Number, diagnosisCode → Diagnosis Code, diagnosisDesc → Diagnosis Description, cptCode → CPT Code, procedureName → Procedure Name, providerName → Provider Name, providerNpi → Provider NPI.",
        "Click each field before typing into it. Type the exact value character by character.",
        "Do not skip any fields. Complete all 14 fields.",
      ].join(" ");

      const startResp = await fetch(`${API_BASE}/api/computer-use/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ screenshot: b64, task }),
      });
      if (!startResp.ok) throw new Error(`API error: ${startResp.status}`);

      const startData: ApiResponse = await startResp.json();
      addLogs(startData.logs);

      if (startData.done) {
        setStatus("done");
        addLogs(["✅ Workflow completed!"]);
        return;
      }

      // Main loop
      let callId = startData.callId;
      let responseId = startData.responseId;
      let actions = startData.actions;
      let done: boolean = startData.done;

      while (!done) {
        const result = await executeActions(actions, callId, responseId);
        callId = result.callId;
        responseId = result.responseId;
        done = result.done;

        if (done) break;

        // After executing actions, capture fresh screenshot and continue
        const freshB64 = await captureScreenshot();
        addLogs(["🔄 Sending updated screenshot to AI"]);

        const contResp = await fetch(`${API_BASE}/api/computer-use/continue`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ screenshot: freshB64, callId, responseId }),
        });
        if (!contResp.ok) throw new Error(`API error: ${contResp.status}`);

        const contData: ApiResponse = await contResp.json();
        addLogs(contData.logs);
        callId = contData.callId;
        responseId = contData.responseId;
        actions = contData.actions;
        done = contData.done;
      }

      addLogs(["✅ Prior-authorization workflow completed successfully!"]);
      setStatus("done");
    } catch (err) {
      console.error("[useDemoLoop]", err);
      addLogs([`❌ Error: ${err instanceof Error ? err.message : String(err)}`]);
      setStatus("error");
    }
  }, [status, captureScreenshot, addLogs, executeActions]);

  // ── Refresh ───────────────────────────────────────────────────────────────

  const refresh = useCallback(() => {
    setStatus("idle");
    setLogs([]);
    setDemoPage("data");
    demoPageRef.current = "data";
    setFormValues({});
    setActiveField(null);
    setCursorRipples([]);
  }, []);

  return [
    { status, logs, demoPage, formValues, activeField, cursorRipples },
    { startDemo, refresh },
  ];
}
