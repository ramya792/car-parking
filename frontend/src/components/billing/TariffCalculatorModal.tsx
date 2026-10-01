import React, { useState, useEffect } from 'react';
import {
  X,
  Calculator,
  IndianRupee,
  Tag,
  Receipt,
  CheckCircle2,
} from 'lucide-react';
import { apiService } from '../../services/api';
import type { FeeCalculationResult } from '../../types/parking';
import { calculateParkingFee, PARKING_HOURLY_RATE, PARKING_PER_MINUTE_RATE, formatDuration } from '../../utils/tariff';

interface TariffCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TariffCalculatorModal: React.FC<TariffCalculatorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedVehicleType, setSelectedVehicleType] = useState('SEDAN');
  const [durationMinutes, setDurationMinutes] = useState(270); // Default 4h 30m -> ₹45.00
  const [calculation, setCalculation] = useState<FeeCalculationResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      runCalculation();
    }
  }, [isOpen, selectedVehicleType, durationMinutes]);

  const runCalculation = async () => {
    setLoading(true);
    try {
      const res = await apiService.calculateFee({
        duration_minutes: durationMinutes,
        vehicle_type: selectedVehicleType,
      });
      setCalculation(res);
    } catch (err) {
      console.error('Failed to calculate fee:', err);
      const fee = calculateParkingFee(durationMinutes);
      setCalculation({
        vehicle_type: selectedVehicleType,
        vehicle_tier_name: 'Standard Tariff',
        entry_time: '10:00 AM',
        exit_time: '02:30 PM',
        duration_minutes: durationMinutes,
        duration_display: formatDuration(durationMinutes),
        billable_hours: Math.ceil(durationMinutes / 60),
        hourly_rate: PARKING_HOURLY_RATE,
        base_fee: fee,
        hourly_fee: fee,
        additional_hours: 0,
        is_peak_hours: false,
        peak_surcharge: 0,
        subtotal: fee,
        cgst: 0,
        sgst: 0,
        tax_gst: 0,
        total_fee: fee,
        grace_period_applied: false,
        daily_cap_reached: false,
        rate_summary: `₹${PARKING_HOURLY_RATE}/hour (₹${PARKING_PER_MINUTE_RATE.toFixed(4)}/min)`,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const durationLabel = formatDuration(durationMinutes);
  const dynamicFee = calculation?.total_fee ?? calculateParkingFee(durationMinutes);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-slate-950 border border-slate-700/80 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Parking Tariff & Dynamic Billing Schedule
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  RATE: ₹10 / HOUR
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Exact duration-based fee calculation engine: duration × (₹10 / 60) rounded to 2 decimal places.
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Rate Card Grid */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-1.5">
              <Tag className="w-3.5 h-3.5 text-blue-400" />
              <span>Vehicle Tariff Classes</span>
            </h3>

            <div className="grid grid-cols-4 gap-3">
              {[
                { type: 'SEDAN', name: 'Sedan / Saloon', rate: 10.0 },
                { type: 'SUV', name: 'Full-size SUV', rate: 10.0 },
                { type: 'HATCHBACK', name: 'Compact Hatchback', rate: 10.0 },
                { type: 'TWO_WHEELER', name: 'Motorcycle / Scooter', rate: 10.0 },
              ].map((tier) => {
                const isSelected = selectedVehicleType === tier.type;
                return (
                  <button
                    key={tier.type}
                    onClick={() => setSelectedVehicleType(tier.type)}
                    className={`text-left p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/20 ring-1 ring-blue-500/50'
                        : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-white">
                        {tier.type}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-blue-400" />
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mb-3 line-clamp-1">
                      {tier.name}
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-[10px]">Hourly Rate:</span>
                        <span className="font-bold font-mono text-emerald-400">
                          ₹{tier.rate.toFixed(2)}/hr
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-[10px]">Per-Minute:</span>
                        <span className="font-bold font-mono text-slate-200">
                          ₹{(tier.rate / 60).toFixed(4)}/m
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Fee Simulator */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <Receipt className="w-3.5 h-3.5 text-amber-400" />
              <span>Real-time Dynamic Fee Simulator & Receipt</span>
            </h3>

            <div className="grid grid-cols-5 gap-6">
              {/* Controls Column (3 cols) */}
              <div className="col-span-3 space-y-4">
                {/* Vehicle Class Selector */}
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Selected Vehicle Class:</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['SEDAN', 'SUV', 'HATCHBACK', 'TWO_WHEELER'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setSelectedVehicleType(type)}
                        className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                          selectedVehicleType === type
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                            : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration Slider */}
                <div>
                  <div className="flex justify-between items-center mb-1.5 text-xs">
                    <span className="text-slate-400">Simulated Parking Duration:</span>
                    <span className="font-mono font-bold text-amber-400 text-sm bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {durationLabel} ({durationMinutes} mins)
                    </span>
                  </div>

                  <input
                    type="range"
                    min="5"
                    max="600"
                    step="5"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />

                  {/* Preset Duration Buttons matching prompt test cases */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[10px] text-slate-500">Test Cases:</span>
                    {[
                      { label: '3h (₹30.00)', mins: 180 },
                      { label: '2h 30m (₹25.00)', mins: 150 },
                      { label: '4h 30m (₹45.00)', mins: 270 },
                      { label: '6h 25m (₹64.17)', mins: 385 },
                      { label: '4h (₹40.00)', mins: 240 },
                    ].map((preset) => (
                      <button
                        key={preset.mins}
                        onClick={() => setDurationMinutes(preset.mins)}
                        className={`px-2 py-1 rounded text-[10px] font-mono transition-all ${
                          durationMinutes === preset.mins
                            ? 'bg-blue-600 text-white font-bold'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Itemized Receipt Output Card (2 cols) */}
              <div className="col-span-2 bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="text-center pb-2.5 border-b border-slate-800">
                    <div className="text-[11px] font-mono tracking-widest text-slate-400 uppercase">
                      DYNAMIC TARIFF RECEIPT
                    </div>
                    <div className="text-xs font-bold text-white mt-0.5 font-mono">
                      {loading ? 'CALCULATING...' : `RATE: ₹10.00 / HOUR`}
                    </div>
                  </div>

                  <div className="space-y-2.5 py-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Duration:</span>
                      <span className="font-mono font-bold text-amber-400">
                        {durationLabel} ({durationMinutes} mins)
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-400">Billing Precision:</span>
                      <span className="font-mono text-slate-200">
                        ₹0.1667 / minute
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-400">Calculation Formula:</span>
                      <span className="font-mono text-slate-300 text-[11px]">
                        {durationMinutes} × (10 / 60)
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2.5 border-t border-slate-700/80">
                      <span className="font-bold text-white text-xs uppercase tracking-wide">
                        Total Parking Fee:
                      </span>
                      <span className="font-mono text-xl font-extrabold text-emerald-400 flex items-center">
                        <IndianRupee className="w-4 h-4 mr-0.5" />
                        {dynamicFee.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 text-center pt-2 border-t border-slate-900">
                  Dynamic Tariff Engine v2.0 • Source of Truth: Backend
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 flex justify-end bg-slate-900/40">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Close Calculator
          </button>
        </div>
      </div>
    </div>
  );
};
