import React from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Eye, RotateCcw, Sparkles } from 'lucide-react';
import { ParkingCanvas } from '../three/ParkingCanvas';
import type { CameraPreset } from '../three/CameraRig';
import type { EntryAnimationData } from '../three/EnteringVehicleAnimation';
import type { ExitAnimationData } from '../three/ExitingVehicleAnimation';
import type { ExitPaymentRequest } from '../three/ParkingCanvas';

interface Parking3DViewProps {
  isEntryGateOpen: boolean;
  isExitGateOpen: boolean;
  timeOfDay: 'DAY' | 'NIGHT';
  onToggleTimeOfDay: () => void;
  entryAnimationData: EntryAnimationData | null;
  exitingAnimationData: ExitAnimationData | null;
  activeCameraPreset: CameraPreset;
  onPresetChange: (preset: CameraPreset) => void;
  onSouthExitRequest: () => void;
  onAddCarRequest?: () => void;
  onSlotSelect: (slotId: string) => void;
  onRequestExitPayment?: (request: ExitPaymentRequest, approvePayment: () => void) => void;
}

export const Parking3DView: React.FC<Parking3DViewProps> = ({
  isEntryGateOpen,
  isExitGateOpen,
  timeOfDay: _timeOfDay,
  onToggleTimeOfDay,
  entryAnimationData,
  exitingAnimationData,
  activeCameraPreset,
  onPresetChange,
  onSouthExitRequest,
  onAddCarRequest,
  onSlotSelect,
  onRequestExitPayment,
}) => {
  const cameraOptions = [
    { preset: 'TOP' as const, label: 'Top', icon: Eye, active: 'bg-emerald-600' },
    { preset: 'NORTH' as const, label: 'North', icon: ArrowUp, active: 'bg-cyan-600' },
    { preset: 'EAST' as const, label: 'East', icon: ArrowRight, active: 'bg-rose-600' },
    { preset: 'WEST' as const, label: 'West', icon: ArrowLeft, active: 'bg-indigo-600' },
  ];

  return (
    <div className="w-full h-[calc(100vh-130px)] flex gap-3 rounded-2xl relative bg-white">
      <aside className="w-32 shrink-0 rounded-2xl border border-slate-200 bg-slate-950 p-2 shadow-sm flex flex-col gap-2">
        <div className="px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Camera view</div>
        {cameraOptions.map(({ preset, label, icon: Icon, active }) => (
          <button
            key={preset}
            onClick={() => onPresetChange(preset)}
            className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors ${
              activeCameraPreset === preset ? `${active} text-white` : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            title={`${label} view`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{label}</span>
          </button>
        ))}

        <div className="my-1 border-t border-slate-800" />
        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Actions</div>

        {onAddCarRequest && (
          <button
            onClick={onAddCarRequest}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-2.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 cursor-pointer"
            title="Add a custom vehicle to your chosen parking slot"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>Add Car</span>
          </button>
        )}

        <button
          onClick={onSouthExitRequest}
          className="flex items-center gap-2 rounded-lg bg-rose-600 px-2.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-rose-500 cursor-pointer"
          title="Start the payment-gated exit process for an occupied vehicle"
        >
          <ArrowDown className="h-3.5 w-3.5" />
          <span>Exit Car</span>
        </button>
        <button
          onClick={() => onPresetChange('DEFAULT')}
          className="mt-auto flex items-center gap-2 rounded-lg border-t border-slate-800 px-2.5 py-3 text-xs text-slate-400 transition-colors hover:text-white"
          title="Reset orbit and position"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset</span>
        </button>
      </aside>
      <ParkingCanvas
        isEntryGateOpen={isEntryGateOpen}
        isExitGateOpen={isExitGateOpen}
        timeOfDay="DAY"
        onToggleTimeOfDay={onToggleTimeOfDay}
        entryAnimationData={entryAnimationData}
        exitingAnimationData={exitingAnimationData}
        activeCameraPreset={activeCameraPreset}
        autoStartDemo={true}
        onPresetChange={onPresetChange}
        onSlotSelect={onSlotSelect}
        onRequestExitPayment={onRequestExitPayment}
      />
    </div>
  );
};
