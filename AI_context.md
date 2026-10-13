# AI Context

## Purpose

This repository contains an investor pitch deck implemented as a website for **May I**.

The goal of the site is not to behave like a standard product marketing homepage. It should function as a **presentation-grade investor narrative** that answers three core questions:

1. What is May I building?
2. Why does it matter?
3. Why can it become a billion-dollar business?

The current website build is based on strategy and presentation materials supplied by the user, plus the design system from the live May I website and its source repo.

## Business Framing

The strongest framing from the strategy materials is:

**May I is building the AI revenue integrity engine for retail healthcare.**

This is sharper than positioning the company as only an AI receptionist or concierge. The site should emphasize:

- high-intent, elective / specialty healthcare practices
- invisible revenue loss from missed calls and slow response times
- a system that combines AI communications, CRM memory, workflow automation, and revenue outcomes
- a wedge that starts with `Capture -> Connect -> Convert`
- a path from workflow tool to system of engagement and eventually operating layer

## Narrative Outline Used

The current single-page site is structured around this outline:

1. **Hero**
   - Investor deck framing
   - Core positioning statement
   - Immediate signal that the page answers investor questions

2. **The Problem**
   - Patient experience is outdated
   - Missed demand, slow response, fragmented workflows, manual patient experience

3. **The Invisible Loss**
   - Practices lose revenue they cannot clearly see in workflow
   - Missed calls and slow speed-to-lead cause lost procedures
   - Positioning should emphasize loss aversion first, growth second

4. **What May I Is Building**
   - More than an AI receptionist
   - AI comms + CRM memory + workflow automation
   - Introduced through `Capture / Connect / Convert`

5. **Business Impact / ROI**
   - Revenue recovery
   - lower front-desk burden
   - 24/7 coverage
   - economic justification for adoption

6. **Ideal Customer + Market**
   - Focus on elective / retail healthcare categories
   - Highlight large TAM and high transaction value segments

7. **Why May I Wins**
   - Differentiate from generic AI telephony, answering services, and patient engagement tools
   - Outcome ownership matters more than basic call handling

8. **Defensibility / Why This Can Be Large**
   - Closed-loop revenue attribution
   - Patient Intent Graph
   - procedure-aware conversational models
   - dynamic trust + friction
   - practice operating memory

9. **Vision**
   - Today / Tomorrow / Future
   - Progression from repetitive front-desk workflows to an intelligent healthcare operating layer

## Key Messaging Guidance

Future edits should preserve these messaging priorities:

- Lead with **revenue integrity**, not generic efficiency.
- Focus on **retail / elective healthcare** instead of healthcare broadly.
- Treat missed calls and delayed response as **revenue leakage**, not just inconvenience.
- Position the product as a **system of engagement** while EMR/PMS remains the system of record.
- Emphasize that May I can become large because it sits where **demand, workflow, and revenue** meet.

Do not drift into generic SaaS messaging like:

- "AI-powered healthcare assistant"
- "streamline operations"
- "improve workflows"

unless those ideas are tied back to conversion, monetization, patient intent, or revenue realization.

## Style Guide Source

The visual system is ported from the May I product's own design system, documented in
[doc/design-system.md](doc/design-system.md) (a portable snapshot of
`MayiCommsCustomerCenter/src/components/ui/*`). That file is the source of truth for tokens,
components, and rules — this section is a summary tuned for this repo.

The deck ships **both** themes from the source system — light "Champagne & Forest" (default)
and dark "Deep Emerald & Brass" — switched via `data-theme` on `<html>`, ported as plain CSS
custom properties rather than the Tailwind/React component layer the source doc also offers.

### Theme switching

- [src/colorScheme.ts](src/colorScheme.ts): `Theme` type, `THEME_STORAGE_KEY`
  (`"mayi-deck-theme"`, localStorage), `readTheme()`/`applyTheme()`, and the `useColorScheme()`
  hook (subscribes to `data-theme` changes via a `MutationObserver`).
- [src/components/ThemeToggle.tsx](src/components/ThemeToggle.tsx): the Sun/Moon header
  button, wired into the header in `App.tsx`.
- [index.html](index.html): an inline `<head>` script applies the saved theme (or a
  `?theme=light|dark` query param) **before first paint**, so there's no flash of the wrong
  theme. Keep its logic in sync with `colorScheme.ts` if either changes.
- PDF export: `handleDownloadPdf` in `App.tsx` appends the live theme as `?theme=…` to the
  export request; `server/src/routes/pdfExport.ts` forwards it to every per-slide URL it asks
  Playwright to screenshot, so the exported PDF matches whatever the visitor had selected.

### Design tokens

Defined in [src/index.css](src/index.css)'s `:root, :root[data-theme="light"]` block (the
defaults) and `:root[data-theme="dark"]` block (overrides). Both blocks define the same set of
custom properties — use these, and do not add new colors without checking the rule below first.

- Surfaces (each nesting level a step darker in dark / more saturated in light): `--bg-page`,
  `--bg-surface`, `--bg-surface-nested`, `--bg-inset`. RGB triplets (`--bg-page-rgb`,
  `--bg-surface-rgb`, `--bg-inset-rgb`) exist for `rgba(var(--x-rgb), alpha)` tints — **always
  use the RGB-triplet var, never a literal `r, g, b` triplet**, or the value won't switch when
  the theme does.
- Text: `--text-primary` (+ `--text-primary-rgb`), `--text-secondary` (+
  `--text-secondary-rgb`), `--text-muted`, plus paired text-on-fill colors (`--text-on-accent`,
  `--text-on-gold`, `--text-on-green`), and `--text-heading` (near-black in light, gold in dark).
- Brand: `--gold`, `--green` (plus `--gold-rgb` / `--green-rgb`), and role aliases `--accent`
  (green in light, gold in dark — the theme's primary color), `--accent-fg`, `--gold-text`,
  `--cta-bg` (gold in both themes), `--cta-fg`, `--chip-neutral-bg`, `--chip-neutral-fg`.
- `--border`, `--border-strong`, `--shadow-raised`, `--canvas` (full-page gradient background).
- Chart/diagram series — **charts and inline SVG diagrams only, never general UI**:
  `--chart-total`, `--chart-completed`, `--chart-in-progress`, `--chart-hourly`, `--chart-failed`.
- Error/negative state: `--error`, `--error-rgb`, `--error-text` (Tailwind rose-600/400/700
  equivalents, matching the source design system's error convention; `--error-text` picks the
  readable shade per theme).

**Critical constraint:** all tokens are hex/rgb, never `oklch()` or `color-mix()`. The demo
slide ([src/components/demo/useDemoLoop.ts](src/components/demo/useDemoLoop.ts)) captures the
DOM with `html2canvas` 1.4.1, which cannot parse those color functions. Keep any new color
value as hex/rgb/rgba, even if you have to convert from the source doc's OKLCH by hand — `var()`
references (including `rgba(var(--gold-rgb), .5)`) are fine, since the browser resolves them to
a plain rgba string before html2canvas reads computed styles.

**App.tsx's `DECK_COLORS` and `CCC_COLORS`** (inline SVG chart/diagram colors, and the
Capture/Connect/Convert accents) are `var()` references for exactly this reason — they
automatically follow the active theme. If you add a new inline SVG color, follow the same
pattern rather than hard-coding an rgb triplet.

### Non-negotiable rules (from doc/design-system.md)

1. **Fills, not outlines.** Cards, chips, and buttons use solid fills to show hierarchy. The
   only borders are a hairline on a top-level card (`--border`) and the shadow on a `raised`
   panel. A card nested inside another card is fill-only (`--bg-surface-nested` /
   `--bg-inset`, `border-color: transparent`) — no border.
2. Headings (anything that reads as a title, and every `h1`/`h2`/`h3` that isn't `.uppercase`)
   are **Cormorant Garamond** 600, colored `--text-heading` (gold). Everything else —
   including uppercase eyebrow/nav/chip labels — is **Work Sans** 400–700. Both are
   self-hosted via `@fontsource/work-sans` and `@fontsource/cormorant-garamond`
   ([src/main.tsx](src/main.tsx)), not Google Fonts `<link>`, to keep the Playwright PDF
   export working offline.
3. One status accent (gold or green) per card; use `--chip-neutral-bg` for everything else.
4. Capture / Connect / Convert accent colors live in `CCC_COLORS` in
   [src/App.tsx](src/App.tsx) — gold (capture), `--chart-in-progress` blue (connect),
   `--chart-completed` green (convert) — and are mirrored onto `--ccc-capture` /
   `--ccc-connect` / `--ccc-convert` CSS vars by an effect in `App.tsx`. Keep these three
   mapped to in-palette tokens; don't reintroduce the old amber `#fcd34d`/`#f59e0b`/`#b45309`.
5. Inline SVG charts/diagrams read colors from the `DECK_COLORS` constant near the top of
   `App.tsx` (mirrors the source doc's `chartColors.ts` pattern) — extend that object rather
   than hard-coding a new hex value inside a chart.
6. Ask before introducing a color outside this palette.

### Visual language

- dark emerald background with a soft gold/green canvas glow (`--canvas`)
- gold Cormorant Garamond headlines, Work Sans body copy
- solid-fill cards with a hairline border, no backdrop blur on cards (blur is reserved for the
  sticky header/footer chrome, which sits over scrolling content, not for cards)
- premium, restrained product-marketing tone; presentation-like composition, not a dashboard

### Component / Layout Patterns

- sticky translucent header/footer (these keep `backdrop-filter`; cards do not)
- large headline typography with relatively sparse body copy
- solid-fill surface cards, one hairline border, no gradient CTA — buttons are a flat
  `--cta-bg` fill with `--cta-fg` text
- subtle motion only, mostly fade-up / stagger reveal
- icon-led cards and system diagrams rather than decorative illustrations

### Tone

The visual and editorial tone should feel:

- premium
- investor-grade
- calm
- deliberate
- high-conviction

Avoid:

- startup cliches
- playful illustrations
- overly bright palette shifts
- generic purple SaaS styling
- cluttered comparison tables unless they are genuinely useful

## Current Implementation Notes

The first implementation is intentionally a focused one-page investor site. It is not yet a complete public company site.

Current source files:

- `src/App.tsx` contains the full page structure and section composition
- `src/index.css` contains the shared brand tokens and global styling
- `public/MayILogoTransparentBack.gif` is copied from the May I website repo for branding continuity

## Guidance For Future AI Agents

If you extend or revise this site:

- keep the site centered on the investor narrative, not product-marketing sprawl
- preserve the May I design tokens and brand atmosphere
- prefer stronger storytelling and better diagrams over adding more sections
- use concise, high-signal copy
- avoid flattening the narrative into generic B2B SaaS language
- if adding traction, GTM, team, or product detail sections, maintain the same tone and hierarchy
- if changing the visuals, preserve brand continuity with `mayiguide.com`

When in doubt, optimize for:

1. clarity of the investment thesis
2. premium visual restraint
3. consistency with the existing May I brand system
