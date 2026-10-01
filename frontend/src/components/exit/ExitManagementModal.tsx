import React, { useState, useEffect } from 'react';
import {
  X,
  DoorOpen,
  Car,
  Search,
  CheckCircle2,
  Clock,
  IndianRupee,
  ArrowRight,
  CreditCard,
} from 'lucide-react';
import { useParkingStore } from '../../store/parkingStore';
import { apiService } from '../../services/api';
import type { ParkingSlot } from '../../types/parking';
import { calculateExitFee, calculateDurationMinutes, formatDuration, PARKING_HOURLY_RATE } from '../../utils/tariff';

interface ExitManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExitApproved: (slotId: string, vehicleData: any) => void;
  onOpenPayment?: (sessionData: any, onPaymentSuccess: () => void) => void;
}

export const ExitManagementModal: React.FC<ExitManagementModalProps> = ({
  isOpen,
  onClose,
  onExitApproved,
  onOpenPayment,
}) => {
  const { slots } = useParkingStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrData, setOcrData] = useState<any>(null);
  const [feeBreakdown, setFeeBreakdown] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [exitResult, setExitResult] = useState<any>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  // Filter occupied slots with parked vehicles
  const occupiedSlots = slots.filter(
    (s) => s.status === 'OCCUPIED' && s.currentVehicle
  );

  const filteredSlots = occupiedSlots.filter((s) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const plate = s.currentVehicle?.plateNumber?.toLowerCase() || '';
    const id = s.id.toLowerCase();
    return plate.includes(term) || id.includes(term);
  });

  // Auto-select first occupied slot if none selected
  useEffect(() => {
    if (isOpen && occupiedSlots.length > 0 && !selectedSlot) {
      handleSelectVehicle(occupiedSlots[0]);
    }
  }, [isOpen, occupiedSlots]);

  const handleSelectVehicle = async (slot: ParkingSlot) => {
    setSelectedSlot(slot);
    setExitResult(null);
    setPaymentConfirmed(false);
    if (!slot.currentVehicle) return;

    // Run ANPR scan simulation on CAM 03 for this vehicle plate
    setIsScanning(true);
    try {
      const [anpr, feeRes] = await Promise.all([
        apiService.recognizePlate(slot.currentVehicle.plateNumber, 'CAM_03'),
        apiService.calculateFee({
          entry_time: slot.currentVehicle.entryTime,
          vehicle_type: slot.currentVehicle.vehicleType,
        }),
      ]);
      setOcrData(anpr);
      setFeeBreakdown(feeRes);
    } catch (e) {
      console.error('ANPR recognition / Fee calculation error:', e);
      // Local dynamic fallback
      const durMins = calculateDurationMinutes(slot.currentVehicle.entryTime);
      const fee = calculateExitFee(durMins);
      setFeeBreakdown({
        duration_minutes: durMins,
        duration_display: formatDuration(durMins),
        hourly_rate: PARKING_HOURLY_RATE,
        total_fee: fee,
        parking_fee: fee,
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleProcessExit = async () => {
    if (!selectedSlot || !selectedSlot.currentVehicle || !paymentConfirmed) return;

    setIsProcessing(true);
    try {
      setExitResult({
        success: true,
        fee: dynamicFee,
        message: 'Payment verified! Barrier arm released.',
      });

      // 3. Trigger 3D Exit Animation & update state
      onExitApproved(selectedSlot.id, selectedSlot.currentVehicle);

      // Close modal after brief confirmation
      setTimeout(() => {
        onClose();
        setIsProcessing(false);
        setExitResult(null);
      }, 1200);
    } catch (err: any) {
      console.error('Failed to process exit:', err);
      setTimeout(() => {
        onClose();
        setIsProcessing(false);
      }, 1000);
    }
  };

  if (!isOpen) return null;

  const currentVehicle = selectedSlot?.currentVehicle;
  const currentDurationMins = currentVehicle ? calculateDurationMinutes(currentVehicle.entryTime) : 0;
  const dynamicFee = currentVehicle ? calculateExitFee(currentDurationMins, undefined, PARKING_HOURLY_RATE) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-slate-950 border border-slate-700/80 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        {/* Header Bar */}
        <div className="px-6 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <DoorOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  CAM 03 — Vehicle Exit & Dynamic Tariff Clearance
                </h2>
                <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                  <span>ONLINE • EXIT GATE</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Rate: ₹10/hr
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Exit CCTV barrier viewfinder with dynamic stay duration calculation and automated QR toll checkout.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport & Controls Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Side: CAM 03 Surveillance Viewfinder */}
          <div className="flex-1 bg-slate-950 p-4 flex flex-col items-center justify-between border-r border-slate-800 overflow-hidden">
            {/* 16:9 Viewfinder Canvas */}
            <div className="w-full relative aspect-[16/9] max-h-[50vh] bg-[#0b101b] rounded-xl border border-slate-800 shadow-inner overflow-hidden flex items-center justify-center">
              {/* Surveillance HUD Overlay */}
              <div className="absolute top-3 left-4 z-20 flex items-center space-x-2 pointer-events-none text-xs font-mono">
                <span className="text-rose-500 font-bold flex items-center gap-1.5 bg-black/70 px-2.5 py-1 rounded border border-rose-500/40">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  REC [CAM-03-EXIT]
                </span>
                <span className="text-slate-400 bg-black/70 px-2 py-1 rounded border border-slate-800">
                  LANE 01 • OUTBOUND
                </span>
              </div>

              <div className="absolute top-3 right-4 z-20 flex items-center space-x-2 pointer-events-none text-xs font-mono">
                <span className="text-slate-400 bg-black/70 px-2 py-1 rounded border border-slate-800">
                  {new Date().toISOString().replace('T', ' ').substring(0, 19)}
                </span>
              </div>

              {/* Simulated Exit Scene Vector Graphics */}
              <svg viewBox="0 0 800 450" className="w-full h-full select-none">
                {/* Asphalt Road */}
                <rect x="0" y="0" width="800" height="450" fill="#0f172a" />
                <rect x="50" y="80" width="700" height="300" rx="6" fill="#131d2e" stroke="#334155" strokeWidth="2" />

                {/* Road Lane Markings */}
                <line x1="80" y1="230" x2="720" y2="230" stroke="#facc15" strokeWidth="3" strokeDasharray="16,12" opacity="0.8" />
                
                {/* Stop Line before Exit Barrier */}
                <line x1="480" y1="90" x2="480" y2="370" stroke="#ef4444" strokeWidth="6" opacity="0.85" />
                <text x="495" y="115" fill="#ef4444" fontSize="12" fontFamily="monospace" fontWeight="bold">
                  STOP LINE
                </text>

                {/* Exit Gate Cabin Graphic */}
                <rect x="520" y="60" width="90" height="85" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="2" />
                <rect x="530" y="70" width="70" height="40" rx="2" fill="#0284c7" opacity="0.4" />
                <text x="565" y="135" fill="#94a3b8" fontSize="10" fontFamily="sans-serif" textAnchor="middle" fontWeight="bold">
                  EXIT CABIN
                </text>

                {/* Boom Barrier Pedestal */}
                <rect x="500" y="145" width="22" height="35" rx="3" fill="#eab308" stroke="#ca8a04" strokeWidth="1.5" />
                
                {/* Boom Barrier Arm with Hazard Stripes */}
                <line x1="500" y1="160" x2="220" y2="160" stroke="#dc2626" strokeWidth="8" strokeDasharray="20,20" />
                <circle cx="500" cy="160" r="6" fill="#eab308" />

                {/* Outbound Direction Stencil */}
                <g fill="#94a3b8" opacity="0.5">
                  <path d="M 320 230 L 300 215 L 300 225 L 260 225 L 260 235 L 300 235 L 300 245 Z" />
                  <text x="290" y="270" fill="#94a3b8" fontSize="14" fontFamily="monospace" fontWeight="bold">
                    EXIT ➔
                  </text>
                </g>

                {/* Optical OCR Trigger Line */}
                <line x1="380" y1="90" x2="380" y2="370" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4,4" opacity="0.7" />
                <text x="385" y="360" fill="#38bdf8" fontSize="11" fontFamily="monospace">
                  ANPR TRIGGER
                </text>

                {/* Vehicle Representation in Exit Lane */}
                {currentVehicle && (
                  <g>
                    {/* Vehicle Silhouette */}
                    <rect
                      x="230"
                      y="155"
                      width="190"
                      height="95"
                      rx="14"
                      fill={currentVehicle.color}
                      stroke="#ffffff"
                      strokeWidth="2"
                      opacity="0.9"
                    />
                    {/* Windshields */}
                    <rect x="250" y="165" width="45" height="75" rx="4" fill="#020617" opacity="0.8" />
                    <rect x="345" y="165" width="40" height="75" rx="4" fill="#020617" opacity="0.8" />

                    {/* AI Bounding Box Overlay */}
                    <rect
                      x="220"
                      y="145"
                      width="210"
                      height="115"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="2"
                    />
                    <text
                      x="225"
                      y="140"
                      fill="#22c55e"
                      fontSize="11"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {currentVehicle.vehicleType} [98.4%]
                    </text>

                    {/* License Plate on Rear Bumper */}
                    <rect
                      x="222"
                      y="190"
                      width="22"
                      height="25"
                      rx="2"
                      fill="#f8fafc"
                      stroke="#0f172a"
                      strokeWidth="1"
                    />
                  </g>
                )}
              </svg>

              {/* Real-time Scanning Radar Beam */}
              {isScanning && (
                <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
                  <div className="w-full h-1 bg-gradient-to-r from-transparent via-rose-400 to-transparent shadow-[0_0_15px_#f43f5e] animate-scan-move" />
                </div>
              )}
            </div>

            {/* ANPR OCR Detection Bar */}
            <div className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-3 mt-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-blue-950/80 border border-blue-500/40 flex items-center justify-center text-blue-400 font-mono font-bold text-xs">
                  {ocrData?.state_code || 'IND'}
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    CAM 03 HSRP ANPR MATCH
                  </div>
                  <div className="font-mono text-base font-extrabold text-white tracking-widest">
                    {currentVehicle ? currentVehicle.plateNumber : 'NO VEHICLE DETECTED'}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-xs font-mono">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Jurisdiction:</span>
                  <span className="text-blue-400 font-semibold">{ocrData?.state_name || 'Andhra Pradesh'}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Confidence:</span>
                  <span className="text-emerald-400 font-bold">{ocrData?.confidence_percent || 98.2}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Vehicle Selection & Exit Settlement */}
          <div className="w-96 p-4 flex flex-col justify-between bg-slate-900/40 overflow-y-auto space-y-4">
            <div className="space-y-4">
              {/* Step 1: Select Departing Vehicle */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                  <span>1. Select Departing Car</span>
                  <span className="text-[10px] text-blue-400 font-mono">
                    {occupiedSlots.length} parked
                  </span>
                </label>

                {/* Search Bar */}
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search plate or bay..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Parked Vehicle List */}
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {filteredSlots.length === 0 ? (
                    <div className="text-center py-4 text-xs text-slate-500 bg-slate-950/50 rounded-lg border border-slate-800">
                      No matching vehicles found.
                    </div>
                  ) : (
                    filteredSlots.map((slot) => {
                      const isSel = selectedSlot?.id === slot.id;
                      const veh = slot.currentVehicle!;
                      return (
                        <button
                          key={slot.id}
                          onClick={() => handleSelectVehicle(slot)}
                          className={`w-full flex items-center justify-between p-2 rounded-lg border text-xs transition-all ${
                            isSel
                              ? 'bg-blue-600/20 border-blue-500/60 shadow-md ring-1 ring-blue-500/50'
                              : 'bg-slate-950/70 border-slate-800/80 hover:bg-slate-800/60 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span
                              className="w-3 h-3 rounded-full border border-white/30"
                              style={{ backgroundColor: veh.color }}
                            />
                            <span className="font-mono font-bold text-white text-xs">
                              {veh.plateNumber}
                            </span>
                            <span className="text-[10px] text-slate-400">({veh.vehicleType})</span>
                          </div>

                          <span className="font-mono font-bold text-[11px] text-blue-400 bg-blue-950/50 px-2 py-0.5 rounded border border-blue-800/40">
                            {slot.id}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Step 2: Session & Dwell Duration Breakdown */}
              {selectedSlot && currentVehicle ? (
                <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center space-x-2">
                      <Car className="w-4 h-4 text-blue-400" />
                      <span className="font-bold text-white text-xs font-mono">
                        Session: {currentVehicle.sessionId || `SES-${selectedSlot.id}`}
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/50 font-mono font-semibold">
                      Bay {selectedSlot.id}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" /> Entry Time:
                      </span>
                      <span className="font-mono text-slate-200">{currentVehicle.entryTime}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-500" /> Parked Duration:
                      </span>
                      <span className="font-mono text-amber-400 font-bold">
                        {feeBreakdown?.duration_display || currentVehicle.duration || formatDuration(currentDurationMins)}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Hourly Rate:</span>
                      <span className="font-mono text-slate-200">₹{PARKING_HOURLY_RATE}.00 / hr</span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-800/80">
                      <span className="text-slate-200 font-bold text-xs uppercase">Dynamic Fee Due:</span>
                      <span className="font-mono font-extrabold text-emerald-400 text-base flex items-center">
                        <IndianRupee className="w-3.5 h-3.5" />
                        {dynamicFee.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Step 3: Exit Result Banner */}
              {exitResult && (
                <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-lg p-3 text-xs text-emerald-300 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{exitResult.message}</span>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <button
                disabled={!selectedSlot || isProcessing}
                onClick={() => {
                  if (!selectedSlot?.currentVehicle) return;
                  onOpenPayment?.({
                    sessionId: selectedSlot.currentVehicle.sessionId || `SES-${selectedSlot.id}`,
                    vehicleNumber: selectedSlot.currentVehicle.plateNumber,
                    slotId: selectedSlot.id,
                    vehicleType: selectedSlot.currentVehicle.vehicleType,
                    entryTime: selectedSlot.currentVehicle.entryTime,
                    duration: feeBreakdown?.duration_display || selectedSlot.currentVehicle.duration || formatDuration(currentDurationMins),
                    amount: dynamicFee,
                    feeBreakdown: feeBreakdown,
                  }, () => setPaymentConfirmed(true));
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <CreditCard className="w-4 h-4" />
                <span>Pay ₹{dynamicFee.toFixed(2)} via UPI QR</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>

              <button
                disabled={!selectedSlot || isProcessing}
                onClick={handleProcessExit}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <DoorOpen className="w-4 h-4 text-rose-400" />
                <span>
                  {isProcessing ? 'Opening Exit Barrier...' : 'Direct Barrier Override'}
                </span>
              </button>

              <button
                onClick={onClose}
                className="w-full py-1.5 rounded-lg text-slate-400 hover:text-white text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
