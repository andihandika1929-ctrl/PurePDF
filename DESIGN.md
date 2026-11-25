# PurePDF — Design System Specification (`DESIGN.md`)

**Aesthetic Direction:** Swiss Industrial Utility (Opsi A)  
**Visual References:** Teenage Engineering (`teenage.engineering`) × Vercel (`vercel.com`)  
**Scope:** Single source of truth for typography, color tokens, surfaces, layout architecture, copywriting tone, and motion overview across `frontend/`.

---

## 1. Visual Philosophy

PurePDF must look and feel like a **calibrated precision instrument**—not a generic SaaS template or ad-heavy utility site.

- **Mechanical Honesty:** Visible 1px hairline structure, strict 4px/8px spatial rhythm, monospaced telemetry, zero decorative fluff.
- **High-Contrast Monochrome + Single Signal Accent:** Everything defaults to neutral technical gray/ink; Vermilion `#FF3700` is reserved strictly for active indicators, primary actions, and PRO AI capabilities.
- **No Rainbow Icons:** Eliminate arbitrary multi-color icon fills (`emerald`, `blue`, `amber` cards). Icons use monochrome ink (`--color-text`) and shift to `--color-accent` (`#FF3700`) on active/hover states. Semantic colors (`success`, `danger`, `warning`) are strictly for live system status feedback (toasts, validation errors, completion states).

---

## 2. Typography System

All fonts **must** be loaded via `next/font/google` in `src/app/layout.tsx` (remove render-blocking `@import url(...)` from `globals.css`) and exposed as CSS variables (`--font-display`, `--font-sans`, `--font-mono`).

| Role | Font Family | Weights | CSS Variable | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display / Headings** | `Space Grotesk` | `500, 600, 700` | `--font-display` | Hero H1, section H2, card titles, pricing figures, wordmark |
| **Body / UI** | `DM Sans` | `400, 500, 600` | `--font-sans` | Descriptions, buttons, form controls, navigation, modal body |
| **Telemetry / Mono** | `IBM Plex Mono` | `400, 500, 600` | `--font-mono` | Tool counts, file sizes, compression ratios, badges, shortcuts (`⌘K`), status pills |

### Type Scale & Hierarchy
- **Hero H1:** `clamp(2.5rem, 5.5vw, 4.5rem)`, `font-display`, `font-weight: 700`, `line-height: 1.04`, `letter-spacing: -0.035em`.
- **Section H2:** `clamp(1.75rem, 3vw, 2.5rem)`, `font-display`, `font-weight: 600`, `line-height: 1.12`, `letter-spacing: -0.025em`.
- **Card Title (H3):** `1.0625rem` (`17px`) – `1.125rem` (`18px`), `font-display`, `font-weight: 600`, `letter-spacing: -0.015em`.
- **Body / Card Description:** Minimum `0.875rem` (`14px`) with `line-height: 1.55` (replace cramped `12px` / `text-xs` body copy across tool cards and feature blocks).
- **Mono Labels / Badges:** `0.6875rem` (`11px`) – `0.75rem` (`12px`), `font-mono`, uppercase, `letter-spacing: 0.06em`, `font-variant-numeric: tabular-nums`.

---

## 3. Color & Surface Tokens

All components must consume semantic Tailwind/CSS tokens—never hardcode raw `bg-white dark:bg-zinc-900` or `text-[#ff3700]` inline. All body text pairs meet **WCAG AA (`>= 4.5:1`)** contrast.

### Light Mode (Default — Warm Technical Gray)
| Token | Hex / Value | Role |
| :--- | :--- | :--- |
| `--color-bg` | `#F4F4F2` | Main canvas background |
| `--color-surface` | `#FFFFFF` | Primary cards, workspace panels, navbar glass base |
| `--color-surface-subtle` | `#EBEBE7` | Secondary wells, inset dropzones, pill tracks |
| `--color-border` | `#E2E2DE` | Primary 1px structural hairlines |
| `--color-border-strong` | `#C8C8C2` | Hover borders, active inputs |
| `--color-text` | `#111110` | Primary ink (Contrast vs `#FFFFFF`: 18.8:1) |
| `--color-text-secondary` | `#3A3A36` | Secondary copy (Contrast vs `#FFFFFF`: 11.4:1) |
| `--color-text-muted` | `#5C5C57` | Metadata & captions (Contrast vs `#FFFFFF`: 6.7:1) |
| `--color-accent` | `#FF3700` | Signal Vermilion — primary CTA, PRO AI, active state |
| `--color-accent-hover` | `#E03100` | Hover state for accent buttons |
| `--color-on-accent` | `#FFFFFF` | Text/icons on `#FF3700` |

### Dark Mode (Carbon Precision)
| Token | Hex / Value | Role |
| :--- | :--- | :--- |
| `--color-bg` | `#0C0C0B` | Main carbon canvas |
| `--color-surface` | `#161614` | Primary cards & elevated modules |
| `--color-surface-subtle` | `#1F1F1C` | Inset controls, track backgrounds |
| `--color-border` | `#272724` | Structural 1px hairlines |
| `--color-border-strong` | `#3D3D38` | Hover borders, active inputs |
| `--color-text` | `#F5F5F3` | Primary ink (Contrast vs `#161614`: 16.8:1) |
| `--color-text-secondary` | `#C8C8C0` | Secondary copy |
| `--color-text-muted` | `#9A9A92` | Metadata & captions (Contrast vs `#161614`: 6.5:1) |
| `--color-accent` | `#FF3700` | Signal Vermilion (unchanged) |
| `--color-accent-hover` | `#FF4D1A` | Slightly brighter hover in dark mode |
| `--color-on-accent` | `#FFFFFF` | Text/icons on `#FF3700` |

### Status Tokens (Feedback Only — Not Decorative)
- `--color-success`: `#15803D` (light) / `#22C55E` (dark)
- `--color-danger`: `#BE123C` (light) / `#F43F5E` (dark)
- `--color-warning`: `#B45309` (light) / `#F59E0B` (dark)

---

## 4. Surfaces, Geometry & Elevation

- **Hairline-First Depth:** Prefer crisp `1px solid var(--color-border)` (or `box-shadow: 0 0 0 1px var(--color-border)`) over heavy diffuse drop shadows.
- **Corner Radii (Crisp Industrial):**
  - Small controls / tags: `6px` (`--radius-sm`)
  - Inputs / inner panels: `10px` (`--radius-md`)
  - Bento cards / modals: `16px` (`--radius-lg`) — tighten from overly bubbly `24px–32px`
  - Pills (tabs, primary buttons): `9999px` (`--radius-pill`)
- **Background Texture:** Subtle technical dot-grid (`24px × 24px`, `1px` dot at `6%` opacity) on the main canvas only—clean solid surfaces inside cards and workspaces.

---

## 5. Layout Architecture

### 5.1 Hero Section (Functional Utility, Not Generic Centered SaaS)
- Compact asymmetric or split header with:
  1. **Live Telemetry Pill:** `LOCAL WASM ENGINE • {TOOLS.length} TOOLS • ZERO RETENTION`
  2. **Sharp Display H1** (`Space Grotesk`) + concise 1-sentence value proposition (`DM Sans`).
  3. **Command Search Bar (`⌘K`)** with instant tool filtering + quick-launch pills for top 4 actions (`Compress`, `Merge`, `PDF to Word`, `Force Unlock`).

### 5.2 True Asymmetric Bento Grid (Eliminate "Wall of Cards")
- **Featured Row (Top):** When category is `All` and search is empty, highlight the **3–4 flagship tools** (e.g., `Compress PDF`, `Merge PDF`, `Force Unlock PRO`, `High-Accuracy PDF to Word PRO`) in an asymmetric Bento row (`lg:col-span-2` hero cards with mini technical spec tags like `UP TO 85% SMALLER` / `99.4% TABLE FIDELITY`).
- **Tool Catalog Grid:** Below the featured row, organize remaining tools in a crisp 3-column (`lg:grid-cols-3`) or 4-column (`xl:grid-cols-4`) hairline modular grid with strict card anatomy:
  - Top: Monochrome icon in a `36px × 36px` precision square + mono category/PRO tag.
  - Middle: `Space Grotesk` title + `14px` 2-line description.
  - Bottom: 1px divider + runtime indicator (`LOCAL` or `PRO AI`) + subtle arrow cue (`→`).

### 5.3 Consolidated Trust & Architecture Block
- **Merge** the two redundant homepage sections (*"Mengapa PurePDF?"* 4-card grid + *"Feature Highlights"* 3-card grid) into **one cohesive 4-module Swiss spec grid** (e.g., `01 / Local WebAssembly`, `02 / Zero Server Retention`, `03 / Vector Precision`, `04 / Offline-Ready PWA`), numbered in `IBM Plex Mono` with monochrome iconography.

### 5.4 Workspace & States
- Every tool workspace (`[toolSlug]/page.tsx`, `DropzoneUploader.tsx`) must cleanly implement all 4 states:
  - **Empty / Idle:** Precision dashed dropzone with file constraints in mono.
  - **Loading / Processing:** Deterministic progress bar (`#FF3700`) + live stage telemetry.
  - **Success:** Crisp file-size delta (`4.8 MB → 612 KB / -87%`) + primary download CTA.
  - **Error:** High-contrast danger callout with concrete recovery action.

---

## 6. Copywriting Discipline (Anti-AI Slop)

- **Voice:** Direct, technical, honest, utility-first. Zero hype buzzwords (*"uncompromising"*, *"bank-grade"*, *"neural magic"*, *"seamless"*).
- **Dynamic Single Source of Truth:** Always compute tool counts dynamically from `TOOLS.length` (and `standardTools.length` / `proTools.length`). Eliminate all hardcoded conflicts (`21` vs `26` vs `31`).
- **Pricing Integrity:**
  - Permanently remove internal jargon leaks (`"TRANSPARENT DECOY TIERS"`, `"DECOY VALUE"`). Rename tiers cleanly (e.g., `Starter`, `Standard`, `Power`, `VVIP Unlimited`).
- **Truthful Ad Disclosure:** Replace contradictory *"Tanpa Iklan"* claims on the homepage with honest framing: *"Clean, non-intrusive workspace — zero pop-ups. Go VVIP for 100% ad-free instant downloads."*

---

## 7. Motion Overview

PurePDF uses **Framer Motion** (`framer-motion`) + **Lenis** (`lenis`) with mechanical, low-overshoot spring physics. Full presets, easing curves, scroll configuration, and component choreography are specified in [`MOTION.md`](./MOTION.md).
