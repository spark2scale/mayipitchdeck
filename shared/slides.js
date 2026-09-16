export const SLIDES = [
  "hero",
  "everyday-benefits",
  "engine",
  "voice-agent",
  "case-modal",
  "qualify-experience",
  "confirm",
  "traction",
  "founder",
  "vision",
  "ask",
  "capture-detail",
  "connect-detail",
  "convert-detail",
];

export const PDF_EXPORT_SLIDES = SLIDES.filter(
  (slide) => !["demo", "capture-detail", "connect-detail", "convert-detail"].includes(slide)
);
