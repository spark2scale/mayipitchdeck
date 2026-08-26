import test from "node:test";
import assert from "node:assert/strict";
import { AUTO_FILL_VALUES, normalizeMapping, parsePageImages } from "./fmlaMapping.js";

const pages = [{ page: 1, width: 1000, height: 1400, image: `data:image/jpeg;base64,${"a".repeat(32)}` }];

test("parses bounded demo page images", () => {
  assert.equal(parsePageImages(pages)?.length, 1);
  assert.equal(parsePageImages([{ ...pages[0], width: 10 }]), null);
});

test("normalizes only allowlisted overlays inside page bounds", () => {
  const overlays = normalizeMapping({ overlays: [
    { field: "patient_name", page: 1, x: 30, y: 40, width: 180, height: 20, confidence: 0.98 },
    { field: "signature", page: 1, x: 30, y: 40, width: 180, height: 20, confidence: 0.98 },
    { field: "patient_dob", page: 1, x: 980, y: 40, width: 50, height: 20, confidence: 0.98 },
  ] }, pages);
  assert.equal(overlays.length, 1);
  assert.equal(overlays[0].value, AUTO_FILL_VALUES.patient_name);
});
