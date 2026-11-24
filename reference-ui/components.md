# Component Specifications

Extracted from daniyalalam.online according to the **replica-design** standard.

---

## 1. Bento Card (`BentoCard`)

- **Role & Visual Purpose**: Core modular structural block for grid presentations (processes, services, showcases). Features a tactile layered drop shadow and subtle ambient highlight ring.
- **Variants**:
  - `default`: Clean white surface (`#ffffff`) with subtle 1px border (`rgba(0,0,0,0.06)`).
  - `elevated`: White surface with 8px ambient frosted highlight ring (`rgba(255,255,255,0.25)`).
  - `glass`: Translucent surface with `backdrop-filter: blur(12px)`.
  - `dark`: Ink-black surface (`#141414`) with dark-mode text and subtle light border.
  - `featured`: Card adorned with ambient electric orange accent glow (`#ff3700`).
- **Sizes / Grid Spans**:
  - `sm` (col-span-1), `md` (col-span-2), `lg` (col-span-3 / full width).
  - Internal padding: `p-6` (24px) or `p-8` (32px).
  - Border radius: `rounded-2xl` (24px) or `rounded-xl` (16px).
- **States**:
  - `default`: Base layered shadow `0px 0.5px 1.25px -1.25px rgba(0,0,0,0.29), 0px 1.83px 4.76px -2.5px rgba(0,0,0,0.25), 0px 8px 20.8px -3.75px rgba(0,0,0,0.1)`.
  - `hover`: Lifts up `translateY(-2px)`, shadow expands to `--shadow-card-ambient`.
  - `focus-within`: Visible 2px focus ring with 2px offset.
- **Accessibility**:
  - Semantic `<article>` or `<div>`.
  - Heading tags follow sequential structure (`<h3>` for card titles).

---

## 2. Button (`Button`)

- **Role & Visual Purpose**: Primary call-to-action button with a high-end tactile feel. Uses a pill silhouette with both multi-stop drop shadow and deep inset bevel shadow.
- **Variants**:
  - `primary`: Deep ink black (`#000000`), white text, layered drop shadow + inset bevel shadow (`inset 0 -16px 48px #000`).
  - `accent`: Electric orange (`#ff3700`), white text, warm accent glow.
  - `secondary`: Clean white surface (`#ffffff`), black text, subtle 1px border.
  - `ghost`: Transparent background with border, fills on hover.
  - `icon`: 44px x 44px circular pill for icon-only actions (menu, close, arrows).
- **Sizes**:
  - `sm`: 36px height, `px-4 py-2`, text 13px.
  - `md`: 44px height, `px-6 py-3`, text 15px (standard CTA).
  - `lg`: 52px height, `px-8 py-3.5`, text 16px.
- **States**:
  - `default`: Fully formed tactile shadow with deep inset.
  - `hover`: Scales up `scale(1.02) translateY(-1px)`, inset bevel lights up (`inset 0 -16px 48px #404040`), icon slides forward 3px.
  - `active` / `click`: Depresses `scale(0.97) translateY(1px)`, shadow tightens.
  - `focus-visible`: 2px ring with 2px offset (`ring-2 ring-black ring-offset-2`).
  - `disabled`: Opacity 40%, cursor `not-allowed`, no scale transforms.
- **Accessibility**:
  - Real `<button>` or accessible `<a>` element with `role="button"`.
  - Clear label or `aria-label` for screen readers.

---

## 3. Sticky Navigation & Scroll Shadow (`Navbar`)

- **Role & Visual Purpose**: Floats at the top or bottom of the viewport. Adapts dynamically as the user scrolls, transitioning from transparent / resting state to elevated frosted glass with shadow.
- **Components**:
  - `wordmark`: Pill badge (`rounded-full`, 44px height, `px-6`), bold sans + italic serif branding.
  - `menu-trigger`: Pill button with hamburger / action icon.
  - `action-cta`: Embedded primary pill CTA.
- **Scroll Behavior**:
  - `initial` (at top of page): Background transparent or subtle resting pill, zero scroll shadow.
  - `scrolled` (window.scrollY > 20px):
    - Background: `rgba(255, 255, 255, 0.82)`.
    - Backdrop Filter: `blur(12px)`.
    - Border: `1px solid rgba(255, 255, 255, 0.5)`.
    - Box Shadow: `--shadow-scroll-header` (`0 1px 2px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.08), 0 16px 32px -4px rgba(0,0,0,0.06)`).
    - Transition: 250ms cubic-bezier(0.16, 1, 0.3, 1).

---

## 4. Badge & Kicker Tag (`Badge`)

- **Role & Visual Purpose**: Small label pills for categories, status indicators, and technical kickers.
- **Variants**:
  - `default`: White pill with subtle border and dark text.
  - `live` / `status`: Includes an animated pulsing green or orange dot indicator.
  - `mono`: Technical tag with `Fragment Mono` typography.
  - `accent`: Electric orange tint for high-priority highlights.
- **Tokens**: `radius-pill`, `text-xs font-mono`, `px-3 py-1`.

---

## 5. Typography Composition (`HeroHeading`)

- **Editorial Juxtaposition**:
  - Combines clean geometric sans (`Inter Display`, bold/medium) with expressive classic editorial serif (`Instrument Serif`, italic).
  - High contrast scale: 48px to 84px for hero titles.
  - Tight tracking: `-0.03em`.
  - Word reveal scroll interaction capability.
