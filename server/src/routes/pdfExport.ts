import { Router, Request } from "express";
import { PDFDocument } from "pdf-lib";
import { chromium, type Browser } from "playwright";
import { SLIDES, PDF_EXPORT_SLIDES as DEFAULT_PDF_EXPORT_SLIDES, type SlideId } from "../../../shared/slides.js";

const pdfExportRouter = Router();

// Override which slides get exported without touching code: set PDF_EXPORT_SLIDES
// to a comma-separated list of slide ids and/or 1-based page numbers (matching the
// site's slide order below), e.g. "hero,problem,loss,ask" or "1,2,3,16" or a mix
// like "1,problem,16". Falls back to the default (shared/slides.js) if unset or empty.
//
// Page numbers, for reference (1-based, matches localhost:5173 slide order):
//   1 hero                8 engine               15 vision              22 demo
//   2 problem             9 traction             16 ask
//   3 loss               10 founder              17 appendix
//   4 everyday-benefits   11 enterprise-grade     18 capture-detail
//   5 voice-agent         12 why-wins             19 connect-detail
//   6 qualify-experience  13 path                 20 convert-detail
//   7 qualify             14 moats                21 confirm
function resolveExportSlides(): readonly SlideId[] {
  const raw = process.env.PDF_EXPORT_SLIDES;
  if (!raw || raw.trim().length === 0) {
    return DEFAULT_PDF_EXPORT_SLIDES;
  }

  const validSlideIds = new Set<string>(SLIDES);
  const tokens = raw.split(",").map((token) => token.trim()).filter(Boolean);
  const unknown: string[] = [];

  const requested = tokens.map((token) => {
    if (/^\d+$/.test(token)) {
      const pageNumber = Number(token);
      const slideId = SLIDES[pageNumber - 1];
      if (!slideId) {
        unknown.push(`${token} (page number out of range 1-${SLIDES.length})`);
        return null;
      }
      return slideId;
    }

    if (!validSlideIds.has(token)) {
      unknown.push(token);
      return null;
    }
    return token as SlideId;
  });

  if (unknown.length > 0) {
    throw new Error(
      `PDF_EXPORT_SLIDES contains unknown entries: ${unknown.join(", ")}. ` +
        `Use a slide id or a 1-based page number (1-${SLIDES.length}). Valid ids: ${SLIDES.join(", ")}`,
    );
  }

  return requested as SlideId[];
}

const PDF_FILENAME = "MayI-Investor-Deck.pdf";
const PDF_PAGE_WIDTH = 960;
const PDF_PAGE_HEIGHT = 540;
// 1600x900 preserves the pre-change visual scale better than a larger viewport.
// The frontend slide layout uses capped widths and font sizes, so increasing the
// Playwright viewport made content look smaller on the fixed 16:9 PDF page.
const EXPORT_VIEWPORT_WIDTH = 1600;
const EXPORT_VIEWPORT_HEIGHT = 900;
const DEFAULT_FRONTEND_URL = "http://127.0.0.1:5173/";

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

function buildSlideExportUrl(baseUrl: string, slideId: SlideId) {
  const url = new URL(baseUrl);
  url.searchParams.set("slide", slideId);
  return url.toString();
}

pdfExportRouter.get("/pdf", async (req, res, next) => {
  let page;

  try {
    const exportSlides = resolveExportSlides();
    const browser = await getBrowser();
    const exportUrl = getExportUrl(req);

    page = await browser.newPage({
      viewport: { width: EXPORT_VIEWPORT_WIDTH, height: EXPORT_VIEWPORT_HEIGHT },
      deviceScaleFactor: 1,
    });
    await page.emulateMedia({ media: "screen" });
    const mergedPdf = await PDFDocument.create();

    for (const slideId of exportSlides) {
      const slideUrl = buildSlideExportUrl(exportUrl, slideId);
      await page.goto(slideUrl, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForFunction(
        (expectedSlideId) => {
          const exportWindow = window as Window & { __PDF_READY__?: boolean };
          const isReady = exportWindow.__PDF_READY__ === true || document.documentElement.dataset.pdfReady === "true";
          return isReady && document.documentElement.dataset.exportSlide === expectedSlideId;
        },
        slideId,
        { timeout: 30000 },
      );

      const slide = page.locator("[data-export-capture=\"true\"]").first();
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
