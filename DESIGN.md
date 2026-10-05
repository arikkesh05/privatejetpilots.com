# Design System Specification — Aero Obsidian (Jesko Jets Benchmark)

## 1. Design Philosophy
- **Aesthetic Benchmark**: Jesko Jets (jeskojets.com) — minimal, high-contrast, editorial, restrained luxury.
- **Primary Canvas**: Chrome Black / Deep Obsidian (`#0D0D0D` / `#0A0A0A`).
- **Contrast Principle**: Pristine white and champagne gold headlines set against deep obsidian fields with generous negative space.

## 2. Color Palette Tokens
| Token Name | Hex Code | Emitted RGB | Purpose |
|---|---|---|---|
| Obsidian Black | `#0D0D0D` | `rgb(13, 13, 13)` | Primary canvas background |
| Obsidian Deep | `#070707` | `rgb(7, 7, 7)` | Section grounding / cards background |
| Metallic Gold | `#DFC066` | `rgb(223, 192, 102)` | Primary CTAs, active highlights, key borders |
| Champagne Gold | `#F5D061` | `rgb(245, 208, 97)` | Accent badges, hover sheens |
| Amber Muted | `#E8B938` | `rgb(232, 185, 56)` | Subtle status indicators |
| Digital Lilac | `#D9B8FF` | `rgb(217, 184, 255)` | Refined telemetry secondary pips |
| Nordic Indigo | `#263BAA` | `rgb(38, 59, 170)` | Tactical vector map accents |
| Slate Ocean | `#2F4858` | `rgb(47, 72, 88)` | Structural card borders and dividing lines |

## 3. Typography Scale
- **Headlines (`font-headline`)**: Syne (Weights: 600, 700, 800) — sculptured, luxury editorial tracking.
- **Body & Editorial (`font-sans`)**: Inter — crisp, legible, high-contrast reading text.
- **Avionics & Telemetry (`font-telemetry`)**: JetBrains Mono — tabular numbers (`font-variant-numeric: tabular-nums`) for jitter-free data readouts.

## 4. Strict Luxury Guidelines
- NO full-screen CRT scanline grids or noise masks.
- NO automated background drone/synthesizer loops.
- Floating nav dock fixed at `top-4`, centered with `h-14` to prevent covering hero content.
