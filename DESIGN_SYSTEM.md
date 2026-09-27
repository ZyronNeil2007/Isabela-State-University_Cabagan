# DESIGN_SYSTEM.md — Design System Reference
# ISU Premium ID Generator · v3.8.2

> This document describes the complete visual design system as implemented in `web/style.css`. All values are sourced directly from the codebase.

---

## 1. Design Philosophy

**Apple-inspired Glassmorphism on a Dark ISU Green + Gold Palette.**

| Principle | Implementation |
|---|---|
| **Premium Dark Mode** | Deep forest-green base (`#010d01`) with layered radial gradient overlays |
| **Glassmorphism** | Multi-tier `backdrop-filter: blur()` panels with translucent borders and inset highlights |
| **Depth** | Three glass tiers (T1 main, T2 inner, T3 nav) create a layered spatial hierarchy |
| **ISU Brand Colors** | Forest green primary + gold accent — matching official ISU identity |
| **Motion** | Spring easing (`cubic-bezier(0.175, 0.885, 0.32, 1.275)`) for all interactive elements; GSAP ScrollTrigger for scroll reveals |
| **Typography** | Plus Jakarta Sans (UI) + Roboto Condensed (ID card text) from Google Fonts |
| **Performance** | Orbs use `radial-gradient` (no `filter: blur`); background in `::before` pseudo-element; mobile disables `backdrop-filter` |

---

## 2. Color Palette

### 2.1 ISU Forest Greens (Primary)
```css
--forest-950: #010d01;   /* Deepest — HTML background fill */
--forest-900: #021a02;   /* Base dark background */
--forest-800: #043904;   /* Gradient end */
--forest-700: #065806;   /* Unused — reserved */
--forest-600: #0a8a0a;   /* Unused — reserved */
--green-500:  #15B915;   /* Primary brand accent */
--green-vivid: #1ddb1d;  /* Highlight / hero gradient start */
--green-400:  #3fd43f;   /* Hover state */
--green-300:  #7fff7f;   /* Lightest — gradient end, logo text gradient */
```

### 2.2 Glow Variations (Green)
```css
--green-glow:        rgba(21, 185, 21, 0.20);
--green-glow-strong: rgba(21, 185, 21, 0.40);
--green-glow-vivid:  rgba(29, 219, 29, 0.55);
```

### 2.3 Gold Accent (Premium)
```css
--gold-600: #A07830;   /* Deepest gold — unused / reserved */
--gold-500: #C9A84C;   /* Mid-tone gold */
--gold-400: #E0C36E;   /* Default accent gold */
--gold-300: #F0D98A;   /* Light gold */
--gold-200: #FAF0C0;   /* Near-white gold */
```

### 2.4 Glow Variations (Gold)
```css
--gold-glow:        rgba(201, 168, 76, 0.25);
--gold-glow-strong: rgba(201, 168, 76, 0.50);
```

### 2.5 Neutrals
```css
--white:    #ffffff;
--white-90: rgba(255, 255, 255, 0.90);
--white-70: rgba(255, 255, 255, 0.70);
--white-50: rgba(255, 255, 255, 0.50);
--white-40: rgba(255, 255, 255, 0.40);
--white-20: rgba(255, 255, 255, 0.20);
--white-15: rgba(255, 255, 255, 0.15);
--white-12: rgba(255, 255, 255, 0.12);
--white-08: rgba(255, 255, 255, 0.08);
--white-05: rgba(255, 255, 255, 0.05);
--white-03: rgba(255, 255, 255, 0.03);
--black-60: rgba(0, 0, 0, 0.60);
--black-40: rgba(0, 0, 0, 0.40);
--black-20: rgba(0, 0, 0, 0.20);
```

### 2.6 Semantic Colors
```css
--text-primary:   var(--white);        /* Main body text */
--text-secondary: var(--white-70);     /* Subtitles, descriptions */
--text-muted:     var(--white-40);     /* Placeholders, meta labels */
--accent:         var(--green-500);    /* Brand accent, focus rings */
--accent-hover:   var(--green-400);    /* Hover state of accent */
--danger:         #ff3b30;             /* Error, delete actions */
```

### 2.7 Dynamic Campus Theme Colors (CSS Variables)
Campus theme switching overwrites these two variables at runtime via `document.documentElement.style.setProperty()`:
```css
--green-600: /* set to campus.primary */
--gold-400:  /* set to campus.accent */
```

| Campus | Primary | Accent |
|---|---|---|
| Cabagan (default) | `#0f5132` | `#d4af37` |
| Echague | `#1b365d` | `#eaaa00` |
| Cauayan | `#800020` | `#dfb15b` |
| Ilagan | `#4a154b` | `#c0c0c0` |
| Roxas | `#008080` | `#ffbf00` |
| Angadanan | `#1e4d2b` | `#b87333` |
| San Mateo | `#92400e` | `#f59e0b` |
| Jones | `#0f172a` | `#06b6d4` |
| Palanan | `#0284c7` | `#f97316` |
| San Mariano | `#047857` | `#eab308` |
| Santiago City | `#581c87` | `#f43f5e` |

---

## 3. Typography

### 3.1 Font Families
```css
--font-base: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-card: 'Roboto Condensed', 'Arial Narrow', sans-serif;
```
- `--font-base`: Used for all UI elements (body, labels, buttons, nav, forms).
- `--font-card`: Used inside the ID card canvas rendering (`ctx.font` calls in `app.js`).

### 3.2 Font Loading
Both fonts are loaded from Google Fonts via `<link rel="preconnect">` and `<link href="...fonts.googleapis.com">` in `<head>`. Canvases re-render after `document.fonts.ready` resolves to prevent font-swap layout shifts.

### 3.3 Type Scale

| Usage | Size | Weight | Notes |
|---|---|---|---|
| Hero title | `clamp(3rem, 7.5vw, 6.5rem)` | 700 | Letter-spacing: -0.04em |
| Hero subtitle | `clamp(1rem, 1.8vw, 1.2rem)` | 400 | Max-width: 540px |
| Section headings | `clamp(2rem, 4vw, 3.5rem)` | 700 | NEEDS VERIFICATION — varies by section |
| Body text | `1rem` | 400 | Line-height: 1.6 |
| Form labels | ~`0.75rem` | 600 | Letter-spacing: 0.06em, uppercase |
| Nav links | `0.875rem` | 500 | Letter-spacing: 0.01em |
| Buttons (primary) | `clamp(0.95rem, 1.5vw, 1.05rem)` | 600-700 | — |
| Toast notification | `14px` | 500 | — |
| Badge text | `0.72rem` | 600 | Letter-spacing: 0.10em, uppercase |

### 3.4 Logo Text Gradient
```css
background: linear-gradient(135deg, var(--white-90) 40%, var(--green-300) 100%);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
```

### 3.5 Hero Highlight Word Gradient (Shimmering)
```css
background: linear-gradient(135deg, var(--green-vivid) 0%, var(--green-400) 30%, var(--gold-400) 65%, var(--green-300) 100%);
background-size: 200% auto;
animation: shimmerText 4s 1.2s linear infinite;
```

---

## 4. Spacing Scale

```css
--sp-xs:  0.25rem;  /*  4px */
--sp-sm:  0.5rem;   /*  8px */
--sp-md:  0.75rem;  /* 12px */
--sp-lg:  1rem;     /* 16px */
--sp-xl:  1.5rem;   /* 24px */
--sp-2xl: 2rem;     /* 32px */
--sp-3xl: 2.5rem;   /* 40px */
```

---

## 5. Border Radius Scale

```css
--radius-sm:   8px;
--radius-md:   12px;
--radius-lg:   16px;
--radius-xl:   24px;
--radius-2xl:  32px;
--radius-full: 9999px;  /* pill shape */
```

---

## 6. Glass Tiers

The glassmorphism system uses three distinct tiers for visual depth:

### Tier 1 — Main Panels (Form, Preview, Hero)
```css
background:       rgba(255, 255, 255, 0.07);
border:           1px solid rgba(255, 255, 255, 0.16);
backdrop-filter:  blur(56px);
box-shadow:
  inset 0 1px 0 rgba(255, 255, 255, 0.26),
  inset 0 -1px 0 rgba(255, 255, 255, 0.05),
  0 32px 80px rgba(0, 0, 0, 0.55),
  0 8px 24px rgba(0, 0, 0, 0.30);
```

### Tier 2 — Inner Cards (Form Groups)
```css
background:       rgba(255, 255, 255, 0.055);
border:           1px solid rgba(255, 255, 255, 0.12);
backdrop-filter:  blur(28px);
box-shadow:
  inset 0 1px 0 rgba(255, 255, 255, 0.18),
  0 8px 28px rgba(0, 0, 0, 0.22);
```

### Tier 3 — Nav / Footer Elements
```css
background:       rgba(255, 255, 255, 0.04);
border:           1px solid rgba(255, 255, 255, 0.10);
backdrop-filter:  blur(24px);
```

> **Mobile Rule (≤ 860px)**: All `backdrop-filter` calculations are **disabled** across all glass tiers. Solid semi-opaque dark fallbacks are used instead. This is the most impactful performance optimization in the stylesheet.

---

## 7. Shadow Tokens

```css
--shadow-glow-green: 0 0 24px rgba(29, 219, 29, 0.40), 0 0 8px rgba(29, 219, 29, 0.25);
--shadow-glow-gold:  0 0 24px rgba(201, 168, 76, 0.40), 0 0 8px rgba(201, 168, 76, 0.25);
--shadow-card:       0 32px 80px rgba(0, 0, 0, 0.55), 0 12px 32px rgba(0, 0, 0, 0.30);
--shadow-button:     0 8px 24px rgba(0, 0, 0, 0.28), 0 2px 6px rgba(0, 0, 0, 0.18);
```

---

## 8. Transition & Easing Tokens

```css
--ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);  /* Elastic overshoot */
--ease-smooth: cubic-bezier(0.25, 0.8, 0.25, 1);          /* Smooth deceleration */
--ease-out:    cubic-bezier(0.0, 0.0, 0.2, 1);             /* Material ease-out */
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);          /* Bouncy spring */

--dur-fast: 150ms;   /* Micro-interactions (hover color, active state) */
--dur-base: 280ms;   /* Standard transitions (panel, nav, card flip hint) */
--dur-slow: 600ms;   /* Large layout transitions (hero fade, card flip) */
```

### Usage Guidelines
| Token | Use for |
|---|---|
| `--ease-spring` | Button hover scale, logo hover rotate, card tilt |
| `--ease-smooth` | Nav width, backdrop blur, general transitions |
| `--ease-out` | Hero fade-up, scroll reveals (GSAP default) |
| `--ease-bounce` | Toast slide-in, modal pop-in |

---

## 9. Layout Tokens

```css
--navbar-height:  80px;
--container-max:  1400px;
```

### Grid System
- **Desktop (≥ 900px)**: Two-column split grid `[form panel] [preview panel]`.
- **Mobile (< 900px)**: Single column; form stepper on top; preview below (or in mini header).
- `max-width: var(--container-max)` centered with `margin: 0 auto`.
- Responsive padding: `clamp(1.25rem, 4vw, 2.5rem)`.

---

## 10. Component Reference

### 10.1 Primary Button (`.btn-primary`)
```
Background:   gradient from --green-500 to --forest-700
Border:       1px solid rgba(21,185,21,0.35)
Border-radius: --radius-full (pill)
Padding:      0.75rem 1.75rem
Font:         600, clamp sizing
Hover:        scale(1.04) translateY(-2px), stronger green glow
Active:       scale(0.98)
```

### 10.2 Ghost Button (`.btn-ghost`)
```
Background:   --white-12 (translucent)
Border:       1px solid --white-20
Hover:        Background --white-20, border --white-40, translateY(-2px)
```

### 10.3 Navbar Button (`.btn-nav`)
```
Background:   --white-12
Border:       1px solid --white-20
Font size:    0.82rem, weight 600
Hover:        Green tint background (rgba(21,185,21,0.18)), green border
```

### 10.4 Nav Link (`.nav-link`)
```
Color:        --text-secondary
Hover:        --text-primary
Underline:    ::after pseudo-element, 0% → 100% width on hover (--ease-smooth)
```

### 10.5 Form Inputs
```
Background:   --white-08 (Tier 2 glass)
Border:       1px solid --white-12
Border-radius: --radius-md
Padding:      0.75rem 1rem
Focus:        Border --accent, box-shadow with green glow, background --white-12
```

### 10.6 Toast Notification (`#isu-toast`)
```
Position:      fixed, bottom: 24px, left: 50%, transform: translateX(-50%)
Background:    rgba(20,20,20,0.85), backdrop-filter: blur(12px)
Border:        1px solid rgba(255,255,255,0.1)
Border-radius: 50px (pill)
Padding:       12px 24px
Animation in:  translateY(100px) → translateY(0), opacity 0 → 1, spring cubic-bezier
Auto-hide:     After 3 seconds
Icons:         ph-check-circle (success, #4ade80), ph-x-circle (error, #f87171), ph-warning (warning, #fbbf24)
```

### 10.7 Stepper Dots (`.stepper-dot`)
```
Size:          8px × 8px (active: 10px × 10px)
Color:         --white-20 (default), --accent (active), --green-400 (done)
Transition:    background, transform, box-shadow — --dur-base, --ease-spring
Active shadow: 0 0 8px rgba(21,185,21,0.6)
```

### 10.8 Progress Bar (`.stepper-progress`)
```
Height:      3px
Background:  linear-gradient(90deg, --green-vivid, --gold-400)
Box-shadow:  0 0 8px rgba(21,185,21,0.5)
Transition:  width --dur-slow ease
```

### 10.9 Student Tabs (`.student-tab`)
```
Border-radius: --radius-md
Border:        1.5px solid transparent
Active border: var(--accent)
Active shadow: 0 0 16px rgba(21,185,21,0.3)
```

### 10.10 Campus Pill Buttons (`.campus-pill`)
```
Border-radius: --radius-full
Padding:       0.4rem 0.9rem
Font:          0.78rem, weight 600
Active:        Background campus primary color, border campus accent color, glow shadow
```

---

## 11. Background & Decorative System

### 11.1 Page Background
Fixed `::before` pseudo-element (performance fix — avoids repaint on scroll):
```css
body::before {
  position: fixed; inset: 0; z-index: -1;
  background:
    radial-gradient(ellipse 80% 60% at 15% 0%,   rgba(10, 80, 10, 0.38) 0%, transparent 60%),
    radial-gradient(ellipse 60% 50% at 85% 100%, rgba(4, 57, 4, 0.50) 0%, transparent 60%),
    radial-gradient(ellipse 40% 40% at 60% 30%,  rgba(21, 185, 21, 0.07) 0%, transparent 55%),
    radial-gradient(ellipse 45% 35% at 90% 5%,   rgba(160, 120, 48, 0.08) 0%, transparent 60%),
    linear-gradient(160deg, --forest-950 0%, --forest-900 45%, --forest-800 100%);
}
```

### 11.2 Floating Orbs (`.orb-1` to `.orb-4`)
Decorative `position: fixed` radial gradient blobs. **No `filter: blur()`** (removed v3.8.1 for GPU perf). Hidden on mobile (≤ 860px).

| Orb | Size | Color | Position |
|---|---|---|---|
| orb-1 | clamp(400px–700px) | Green 16% opacity | Top-left (-15%, -15%) |
| orb-2 | clamp(300px–550px) | Deep green 30% opacity | Bottom-right (5%, -10%) |
| orb-3 | clamp(200px–400px) | Gold 7% opacity | Center (50%, 50%) |
| orb-4 | clamp(250px–480px) | Gold-brown 9% opacity | Bottom-left (10%, -8%) |

### 11.3 Hero Mesh Grid (`.hero-mesh`)
```css
background-image:
  linear-gradient(rgba(21,185,21,0.04) 1px, transparent 1px),
  linear-gradient(90deg, rgba(21,185,21,0.04) 1px, transparent 1px);
background-size: 60px 60px;
mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
```

---

## 12. Animation System

### 12.1 CSS Keyframes (defined in `style.css`)

| Name | Trigger | Effect |
|---|---|---|
| `heroFadeUp` | Page load, CSS animation | `opacity 0→1`, `translateY(30px→0)` |
| `wordPop` | Hero title words | `opacity 0→1`, `translateY(40px→0) scale(0.85→1)`, `blur(8px→0)` |
| `shimmerText` | Hero highlight word | Animates `background-position` for gradient shimmer |
| `pulseDot` | Hero badge dot | Opacity/scale pulse, 2s infinite |
| `glowBreath` | Hero ambient glow | Opacity and scale pulse (currently `animation: none` — disabled) |
| `spin` | Loading states | 360° rotation, 1s linear infinite |
| `slideUp` | Toast, restore banner | `translateY(30px→0)`, opacity 0→1 |

### 12.2 JavaScript Animations (`animations.js`)

| Module | Library | Description |
|---|---|---|
| A — Hero Particles | Three.js | **Disabled** — returns immediately (removed for perf v3.8.0) |
| B — Hero Entrance | GSAP | Fade-up sequence for hero elements (badge, title, subtitle, CTA) |
| C — Scroll Reveals | GSAP ScrollTrigger | Staggered fade-up on features, bento grid, process steps |
| D — Micro-interactions | Anime.js | Button scale on click, stagger on feature pills |
| E — Holographic Shimmer | Three.js + WebGL | GLSL shader over the card stage; responds to mouse tilt and CSS VanillaTilt |
| F — Scroll Parallax | GSAP ScrollTrigger | Parallax on hero glows (currently disabled with hero glows) |
| G — Reduced Motion | `prefers-reduced-motion` | Lazy flag checked inside each animation function |

### 12.3 VanillaTilt Configuration
```js
{
  max:           7,      // max tilt degrees
  speed:         500,    // transition speed ms
  glare:         true,
  'max-glare':   0.12,   // glare opacity
  scale:         1.025,  // hover lift
  perspective:   900,    // CSS perspective match
  gyroscope:     true    // mobile sensor tilt
}
```

---

## 13. Responsive Breakpoints

| Breakpoint | Value | Behavior |
|---|---|---|
| Mobile | < 861px | Single-column layout; hamburger nav; stepper visible; export bottom sheet; backdrop-filter disabled; orbs hidden |
| Tablet/Desktop | ≥ 861px | Desktop menu visible; two-column split panel |
| Large Desktop | ≥ 900px | Generator split grid active |
| Max container | 1400px | `--container-max`; content centered |

### Mobile Performance Rules (≤ 860px)
All of the following are **disabled** via media query:
- `backdrop-filter` and `-webkit-backdrop-filter` on all glass panels, nav, footer, modals, badges, buttons.
- `.floating-orbs` → `display: none`.
- `.hero-glow-primary`, `.hero-glow-gold` → `display: none`.
- Solid semi-opaque fallback backgrounds provided instead.

---

## 14. Accessibility Design

| Element | Implementation |
|---|---|
| Focus rings | `outline: 2px solid var(--green-400)` with `outline-offset: 4px` on `:focus-visible` |
| Interactive elements | All use `cursor: pointer`; all have explicit `id` attributes |
| Images | `alt=""` on decorative; descriptive `alt` on logo/preview |
| Icons (Phosphor) | `aria-hidden="true"` when decorative |
| Color | Text meets contrast ratio against dark backgrounds; accent gold is used sparingly |
| Motion | All GSAP/Anime.js animations check `prefersReducedMotion()` before running |

---

## 15. Icon System

**Phosphor Icons** — loaded via CDN (`@phosphor-icons/web`).
- Class pattern: `<i class="ph ph-{icon-name}">` (regular weight) or `ph-fill` for filled variant.
- Size: controlled by `font-size` on the `<i>` element.
- Color: inherits from parent `color`.

Common icons used in the UI:
| Icon | Usage |
|---|---|
| `ph-identification-card` | Navbar logo, hero, generator |
| `ph-download-simple` | PDF export button |
| `ph-image` | Save as image button |
| `ph-user` | Student tab placeholder |
| `ph-scan` | OCR autofill button |
| `ph-table` | Batch manager button |
| `ph-check-circle` | Success toast |
| `ph-x-circle` | Error toast |
| `ph-warning` | Warning toast |
| `ph-speaker-high` / `ph-speaker-slash` | Audio toggle |
| `ph-circle-notch` | Loading spinner (`animation: spin`) |
| `ph-arrow-left` / `ph-arrow-right` | Stepper back/next |
| `ph-shield-check` | Hologram watermark button |

---

## 16. ID Card Typography (Canvas Rendering)

All text on the ID card canvas is rendered via `ctx.fillText()` using `--font-card` (`Roboto Condensed`).

### Old Template (CONFIG coordinates — native canvas pixels)
Text is rendered at 4.17× canvas scale. Key fields:
- **Name**: Bold, ~28px, white or dark (template-dependent)
- **ID Number**: Regular, ~22px
- **Course**: Regular, ~18px
- **DOB, Parent, Address, Telephone**: Regular, ~16px
- **Signature**: `drawImage()` at signature bounding box

> ⚠️ **NEEDS VERIFICATION** — Exact pixel values in `CONFIG` and `CONFIG_2026` should be verified against the actual `app.js` CONFIG objects and the template PNG dimensions for precise documentation.

### 2026 Template (CONFIG_2026)
Similar structure to old template but with different coordinate mapping, photo clip path (rounded rectangle with `ctx.clip()`), and department abbreviation lookup table.
