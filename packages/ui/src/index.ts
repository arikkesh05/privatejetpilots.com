export * from "@pjp/tokens";
export * from "@pjp/motion";
export * from "./data/telemetry-airports.js";
export * from "./telemetry/IcaoAvionicsTicker.js";

export interface ReferoHUDStyle {
  background: string;
  backdropFilter: string;
  border: string;
  boxShadow: string;
  color: string;
}

export const createReferoHUDStyle = (): ReferoHUDStyle => ({
  background: "rgba(15, 23, 42, 0.65)",
  backdropFilter: "blur(24px)",
  border: "1px solid rgba(255, 255, 255, 0.12)",
  boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.45)",
  color: "#FFFFFF",
});

export interface NameTagPillStyle {
  backgroundColor: string;
  color: string;
  borderRadius: string;
  padding: string;
  fontWeight: number;
}

export const createNameTagPillStyle = (): NameTagPillStyle => ({
  backgroundColor: "#FFFFFF",
  color: "#0F172A",
  borderRadius: "9999px",
  padding: "4px 10px",
  fontWeight: 600,
});