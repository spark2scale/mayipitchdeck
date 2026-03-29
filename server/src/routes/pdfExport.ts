import { Router, Request } from "express";
import { PDFDocument } from "pdf-lib";
import { chromium, type Browser } from "playwright";

const pdfExportRouter = Router();

const PDF_FILENAME = "MayI-Investor-Deck.pdf";
const PDF_PAGE_WIDTH = 960;
const PDF_PAGE_HEIGHT = 540;
const EXPORT_VIEWPORT_WIDTH = 1600;
const EXPORT_VIEWPORT_HEIGHT = 900;
const DEFAULT_FRONTEND_URL = "http://127.0.0.1:5173/";
const SLIDES = [
  "hero",
  "founder",
  "problem",
  "loss",
  "engine",
  "capture-detail",
  "connect-detail",
  "convert-detail",
  "roi",
  "why-wins",
  "path",
  "moats",
  "vision",
  "demo",
  "appendix",
] as const;

let browserPromise: Promise<Browser> | null = null;

function getBrowser() {
  if (!browserPromise) {
    browserPromise = chromium.launch({ headless: true });
  }

  return browserPromise;
}

function getExportUrl(req: Request) {
  const requestedBaseUrl = req.query.baseUrl;
  if (typeof requestedBaseUrl === "string" && requestedBaseUrl.length > 0) {
    const requestedUrl = new URL(requestedBaseUrl);
    requestedUrl.pathname = "/";
    requestedUrl.searchParams.set("export", "pdf");
    return requestedUrl.toString();
  }

  const forwardedProto = req.get("x-forwarded-proto");
  const forwardedHost = req.get("x-forwarded-host");
  const referer = req.get("referer");
  const origin = req.get("origin");

  const inferredBaseUrl =
    (forwardedProto && forwardedHost && `${forwardedProto}://${forwardedHost}`) ||
    referer ||
    origin ||
    process.env.PDF_EXPORT_APP_URL ||
    process.env.FRONTEND_URL ||
    process.env.APP_URL ||
    DEFAULT_FRONTEND_URL;

  const url = new URL(inferredBaseUrl);
  url.pathname = "/";
  url.search = "";
  url.searchParams.set("export", "pdf");

  return url.toString();
}

function buildSlideExportUrl(baseUrl: string, slideId: (typeof SLIDES)[number]) {
  const url = new URL(baseUrl);
  url.searchParams.set("slide", slideId);
  return url.toString();
}

pdfExportRouter.get("/pdf", async (req, res, next) => {
  let page;

  try {
    const browser = await getBrowser();
    const exportUrl = getExportUrl(req);

    page = await browser.newPage({
      viewport: { width: EXPORT_VIEWPORT_WIDTH, height: EXPORT_VIEWPORT_HEIGHT },
      deviceScaleFactor: 1,
    });
    await page.emulateMedia({ media: "screen" });
    const mergedPdf = await PDFDocument.create();

    for (const slideId of SLIDES) {
      const slideUrl = buildSlideExportUrl(exportUrl, slideId);
      await page.goto(slideUrl, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForFunction(
        () => {
          const exportWindow = window as Window & { __PDF_READY__?: boolean };
          return exportWindow.__PDF_READY__ === true || document.documentElement.dataset.pdfReady === "true";
        },
        { timeout: 30000 },
      );

      const slide = page.locator(".print-slide").first();
      await slide.waitFor({ state: "visible", timeout: 30000 });
      const slidePng = await slide.screenshot({
        type: "png",
        animations: "disabled",
      });

      const image = await mergedPdf.embedPng(slidePng);
      const pdfPage = mergedPdf.addPage([PDF_PAGE_WIDTH, PDF_PAGE_HEIGHT]);
      pdfPage.drawImage(image, {
        x: 0,
        y: 0,
        width: PDF_PAGE_WIDTH,
        height: PDF_PAGE_HEIGHT,
      });
    }

    const pdf = await mergedPdf.save();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${PDF_FILENAME}"`);
    res.send(Buffer.from(pdf));
  } catch (error) {
    next(error);
  } finally {
    await page?.close();
  }
});

export { pdfExportRouter };
