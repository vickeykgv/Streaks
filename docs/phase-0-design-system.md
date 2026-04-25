# Phase 0 — Design System & UI Foundation
**Estimated time:** Day 0–1 (do this before Phase 1)  
**Goal:** A single source of truth for every visual decision in the app. Colors, typography, spacing, motion, and all input/interactive components live here. Every subsequent phase imports from this system — nothing is invented inline. The result should feel calm, focused, and satisfying to use: a productivity app that feels crafted, not generated.

---

## Design Direction

**Aesthetic:** Calm productivity — clean without being cold, structured without being rigid. Think of a well-designed notebook: everything has a place, nothing shouts, interactions feel tactile.

**Personality keywords:** Purposeful · Warm · Focused · Rewarding

**What makes it unforgettable:** Completion feels genuinely good. The micro-interactions when you mark a habit done should feel like a small reward — a satisfying tap, a color bloom, a streak badge that pulses. The rest is quiet and gets out of the way.

**Mobile-first layout:** Cards stack vertically, bottom nav, thumb-reachable actions. Desktop gets a sidebar layout.

---

## Step 1 — Typography

Install the fonts:
```bash
# Add to index.html <head>
```

```html
<!-- Nunito: warm, rounded, highly legible at small sizes — body + UI -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&family=Nunito+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap" rel="stylesheet" />
```

**Why Nunito:** Rounded terminals make it feel friendly and approachable. Highly legible at 14px (card labels). The "8" weight gives headlines energy without aggression.

Type scale (defined as CSS variables — see Step 2):
| Token | Size | Weight | Use |
|---|---|---|---|
| `--text-xs`  | 11px | 500 | Tags, badges, captions |
| `--text-sm`  | 13px | 400/500 | Card subtitles, metadata |
| `--text-base`| 15px | 400 | Body, descriptions |
| `--text-md`  | 16px | 600 | Card titles, form labels |
| `--text-lg`  | 20px | 700 | Section headings |
| `--text-xl`  | 26px | 800 | Page titles, hero numbers |
| `--text-2xl` | 34px | 800 | Dashboard "done today" stat |

---

## Step 2 — CSS design tokens (single source of truth)

Create `src/styles/tokens.css`. This is the **only** place colors, radii, shadows, and motion speeds are defined. Every component uses these variables — never hardcoded hex values.

```css
/* src/styles/tokens.css */

/* ─── Light theme (default) ─────────────────────────────────────── */
:root {
  /* Brand */
  --color-brand-50:  #eef2ff;
  --color-brand-100: #e0e7ff;
  --color-brand-200: #c7d2fe;
  --color-brand-400: #818cf8;
  --color-brand-500: #6366f1;  /* primary */
  --color-brand-600: #4f46e5;
  --color-brand-700: #4338ca;

  /* Semantic — backgrounds */
  --bg-app:        #f8f7f4;   /* warm off-white, not cold grey */
  --bg-surface:    #ffffff;
  --bg-surface-2:  #f1f0ed;   /* subtle card distinction */
  --bg-overlay:    rgba(0, 0, 0, 0.40);

  /* Semantic — text */
  --text-primary:   #1a1917;
  --text-secondary: #57534e;
  --text-tertiary:  #a8a29e;
  --text-inverse:   #ffffff;
  --text-brand:     var(--color-brand-600);

  /* Semantic — borders */
  --border-subtle:  #e7e5e4;
  --border-default: #d6d3d1;
  --border-strong:  #a8a29e;
  --border-brand:   var(--color-brand-500);

  /* Status colors */
  --color-done:       #22c55e;  /* green */
  --color-done-bg:    #f0fdf4;
  --color-partial:    #f59e0b;  /* amber */
  --color-partial-bg: #fffbeb;
  --color-overdue:    #ef4444;  /* red */
  --color-overdue-bg: #fef2f2;
  --color-skipped:    #94a3b8;  /* slate */
  --color-skipped-bg: #f8fafc;

  /* Priority */
  --color-priority-high: #ef4444;
  --color-priority-med:  #f97316;
  --color-priority-low:  #94a3b8;

  /* Streak */
  --color-streak:    #f97316;   /* warm orange — "fire" */
  --color-streak-bg: #fff7ed;

  /* Shadows */
  --shadow-xs: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.05);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.07), 0 4px 6px rgba(0,0,0,0.05);
  --shadow-card: var(--shadow-sm);
  --shadow-fab:  0 4px 12px rgba(99,102,241,0.35);

  /* Radii */
  --radius-sm:   6px;
  --radius-md:   10px;
  --radius-lg:   14px;
  --radius-xl:   20px;
  --radius-full: 9999px;

  /* Spacing (8px grid) */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;

  /* Motion */
  --duration-fast:   120ms;
  --duration-base:   200ms;
  --duration-slow:   350ms;
  --ease-out:        cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring:     cubic-bezier(0.34, 1.56, 0.64, 1);  /* slight overshoot */
  --ease-in-out:     cubic-bezier(0.4, 0, 0.2, 1);

  /* Typography */
  --font-sans:    'Nunito', system-ui, sans-serif;
  --font-body:    'Nunito Sans', system-ui, sans-serif;

  /* Z-index scale */
  --z-base:    0;
  --z-card:    1;
  --z-sticky:  10;
  --z-overlay: 40;
  --z-modal:   50;
  --z-toast:   60;
}

/* ─── Dark theme ─────────────────────────────────────────────────── */
.dark {
  /* Backgrounds — warm dark, not cold grey */
  --bg-app:       #18181b;   /* zinc-900-ish */
  --bg-surface:   #27272a;   /* zinc-800 */
  --bg-surface-2: #3f3f46;   /* zinc-700 */
  --bg-overlay:   rgba(0, 0, 0, 0.60);

  /* Text */
  --text-primary:   #fafaf9;
  --text-secondary: #a8a29e;
  --text-tertiary:  #57534e;
  --text-inverse:   #1a1917;

  /* Borders */
  --border-subtle:  #3f3f46;
  --border-default: #52525b;
  --border-strong:  #71717a;

  /* Status — slightly muted in dark */
  --color-done-bg:    #052e16;
  --color-partial-bg: #451a03;
  --color-overdue-bg: #450a0a;
  --color-skipped-bg: #18181b;
  --color-streak-bg:  #431407;

  /* Shadows — softer in dark (less visible anyway) */
  --shadow-xs:   0 1px 2px rgba(0,0,0,0.3);
  --shadow-sm:   0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.2);
  --shadow-md:   0 4px 6px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2);
  --shadow-lg:   0 10px 15px rgba(0,0,0,0.3), 0 4px 6px rgba(0,0,0,0.2);
  --shadow-fab:  0 4px 12px rgba(99,102,241,0.5);
}

/* ─── Base styles ────────────────────────────────────────────────── */
* {
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;  /* remove tap flash on mobile */
}

html {
  font-family: var(--font-body);
  font-size: 15px;
  color: var(--text-primary);
  background-color: var(--bg-app);
  -webkit-font-smoothing: antialiased;
  scroll-behavior: smooth;
}

/* Ensure smooth theme transitions */
*, *::before, *::after {
  transition: background-color var(--duration-base) var(--ease-in-out),
              border-color var(--duration-base) var(--ease-in-out);
}

/* But NOT on elements that animate for other reasons */
button, a, input, select, textarea {
  transition: none;
}

/* Selection color */
::selection {
  background: var(--color-brand-200);
  color: var(--color-brand-700);
}
```

Import `tokens.css` in `src/index.css` before the Tailwind import:
```css
@import './styles/tokens.css';
@import 'tailwindcss';
```

---

## Step 3 — Tailwind theme extension

Extend Tailwind in `tailwind.config.ts` to expose the CSS variables as Tailwind utilities:

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
        body: ['Nunito Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  'var(--color-brand-50)',
          100: 'var(--color-brand-100)',
          200: 'var(--color-brand-200)',
          400: 'var(--color-brand-400)',
          500: 'var(--color-brand-500)',
          600: 'var(--color-brand-600)',
          700: 'var(--color-brand-700)',
        },
        surface:   'var(--bg-surface)',
        surface2:  'var(--bg-surface-2)',
        app:       'var(--bg-app)',
      },
      borderRadius: {
        sm:   'var(--radius-sm)',
        md:   'var(--radius-md)',
        lg:   'var(--radius-lg)',
        xl:   'var(--radius-xl)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        xs:   'var(--shadow-xs)',
        sm:   'var(--shadow-sm)',
        card: 'var(--shadow-card)',
        fab:  'var(--shadow-fab)',
      },
      transitionTimingFunction: {
        spring: 'var(--ease-spring)',
        smooth: 'var(--ease-out)',
      },
      transitionDuration: {
        fast: 'var(--duration-fast)',
        base: 'var(--duration-base)',
        slow: 'var(--duration-slow)',
      },
    },
  },
} satisfies Config
```

---

## Step 4 — Component utility helper

Create `src/lib/utils.ts`:
```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## Step 5 — Shared component library (`src/components/ui/`)

This folder is the internal component kit. **All input elements and interactive components must come from here.** No component outside this folder should implement its own button, input, badge, etc.

### File structure
```
src/components/ui/
  Button.tsx
  Input.tsx
  Textarea.tsx
  Select.tsx
  Checkbox.tsx
  Toggle.tsx
  Badge.tsx
  Card.tsx
  Modal.tsx
  BottomSheet.tsx
  Toast.tsx
  Spinner.tsx
  Avatar.tsx
  Divider.tsx
  EmptyState.tsx
  ProgressBar.tsx
  index.ts         ← re-exports everything
```

---

### `Button.tsx`

Three variants, three sizes. All use `--ease-spring` for scale feedback.

```tsx
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize    = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
}

const variants: Record<ButtonVariant, string> = {
  primary:   'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 shadow-sm',
  secondary: 'bg-surface border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-surface2 active:bg-surface2',
  ghost:     'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-surface2 active:bg-surface2',
  danger:    'bg-[var(--color-overdue)] text-white hover:opacity-90 active:opacity-80',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8  px-3  text-xs  gap-1.5 rounded-md',
  md: 'h-10 px-4  text-sm  gap-2   rounded-lg',
  lg: 'h-12 px-6  text-base gap-2.5 rounded-xl',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  children,
  className,
  disabled,
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        // Base
        'inline-flex items-center justify-center font-sans font-600',
        'select-none outline-none cursor-pointer',
        'transition-all duration-fast',
        // Press effect — scale down slightly on active
        'active:scale-[0.97]',
        // Focus ring
        'focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-app)]',
        // Disabled
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? (
        <Spinner size={size === 'sm' ? 'xs' : 'sm'} />
      ) : (
        <>
          {icon && iconPosition === 'left'  && <span className="shrink-0">{icon}</span>}
          {children && <span>{children}</span>}
          {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
        </>
      )}
    </button>
  )
})
Button.displayName = 'Button'
```

---

### `Input.tsx`

All text inputs in the app — search, form fields, number entries — use this component.

```tsx
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  leftIcon?: React.ReactNode
  rightElement?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  hint,
  error,
  leftIcon,
  rightElement,
  className,
  id,
  ...props
}, ref) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-600 text-[var(--text-primary)] font-sans select-none"
        >
          {label}
          {props.required && <span className="text-[var(--color-overdue)] ml-0.5">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute left-3 text-[var(--text-tertiary)] pointer-events-none">
            {leftIcon}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          className={cn(
            // Base
            'w-full font-body text-base text-[var(--text-primary)]',
            'bg-surface border border-[var(--border-default)]',
            'rounded-lg px-3 py-2.5 h-11',
            'placeholder:text-[var(--text-tertiary)]',
            // Transition — NOT on the global *, so we define it here
            'transition-[border-color,box-shadow] duration-fast',
            // Focus
            'outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
            // Error
            error && 'border-[var(--color-overdue)] focus:border-[var(--color-overdue)] focus:ring-[var(--color-overdue)]/20',
            // Disabled
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface2',
            // Padding adjustments for icons
            leftIcon    && 'pl-10',
            rightElement && 'pr-10',
            className,
          )}
          {...props}
        />

        {rightElement && (
          <span className="absolute right-3 text-[var(--text-tertiary)]">
            {rightElement}
          </span>
        )}
      </div>

      {(hint || error) && (
        <p className={cn(
          'text-xs',
          error ? 'text-[var(--color-overdue)]' : 'text-[var(--text-tertiary)]'
        )}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
})
Input.displayName = 'Input'
```

---

### `Textarea.tsx`

Same visual language as Input. Auto-grows with content.

```tsx
import { forwardRef, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
  autoGrow?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label, hint, error, autoGrow = true, className, ...props
}, ref) => {
  const internalRef = useRef<HTMLTextAreaElement>(null)
  const combinedRef = (ref as React.RefObject<HTMLTextAreaElement>) ?? internalRef

  useEffect(() => {
    if (!autoGrow || !combinedRef.current) return
    const el = combinedRef.current
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [props.value, autoGrow])

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-600 text-[var(--text-primary)] font-sans select-none">
          {label}
        </label>
      )}
      <textarea
        ref={combinedRef}
        rows={3}
        className={cn(
          'w-full font-body text-base text-[var(--text-primary)]',
          'bg-surface border border-[var(--border-default)]',
          'rounded-lg px-3 py-2.5 resize-none overflow-hidden',
          'placeholder:text-[var(--text-tertiary)]',
          'transition-[border-color,box-shadow] duration-fast',
          'outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
          error && 'border-[var(--color-overdue)]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className,
        )}
        {...props}
      />
      {(hint || error) && (
        <p className={cn('text-xs', error ? 'text-[var(--color-overdue)]' : 'text-[var(--text-tertiary)]')}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
})
Textarea.displayName = 'Textarea'
```

---

### `Select.tsx`

Native `<select>` styled to match Input. Use for small option sets (< 6 items).

```tsx
import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label, hint, error, options, placeholder, className, ...props
}, ref) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label className="text-sm font-600 text-[var(--text-primary)] font-sans select-none">
        {label}
      </label>
    )}
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          'w-full appearance-none font-body text-base text-[var(--text-primary)]',
          'bg-surface border border-[var(--border-default)]',
          'rounded-lg px-3 py-2.5 h-11 pr-9',
          'transition-[border-color,box-shadow] duration-fast',
          'outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
          error && 'border-[var(--color-overdue)]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className,
        )}
        {...props}
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none"
      />
    </div>
    {(hint || error) && (
      <p className={cn('text-xs', error ? 'text-[var(--color-overdue)]' : 'text-[var(--text-tertiary)]')}>
        {error ?? hint}
      </p>
    )}
  </div>
))
Select.displayName = 'Select'
```

---

### `Checkbox.tsx`

Custom-styled checkbox. Uses a hidden native input for accessibility, overlays a visual.

```tsx
import { forwardRef } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  description?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({
  label, description, className, ...props
}, ref) => (
  <label className="flex items-start gap-3 cursor-pointer group select-none">
    <div className="relative mt-0.5 shrink-0">
      <input
        ref={ref}
        type="checkbox"
        className="sr-only peer"
        {...props}
      />
      {/* Visual box */}
      <div className={cn(
        'w-5 h-5 rounded-[5px] border-2 border-[var(--border-default)]',
        'transition-all duration-fast',
        'peer-checked:bg-brand-500 peer-checked:border-brand-500',
        'peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-2',
        'group-hover:border-brand-400',
        className,
      )} />
      {/* Check icon */}
      <Check
        size={13}
        strokeWidth={3}
        className="absolute inset-0 m-auto text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-fast"
      />
    </div>

    {(label || description) && (
      <div className="flex flex-col gap-0.5">
        {label && <span className="text-sm font-500 text-[var(--text-primary)]">{label}</span>}
        {description && <span className="text-xs text-[var(--text-tertiary)]">{description}</span>}
      </div>
    )}
  </label>
))
Checkbox.displayName = 'Checkbox'
```

---

### `Toggle.tsx`

iOS-style toggle switch. Used for settings and binary habit options.

```tsx
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ToggleProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  description?: string
}

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(({
  label, description, className, ...props
}, ref) => (
  <label className="flex items-center justify-between gap-4 cursor-pointer select-none group">
    {(label || description) && (
      <div className="flex flex-col gap-0.5">
        {label && <span className="text-sm font-600 text-[var(--text-primary)] font-sans">{label}</span>}
        {description && <span className="text-xs text-[var(--text-tertiary)] font-body">{description}</span>}
      </div>
    )}

    <div className="relative shrink-0">
      <input ref={ref} type="checkbox" className="sr-only peer" {...props} />
      {/* Track */}
      <div className={cn(
        'w-11 h-6 rounded-full border-2 border-transparent',
        'bg-[var(--border-default)]',
        'peer-checked:bg-brand-500',
        'transition-colors duration-base',
        'peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-2',
        className,
      )} />
      {/* Thumb */}
      <div className={cn(
        'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm',
        'transition-transform duration-base ease-spring',
        'peer-checked:translate-x-5',
      )} />
    </div>
  </label>
))
Toggle.displayName = 'Toggle'
```

---

### `Badge.tsx`

Consistent label for tags, streaks, priority, status.

```tsx
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'brand' | 'done' | 'partial' | 'overdue' | 'skipped' | 'streak' | 'priority-high' | 'priority-med' | 'priority-low'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
  dot?: boolean
}

const badgeStyles: Record<BadgeVariant, string> = {
  default:        'bg-surface2 text-[var(--text-secondary)] border border-[var(--border-subtle)]',
  brand:          'bg-brand-100 text-brand-700 dark:bg-brand-700/20 dark:text-brand-400',
  done:           'bg-[var(--color-done-bg)] text-[var(--color-done)]',
  partial:        'bg-[var(--color-partial-bg)] text-[var(--color-partial)]',
  overdue:        'bg-[var(--color-overdue-bg)] text-[var(--color-overdue)]',
  skipped:        'bg-[var(--color-skipped-bg)] text-[var(--color-skipped)]',
  streak:         'bg-[var(--color-streak-bg)] text-[var(--color-streak)]',
  'priority-high':'bg-[var(--color-overdue-bg)] text-[var(--color-overdue)]',
  'priority-med': 'bg-[var(--color-partial-bg)] text-[var(--color-partial)]',
  'priority-low': 'bg-surface2 text-[var(--text-tertiary)]',
}

export function Badge({ variant = 'default', children, className, dot }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5',
      'text-xs font-600 font-sans rounded-full',
      'whitespace-nowrap select-none',
      badgeStyles[variant],
      className,
    )}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}
```

---

### `Card.tsx`

The primary container. Every habit card, task card, and settings section uses this.

```tsx
import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  interactive?: boolean    // adds hover + press styles
  accent?: string          // left border color (e.g. habit.color)
  onClick?: () => void
}

export function Card({ children, className, interactive, accent, onClick }: CardProps) {
  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag
      onClick={onClick}
      className={cn(
        'relative w-full bg-surface rounded-lg shadow-card',
        'border border-[var(--border-subtle)]',
        'overflow-hidden text-left',
        interactive && [
          'cursor-pointer',
          'transition-[transform,box-shadow] duration-fast',
          'hover:shadow-md hover:-translate-y-px',
          'active:scale-[0.99] active:shadow-xs',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
        ],
        className,
      )}
    >
      {/* Left accent bar */}
      {accent && (
        <span
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
          style={{ backgroundColor: accent }}
        />
      )}
      <div className={cn(accent && 'pl-4')}>
        {children}
      </div>
    </Tag>
  )
}
```

---

### `Modal.tsx`

Wraps Radix Dialog with the app's styling. Use for confirmations and forms that need focus.

```tsx
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' }

export function Modal({ open, onClose, title, description, children, size = 'md' }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={o => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[var(--z-overlay)] bg-[var(--bg-overlay)] backdrop-blur-sm animate-in fade-in duration-base" />
        <Dialog.Content className={cn(
          'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
          'z-[var(--z-modal)] w-[calc(100vw-2rem)]',
          sizes[size],
          'bg-surface rounded-xl shadow-lg border border-[var(--border-subtle)]',
          'p-5 outline-none',
          'animate-in fade-in zoom-in-95 duration-base',
        )}>
          {title && (
            <div className="flex items-start justify-between mb-4">
              <div>
                <Dialog.Title className="text-lg font-800 font-sans text-[var(--text-primary)]">
                  {title}
                </Dialog.Title>
                {description && (
                  <Dialog.Description className="text-sm text-[var(--text-secondary)] mt-1">
                    {description}
                  </Dialog.Description>
                )}
              </div>
              <Dialog.Close asChild>
                <button className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors p-1 -mr-1 rounded-md hover:bg-surface2">
                  <X size={18} />
                </button>
              </Dialog.Close>
            </div>
          )}
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
```

---

### `BottomSheet.tsx`

For mobile-first flows: tag picker, measurement type selector, "new habit or task" chooser.

```tsx
import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  snapPoint?: 'content' | 'half' | 'full'
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={o => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[var(--z-overlay)] bg-[var(--bg-overlay)] backdrop-blur-sm animate-in fade-in duration-base" />
        <Dialog.Content className={cn(
          'fixed bottom-0 left-0 right-0 z-[var(--z-modal)]',
          'bg-surface rounded-t-2xl shadow-lg',
          'border-t border-[var(--border-subtle)]',
          'pb-safe pt-4 px-4',  // pb-safe = padding for iOS home indicator
          'outline-none',
          'animate-in slide-in-from-bottom duration-slow ease-smooth',
          'max-h-[85vh] overflow-y-auto',
        )}>
          {/* Drag handle */}
          <div className="w-10 h-1 bg-[var(--border-default)] rounded-full mx-auto mb-4" />

          {title && (
            <Dialog.Title className="text-lg font-800 font-sans text-[var(--text-primary)] mb-4">
              {title}
            </Dialog.Title>
          )}

          {children}

          {/* Extra bottom padding for iOS safe area */}
          <div className="h-6" />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
```

---

### `Toast.tsx`

Lightweight toast — no library needed. Managed via Zustand.

```tsx
// src/store/toastStore.ts
import { create } from 'zustand'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastStore {
  toasts: Toast[]
  show: (message: string, type?: ToastType) => void
  dismiss: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  show(message, type = 'info') {
    const id = Math.random().toString(36).slice(2)
    set(s => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), 3500)
  },
  dismiss: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}))

export const toast = {
  success: (msg: string) => useToastStore.getState().show(msg, 'success'),
  error:   (msg: string) => useToastStore.getState().show(msg, 'error'),
  info:    (msg: string) => useToastStore.getState().show(msg, 'info'),
}
```

```tsx
// src/components/ui/Toast.tsx
import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import { useToastStore } from '@/store/toastStore'
import { cn } from '@/lib/utils'

const icons = {
  success: <CheckCircle size={16} className="text-[var(--color-done)] shrink-0" />,
  error:   <XCircle    size={16} className="text-[var(--color-overdue)] shrink-0" />,
  info:    <Info       size={16} className="text-brand-500 shrink-0" />,
}

export function ToastContainer() {
  const { toasts, dismiss } = useToastStore()

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[var(--z-toast)] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={cn(
            'flex items-center gap-3 px-4 py-3',
            'bg-[#1a1917] dark:bg-[var(--bg-surface-2)] text-white rounded-xl shadow-lg',
            'pointer-events-auto',
            'animate-in slide-in-from-bottom-4 fade-in duration-base',
          )}
        >
          {icons[t.type]}
          <span className="text-sm font-500 font-body flex-1">{t.message}</span>
          <button onClick={() => dismiss(t.id)} className="text-white/50 hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
```

---

### `ProgressBar.tsx`

Used in habit cards (count/duration) and task detail.

```tsx
interface ProgressBarProps {
  value: number     // 0–100
  color?: string    // CSS color, defaults to brand
  size?: 'sm' | 'md'
  showLabel?: boolean
}

export function ProgressBar({ value, color, size = 'sm', showLabel }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))
  const height = size === 'sm' ? 'h-1.5' : 'h-2.5'

  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 ${height} bg-surface2 rounded-full overflow-hidden`}>
        <div
          className={`h-full rounded-full transition-[width] duration-slow ease-smooth`}
          style={{
            width: `${clamped}%`,
            backgroundColor: color ?? 'var(--color-brand-500)',
          }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-600 font-sans text-[var(--text-secondary)] tabular-nums w-8 text-right">
          {Math.round(clamped)}%
        </span>
      )}
    </div>
  )
}
```

---

### `Spinner.tsx`

```tsx
import { cn } from '@/lib/utils'

type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg'
const sizes: Record<SpinnerSize, string> = {
  xs: 'w-3 h-3 border',
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-[3px]',
}

export function Spinner({ size = 'md', className }: { size?: SpinnerSize; className?: string }) {
  return (
    <div
      className={cn(
        'rounded-full border-transparent border-t-brand-500 animate-spin',
        sizes[size],
        className,
      )}
    />
  )
}
```

---

### `EmptyState.tsx`

```tsx
import { Button } from './Button'
import { useNavigate } from 'react-router-dom'

interface EmptyStateProps {
  emoji: string
  headline: string
  subheadline?: string
  action?: { label: string; to: string }
}

export function EmptyState({ emoji, headline, subheadline, action }: EmptyStateProps) {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <span className="text-5xl mb-4 select-none">{emoji}</span>
      <h3 className="text-lg font-800 font-sans text-[var(--text-primary)]">{headline}</h3>
      {subheadline && <p className="text-sm text-[var(--text-secondary)] mt-1 font-body">{subheadline}</p>}
      {action && (
        <Button
          variant="primary"
          size="md"
          className="mt-5"
          onClick={() => navigate(action.to)}
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}
```

---

### `index.ts` re-export

```ts
// src/components/ui/index.ts
export { Button }        from './Button'
export { Input }         from './Input'
export { Textarea }      from './Textarea'
export { Select }        from './Select'
export { Checkbox }      from './Checkbox'
export { Toggle }        from './Toggle'
export { Badge }         from './Badge'
export { Card }          from './Card'
export { Modal }         from './Modal'
export { BottomSheet }   from './BottomSheet'
export { ToastContainer } from './Toast'
export { Spinner }       from './Spinner'
export { ProgressBar }   from './ProgressBar'
export { EmptyState }    from './EmptyState'
```

---

## Step 6 — Theme controller

Create `src/lib/theme.ts`:

```ts
import { settingsRepo } from '@/db/repos/settings'

export type Theme = 'light' | 'dark' | 'system'

export async function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.toggle('dark', prefersDark)
  } else {
    root.classList.toggle('dark', theme === 'dark')
  }
}

export async function initTheme() {
  const theme = await settingsRepo.get<Theme>('theme', 'system')
  await applyTheme(theme)

  // Watch for system changes when theme is 'system'
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', async () => {
    const current = await settingsRepo.get<Theme>('theme', 'system')
    if (current === 'system') applyTheme('system')
  })
}

export async function setTheme(theme: Theme) {
  await settingsRepo.set('theme', theme)
  await applyTheme(theme)
}
```

Call `initTheme()` in `main.tsx` before rendering (synchronously if possible, to avoid flash of wrong theme):

```tsx
// main.tsx
import { initTheme } from '@/lib/theme'

initTheme().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode><App /></React.StrictMode>
  )
})
```

Add this to `index.html` `<head>` to prevent FOUC (flash of unstyled content):
```html
<script>
  // Apply theme class before React renders
  const t = localStorage.getItem('theme-flash') ?? 'system'
  if (t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme:dark)').matches)) {
    document.documentElement.classList.add('dark')
  }
</script>
```
And whenever `setTheme` is called, also `localStorage.setItem('theme-flash', theme)`.

---

## Step 7 — Interactive copy guidelines

**All UI text must sound like a person, not a system.** Apply these rules to every string in the app:

| Context | ❌ Generic | ✅ Interactive |
|---|---|---|
| Empty states | "No habits found" | "Nothing here yet — add your first habit" |
| Completion | "Marked as done" | "Nice work! Habit logged ✓" |
| Streak | "7 day streak" | "🔥 7 days in a row!" |
| Error | "An error occurred" | "Something went wrong. Try again?" |
| Overdue | "1 overdue task" | "1 task needs your attention" |
| Delete confirm | "Are you sure?" | "Delete this habit? This can't be undone." |
| Sign-out | "Signed out" | "You're signed out. Local data is still here." |
| Sync done | "Sync complete" | "All caught up ✓" |
| No network | "Offline" | "You're offline — changes will sync when you're back" |
| Settings saved | "Saved" | "Saved!" |

Create `src/lib/copy.ts` with all user-facing strings as named exports. Never hardcode copy inside components:

```ts
// src/lib/copy.ts

export const copy = {
  // Dashboard
  greetingMorning:   'Good morning',
  greetingAfternoon: 'Good afternoon',
  greetingEvening:   'Good evening',
  allDoneToday:      "All done for today! 🎉",
  nothingToday:      "Nothing scheduled — enjoy the day",
  overdueSection:    (n: number) => `${n} task${n !== 1 ? 's' : ''} need${n === 1 ? 's' : ''} attention`,

  // Habits
  noHabits:          "No habits yet",
  noHabitsHint:      "Build a routine — add your first habit",
  habitArchived:     "Habit archived",
  habitDeleted:      "Habit removed",
  streakLabel:       (n: number) => `🔥 ${n} day${n !== 1 ? 's' : ''} in a row`,

  // Tasks
  noTasks:           "All clear",
  noTasksHint:       "No tasks due — you're on top of it",
  taskDone:          "Done! ✓",
  taskSkipped:       "Skipped",

  // Sync
  syncingNow:        "Syncing…",
  syncDone:          "All caught up ✓",
  syncError:         "Sync failed — tap to retry",
  offlineBanner:     "You're offline — changes sync when you're back",

  // Auth
  signOutDone:       "Signed out. Your local data is still here.",

  // Generic
  saved:             "Saved!",
  deleted:           "Deleted",
  confirmDelete:     (thing: string) => `Delete this ${thing}? This can't be undone.`,
  error:             "Something went wrong. Try again?",
} as const
```

---

## ✅ Phase 0 done when

- [ ] `npm run dev` — page renders with Nunito font, warm off-white background (`#f8f7f4`).
- [ ] Toggle OS dark mode — app switches instantly with no flash.
- [ ] Force-set `document.documentElement.classList.add('dark')` in console — all colors update correctly.
- [ ] Storybook or visual test: render each component from `src/components/ui/` in both themes — all look intentional.
- [ ] `import { Button, Input, Badge, Card, Toggle } from '@/components/ui'` works from any file.
- [ ] `toast.success('Test')` shows a toast at the bottom of the screen.
- [ ] No component outside `src/components/ui/` implements its own button, input, or form element.
- [ ] `src/lib/copy.ts` exists and is used in at least one component (the Dashboard greeting).
- [ ] TypeScript compiles clean: `npm run build`.