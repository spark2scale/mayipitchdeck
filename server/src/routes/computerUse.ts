import { Router, Request, Response } from "express";
import { AzureOpenAI } from "openai";

export const computerUseRouter = Router();

// ── Azure OpenAI client ───────────────────────────────────────────────────────
// The `computer` tool (GA, non-preview) requires:
//   model: gpt-5.4 (or your Azure deployment name)
//   tools: [{ type: "computer" }]
//   api-version: 2025-04-01-preview or later
//
// If your Azure deployment uses the older computer-use-preview model,
// change AZURE_USE_LEGACY_TOOL=true in .env to switch to the legacy shape.

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

interface ApiReply {
  callId: string;
  responseId: string;
  actions: ComputerAction[];
  logs: string[];
  done: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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
        return `⌨️ AI typing: "${a.text ?? ""}"`;
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

// ── POST /start ────────────────────────────────────────────────────────────────

computerUseRouter.post(
  "/start",
  async (req: Request, res: Response): Promise<void> => {
    const { screenshot, task } = req.body as {
      screenshot?: string;
      task?: string;
    };

    if (!screenshot || !task) {
      res.status(400).json({ error: "screenshot and task are required" });
      return;
    }

    try {
      const client = makeClient();
      const deployment = process.env.AZURE_OPENAI_DEPLOYMENT!;
      const useLegacy = process.env.AZURE_USE_LEGACY_TOOL === "true";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const toolDef: any = useLegacy
        ? {
            type: "computer_use_preview",
            display_width: 1440,
            display_height: 900,
            environment: "browser",
          }
        : { type: "computer" };

      const response = await (client.responses as any).create({
        model: deployment,
        tools: [toolDef],
        ...(useLegacy ? { truncation: "auto" } : {}),
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
      const logs = ["🧠 Azure OpenAI computer-use session started"];

      if (!cc) {
        // Model returned a final answer immediately (no UI actions needed)
        logs.push("✅ AI completed task without UI interaction");
        const reply: ApiReply = {
          callId: "",
          responseId: response.id as string,
          actions: [],
          logs,
          done: true,
        };
        res.json(reply);
        return;
      }

      logs.push(...actionsToLogs(cc.actions));

      const reply: ApiReply = {
        callId: cc.callId,
        responseId: response.id as string,
        actions: cc.actions,
        logs,
        done: false,
      };
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
    const { screenshot, callId, responseId } = req.body as {
      screenshot?: string;
      callId?: string;
      responseId?: string;
    };

    if (!screenshot || !callId || !responseId) {
      res
        .status(400)
        .json({ error: "screenshot, callId, and responseId are required" });
      return;
    }

    try {
      const client = makeClient();
      const deployment = process.env.AZURE_OPENAI_DEPLOYMENT!;
      const useLegacy = process.env.AZURE_USE_LEGACY_TOOL === "true";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const toolDef: any = useLegacy
        ? {
            type: "computer_use_preview",
            display_width: 1440,
            display_height: 900,
            environment: "browser",
          }
        : { type: "computer" };

      const response = await (client.responses as any).create({
        model: deployment,
        tools: [toolDef],
        ...(useLegacy ? { truncation: "auto" } : {}),
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
      const logs: string[] = [];

      if (!cc) {
        logs.push("✅ AI has completed all tasks");
        const reply: ApiReply = {
          callId: "",
          responseId: response.id as string,
          actions: [],
          logs,
          done: true,
        };
        res.json(reply);
        return;
      }

      logs.push(...actionsToLogs(cc.actions));

      const reply: ApiReply = {
        callId: cc.callId,
        responseId: response.id as string,
        actions: cc.actions,
        logs,
        done: false,
      };
      res.json(reply);
    } catch (err) {
      console.error("[/continue]", err);
      res.status(500).json({ error: String(err) });
    }
  }
);
