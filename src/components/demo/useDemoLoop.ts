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

type ToolMode = "ga" | "legacy";

interface ActionSpace {
  width: number;
  height: number;
}

interface ViewportMeta {
  cssWidth: number;
  cssHeight: number;
  devicePixelRatio: number;
  visualViewportScale: number;
  captureWidth: number;
  captureHeight: number;
}

interface ApiResponse {
  sessionId: string;
  callId: string;
  responseId: string;
  mode: ToolMode;
  actionSpace: ActionSpace;
  actions: ComputerAction[];
  logs: string[];
  done: boolean;
}

interface CaptureResult {
  b64: string;
  viewport: ViewportMeta;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_DELAY_MS = 40; // delay between each character
const DRIFT_SAME_POINT_DISTANCE_PX = 24;
const DRIFT_CLICK_STREAK_THRESHOLD = 2;
const MAX_TURNS = 3;
const MAX_RUNTIME_MS = 5 * 60 * 1000;

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface CursorRipple {
  id: number;
  x: number; // percent within demo area (0–100)
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

interface DriftTracker {
  missStreak: number;
  lastMiss: { x: number; y: number } | null;
  recoveryAttempts: number;
}

interface PendingRecovery {
  reason: "coordinate_drift";
  forceLegacy: boolean;
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
  const demoPageRef = useRef<"data" | "form">("data");
  const lastClickedFieldRef = useRef<keyof PatientData | null>(null);

  const sessionIdRef = useRef<string>("");
  const modeRef = useRef<ToolMode>("ga");
  const actionSpaceRef = useRef<ActionSpace>({ width: 1440, height: 900 });
  const currentViewportRef = useRef<ViewportMeta | null>(null);
  const pendingRecoveryRef = useRef<PendingRecovery | null>(null);
  const driftRef = useRef<DriftTracker>({
    missStreak: 0,
    lastMiss: null,
    recoveryAttempts: 0,
  });
  const turnCountRef = useRef(0);
  const startedAtRef = useRef<number | null>(null);
  const lockRef = useRef<{ width: string; height: string } | null>(null);

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

  const lockDemoAreaSize = useCallback(() => {
    const el = demoAreaRef.current;
    if (!el || lockRef.current) return;
    const rect = el.getBoundingClientRect();
    lockRef.current = {
      width: el.style.width,
      height: el.style.height,
    };
    el.style.width = `${Math.round(rect.width)}px`;
    el.style.height = `${Math.round(rect.height)}px`;
  }, [demoAreaRef]);

  const unlockDemoAreaSize = useCallback(() => {
    const el = demoAreaRef.current;
    if (!el || !lockRef.current) return;
    el.style.width = lockRef.current.width;
    el.style.height = lockRef.current.height;
    lockRef.current = null;
  }, [demoAreaRef]);

  const readViewportMeta = useCallback((captureWidth: number, captureHeight: number): ViewportMeta => {
    const rect = demoAreaRef.current?.getBoundingClientRect();
    return {
      cssWidth: Math.max(1, Math.round(rect?.width ?? captureWidth)),
      cssHeight: Math.max(1, Math.round(rect?.height ?? captureHeight)),
      devicePixelRatio: window.devicePixelRatio || 1,
      visualViewportScale: window.visualViewport?.scale ?? 1,
      captureWidth,
      captureHeight,
    };
  }, [demoAreaRef]);

  /** Capture the demo area and return base64 image plus viewport metadata. */
  const captureScreenshot = useCallback(async (): Promise<CaptureResult> => {
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

    const viewport = readViewportMeta(canvas.width, canvas.height);
    const prevViewport = currentViewportRef.current;
    if (prevViewport) {
      const cssChanged =
        Math.abs(viewport.cssWidth - prevViewport.cssWidth) > 2 ||
        Math.abs(viewport.cssHeight - prevViewport.cssHeight) > 2;
      const dprChanged =
        Math.abs(viewport.devicePixelRatio - prevViewport.devicePixelRatio) > 0.01;
      const zoomChanged =
        Math.abs(viewport.visualViewportScale - prevViewport.visualViewportScale) > 0.01;

      if (cssChanged || dprChanged || zoomChanged) {
        addLogs([
          "📐 Viewport change detected (resize/zoom). Re-capturing to keep coordinate mapping in sync.",
        ]);
      }
    }
    currentViewportRef.current = viewport;

    return {
      b64: canvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, ""),
      viewport,
    };
  }, [demoAreaRef, addLogs, readViewportMeta]);

  /** Show an animated ripple at (xPct, yPct) percent coordinates within demo area. */
  const showRipple = useCallback((xPct: number, yPct: number) => {
    const id = rippleSeq.current++;
    setCursorRipples((prev) => [...prev, { id, x: xPct, y: yPct }]);
    setTimeout(() => {
      setCursorRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
  }, []);

  /**
   * Map model coordinates (in action-space dimensions from server)
   * to actual DOM coordinates within the demo area element.
   */
  const mapCoords = useCallback(
    (mx: number, my: number): { domX: number; domY: number; pctX: number; pctY: number } => {
      const el = demoAreaRef.current;
      const actionSpace = actionSpaceRef.current;
      if (!el) return { domX: mx, domY: my, pctX: 50, pctY: 50 };
      const rect = el.getBoundingClientRect();
      const safeWidth = Math.max(1, actionSpace.width);
      const safeHeight = Math.max(1, actionSpace.height);
      const clampedX = Math.max(0, Math.min(mx, safeWidth));
      const clampedY = Math.max(0, Math.min(my, safeHeight));
      const domX = rect.left + (clampedX / safeWidth) * rect.width;
      const domY = rect.top + (clampedY / safeHeight) * rect.height;
      const pctX = (clampedX / safeWidth) * 100;
      const pctY = (clampedY / safeHeight) * 100;
      return { domX, domY, pctX, pctY };
    },
    [demoAreaRef]
  );

  const applyResponseMetadata = useCallback((data: ApiResponse) => {
    modeRef.current = data.mode;
    actionSpaceRef.current = data.actionSpace;
    sessionIdRef.current = data.sessionId;
    addLogs([
      `🧭 Mode: ${data.mode.toUpperCase()} | action space: ${data.actionSpace.width}x${data.actionSpace.height}`,
    ]);
  }, [addLogs]);

  const triggerDriftRecovery = useCallback((reasonLabel: string) => {
    const drift = driftRef.current;
    drift.missStreak = 0;
    drift.lastMiss = null;
    drift.recoveryAttempts += 1;

    if (drift.recoveryAttempts <= 1) {
      pendingRecoveryRef.current = { reason: "coordinate_drift", forceLegacy: false };
      addLogs([
        `🛟 ${reasonLabel}. Attempting auto-correct in current mode (fresh screenshot + retry).`,
      ]);
      return;
    }

    pendingRecoveryRef.current = { reason: "coordinate_drift", forceLegacy: true };
    addLogs([
      "🛟 Drift persisted after retry. Requesting automatic fallback to LEGACY coordinate mode.",
    ]);
  }, [addLogs]);

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

  const queueRecoveryIfRepeatedMiss = useCallback((x: number, y: number) => {
    const drift = driftRef.current;
    const last = drift.lastMiss;
    const isSameArea =
      !!last &&
      Math.hypot(x - last.x, y - last.y) <= DRIFT_SAME_POINT_DISTANCE_PX;

    drift.missStreak = isSameArea ? drift.missStreak + 1 : 1;
    drift.lastMiss = { x, y };

    if (drift.missStreak >= DRIFT_CLICK_STREAK_THRESHOLD) {
      triggerDriftRecovery("Repeated click misses detected at nearly the same coordinates");
    }
  }, [triggerDriftRecovery]);

  const clearDriftMissStreak = useCallback(() => {
    const drift = driftRef.current;
    drift.missStreak = 0;
    drift.lastMiss = null;
  }, []);

  const assertRuntimeGuard = useCallback(() => {
    if (!startedAtRef.current) return;
    const elapsedMs = Date.now() - startedAtRef.current;
    if (elapsedMs > MAX_RUNTIME_MS) {
      throw new Error("Demo time limit reached (5 minutes).");
    }
  }, []);

  const assertTurnGuardBeforeNextResponse = useCallback(() => {
    if (turnCountRef.current >= MAX_TURNS) {
      throw new Error("Demo max turn limit reached (3 turns).");
    }
  }, []);

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
            assertRuntimeGuard();
            const capture = await captureScreenshot();
            const recovery = pendingRecoveryRef.current;
            pendingRecoveryRef.current = null;

            addLogs(["🔄 Sending screenshot back to AI for analysis"]);
            assertTurnGuardBeforeNextResponse();
            const resp = await fetch(`${API_BASE}/api/computer-use/continue`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                screenshot: capture.b64,
                viewport: capture.viewport,
                sessionId: sessionIdRef.current,
                callId,
                responseId,
                ...(recovery ? { recovery } : {}),
              }),
            });
            if (!resp.ok) throw new Error(`API error: ${resp.status}`);
            const data: ApiResponse = await resp.json();
            turnCountRef.current += 1;
            applyResponseMetadata(data);
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
            const mx = action.x ?? 0;
            const my = action.y ?? 0;
            const { domX, domY, pctX, pctY } = mapCoords(mx, my);
            showRipple(pctX, pctY);

            const targetEl = document.elementFromPoint(domX, domY) as HTMLElement | null;
            const fieldKey = resolveFieldKey(domX, domY);
            const btn = targetEl?.closest("#next-page-btn, [id='next-page-btn']") as HTMLElement | null;

            if (btn || targetEl?.id === "next-page-btn") {
              addLogs(["🖱️ Clicking 'Next Page →' button"]);
              clearDriftMissStreak();
              setDemoPage("form");
              demoPageRef.current = "form";
              await new Promise((r) => setTimeout(r, 800));
            } else if (fieldKey) {
              lastClickedFieldRef.current = fieldKey;
              clearDriftMissStreak();
              addLogs([`🖱️ Clicking field: ${fieldKey}`]);
            } else {
              addLogs([`🖱️ Click miss at (${Math.round(mx)}, ${Math.round(my)})`]);
              targetEl?.click?.();
              queueRecoveryIfRepeatedMiss(mx, my);
            }

            await new Promise((r) => setTimeout(r, 300));
            break;
          }

          case "type": {
            const text = action.text ?? "";
            const target: keyof PatientData | null = lastClickedFieldRef.current;
            if (target) {
              addLogs([`⌨️ Typing "${text}" into ${target}`]);
              await animateType(target, text);
              clearDriftMissStreak();
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
      assertRuntimeGuard,
      assertTurnGuardBeforeNextResponse,
      captureScreenshot,
      addLogs,
      mapCoords,
      showRipple,
      resolveFieldKey,
      animateType,
      demoAreaRef,
      applyResponseMetadata,
      queueRecoveryIfRepeatedMiss,
      clearDriftMissStreak,
    ]
  );

  // ── Main start function ───────────────────────────────────────────────────

  const startDemo = useCallback(async () => {
    if (status === "running") return;

    setStatus("running");
    startedAtRef.current = Date.now();
    turnCountRef.current = 0;
    lockDemoAreaSize();
    addLogs(["🧠 AI agent initializing…"]);
    addLogs([`🛡️ Guards active: max ${MAX_TURNS} turns, 5 minute runtime`]);

    try {
      assertRuntimeGuard();
      const capture = await captureScreenshot();
      addLogs([
        `📐 Session viewport css:${capture.viewport.cssWidth}x${capture.viewport.cssHeight} capture:${capture.viewport.captureWidth}x${capture.viewport.captureHeight} dpr:${capture.viewport.devicePixelRatio.toFixed(2)} zoom:${capture.viewport.visualViewportScale.toFixed(2)}`,
      ]);
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
        body: JSON.stringify({ screenshot: capture.b64, task, viewport: capture.viewport }),
      });
      if (!startResp.ok) throw new Error(`API error: ${startResp.status}`);

      const startData: ApiResponse = await startResp.json();
      turnCountRef.current += 1;
      applyResponseMetadata(startData);
      addLogs(startData.logs);

      if (startData.done) {
        setStatus("done");
        addLogs(["✅ Workflow completed!"]);
        unlockDemoAreaSize();
        return;
      }

      let callId = startData.callId;
      let responseId = startData.responseId;
      let actions = startData.actions;
      let done: boolean = startData.done;

      while (!done) {
        assertRuntimeGuard();
        const result = await executeActions(actions, callId, responseId);
        callId = result.callId;
        responseId = result.responseId;
        done = result.done;

        if (done) break;

        const freshCapture = await captureScreenshot();
        const recovery = pendingRecoveryRef.current;
        pendingRecoveryRef.current = null;

        addLogs(["🔄 Sending updated screenshot to AI"]);

        assertTurnGuardBeforeNextResponse();
        const contResp = await fetch(`${API_BASE}/api/computer-use/continue`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            screenshot: freshCapture.b64,
            viewport: freshCapture.viewport,
            sessionId: sessionIdRef.current,
            callId,
            responseId,
            ...(recovery ? { recovery } : {}),
          }),
        });
        if (!contResp.ok) throw new Error(`API error: ${contResp.status}`);

        const contData: ApiResponse = await contResp.json();
        turnCountRef.current += 1;
        applyResponseMetadata(contData);
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
    } finally {
      unlockDemoAreaSize();
    }
  }, [
    status,
    assertRuntimeGuard,
    assertTurnGuardBeforeNextResponse,
    captureScreenshot,
    addLogs,
    executeActions,
    applyResponseMetadata,
    lockDemoAreaSize,
    unlockDemoAreaSize,
  ]);

  // ── Refresh ───────────────────────────────────────────────────────────────

  const refresh = useCallback(() => {
    setStatus("idle");
    setLogs([]);
    setDemoPage("data");
    demoPageRef.current = "data";
    setFormValues({});
    setActiveField(null);
    setCursorRipples([]);

    sessionIdRef.current = "";
    modeRef.current = "ga";
    actionSpaceRef.current = { width: 1440, height: 900 };
    currentViewportRef.current = null;
    pendingRecoveryRef.current = null;
    driftRef.current = { missStreak: 0, lastMiss: null, recoveryAttempts: 0 };
    turnCountRef.current = 0;
    startedAtRef.current = null;
    lastClickedFieldRef.current = null;
    unlockDemoAreaSize();
  }, [unlockDemoAreaSize]);

  return [
    { status, logs, demoPage, formValues, activeField, cursorRipples },
    { startDemo, refresh },
  ];
}
