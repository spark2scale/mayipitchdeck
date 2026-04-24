import { Router, Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { AzureOpenAI } from "openai";

export const computerUseRouter = Router();

// ── Azure OpenAI client ───────────────────────────────────────────────────────

function makeClient() {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_KEY;
  const apiVersion =
    process.env.AZURE_OPENAI_API_VERSION ?? "2025-04-01-preview";
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;

  if (!endpoint || !apiKey || !deployment) {
    throw new Error(
      "Missing required env vars: AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_KEY, AZURE_OPENAI_DEPLOYMENT"
    );
  }

  return new AzureOpenAI({ endpoint, apiKey, apiVersion, deployment });
}

// ── Types ─────────────────────────────────────────────────────────────────────

type ToolMode = "ga" | "legacy";

type ToolPolicy = "AUTO" | "GA" | "LEGACY";

interface ComputerAction {
  type: string;
  x?: number;
  y?: number;
  button?: string;
  text?: string;
  keys?: string[];
  scrollX?: number;
  scrollY?: number;
}

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

interface RecoveryHint {
  reason: "coordinate_drift";
  forceLegacy?: boolean;
}

interface SessionState {
  sessionId: string;
  mode: ToolMode;
  task: string;
  viewport: ViewportMeta;
}

interface ApiReply {
  sessionId: string;
  callId: string;
  responseId: string;
  mode: ToolMode;
  actionSpace: ActionSpace;
  actions: ComputerAction[];
  logs: string[];
  done: boolean;
}

interface StartBody {
  screenshot?: string;
  task?: string;
  viewport?: ViewportMeta;
}

interface ContinueBody {
  screenshot?: string;
  sessionId?: string;
  callId?: string;
  responseId?: string;
  viewport?: ViewportMeta;
  recovery?: RecoveryHint;
}

// ── Session storage (in-memory, single-process) ─────────────────────────────

const sessionsById = new Map<string, SessionState>();
const sessionIdByResponseId = new Map<string, string>();

// ── Helpers ───────────────────────────────────────────────────────────────────

function getToolPolicy(): ToolPolicy {
  const policy = (process.env.AZURE_COMPUTER_TOOL_MODE ?? "AUTO").toUpperCase();
  if (policy === "GA" || policy === "LEGACY") return policy;
  return "AUTO";
}

function parseViewport(input?: Partial<ViewportMeta>): ViewportMeta {
  const fallbackWidth = 1440;
  const fallbackHeight = 900;
  const cssWidth = Math.max(1, Math.round(input?.cssWidth ?? fallbackWidth));
  const cssHeight = Math.max(1, Math.round(input?.cssHeight ?? fallbackHeight));
  const captureWidth = Math.max(1, Math.round(input?.captureWidth ?? cssWidth));
  const captureHeight = Math.max(1, Math.round(input?.captureHeight ?? cssHeight));
  return {
    cssWidth,
    cssHeight,
    captureWidth,
    captureHeight,
    devicePixelRatio: Number(input?.devicePixelRatio ?? 1),
    visualViewportScale: Number(input?.visualViewportScale ?? 1),
  };
}

function resolveInitialMode(): ToolMode {
  const envLegacy = process.env.AZURE_USE_LEGACY_TOOL === "true";
  if (envLegacy) return "legacy";

  const policy = getToolPolicy();
  if (policy === "LEGACY") return "legacy";
  return "ga";
}

function makeActionSpace(viewport: ViewportMeta): ActionSpace {
  return {
    width: viewport.captureWidth,
    height: viewport.captureHeight,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildToolDef(mode: ToolMode, viewport: ViewportMeta): any {
  if (mode === "legacy") {
    return {
      type: "computer_use_preview",
      display_width: viewport.captureWidth,
      display_height: viewport.captureHeight,
      environment: "browser",
    };
  }
  return { type: "computer" };
}

/** Convert a batch of computer actions into human-readable log lines. */
function actionsToLogs(actions: ComputerAction[]): string[] {
  return actions.map((a) => {
    switch (a.type) {
      case "screenshot":
        return "📸 AI requesting screenshot of current screen";
      case "click":
        return `🖱️ AI clicking at (${Math.round(a.x ?? 0)}, ${Math.round(a.y ?? 0)})`;
      case "double_click":
        return `🖱️ AI double-clicking at (${Math.round(a.x ?? 0)}, ${Math.round(a.y ?? 0)})`;
      case "type":
        return `⌨️ AI typing: \"${a.text ?? ""}\"`;
      case "scroll":
        return `🖱️ AI scrolling (dx:${a.scrollX ?? 0}, dy:${a.scrollY ?? 0})`;
      case "keypress":
        return `⌨️ AI pressing keys: ${(a.keys ?? []).join(" + ")}`;
      case "move":
        return `🖱️ AI moving cursor to (${Math.round(a.x ?? 0)}, ${Math.round(a.y ?? 0)})`;
      case "wait":
        return "🕐 AI waiting…";
      default:
        return `🔧 AI action: ${a.type}`;
    }
  });
}

/** Extract the computer_call from the response output items. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractComputerCall(output: any[]): { callId: string; actions: ComputerAction[] } | null {
  const call = output.find((item: { type?: string }) => item.type === "computer_call");
  if (!call) return null;
  return {
    callId: call.call_id as string,
    actions: (call.actions ?? []) as ComputerAction[],
  };
}

async function createInitialSessionResponse({
  screenshot,
  task,
  viewport,
  mode,
}: {
  screenshot: string;
  task: string;
  viewport: ViewportMeta;
  mode: ToolMode;
}): Promise<ApiReply> {
  const client = makeClient();
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT!;
  const sessionId = randomUUID();

  const toolDef = buildToolDef(mode, viewport);

  const response = await (client.responses as any).create({
    model: deployment,
    tools: [toolDef],
    ...(mode === "legacy" ? { truncation: "auto" } : {}),
    input: [
      {
        role: "user",
        content: [
          { type: "input_text", text: task },
          {
            type: "input_image",
            image_url: `data:image/png;base64,${screenshot}`,
            detail: "original",
          },
        ],
      },
    ],
  });

  const cc = extractComputerCall(response.output ?? []);
  const actionSpace = makeActionSpace(viewport);
  const logs = [
    "🧠 Azure OpenAI computer-use session started",
    `🧭 Mode: ${mode.toUpperCase()} | action space: ${actionSpace.width}x${actionSpace.height}`,
    `🖼️ Viewport css:${viewport.cssWidth}x${viewport.cssHeight} dpr:${viewport.devicePixelRatio.toFixed(2)} zoom:${viewport.visualViewportScale.toFixed(2)} capture:${viewport.captureWidth}x${viewport.captureHeight}`,
  ];

  sessionsById.set(sessionId, { sessionId, mode, task, viewport });
  sessionIdByResponseId.set(response.id as string, sessionId);

  if (!cc) {
    logs.push("✅ AI completed task without UI interaction");
    return {
      sessionId,
      callId: "",
      responseId: response.id as string,
      mode,
      actionSpace,
      actions: [],
      logs,
      done: true,
    };
  }

  logs.push(...actionsToLogs(cc.actions));

  return {
    sessionId,
    callId: cc.callId,
    responseId: response.id as string,
    mode,
    actionSpace,
    actions: cc.actions,
    logs,
    done: false,
  };
}

async function continueSession({
  screenshot,
  callId,
  responseId,
  state,
}: {
  screenshot: string;
  callId: string;
  responseId: string;
  state: SessionState;
}): Promise<ApiReply> {
  const client = makeClient();
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT!;
  const toolDef = buildToolDef(state.mode, state.viewport);

  const response = await (client.responses as any).create({
    model: deployment,
    tools: [toolDef],
    ...(state.mode === "legacy" ? { truncation: "auto" } : {}),
    previous_response_id: responseId,
    input: [
      {
        type: "computer_call_output",
        call_id: callId,
        output: {
          type: "computer_screenshot",
          image_url: `data:image/png;base64,${screenshot}`,
          detail: "original",
        },
      },
    ],
  });

  const cc = extractComputerCall(response.output ?? []);
  const actionSpace = makeActionSpace(state.viewport);
  const logs: string[] = [
    `🧭 Mode: ${state.mode.toUpperCase()} | action space: ${actionSpace.width}x${actionSpace.height}`,
  ];

  sessionIdByResponseId.set(response.id as string, state.sessionId);

  if (!cc) {
    logs.push("✅ AI has completed all tasks");
    return {
      sessionId: state.sessionId,
      callId: "",
      responseId: response.id as string,
      mode: state.mode,
      actionSpace,
      actions: [],
      logs,
      done: true,
    };
  }

  logs.push(...actionsToLogs(cc.actions));

  return {
    sessionId: state.sessionId,
    callId: cc.callId,
    responseId: response.id as string,
    mode: state.mode,
    actionSpace,
    actions: cc.actions,
    logs,
    done: false,
  };
}

async function restartSessionInLegacy({
  screenshot,
  state,
}: {
  screenshot: string;
  state: SessionState;
}): Promise<ApiReply> {
  const client = makeClient();
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT!;

  const legacyState: SessionState = {
    ...state,
    mode: "legacy",
  };

  const toolDef = buildToolDef(legacyState.mode, legacyState.viewport);

  const response = await (client.responses as any).create({
    model: deployment,
    tools: [toolDef],
    truncation: "auto",
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: [
              state.task,
              "Recovery note: coordinate drift was detected.",
              "Continue the same workflow from this latest screenshot.",
              "Do not restart from assumptions that depend on prior hidden state.",
            ].join(" "),
          },
          {
            type: "input_image",
            image_url: `data:image/png;base64,${screenshot}`,
            detail: "original",
          },
        ],
      },
    ],
  });

  const cc = extractComputerCall(response.output ?? []);
  const actionSpace = makeActionSpace(legacyState.viewport);
  const logs = [
    "🛟 Coordinate drift fallback: restarting in LEGACY mode",
    `🧭 Mode: LEGACY | action space: ${actionSpace.width}x${actionSpace.height}`,
  ];

  sessionsById.set(legacyState.sessionId, legacyState);
  sessionIdByResponseId.set(response.id as string, legacyState.sessionId);

  if (!cc) {
    logs.push("✅ AI has completed all tasks");
    return {
      sessionId: legacyState.sessionId,
      callId: "",
      responseId: response.id as string,
      mode: legacyState.mode,
      actionSpace,
      actions: [],
      logs,
      done: true,
    };
  }

  logs.push(...actionsToLogs(cc.actions));

  return {
    sessionId: legacyState.sessionId,
    callId: cc.callId,
    responseId: response.id as string,
    mode: legacyState.mode,
    actionSpace,
    actions: cc.actions,
    logs,
    done: false,
  };
}

function resolveSessionState(body: ContinueBody): SessionState | null {
  const id = body.sessionId ?? (body.responseId ? sessionIdByResponseId.get(body.responseId) : undefined);
  if (!id) return null;
  return sessionsById.get(id) ?? null;
}

// ── POST /start ────────────────────────────────────────────────────────────────

computerUseRouter.post(
  "/start",
  async (req: Request, res: Response): Promise<void> => {
    const { screenshot, task, viewport } = req.body as StartBody;

    if (!screenshot || !task) {
      res.status(400).json({ error: "screenshot and task are required" });
      return;
    }

    try {
      const parsedViewport = parseViewport(viewport);
      const mode = resolveInitialMode();
      const reply = await createInitialSessionResponse({
        screenshot,
        task,
        viewport: parsedViewport,
        mode,
      });

      res.json(reply);
    } catch (err) {
      console.error("[/start]", err);
      res.status(500).json({ error: String(err) });
    }
  }
);

// ── POST /continue ────────────────────────────────────────────────────────────

computerUseRouter.post(
  "/continue",
  async (req: Request, res: Response): Promise<void> => {
    const { screenshot, callId, responseId, viewport, recovery } = req.body as ContinueBody;

    if (!screenshot || !callId || !responseId) {
      res
        .status(400)
        .json({ error: "screenshot, callId, and responseId are required" });
      return;
    }

    try {
      const state = resolveSessionState(req.body as ContinueBody);
      if (!state) {
        res.status(400).json({ error: "Invalid or expired sessionId/responseId" });
        return;
      }

      if (viewport) {
        state.viewport = parseViewport(viewport);
        sessionsById.set(state.sessionId, state);
      }

      const policy = getToolPolicy();
      const shouldForceLegacy =
        recovery?.reason === "coordinate_drift" &&
        recovery.forceLegacy === true &&
        state.mode === "ga" &&
        policy !== "GA";

      if (shouldForceLegacy) {
        const reply = await restartSessionInLegacy({ screenshot, state });
        res.json(reply);
        return;
      }

      if (recovery?.reason === "coordinate_drift") {
        console.warn(
          `[computer-use] coordinate drift hint received for session ${state.sessionId} (forceLegacy=${Boolean(recovery.forceLegacy)})`
        );
      }

      const reply = await continueSession({
        screenshot,
        callId,
        responseId,
        state,
      });
      res.json(reply);
    } catch (err) {
      console.error("[/continue]", err);
      res.status(500).json({ error: String(err) });
    }
  }
);
