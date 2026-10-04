---
name: interface-polish
description: Use when building or refining any user-facing UI - search popovers, cards, modals, HUDs, or 3D scenes - to guarantee tactile micro-interactions, accessibility invariants, and prefers-reduced-motion compliance; synthesized from the ECC skills accessibility, make-interfaces-feel-better, and motion-foundations
---

# Interface Polish — Tactile, Accessible, Motion-Safe

## Overview

**Core principle:** Interfaces should feel physical, be operable by everyone, and calm down when asked. Delight is layered **on top of** invariants, never instead of them.

**Violating the letter of a pillar violates the spirit of all three.**

## The Iron Law

```
NO UI SHIPS WITHOUT TACTILE FEEDBACK, A11Y INVARIANTS, AND REDUCED-MOTION COMPLIANCE
```

## When to Use

Every user-facing change, especially:
- Search popovers / result dropdowns (`GlobeSearch`, `globeSearch.ts`)
- Card actions, pill badges, tab rails, modals
- HUD overlays and counter/typewriter animations (`globeHud.ts`)
- Three.js camera moves and scene transitions (`globeCamera.ts`, `globeScene.ts`)

## Provenance

This skill synthesizes three ECC skills:

| Pillar | ECC Source | Core Question |
|--------|-----------|---------------|
| 1. Tactile Feedback | `make-interfaces-feel-better` | "Does the interface respond to touch like a physical object?" |
| 2. Accessibility Invariants | `accessibility` | "Can every user and every input device operate this?" |
| 3. Motion Compliance | `motion-foundations` | "Does motion respect the user's stated motion preference?" |

---

## PILLAR 1: TACTILE FEEDBACK

### Micro-Transitions
- [ ] Every interactive element (button, card, tab, badge) has a hover **and** active state — never a dead-feeling control.
- [ ] Animate **only `transform` and `opacity`** (compositor-friendly); never `width`/`height`/`top`/`left` (layout thrash).
- [ ] Press feedback within ~100ms of input: active scale `0.97–0.98` on cards/pills, pressed state on buttons.
- [ ] Hover elevation shifts are subtle (shadow + 1–2px translate), matching the soft ambient elevation brand language.

### Spring / Ease Curves
- [ ] Entrances (popovers, dropdowns, modals): scale from `0.96→1` + translateY `4px→0` with a spring curve, e.g. `cubic-bezier(0.34, 1.56, 0.64, 1)`, ~180–220ms.
- [ ] Exits: ease-in (`cubic-bezier(0.4, 0, 1, 1)`), shorter (~120–150ms) — leave faster than you arrive.
- [ ] Standard UI moves: `ease-out` ~200ms; no `linear` except opacity crossfades.
- [ ] Search popover results: entrance transforms are **staggered** (30–50ms per row) rather than one block fade.
- [ ] Card actions (share, select, expand) animate from their current state — no jump cuts between layout states.

### Continuity Rules
- [ ] State changes animate **from where the element currently is** (transform interpolation), not from a hardcoded origin.
- [ ] Loading→content swaps keep the container stable (min-height or skeleton) so nothing reflows jarringly.

---

## PILLAR 2: ACCESSIBILITY INVARIANTS

These are **non-negotiable gates**, not enhancements. They align 1:1 with the `accessibility-compliance-accessibility-audit` skill.

### Touch Targets
- [ ] Every button, link, tab, and interactive badge: **minimum 44×44 CSS px** hit area.
- [ ] Visually small controls (icon buttons, ✕ close, pill badges) expand hit area via padding or pseudo-element — visual size ≠ target size.

### Valid ARIA
- [ ] Semantic HTML first (`button`, `nav`, `dialog`); ARIA only fills gaps. **No redundant roles on implicit semantics** (never `role="button"` on `<button>`).
- [ ] Composite widgets get correct roles: search results use `listbox`/`option` with `aria-activedescendant` or roving `tabIndex`; tab rails use `tablist`/`tab`/`tabpanel` (Altar OS precedent).
- [ ] Every interactive control has a human-meaningful accessible name; decorative icons are `aria-hidden="true"`.
- [ ] Async updates (search results, save state) announce via `aria-live` regions.

### Focus Management
- [ ] Modals/dialogs: **trap focus** while open, move focus in on open, **restore to the invoking element on close**.
- [ ] No removed focus outlines without a visible `:focus-visible` replacement.
- [ ] Overlay open/close never leaves focus on a hidden or removed element.

### Keyboard Navigation
- [ ] **Escape** closes the topmost layer (popover → drawer → modal), in that order.
- [ ] **ArrowUp/ArrowDown** moves through search results (with `Home`/`End` for first/last); **Enter** selects.
- [ ] **ArrowLeft/ArrowRight** switches tabs (Altar OS precedent); Tab order follows reading order (no positive `tabIndex`).
- [ ] Full keyboard operability — every mouse path has a keyboard equivalent.

---

## PILLAR 3: MOTION COMPLIANCE

**`prefers-reduced-motion: reduce` is a user instruction, not a suggestion.** Honor it across CSS, HUD animations, and Three.js.

### CSS Layer
- [ ] Global guard:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
  ```
- [ ] Feature-level overrides for popovers/staggered entrances: settle instantly at final state, keep opacity change (state must still be perceivable).

### Three.js Layer (`globeCamera` / `globeScene`)
- [ ] Camera lerps/tweens check `matchMedia('(prefers-reduced-motion: reduce)')` first; when reduced → **jump directly to target pose** (instant `camera.position`/`lookAt` set, zero interpolation frames, zero orbit inertia/damping).
- [ ] Autorotate/idle spin disabled under reduced motion.
- [ ] Prefer a single decision at animation start over per-frame media queries (cheap, no layout reads in the render loop).

### HUD Layer (`globeHud`)
- [ ] Counter/typewriter/fade HUD animations render their **final state immediately** when reduced motion is preferred.
- [ ] Marker pulse/bounce loops are static under reduced motion (position correct, no animation).

### React Integration
- [ ] Use a `useReducedMotion()` hook backed by `matchMedia` with a `change` listener (user can flip the OS setting live — respond without reload).
- [ ] SSR-safe: default to `false` pre-hydration, decide on mount; no hydration mismatch from motion-dependent markup.

---

## Red Flags — STOP

- "The spring curve makes it feel nice, I skipped the focus trap" — Delight never outranks invariants. Add the trap.
- "Reduced-motion users are rare" — They are users with a medical reason. The media query exists for them.
- "I'll animate `top`/`left`, it's simpler" — Layout animations jank on mobile. Transform only.
- "Escape key later" — A popover without Escape is a trap for keyboard users.
- "The camera lerp is only 300ms, exempt it" — Vestibular triggers don't have a duration exemption. Respect the query.

## Quick Reference

| Pillar | Key Checks | Pass Criteria |
|--------|-----------|---------------|
| **1. Tactile** | transform/opacity only, spring entrances, press states, staggered results | Every interaction feels physical, zero layout thrash |
| **2. A11y Invariants** | 44×44 targets, valid ARIA, focus trap/restore, Escape + arrows | Fully operable by touch, keyboard, and screen reader |
| **3. Motion** | reduced-motion in CSS + Three.js camera + HUD, live `change` listener | `prefers-reduced-motion` yields a calm, still interface |

