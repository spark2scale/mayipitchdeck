import { Router, type Request, type Response } from "express";
import { AzureOpenAI } from "openai";
import {
  AUTO_FILL_VALUES,
  CHECKBOX_DECISIONS,
  DEMO_CASE_ID,
  REVIEW_ITEMS,
  isKnownFormId,
  normalizeCheckboxMapping,
  normalizeMapping,
  parsePageImages,
  parseTemplatePdf,
} from "./fmlaMapping.js";
import { compactLayout, compactSelectionMarks, extractLayout } from "./fmlaLayout.js";

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
    const layout = await extractLayout(pdfBytes, true);
    if (!layout.tokens.length) throw new Error("No text or OCR layout could be extracted from this template.");
    const { client, deployment } = makeClient();
    const prompt = [
      "You map blank FMLA medical-certification forms to a safe, synthetic demo case.",
      "Identify only the visible answer regions for the allowed text fields and checkbox decisions below. Do not infer any clinical facts beyond the fixed synthetic treatment plan.",
      `Allowed fields and values: ${JSON.stringify(AUTO_FILL_VALUES)}.`,
      `Approved checkbox decisions: ${JSON.stringify(CHECKBOX_DECISIONS)}.`,
      "For this synthetic case, Alex Morgan is both the patient and the employee. Employee Name and Patient's Name are both eligible labels for patient_name. Return every applicable occurrence, including repeated employee-name headers on later pages.",
      "The fixed clinician-attested plan is: FMLA for the patient's own serious health condition; no intermittent/reduced leave; planned retinal repair on 09/18/2026 with postoperative follow-ups on 09/25/2026 and 10/09/2026; six-week recovery; no external referral. Only return checkbox decisions explicitly approved by that plan.",
      "condition_duration is a transparent synthetic estimate derived from the requested leave window, not a clinical prognosis. Practice contact values apply only to provider/practice fields.",
      "The supplied layout manifest contains authoritative page-relative coordinates for printed labels. Use it as evidence; do not select an unrelated blank line.",
      "Return JSON only: {\"overlays\":[{\"field\":string,\"page\":number,\"evidenceLabel\":string,\"placement\":\"right_of_label\"|\"below_label\",\"confidence\":number}],\"checkboxes\":[{\"decisionId\":string,\"page\":number,\"evidenceLabel\":string,\"selectionMarkId\":string,\"confidence\":number}] }.",
      "For a checkbox, use an evidenceLabel copied from the layout manifest and selectionMarkId copied from the detected selection-mark manifest. Do not return pixel coordinates, create decisions, or select referral options. Omit anything you cannot locate confidently.",
      `Layout manifest: ${JSON.stringify(compactLayout(layout.tokens))}`,
      `Selection-mark manifest: ${JSON.stringify(compactSelectionMarks(layout.selectionMarks))}`,
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
    const mappedCheckboxes = normalizeCheckboxMapping(raw, layout.tokens, layout.selectionMarks);
    res.json({
      overlays: mapped.overlays,
      checkboxes: mappedCheckboxes.checkboxes,
      reviewItems: [...REVIEW_ITEMS, ...mapped.reviewItems, ...mappedCheckboxes.reviewItems],
      notPresentFields: mapped.notPresentFields,
      notPresentCheckboxes: mappedCheckboxes.notPresentCheckboxes,
      analyzedPages: pageImages.length,
      layoutSource: layout.source,
      mappingMode: "verified-label-geometry",
    });
  } catch (error) {
    console.error("[/api/fmla/map]", error);
    res.status(502).json({ error: "FMLA mapping analysis is unavailable. Please retry or review manually." });
  }
});
