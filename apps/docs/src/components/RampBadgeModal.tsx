'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { InteractiveLanyardBadge } from './InteractiveLanyardBadge';
import { PilotCredential, DEFAULT_PILOT_SPECIMEN } from '../types/credential';
import { usePilotProfile } from '../hooks/usePilotProfile';

export interface RampBadgeModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  pilot?: PilotCredential;
}

export function RampBadgeModal({ isOpen: controlledIsOpen, onClose: controlledOnClose, pilot }: RampBadgeModalProps) {
  const { profile: liveProfile } = usePilotProfile();
  const data = pilot ?? liveProfile ?? DEFAULT_PILOT_SPECIMEN;
  const [internalOpen, setInternalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tokenTimer, setTokenTimer] = useState(58);

  const isControlled = controlledIsOpen !== undefined;
  const show = isControlled ? controlledIsOpen : internalOpen;

  const handleClose = () => {
    if (isControlled && controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalOpen(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    const onOpenEvent = () => setInternalOpen(true);
    const onCloseEvent = () => setInternalOpen(false);

    window.addEventListener('pjp:open-badge', onOpenEvent);
    window.addEventListener('pjp:close-badge', onCloseEvent);

    return () => {
      window.removeEventListener('pjp:open-badge', onOpenEvent);
      window.removeEventListener('pjp:close-badge', onCloseEvent);
    };
  }, []);

  useEffect(() => {
    if (!show) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    const timer = setInterval(() => {
      setTokenTimer((prev) => (prev <= 1 ? 60 : prev - 1));
    }, 1000);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
      clearInterval(timer);
    };
  }, [show]);

  if (!mounted || !show) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#040507]/92 backdrop-blur-2xl p-4 sm:p-8 select-none overflow-y-auto animate-in fade-in duration-200"
      onClick={handleClose}
    >
      {/* Modal Container */}
      <div
        className="relative w-full max-w-5xl rounded-[28px] bg-[#0A0D11]/95 border border-[#CBB079]/30 p-6 sm:p-10 shadow-[0_30px_90px_rgba(0,0,0,0.95),0_0_50px_rgba(203,176,121,0.12)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.08) 0%, transparent 60%), linear-gradient(180deg, #0C0F14 0%, #07090C 100%)',
        }}
      >
        {/* Top Header Row */}
        <div className="flex items-center justify-between pb-6 border-b border-white/[0.08] mb-8">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#CBB079] shadow-[0_0_10px_rgba(203,176,121,0.4)] animate-pulse" />
            <span className="font-badge-header text-[10px] text-[#CBB079] font-semibold tracking-[0.12em]">
              FLIGHT CREW SPECIMEN // EXECUTIVE RAMP DOSSIER
            </span>
          </div>

          <button
            onClick={handleClose}
            className="font-badge-header px-3.5 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 text-[10px] text-[#EDE8DF] hover:text-[#EDE8DF] transition-all tracking-[0.12em]"
          >
            [ ESC ✕ ]
          </button>
        </div>

        {/* Two-Column Dossier Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: 3D Flippable Lanyard Badge */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <InteractiveLanyardBadge mode="modal" pilot={data} />
          </div>

          {/* Right Column: Verified Clearance Telemetry */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. FAA Airmen Registry Telemetry */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <div className="flex items-center justify-between mb-3">
                <span className="font-badge-header text-[10px] text-[#CBB079] font-semibold tracking-[0.12em]">
                  ● FAA AIRMEN REGISTRY TELEMETRY
                </span>
                <span className="font-badge-header text-[10px] text-[#6EE7B7] tracking-[0.12em] font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-ping" />
                  FAA DIRECT SYNC // VERIFIED
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 font-avionics text-xs">
                <div>
                  <span className="font-badge-header text-[8px] tracking-[0.14em] text-[#CBB079] block uppercase">CERTIFICATE GRADE</span>
                  <span className="font-badge-mono text-[11px] text-[#EDE8DF] font-semibold">{data.certificateGrade}</span>
                </div>
                <div>
                  <span className="font-badge-header text-[8px] tracking-[0.14em] text-[#CBB079] block uppercase">COMMERCIAL PRIVILEGES</span>
                  <span className="font-badge-mono text-[11px] text-[#EDE8DF] font-semibold">{data.commercialPrivileges}</span>
                </div>
                <div>
                  <span className="font-badge-header text-[8px] tracking-[0.14em] text-[#CBB079] block uppercase">MEDICAL CERTIFICATION</span>
                  <span className="text-[#6EE7B7] font-semibold">{data.medicalStatus}</span>
                </div>
                <div>
                  <span className="font-badge-header text-[8px] tracking-[0.14em] text-[#CBB079] block uppercase">REGISTRY RECORD</span>
                  <span className="font-badge-mono text-[11px] text-[#EDE8DF] font-semibold">CERT # {data.faaCert}</span>
                </div>
              </div>
            </div>

            {/* 2. Flight Hours Matrix */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <div className="font-hud-header text-[10px] text-[#CBB079] font-semibold tracking-[0.16em] mb-3">
                ● FLIGHT TIME BREAKDOWN MATRIX
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-xl bg-black/40 border border-white/[0.05]">
                  <span className="font-badge-header text-[8px] tracking-[0.14em] text-[#CBB079] block uppercase">TOTAL TIME</span>
                  <span className="font-badge-mono text-xl font-semibold text-[#EDE8DF] block mt-1">{data.hours.total.toLocaleString()}</span>
                  <span className="font-badge-mono text-[8.5px] text-[#8E887E]">HOURS</span>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/[0.05]">
                  <span className="font-badge-header text-[8px] tracking-[0.14em] text-[#CBB079] block uppercase">PIC TURBINE</span>
                  <span className="font-badge-mono text-xl font-semibold text-[#EDE8DF] block mt-1">{data.hours.picTurbine.toLocaleString()}</span>
                  <span className="font-badge-mono text-[8.5px] text-[#8E887E]">HOURS</span>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/[0.05]">
                  <span className="font-badge-header text-[8px] tracking-[0.14em] text-[#CBB079] block uppercase">NIGHT FLIGHT</span>
                  <span className="font-badge-mono text-xl font-semibold text-[#EDE8DF] block mt-1">{data.hours.night.toLocaleString()}</span>
                  <span className="font-badge-mono text-[8.5px] text-[#8E887E]">HOURS</span>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/[0.05]">
                  <span className="font-badge-header text-[8px] tracking-[0.14em] text-[#CBB079] block uppercase">INSTRUMENT</span>
                  <span className="font-badge-mono text-xl font-semibold text-[#EDE8DF] block mt-1">{data.hours.instrument.toLocaleString()}</span>
                  <span className="font-badge-mono text-[8.5px] text-[#8E887E]">HOURS</span>
                </div>
              </div>
            </div>

            {/* 3. Type Ratings & Ramp Security Level */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <span className="font-badge-header text-[10px] text-[#CBB079] font-semibold tracking-[0.12em] block mb-2.5">
                  ● ENDORSED TYPE RATINGS
                </span>
                <div className="flex flex-wrap gap-1.5 font-avionics text-[10px]">
                  {data.typeRatings.map((rating, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md bg-[#CBB079]/10 border border-[#CBB079]/30 text-[#EDE8DF] font-badge-mono text-[10px] font-semibold"
                    >
                      {rating}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <span className="font-badge-header text-[10px] text-[#CBB079] font-semibold tracking-[0.12em] block mb-2.5">
                  ● FBO RAMP SECURITY STATUS
                </span>
                <div className="font-avionics text-xs">
                  <div className="font-badge-header text-[10px] tracking-[0.12em] text-[#6EE7B7] font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#4ADE80] animate-ping" />
                    LIVE // {data.clearanceLevel}
                  </div>
                  <div className="font-badge-header text-[8px] tracking-[0.14em] text-[#8E887E] mt-1">
                    Token cycle resets in <span className="text-[#CBB079] font-semibold">{tokenTimer}s</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Action Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => alert('NFC Credential Pass exported to Apple Wallet')}
                className="font-badge-header flex-1 py-3 px-4 rounded-xl bg-[#4ADE80]/15 hover:bg-[#4ADE80]/25 border border-[#4ADE80]/50 text-[10px] text-[#EDE8DF] uppercase tracking-[0.12em] font-semibold transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4 text-[#EDE8DF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Export to Apple Wallet
              </button>

              <a
                href="https://amsrvs.registry.faa.gov/airmeninquiry/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-badge-header flex-1 py-3 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-[#CBB079]/30 hover:border-[#CBB079]/50 text-[10px] text-[#EDE8DF] uppercase tracking-[0.12em] font-semibold transition-all flex items-center justify-center gap-1.5"
              >
                Inspect FAA Record
                <span className="text-xs">↗</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}