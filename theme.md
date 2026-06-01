# Streaks — Design System & Theme Reference

A dark-mode-first, Netflix-red accent design system built on CSS custom properties + Tailwind CSS. Copy the tokens and conventions below into any new project to reproduce the same look.

---

## Personality

| Trait | Description |
|---|---|
| Mood | Dark, premium, minimal — like a polished consumer app |
| Accent | Crimson red (`#e50914`) — bold, energetic |
| Surfaces | Near-black with glass/blur layers, not pitch black |
| Typography | Rounded, friendly (`Nunito` / `Nunito Sans`) |
| Motion | Snappy with spring physics; never sluggish |

---

## Fonts

```html
<!-- Google Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=Nunito+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

| Variable | Value | Use |
|---|---|---|
| `--font-sans` | `'Nunito', system-ui, sans-serif` | Headings, labels, numbers |
| `--font-body` | `'Nunito Sans', system-ui, sans-serif` | Body text, paragraphs |

Tailwind classes: `font-sans` / `font-body`

---

## Color Palette

### Brand (Red)

| Token | Light/Dark Value | Tailwind |
|---|---|---|
| `--color-brand-50` | `#ffe7ea` / `#331114` | `bg-brand-50` |
| `--color-brand-100` | `#ffc8cf` / `#4a1317` | `bg-brand-100` |
| `--color-brand-200` | `#ff9ba7` / `#68181d` | `bg-brand-200` |
| `--color-brand-400` | `#f55466` | `bg-brand-400` |
| `--color-brand-500` | `#e50914` | `bg-brand-500` ← **primary CTA** |
| `--color-brand-600` | `#c40812` / `#ff6b5f` | `bg-brand-600` |
| `--color-brand-700` | `#9f0710` / `#ff9b93` | `bg-brand-700` |

### Accent Colours (one-offs)

| Token | Value | Use |
|---|---|---|
| `--color-accent-1` | `#ff6b5f` | Warm coral |
| `--color-accent-2` | `#1db954` | Success / done (Spotify green) |
| `--color-accent-3` | `#ffb457` | Warning / streak amber |

### Semantic Status

| Token | Foreground | Background token |
|---|---|---|
| Done | `#1db954` (`--color-done`) | `--color-done-bg` → `rgba(29,185,84,0.16)` |
| Partial | `#ffb457` (`--color-partial`) | `--color-partial-bg` → `rgba(255,180,87,0.16)` |
| Overdue | `#ff5c69` (`--color-overdue`) | `--color-overdue-bg` → `rgba(255,92,105,0.14)` |
| Skipped | `#8e8e93` (`--color-skipped`) | `--color-skipped-bg` → `rgba(142,142,147,0.14)` |
| Streak | `#ffb457` (`--color-streak`) | `--color-streak-bg` → `rgba(255,180,87,0.14)` |

### Priority

| Token | Value |
|---|---|
| `--color-priority-high` | `#ff5c69` |
| `--color-priority-med` | `#ffb457` |
| `--color-priority-low` | `#8e8e93` |

---

## Backgrounds

| Token | Value | Use |
|---|---|---|
| `--bg-app` | `#141414` | Page/root background |
| `--bg-app-rgb` | `20, 20, 20` | For `rgb()` usage |
| `--bg-surface` | `rgba(28,28,28,0.88)` | Cards, panels (glass) |
| `--bg-surface-strong` | `#1c1c1c` | Solid card variant |
| `--bg-surface-2` | `rgba(39,39,39,0.96)` | Nested surfaces, chips |
| `--bg-surface-3` | `rgba(49,49,49,0.96)` | Deepest nested surface |
| `--bg-overlay` | `rgba(0,0,0,0.56)` | Modal backdrop |
| `--bg-hero` | `#1e1e1e` | Hero/header area |

Tailwind aliases: `bg-app`, `bg-surface`, `bg-surface2`

---

## Text

| Token | Value | Use |
|---|---|---|
| `--text-primary` | `#ffffff` | Main body text |
| `--text-secondary` | `#c7c7c7` | Supporting text |
| `--text-tertiary` | `#8b8b8b` | Placeholders, labels |
| `--text-inverse` | `#141414` | Text on light surfaces |
| `--text-brand` | `#ff7b82` | Inline brand accent text |
| `--text-on-brand` | `#ffffff` | Text on brand-coloured backgrounds |
| `--text-on-success` | `#ffffff` | Text on green |
| `--text-on-danger` | `#ffffff` | Text on red |

---

## Borders

| Token | Value | Use |
|---|---|---|
| `--border-subtle` | `rgba(255,255,255,0.08)` | Most card borders |
| `--border-default` | `rgba(255,255,255,0.14)` | Visible separators |
| `--border-strong` | `rgba(255,255,255,0.24)` | High-contrast separators |
| `--border-brand` | `rgba(229,9,20,0.28)` | Focused/active brand border |

---

## Shadows

| Token | Value | Use |
|---|---|---|
| `--shadow-xs` | `0 1px 2px rgba(0,0,0,0.32)` | Tiny lift |
| `--shadow-sm` | `0 8px 22px rgba(0,0,0,0.22)` | Small card |
| `--shadow-md` | `0 16px 38px rgba(0,0,0,0.3)` | Medium panel |
| `--shadow-lg` | `0 24px 56px rgba(0,0,0,0.38)` | Large modal |
| `--shadow-card` | `0 10px 28px rgba(0,0,0,0.22)` | Standard card |
| `--shadow-soft` | `0 16px 34px rgba(229,9,20,0.1)` | Subtle brand glow |
| `--shadow-glow` | `0 12px 28px rgba(229,9,20,0.22)` | Brand-coloured glow |
| `--shadow-fab` | `0 16px 30px rgba(229,9,20,0.28)` | Floating action button |

Tailwind aliases: `shadow-xs`, `shadow-sm`, `shadow-card`, `shadow-fab`

---

## Border Radius

| Token | Value | Tailwind | Use |
|---|---|---|---|
| `--radius-sm` | `8px` | `rounded-sm` | Chips, small inputs |
| `--radius-md` | `14px` | `rounded-md` | Buttons, inputs |
| `--radius-lg` | `18px` | `rounded-lg` | Cards |
| `--radius-xl` | `28px` | `rounded-xl` | Bottom sheets, large cards |
| `--radius-full` | `9999px` | `rounded-full` | Pills, avatars |

---

## Spacing Scale

Uses a 4 px base grid. Standard CSS variables:

```
--space-1: 4px   --space-2: 8px   --space-3: 12px  --space-4: 16px
--space-5: 20px  --space-6: 24px  --space-8: 32px  --space-10: 40px
--space-12: 48px
```

Use Tailwind spacing utilities (`p-4`, `gap-3`, etc.) — they map 1:1.

---

## Motion

### Durations

| Token | Value | Use |
|---|---|---|
| `--duration-fast` | `120ms` | Micro-interactions (icon swap) |
| `--duration-base` | `200ms` | Most transitions |
| `--duration-slow` | `350ms` | Panels, sheets entering |

### Easing

| Token | Value | Character |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.16,1,0.3,1)` | Snappy deceleration |
| `--ease-spring` | `cubic-bezier(0.34,1.56,0.64,1)` | Overshoot bounce |
| `--ease-in-out` | `cubic-bezier(0.4,0,0.2,1)` | Smooth (Material-style) |

Tailwind aliases: `ease-spring`, `ease-smooth` (maps to `--ease-out`)

### Keyframe Animations

| Class | Effect |
|---|---|
| `animate-fade-in` | Opacity 0 → 1 |
| `animate-slide-up` | Slides up from bottom (100%) |
| `animate-slide-in-bottom` | Slides up 8 px + fades in |
| `animate-zoom-in-95` | Scales 0.95 → 1 + fades in |
| `animate-scale-check` | Bouncy scale 0.8 → 1.15 → 1 (checkmarks) |

---

## Z-Index Scale

| Token | Value | Layer |
|---|---|---|
| `--z-base` | `0` | Default stacking |
| `--z-card` | `1` | Cards above base |
| `--z-sticky` | `10` | Sticky headers / bottom nav |
| `--z-overlay` | `40` | Drawer backdrops |
| `--z-modal` | `50` | Modals / bottom sheets |
| `--z-toast` | `60` | Toasts (always on top) |

---

## Utility CSS Classes

Defined in `src/index.css`. Copy these into any new project:

```css
.glass-panel {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-card);
  backdrop-filter: blur(14px);
}

.hero-panel {
  background: var(--bg-hero);
  border: 1px solid var(--border-default);
  box-shadow: var(--shadow-soft);
}

.panel-elevated {
  background: var(--bg-surface-strong);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-card);
}

/* Uppercase section labels */
.section-kicker {
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--text-tertiary);
}

/* Tag / chip background */
.chip-soft {
  background: var(--bg-surface-2);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
}

/* Floating bottom nav / toolbar */
.floating-nav {
  background: color-mix(in srgb, var(--bg-surface-strong) 72%, transparent);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(14px);
}
```

---

## Component Patterns

### Stat Card
```tsx
<div
  className="glass-panel rounded-[26px] p-4"
  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
>
  <div className="font-sans text-[10px] font-bold uppercase tracking-[0.5px] mb-1.5"
    style={{ color: 'var(--text-tertiary)' }}>
    LABEL
  </div>
  <div className="font-sans font-extrabold text-[24px] leading-none tracking-tight"
    style={{ color: 'var(--text-primary)' }}>
    42
  </div>
</div>
```

Gradient variant (brand glow):
```tsx
style={{
  background: 'linear-gradient(135deg, var(--color-brand-500), var(--color-brand-400))',
  boxShadow: 'var(--shadow-glow)',
  border: 'none',
}}
```

### Habit/Item Card
```tsx
<div
  className="relative overflow-hidden rounded-2xl flex flex-col px-4 py-3.5"
  style={{
    background: done ? 'var(--color-done-bg)' : 'var(--bg-surface)',
    border: done ? '1px solid #22c55e33' : '1px solid var(--border-subtle)',
    paddingLeft: 20,
  }}
>
  {/* Coloured accent bar on left edge */}
  <span
    className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full"
    style={{ background: done ? 'var(--color-done)' : accentColor }}
  />
  {/* content */}
</div>
```

### Icon Button (coloured tint)
```tsx
<button
  className="w-11 h-11 rounded-[13px] flex items-center justify-center shrink-0"
  style={{
    background: `${color}1a`,   // 10% opacity tint
    color: color,
  }}
/>
```

### Floating Bottom Nav
```tsx
<nav className="lg:hidden fixed bottom-3 left-3 right-3 z-[var(--z-sticky)]"
  style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
  <div className="floating-nav flex h-[72px] items-center rounded-[26px] px-2">
    {/* nav items */}
  </div>
</nav>
```

Active nav item:
```tsx
'bg-[rgba(229,9,20,0.14)] text-brand-500'          // pill
'bg-[rgba(229,9,20,0.16)] shadow-[var(--shadow-soft)]' // icon bg
```

### Section Kicker Label
```tsx
<p className="section-kicker mb-2">Today</p>
```

### Status/Streak Badge
```tsx
<span
  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold"
  style={{ background: 'var(--color-streak-bg)', color: 'var(--color-streak)' }}
>
  🔥 7
</span>
```

### Offline Banner
```tsx
<div className="fixed left-1/2 top-3 z-50 -translate-x-1/2 rounded-full border border-[var(--border-default)] bg-[rgba(30,31,34,0.9)] px-4 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur">
  Offline mode
</div>
```

---

## Focus & Selection

```css
:focus-visible {
  outline: 2px solid var(--color-brand-500);
  outline-offset: 2px;
}

::selection {
  background: rgba(255, 143, 77, 0.32);
  color: var(--text-primary);
}
```

---

## Global Transitions

Apply smooth theme-switch transitions to all elements:

```css
*, *::before, *::after {
  transition:
    background-color var(--duration-base) var(--ease-in-out),
    border-color     var(--duration-base) var(--ease-in-out),
    color            var(--duration-base) var(--ease-in-out),
    box-shadow       var(--duration-base) var(--ease-in-out);
}

/* Interactive elements should handle their own transitions */
button, a, input, select, textarea {
  transition: none;
}
```

---

## Dark Mode Strategy

`darkMode: 'class'` in Tailwind. The `:root` block is already dark; the `.dark` class overrides only the tokens that differ (mostly brand scale and shadow strengths). Because the app is dark-first, no `.light` class is needed unless you add light mode later.

---

## Logo Design

### Visual Description

A bold app icon built on the **"rounded square + centered glyph"** convention used by iOS/Android launchers.

| Property | Value |
|---|---|
| Shape | Rounded square, corner radius ≈ **21 % of canvas size** (e.g. `rx="8"` on a 32 px canvas, `rx="112"` on a 512 px canvas) |
| Background | Diagonal linear gradient — top-left `#e50914` → bottom-right `#b00010` |
| Glyph | **Flame** (Lucide `Flame` icon outline) centered, fills ≈ 65 % of canvas height |
| Glyph colour | White gradient — top `rgba(255,255,255,0.95)` → bottom `rgba(255,255,255,0.70)` |
| Glyph stroke | `rgba(255,255,255,0.15)`, `stroke-width` ≈ 0.5 px (on 32 px canvas) |
| Overall feeling | Minimal, one icon, no text, high contrast, instantly recognisable at 16 px |

### Why this works

- The **red → dark-red gradient** on the background gives depth without a drop shadow.
- The **white-to-near-white gradient on the flame** makes it feel lit from above, like an actual flame.
- A subtle semi-transparent white stroke on the flame path separates it cleanly from the background at small sizes.
- No text in the icon — the shape alone carries the brand.

### SVG Source (32 × 32 favicon)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#e50914"/>
      <stop offset="100%" stop-color="#b00010"/>
    </linearGradient>
    <linearGradient id="flame" x1="0.5" y1="0" x2="0.5" y2="1">
      <stop offset="0%"   stop-color="rgba(255,255,255,0.95)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0.70)"/>
    </linearGradient>
  </defs>

  <!-- Background rounded square -->
  <rect width="32" height="32" rx="8" fill="url(#bg)"/>

  <!-- Flame glyph — Lucide Flame path, scaled 0.96×, centered -->
  <g transform="translate(4.5, 3) scale(0.96)">
    <path
      d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6
         .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294
         1-3a2.5 2.5 0 0 0 2.5 2.5z"
      fill="url(#flame)"
      stroke="rgba(255,255,255,0.15)"
      stroke-width="0.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </g>
</svg>
```

### Scaling to larger sizes (512 × 512 PNG)

| Property | 32 px | 512 px |
|---|---|---|
| `viewBox` | `0 0 32 32` | `0 0 512 512` |
| `rx` on background rect | `8` | `112` |
| Flame `translate` | `translate(4.5, 3)` | `translate(72, 48)` |
| Flame `scale` | `0.96` | `15.36` (= 0.96 × 16) |
| Stroke width | `0.5` | `0.5` (keep thin — scales with transform) |

> **Tip:** Generate the 512 px version by opening the 32 px SVG in Figma/Inkscape, scaling the canvas to 512 × 512, and exporting as PNG. The gradient and anti-aliasing render much better than a raw SVG resize.

### Maskable icon variant

For PWA maskable icons, expand the safe zone: add `8 %` padding on all sides so the flame is never clipped by OS circular/squircle crops. The background gradient fills the full bleed area.

### Prompt for AI image generators

> "App icon, rounded square with deep red gradient background (top-left crimson #e50914 to bottom-right dark red #b00010), large white flame centered, flame has subtle top-to-bottom opacity gradient from near-opaque to 70% white, clean minimal flat design, no text, no shadows, iOS app icon style"

---

## File Setup Checklist

When starting a new project with this theme:

1. Copy `src/styles/tokens.css` → `src/styles/tokens.css`
2. Import it first in `src/index.css`: `@import './styles/tokens.css';`
3. Copy the utility classes (`.glass-panel`, `.floating-nav`, etc.) into `src/index.css`
4. Copy `tailwind.config.ts` extensions (colors, borderRadius, boxShadow, animation, keyframes)
5. Add Google Fonts link for **Nunito** and **Nunito Sans**
6. Set `html { font-family: var(--font-body); background: var(--bg-app); }`
7. Set `<html class="dark">` (or add it dynamically if you want a toggle)
