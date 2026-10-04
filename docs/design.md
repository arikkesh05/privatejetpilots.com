# Stratosphere Nocturne (PJP Design System) — Master Identity

## 1. Aesthetic Foundations
- **Atmosphere**: Quiet luxury aviation, aerodynamic precision, alternating flight-level cadence.
- **Rhythm**: Dark nocturnal hero -> Alabaster daylight booking deck -> Nocturne fleet deck -> Alabaster cabin specs -> Stratosphere footer.
- **Canvas Base**: Stratosphere Navy `#060B12` (Flight layers) & Warm Alabaster `#F9F8F5` (Charter booking).
- **Accents**: Liquid Champagne `#CBB079` (strictly reserved for 5% of surface: primary actions, range arcs, metrics).

## 2. Typography Hierarchy
- **Display Headlines**: Refined High-Contrast Grotesque (Geist / Inter Display) with uppercase tracking (`tracking-wider`).
- **Body & Forms**: Neutral Swiss Grotesque with tall line heights (`1.55`).
- **Flight Telemetry & Range**: Tabular Monospace (`font-mono`) with `font-variant-numeric: tabular-nums`.

## 3. Surface & Elevation Layers
- `Surface 0`: `#060B12` (Full-bleed ruay/cabin backdrop).
- `Surface 1 (Glass HUD)`: `rgba(14, 23, 36, 0.75)` with `backdrop-filter: blur(24px)`.
- `Surface 2 (Daylight Deck)`: `#F9F8F5` with `1px solid rgba(15, 21, 31, 0.08)`.
- `Surface 3 (Modal Sheet)`: `#131E2E` with hairline rim light `1px solid rgba(203, 176, 121, 0.25)`.

## 4. Motion Principles
- **Glide Dynamics**: Smooth aerodynamic ease-out `cubic-bezier(0.16, 1, 0.3, 1)`.
- **Duration**: Fast micro-feedback `180ms`, Card/Sheet reveals `400ms`.
