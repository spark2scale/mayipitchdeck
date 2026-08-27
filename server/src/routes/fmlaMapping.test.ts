import test from "node:test";
import assert from "node:assert/strict";
import { AUTO_FILL_VALUES, calibratePages, normalizeMapping, parsePageImages, parseTemplatePdf } from "./fmlaMapping.js";

const pages = [{ page: 1, width: 1000, height: 1400, image: `data:image/jpeg;base64,${"a".repeat(32)}` }];

test("parses bounded demo page images", () => {
  assert.equal(parsePageImages(pages)?.length, 1);
  assert.equal(parsePageImages([{ ...pages[0], width: 10 }]), null);
});

test("normalizes only allowlisted overlays inside page bounds", () => {
  const layout = [
    { page: 1, text: "Patient Name", leftPct: 20, topPct: 20, widthPct: 10, heightPct: 2 },
    { page: 1, text: "Date of Birth", leftPct: 50, topPct: 30, widthPct: 10, heightPct: 2 },
    { page: 1, text: "Provider Name", leftPct: 40, topPct: 60, widthPct: 10, heightPct: 2 },
  ];
  const anchors = layout.map((item) => ({ ...item, leftPct: item.leftPct - 5, topPct: item.topPct - 4 }));
  const result = normalizeMapping({ anchors, overlays: [
    { field: "patient_name", page: 1, evidenceLabel: "Patient Name", leftPct: 27, topPct: 23, widthPct: 20, heightPct: 2, confidence: 0.98 },
    { field: "signature", page: 1, evidenceLabel: "Patient Name", leftPct: 27, topPct: 23, widthPct: 20, heightPct: 2, confidence: 0.98 },
    { field: "patient_dob", page: 1, evidenceLabel: "Missing label", leftPct: 50, topPct: 30, widthPct: 10, heightPct: 2, confidence: 0.98 },
  ] }, layout);
  assert.equal(result.overlays.length, 1);
  assert.equal(result.overlays[0].value, AUTO_FILL_VALUES.patient_name);
  assert.equal(Math.round(result.overlays[0].leftPct), 32);
  assert.ok(result.reviewItems.some((item) => item.includes("patient_dob")));
});

test("requires three matching anchors and a valid PDF header", () => {
  const layout = [{ page: 1, text: "Name", leftPct: 10, topPct: 10, widthPct: 5, heightPct: 2 }];
  assert.equal(calibratePages([{ page: 1, text: "Name", leftPct: 10, topPct: 10, widthPct: 5, heightPct: 2 }], layout).size, 0);
  const parsedPdf = parseTemplatePdf(Buffer.from(`%PDF${" ".repeat(120)}`).toString("base64"));
  assert.ok(parsedPdf);
  assert.equal(Buffer.isBuffer(parsedPdf), false);
  assert.equal(parseTemplatePdf("not-a-pdf"), null);
});
