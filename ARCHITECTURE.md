# System Architecture — PJP Design System & Sovereign Docs

## 1. High-Level Workspace Architecture
The repository is a high-performance pnpm monorepo structured with isolated package concerns:

pjp-design-system/
├── apps/
│   └── docs/                     # Vite + React 19 production flight deck app
│       ├── src/
│       │   ├── components/       # Modular, self-contained section components
│       │   ├── hooks/            # Avionics audio & telemetry stream hooks
│       │   ├── data/             # Fleet specifications & assets
│       │   ├── index.css         # Clean Tailwind CSS rules & luxury utility classes
│       │   └── App.tsx           # Single-page editorial orchestrator
├── packages/
│   ├── tokens/                   # Aero Obsidian color & typography tokens
│   ├── ui/                       # Reusable sovereign UI primitives
│   └── tsconfig/                 # Shared TypeScript configurations
├── PRD.md                        # Product requirements
├── ARCHITECTURE.md               # Technical architecture
├── DESIGN.md                     # Design system tokens & Jesko Jets standards
├── TASKS.md                      # Atomic implementation backlog
└── MEMORY.md                     # Persistent state ledger


## 2. Technology Stack
- **Framework**: React 19 (Strict Mode, concurrent rendering)
- **Language**: TypeScript 5.8+ (Strict type checking, zero `any`)
- **Styling**: Tailwind CSS 3.4 with custom Aero Obsidian design tokens
- **Build Tool**: Vite 6.4 (ESM native, sub-250ms HMR)
- **3D Graphics**: Three.js r128 (isolated WebGL tactical canvas with static fallback)
- **Audio Synthesis**: Web Audio API (procedural tactile feedback oscillators)
- **Package Manager**: pnpm 9+ with workspace protocols
