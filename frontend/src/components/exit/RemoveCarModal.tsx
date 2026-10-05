import React, { useState, useEffect } from 'react';
import { useParkingStore } from '../../store/parkingStore';
import {
  X,
  LogOut,
  ArrowRight,
} from 'lucide-react';

interface RemoveCarModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSlotId?: string | null;
  onConfirmExit: (slot: any) => void;
}

export const RemoveCarModal: React.FC<RemoveCarModalProps> = ({
  isOpen,
  onClose,
  defaultSlotId,
  onConfirmExit,
}) => {
  const { slots } = useParkingStore();

  const [selectedSlot, setSelectedSlot] = useState<string>('');

  // Filter occupied slots with parked vehicles
  const occupiedSlots = slots.filter((s) => s.status === 'OCCUPIED' && s.currentVehicle);

  // Update selected slot when modal opens or defaultSlotId changes
  useEffect(() => {
    if (!isOpen) return;

    if (defaultSlotId && slots.some((s) => s.id === defaultSlotId && s.status === 'OCCUPIED' && s.currentVehicle)) {
      setSelectedSlot(defaultSlotId);
    } else if (occupiedSlots.length > 0) {
      setSelectedSlot(occupiedSlots[0].id);
    } else {
      setSelectedSlot('');
    }
  }, [isOpen, defaultSlotId, slots]);

  if (!isOpen) return null;

  const selectedSlotObj = slots.find((s) => s.id === selectedSlot);

  const handleProceedExit = () => {
    if (!selectedSlotObj || !selectedSlotObj.currentVehicle) {
      alert('Please choose an occupied parking slot to release.');
      return;
    }

    onConfirmExit(selectedSlotObj);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in select-none">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-800 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-600">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Remove Vehicle from Slot
                {selectedSlot && (
                  <span className="text-xs bg-rose-50 text-rose-700 border border-rose-300 px-2 py-0.5 rounded-full font-mono font-bold">
                    Bay {selectedSlot}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500">
                Choose an occupied parking bay to release and exit the vehicle.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
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
                1. Select Occupied Slot ({occupiedSlots.length} parked)
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                {selectedSlot ? `Selected: Bay ${selectedSlot}` : 'No slot chosen'}
              </span>
            </div>

            {occupiedSlots.length === 0 ? (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                ⚠️ All 20 parking bays are vacant. There are no parked vehicles to remove.
              </div>
            ) : (
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl max-h-52 overflow-y-auto">
                {slots.map((slot) => {
                  const isOccupied = slot.status === 'OCCUPIED' && Boolean(slot.currentVehicle);
                  const isSelected = selectedSlot === slot.id;

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={!isOccupied}
                      onClick={() => setSelectedSlot(slot.id)}
                      className={`py-2 px-1 rounded-lg text-[11px] font-mono font-bold transition-all flex flex-col items-center justify-center border ${
                        isSelected
                          ? 'bg-rose-600 text-white border-rose-600 shadow-sm scale-105 ring-2 ring-rose-300'
                          : isOccupied
                          ? 'bg-white text-rose-700 border-rose-300 hover:bg-rose-50 hover:border-rose-500 cursor-pointer'
                          : 'bg-slate-200 text-slate-400 border-slate-200 cursor-not-allowed opacity-50'
                      }`}
                      title={
                        isOccupied
                          ? `Bay ${slot.id} (Occupied by ${slot.currentVehicle?.plateNumber || 'Car'})`
                          : `Bay ${slot.id} (Vacant)`
                      }
                    >
                      <span>{slot.id}</span>
                      <span className="text-[8px] font-sans font-normal opacity-80">
                        {isOccupied ? 'Full' : 'Vacant'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Vehicle Details Preview */}
          {selectedSlotObj?.currentVehicle && (
            <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
              <div className="space-y-0.5">
                <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider block">
                  Parked Vehicle in Bay {selectedSlot}
                </span>
                <span className="font-bold text-slate-900 font-mono">
                  {selectedSlotObj.currentVehicle.plateNumber} • {selectedSlotObj.currentVehicle.vehicleType || 'SEDAN'}
                </span>
                <span className="text-[10px] text-slate-500 block font-mono">
                  Entry: {selectedSlotObj.currentVehicle.entryTime || 'Today'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">Bay Status</span>
                <span className="font-mono font-extrabold text-xs text-rose-700 bg-white px-2 py-0.5 rounded border border-rose-200 shadow-xs inline-block">
                  OCCUPIED
                </span>
              </div>
            </div>
          )}

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
            disabled={!selectedSlot || occupiedSlots.length === 0}
            onClick={handleProceedExit}
            className="flex-[2] py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-rose-600/25 flex items-center justify-center space-x-2 transition-all cursor-pointer active:scale-98"
          >
            <LogOut className="w-4 h-4" />
            <span>Release Car from Bay {selectedSlot || ''}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
