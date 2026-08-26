import { Router, type Request, type Response } from "express";
import { AzureOpenAI } from "openai";
import {
  AUTO_FILL_VALUES,
  DEMO_CASE_ID,
  REVIEW_ITEMS,
  isKnownFormId,
  normalizeMapping,
  parsePageImages,
} from "./fmlaMapping.js";

export const fmlaRouter = Router();

function makeClient() {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_KEY;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION ?? "2025-04-01-preview";
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  if (!endpoint || !apiKey || !deployment) throw new Error("Azure OpenAI is not configured");
  return { client: new AzureOpenAI({ endpoint, apiKey, apiVersion, deployment }), deployment };
}

fmlaRouter.post("/map", async (req: Request, res: Response): Promise<void> => {
  const { formId, caseId, pages } = req.body as { formId?: unknown; caseId?: unknown; pages?: unknown };
  if (!isKnownFormId(formId) || caseId !== DEMO_CASE_ID) {
    res.status(400).json({ error: "Only registered demo forms and the synthetic demo case are supported." });
    return;
  }
  const pageImages = parsePageImages(pages);
  if (!pageImages) {
    res.status(400).json({ error: "Invalid rendered PDF pages." });
    return;
  }

  try {
    const { client, deployment } = makeClient();
    const prompt = [
      "You map blank FMLA medical-certification forms to a safe, synthetic demo case.",
      "Identify only the visible answer regions for the allowed fields below. Do not infer any clinical narrative, prognosis, restriction, signature, or intermittent leave information.",
      `Allowed fields and values: ${JSON.stringify(AUTO_FILL_VALUES)}.`,
      "Return JSON only: {\"overlays\":[{\"field\":string,\"page\":number,\"x\":number,\"y\":number,\"width\":number,\"height\":number,\"confidence\":number}] }.",
      "Coordinates must be pixel coordinates in the supplied rendered page. Omit fields you cannot locate confidently.",
    ].join("\n");
    const content: Array<Record<string, unknown>> = [{ type: "input_text", text: prompt }];
    for (const page of pageImages) {
      content.push({ type: "input_text", text: `Page ${page.page}: ${page.width} x ${page.height} pixels.` });
      content.push({ type: "input_image", image_url: page.image, detail: "high" });
    }
    const responses = client.responses as unknown as {
      create(input: unknown): Promise<{ output_text?: unknown }>;
    };
    const response = await responses.create({
      model: deployment,
      input: [{ role: "user", content }],
      temperature: 0,
    });
    const rawText = String(response.output_text ?? "").replace(/^```json\s*|\s*```$/g, "").trim();
    let raw: unknown;
    try { raw = JSON.parse(rawText); } catch { raw = null; }
    const overlays = normalizeMapping(raw, pageImages);
    res.json({ overlays, reviewItems: REVIEW_ITEMS, analyzedPages: pageImages.length });
  } catch (error) {
    console.error("[/api/fmla/map]", error);
    res.status(502).json({ error: "FMLA mapping analysis is unavailable. Please retry or review manually." });
  }
});
