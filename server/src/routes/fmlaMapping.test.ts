import test from "node:test";
import assert from "node:assert/strict";
import { AUTO_FILL_VALUES, answerRegion, normalizeMapping, parsePageImages, parseTemplatePdf } from "./fmlaMapping.js";

const pages = [{ page: 1, width: 1000, height: 1400, image: `data:image/jpeg;base64,${"a".repeat(32)}` }];

test("parses bounded demo page images", () => {
  assert.equal(parsePageImages(pages)?.length, 1);
  assert.equal(parsePageImages([{ ...pages[0], width: 10 }]), null);
});

test("derives an answer region from verified label evidence", () => {
  const layout = [
    { page: 1, text: "Employee Name", leftPct: 10, topPct: 10, widthPct: 12, heightPct: 2 },
    { page: 1, text: "Patient Name", leftPct: 20, topPct: 20, widthPct: 10, heightPct: 2 },
    { page: 1, text: "Date of Birth", leftPct: 50, topPct: 30, widthPct: 10, heightPct: 2 },
    { page: 1, text: "Provider Name", leftPct: 40, topPct: 60, widthPct: 10, heightPct: 2 },
  ];
  const result = normalizeMapping({ overlays: [
    { field: "patient_name", page: 1, evidenceLabel: "Employee Name", placement: "right_of_label", confidence: 0.98 },
    { field: "patient_name", page: 1, evidenceLabel: "Patient Name", placement: "right_of_label", confidence: 0.98 },
    { field: "signature", page: 1, evidenceLabel: "Patient Name", placement: "right_of_label", confidence: 0.98 },
    { field: "patient_dob", page: 1, evidenceLabel: "Missing label", placement: "right_of_label", confidence: 0.98 },
  ] }, layout);
  assert.equal(result.overlays.length, 2);
  assert.ok(result.overlays.every((overlay) => overlay.value === AUTO_FILL_VALUES.patient_name));
  assert.equal(Math.round(result.overlays[1].leftPct), 31);
  assert.ok(result.reviewItems.some((item) => item.includes("patient_dob")));
});

test("maps practice contacts and the leave-window duration only to verified labels", () => {
  const layout = [
    { page: 2, text: "Type of practice / Medical specialty:", leftPct: 4, topPct: 52, widthPct: 24, heightPct: 2 },
    { page: 2, text: "Fax:", leftPct: 48, topPct: 60, widthPct: 4, heightPct: 2 },
    { page: 2, text: "E-mail:", leftPct: 65, topPct: 60, widthPct: 6, heightPct: 2 },
    { page: 2, text: "of how long the condition lasted or will last:", leftPct: 5, topPct: 85, widthPct: 34, heightPct: 2 },
  ];
  const result = normalizeMapping({ overlays: [
    { field: "practice_name", page: 2, evidenceLabel: "Type of practice / Medical specialty:", placement: "right_of_label", confidence: 0.96 },
    { field: "practice_fax", page: 2, evidenceLabel: "Fax:", placement: "right_of_label", confidence: 0.96 },
    { field: "practice_email", page: 2, evidenceLabel: "E-mail:", placement: "right_of_label", confidence: 0.96 },
    { field: "condition_duration", page: 2, evidenceLabel: "of how long the condition lasted or will last:", placement: "right_of_label", confidence: 0.96 },
  ] }, layout);
  assert.deepEqual(result.overlays.map((overlay) => overlay.value), [
    AUTO_FILL_VALUES.practice_name,
    AUTO_FILL_VALUES.practice_fax,
    AUTO_FILL_VALUES.practice_email,
    AUTO_FILL_VALUES.condition_duration,
  ]);
});

test("bounds right and below answer regions and validates PDF headers", () => {
  const label = { page: 1, text: "Employee Name", leftPct: 12, topPct: 16, widthPct: 14, heightPct: 2 };
  const neighbor = { page: 1, text: "Position", leftPct: 54, topPct: 16, widthPct: 9, heightPct: 2 };
  const right = answerRegion(label, "right_of_label", [label, neighbor]);
  const below = answerRegion(label, "below_label", [label, neighbor, { page: 1, text: "Next Section", leftPct: 12, topPct: 25, widthPct: 20, heightPct: 2 }]);
  assert.ok(right.leftPct + right.widthPct < neighbor.leftPct);
  assert.ok(below.topPct + below.heightPct < 25);
  const parsedPdf = parseTemplatePdf(Buffer.from(`%PDF${" ".repeat(120)}`).toString("base64"));
  assert.ok(parsedPdf);
  assert.equal(Buffer.isBuffer(parsedPdf), false);
  assert.equal(parseTemplatePdf("not-a-pdf"), null);
});
