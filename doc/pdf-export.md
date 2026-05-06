# PDF Export

## How it works

- The `Download PDF` button in the frontend hits `GET /api/export/pdf`.
- The backend opens the frontend in Playwright, one slide at a time, using `?export=pdf&slide=<id>`.
- The frontend renders the export-safe slide and sets `__PDF_READY__` / `data-pdf-ready` when fonts and images have settled.
- The backend screenshots the slide container marked with `data-export-capture="true"`.
- Each screenshot is embedded into a `16:9` PDF page sized `960 × 540` points.

Relevant files:

- `src/App.tsx`
- `src/index.css`
- `server/src/routes/pdfExport.ts`

## Why the export viewport is `1600 × 900`

The export viewport is intentionally smaller than the previously tested `2560 × 1664`.

Reason:

- The frontend slide layout uses fixed paddings, `max-width` caps, and `clamp()` font sizes.
- At a larger browser viewport, those capped elements do not keep growing proportionally.
- That means the slide screenshot contains more empty background around the content.
- When that larger-canvas screenshot is placed onto the same fixed `16:9` PDF page, the content appears smaller.

Using a `1600 × 900` Playwright viewport keeps the export in `16:9` while making the existing frontend layout occupy more of the captured slide. The PDF then looks closer to the earlier, acceptable scale without needing frontend changes.

## What to change if the PDF scale looks wrong again

If the PDF content looks too small:

1. Check the Playwright viewport in `server/src/routes/pdfExport.ts`.
2. Confirm the backend is deployed with the latest export route.
3. If viewport changes are not enough, the next lever is frontend export CSS in `src/index.css`, not PDF page size.

## Current defaults

- Playwright viewport: `1600 × 900`
- PDF page size: `960 × 540`
- Screenshot target: `[data-export-capture="true"]`
- Slide source: shared `SLIDES` list
