import { Router, type Request, type Response } from "express";
import { AzureOpenAI } from "openai";
import {
  AUTO_FILL_VALUES,
  DEMO_CASE_ID,
  REVIEW_ITEMS,
  isKnownFormId,
  normalizeMapping,
  parsePageImages,
  parseTemplatePdf,
} from "./fmlaMapping.js";
import { compactLayout, extractLayout } from "./fmlaLayout.js";

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
  const { formId, caseId, pages, templatePdf } = req.body as { formId?: unknown; caseId?: unknown; pages?: unknown; templatePdf?: unknown };
  if (!isKnownFormId(formId) || caseId !== DEMO_CASE_ID) {
    res.status(400).json({ error: "Only registered demo forms and the synthetic demo case are supported." });
    return;
  }
  const pageImages = parsePageImages(pages);
  const pdfBytes = parseTemplatePdf(templatePdf);
  if (!pageImages || !pdfBytes) {
    res.status(400).json({ error: "Invalid rendered PDF pages or template PDF." });
    return;
  }

  try {
    const layout = await extractLayout(pdfBytes);
    if (!layout.tokens.length) throw new Error("No text or OCR layout could be extracted from this template.");
    const { client, deployment } = makeClient();
    const prompt = [
      "You map blank FMLA medical-certification forms to a safe, synthetic demo case.",
      "Identify only the visible answer regions for the allowed fields below. Do not infer any clinical narrative, prognosis, restriction, signature, or intermittent leave information.",
      `Allowed fields and values: ${JSON.stringify(AUTO_FILL_VALUES)}.`,
      "For this synthetic case, Alex Morgan is both the patient and the employee. Employee Name and Patient's Name are both eligible labels for patient_name.",
      "The supplied layout manifest contains authoritative page-relative coordinates for printed labels. Use it as evidence; do not select an unrelated blank line.",
      "Return JSON only: {\"overlays\":[{\"field\":string,\"page\":number,\"evidenceLabel\":string,\"placement\":\"right_of_label\"|\"below_label\",\"confidence\":number}] }.",
      "Use an evidenceLabel copied from the layout manifest. Choose right_of_label when the blank answer space follows the label on the same line, otherwise below_label. Do not return pixel coordinates or calibration anchors. Omit fields you cannot locate confidently.",
      `Layout manifest: ${JSON.stringify(compactLayout(layout.tokens))}`,
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
    const mapped = normalizeMapping(raw, layout.tokens);
    res.json({
      overlays: mapped.overlays,
      reviewItems: [...REVIEW_ITEMS, ...mapped.reviewItems],
      notPresentFields: mapped.notPresentFields,
      analyzedPages: pageImages.length,
      layoutSource: layout.source,
      mappingMode: "verified-label-geometry",
    });
  } catch (error) {
    console.error("[/api/fmla/map]", error);
    res.status(502).json({ error: "FMLA mapping analysis is unavailable. Please retry or review manually." });
  }
});
