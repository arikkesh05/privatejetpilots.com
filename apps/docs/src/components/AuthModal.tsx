import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../contexts/AuthContext";

interface AuthModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialMode?: "signin" | "signup";
}

const ROLES = [
  { id: "pilot", title: "ATP / PIC", sub: "Flight Crew" },
  { id: "operator", title: "Part 135", sub: "Operator" },
  { id: "broker", title: "Broker", sub: "Charter / Sales" },
  { id: "mechanic", title: "A&P Tech", sub: "Maintenance" },
];

export function AuthModal({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  initialMode = "signin",
}: AuthModalProps) {
  const { signInWithPassword, signUpWithPassword, enterGuestMode, isLoading: authLoading } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const [isSignUp, setIsSignUp] = useState(initialMode === "signup");

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("pilot");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isControlled = controlledIsOpen !== undefined;
  const show = isControlled ? controlledIsOpen : internalOpen;

  const handleClose = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    if (isControlled && controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalOpen(false);
    }
  };

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent<{ mode?: "signin" | "signup" }>;
      if (customEvent.detail?.mode) {
        setIsSignUp(customEvent.detail.mode === "signup");
      }
      setErrorMsg(null);
      setSuccessMsg(null);
      setInternalOpen(true);
    };
    window.addEventListener("pjp:open-auth", handleOpen);
    return () => window.removeEventListener("pjp:open-auth", handleOpen);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && show) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [show]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      if (isSignUp) {
        const { error } = await signUpWithPassword(email, password, fullName, role);
        if (error) {
          setErrorMsg(error.message);
        } else {
          setSuccessMsg("Airman credential registered. Check inbox for verification.");
          setTimeout(() => handleClose(), 2000);
        }
      } else {
        const { error } = await signInWithPassword(email, password);
        if (error) {
          setErrorMsg(error.message);
        } else {
          handleClose();
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Authentication failed. Verify credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!show) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={handleClose}
      />

      {/* Dual-Pane Sliding Card Container */}
      <div className="relative w-full max-w-4xl h-[620px] rounded-3xl bg-[#07090D] border border-[#CBB079]/30 shadow-[0_25px_70px_rgba(0,0,0,0.95),0_0_40px_rgba(203,176,121,0.12)] overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 flex">
        
        {/* Floating Glassmorphic Close Button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className="absolute top-6 right-6 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141824]/90 border border-[#CBB079]/40 text-[#CBB079] hover:text-white hover:border-[#CBB079] hover:bg-[#1E2333] shadow-[0_4px_20px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-all duration-200 cursor-pointer text-[11px] font-mono tracking-widest group active:scale-95"
        >
          <span>CLOSE</span>
          <svg
            className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 group-hover:rotate-90 transition-all"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* LEFT PANE: SIGN IN */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center bg-[#07090D] overflow-y-auto">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[#CBB079] text-xs">✦</span>
              <span className="font-mono text-[10px] tracking-[0.2em] text-[#CBB079] uppercase font-semibold">
                CREW ACCESS TERMINAL
              </span>
            </div>
            <h2 className="text-3xl font-serif text-white tracking-wide">Sign In</h2>
            <p className="text-xs text-white/50 mt-1">Authenticate verified flight department credentials</p>
          </div>

          {errorMsg && !isSignUp && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs font-mono">
              {errorMsg}
            </div>
          )}
          {successMsg && !isSignUp && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pilot@privatejetpilots.com"
                className="w-full px-4 py-3 rounded-xl bg-[#0D1017] border border-white/[0.1] focus:border-[#CBB079] focus:outline-none text-white text-sm placeholder-white/20 transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1.5">
                Passkey
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-3 rounded-xl bg-[#0D1017] border border-white/[0.1] focus:border-[#CBB079] focus:outline-none text-white text-sm placeholder-white/20 transition-all font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || authLoading}
              className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#C59B27] hover:brightness-110 active:scale-[0.99] text-black font-mono text-xs uppercase tracking-[0.16em] font-bold shadow-[0_4px_24px_rgba(212,175,55,0.25)] transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Verifying..." : "Sign In to Ops"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              enterGuestMode();
              handleClose();
            }}
            className="mt-6 text-center text-[11px] font-mono text-white/40 hover:text-[#CBB079] tracking-wider transition-colors cursor-pointer"
          >
            Continue in Specimen Airman Mode →
          </button>
        </div>

        {/* RIGHT PANE: REGISTER FORM */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center bg-[#07090D] overflow-y-auto">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[#CBB079] text-xs">✦</span>
              <span className="font-mono text-[10px] tracking-[0.2em] text-[#CBB079] uppercase font-semibold">
                JOIN THE SQUADRON
              </span>
            </div>
            <h2 className="text-3xl font-serif text-white tracking-wide">Register</h2>
            <p className="text-xs text-white/50 mt-1">Enroll your flight operations credential</p>
          </div>

          {errorMsg && isSignUp && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs font-mono">
              {errorMsg}
            </div>
          )}
          {successMsg && isSignUp && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1">
                Full Name / Callsign
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Capt. John Doe"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D1017] border border-white/[0.1] focus:border-[#CBB079] focus:outline-none text-white text-xs placeholder-white/20 transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1">
                Primary Flight Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    className={'p-2 rounded-xl border text-left transition-all cursor-pointer ' + (
                      role === r.id
                        ? 'border-[#CBB079] bg-[#CBB079]/10 text-white'
                        : 'border-white/10 bg-[#0D1017] text-white/50 hover:border-white/20'
                    )}
                  >
                    <div className="font-mono text-[10px] font-bold">{r.title}</div>
                    <div className="text-[9px] text-white/40">{r.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pilot@privatejetpilots.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D1017] border border-white/[0.1] focus:border-[#CBB079] focus:outline-none text-white text-xs placeholder-white/20 transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1">
                Passkey
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D1017] border border-white/[0.1] focus:border-[#CBB079] focus:outline-none text-white text-xs placeholder-white/20 transition-all font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || authLoading}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#C59B27] hover:brightness-110 active:scale-[0.99] text-black font-mono text-xs uppercase tracking-[0.16em] font-bold shadow-[0_4px_24px_rgba(212,175,55,0.25)] transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Enlisting..." : "Request Credentials"}
            </button>
          </form>
        </div>

        {/* SLIDING OVERLAY PANEL */}
        <div
          className={'absolute top-0 bottom-0 left-0 w-1/2 z-20 transition-transform duration-700 ease-in-out hidden md:flex flex-col justify-center items-center text-center p-10 bg-gradient-to-br from-[#121622] via-[#0C0F17] to-[#07090D] border-r border-white/10 ' + (
            isSignUp
              ? 'translate-x-full border-l border-white/10'
              : 'translate-x-0'
          )}
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute inset-0 bg-radial-gradient pointer-events-none opacity-40 bg-[radial-gradient(circle_at_50%_40%,rgba(203,176,121,0.18),transparent_70%)]" />

          {!isSignUp ? (
            <div className="relative z-10 flex flex-col items-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setErrorMsg(null);
                }}
                className="w-16 h-16 rounded-full bg-[#CBB079]/15 border-2 border-[#CBB079] flex items-center justify-center text-[#FFE57F] shadow-[0_0_25px_rgba(203,176,121,0.25)] mb-6 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer group"
              >
                <span className="material-symbols-outlined text-3xl group-hover:rotate-90 transition-transform duration-300">
                  add
                </span>
              </button>
              <span className="font-mono text-[10px] tracking-[0.24em] text-[#CBB079] uppercase font-semibold mb-2">
                JOIN THE SQUADRON
              </span>
              <h3 className="text-3xl font-serif text-white tracking-wide mb-3">
                New to PJP?
              </h3>
              <p className="text-xs text-white/50 max-w-xs leading-relaxed mb-6 font-mono">
                Request verified flight crew credentials to access dispatch, radar telemetry, and operator avionics.
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setErrorMsg(null);
                }}
                className="px-6 py-2.5 rounded-full border border-[#CBB079]/60 bg-[#07090D]/80 text-[#FFE57F] hover:bg-[#CBB079]/20 hover:border-[#FFD700] font-mono text-[10px] tracking-[0.2em] uppercase transition-all duration-200 cursor-pointer active:scale-95 shadow-lg"
              >
                Sign Up
              </button>
            </div>
          ) : (
            <div className="relative z-10 flex flex-col items-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setErrorMsg(null);
                }}
                className="w-16 h-16 rounded-full bg-[#CBB079]/15 border-2 border-[#CBB079] flex items-center justify-center text-[#FFE57F] shadow-[0_0_25px_rgba(203,176,121,0.25)] mb-6 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer group"
              >
                <span className="material-symbols-outlined text-3xl group-hover:-translate-x-0.5 transition-transform duration-300">
                  flight_takeoff
                </span>
              </button>
              <span className="font-mono text-[10px] tracking-[0.24em] text-[#CBB079] uppercase font-semibold mb-2">
                EXISTING CREW
              </span>
              <h3 className="text-3xl font-serif text-white tracking-wide mb-3">
                Welcome Back!
              </h3>
              <p className="text-xs text-white/50 max-w-xs leading-relaxed mb-6 font-mono">
                Re-authenticate your PIC / Airman session to resume cockpit flight deck operations.
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setErrorMsg(null);
                }}
                className="px-6 py-2.5 rounded-full border border-[#CBB079]/60 bg-[#07090D]/80 text-[#FFE57F] hover:bg-[#CBB079]/20 hover:border-[#FFD700] font-mono text-[10px] tracking-[0.2em] uppercase transition-all duration-200 cursor-pointer active:scale-95 shadow-lg"
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
