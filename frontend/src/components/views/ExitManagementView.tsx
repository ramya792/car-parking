import React, { useState } from 'react';
import {
  DoorOpen,
  Camera,
  ShieldCheck,
  Receipt,
  IndianRupee,
} from 'lucide-react';
import { useParkingStore } from '../../store/parkingStore';
import { calculateExitFee } from '../../utils/tariff';
import { CCTV3DCanvas } from '../cameras/CCTV3DCanvas';
import type { ExitAnimationData } from '../three/ExitingVehicleAnimation';

interface ExitManagementViewProps {
  onProcessExit: (slotId: string, vehicleData: any) => void;
  onOpenPaymentModal?: (sessionData: any, onPaymentSuccess: () => void) => void;
  hourlyRate: number;
  exitingAnimationData?: ExitAnimationData | null;
}

export const ExitManagementView: React.FC<ExitManagementViewProps> = ({
  onProcessExit,
  onOpenPaymentModal,
  hourlyRate,
  exitingAnimationData = null,
}) => {
  const { slots } = useParkingStore();

  const occupiedSlots = slots.filter((s) => s.status === 'OCCUPIED' && s.currentVehicle);

  const [selectedSlotId, setSelectedSlotId] = useState(
    occupiedSlots.length > 0 ? occupiedSlots[0].id : ''
  );
  const [durationHours, setDurationHours] = useState(1.0);
  const [paymentStatus, setPaymentStatus] = useState<'UNPAID' | 'VERIFYING' | 'PAID'>('UNPAID');
  const [isExitComplete, setIsExitComplete] = useState(false);

  const currentSlot = slots.find((s) => s.id === (selectedSlotId || occupiedSlots[0]?.id));
  const vehicle = currentSlot?.currentVehicle || null;

  // Dynamic fee calculation: durationMinutes * (10 / 60)
  const durationMinutes = Math.round(durationHours * 60);
  const calculatedFee = calculateExitFee(durationMinutes, undefined, hourlyRate);

  const handleSimulatePayment = () => {
    if (!currentSlot || !vehicle || !onOpenPaymentModal) return;
    setPaymentStatus('VERIFYING');
    onOpenPaymentModal({
      sessionId: vehicle.sessionId || `SES-${currentSlot.id}`,
      vehicleNumber: vehicle.plateNumber,
      slotId: currentSlot.id,
      vehicleType: vehicle.vehicleType || 'SEDAN',
      entryTime: vehicle.entryTime,
      amount: calculatedFee,
      duration: vehicle.duration,
    }, () => {
      setPaymentStatus('PAID');
      handleAuthorizeExit();
    });
  };

  const handleAuthorizeExit = () => {
    if (!currentSlot || !vehicle) return;
    onProcessExit(currentSlot.id, {
      plateNumber: vehicle.plateNumber,
      vehicleType: vehicle.vehicleType || 'SEDAN',
      color: vehicle.color || '#3b82f6',
      fee: calculatedFee,
    });
    setIsExitComplete(true);
  };

  return (
    <div className="space-y-4 text-slate-800 select-none pb-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <DoorOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-slate-900 tracking-wide">
                Exit Gate, Dynamic Fee Calculation & QR Payment Station
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
                TARIFF: ₹10 / HOUR
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Admin console to test exit lifecycle: plate OCR, exact dwell duration, dynamic ₹10/hr calculation, QR payment, and barrier release.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600">
            OCCUPIED VEHICLES: <strong className="text-rose-600 font-bold">{occupiedSlots.length}</strong> BAYS
          </span>
        </div>
      </div>

      {/* Main 2-Column Exit Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Exit CCTV & Vehicle Selector */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Camera className="w-4 h-4 text-rose-600" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                3. Exit ANPR Plate Recognition & Session Lookup
              </h2>
            </div>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300 font-semibold">
                PHONEPE READY
            </span>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-700 mb-1 block">
              Select Vehicle Number:
            </label>
            <select
              value={selectedSlotId}
              onChange={(e) => {
                setSelectedSlotId(e.target.value);
                setPaymentStatus('UNPAID');
                setIsExitComplete(false);
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-blue-700 font-mono font-bold focus:outline-none focus:border-rose-500"
            >
              {occupiedSlots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.currentVehicle?.plateNumber || 'Unknown Vehicle'}
                </option>
              ))}
              {occupiedSlots.length === 0 && !exitingAnimationData && <option value="">No Vehicles Currently Parked</option>}
              {exitingAnimationData && (
                <option value={exitingAnimationData.sourceSlotId}>
                  {exitingAnimationData.plateNumber} (Departing)
                </option>
              )}
            </select>
          </div>

          <div className="relative aspect-[16/9] bg-slate-900 rounded-xl overflow-hidden border border-slate-300 flex items-center justify-center shadow-inner">
            <CCTV3DCanvas
              cameraId="CAM_03"
              showOverlay={true}
              exitingAnimationData={exitingAnimationData}
              className="w-full h-full"
            />
            <div className="absolute bottom-3 left-3 bg-slate-950/95 border border-slate-700 px-3 py-1 rounded text-yellow-300 font-mono text-xs font-bold shadow">
              {exitingAnimationData
                ? `EXIT OCR: ${exitingAnimationData.plateNumber} • DEPARTING`
                : vehicle
                ? `EXIT OCR: ${vehicle.plateNumber} • CONFIDENCE 99.1%`
                : 'EXIT CAMERA: WAITING FOR APPROACHING VEHICLE'}
            </div>
          </div>

          {vehicle && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <div><span className="text-slate-500">Vehicle Number</span><strong className="block font-mono text-slate-900">{vehicle.plateNumber}</strong></div>
              <div><span className="text-slate-500">Vehicle Type</span><strong className="block text-slate-900">{vehicle.vehicleType || 'SEDAN'}</strong></div>
              <div><span className="text-slate-500">Parking Slot</span><strong className="block text-blue-700">{selectedSlotId}</strong></div>
              <div><span className="text-slate-500">Session ID</span><strong className="block font-mono text-slate-900">{vehicle.sessionId || 'Unavailable'}</strong></div>
              <div><span className="text-slate-500">Entry Time</span><strong className="block text-slate-900">{vehicle.entryTime || 'Recent'}</strong></div>
              <div><span className="text-slate-500">ANPR Confidence</span><strong className="block text-emerald-700">{vehicle.confidence ? `${(vehicle.confidence * 100).toFixed(1)}%` : '99.1%'}</strong></div>
            </div>
          )}

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700">Simulate Parking Duration:</span>
              <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300 shadow-sm">
                {Math.floor(durationHours)}h {Math.round((durationHours % 1) * 60)}m ({durationMinutes} mins)
              </span>
            </div>
            <input
              type="range"
              min="0.25"
              max="72"
              step="0.25"
              value={durationHours}
              onChange={(e) => {
                setDurationHours(parseFloat(e.target.value));
                setPaymentStatus('UNPAID');
              }}
              className="w-full accent-rose-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0.5h (₹5.00)</span>
              <span>3h (₹30.00)</span>
              <span>4.5h (₹45.00)</span>
              <span>24h (₹240.00)</span>
            </div>
          </div>
        </div>

        {/* Right Column: Tariff Calculation & Dynamic UPI QR Payment */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              4 & 5. Dynamic Fee Calculation, UPI QR & Barrier Clearance
            </h2>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xs space-y-2.5">
            <div className="flex justify-between text-slate-600 text-[11px]">
              <span>Tariff Source:</span>
                <span className="text-emerald-700 font-bold">₹{hourlyRate.toFixed(2)} / Hour (₹{(hourlyRate / 60).toFixed(4)}/min)</span>
            </div>

            <div className="flex justify-between items-center pt-1 border-t border-slate-200">
              <span className="text-slate-600">Vehicle Number:</span>
              <span className="text-blue-700 font-bold">{vehicle ? vehicle.plateNumber : 'None'}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-600">Parking Slot:</span>
              <span className="text-slate-900 font-bold">{selectedSlotId || 'None'}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-600">Actual Duration:</span>
              <span className="text-slate-900 font-bold">
                {Math.floor(durationHours)}h {Math.round((durationHours % 1) * 60)}m ({durationMinutes} mins)
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-600">Rate Application:</span>
              <span className="text-slate-700 font-semibold">
                {durationMinutes} mins × (₹{hourlyRate.toFixed(2)} / 60)
              </span>
            </div>

            <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-200">
              <span className="font-bold text-slate-900 uppercase">Total Parking Fee:</span>
              <span className="font-bold text-emerald-700 text-lg flex items-center">
                <IndianRupee className="w-4 h-4 mr-0.5" />
                {calculatedFee.toFixed(2)}
              </span>
            </div>
          </div>

          <div>
            <button
              onClick={paymentStatus === 'PAID' ? handleAuthorizeExit : handleSimulatePayment}
              disabled={paymentStatus === 'VERIFYING' || isExitComplete}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {isExitComplete
                  ? 'VEHICLE DEPARTED & BAY CLEARED ✅'
                  : paymentStatus === 'PAID'
                  ? 'PAYMENT CONFIRMED ➔ LIFT EXIT BARRIER & RELEASE CAR'
                  : `OPEN PAYMENT SCANNER (₹${calculatedFee.toFixed(2)})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
