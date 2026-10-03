import React, { useState, useEffect } from 'react';
import { useParkingStore } from '../../store/parkingStore';
import {
  X,
  CarFront,
  ArrowRight,
  ShieldCheck,
  Palette,
  Shuffle,
  Check,
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

const COLOR_PRESETS = [
  { name: 'Royal Blue', hex: '#2563eb' },
  { name: 'Crimson Red', hex: '#dc2626' },
  { name: 'Emerald Green', hex: '#10b981' },
  { name: 'Amber Gold', hex: '#f59e0b' },
  { name: 'Violet Purple', hex: '#7c3aed' },
  { name: 'Midnight Black', hex: '#0f172a' },
  { name: 'Pearl White', hex: '#f8fafc' },
  { name: 'Slate Silver', hex: '#64748b' },
  { name: 'Sunset Orange', hex: '#ea580c' },
  { name: 'Cyan Blue', hex: '#06b6d4' },
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
  const [color, setColor] = useState('#2563eb');
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
  }, [isOpen, defaultSlotId, slots]);

  if (!isOpen) return null;

  const handleRandomizePlate = () => {
    const random = SAMPLE_PLATES[Math.floor(Math.random() * SAMPLE_PLATES.length)];
    setPlateNumber(random);
  };

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
                Customize vehicle plate, model, color, and assign to your chosen parking bay.
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
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl max-h-36 overflow-y-auto">
                {slots.map((slot) => {
                  const isAvail = slot.status === 'AVAILABLE';
                  const isSelected = selectedSlot === slot.id;

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={!isAvail}
                      onClick={() => setSelectedSlot(slot.id)}
                      className={`py-1.5 px-1 rounded-lg text-[11px] font-mono font-bold transition-all flex flex-col items-center justify-center border ${
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

          {/* 2. License Plate Input */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700">
                2. License Plate Number (HSRP)
              </label>
              <button
                type="button"
                onClick={handleRandomizePlate}
                className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Shuffle className="w-3 h-3" />
                <span>Random Sample</span>
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                placeholder="e.g. KA05QR8765"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 font-mono font-bold text-sm tracking-wider focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <div className="absolute right-3 top-2.5 text-xs text-emerald-700 flex items-center gap-1 font-mono font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>ANPR Ready</span>
              </div>
            </div>

            {/* Quick Sample Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {SAMPLE_PLATES.slice(0, 6).map((plate) => (
                <button
                  key={plate}
                  type="button"
                  onClick={() => setPlateNumber(plate)}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-md border transition-all ${
                    plateNumber === plate
                      ? 'bg-blue-600 text-white border-blue-600 font-bold'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {plate}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Vehicle Type Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              3. Vehicle Model / Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['SEDAN', 'SUV', 'HATCHBACK'] as const).map((type) => {
                const isSelected = vehicleType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setVehicleType(type)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                      isSelected
                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <CarFront className="w-3.5 h-3.5" />
                    <span>{type}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Vehicle Paint Color */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-blue-600" />
                <span>4. Vehicle Color to Your Wish</span>
              </label>
              <div className="flex items-center space-x-1.5">
                <span
                  className="w-4 h-4 rounded-full border border-slate-300 shadow-xs inline-block"
                  style={{ backgroundColor: color }}
                />
                <span className="text-[11px] font-mono font-bold text-slate-600 uppercase">{color}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {COLOR_PRESETS.map((preset) => {
                const isSelected = color.toLowerCase() === preset.hex.toLowerCase();
                return (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => setColor(preset.hex)}
                    style={{ backgroundColor: preset.hex }}
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all ${
                      isSelected ? 'ring-2 ring-offset-2 ring-blue-600 scale-110 shadow-md' : 'border-slate-300 hover:scale-105'
                    }`}
                    title={preset.name}
                  >
                    {isSelected && (
                      <Check
                        className={`w-4 h-4 ${
                          preset.hex === '#f8fafc' || preset.hex === '#f59e0b' ? 'text-slate-900' : 'text-white'
                        }`}
                      />
                    )}
                  </button>
                );
              })}

              {/* Native color picker */}
              <div className="flex items-center space-x-1.5 ml-auto border border-slate-200 rounded-lg px-2 py-1 bg-slate-50">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                  title="Pick Custom Color"
                />
                <span className="text-[10px] text-slate-500 font-semibold">Custom</span>
              </div>
            </div>
          </div>

          {/* Summary Preview Box */}
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider block">
                Ready to Enter & Park
              </span>
              <span className="font-bold text-slate-900 font-mono">
                {plateNumber || 'VEHICLE'} • {vehicleType}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 block">Assigned Bay</span>
              <span className="font-mono font-extrabold text-sm text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200 shadow-xs">
                {selectedSlot || 'None'}
              </span>
            </div>
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
