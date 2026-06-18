---
name: Acneno HRMS
description: Calm, field-ready mobile HR app. Warm-maroon utility, restrained chrome.
colors:
  maroon-primary: "#6B1A2B"
  maroon-active: "#A3253B"
  ink: "#1A1A1A"
  text-secondary: "#6B7280"
  text-tertiary: "#9CA3AF"
  surface: "#FFFFFF"
  surface-warm: "#FAFAFA"
  surface-warm-2: "#F5F5F5"
  sand: "#F2F0ED"
  maroon-tint: "#F0E8EA"
  border-warm: "#E8E0E2"
  success: "#047857"
  success-bg: "#D1FAE5"
  warning: "#B45309"
  warning-bg: "#FEF3C7"
  danger: "#BE123C"
  danger-bg: "#FFE4E6"
  info: "#1D4ED8"
  info-bg: "#DBEAFE"
  legacy-blue: "#2454DB"
typography:
  display:
    fontFamily: "System (SF Pro / Roboto)"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "normal"
  headline:
    fontFamily: "System (SF Pro / Roboto)"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.25
  title:
    fontFamily: "System (SF Pro / Roboto)"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "System (SF Pro / Roboto)"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "System (SF Pro / Roboto)"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.01em"
rounded:
  sm: "12px"
  md: "16px"
  lg: "24px"
  full: "9999px"
spacing:
  sm: "8px"
  md: "16px"
components:
  button-primary:
    backgroundColor: "{colors.maroon-primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.sm}"
    padding: "12px 16px"
  button-primary-active:
    backgroundColor: "{colors.maroon-active}"
    textColor: "{colors.surface}"
    rounded: "{rounded.sm}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.maroon-primary}"
    rounded: "{rounded.sm}"
    padding: "12px 16px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.maroon-primary}"
    rounded: "{rounded.sm}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "16px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "12px"
  chip-status:
    rounded: "{rounded.full}"
    padding: "4px 12px"
---

# Design System: Acneno HRMS

## 1. Product Context

### Users

Field and mobile employees of Acneno. They use the app on the move, phone in
hand, often outdoors and in variable light. The dominant moment is a fast
check-in / check-out at or near the office, with GPS and Wi-Fi validation
running in the background. Secondary moments: filing leave, submitting
overtime, tracking request status, approving requests, and updating profile
information. They are not power users sitting at a desk; they want in, done,
out.

### Product Purpose

Acneno HRMS is a React Native mobile app for HR operations: attendance
tracking, leave management, overtime requests, approvals, and secure access
with JWT, PIN, and biometrics. It exists so employees can complete HR tasks
from their phone without friction and trust that attendance was recorded
correctly. Success means the daily check-in is a two-tap, sub-five-second
action and request status is never ambiguous.

### Brand Personality

Calm, reliable, clear. Quiet confidence that gets out of the way. The feel
target is Linear / Raycast applied to a mobile HR app: tight spacing, minimal
chrome, fast, no decorative noise. Tone in copy is plain and direct, never
corporate-formal and never cute. The interface should feel premium and
trustworthy through restraint, not ornament.

### Accessibility And Inclusion

Target WCAG 2.1 AA contrast as a floor. Derived from the field-employee
context: outdoor sunlight readability, minimum 44pt tap targets, reduced-motion
support, and no status conveyed by color alone. Treat these as product
defaults unless the team defines a stricter compliance bar.

## 2. Overview

**Creative North Star: "The Field Instrument"**

Acneno HRMS is a rugged precision tool for employees who use it on the move,
phone in one hand, often outdoors in changing light. It behaves like a
well-made field instrument: the readout is glanceable, the controls are few
and obvious, and it never demands attention it has not earned. The dominant
moment is a two-tap check-in that should feel instant and certain. Everything
visual serves that certainty.

The system is warm, not corporate. A single deep maroon carries identity and
action; everything else is a warm-tinted neutral. Restraint is the aesthetic:
soft radii, almost no shadow, tonal layering instead of elevation theatrics.
The feel target is Linear / Raycast applied to a mobile HR app, tight, fast,
quiet, no decorative noise.

This system explicitly rejects two things. It is **not** heavy enterprise HR
(SAP / Oracle / Workday): no dense data tables, cramped multi-field forms,
dated dropdowns, or gray-on-gray sludge. It is **not** a generic SaaS template:
no gradient hero blocks, no endless identical icon-heading-text card grids, no
purple-on-white Bootstrap clone, no hero-metric template.

**Key Characteristics:**
- One maroon accent, used sparingly; warm-tinted neutrals everywhere else.
- Flat by default; shadow only on the floating nav and resting cards.
- System typeface, tight scale, hierarchy by weight not ornament.
- Glanceable status, always paired with label or icon, never color alone.
- One reusable pattern applied everywhere; no per-screen invention.

## 3. Colors

A restrained warm palette: tinted neutrals carry the surface, one deep maroon
carries identity and every primary action.

### Primary
- **Field Maroon** (#6B1A2B): The single brand and action color. Primary
  buttons, active nav, filled PIN dots, key affordances. Deep enough to read
  in sunlight, calm enough not to shout.
- **Maroon Live** (#A3253B): Pressed / active state of Field Maroon only.
  Brighter, signals the tap registered. Never used as a resting color.

### Neutral
- **Ink** (#1A1A1A): Primary text. A warm near-black, never pure `#000`.
- **Secondary Text** (#6B7280): Sub-labels, metadata, helper copy.
- **Tertiary Text** (#9CA3AF): Placeholders, disabled, lowest-priority text.
- **Surface** (#FFFFFF): Card and input fill. The only true white, used as a
  lift against warm backgrounds, not as the page base.
- **Warm Surface** (#FAFAFA) / **Warm Surface 2** (#F5F5F5): Page and grouped
  backgrounds. The screen is warm, not stark.
- **Sand** (#F2F0ED): Warm divider / inset / muted panel background.
- **Maroon Tint** (#F0E8EA): Maroon-washed background for selected or
  maroon-adjacent surfaces (e.g. active PIN context).
- **Warm Border** (#E8E0E2): Hairline borders and inactive PIN dots. Borders
  are warm-tinted, never cool slate.

### Status (semantic, paired with label/icon, never color-alone)
- **Success** text #047857 on **Success BG** #D1FAE5: approved.
- **Warning** text #B45309 on **Warning BG** #FEF3C7: pending.
- **Danger** text #BE123C on **Danger BG** #FFE4E6: rejected / cancelled.
- **Info** text #1D4ED8 on **Info BG** #DBEAFE: submitted / in-review.

### Deprecated
- **Legacy Blue** (#2454DB): the old `brand-*` scale. **Removed from `src`**
  (migrated to `maroon-*` + `tokens.colors`). Do not reintroduce.
- **Cool neutrals** (`slate-*` Tailwind defaults, custom `ink` blue-gray
  scale): still wired into form components and ~17 screens. Remaining
  migration debt, phase 2. Replace with `warm` / `sand` / `borderwarm` /
  `textink` / `textsub` on every file you touch.

### Named Rules
**The One Maroon Rule.** Field Maroon appears on no more than one primary
action per screen. Its scarcity is what makes a check-in button unmissable.
If two things are maroon, neither reads as primary.

**The Warm Neutral Rule.** Every neutral is tinted warm. Cool slate / blue-gray
(`#E2E8F0`, `slate-50`, `ink-600`) is prohibited; it reads as the deprecated
system. Use Sand, Warm Surface, and Warm Border instead.

## 4. Typography

**Display Font:** System (SF Pro on iOS, Roboto on Android)
**Body Font:** System (same stack)
**Label Font:** System (same stack)

**Character:** No custom typeface. Identity comes from a tight scale and
decisive weight contrast, not from a brand font. This keeps the app native,
fast, and legible in the field where custom fonts would only add weight.

### Hierarchy
- **Display** (700, 30px, 1.15): Login title, first-run headlines. One per
  screen at most.
- **Headline** (600, 20px, 1.25): Screen titles, primary section headers.
- **Title** (600, 18px, 1.3): Card titles, grouped-list headers.
- **Body** (400, 16px, 1.45): All content and values. 16px floor, never
  smaller for primary content (field readability).
- **Label** (600, 13px, +0.01em): Field labels, status chips, tab labels
  (11px in the tab bar by exception). Quiet, slightly tightened.

### Named Rules
**The Weight-Not-Size Rule.** Hierarchy steps change weight first, size
second. Adjacent levels keep a >=1.25 size ratio so the scale never flattens
into mush on a small screen.

**The 16px Floor Rule.** Primary content and values never drop below 16px.
Sub-16px is for labels and chrome only. Field users do not squint.

## 5. Elevation

This is a flat, tonally-layered system. Depth comes from warm surface tiers
(Warm Surface page, white Surface card, Sand inset), not from shadow stacks.
Shadow is a rare structural signal, not ambient decoration.

### Shadow Vocabulary
- **Resting card** (`shadow-sm`, approx `0 1px 2px rgba(15,23,42,0.05)`): a
  whisper of separation for white cards on warm backgrounds. Barely visible
  by design.
- **Floating nav** (`0 8px 18px rgba(15,23,42,0.10)`, elevation 8): the only
  meaningful shadow in the app, lifting the floating tab pill off content.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. If a screen needs a
shadow to create hierarchy, the layout is wrong; re-tier with warm surfaces
first. Only the floating nav earns a real shadow.

## 6. Components

### Buttons
- **Shape:** Gently rounded, 12px radius (`rounded-xl`). Refined and
  restrained, never pill-shaped for primary actions.
- **Primary:** Field Maroon fill (#6B1A2B), white label, 600 weight,
  `12px 16px` padding, full-width in forms. Active state shifts to Maroon
  Live (#A3253B). Implemented via `bg-maroon-600` (`src/ui/Button`).
- **Secondary:** White fill, 1px Field Maroon border, maroon label.
- **Ghost:** Transparent, maroon label, no border. Low-emphasis actions only.
- **Disabled / Loading:** 50% opacity, spinner inline before label.

### Chips (status)
- **Style:** Fully rounded (`rounded-full`), tinted background + matching
  700-weight text, no border. `4px 12px` padding, `self-start`.
- **State:** One variant per request state (pending / submitted / approved /
  rejected / cancelled) mapped to the Status palette. The text label always
  states the status; color reinforces, never replaces it.

### Cards / Containers
- **Corner Style:** 16px radius (`rounded-2xl`, `tokens.radius.card`).
- **Background:** White Surface on a Warm Surface page.
- **Shadow Strategy:** Resting-card whisper only (see Elevation). Never nest
  cards; re-tier with Sand instead.
- **Border:** None by default; Warm Border hairline only when separation is
  essential.
- **Internal Padding:** 16px (`tokens.spacing.card`).

### Inputs / Fields
- **Style:** White fill, 1px Warm Border, 12px radius. Label above in
  Secondary Text, 600 weight. 16px input text in Ink.
- **Focus:** Border shifts to Field Maroon. No glow, no scale.
- **Error:** Danger text message below; do not recolor the whole field, keep
  the message explicit.
- **Multiline:** min-height 96px, top-aligned text.

### Navigation
- **Style:** Floating rounded pill (24px radius), warm off-white fill, hairline
  Warm Border, lifted by the one Floating-nav shadow. Detached from screen
  edges (inset margins, raised off the bottom safe area).
- **States:** Active = Field Maroon icon + label; inactive = Secondary Text.
  Labels 11px / 600 by exception (tab-bar density).
- **Mobile:** Inset 12px phone / centered max 680px tablet.

### PIN Dots (signature component)
Six dots, 16px, fully round. Filled = Field Maroon, empty = Warm Border. The
PIN screen is the clearest expression of the system: maroon-on-warm, zero
chrome, instant feedback. Treat it as the reference for new screens.

## 7. Do's and Don'ts

### Do:
- **Do** keep Field Maroon (#6B1A2B) to one primary action per screen.
- **Do** tint every neutral warm; use Sand / Warm Surface / Warm Border.
- **Do** keep primary content and values at 16px or larger.
- **Do** convey hierarchy by weight first, surface tier second, shadow last.
- **Do** pair every status color with a text label or icon.
- **Do** reuse `src/ui` components; one pattern applied everywhere.
- **Do** migrate `brand-*` / `slate` / `ink` blues to maroon + warm neutrals
  on every file you touch.

### Don't:
- **Don't** use cool slate or blue-gray neutrals (`#E2E8F0`, `slate-50`,
  `ink-600`); that is the deprecated system.
- **Don't** ship the legacy blue `#2454DB` as a brand or action color.
- **Don't** build heavy enterprise-HR density: no dense tables, cramped
  multi-field forms, or dated native dropdowns.
- **Don't** build generic-SaaS clichés: no gradient hero, no identical
  icon-heading-text card grids, no hero-metric template, no Bootstrap purple.
- **Don't** add shadows to create hierarchy; only the floating nav earns one.
- **Don't** nest cards or wrap everything in a container.
- **Don't** use `border-left`/`border-right` color stripes, gradient text, or
  decorative glassmorphism.
- **Don't** reach for a modal first; exhaust inline and progressive options.
