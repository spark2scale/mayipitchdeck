export const SLIDES = [
  "hero",
  "problem",
  "loss",
  "everyday-benefits",
  "engine",
  "voice-agent",
  "qualify-experience",
  "qualify",
  "confirm",
  "demo",
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
