import React, { useState } from 'react';
import {
  Camera,
  CheckCircle2,
  QrCode,
  Car,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  CreditCard,
  Cpu,
  Layers,
  Zap,
} from 'lucide-react';

export type PipelineStage =
  | 'IDLE'
  | 'ENTRY_CCTV'
  | 'ENTRY_OCR'
  | 'ENTRY_RECORD'
  | 'DETECT_VACANCY'
  | 'ASSIGN_SLOT'
  | 'ENTRY_BARRIER_OPEN'
  | 'PARKING_DRIVE'
  | 'PARKED_MONITORED'
  | 'EXIT_APPROACH'
  | 'EXIT_OCR'
  | 'FIND_DETAILS'
  | 'CALC_FEE'
  | 'GENERATE_QR'
  | 'PAYMENT_CHECK'
  | 'EXIT_BARRIER_OPEN'
  | 'CAR_LEAVES';

export interface PipelineState {
  stage: PipelineStage;
  plateNumber: string;
  slotId: string;
  entryTime: string;
  duration: string;
  fee: number;
  paymentStatus: 'PENDING' | 'VERIFYING' | 'SUCCESS';
  isAutonomous: boolean;
}

interface ThreePipelineWorkflowHUDProps {
  pipelineState: PipelineState;
  onFocusGate?: (type: 'WEST' | 'EAST' | 'TOP' | 'DEFAULT') => void;
  onClose?: () => void;
}

export const ThreePipelineWorkflowHUD: React.FC<ThreePipelineWorkflowHUDProps> = ({
  pipelineState,
  onFocusGate,
  onClose,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const {
    stage,
    plateNumber,
    slotId,
    entryTime,
    duration,
    fee,
    paymentStatus,
  } = pipelineState;

  // Determine current active numerical step (1 to 8)
  const getActiveStepNumber = (): number => {
    switch (stage) {
      case 'ENTRY_CCTV':
        return 1;
      case 'ENTRY_OCR':
      case 'ENTRY_RECORD':
        return 2;
      case 'DETECT_VACANCY':
      case 'ASSIGN_SLOT':
        return 3;
      case 'ENTRY_BARRIER_OPEN':
        return 4;
      case 'PARKING_DRIVE':
      case 'PARKED_MONITORED':
        return 5;
      case 'EXIT_APPROACH':
      case 'EXIT_OCR':
        return 6;
      case 'FIND_DETAILS':
      case 'CALC_FEE':
      case 'GENERATE_QR':
      case 'PAYMENT_CHECK':
        return 7;
      case 'EXIT_BARRIER_OPEN':
      case 'CAR_LEAVES':
        return 8;
      default:
        return 0;
    }
  };

  const activeStep = getActiveStepNumber();

  const STEPS = [
    {
      num: 1,
      title: '1. Optical Ingestion',
      subtitle: 'Sony Starvis 60 FPS • Dual Ground Loops',
      phase: 'ENTRY',
      icon: Camera,
      focus: 'WEST' as const,
    },
    {
      num: 2,
      title: '2. Neural ANPR & OCR',
      subtitle: 'YOLOv8 Localizer • 99.52% Confidence',
      phase: 'ENTRY',
      icon: Cpu,
      focus: 'WEST' as const,
    },
    {
      num: 3,
      title: '3. Dijkstra Bay Allocation',
      subtitle: '20-Bay Matrix • Shortest Path Trajectory',
      phase: 'ENTRY',
      icon: Layers,
      focus: 'TOP' as const,
    },
    {
      num: 4,
      title: '4. Industrial PLC Gate Lift',
      subtitle: 'Modbus 0x01 Command • Boom Barrier 90°',
      phase: 'ENTRY',
      icon: Zap,
      focus: 'WEST' as const,
    },
    {
      num: 5,
      title: '5. Aisle Navigation & Bay Park',
      subtitle: 'Vehicle Ingestion • Bay Status OCCUPIED',
      phase: 'PARK',
      icon: Car,
      focus: 'TOP' as const,
    },
    {
      num: 6,
      title: '6. Departure & Exit Stop Line',
      subtitle: 'Optical Stop Line Sensor • Session Match',
      phase: 'EXIT',
      icon: ShieldCheck,
      focus: 'EAST' as const,
    },
    {
      num: 7,
      title: '7. Tariff Billing & UPI / FASTag',
      subtitle: 'Dynamic Pricing • UPI QR Code Generated',
      phase: 'EXIT',
      icon: CreditCard,
      focus: 'EAST' as const,
    },
    {
      num: 8,
      title: '8. Clearance & Highway Departure',
      subtitle: 'Exit Barrier Lift • Bay Freed to AVAILABLE',
      phase: 'EXIT',
      icon: CheckCircle2,
      focus: 'EAST' as const,
    },
  ];

  return (
    <div className="absolute top-16 left-4 z-20 w-88 max-w-[calc(100vw-32px)] bg-slate-950/95 backdrop-blur-xl border border-blue-500/40 rounded-2xl shadow-[0_0_35px_rgba(15,23,42,0.9)] overflow-hidden select-none transition-all font-mono text-white">
      {/* Header Bar */}
      <div className="px-3.5 py-2.5 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <div className="flex flex-col">
            <span className="text-[11px] font-bold tracking-wider text-cyan-300">
              3D AI PROCESS PIPELINE
            </span>
            <span className="text-[9px] text-slate-400 font-sans">
              Autonomous Vehicle Lifecycle Ingestion
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
            title={isExpanded ? 'Minimize' : 'Expand'}
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors text-xs"
              title="Close Process HUD"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Process Workflow Body */}
      {isExpanded && (
        <div className="p-3 space-y-2.5 text-xs max-h-[72vh] overflow-y-auto">
          {/* Active Status Ribbon */}
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-[11px]">
            <div className="flex items-center space-x-2">
              <span className="text-slate-400 text-[10px]">PLATE:</span>
              <span className="font-bold text-yellow-300 bg-black/80 px-2 py-0.5 rounded border border-yellow-400/40">
                {plateNumber || 'KA05QR8765'}
              </span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400 text-[10px]">BAY:</span>
              <span className="font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                {slotId || 'P07'}
              </span>
            </div>
            <div className="text-[10px] text-cyan-300 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-500/40">
              {activeStep > 0 ? `STEP ${activeStep}/8` : 'STANDBY'}
            </div>
          </div>

          {/* 8-Stage Interactive Process Pipeline */}
          <div className="space-y-1.5">
            {STEPS.map((s) => {
              const isActive = activeStep === s.num;
              const isPast = activeStep > s.num;
              const Icon = s.icon;

              return (
                <div
                  key={s.num}
                  onClick={() => onFocusGate?.(s.focus)}
                  className={`p-2 rounded-xl border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600/25 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.35)] translate-x-1'
                      : isPast
                      ? 'bg-emerald-950/20 border-emerald-800/40 opacity-80'
                      : 'bg-slate-900/40 border-slate-800/60 opacity-50 hover:opacity-80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                          isActive
                            ? 'bg-cyan-500 text-slate-950 animate-bounce'
                            : isPast
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isPast ? '✓' : <Icon className="w-3 h-3" />}
                      </div>
                      <div>
                        <div
                          className={`text-[11px] font-bold leading-tight ${
                            isActive ? 'text-cyan-200' : isPast ? 'text-emerald-300' : 'text-slate-300'
                          }`}
                        >
                          {s.title}
                        </div>
                        <div className="text-[9px] text-slate-400 font-sans">{s.subtitle}</div>
                      </div>
                    </div>

                    {isActive && (
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-cyan-400 text-slate-950 animate-pulse">
                        LIVE
                      </span>
                    )}
                  </div>

                  {/* Active Context Details */}
                  {isActive && (
                    <div className="mt-2 pt-2 border-t border-slate-700/60 space-y-1 text-[10px] text-slate-300">
                      {s.num === 1 && (
                        <div className="flex justify-between">
                          <span>Ground Induction Loop:</span>
                          <span className="text-emerald-400 font-bold">VEHICLE DETECTED (2.1ms)</span>
                        </div>
                      )}

                      {s.num === 2 && (
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Optical OCR Confidence:</span>
                            <span className="text-yellow-400 font-bold">99.52% (Clean Extraction)</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Vehicle Silhouette:</span>
                            <span className="text-blue-300">Sedan • Blue Pearl</span>
                          </div>
                        </div>
                      )}

                      {s.num === 3 && (
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Dijkstra Shortest Path:</span>
                            <span className="text-emerald-400 font-bold">Bay {slotId} (12ms Latency)</span>
                          </div>
                          <div className="text-[9px] text-cyan-300">
                            3D navigation trajectory illuminated on roadway
                          </div>
                        </div>
                      )}

                      {s.num === 4 && (
                        <div className="flex justify-between">
                          <span>Modbus PLC Actuation:</span>
                          <span className="text-emerald-400 font-bold">0x01 BOOM ARM RAISED 90°</span>
                        </div>
                      )}

                      {s.num === 5 && (
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Bay Ultrasonic Sensor:</span>
                            <span className="text-red-400 font-bold">BAY {slotId} OCCUPIED</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Entry Time & Duration:</span>
                            <span className="text-slate-300">{entryTime} ({duration})</span>
                          </div>
                        </div>
                      )}

                      {s.num === 6 && (
                        <div className="flex justify-between">
                          <span>Exit Stop Line:</span>
                          <span className="text-amber-400 font-bold">STOP THRESHOLD TRIGGERED</span>
                        </div>
                      )}

                      {s.num === 7 && (
                        <div className="space-y-1.5 bg-slate-950 p-2 rounded-lg border border-slate-800">
                          <div className="flex justify-between items-center">
                            <span>Calculated Tariff (≤24h):</span>
                            <span className="text-sm font-bold text-emerald-400">₹{fee}.00</span>
                          </div>
                          <div className="flex items-center space-x-2 text-[9px] text-slate-300">
                            <QrCode className="w-5 h-5 text-amber-400 flex-shrink-0" />
                            <span>Scan UPI QR Code at Exit Kiosk or wait for FASTag auto-debit</span>
                          </div>
                          <div className="text-[9px] text-center font-bold text-amber-300 animate-pulse">
                            {paymentStatus === 'SUCCESS' ? '✅ PAYMENT VERIFIED' : 'WAITING FOR PAYMENT...'}
                          </div>
                        </div>
                      )}

                      {s.num === 8 && (
                        <div className="flex justify-between">
                          <span>Exit Clearance:</span>
                          <span className="text-emerald-400 font-bold">BARRIER OPEN • HIGHWAY FREE</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
