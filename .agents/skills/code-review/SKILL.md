---
name: code-review
description: Use before completing any sprint or claiming any code change is done - runs a 3-lens adversarial review (Privacy, React & WebGL Hygiene, Verification Evidence) synthesized from the ECC skills security-review and performance-optimizer plus adversarial verification
---

# Code Review — 3-Lens Adversarial Protocol (v2)

## Overview

**Core principle:** You are not the author at review time — you are the adversary. Assume the DOM is public, the render tree is hostile, and every claim is a lie until a terminal proves it.

**Violating the letter of any lens is violating the spirit of all three.**

## The Iron Law

```
NO TASK IS COMPLETE UNTIL ALL THREE LENSES PASS WITH FRESH EVIDENCE
```

## When to Use

Before marking ANY task complete, including: new UI/pages/modals, data layer or type changes, WebGL/3D scene changes, share/deep-link/clipboard/geolocation features, and bug fixes (root cause via `systematic-debugging` is a precondition, not a substitute).

**Precondition:** interface polish invariants (touch targets, ARIA, focus, keyboard, reduced motion) are checked via `.agents/skills/interface-polish/` — they are a build-time skill. This review still **spot-checks** them, but does not re-litigate the full checklist.

## Provenance

This protocol synthesizes ECC engineering patterns:

| Lens | Source | Adversarial Question |
|------|--------|---------------------|
| 1. Privacy | `security-review` | "What does this expose to the URL bar, the DOM, and the logs?" |
| 2. React & WebGL Hygiene | `.agents/skills/performance-optimizer/` | "Does this state change remount the canvas, leak GPU memory, or fail silently?" |
| 3. Evidence | Adversarial verification (`verification-before-completion` + ECC review context) | "What fresh terminal output proves this?" |

Run the lenses **in order**; Lens 3 is always last — it is the gate, not a participant.

---

## LENS 1: PRIVACY

You are an attacker with DevTools, the URL bar, and `view-source`. Everything shipped to the client is public.

### Hard Rule — Zero PII Leakage
Raw exact coordinates, private emails, and phone numbers must **NEVER** appear in:
- [ ] DOM attributes or `data-*` tags (e.g., no `data-lat="14.599512"`)
- [ ] **Share URLs / query parameters** — use opaque gathering IDs, never lat/lng or contact fields in `?gathering=`
- [ ] `console.log`, client-rendered payloads, or error messages
- [ ] Client state or persisted storage (localStorage/sessionStorage)

Geospatial rule: only fuzzed/approximate coordinates reach the client, at the minimum precision the feature requires. Precise lat/lng stays server-side behind PostGIS queries (`src/lib/gatherings.ts` pattern).

### Deep-Linking & Share URLs
- [ ] Every input param is sanitized against a strict shape: `?gathering={id}` parsed, type-checked, matched against real records; invalid/unknown IDs degrade to a safe default — never rendered or trusted as data.
- [ ] Share URLs are built exclusively from server-validated, non-PII identifiers.
- [ ] Invalid deep-link handling is explicit and user-facing, not a blank panel.

---

## LENS 2: REACT & WEBGL HYGIENE

You are a hostile performance-optimizer auditor with the React Profiler and a GPU memory tracker open.

### Render Boundary Integrity (HUD / Search)
- [ ] State changes in HUD/Search components **never re-mount or re-render the Three.js canvas**: the canvas component is memoized (`memo`/stable `key`) and lives outside any state that changes per-keystroke or per-hover.
- [ ] Hot-path state (search input, HUD counters) is kept in **local component state or refs**, lifted only as far as needed — no context/store cascades through the scene tree.
- [ ] Search result handlers are stable (`useCallback`) so memoized children don't bust their props; heavy lists use `memo` + keys.
- [ ] `useEffect` dependency arrays are exact — no re-subscription/re-init of the scene per render; no `setState` inside the render loop or rAF callback (that would cascade React re-renders per frame).

### WebGL Memory Hygiene
- [ ] Every `BufferGeometry`, `Material`, `Texture`, and renderer created in an effect is **disposed** on cleanup — no orphans on hot reload or route change.
- [ ] Every `addEventListener` (`resize`, `pointermove`, canvas events) has a matching removal with the **same handler reference**.
- [ ] `requestAnimationFrame` loops cancelled on teardown; no leaked WebGL contexts on remount.
- [ ] No per-frame allocations in the render loop (GC pressure = dropped frames on mobile).

### Retained Anti-Silent-Failure Checks (from v1 protocol — still mandatory)
- [ ] `navigator.share` guarded: unavailable **or rejected** (`AbortError` = user cancel, non-error) → graceful clipboard fallback; failure is user-visible, never a dead click.
- [ ] `navigator.clipboard.writeText` try/catch'd; permission denied / insecure context handled with a visible fallback.
- [ ] No empty `catch {}` without a dated justification comment; every caught error recovers, reports, or degrades visibly.
- [ ] Zero `any` evasions — no `as any`, `as unknown as T`, or un-justified `@ts-ignore`; nullable columns typed `| null` (never `undefined`) per the deterministic-schema rule.

---

## LENS 3: EVIDENCE REQUIREMENT

Claims without fresh output are lies. (Full standard: `.agents/skills/verification-before-completion/`.)

### Mandatory Fresh Terminal Output
Run all four **after the last code edit**, in this session, and paste real output into the report:

1. [ ] `npx tsc --noEmit` — 0 type errors
2. [ ] `npm run lint` — 0 lint warnings
3. [ ] `npm run build` — clean production prerendering
4. [ ] Test suite — all passing (`node --test tests/` convention; if no test applies to the change, state that explicitly with the reason)

"Fresh" = executed after the final edit; earlier output is void. Any failure → fix, re-run **all four**, not just the failed one.

### Canonical Memory Update
- [ ] `MEMORY.md` updated: what shipped, files touched, gate results, gotchas for the next sprint.
- [ ] `.clinerules` quality gates and both registered skills (`interface-polish`, this one) satisfied together — one without the other is incomplete.

---

## Red Flags — STOP and Re-run the Lens

- "The coordinates are only in `data-` attributes for debugging" — That IS a leak. Remove.
- "The canvas won't remount, I *think*" — Verify with a mount counter or React Profiler, not vibes.
- "Disposal is handled somewhere else" — Then show me the cleanup function in this diff.
- "I'll handle share fallback later" — The fallback IS the feature.
- "tsc passed yesterday" — Yesterday's output is not evidence for today's tree.
- "I reviewed my own code carefully" — Author review is not adversarial review. Apply the lens persona.

## Quick Reference

| Lens | Key Checks | Pass Criteria |
|------|-----------|---------------|
| **1. Privacy** | No PII in DOM/URLs/logs/storage, sanitized `?gathering={id}` | Zero client exposure of raw lat/lng, emails, phones |
| **2. React & WebGL** | Canvas survives HUD/Search state changes, full disposal, rAF cancelled, no silent failures | Stable render tree, zero GPU leaks, zero quiet failures |
| **3. Evidence** | Fresh tsc/lint/build/tests + `MEMORY.md` update | All gates exit 0 in the final run, memory current |

