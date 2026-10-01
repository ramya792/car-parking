import React, { useState, useEffect, useMemo } from 'react';
import {
  Car,
  Search,
  PlusCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { useParkingStore } from '../../store/parkingStore';
import { apiService } from '../../services/api';
import { calculateParkingFee, calculateDurationMinutes, formatDuration } from '../../utils/tariff';

interface VehiclesViewProps {
  onOpenEntryModal: () => void;
  onOpenExitModal: () => void;
  onSelectSlot: (slotId: string) => void;
}

interface ActiveVehicleRow {
  slotId: string;
  row: string;
  plateNumber: string;
  type: string;
  color: string;
  entryTime: string;
  duration: string;
  fee: number;
  status: string;
  confidence: number;
}

export const VehiclesView: React.FC<VehiclesViewProps> = ({
  onOpenEntryModal,
  onOpenExitModal,
  onSelectSlot,
}) => {
  const { slots, resetFacility } = useParkingStore();
  const [backendVehicles, setBackendVehicles] = useState<any[]>([]);
  const [viewState, setViewState] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [errorMessage, setErrorMessage] = useState('');
  const [search, setSearch] = useState('');
  const [now, setNow] = useState(new Date());

  const loadActiveVehicles = async () => {
    try {
      setViewState('LOADING');
      setErrorMessage('');
      const data = await apiService.getActiveVehicles();
      setBackendVehicles(data);
      setViewState('SUCCESS');
    } catch (err: any) {
      console.warn('Could not fetch active vehicles from backend:', err);
      setViewState('ERROR');
      setErrorMessage(err?.message || 'Failed to load active vehicles from server.');
    }
  };

  useEffect(() => {
    loadActiveVehicles();
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60000); // Re-calculate elapsed duration every minute
    return () => clearInterval(timer);
  }, []);

  const activeVehicles: ActiveVehicleRow[] = useMemo(() => {
    if (backendVehicles && backendVehicles.length > 0) {
      return backendVehicles.map((bv: any) => {
        const slot = slots.find((s) => s.id === bv.slot_id);
        const durMins = bv.duration_minutes ?? calculateDurationMinutes(bv.entry_time, now);
        return {
          slotId: bv.slot_id,
          row: bv.row || slot?.row || 'TOP',
          plateNumber: bv.vehicle_number,
          type: bv.vehicle_type || 'SEDAN',
          color: bv.color || '#2563eb',
          entryTime: bv.entry_time || 'Recent',
          duration: bv.duration_display || formatDuration(durMins),
          fee: bv.fee ?? calculateParkingFee(durMins),
          status: bv.status || 'PARKED',
          confidence: bv.confidence || 0.96,
        };
      });
    }

    return slots
      .filter((s) => s.status === 'OCCUPIED' && s.currentVehicle)
      .map((slot) => {
        const v = slot.currentVehicle!;
        const durMins = calculateDurationMinutes(v.entryTime, now);
        return {
          slotId: slot.id,
          row: slot.row,
          plateNumber: v.plateNumber,
          type: v.vehicleType || 'SEDAN',
          color: v.color || '#2563eb',
          entryTime: v.entryTime || 'Just Now',
          duration: v.duration || formatDuration(durMins),
          fee: calculateParkingFee(durMins),
          status: 'PARKED',
          confidence: v.confidence || 0.96,
        };
      });
  }, [backendVehicles, slots, now]);

  const filtered = useMemo(() => {
    if (!search.trim()) return activeVehicles;
    const q = search.trim().toLowerCase();
    return activeVehicles.filter(
      (v) =>
        v.plateNumber.toLowerCase().includes(q) ||
        v.slotId.toLowerCase().includes(q) ||
        v.type.toLowerCase().includes(q) ||
        v.color.toLowerCase().includes(q)
    );
  }, [activeVehicles, search]);

  return (
    <div className="space-y-4 text-slate-800 select-none pb-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-slate-900 tracking-wide">
                Active Vehicles & Bay Registry
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {activeVehicles.length} ACTIVE VEHICLES
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
                ₹10/HR DYNAMIC
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Live tracking of all vehicles currently parked in 20 calibrated bays with dynamic tariff stay monitoring.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={async () => {
              await resetFacility();
              await loadActiveVehicles();
            }}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Reset all 20 bays to 0 (Vacant)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Lot (0)</span>
          </button>
          <button
            onClick={loadActiveVehicles}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 text-xs transition-colors cursor-pointer"
            title="Refresh Active Vehicles"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenEntryModal}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Register Vehicle Entry</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-xl shadow-xs">
        <div className="relative w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by plate, slot (e.g. P07), vehicle type, or color..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="text-xs text-slate-500 font-mono">
          Showing <strong className="text-slate-900 font-bold">{filtered.length}</strong> of {activeVehicles.length} vehicles
        </div>
      </div>

      {/* Error Banner */}
      {viewState === 'ERROR' && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs text-rose-800 shadow-sm">
          <div className="flex items-center space-x-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <div>
              <div className="font-bold text-rose-900">Unable to load active vehicles</div>
              <div className="text-[11px] text-rose-700">{errorMessage}</div>
            </div>
          </div>
          <button
            onClick={loadActiveVehicles}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Vehicles Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-mono border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold">VEHICLE PLATE</th>
                <th className="px-4 py-3 font-semibold">ASSIGNED BAY</th>
                <th className="px-4 py-3 font-semibold">TYPE & COLOR</th>
                <th className="px-4 py-3 font-semibold">ENTRY TIMESTAMP</th>
                <th className="px-4 py-3 font-semibold">DURATION ELAPSED</th>
                <th className="px-4 py-3 font-semibold">ESTIMATED TARIFF</th>
                <th className="px-4 py-3 font-semibold">STATUS</th>
                <th className="px-4 py-3 font-semibold text-right">ADMIN ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filtered.map((v) => (
                <tr key={v.slotId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full border border-slate-300"
                        style={{ backgroundColor: v.color }}
                      />
                      <span className="font-bold text-slate-900 text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-300 shadow-xs">
                        {v.plateNumber}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded">
                      {v.slotId} ({v.row})
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700 font-sans text-xs">
                    {v.type}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-[11px]">
                    {v.entryTime}
                  </td>
                  <td className="px-4 py-3 text-slate-800">
                    <div className="flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>{v.duration}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-bold text-amber-700">₹{v.fee.toFixed(2)}</span>
                      <span className="text-[10px] text-slate-400 font-sans">₹10/hr Rate</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                      <span>{v.status}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end space-x-2 font-sans">
                      <button
                        onClick={() => onSelectSlot(v.slotId)}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-medium transition-all"
                        title="Inspect Bay in 3D Digital Twin"
                      >
                        Inspect 3D
                      </button>
                      <button
                        onClick={onOpenExitModal}
                        className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition-all flex items-center space-x-1 shadow-xs"
                        title="Process Exit & Payment via QR"
                      >
                        <span>Process Exit</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && viewState !== 'LOADING' && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400 font-sans text-xs">
                    {search ? 'No active vehicles matching your search criteria.' : 'No active vehicles currently parked.'}
                  </td>
                </tr>
              )}
              {viewState === 'LOADING' && activeVehicles.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500 font-sans text-xs">
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Loading active vehicles...</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
