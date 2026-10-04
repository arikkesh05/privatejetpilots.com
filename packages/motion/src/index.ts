export const REFERO_CANVAS_TOKENS = {
  backdrop: {
    absoluteBlack: "#000000",
    spaceBlack: "#020409",
  },
  stagePresence: {
    desktopMinHeight: "85vh",
    mobileMinHeight: "78vh",
  },
  atmosphericGlow: {
    fresnelShellRadiusScale: 1.04,
    colorCyan: "#38bdf8",
    colorSapphire: "#60a5fa",
    blending: "additive",
  },
} as const;

export const REFERO_HUD_TOKENS = {
  floatingControls: {
    background: "rgba(15, 23, 42, 0.65)",
    backdropBlur: "blur(24px)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.45)",
    textPrimary: "#FFFFFF",
    textSecondary: "#94A3B8",
  },
} as const;

export const REFERO_BILLBOARD_GEOMETRY = {
  characterSprite: {
    normalOffset: 4.2,
    alignment: "perpendicular-sphere-normal",
  },
  nameTagPill: {
    backgroundColor: "#FFFFFF",
    textColor: "#0F172A",
    borderRadius: "9999px",
    paddingX: "10px",
    paddingY: "4px",
    fontWeight: 600,
  },
  orientation: "camera-locked",
} as const;

export const REFERO_MOTION_DYNAMICS = {
  orbitDrag: {
    inertiaDecayFactor: 0.05,
    dampingType: "exponential-decay",
  },
  zoomConstraints: {
    minDistance: 130,
    maxDistance: 380,
  },
  pitchConstraints: {
    minPitch: 0.25,
    maxPitch: Math.PI - 0.25,
  },
  bottomDrawerPeek: {
    transformDefault: "translateY(0)",
    durationMs: 300,
    cubicBezier: "cubic-bezier(0.16, 1, 0.3, 1)",
    transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
  },
} as const;

export type ReferoCanvasTokens = typeof REFERO_CANVAS_TOKENS;
export type ReferoHudTokens = typeof REFERO_HUD_TOKENS;
export type ReferoBillboardGeometry = typeof REFERO_BILLBOARD_GEOMETRY;
export type ReferoMotionDynamics = typeof REFERO_MOTION_DYNAMICS;
