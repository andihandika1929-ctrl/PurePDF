# PurePDF — Motion & Interaction Specification (`MOTION.md`)

**Motion Identity:** Calibrated Mechanical Precision (Swiss Industrial Utility — Opsi A)  
**Stack:** `framer-motion` (`^14.14.0`) + `lenis` (`^1.3.28`)  
**Accessibility:** Mandatory `<MotionConfig reducedMotion="user">` wrapper at app root.

---

## 1. Core Motion Principles

1. **Mechanical, Never Floaty:** Movements snap into place with physical certainty—minimal bounce, short settle time (`150ms–350ms`), zero sluggish fades.
2. **GPU-Composited Only:** Animate strictly `transform` (`x`, `y`, `scale`, `rotate`), `opacity`, and `clip-path`. Never animate `width`, `height`, `top`, `left`, or `box-shadow` directly on scroll or high-frequency frames.
3. **Remove Dead CSS Animations:** Purge all unused `animate-in`, `fade-in`, and `slide-in-from-top-*` classes (from uninstalled `tailwindcss-animate`) and replace them with declarative Framer Motion `AnimatePresence` transitions.
4. **Reduced Motion First:** Wrap the application in `<MotionConfig reducedMotion="user">` inside `src/context/AppContext.tsx` (or a dedicated `MotionProvider`), and disable Lenis smooth-scroll interpolation when `window.matchMedia('(prefers-reduced-motion: reduce)').matches` is true.

---

## 2. Lenis Smooth Scroll Specification

Create a lightweight client component `src/components/providers/SmoothScrollProvider.tsx` mounted in `src/app/layout.tsx`.

```ts
// Recommended Lenis configuration for Swiss Industrial feel
const lenisConfig = {
  lerp: 0.12,           // Crisp, mechanical responsiveness (not overly syrupy)
  duration: 0.9,        // Short settle duration
  smoothWheel: true,
  wheelMultiplier: 1.0,
  touchMultiplier: 1.5,
  infinite: false,
};
```

### Lenis Guardrails
- **Modals & Drawers Lock:** Call `lenis.stop()` when `AuthModal`, `ProPaywallModal`, `AccountDrawer`, or `MegaMenu` is open; call `lenis.start()` on close.
- **Scrollable Inner Containers:** Add `data-lenis-prevent` on scrollable inner panels (e.g., `InteractiveDocumentEditor` canvas, mega-menu lists, modal bodies) so wheel events don't hijack parent page scrolling.
- **Reduced Motion Bypass:** Skip `new Lenis(...)` initialization entirely if `(prefers-reduced-motion: reduce)` matches.

---

## 3. Framer Motion Physics Presets

Centralize all transitions in `src/lib/motion.ts` so every component shares identical mechanical timing.

```ts
export const SPRINGS = {
  // Primary tactile interactions: buttons, toggles, hardware switches
  tactile: {
    type: 'spring' as const,
    stiffness: 460,
    damping: 34,
    mass: 0.75,
  },
  // Layout transitions: category filter pill (layoutId), Bento grid reflow
  mechanical: {
    type: 'spring' as const,
    stiffness: 380,
    damping: 32,
    mass: 0.9,
  },
  // Drawers, modals, mega-menu panels
  panel: {
    type: 'spring' as const,
    stiffness: 340,
    damping: 30,
    mass: 0.85,
  },
} as const;

export const EASES = {
  // Crisp industrial deceleration for opacity/clip reveals
  precision: [0.16, 1, 0.3, 1] as const,
  // Quick exit curve
  exit: [0.4, 0, 1, 1] as const,
} as const;
```

---

## 4. Component-by-Component Choreography

### 4.1 Hero Entrance (Above-the-Fold)
- **Trigger:** Immediate mount (`initial` → `animate`, no scroll delay).
- **Sequence:**
  1. Telemetry pill: `opacity: 0, y: 8` → `opacity: 1, y: 0` (`duration: 0.32`, `ease: precision`).
  2. H1 display title: `opacity: 0, y: 14` → `opacity: 1, y: 0` (`delay: 0.06`, `duration: 0.42`, `ease: precision`).
  3. Subtitle + Command Search Bar: `opacity: 0, y: 12` → `opacity: 1, y: 0` (`delay: 0.12`, `duration: 0.38`, `ease: precision`).

### 4.2 Category Filter Bar (`layoutId` Sliding Pill)
- **Element:** Active category background pill in `src/app/page.tsx`.
- **Spec:** Use Framer Motion `layoutId="active-category-pill"` with `transition={SPRINGS.mechanical}`.
- **Effect:** Switching between `All`, `PRO AI`, `Compress`, `Convert`, `Organize`, and `Security` physically slides the indicator bar across buttons instead of snapping abruptly.

### 4.3 Bento Tool Grid & Real-Time Search Reflow
- **Initial Load:** Staggered reveal (`staggerChildren: 0.025`, capped so total stagger stays under `0.35s`) with `y: 12 → 0` and `opacity: 0 → 1`.
- **Filtering / Searching:** Wrap grid items with `layout="position"` (`transition={SPRINGS.mechanical}`) and `AnimatePresence mode="popLayout"` so filtered cards glide into new grid positions smoothly.
- **Card Hover (Hardware Detent):**
  - `whileHover={{ y: -2 }}` with `SPRINGS.tactile`.
  - Icon container transitions from monochrome to `#FF3700` background/accent; corner arrow `ArrowUpRight` translates `(x: 2, y: -2)` with `opacity: 1`.
  - `whileTap={{ scale: 0.985 }}` for physical click feedback.

### 4.4 Navbar, Mega-Menu & Account Drawer
- **Floating Header Compression:** On scroll (`scrollY > 16`), transition navbar surface opacity/border cleanly via CSS/Framer without layout shift.
- **Mega-Menu Dropdown:** Replace broken `animate-in` classes with `AnimatePresence`:
  - `initial={{ opacity: 0, y: -8, scale: 0.99 }}`
  - `animate={{ opacity: 1, y: 0, scale: 1 }}`
  - `exit={{ opacity: 0, y: -6, scale: 0.99 }}`
  - `transition={SPRINGS.panel}`
- **Account Drawer & Modals (`AuthModal`, `ProPaywallModal`):**
  - Backdrop: `opacity: 0 → 1` (`duration: 0.18`).
  - Drawer: slide from `x: '100%' → 0` (`SPRINGS.panel`).
  - Modal: `opacity: 0, scale: 0.96, y: 8` → `opacity: 1, scale: 1, y: 0` (`SPRINGS.panel`).

### 4.5 Workspace Dropzone & Processing Telemetry (`DropzoneUploader.tsx`)
- **Drag-Over State:** Dropzone border shifts to `#FF3700` and scales subtly (`scale: 1.01`, `SPRINGS.tactile`); upload icon lifts (`y: -4`).
- **Processing Progress Bar:** Smooth spring-interpolated `scaleX` (`originX: 0`, `SPRINGS.mechanical`) in `#FF3700` with tabular-nums percentage readout.
- **Toast Notifications (`pricing/page.tsx` & workspace):** Replace dead `animate-in` with `AnimatePresence` slide-in from top-right (`y: -12, opacity: 0` → `y: 0, opacity: 1`, `SPRINGS.tactile`).

### 4.6 Scroll-Triggered Reveals (Below-the-Fold)
- **Trust / Spec Block & SEO Guide:** Use `whileInView={{ opacity: 1, y: 0 }}` with `viewport={{ once: true, amount: 0.2 }}` and `initial={{ opacity: 0, y: 16 }}` (`duration: 0.4`, `ease: precision`). Never re-hide content once revealed.

---

## 5. Performance Checklist (Before Shipping Phase 3)

- [ ] `<MotionConfig reducedMotion="user">` wraps the root app tree.
- [ ] Zero `animate-in` / `fade-in` / `slide-in-from-*` dead classes remain in `src/`.
- [ ] No layout thrashing: `layout="position"` used instead of full `layout` where card aspect ratios don't change.
- [ ] Lenis pauses cleanly when modals/drawers open and respects `prefers-reduced-motion`.
- [ ] 60fps verified on both desktop and mobile viewports during category filtering and scrolling.
