'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAvionicsAudio } from '../hooks/useAvionicsAudio';
import { useFboStation } from '../hooks/useFboStation';

interface PilotData {
  name: string;
  role: string;
  faaCert: string;
  medicalClass: string;
  passId: string;
  typeRatings: string[];
  clearanceLevel: string;
}

interface ScanPayload {
  pilot?: PilotData;
  tokenHash?: string;
  cycle?: number;
  icao?: string;
  tailNumber?: string;
}

export const FboScanModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'verified'>('idle');
  const [payload, setPayload] = useState<ScanPayload | null>(null);
  const [loggedArrival, setLoggedArrival] = useState(false);

  const audio = useAvionicsAudio(false);

  const targetIcao = payload?.icao || 'KTEB';
  const targetTail = payload?.tailNumber;
  const { station, loading: stationLoading } = useFboStation(targetIcao, targetTail);

  const handleOpen = useCallback((e: Event) => {
    const customEvent = e as CustomEvent<ScanPayload>;
    if (customEvent.detail) {
      setPayload(customEvent.detail);
    }
    setScanState('idle');
    setLoggedArrival(false);
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setScanState('idle');
  }, []);

  useEffect(() => {
    window.addEventListener('pjp:open-fbo-scanner', handleOpen);
    return () => window.removeEventListener('pjp:open-fbo-scanner', handleOpen);
  }, [handleOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  const triggerScan = () => {
    if (scanState === 'scanning') return;
    setScanState('scanning');
    if (audio && typeof audio.datalink === 'function') {
      audio.datalink();
    }
    setTimeout(() => {
      setScanState('verified');
      if (audio && typeof audio.chirp === 'function') {
        audio.chirp();
      }
    }, 1400);
  };

  if (!isOpen) return null;

  const pilot: PilotData = payload?.pilot ?? {
    name: 'JEFF COURSEY',
    role: 'ATP CAPTAIN // G650ER • GLOBAL 7500',
    faaCert: '2822744',
    medicalClass: 'CLASS 1',
    passId: 'B-90081',
    typeRatings: ['G650ER', 'GLOBAL 7500'],
    clearanceLevel: 'LEVEL 4 RAMP ACCESS',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-xl p-6 sm:p-8 rounded-2xl bg-[#07090D] border border-[#CBB079]/40 shadow-[0_24px_80px_rgba(0,0,0,0.9)] text-[#EDE8DF] select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFD700] animate-pulse" />
            <span className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.22em] text-[#FFD700] font-bold">
              FBO TERMINAL // {station.icao} RAMP VERIFICATION
            </span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="font-mono text-xs text-white/50 hover:text-white uppercase tracking-wider px-2 py-1 rounded hover:bg-white/5 transition-colors cursor-pointer select-none"
          >
            [ ESC ✕ ]
          </button>
        </div>

        {/* Optical Scanning Window */}
        <div className="relative w-full h-44 rounded-xl bg-black/60 border border-white/10 flex flex-col items-center justify-center overflow-hidden mb-6">
          {/* Laser Sweep Animation */}
          {scanState === 'scanning' && (
            <div
              className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#FFD700] to-transparent shadow-[0_0_15px_#FFD700] animate-bounce"
              style={{ animationDuration: '0.7s' }}
            />
          )}

          {scanState === 'idle' && (
            <div className="flex flex-col items-center gap-2 text-center">
              <span className="w-8 h-8 rounded-full border border-dashed border-[#CBB079]/60 flex items-center justify-center animate-spin">
                <span className="w-2 h-2 rounded-full bg-[#FFD700]" />
              </span>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8E887E]">
                OPTICAL RETICLE READY // TAP OR SCAN QR
              </p>
            </div>
          )}

          {scanState === 'scanning' && (
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#FFD700] font-bold animate-pulse">
              DECODING SHA-256 SIGNATURE...
            </p>
          )}

          {scanState === 'verified' && (
            <div className="flex flex-col items-center gap-1.5 text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0D2218] border border-[#6EE7B7]/40 text-[#6EE7B7] font-mono text-xs uppercase tracking-wider font-bold">
                <span className="w-2 h-2 rounded-full bg-[#4ADE80] animate-ping" />
                SIGNATURE VERIFIED // {station.tier}
              </span>
              <p className="font-mono text-[9px] uppercase tracking-wider text-white/40 mt-1">
                {station.name} // SPOT: {station.assignedSpot}
              </p>
            </div>
          )}
        </div>

        {/* Telemetry Dossier */}
        <div className="space-y-3 font-mono text-xs mb-6">
          <div className="flex items-center justify-between py-2 border-b border-white/[0.08]">
            <span className="text-[#8E887E] text-[10px] uppercase tracking-wider">CREW MEMBER</span>
            <span className="text-[#EDE8DF] font-bold">{pilot.name}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-white/[0.08]">
            <span className="text-[#8E887E] text-[10px] uppercase tracking-wider">FAA CERTIFICATE</span>
            <span className="text-[#E0CCA0] font-bold">ATP #{pilot.faaCert}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-white/[0.08]">
            <span className="text-[#8E887E] text-[10px] uppercase tracking-wider">ASSIGNED RAMP</span>
            <span className="text-[#FFE27D] font-bold">{stationLoading ? 'QUERYING...' : station.assignedSpot}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-white/[0.08]">
            <span className="text-[#8E887E] text-[10px] uppercase tracking-wider">RAMP CLEARANCE</span>
            <span className="text-[#6EE7B7] font-bold">{pilot.clearanceLevel}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-white/[0.08]">
            <span className="text-[#8E887E] text-[10px] uppercase tracking-wider">SERVICES STATUS</span>
            <span className="text-white/80">
              JET-A: {station.jetAAvailable ? 'READY' : 'OFFLINE'} • GPU: {station.gpuRequested ? 'STAGED' : 'STANDBY'}
            </span>
          </div>
          {payload?.tokenHash && (
            <div className="flex items-center justify-between py-2">
              <span className="text-[#8E887E] text-[10px] uppercase tracking-wider">CHECKSUM DOCK</span>
              <span className="text-white/50 text-[10px]">{payload.tokenHash}</span>
            </div>
          )}
        </div>

        {/* Action Tray */}
        <div className="flex items-center gap-3">
          {scanState !== 'verified' ? (
            <button
              type="button"
              onClick={triggerScan}
              disabled={scanState === 'scanning'}
              className="flex-1 py-3 rounded bg-gradient-to-r from-[#FFE27D] via-[#FFD700] to-[#F59E0B] text-black font-mono text-xs uppercase tracking-[0.2em] font-bold shadow-[0_4px_20px_rgba(255,215,0,0.3)] hover:scale-[1.01] active:scale-95 transition-all cursor-pointer disabled:opacity-50 select-none"
            >
              {scanState === 'scanning' ? 'SCANNING...' : 'SIMULATE RAMP SCAN'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setLoggedArrival(true)}
              disabled={loggedArrival}
              className={`flex-1 py-3 rounded font-mono text-xs uppercase tracking-[0.2em] font-bold transition-all select-none ${
                loggedArrival
                  ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_4px_20px_rgba(16,185,129,0.3)] cursor-pointer'
              }`}
            >
              {loggedArrival ? '✓ ARRIVAL RECORDED IN FBO LOG' : 'LOG RAMP ARRIVAL'}
            </button>
          )}

          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-3 rounded border border-white/10 text-white/60 hover:text-white font-mono text-xs uppercase tracking-wider hover:bg-white/5 transition-colors cursor-pointer select-none"
          >
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
};

export default FboScanModal;