# May I design system — portable reference

A premium green-and-gold design system (Aston Martin–inspired), built as CSS custom
properties (OKLCH) + Tailwind + React components. Two themes: **light "Champagne & Forest"**
(default) and **dark "Deep Emerald & Brass"**, switched via `data-theme` on `<html>`.

This file is self-contained: copy it into another repo and hand it to an AI assistant
there to port the system. It is a snapshot (2026-10-13) of
`MayiCommsCustomerCenter/src/components/ui/*` (tokens.css, colorScheme.ts and the components) — if those files have
moved on since, prefer them.

## Non-negotiable rules

1. **Fills, not outlines.** Chips, buttons, and nested cards use solid fills to show
   hierarchy, not borders. The only borders are: a hairline on the outer `Card`, a focus
   ring, and the floating shadow on `raised` cards.
2. **Contrast ≥ 4.5:1, always check both themes.** `--gold`/`--green` are for solid
   fills (paired with their `-fg`/`on-*` text token) or as accents on a neutral
   surface (headings, nav, thin borders) — never as body-copy color on a matching-hue
   background. In dark mode, `--text-on-accent` on `--green` is only 1.36:1 — that's why
   `--text-on-green` exists as a separate token (see comments in the CSS below).
3. **Depth = stepped fills**, not borders: `surface` → `surface-nested` → `inset`, each a
   touch darker (dark theme) or a touch more saturated (light theme).
4. **Headings are Cormorant Garamond** (weight 600), **everything else is Work Sans**
   (400–700). Uppercase labels (eyebrows, nav, chips) stay in Work Sans even though they
   look like headings — see the CSS guard in Fonts & global rules below.
5. **One status chip per card.** `accent`/`gold`/`green` chip variants are statuses;
   `neutral` is for tags, and you can have several.
6. Ask before introducing a color outside this palette or a third theme.

## Fonts

Google Fonts, loaded via `next/font/google` (or `<link>` if not using Next.js):

- **Work Sans**: `wght@400;500;600;700`
- **Cormorant Garamond**: `wght@500;600;700`

```ts
// Next.js
import { Cormorant_Garamond, Work_Sans } from 'next/font/google'
const workSans = Work_Sans({ subsets: ['latin'], weight: ['400','500','600','700'], variable: '--font-work-sans', display: 'swap' })
const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['500','600','700'], variable: '--font-cormorant', display: 'swap' })
// <html className={`${workSans.variable} ${cormorant.variable}`}>
```

```css
/* globals.css */
body { font-family: var(--font-work-sans), system-ui, sans-serif; }
/* Uppercase headings are eyebrow labels, not display type: they stay in Work Sans. */
:is(h1, h2, h3):not(.uppercase), .font-heading {
  font-family: var(--font-cormorant), Georgia, serif;
  font-weight: 600;
}
:root[data-theme="dark"] :is(:is(h1, h2, h3):not(.uppercase), .font-heading) {
  color: var(--text-heading); /* gold in dark */
}
```

## Theme switching

Persisted in `localStorage` under `mayi-theme`; applied via `data-theme` on `<html>`,
set by an inline script in `<head>` **before first paint** to avoid a flash:

```ts
// components/ui/colorScheme.ts
export type Theme = 'light' | 'dark'
export const THEME_STORAGE_KEY = 'mayi-theme'
export const THEME_INIT_SCRIPT =
  `try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t)}catch(e){}`
export function readTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
}
export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme)
  try { localStorage.setItem(THEME_STORAGE_KEY, theme) } catch {}
}
```

```html
<html data-theme="light"><head><script>/* THEME_INIT_SCRIPT inlined */</script></head>
```

## Tokens (full CSS)

Save as `tokens.css` and `@import` it (or inline) before any component CSS.

```css
/*
 * Design tokens — "Champagne & Forest" (light, default) / "Deep Emerald & Brass" (dark).
 * Theme is selected by data-theme on <html>. Extend this set rather than adding one-off colors.
 *
 * Contrast rule: --gold / --green are for solid-fill chips, buttons, avatars (with --text-on-gold /
 * --text-on-accent) or accents on neutral surfaces (headings, nav labels, borders). Never use them
 * as body-copy color on a same-hue background.
 */
:root,
:root[data-theme="light"] {
  color-scheme: light;
  --bg-page: oklch(0.955 0.02 78);
  --bg-surface: oklch(0.985 0.008 80);
  --bg-surface-nested: oklch(0.955 0.02 78);
  --border: oklch(0.3 0.02 90 / 0.1);
  --border-strong: oklch(0.34 0.06 150 / 0.4);

  --text-primary: oklch(0.2 0.015 90);
  --text-secondary: oklch(0.42 0.015 90);
  --text-muted: oklch(0.55 0.01 90);
  --text-on-accent: oklch(0.985 0.008 80);
  --text-on-gold: oklch(0.2 0.02 90);

  --green: oklch(0.34 0.06 150);
  --gold: oklch(0.7 0.12 80);

  /* Derived roles (built from the palette above, plus the prototype's neutral/inset fills). */
  --text-on-green: var(--text-on-accent); /* 10.97:1 on --green */
  --text-heading: var(--text-primary);
  --accent: var(--green);
  --accent-fg: var(--text-on-accent);
  --gold-text: oklch(0.52 0.1 75);         /* gold labels on light surfaces: 5.4:1 (raw --gold is 2.6:1) */
  --cta-bg: var(--gold);                   /* gold CTA in both themes, per prototype: 6.7:1 */
  --cta-fg: var(--text-on-gold);
  --chip-neutral-bg: oklch(0.88 0.018 80);  /* distinct from the inset layer (0.925) */
  --chip-neutral-fg: var(--text-primary);
  --border-nested: transparent;            /* nested cards are fill-only */
  --bg-inset: oklch(0.925 0.01 80);        /* audio panel, recessed wells, third nesting level */
  --input-bg: var(--bg-surface);
  --input-fg: var(--text-primary);
  --input-placeholder: var(--text-muted);
  --shadow-card: 0 1px 2px oklch(0.2 0.02 90 / 0.06);
  /* Raised panels float over the canvas. */
  --shadow-raised: 0 18px 48px oklch(0.2 0.02 90 / 0.16);
  /* Page canvas: soft gold glow top-left, green top-right. */
  --canvas:
    radial-gradient(circle at top left, oklch(0.7 0.12 80 / 0.16) 0%, transparent 30%),
    radial-gradient(circle at top right, oklch(0.34 0.06 150 / 0.1) 0%, transparent 28%),
    var(--bg-page);

  /* Chart series — charts only, never general UI. Each clears 3:1 against --bg-surface. */
  --chart-total: oklch(0.62 0.13 75);
  --chart-completed: oklch(0.5 0.13 150);
  --chart-failed: oklch(0.55 0.19 20);
  --chart-in-progress: oklch(0.52 0.12 245);
  --chart-hourly: oklch(0.5 0.14 300);
}

:root[data-theme="dark"] {
  color-scheme: dark;
  /*
   * Layered emerald: a sage-slate outer surface, with each nesting level stepping DARKER.
   * Surface is L 0.37 so gold headings (4.75:1) and sage text (5.6:1) pass on it.
   */
  --bg-page: oklch(0.17 0.03 165);
  --bg-surface: oklch(0.37 0.025 156);
  --bg-surface-nested: oklch(0.288 0.032 165);
  --border: oklch(0.367 0.066 156);
  --border-strong: oklch(0.7 0.1 80 / 0.35);

  --text-primary: oklch(0.96 0.015 90);
  --text-secondary: oklch(0.8 0.028 167);  /* sage: 5.6:1 on surface, 7.6:1 on nested */
  --text-muted: oklch(0.76 0.02 160);      /* 4.8:1 on surface */
  --text-on-accent: oklch(0.15 0.03 165);
  --text-on-gold: oklch(0.18 0.02 90);

  --green: oklch(0.367 0.066 156);
  --gold: oklch(0.76 0.135 83);

  /* --text-on-accent on dark --green is 1.36:1, so green fills carry light ink instead (12.8:1). */
  --text-on-green: var(--text-primary);
  --text-heading: var(--gold);             /* serif headings go brass in dark: 8.4:1 on surface */
  --accent: var(--gold);
  --accent-fg: var(--text-on-gold);
  --gold-text: var(--gold);
  --cta-bg: var(--gold);
  --cta-fg: var(--text-on-gold);
  --chip-neutral-bg: oklch(0.44 0.025 156);
  --chip-neutral-fg: var(--text-primary);
  --border-nested: transparent;            /* fill-only layering, both themes */
  --bg-inset: oklch(0.256 0.031 167);      /* third layer: one step darker than nested */
  /* Cream inputs on the dark layers (deliberate contrast against the emerald panels). */
  --input-bg: oklch(0.985 0.007 89);
  --input-fg: oklch(0.2 0.015 90);
  --input-placeholder: oklch(0.55 0.008 89); /* 4.65:1 */
  --shadow-card: 0 1px 2px oklch(0 0 0 / 0.25);
  /* A near-black page needs a much deeper shadow for a panel to read as lifted. */
  --shadow-raised: 0 22px 56px oklch(0 0 0 / 0.6), 0 2px 6px oklch(0 0 0 / 0.35);
  --canvas:
    radial-gradient(circle at top left, oklch(0.76 0.135 83 / 0.14) 0%, transparent 32%),
    radial-gradient(circle at top right, oklch(0.367 0.066 156 / 0.4) 0%, transparent 30%),
    linear-gradient(180deg, oklch(0.21 0.03 165) 0%, var(--bg-page) 36%, oklch(0.14 0.028 165) 100%);

  /* Chart series: lighter so marks clear 3:1 on the sage surface. */
  --chart-total: oklch(0.8 0.13 83);
  --chart-completed: oklch(0.78 0.15 150);
  --chart-failed: oklch(0.76 0.14 20);
  --chart-in-progress: oklch(0.79 0.09 240);
  --chart-hourly: oklch(0.79 0.1 300);
}
```

Apply the page canvas and base text:

```css
html { background: var(--bg-page); }
body { min-height: 100vh; color: var(--text-primary); background: var(--canvas); }
::selection { background: color-mix(in oklch, var(--gold) 45%, transparent); color: var(--text-primary); }
```

### Token reference table

| Token | Role |
|---|---|
| `--bg-page` | Page canvas background |
| `--bg-surface` | Top-level card/panel fill |
| `--bg-surface-nested` | One level of nesting inside a card |
| `--bg-inset` | Two levels of nesting (recessed wells, audio bar) |
| `--border` / `--border-strong` | Hairline borders (mostly unused per the fills rule, kept for focus/raised edges) |
| `--text-primary` / `--text-secondary` / `--text-muted` | Body text, in descending emphasis |
| `--text-heading` | Serif heading color (near-black in light, gold in dark) |
| `--green` / `--gold` | Brand hues — solid fills only (chips, buttons, avatars) or thin accents |
| `--text-on-accent` / `--text-on-gold` / `--text-on-green` | Paired text color for each solid fill |
| `--accent` / `--accent-fg` | Theme's primary color (green in light, gold in dark) + its paired text |
| `--gold-text` | Gold **text on a neutral surface** (not a gold fill) — passes 4.5:1 in light where raw `--gold` doesn't |
| `--cta-bg` / `--cta-fg` | Primary button fill (gold in both themes) |
| `--chip-neutral-bg` / `--chip-neutral-fg` | Neutral chip/secondary-button fill |
| `--shadow-raised` | Drop shadow for panels that "float over the canvas" |
| `--canvas` | Full page background (gradient glow + `--bg-page`) |

## Tailwind mapping

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss'
import defaultColors from 'tailwindcss/colors'

// Token-backed color that still supports Tailwind opacity modifiers (bg-surface/50).
const tok = (v: string) => `color-mix(in oklch, var(${v}) calc(<alpha-value> * 100%), transparent)`

const config: Config = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-work-sans)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-cormorant)', 'Georgia', 'serif'],
      },
      colors: {
        page: tok('--bg-page'),
        surface: tok('--bg-surface'),
        'surface-nested': tok('--bg-surface-nested'),
        line: tok('--border'),
        'line-strong': tok('--border-strong'),
        'line-nested': tok('--border-nested'),
        ink: {
          DEFAULT: tok('--text-primary'),
          secondary: tok('--text-secondary'),
          muted: tok('--text-muted'),
          'on-accent': tok('--text-on-accent'),
          'on-gold': tok('--text-on-gold'),
          'on-green': tok('--text-on-green'),
          heading: tok('--text-heading'),
        },
        green: { ...defaultColors.green, DEFAULT: tok('--green') }, // keep Tailwind's green-* scale
        gold: tok('--gold'),
        'gold-text': tok('--gold-text'),
        accent: { DEFAULT: tok('--accent'), fg: tok('--accent-fg') },
        cta: { DEFAULT: tok('--cta-bg'), fg: tok('--cta-fg') },
        chip: { neutral: tok('--chip-neutral-bg'), 'neutral-fg': tok('--chip-neutral-fg') },
        inset: tok('--bg-inset'),
      },
    },
  },
}
export default config
```

Also add a `.keep-round { border-radius: 9999px !important; }` utility if your base
styles force square corners anywhere (avatars and pill shapes need to opt out of that).

## Components

All components live under `src/components/ui/`, share a `cn()` class-join helper, and
are re-exported from a single `index.ts`. Paste each file as-is; only import paths
(`./colorScheme`, `../colorScheme`) need adjusting to your repo's alias conventions.

```ts
// cn.ts
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
```

### Card

```tsx
import type { HTMLAttributes } from 'react'
import { cn } from './cn'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  /** Use inside another Card (e.g. a lead inside a pipeline column). Fill-only in light, bordered in dark. */
  nested?: boolean
  /** Third level, inside a nested card: one step further (darker in dark mode). */
  inset?: boolean
  /** Floats over the page canvas: deeper shadow, no edge, 16px corners. For top-level page panels. */
  raised?: boolean
  /** No padding, for cards whose children manage their own (e.g. a header plus a scrolling list). */
  flush?: boolean
}

export function Card({ nested = false, inset = false, raised = false, flush = false, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'border',
        inset
          ? 'rounded-[10px] border-line-nested bg-inset'
          : nested
            ? 'rounded-[10px] border-line-nested bg-surface-nested'
            : raised
              ? 'rounded-2xl border-transparent bg-surface shadow-[var(--shadow-raised)]'
              : 'rounded-xl border-line bg-surface',
        !flush && (nested || inset ? 'p-4' : 'p-5 sm:p-6'),
        className,
      )}
      {...props}
    />
  )
}
```

### SectionHeader

```tsx
import type { ElementType, ReactNode } from 'react'
import { cn } from './cn'

type SectionHeaderProps = {
  title: ReactNode
  /** Small right-aligned metadata line, e.g. "4 · $22,795". */
  meta?: ReactNode
  as?: ElementType
  /** lg: case/session titles; md: pipeline columns. */
  size?: 'md' | 'lg'
  className?: string
}

export function SectionHeader({ title, meta, as: Tag = 'h2', size = 'md', className }: SectionHeaderProps) {
  return (
    <div className={cn('mb-4 flex items-baseline justify-between gap-3', className)}>
      <Tag className={cn('font-heading font-semibold leading-tight text-ink-heading', size === 'lg' ? 'text-[24px]' : 'text-[21px]')}>{title}</Tag>
      {meta ? <span className="shrink-0 text-[12px] font-medium text-ink-secondary">{meta}</span> : null}
    </div>
  )
}
```

### StatusChip

```tsx
import type { HTMLAttributes } from 'react'
import { cn } from './cn'

/**
 * accent  — the theme's primary state (green in light, gold in dark), e.g. "New inquiry"
 * gold / green — fixed-hue fills when the meaning is tied to the hue, not the theme
 * neutral — quiet solid fill: secondary states ("Scheduled") and tags ("Schedule", "Follow-up 1")
 *
 * All chips are solid fills — no outlined variant.
 */
export type StatusChipVariant = 'accent' | 'gold' | 'green' | 'neutral'

const VARIANTS: Record<StatusChipVariant, string> = {
  accent: 'border-transparent bg-accent text-accent-fg',
  gold: 'border-transparent bg-gold text-ink-on-gold',
  green: 'border-transparent bg-green text-ink-on-green',
  neutral: 'border-transparent bg-chip-neutral text-chip-neutral-fg',
}

/** At most one accent/gold/green status chip per card; neutral tags are not limited. */
export function StatusChip({
  variant = 'neutral',
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: StatusChipVariant }) {
  return (
    <span
      className={cn(
        'inline-block rounded border px-2 py-1 text-[10px] font-semibold uppercase leading-none tracking-[0.05em]',
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  )
}
```

### PillBadge

```tsx
import type { HTMLAttributes } from 'react'
import { cn } from './cn'

/** Solid gold pill, e.g. "VIP". */
export function PillBadge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-block rounded-[10px] bg-gold px-2 py-[3px] text-[9px] font-bold uppercase leading-none tracking-[0.05em] text-ink-on-gold',
        className,
      )}
      {...props}
    />
  )
}
```

### Avatar

```tsx
import { cn } from './cn'

type AvatarProps = {
  name?: string
  size?: 28 | 32
  /** Neutral fill for generic/unknown users. */
  neutral?: boolean
  className?: string
}

function initials(name?: string): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

export function Avatar({ name, size = 32, neutral = false, className }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size }}
      className={cn(
        'keep-round inline-flex shrink-0 items-center justify-center text-[11px] font-semibold',
        neutral ? 'bg-chip-neutral text-chip-neutral-fg' : 'bg-green text-ink-on-green',
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}
```

### Button

```tsx
import type { ButtonHTMLAttributes } from 'react'
import { cn } from './cn'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary'
}

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-[13.5px] font-bold transition-opacity ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50'

const VARIANTS = {
  // Gold rounded rectangle (6px) with dark text in both themes.
  primary: 'bg-cta text-cta-fg hover:opacity-90',
  // Solid neutral fill — no outlined secondary button.
  secondary: 'bg-chip-neutral text-chip-neutral-fg hover:opacity-80',
}

export function Button({ variant = 'primary', className, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={cn(BASE, VARIANTS[variant], className)} {...props} />
}
```

### NavLabel

```tsx
import type { ButtonHTMLAttributes } from 'react'
import { cn } from './cn'

/** Uppercase nav item. Active = accent (green light / gold dark); inactive = muted. */
export function NavLabel({
  active = false,
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type={type}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'text-[11px] font-bold uppercase tracking-[0.1em] transition-colors hover:text-ink',
        active ? 'text-accent' : 'text-ink-muted',
        className,
      )}
      {...props}
    />
  )
}
```

### AudioBar

```tsx
import { Pause, Play } from 'lucide-react' // or any icon set — swap the two glyphs
import { cn } from './cn'

type AudioBarProps = {
  playing?: boolean
  /** 0–1 */
  progress?: number
  duration?: string
  onToggle?: () => void
  className?: string
}

/** Presentational: wire `playing`/`progress` to an <audio> element in the caller. */
export function AudioBar({ playing = false, progress = 0, duration, onToggle, className }: AudioBarProps) {
  const pct = Math.min(1, Math.max(0, progress)) * 100
  return (
    <div className={cn('flex items-center gap-4 rounded-lg bg-inset px-5 py-3.5', className)}>
      <button
        type="button"
        onClick={onToggle}
        aria-label={playing ? 'Pause' : 'Play'}
        className="keep-round flex h-9 w-9 shrink-0 items-center justify-center bg-accent text-accent-fg transition-opacity hover:opacity-90"
      >
        {playing ? <Pause className="h-3.5 w-3.5" fill="currentColor" /> : <Play className="ml-0.5 h-3.5 w-3.5" fill="currentColor" />}
      </button>
      <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-line-strong" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
        <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
      {/* Secondary, not muted: muted text fails 4.5:1 on the inset well. */}
      {duration ? <span className="text-[12px] font-medium tabular-nums text-ink-secondary">{duration}</span> : null}
    </div>
  )
}
```

### Alert

```tsx
import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import type { HTMLAttributes } from 'react'
import { cn } from './cn'

export type AlertTone = 'warning' | 'error' | 'success' | 'info'

// Fill-only (no outline), 6px corners like Button. Text is always --text-primary so it reads in both
// themes; the tone lives in the tinted fill and the icon color.
const TONES: Record<AlertTone, { box: string; icon: string; Icon: typeof Info }> = {
  warning: { box: 'bg-gold/20', icon: 'text-gold-text', Icon: Info },
  error: { box: 'bg-rose-500/15', icon: 'text-rose-600', Icon: AlertCircle },
  success: { box: 'bg-accent/15', icon: 'text-accent', Icon: CheckCircle2 },
  info: { box: 'bg-chip-neutral', icon: 'text-ink-secondary', Icon: Info },
}

export function Alert({ tone = 'info', className, children, ...props }: HTMLAttributes<HTMLDivElement> & { tone?: AlertTone }) {
  const { box, icon, Icon } = TONES[tone]
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cn('flex items-start gap-2 rounded-md p-3 text-sm text-ink', box, className)} {...props}>
      <Icon className={cn('mt-0.5 h-4 w-4 flex-shrink-0', icon)} />
      <div className="min-w-0">{children}</div>
    </div>
  )
}
```

### Eyebrow

```tsx
import type { HTMLAttributes } from 'react'
import { cn } from './cn'

type EyebrowProps = HTMLAttributes<HTMLParagraphElement> & {
  /** gold: a branded label such as "May I Intelligence" (uses --gold-text, which passes on light surfaces). */
  tone?: 'muted' | 'gold'
  /** Draw a hairline under the label, for sidebar sub-sections. */
  rule?: boolean
}

/** Small uppercase label above a group: "Capture · Lead pipeline", "Upcoming". */
export function Eyebrow({ tone = 'muted', rule = false, className, ...props }: EyebrowProps) {
  return (
    <p
      className={cn(
        'text-[11px] font-semibold uppercase tracking-[0.1em]',
        tone === 'gold' ? 'text-gold-text' : 'text-ink-secondary',
        rule && 'border-b border-line pb-2.5',
        className,
      )}
      {...props}
    />
  )
}
```

### BrandMark

```tsx
import Image from 'next/image' // swap for a plain <img> outside Next.js
import { cn } from './cn'

/** Logo + wordmark + tagline, as used in the app header. Swap the src/alt/copy for your brand. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Image src="/logo.png" alt="Logo" width={40} height={40} unoptimized className="shrink-0 object-contain" />
      <div className="leading-none">
        <p className="font-heading text-[22px] font-semibold text-ink-heading">Brand Name</p>
        <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-ink-secondary">Tagline</p>
      </div>
    </div>
  )
}
```

### LeadCard (composite example)

```tsx
import type { ReactNode } from 'react'
import { Card } from './Card'
import { StatusChip, type StatusChipVariant } from './StatusChip'
import { cn } from './cn'

type LeadCardProps = {
  name: string
  /** Short date, e.g. "Jul 22". */
  date?: string
  detail?: ReactNode
  status?: { label: string; variant?: StatusChipVariant }
  /** Preformatted, e.g. "$8,000". */
  value?: string
  onClick?: () => void
  className?: string
}

/** A lead/case inside a pipeline column. */
export function LeadCard({ name, date, detail, status, value, onClick, className }: LeadCardProps) {
  const body = (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <p className="truncate text-[15.5px] font-bold text-ink">{name}</p>
        {date ? <span className="shrink-0 text-[11px] text-ink-secondary">{date}</span> : null}
      </div>
      {detail ? <p className="mt-1 text-[13.5px] font-medium text-ink-secondary">{detail}</p> : null}
      {status || value ? (
        <div className="mt-3 flex items-center justify-between gap-3">
          {status ? <StatusChip variant={status.variant ?? 'neutral'}>{status.label}</StatusChip> : <span />}
          {value ? <span className="text-[15.5px] font-bold tabular-nums text-ink">{value}</span> : null}
        </div>
      ) : null}
    </>
  )
  return (
    <Card nested className={cn(onClick && 'cursor-pointer transition-colors hover:border-line-strong', className)} onClick={onClick}>
      {body}
    </Card>
  )
}
```

### ThemeToggle

```tsx
'use client'
import { Moon, Sun } from 'lucide-react'
import { useSyncExternalStore } from 'react'
import { applyTheme, readTheme, type Theme } from '../colorScheme' // adjust path
import { cn } from './cn'

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => observer.disconnect()
}

/** Current theme plus a toggle; persists the choice. */
export function useColorScheme() {
  const theme = useSyncExternalStore<Theme>(subscribe, readTheme, () => 'light')
  const next: Theme = theme === 'dark' ? 'light' : 'dark'
  return { theme, next, toggle: () => applyTheme(next) }
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, next, toggle } = useColorScheme()
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      className={cn('flex h-10 w-10 items-center justify-center text-accent transition-opacity hover:opacity-80', className)}
    >
      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  )
}
```

### Filled icons (Lucide is outline-only — fill explicitly)

```tsx
// CallIcon.tsx
import { Phone, type LucideProps } from 'lucide-react'
/** Lucide's phone, filled, with a thin 1px edge. Use for every call action. */
export function CallIcon(props: LucideProps) {
  return <Phone fill="currentColor" strokeWidth={1} {...props} />
}
```

```tsx
// CrmIcon.tsx
import { UsersRound, type LucideProps } from 'lucide-react'
export function CrmIcon(props: LucideProps) {
  return <UsersRound fill="currentColor" strokeWidth={1} {...props} />
}
```

```tsx
// SettingsIcon.tsx — Lucide's gear has no hole when filled; this is the Heroicons Solid
// cog-6-tooth path instead (MIT licensed, © Tailwind Labs — github.com/tailwindlabs/heroicons)
import type { SVGProps } from 'react'
export function SettingsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path fillRule="evenodd" clipRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 0 0-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 0 0-2.282.819l-.922 1.597a1.875 1.875 0 0 0 .432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 0 0 0 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 0 0-.432 2.385l.922 1.597a1.875 1.875 0 0 0 2.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 0 0 2.28-.819l.923-1.597a1.875 1.875 0 0 0-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 0 0 0-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 0 0-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 0 0-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 0 0-1.85-1.567h-1.843ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" />
    </svg>
  )
}
```


### Conversation & status components

Message bubbles, call/sentiment/patient-tier badges, and chart colours. Failed and negative states use Tailwind's `rose-600` (white text, 4.7:1), the same red as the error `Alert`.

```tsx
// MessageBubble.tsx
import type { ReactNode } from 'react'
import { cn } from './cn'

export type MessageBubbleRole = 'caller' | 'staff' | 'agent'

// Caller bubbles are the gold CTA fill with dark text; staff cream (surface); AI agent neutral.
// Text colour comes from the bubble class only, so nothing inside can override it.
const BUBBLE: Record<MessageBubbleRole, string> = {
  caller: 'bg-cta text-cta-fg',
  staff: 'bg-surface text-ink',
  agent: 'bg-chip-neutral text-chip-neutral-fg',
}

const LABEL: Record<MessageBubbleRole, string> = {
  caller: 'text-accent',
  staff: 'text-ink-secondary',
  agent: 'text-ink-secondary',
}

type MessageBubbleProps = {
  role: MessageBubbleRole
  /** Header line shown above the bubble, usually only on the first message of a run. */
  header?: { label: string; icon?: ReactNode; timestamp?: string } | null
  children: ReactNode
  className?: string
}

/** One message in a call transcript or text thread. The caller's messages sit on the right. */
export function MessageBubble({ role, header, children, className }: MessageBubbleProps) {
  const isCaller = role === 'caller'
  const timestamp = header?.timestamp ? <span className="text-ink-muted">{header.timestamp}</span> : null

  return (
    <div className={cn('flex max-w-[75%] flex-col', isCaller ? 'items-end' : 'items-start', className)}>
      {header ? (
        <div
          className={cn(
            'mb-1.5 flex items-center gap-2 px-1 text-xs font-medium',
            LABEL[role],
            isCaller ? 'justify-end text-right' : 'justify-start text-left'
          )}
        >
          {isCaller ? (
            <>
              {timestamp}
              {header.icon}
              <span>{header.label}</span>
            </>
          ) : (
            <>
              <span>{header.label}</span>
              {header.icon}
              {timestamp}
            </>
          )}
        </div>
      ) : null}
      <div className={cn('rounded-2xl px-4 py-2.5 shadow-sm', isCaller ? 'rounded-br-sm' : 'rounded-bl-sm', BUBBLE[role])}>
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{children}</p>
      </div>
    </div>
  )
}
```

```tsx
// CallStatusBadge.tsx
import { Check, Loader2, X } from 'lucide-react'
import { cn } from './cn'

export type CallStatus = 'completed' | 'failed' | 'in-progress'

const STATUS: Record<CallStatus | 'unknown', { label: string; fill: string }> = {
  completed: { label: 'Completed', fill: 'bg-green text-ink-on-green' },
  failed: { label: 'Failed', fill: 'bg-rose-600 text-white' }, // matches the error Alert/pill rose
  'in-progress': { label: 'In Progress', fill: 'bg-chip-neutral text-chip-neutral-fg' },
  unknown: { label: 'Unavailable', fill: 'bg-chip-neutral text-chip-neutral-fg' },
}

export const getCallStatusLabel = (status?: CallStatus | null) => STATUS[status ?? 'unknown']?.label ?? STATUS.unknown.label

/** Round icon badge for a call's outcome; the label is the tooltip and the accessible name. */
export function CallStatusBadge({ status, className }: { status?: CallStatus | null; className?: string }) {
  const key = status && status in STATUS ? status : 'unknown'
  const { label, fill } = STATUS[key]
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn('keep-round inline-flex h-7 min-w-7 items-center justify-center px-1.5', fill, className)}
    >
      {key === 'completed' ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : null}
      {key === 'failed' ? <X className="h-3.5 w-3.5 stroke-[3]" /> : null}
      {key === 'in-progress' ? <Loader2 className="h-3.5 w-3.5 animate-spin stroke-[2.5]" /> : null}
      {key === 'unknown' ? <span className="keep-round h-2.5 w-2.5 bg-ink-muted" aria-hidden="true" /> : null}
    </span>
  )
}
```

```tsx
// SentimentBadge.tsx
import { cn } from './cn'

type SentimentBadgeProps = {
  /** true = positive, false = negative, null/undefined = no score yet. */
  value?: boolean | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZES = { sm: 'h-7 min-w-7 text-sm', md: 'h-9 w-9 text-base', lg: 'h-10 w-10 text-base' }

export const getSentimentLabel = (value?: boolean | null) =>
  value === undefined || value === null ? 'Sentiment unavailable' : value ? 'Positive sentiment score' : 'Negative sentiment score'

/** Round +/– badge for a call's sentiment; a neutral dot when there's no score. */
export function SentimentBadge({ value, size = 'sm', className }: SentimentBadgeProps) {
  const known = value !== undefined && value !== null
  const label = getSentimentLabel(value)
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn(
        'keep-round inline-flex shrink-0 items-center justify-center px-1.5 font-bold',
        SIZES[size],
        !known ? 'bg-chip-neutral text-chip-neutral-fg' : value ? 'bg-green text-ink-on-green' : 'bg-rose-600 text-white',
        className
      )}
    >
      {known ? (value ? '+' : '–') : <span className="keep-round h-2.5 w-2.5 bg-ink-muted" aria-hidden="true" />}
    </span>
  )
}
```

```tsx
// TierBadge.tsx
import { cn } from './cn'

export type PatientTier = 'platinum' | 'gold' | 'silver' | 'standard'

// VIP is the gold pill from the design prototype; lower tiers step down to quieter fills.
const TIERS: Record<PatientTier, string> = {
  platinum: 'bg-gold text-ink-on-gold', // VIP
  gold: 'bg-green text-ink-on-green', // Preferred
  silver: 'bg-chip-neutral text-chip-neutral-fg', // Active
  standard: 'bg-inset text-ink-secondary', // New
}

/** Patient value tier badge, e.g. "◆ VIP". */
export function TierBadge({ tier, label, className }: { tier: PatientTier; label: string; className?: string }) {
  return (
    <span
      className={cn(
        'keep-round inline-flex flex-shrink-0 items-center px-3 py-1 text-xs font-bold tracking-wide',
        TIERS[tier] ?? TIERS.standard,
        className
      )}
    >
      ◆ {label}
    </span>
  )
}
```

```ts
// chartColors.ts
// Chart colours for Recharts and similar libraries. Everything reads a CSS variable from
// tokens.css, so charts follow the active theme. The series colours (--chart-*) are for
// charts only: distinct hues the brand palette doesn't have, each 3:1+ on --bg-surface.
export const CHART_COLORS = {
  total: 'var(--chart-total)',
  duration: 'var(--chart-total)',
  completed: 'var(--chart-completed)',
  positive: 'var(--chart-completed)',
  failed: 'var(--chart-failed)',
  negative: 'var(--chart-failed)',
  inProgress: 'var(--chart-in-progress)',
  hourly: 'var(--chart-hourly)',
  grid: 'var(--border)',
  axis: 'var(--text-secondary)',
  tooltipBg: 'var(--bg-surface)',
  tooltipBorder: 'var(--border-strong)',
} as const
```

## Dependencies

- Tailwind CSS v3 (the `color-mix()` token trick and `<alpha-value>` placeholder work the
  same in v3; v4 users should adapt to `@theme` syntax).
- `lucide-react` for icons (or substitute an equivalent outline icon set — `AudioBar`,
  `Alert`, `ThemeToggle`, `CallIcon`, `CrmIcon` all use it).
- React 18+, any framework (Next.js assumed above for fonts/`next/image`/`'use client'` —
  drop those bits for a non-Next app).

## Porting checklist

1. Add the Google Fonts and the `font-heading`/`font-sans` Tailwind config.
2. Copy `tokens.css`, import it before your other global CSS.
3. Add the `html`/`body`/`::selection` base rules and the heading font-family guard.
4. Extend `tailwind.config.ts` with the `tok()` color mapping.
5. Copy `cn.ts` and each component file into `components/ui/`, export from one `index.ts`.
6. Wire up `colorScheme.ts` + the inline `THEME_INIT_SCRIPT` in your root layout's `<head>`.
7. Build a `/design-system` showcase page rendering every component/variant on every
   background layer (surface/nested/inset) in both themes — this is what catches contrast
   regressions before they ship. See `MayiCommsCustomerCenter/src/components/ui/DesignSystemShowcase.tsx`
   for the pattern, and its matching Playwright visual-regression test in
   `tests/visual/design-system.spec.ts` if you want the same screenshot-diff safety net.
