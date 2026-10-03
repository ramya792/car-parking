import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { ParkingScene } from './ParkingScene';
import { CameraRig } from './CameraRig';
import type { CameraPreset } from './CameraRig';
import { RealisticParkingArea } from './RealisticParkingArea';
import type { PipelineState } from './ThreePipelineWorkflowHUD';
import { useParkingStore } from '../../store/parkingStore';
import { calculateDurationMinutes, calculateExitFee, formatDuration } from '../../utils/tariff';
import {
  RotateCcw,
  Compass,
  Sparkles,
  CreditCard,
  QrCode,
} from 'lucide-react';

import type { EntryAnimationData } from './EnteringVehicleAnimation';
import type { ExitAnimationData } from './ExitingVehicleAnimation';

interface ParkingCanvasProps {
  isEntryGateOpen?: boolean;
  isExitGateOpen?: boolean;
  timeOfDay?: 'DAY' | 'NIGHT';
  onToggleTimeOfDay?: () => void;
  onSelectCamera?: (cameraId: string, name?: string, direction?: string) => void;
  onSlotSelect?: (slotId: string) => void;
  entryAnimationData?: EntryAnimationData | null;
  exitingAnimationData?: ExitAnimationData | null;
  activeCameraPreset?: CameraPreset;
  autoStartDemo?: boolean;
  onPresetChange?: (preset: CameraPreset) => void;
  onRequestExitPayment?: (request: ExitPaymentRequest, approvePayment: () => void) => void;
  children?: React.ReactNode;
}

export interface ExitPaymentRequest {
  sessionId: string;
  plateNumber: string;
  slotId: string;
  entryTime: string;
  duration: string;
  fee: number;
}

export const ParkingCanvas: React.FC<ParkingCanvasProps> = ({
  isEntryGateOpen = false,
  isExitGateOpen = false,
  timeOfDay = 'DAY',
  onToggleTimeOfDay: _onToggleTimeOfDay,
  onSelectCamera,
  onSlotSelect,
  entryAnimationData = null,
  exitingAnimationData = null,
  activeCameraPreset,
  autoStartDemo = false,
  onPresetChange,
  onRequestExitPayment,
  children,
}) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const [internalPreset, setInternalPreset] = useState<CameraPreset>('DEFAULT');
  const [viewMode, setViewMode] = useState<'REALISTIC' | '3D'>('3D');

  const cameraPreset = activeCameraPreset !== undefined ? activeCameraPreset : internalPreset;

  const { selectedSlotId, selectSlot, slots, updateSlotStatus, setEntryGateOpen, setExitGateOpen } = useParkingStore();

  // Local 3D animation and barrier states for autonomous simulated flows
  const [localEntryAnimation, setLocalEntryAnimation] = useState<EntryAnimationData | null>(null);
  const [localExitAnimation, setLocalExitAnimation] = useState<ExitAnimationData | null>(null);
  const [localEntryGateOpen, setLocalEntryGateOpen] = useState(false);
  const [localExitGateOpen, setLocalExitGateOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const activeTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Live CCTV Surveillance Time & Recording Counter
  const [cctvTime, setCctvTime] = useState('');
  const [recElapsed, setRecElapsed] = useState(148);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const d = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      const t = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      setCctvTime(`${d} ${t} UTC`);
      setRecElapsed((prev) => prev + 1);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatRecTimer = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(s)}`;
  };

  // Real-Time 5-Stage AI Lifecycle Pipeline State
  const [pipelineState, setPipelineState] = useState<PipelineState>({
    stage: 'IDLE',
    plateNumber: 'KA05QR8765',
    slotId: 'P01',
    entryTime: '30-09-2026 15:00:00',
    duration: '0h 01m',
    fee: 50,
    paymentStatus: 'SUCCESS',
    isAutonomous: true,
  });

  const clearAllTimers = useCallback(() => {
    activeTimersRef.current.forEach(clearTimeout);
    activeTimersRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  const queueTimer = useCallback((fn: () => void, ms: number) => {
    const timer = setTimeout(fn, ms);
    activeTimersRef.current.push(timer);
    return timer;
  }, []);

  const handlePreset = useCallback((preset: CameraPreset) => {
    selectSlot(null);
    setInternalPreset(preset);
    onPresetChange?.(preset);
  }, [selectSlot, onPresetChange]);

  // Synchronize pipeline stages when external live entry animation triggers
  useEffect(() => {
    if (entryAnimationData) {
      setPipelineState((prev) => ({
        ...prev,
        stage: 'ENTRY_BARRIER_OPEN',
        plateNumber: entryAnimationData.plateNumber,
        slotId: entryAnimationData.targetSlotId,
        entryTime: new Date().toLocaleTimeString(),
        duration: '0h 01m',
        fee: 50,
        paymentStatus: 'PENDING',
      }));
    }
  }, [entryAnimationData]);

  const [pendingExitPayment, setPendingExitPayment] = useState<{
    sessionId: string;
    plateNumber: string;
    slotId: string;
    entryTime: string;
    fee: number;
    duration: string;
  } | null>(null);

  const handlePayAndOpenExitGate = useCallback(() => {
    if (!pendingExitPayment) return;
    if (!onRequestExitPayment) return;

    const approvePayment = () => {
      setPendingExitPayment(null);
      setPipelineState((prev) => ({
        ...prev,
        stage: 'EXIT_BARRIER_OPEN',
        paymentStatus: 'SUCCESS',
      }));
      setLocalExitGateOpen(true);
      setExitGateOpen(true);
      setLocalExitAnimation((prevExit) =>
        prevExit ? { ...prevExit, isPaid: true } : null
      );
    };

    onRequestExitPayment(pendingExitPayment, approvePayment);
  }, [onRequestExitPayment, pendingExitPayment, setExitGateOpen]);

  // Synchronize pipeline stages when external live exit animation triggers
  useEffect(() => {
    if (exitingAnimationData) {
      setPipelineState((prev) => ({
        ...prev,
        stage: isExitGateOpen ? 'EXIT_BARRIER_OPEN' : 'PAYMENT_CHECK',
        plateNumber: exitingAnimationData.plateNumber,
        slotId: exitingAnimationData.sourceSlotId,
        duration: '0h 03m',
        fee: 50,
        paymentStatus: isExitGateOpen ? 'SUCCESS' : 'VERIFYING',
      }));
    }
  }, [exitingAnimationData, isExitGateOpen]);

  // Combined effective states for rendering
  const effectiveEntryGateOpen = isEntryGateOpen || localEntryGateOpen;
  const effectiveExitGateOpen = isExitGateOpen || localExitGateOpen;
  const effectiveEntryAnimation = entryAnimationData || localEntryAnimation;
  const effectiveExitAnimation = exitingAnimationData || localExitAnimation;
  const effectiveIsExitPaid = pipelineState.paymentStatus === 'SUCCESS';

  /**
   * User Requested Automated 3D Parking Flow:
   * 1. Switch to 3D View automatically.
   * 2. West Entry Gate detects vehicle, opens barrier arm, and car drives into empty slot.
   * 3. Car stays parked in the slot for 4 seconds.
   * 4. Car exits the slot and drives towards East Exit Gate.
   * 5. Car STOPS in front of the closed exit barrier stop line.
   * 6. User MUST pay fee (interactive payment card appears) - car waits indefinitely!
   * 7. Only after payment is confirmed by user, the barrier arm opens and car leaves onto outside highway in full view!
   */
  const handleTriggerSimulatedCycle = useCallback(() => {
    clearAllTimers();
    setIsSimulating(true);
    setPendingExitPayment(null);

    // Switch view to 3D Digital Twin immediately so car is visible
    setViewMode('3D');

    // Allocate the next vacant bay in slot order so each 3D entry advances.
    let targetSlot = slots.find((s) => s.status === 'AVAILABLE');
    if (!targetSlot) {
      targetSlot = slots[0];
    }

    // Ensure target slot is clean and available before vehicle enters
    updateSlotStatus(targetSlot.id, 'AVAILABLE');

    const samplePlates = ['KA05QR8765', 'AP39AB1234', 'TS09CD5678', 'DL03GH9876', 'MH12IJ5432'];
    const plate = samplePlates[Math.floor(Math.random() * samplePlates.length)];
    const carColor = '#2563eb'; // Vibrant Royal Blue Sedan
    const carType = 'SEDAN' as const;
    const entryTime = new Date().toLocaleTimeString();
    const sessionId = `SES-${Date.now()}`;

    // STEP 1: Incoming vehicle appears on external approach road
    handlePreset('DEFAULT');
    setPipelineState({
      stage: 'ENTRY_CCTV',
      plateNumber: plate,
      slotId: targetSlot.id,
      entryTime,
      duration: '0h 01m',
      fee: 50,
      paymentStatus: 'PENDING',
      isAutonomous: true,
    });

    // Launch 3D Car Entry Animation immediately from the outside highway
    setLocalEntryAnimation({
      plateNumber: plate,
      vehicleType: carType,
      color: carColor,
      targetSlotId: targetSlot.id,
      targetPosition: targetSlot.position,
      targetRotation: targetSlot.rotation,
      onComplete: () => {
        // Car has reached and turned cleanly into the parking slot!
        setLocalEntryAnimation(null);
        setLocalEntryGateOpen(false);
        setEntryGateOpen(false);

        // Mark slot as OCCUPIED (turns slot border bright red)
        updateSlotStatus(targetSlot.id, 'OCCUPIED', {
          plateNumber: plate,
          vehicleType: carType,
          color: carColor,
          entryTime,
          duration: '0h 01m',
          sessionId,
          confidence: 0.99,
        });

        // Focus camera on Bay P07 to highlight the parked vehicle
        selectSlot(targetSlot.id);

        setPipelineState((prev) => ({
          ...prev,
          stage: 'PARKED_MONITORED',
        }));

        // STEP 4: Car remains parked in Bay P07 for 4 full seconds
        queueTimer(() => {
          // STEP 5: After 4 seconds, car departs bay toward East Exit Gate
          selectSlot(null);
          updateSlotStatus(targetSlot.id, 'AVAILABLE');
          setPipelineState((prev) => ({
            ...prev,
            stage: 'EXIT_APPROACH',
          }));

          // Keep wide overview camera so car exit and outside highway are 100% visible
          handlePreset('DEFAULT');

          // Launch 3D Car Exit Animation with stop-for-payment enabled
          setLocalExitAnimation({
            plateNumber: plate,
            vehicleType: carType,
            color: carColor,
            sourceSlotId: targetSlot.id,
            sourcePosition: targetSlot.position,
            sourceRotation: targetSlot.rotation,
            waitForPayment: true,
            isPaid: false,
            onArriveAtPayment: () => {
              // Car has arrived and stopped at x=16.5 stop line in front of closed barrier!
              setPipelineState((prev) => ({
                ...prev,
                stage: 'PAYMENT_CHECK',
                paymentStatus: 'VERIFYING',
              }));

              // Present interactive payment prompt: Car WAITS at barrier until user clicks Pay!
              setPendingExitPayment({
                sessionId,
                plateNumber: plate,
                slotId: targetSlot.id,
                entryTime,
                fee: calculateExitFee(entryTime),
                duration: formatDuration(calculateDurationMinutes(entryTime)),
              });
            },
            onBarrierOpen: () => {
              setLocalExitGateOpen(true);
              setExitGateOpen(true);
            },
            onBarrierClose: () => {
              setLocalExitGateOpen(false);
              setExitGateOpen(false);
            },
            onComplete: () => {
              // STEP 7: Car has cleared barrier, passed through perimeter gate onto outside highway!
              setLocalExitAnimation(null);
              setLocalExitGateOpen(false);
              setExitGateOpen(false);
              setPendingExitPayment(null);
              setPipelineState((prev) => ({ ...prev, stage: 'CAR_LEAVES' }));
              setIsSimulating(false);

              queueTimer(() => {
                setPipelineState((prev) => ({ ...prev, stage: 'IDLE' }));
                handlePreset('DEFAULT');
              }, 4000);
            },
          });
        }, 4000); // 4 full seconds parked stay
      },
    });

    // STEP 2: ANPR Reading as car passes perimeter gateway (T = 1.0s)
    queueTimer(() => {
      setPipelineState((prev) => ({ ...prev, stage: 'ENTRY_OCR' }));
    }, 1000);

    // STEP 2.5: Dijkstra Bay Allocation (T = 1.8s)
    queueTimer(() => {
      setPipelineState((prev) => ({ ...prev, stage: 'ASSIGN_SLOT' }));
    }, 1800);

    // STEP 3: Car arrives at Stop Line [-20.2]: Lift Entry Barrier Arm (T = 2.4s)
    queueTimer(() => {
      setLocalEntryGateOpen(true);
      setEntryGateOpen(true);
      setPipelineState((prev) => ({ ...prev, stage: 'ENTRY_BARRIER_OPEN' }));
    }, 2400);

    // Close entry barrier after car passes into the aisle (T = 4.2s)
    queueTimer(() => {
      setLocalEntryGateOpen(false);
      setEntryGateOpen(false);
      setPipelineState((prev) => ({ ...prev, stage: 'PARKING_DRIVE' }));
    }, 4200);
  }, [clearAllTimers, queueTimer, slots, updateSlotStatus, handlePreset, selectSlot, setEntryGateOpen, setExitGateOpen]);

  const autoDemoStartedRef = useRef(false);
  useEffect(() => {
    if (!autoStartDemo || autoDemoStartedRef.current) return;
    autoDemoStartedRef.current = true;
    handleTriggerSimulatedCycle();
  }, [autoStartDemo, handleTriggerSimulatedCycle]);

  void isSimulating;
  void handleTriggerSimulatedCycle;

  return (
    <div className="relative w-full h-full min-h-[500px] bg-[#0a0e17] rounded-xl overflow-hidden border border-slate-800 shadow-2xl select-none">
      {/* Top Left Header Badge */}
      <div className="absolute top-3 left-4 z-10 flex items-center space-x-2 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-slate-700/60 shadow-lg">
        <Compass className="w-4 h-4 text-blue-400" />
        <span className="text-xs font-semibold tracking-wide text-slate-200 uppercase">
          PARKING AREA — {viewMode === 'REALISTIC' ? 'REAL-TIME TWIN' : '3D DIGITAL TWIN'} (20 SLOTS)
        </span>
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-1" />
      </div>

      {/* Top Center Focus Indicator (when a slot is focused) */}
      {selectedSlotId && (() => {
        const focusedSlot = slots.find((s) => s.id === selectedSlotId);
        const isAvail = focusedSlot?.status === 'AVAILABLE';

        return (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center space-x-2 bg-slate-900/90 border border-slate-700/80 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs text-slate-200 shadow-xl">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>
              Slot <strong className="text-white font-mono font-bold">{selectedSlotId}</strong> (
              <span className={isAvail ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {isAvail ? 'Vacant' : 'Occupied'}
              </span>
              )
            </span>
            <button
              onClick={() => onSlotSelect?.(selectedSlotId)}
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold text-white shadow-xs transition-all cursor-pointer ${
                isAvail ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
              }`}
            >
              {isAvail ? '+ Add Car' : '🚪 Exit Car'}
            </button>
            <button
              onClick={() => handlePreset('DEFAULT')}
              className="text-[10px] bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded text-slate-300 transition-colors"
            >
              Reset (Esc)
            </button>
          </div>
        );
      })()}


      {/* Interactive Exit Payment Modal: Appears when vehicle reaches Exit Stop Line */}
      {pendingExitPayment && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 bg-slate-900/95 border-2 border-emerald-500/90 backdrop-blur-xl p-5 rounded-2xl text-white shadow-2xl animate-fade-in w-96 max-w-[90vw]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/80 mb-3.5">
            <div className="flex items-center space-x-2.5">
              <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Exit Gate — Payment Due
                </h4>
                <p className="text-[10px] text-slate-400">Barrier locked until payment received</p>
              </div>
            </div>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-mono font-bold">
              STOP LINE
            </span>
          </div>

          <div className="space-y-2 text-xs mb-4">
            <div className="flex justify-between items-center bg-slate-800/70 px-3 py-2 rounded-lg border border-slate-700/50">
              <span className="text-slate-400">Vehicle Number:</span>
              <span className="font-mono font-bold text-white bg-slate-950 px-2.5 py-0.5 rounded border border-slate-700 text-sm">
                {pendingExitPayment.plateNumber}
              </span>
            </div>
            <div className="flex justify-between items-center bg-slate-800/70 px-3 py-2 rounded-lg border border-slate-700/50">
              <span className="text-slate-400">Allocated Bay:</span>
              <span className="font-bold text-emerald-400 font-mono text-sm">{pendingExitPayment.slotId}</span>
            </div>
            <div className="flex justify-between items-center bg-emerald-950/40 px-3 py-2.5 rounded-lg border border-emerald-500/40">
              <span className="text-emerald-200 font-medium">Total Parking Fee:</span>
              <span className="text-xl font-extrabold text-emerald-400 font-mono">₹{pendingExitPayment.fee}.00</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-slate-400 mb-4 bg-slate-800/40 p-2 rounded-lg border border-slate-700/30">
            <QrCode className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Open the payment scanner to verify payment before exit</span>
          </div>

          <button
            onClick={handlePayAndOpenExitGate}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-sm shadow-xl shadow-emerald-900/60 transition-all cursor-pointer border border-emerald-400/50"
          >
            <CreditCard className="w-4 h-4" />
            <span>Open Payment Scanner & Verify</span>
          </button>
        </div>
      )}

      {/* Real-Time CCTV Surveillance & Recording HUD (Active when any camera preset is selected) */}
      {cameraPreset !== 'DEFAULT' && !selectedSlotId && (
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
          {/* Subtle surveillance scanlines */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.18)_50%)] bg-[length:100%_4px] opacity-35 pointer-events-none" />

          {/* Top Left: Red REC Blinking & Active Dedicated Camera Title */}
          <div className="absolute top-14 left-4 z-20 flex items-center space-x-2 select-none pointer-events-auto">
            <span className="bg-red-600 text-white font-mono font-bold text-[11px] px-2.5 py-1 rounded-md flex items-center space-x-1.5 shadow-lg border border-red-500 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-white" />
              <span>REC {formatRecTimer(recElapsed)}</span>
            </span>

            <div className="bg-slate-900/90 text-white border border-slate-700/80 px-3 py-1 rounded-md shadow-lg backdrop-blur-md font-mono text-xs flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-bold text-emerald-300">
                {cameraPreset === 'EAST' && 'CAM 03 • EAST EXIT GATE • CCTV FEED (EXCLUSIVE)'}
                {cameraPreset === 'WEST' && 'CAM 01 • WEST ENTRANCE GATE • CCTV FEED (EXCLUSIVE)'}
                {cameraPreset === 'TOP' && 'CAM 02 • OVERHEAD MASTER LOT (20 BAYS) • CCTV FEED'}
                {cameraPreset === 'NORTH' && 'CAM 04 • NORTH WING BAYS (P01–P10) • CCTV FEED'}
                {cameraPreset === 'SOUTH' && 'CAM 05 • SOUTH WING BAYS (P11–P20) • CCTV FEED'}
              </span>
            </div>
          </div>

          {/* Top Right: Real-time Live Clock & Stream Stats */}
          <div className="absolute top-14 right-4 z-20 select-none flex items-center space-x-2 font-mono text-[11px]">
            <div className="bg-slate-900/90 text-slate-200 border border-slate-700/80 px-2.5 py-1 rounded-md shadow-lg backdrop-blur-md">
              {cctvTime}
            </div>
            <div className="bg-slate-900/90 text-cyan-300 border border-slate-700/80 px-2.5 py-1 rounded-md shadow-lg backdrop-blur-md">
              1080P 60FPS • NVR REC
            </div>
          </div>

          {/* CCTV Viewfinder Corner Brackets */}
          <div className="absolute top-12 left-2 w-6 h-6 border-t-2 border-l-2 border-emerald-400/70" />
          <div className="absolute top-12 right-2 w-6 h-6 border-t-2 border-r-2 border-emerald-400/70" />
          <div className="absolute bottom-12 left-2 w-6 h-6 border-b-2 border-l-2 border-emerald-400/70" />
          <div className="absolute bottom-12 right-2 w-6 h-6 border-b-2 border-r-2 border-emerald-400/70" />

          {/* Center Target Crosshair */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-40">
            <div className="w-8 h-8 border border-white/60 rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
            </div>
          </div>

          {/* Bottom Live Camera Telemetry & Return Button */}
          <div className="absolute bottom-3 right-4 z-20 pointer-events-auto flex items-center space-x-3">
            <div className="bg-slate-900/90 border border-slate-700 text-xs font-mono px-3 py-1.5 rounded-lg shadow-lg text-slate-300 backdrop-blur-md hidden sm:flex items-center space-x-2">
              <span className="text-emerald-400 font-bold">● LIVE FEED</span>
              <span className="text-slate-500">•</span>
              <span>
                {cameraPreset === 'EAST' && (effectiveExitGateOpen ? 'EXIT BARRIER: OPEN 🟢' : 'EXIT BARRIER: LOCKED 🔴')}
                {cameraPreset === 'WEST' && (effectiveEntryGateOpen ? 'ENTRY BARRIER: OPEN 🟢' : 'ENTRY BARRIER: LOCKED 🔴')}
                {cameraPreset === 'TOP' && `${slots.filter(s => s.status === 'OCCUPIED').length}/20 BAYS OCCUPIED`}
                {cameraPreset === 'NORTH' && 'NORTH WING MONITORING (P01-P10)'}
                {cameraPreset === 'SOUTH' && 'SOUTH WING MONITORING (P11-P20)'}
              </span>
            </div>

            <button
              onClick={() => handlePreset('DEFAULT')}
              className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-mono text-xs px-3 py-1.5 rounded-lg shadow-lg flex items-center space-x-1.5 transition-all cursor-pointer font-bold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Full 3D Overview (Esc)</span>
            </button>
          </div>
        </div>
      )}




      {/* Bottom Hint / Keyboard Shortcuts */}
      <div className="absolute bottom-3 left-4 z-10 pointer-events-none flex items-center space-x-2 text-[11px] text-slate-600 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
        <span>🖱️ Orbit: Drag | Zoom: Scroll</span>
        <span className="text-slate-400">•</span>
        <span>
          Hotkeys: <kbd className="bg-slate-100 px-1 rounded text-[10px] text-slate-700 border border-slate-300">R</kbd> 3D | <kbd className="bg-slate-100 px-1 rounded text-[10px] text-slate-700 border border-slate-300">T</kbd> Top | <kbd className="bg-slate-100 px-1 rounded text-[10px] text-slate-700 border border-slate-300">N</kbd> North | <kbd className="bg-slate-100 px-1 rounded text-[10px] text-slate-700 border border-slate-300">S</kbd> South | <kbd className="bg-slate-100 px-1 rounded text-[10px] text-slate-700 border border-slate-300">E</kbd> East | <kbd className="bg-slate-100 px-1 rounded text-[10px] text-slate-700 border border-slate-300">W</kbd> West
        </span>
      </div>

      {/* Main Viewport: Either 3D WebGL Canvas or Realistic Surveillance Twin */}
      {viewMode === '3D' ? (
        <Canvas
          shadows
          camera={{ position: [0, 24, 26], fov: 42 }}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        >
          <color attach="background" args={['#e2e8f0']} />
          <fog attach="fog" args={['#e2e8f0', 55, 130]} />

          <OrbitControls
            ref={controlsRef}
            makeDefault
            enableDamping
            dampingFactor={0.06}
            minDistance={4}
            maxDistance={70}
            maxPolarAngle={Math.PI / 2.15}
            enableRotate={cameraPreset === 'DEFAULT' || Boolean(selectedSlotId)}
            target={[0, 0, 0]}
          />

          {/* Camera Rig providing smooth lerping and tween transitions */}
          <CameraRig
            controlsRef={controlsRef}
            cameraPreset={cameraPreset}
            onPresetChange={handlePreset}
          />

          <ParkingScene
            isEntryGateOpen={effectiveEntryGateOpen}
            isExitGateOpen={effectiveExitGateOpen}
            timeOfDay={timeOfDay}
            onSelectCamera={onSelectCamera}
            onSlotSelect={onSlotSelect}
            entryAnimationData={effectiveEntryAnimation}
            exitingAnimationData={effectiveExitAnimation}
            activeEntryPlate={pipelineState.plateNumber}
            activeEntrySlot={pipelineState.slotId}
            activeExitPlate={pipelineState.plateNumber}
            exitFee={pipelineState.fee}
            isExitPaid={effectiveIsExitPaid}
          >
            {children}
          </ParkingScene>
        </Canvas>
      ) : (
        <RealisticParkingArea
          slots={slots}
          selectedSlotId={selectedSlotId}
          onSelectSlot={(id) => {
            selectSlot(id);
            onSlotSelect?.(id);
          }}
          entryAnimationData={effectiveEntryAnimation}
          exitingAnimationData={effectiveExitAnimation}
          timeOfDay={timeOfDay}
          cameraPreset={cameraPreset}
          isEntryGateOpen={effectiveEntryGateOpen}
          isExitGateOpen={effectiveExitGateOpen}
        />
      )}
    </div>
  );
};
