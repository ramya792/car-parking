import React, { useState, useEffect } from 'react';
import { useParkingStore } from '../../store/parkingStore';
import {
  X,
  CarFront,
  ArrowRight,
} from 'lucide-react';
import { apiService } from '../../services/api';

interface AddCarModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSlotId?: string | null;
  onAddCar: (assignedSlotId: string, vehicleData: any) => void;
}

const SAMPLE_PLATES = [
  'KA05QR8765',
  'AP39AB1234',
  'TS09CD5678',
  'MH12IJ5432',
  'DL03GH9876',
  'TN09OP4321',
  'HR26DK9012',
  'GJ01AB9988',
  'UP32CD1122',
  'WB02EF3344',
  'RJ14GH5566',
  'KL07MN8765',
];

const VEHICLE_TYPES: ('SEDAN' | 'SUV' | 'HATCHBACK')[] = ['SEDAN', 'SUV', 'HATCHBACK'];

const VEHICLE_COLORS = [
  '#2563eb',
  '#dc2626',
  '#10b981',
  '#f59e0b',
  '#7c3aed',
  '#0f172a',
  '#64748b',
  '#ea580c',
  '#06b6d4',
];

export const AddCarModal: React.FC<AddCarModalProps> = ({
  isOpen,
  onClose,
  defaultSlotId,
  onAddCar,
}) => {
  const { slots } = useParkingStore();

  const [plateNumber, setPlateNumber] = useState('KA05QR8765');
  const [vehicleType, setVehicleType] = useState<'SEDAN' | 'SUV' | 'HATCHBACK'>('SEDAN');
  const [color, setColor] = useState(() => VEHICLE_COLORS[Math.floor(Math.random() * VEHICLE_COLORS.length)]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Filter available slots
  const availableSlots = slots.filter((s) => s.status === 'AVAILABLE');

  // Update selected slot when modal opens or defaultSlotId changes
  useEffect(() => {
    if (!isOpen) return;

    if (defaultSlotId && slots.some((s) => s.id === defaultSlotId && s.status === 'AVAILABLE')) {
      setSelectedSlot(defaultSlotId);
    } else if (availableSlots.length > 0) {
      setSelectedSlot(availableSlots[0].id);
    } else {
      setSelectedSlot('');
    }

    // Pick an unused sample plate if available
    const occupiedPlates = slots
      .filter((s) => s.status === 'OCCUPIED' && s.currentVehicle)
      .map((s) => s.currentVehicle!.plateNumber.toUpperCase());
    const unusedSample = SAMPLE_PLATES.find((p) => !occupiedPlates.includes(p));
    if (unusedSample) {
      setPlateNumber(unusedSample);
    } else {
      setPlateNumber(`IND${Math.floor(1000 + Math.random() * 9000)}`);
    }
    setVehicleType(VEHICLE_TYPES[Math.floor(Math.random() * VEHICLE_TYPES.length)]);
    setColor(VEHICLE_COLORS[Math.floor(Math.random() * VEHICLE_COLORS.length)]);
  }, [isOpen, defaultSlotId, slots]);

  if (!isOpen) return null;

  const handleRegisterAndPark = async () => {
    if (!selectedSlot) {
      alert('Please choose an available parking slot.');
      return;
    }

    setLoading(true);
    const cleanPlate = plateNumber.trim().toUpperCase() || `IND${Math.floor(1000 + Math.random() * 9000)}`;

    const now = new Date();
    const entryTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const fullDateStr = now.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' });
    const entryTimestamp = `${fullDateStr} ${entryTimeStr}`;

    let sessionId = `SES-${Date.now()}`;
    try {
      const response = await apiService.registerEntry(cleanPlate, vehicleType, color, selectedSlot);
      sessionId = response?.session_id || response?.sessionId || sessionId;
    } catch (err) {
      console.warn('Backend sync note:', err);
    }

    // Trigger barrier arm lift and 3D car driving animation into assigned slot
    onAddCar(selectedSlot, {
      plateNumber: cleanPlate,
      vehicleType,
      color,
      entryTime: entryTimestamp,
      sessionId,
    });

    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in select-none">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-800 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-600">
              <CarFront className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Add Vehicle to Slot
                {selectedSlot && (
                  <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-300 px-2 py-0.5 rounded-full font-mono font-bold">
                    Bay {selectedSlot}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500">
                Choose an available parking bay to park a vehicle.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          
          {/* 1. Slot Selection Grid */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                1. Select Parking Slot ({availableSlots.length} vacant)
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                {selectedSlot ? `Selected: Bay ${selectedSlot}` : 'No slot chosen'}
              </span>
            </div>

            {availableSlots.length === 0 ? (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                ⚠️ All 20 parking bays are currently occupied. Please remove or exit a parked car first.
              </div>
            ) : (
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl max-h-52 overflow-y-auto">
                {slots.map((slot) => {
                  const isAvail = slot.status === 'AVAILABLE';
                  const isSelected = selectedSlot === slot.id;

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={!isAvail}
                      onClick={() => setSelectedSlot(slot.id)}
                      className={`py-2 px-1 rounded-lg text-[11px] font-mono font-bold transition-all flex flex-col items-center justify-center border ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm scale-105 ring-2 ring-blue-300'
                          : isAvail
                          ? 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50 hover:border-emerald-500 cursor-pointer'
                          : 'bg-slate-200 text-slate-400 border-slate-200 cursor-not-allowed opacity-50'
                      }`}
                      title={isAvail ? `Bay ${slot.id} (Vacant)` : `Bay ${slot.id} (Occupied by ${slot.currentVehicle?.plateNumber || 'Car'})`}
                    >
                      <span>{slot.id}</span>
                      <span className="text-[8px] font-sans font-normal opacity-80">
                        {isAvail ? 'Vacant' : 'Full'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Modal Actions */}
        <div className="flex items-center space-x-3 px-6 py-4 border-t border-slate-100 bg-slate-50/80">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading || !selectedSlot || availableSlots.length === 0}
            onClick={handleRegisterAndPark}
            className="flex-[2] py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-blue-600/25 flex items-center justify-center space-x-2 transition-all cursor-pointer active:scale-98"
          >
            {loading ? (
              <span>Registering Entry...</span>
            ) : (
              <>
                <CarFront className="w-4 h-4" />
                <span>Park Car in Bay {selectedSlot || ''}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
