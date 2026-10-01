import React from 'react';
import { Html } from '@react-three/drei';
import { useParkingStore } from '../../store/parkingStore';
import { Clock, ShieldCheck, Car, X } from 'lucide-react';

export const SlotFloatingBadge: React.FC = () => {
  const { slots, selectedSlotId, selectSlot } = useParkingStore();

  const selectedSlot = slots.find((s) => s.id === selectedSlotId);
  if (!selectedSlot) return null;

  const isOccupied = selectedSlot.status === 'OCCUPIED';
  const vehicle = selectedSlot.currentVehicle;

  // Floating position directly above the vehicle roof/slot center
  const badgeY = isOccupied ? 2.8 : 1.6;

  return (
    <group position={[selectedSlot.position[0], badgeY, selectedSlot.position[2]]}>
      {/* 3D Vertical Pointer Line */}
      <mesh position={[0, -0.6, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 1.2, 8]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>

      {/* Floating HTML Card */}
      <Html center distanceFactor={18} zIndexRange={[100, 0]}>
        <div className="bg-slate-950/95 border border-blue-500/60 shadow-2xl rounded-xl p-3 min-w-[200px] text-xs backdrop-blur-md select-none transform -translate-y-8 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
            <div className="flex items-center space-x-1.5">
              <span className="font-mono font-bold text-sm text-white px-1.5 py-0.5 rounded bg-blue-600/30 border border-blue-500/50">
                {selectedSlot.id}
              </span>
              <span
                className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                  isOccupied
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}
              >
                {selectedSlot.status}
              </span>
            </div>
            <button
              onClick={() => selectSlot(null)}
              className="text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Body */}
          {isOccupied && vehicle ? (
            <div className="pt-2 space-y-1.5">
              <div className="flex items-center justify-between font-mono font-bold text-white bg-slate-900 px-2 py-1 rounded border border-slate-800">
                <span className="flex items-center gap-1 text-[11px]">
                  <Car className="w-3 h-3 text-blue-400" />
                  {vehicle.plateNumber}
                </span>
                <span className="text-[10px] text-slate-400">{vehicle.vehicleType}</span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" /> Duration:
                </span>
                <span className="text-amber-400 font-mono font-semibold">
                  {vehicle.duration || '0h 45m'}
                </span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> ANPR:
                </span>
                <span className="text-emerald-400 font-mono">
                  {(vehicle.confidence * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          ) : (
            <div className="pt-2 text-[10px] text-emerald-400 flex items-center justify-center py-1 font-medium">
              ✓ Ready for vehicle allocation
            </div>
          )}
        </div>
      </Html>
    </group>
  );
};
