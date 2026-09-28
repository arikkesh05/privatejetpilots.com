# PJP Design System (Private Jet Pilots)

## Overview
This repository contains the core design system, shared token architecture, primitives, and reusable UI components powering the Private Jet Pilots (PJP) digital ecosystem across Web (Next.js) and Mobile (React Native / Expo).

## Architecture & Conventions
- **Project Rules:** Authoritative rules are defined in `.cursor/rules/*.mdc`. Inspect and follow them strictly before proposing changes.
- **Strict Typing:** All components and token utilities must use strict TypeScript. Avoid `any`.
- **Cross-Platform Awareness:** Maintain clear separation between web DOM primitives, React Native native primitives, and agnostic token layers.
- **Verification:** All tests, linter checks, and typechecks must pass before marking tasks complete.