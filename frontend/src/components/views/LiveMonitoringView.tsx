import React, { useState } from 'react';
import {
  Video,
  Maximize2,
} from 'lucide-react';
import { useParkingStore } from '../../store/parkingStore';
import { CCTV3DCanvas } from '../cameras/CCTV3DCanvas';
import type { CCTVCameraId } from '../cameras/CCTV3DCanvas';
import type { EntryAnimationData } from '../three/EnteringVehicleAnimation';

interface LiveMonitoringViewProps {
  onOpenCamModal?: (camId: string) => void;
  onFocusGate?: (dir: string) => void;
  entryAnimationData?: EntryAnimationData | null;
}

export const LiveMonitoringView: React.FC<LiveMonitoringViewProps> = ({
  onOpenCamModal,
  entryAnimationData = null,
}) => {
  const { slots } = useParkingStore();
  const [selectedCam, setSelectedCam] = useState<string>('ALL');

  const occupiedCount = slots.filter((s) => s.status === 'OCCUPIED').length;

  const cameras: {
    id: CCTVCameraId;
    name: string;
    zone: string;
    status: string;
    fps: number;
    lastPlate: string;
    coverage: string;
  }[] = [
    {
      id: 'CAM_01',
      name: 'CAM 01 — West Entrance Gate',
      zone: 'West Gate (Entry)',
      status: 'ONLINE',
      fps: 60,
      lastPlate: 'Standby',
      coverage: 'Entrance Lane, Automated Boom Barrier, RFID / ANPR Scanner',
    },
    {
      id: 'CAM_02',
      name: 'CAM 02 — Overhead Digital Twin (20 Bays)',
      zone: 'Central Parking Lot',
      status: 'ONLINE',
      fps: 60,
      lastPlate: `${occupiedCount} Cars Parked`,
      coverage: 'Full 20-Bay Surface, Driving Aisle, Pedestrian Crossing',
    },
    {
      id: 'CAM_03',
      name: 'CAM 03 — East Exit Gate & Payment Kiosk',
      zone: 'East Gate (Exit)',
      status: 'ONLINE',
      fps: 60,
      lastPlate: 'Standby',
      coverage: 'Exit Lane, Motorized Exit Barrier, UPI QR Terminal',
    },
    {
      id: 'CAM_04',
      name: 'CAM 04 — North Wing Surveillance',
      zone: 'North Wing (P01 - P10)',
      status: 'ONLINE',
      fps: 60,
      lastPlate: '10 Bays Monitored',
      coverage: 'Slots P01 to P10 Perimeter Wall, Floodlights',
    },
  ];

  return (
    <div className="space-y-4 text-slate-800 select-none pb-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-slate-900 tracking-wide">
                Live CCTV Monitoring & Surveillance Hub
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                <span>4 STREAMS ONLINE (1080P)</span>
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Real-time multi-angle 3D camera feeds observing entry, exit, and 20 parking bays.
            </p>
          </div>
        </div>

        {/* Camera Selector Tabs */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          {['ALL', 'CAM_01', 'CAM_02', 'CAM_03', 'CAM_04'].map((camId) => (
            <button
              key={camId}
              onClick={() => setSelectedCam(camId)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedCam === camId
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {camId === 'ALL' ? 'Multi-Grid (4x)' : camId}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid View */}
      <div className={`grid gap-4 ${selectedCam === 'ALL' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
        {cameras
          .filter((cam) => selectedCam === 'ALL' || selectedCam === cam.id)
          .map((cam) => (
            <div
              key={cam.id}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:border-slate-300 transition-all flex flex-col group"
            >
              {/* Camera Header */}
              <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span className="font-mono font-bold text-slate-900">{cam.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {cam.fps} FPS • 1080P
                  </span>
                  <button
                    onClick={() => onOpenCamModal?.(cam.id)}
                    className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-900"
                    title="Fullscreen Viewfinder"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Live 3D View Container */}
              <div className="relative aspect-[16/9] bg-slate-950 overflow-hidden">
                <CCTV3DCanvas
                  cameraId={cam.id}
                  showOverlay={true}
                  entryAnimationData={entryAnimationData}
                  className="w-full h-full"
                />
              </div>

              {/* Camera Details Footer */}
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-600 text-[11px] truncate max-w-[70%]">
                  {cam.coverage}
                </span>
                <span className="text-blue-700 font-mono font-bold text-[11px]">
                  {cam.lastPlate}
                </span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};
