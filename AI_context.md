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

The visual system is based on the existing May I website and its source code:

- Live website: https://www.mayiguide.com
- GitHub repo: https://github.com/May-I-LLC/MayIWebsite

The design tokens were confirmed from the live site and the source repo.

### Brand Tokens

- `--mi-primary: #906323`
- `--mi-primary2: #7A531D`
- `--mi-accent: #8B4513`
- `--mi-copper: #906323`
- `--mi-bg: #001810`
- `--mi-surface: #003320`
- `--mi-border: #004A2E`
- `--mi-text: #FFFFFF`
- `--mi-muted: #A8C4B8`

### Visual Language

Other agents should preserve the existing May I brand direction:

- dark evergreen / deep green background
- copper-gold accent color
- white headlines
- muted green body copy
- glassy or translucent green surfaces with subtle borders
- soft blurred background blooms rather than loud gradients
- premium, restrained product-marketing tone
- presentation-like composition, not a busy dashboard

### Component / Layout Patterns

The source site uses these patterns, and this investor site should generally keep them:

- sticky translucent header
- large headline typography with relatively sparse body copy
- bordered surface cards with backdrop blur
- copper gradient CTA treatment
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
