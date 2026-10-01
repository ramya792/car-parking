import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Video,
  CheckCircle2,
  Circle,
  ArrowRightCircle,
  ArrowLeftCircle,
  Activity,
  LayoutGrid,
  Car,
  Clock,
  TrendingUp,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { CCTV3DCanvas } from '../cameras/CCTV3DCanvas';
import { CameraMonitoringSidebar } from '../cameras/CameraMonitoringSidebar';
import type { CCTVCameraId } from '../cameras/CCTV3DCanvas';
import { useParkingStore } from '../../store/parkingStore';
import { apiService } from '../../services/api';

// ─── Types ───────────────────────────────────────────────────────────────────
interface MovementEvent {
  id: string;
  type: 'ENTRY' | 'EXIT';
  plate: string;
  slot: string;
  time: string;
  direction: string;
  camera: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const now = () => new Date().toLocaleTimeString('en-IN', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });

export const CamerasView: React.FC = () => {
  const [selectedCam, setSelectedCam] = useState<CCTVCameraId | 'ALL'>('ALL');
  const [history, setHistory] = useState<any[]>([]);
  const [movements, setMovements] = useState<MovementEvent[]>([]);
  const prevOccupied = useRef<Set<string>>(new Set());
  const prevExited = useRef<Set<string>>(new Set());
  const { slots, entryGateOpen, exitGateOpen } = useParkingStore();

  const occupiedSlots = slots.filter((s) => s.status === 'OCCUPIED');
  const availableSlots = slots.filter((s) => s.status === 'AVAILABLE');
  const occupancyPct = Math.round((occupiedSlots.length / 20) * 100);

  // ── Load history sessions ──────────────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    try {
      const data = await apiService.getVehicleHistory();
      if (Array.isArray(data)) setHistory(data);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadHistory();
    const id = setInterval(loadHistory, 6000);
    return () => clearInterval(id);
  }, [loadHistory]);

  // ── Auto-detect movement events from slot changes ─────────────────────────
  useEffect(() => {
    const currentOccupied = new Set(
      occupiedSlots.map((s) => s.id)
    );

    // New entries (was not occupied, now occupied)
    currentOccupied.forEach((slotId) => {
      if (!prevOccupied.current.has(slotId)) {
        const slot = slots.find((s) => s.id === slotId);
        const plate = slot?.currentVehicle?.plateNumber || 'UNKNOWN';
        setMovements((prev) => [
          {
            id: `${slotId}-${Date.now()}`,
            type: 'ENTRY',
            plate,
            slot: slotId,
            time: now(),
            direction: '← WEST GATE IN',
            camera: 'CAM 01',
          },
          ...prev.slice(0, 49),
        ]);
      }
    });

    // Exits (was occupied, now available)
    prevOccupied.current.forEach((slotId) => {
      if (!currentOccupied.has(slotId)) {
        setMovements((prev) => [
          {
            id: `${slotId}-exit-${Date.now()}`,
            type: 'EXIT',
            plate: '—',
            slot: slotId,
            time: now(),
            direction: 'EAST GATE OUT →',
            camera: 'CAM 03',
          },
          ...prev.slice(0, 49),
        ]);
      }
    });

    prevOccupied.current = currentOccupied;
  }, [occupiedSlots, slots]);

  // ── Also generate movement events from history (EXITED sessions) ──────────
  useEffect(() => {
    const exitedIds = new Set(
      history.filter((s) => s.status === 'EXITED').map((s) => s.id)
    );
    exitedIds.forEach((id) => {
      if (!prevExited.current.has(id)) {
        const s = history.find((h) => h.id === id);
        if (s) {
          setMovements((prev) => {
            if (prev.some((m) => m.id === `hist-exit-${id}`)) return prev;
            return [
              {
                id: `hist-exit-${id}`,
                type: 'EXIT',
                plate: s.vehicle_number,
                slot: s.slot_id || s.parking_slot || '—',
                time: s.exit_time || now(),
                direction: 'EAST GATE OUT →',
                camera: 'CAM 03',
              },
              ...prev.slice(0, 49),
            ];
          });
        }
      }
    });
    prevExited.current = exitedIds;
  }, [history]);

  // ─── Camera Config ─────────────────────────────────────────────────────────
  const camerasList = [
    {
      id: 'CAM_01' as CCTVCameraId,
      title: 'CAM 01 — ENTRY CAMERA',
      location: 'West Ingress Lane & Barrier Arm',
      actionHint: 'License plate detection & automatic slot assignment',
      statusBadge: entryGateOpen ? 'Vehicle Arriving' : 'Ingress Active',
      badgeColor: entryGateOpen ? 'amber' : 'emerald',
    },
    {
      id: 'CAM_02' as CCTVCameraId,
      title: 'CAM 02 — PARKING AREA (20 BAYS)',
      location: 'Surface Digital Twin (P01–P20)',
      actionHint: `${occupiedSlots.length} bays occupied • ${availableSlots.length} bays available`,
      statusBadge: `${occupiedSlots.length}/20 Occupied`,
      badgeColor: occupiedSlots.length >= 18 ? 'red' : occupiedSlots.length > 10 ? 'amber' : 'emerald',
    },
    {
      id: 'CAM_03' as CCTVCameraId,
      title: 'CAM 03 — EXIT CAMERA',
      location: 'East Egress Lane & Barrier Arm',
      actionHint: 'Automatic tariff clearance & exit authorization',
      statusBadge: exitGateOpen ? 'Vehicle Exiting' : 'Egress Active',
      badgeColor: exitGateOpen ? 'amber' : 'emerald',
    },
  ];

  const filteredCams = camerasList.filter(
    (cam) => selectedCam === 'ALL' || selectedCam === cam.id
  );

  // ─── Active parked sessions from history ───────────────────────────────────
  const parkedSessions = history.filter((s) => s.status === 'PARKED');

  return (
    <div className="space-y-5 text-slate-800 select-none pb-8">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-slate-900 tracking-wide">
                Cameras — Multi-View CCTV Intelligence Hub
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                <span>3 LIVE 3D CCTV STREAMS</span>
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Real-time slot availability, parked vehicle tracking &amp; directional movement log.
            </p>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          {(['ALL', 'CAM_01', 'CAM_02', 'CAM_03'] as const).map((camId) => (
            <button
              key={camId}
              onClick={() => setSelectedCam(camId as any)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedCam === camId
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {camId === 'ALL' ? 'All Cameras Grid' : camId.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <CameraMonitoringSidebar timeOfDay="DAY" />

      {/* ── KPI Strip ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Available Bays',
            value: availableSlots.length,
            of: '/20',
            color: 'emerald',
            icon: <CheckCircle2 className="w-4 h-4" />,
          },
          {
            label: 'Occupied Bays',
            value: occupiedSlots.length,
            of: '/20',
            color: 'red',
            icon: <Car className="w-4 h-4" />,
          },
          {
            label: 'Occupancy',
            value: occupancyPct,
            of: '%',
            color: occupancyPct > 80 ? 'red' : occupancyPct > 50 ? 'amber' : 'blue',
            icon: <TrendingUp className="w-4 h-4" />,
          },
          {
            label: 'Movement Events',
            value: movements.length,
            of: '',
            color: 'purple',
            icon: <Activity className="w-4 h-4" />,
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className={`bg-white border rounded-xl p-3 flex items-center space-x-3 shadow-xs border-${kpi.color}-100`}
          >
            <div className={`w-9 h-9 rounded-lg bg-${kpi.color}-50 border border-${kpi.color}-200 flex items-center justify-center text-${kpi.color}-600 shrink-0`}>
              {kpi.icon}
            </div>
            <div>
              <div className={`text-xl font-black text-${kpi.color}-600 leading-none`}>
                {kpi.value}<span className="text-sm font-semibold text-slate-400">{kpi.of}</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Camera Feeds Grid ─────────────────────────────────────────────── */}
      <div className={`grid gap-5 ${selectedCam === 'ALL' ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 max-w-3xl mx-auto'}`}>
        {filteredCams.map((cam) => (
          <div
            key={cam.id}
            className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col group hover:border-slate-300 hover:shadow-md transition-all"
          >
            {/* Camera Header */}
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="font-mono font-bold text-xs text-slate-900 tracking-wide">{cam.title}</h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300 font-semibold">
                LIVE STREAM
              </span>
            </div>

            {/* 3D CCTV Canvas */}
            <div className="relative aspect-[16/9] bg-slate-950 overflow-hidden">
              <CCTV3DCanvas cameraId={cam.id} showOverlay={true} className="w-full h-full" />
            </div>

            {/* Footer Status */}
            <div className="px-4 py-3 bg-white border-t border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-900 block">{cam.location}</span>
                <span className="text-[11px] text-slate-500">{cam.actionHint}</span>
              </div>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${
                cam.badgeColor === 'emerald'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : cam.badgeColor === 'amber'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : cam.badgeColor === 'red'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                {cam.statusBadge}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Intelligence Panel ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Slot Availability Grid (CAM 02 Intelligence) ──────────────── */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <LayoutGrid className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Bay Availability Map</h2>
                <p className="text-[11px] text-slate-500">CAM 02 — All 20 bays live status</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 text-[11px] font-semibold">
              <span className="flex items-center space-x-1 text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
                <span>Available ({availableSlots.length})</span>
              </span>
              <span className="flex items-center space-x-1 text-red-600">
                <span className="w-2.5 h-2.5 rounded-sm bg-red-500" />
                <span>Occupied ({occupiedSlots.length})</span>
              </span>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Row P01–P10 */}
            <div>
              <p className="text-[10px] font-mono font-bold text-slate-400 mb-2 tracking-widest">TOP ROW — P01 to P10</p>
              <div className="grid grid-cols-10 gap-1.5">
                {slots.filter((s) => s.slotNumber <= 10).map((slot) => {
                  const isOccupied = slot.status === 'OCCUPIED';
                  return (
                    <div
                      key={slot.id}
                      title={
                        isOccupied
                          ? `${slot.id}: ${slot.currentVehicle?.plateNumber || 'Vehicle'}`
                          : `${slot.id}: Available`
                      }
                      className={`relative rounded-md flex flex-col items-center justify-center py-2.5 border transition-all cursor-default ${
                        isOccupied
                          ? 'bg-red-50 border-red-300 text-red-700'
                          : 'bg-emerald-50 border-emerald-300 text-emerald-700'
                      }`}
                    >
                      <span className="text-[9px] font-mono font-black leading-none">{slot.id}</span>
                      {isOccupied ? (
                        <Car className="w-3.5 h-3.5 mt-0.5 text-red-500" />
                      ) : (
                        <Circle className="w-3 h-3 mt-0.5 text-emerald-400" />
                      )}
                      {isOccupied && slot.currentVehicle?.plateNumber && (
                        <span className="absolute -bottom-0.5 left-0 right-0 text-center text-[7px] font-mono text-red-600 truncate px-0.5 leading-none">
                          {slot.currentVehicle.plateNumber.slice(-4)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Row P11–P20 */}
            <div>
              <p className="text-[10px] font-mono font-bold text-slate-400 mb-2 tracking-widest">BOTTOM ROW — P11 to P20</p>
              <div className="grid grid-cols-10 gap-1.5">
                {slots.filter((s) => s.slotNumber > 10).map((slot) => {
                  const isOccupied = slot.status === 'OCCUPIED';
                  return (
                    <div
                      key={slot.id}
                      title={
                        isOccupied
                          ? `${slot.id}: ${slot.currentVehicle?.plateNumber || 'Vehicle'}`
                          : `${slot.id}: Available`
                      }
                      className={`relative rounded-md flex flex-col items-center justify-center py-2.5 border transition-all cursor-default ${
                        isOccupied
                          ? 'bg-red-50 border-red-300 text-red-700'
                          : 'bg-emerald-50 border-emerald-300 text-emerald-700'
                      }`}
                    >
                      <span className="text-[9px] font-mono font-black leading-none">{slot.id}</span>
                      {isOccupied ? (
                        <Car className="w-3.5 h-3.5 mt-0.5 text-red-500" />
                      ) : (
                        <Circle className="w-3 h-3 mt-0.5 text-emerald-400" />
                      )}
                      {isOccupied && slot.currentVehicle?.plateNumber && (
                        <span className="absolute -bottom-0.5 left-0 right-0 text-center text-[7px] font-mono text-red-600 truncate px-0.5 leading-none">
                          {slot.currentVehicle.plateNumber.slice(-4)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Parked Vehicles Table */}
            {parkedSessions.length > 0 && (
              <div className="border border-slate-100 rounded-xl overflow-hidden mt-2">
                <div className="bg-slate-50 px-3 py-2 border-b border-slate-100 flex items-center space-x-2">
                  <Car className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                    Currently Parked Vehicles ({parkedSessions.length})
                  </span>
                </div>
                <div className="divide-y divide-slate-50 max-h-36 overflow-y-auto">
                  {parkedSessions.map((s) => (
                    <div key={s.id} className="px-3 py-2 flex items-center justify-between hover:bg-slate-50 text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-black text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                          {s.slot_id || s.parking_slot || '—'}
                        </span>
                        <span className="font-mono font-bold text-blue-700">{s.vehicle_number}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span className="text-[10px]">{s.entry_time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {parkedSessions.length === 0 && occupiedSlots.length === 0 && (
              <div className="flex flex-col items-center justify-center py-6 text-slate-400 space-y-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                <p className="text-sm font-semibold text-emerald-600">All 20 bays are available</p>
                <p className="text-xs">No vehicles currently parked</p>
              </div>
            )}

            {occupiedSlots.length > 0 && parkedSessions.length === 0 && (
              <div className="flex items-center space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  {occupiedSlots.length} bay(s) occupied but sessions not yet synced.{' '}
                  <button
                    className="underline font-bold hover:text-amber-900"
                    onClick={async () => { await apiService.syncSessions(); await loadHistory(); }}
                  >
                    Click to Sync
                  </button>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Live Movement Log ─────────────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Live Movement Log</h2>
                <p className="text-[11px] text-slate-500">Entry & exit direction tracking</p>
              </div>
            </div>
            <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
              <span>LIVE</span>
            </span>
          </div>

          {/* Direction Indicators */}
          <div className="px-4 py-3 border-b border-slate-100 grid grid-cols-2 gap-2">
            <div className={`flex items-center space-x-2 p-2 rounded-lg border transition-all ${
              entryGateOpen
                ? 'bg-emerald-50 border-emerald-300 animate-pulse'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <ArrowLeftCircle className={`w-5 h-5 ${entryGateOpen ? 'text-emerald-600' : 'text-slate-400'}`} />
              <div>
                <p className={`text-[10px] font-bold uppercase ${entryGateOpen ? 'text-emerald-700' : 'text-slate-500'}`}>
                  West Gate
                </p>
                <p className="text-[9px] text-slate-400">Entry (CAM 01)</p>
              </div>
            </div>
            <div className={`flex items-center space-x-2 p-2 rounded-lg border transition-all ${
              exitGateOpen
                ? 'bg-blue-50 border-blue-300 animate-pulse'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <ArrowRightCircle className={`w-5 h-5 ${exitGateOpen ? 'text-blue-600' : 'text-slate-400'}`} />
              <div>
                <p className={`text-[10px] font-bold uppercase ${exitGateOpen ? 'text-blue-700' : 'text-slate-500'}`}>
                  East Gate
                </p>
                <p className="text-[9px] text-slate-400">Exit (CAM 03)</p>
              </div>
            </div>
          </div>

          {/* Movement Event Log */}
          <div className="flex-1 overflow-y-auto max-h-[420px] divide-y divide-slate-50">
            {movements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400 space-y-2">
                <Activity className="w-8 h-8 text-slate-300" />
                <p className="text-xs font-medium">No movement events yet</p>
                <p className="text-[11px] text-slate-400 text-center px-4">
                  Events will appear here as vehicles enter or exit.
                </p>
              </div>
            ) : (
              movements.map((ev) => (
                <div
                  key={ev.id}
                  className={`px-4 py-2.5 hover:bg-slate-50 transition-all flex items-start space-x-3 ${
                    ev.type === 'ENTRY' ? 'border-l-2 border-emerald-400' : 'border-l-2 border-blue-400'
                  }`}
                >
                  <div className={`mt-0.5 shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                    ev.type === 'ENTRY'
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {ev.type === 'ENTRY'
                      ? <ArrowLeftCircle className="w-3.5 h-3.5" />
                      : <ArrowRightCircle className="w-3.5 h-3.5" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                        ev.type === 'ENTRY'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}>
                        {ev.type}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-1">{ev.time}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 mt-1">
                      <span className="font-mono font-black text-slate-800 text-xs">{ev.plate}</span>
                      <ChevronRight className="w-3 h-3 text-slate-300" />
                      <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-600 px-1 rounded">{ev.slot}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[10px] text-slate-500 font-medium">{ev.direction}</span>
                      <span className="text-[9px] text-slate-400 font-mono">{ev.camera}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer summary */}
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">
              {movements.filter(m => m.type === 'ENTRY').length} entries &nbsp;•&nbsp;
              {movements.filter(m => m.type === 'EXIT').length} exits today
            </span>
            <span className="text-slate-400 font-mono">CAMS: 01 + 03</span>
          </div>
        </div>
      </div>
    </div>
  );
};
