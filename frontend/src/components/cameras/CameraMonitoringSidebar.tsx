import React from 'react';
import {
  Video,
  Eye,
  ArrowRight,
} from 'lucide-react';
import { useParkingStore } from '../../store/parkingStore';

interface CameraMonitoringSidebarProps {
  onOpenCam01?: () => void;
  onOpenCam02?: () => void;
  onOpenCam03?: () => void;
  onFocusCamera3D?: (directionOrId: string) => void;
  onNavigateToCamerasPage?: () => void;
  timeOfDay?: 'DAY' | 'NIGHT';
}

export const CameraMonitoringSidebar: React.FC<CameraMonitoringSidebarProps> = ({
  onFocusCamera3D,
  onNavigateToCamerasPage,
  timeOfDay = 'DAY',
}) => {
  const isDay = timeOfDay === 'DAY';
  const { slots } = useParkingStore();

  const occupiedCount = slots.filter((s) => s.status === 'OCCUPIED').length;
  const availableCount = slots.filter((s) => s.status === 'AVAILABLE').length;

  const firstOccupied = slots.find((s) => s.status === 'OCCUPIED' && s.currentVehicle);
  const activePlate = firstOccupied?.currentVehicle?.plateNumber || 'None';

  const cameraSummaryList = [
    {
      id: 'CAM_01',
      code: 'WEST',
      name: 'CAM 01 — Entrance Gate',
      zone: 'West Entrance ANPR Kiosk',
      status: 'ONLINE',
      detection: 'Vehicle Entry Monitor Active',
      plate: firstOccupied?.currentVehicle?.plateNumber || 'Standby',
    },
    {
      id: 'CAM_02',
      code: 'TOP',
      name: 'CAM 02 — Parking Area',
      zone: 'Overhead 20-Bay Digital Twin',
      status: 'ONLINE',
      detection: `${occupiedCount} Occupied / ${availableCount} Vacant`,
      plate: activePlate,
    },
    {
      id: 'CAM_03',
      code: 'EAST',
      name: 'CAM 03 — Exit Gate',
      zone: 'East Exit Barrier & Payment QR',
      status: 'ONLINE',
      detection: 'Exit Clearance & QR Reader Active',
      plate: activePlate,
    },
  ];

  const sidebarCard = isDay
    ? 'bg-white border-slate-200/90 text-slate-800 shadow-sm'
    : 'bg-slate-900/80 border-slate-800 text-slate-100 shadow-md';

  const subCard = isDay
    ? 'bg-slate-50 border-slate-200'
    : 'bg-slate-950/90 border-slate-800/90';

  const titleText = isDay ? 'text-slate-900 font-bold' : 'text-white font-bold';
  const borderLine = isDay ? 'border-slate-200' : 'border-slate-800/80';

  return (
    <div className={`w-full h-full border rounded-xl p-3.5 flex flex-col justify-between select-none overflow-y-auto space-y-3 transition-all ${sidebarCard}`}>
      {/* Header */}
      <div>
        <div className={`flex items-center justify-between pb-2 border-b ${borderLine}`}>
          <div className="flex items-center space-x-2">
            <Video className="w-4 h-4 text-blue-600" />
            <h2 className={`text-xs tracking-wide ${titleText}`}>
              Camera Status Summary
            </h2>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            ALL ONLINE
          </span>
        </div>

        {/* Camera Summary Cards */}
        <div className="mt-3 space-y-2.5">
          {cameraSummaryList.map((cam) => (
            <div
              key={cam.id}
              className={`border rounded-xl p-3 transition-all space-y-1.5 ${subCard}`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className={`font-mono font-bold flex items-center space-x-1.5 ${isDay ? 'text-slate-900' : 'text-white'}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{cam.name}</span>
                </span>
                <button
                  onClick={() => onFocusCamera3D?.(cam.code)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono border flex items-center space-x-1 ${
                    isDay
                      ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
                  }`}
                  title="Align 3D Viewport to Camera Angle"
                >
                  <Eye className="w-3 h-3 text-blue-600" />
                  <span>Focus 3D</span>
                </button>
              </div>

              <div className="text-[10px] font-mono text-slate-500">
                {cam.zone}
              </div>

              <div className={`flex items-center justify-between text-[10px] font-mono pt-1 border-t ${isDay ? 'border-slate-200' : 'border-slate-800/50'}`}>
                <span className={`font-bold truncate max-w-[65%] ${isDay ? 'text-blue-700' : 'text-yellow-300'}`}>
                  {cam.detection}
                </span>
                <span className="text-emerald-600 font-semibold">
                  1080P • 60FPS
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Primary Action: Open Full Cameras Page */}
      <div className={`pt-2 border-t ${borderLine}`}>
        <button
          onClick={onNavigateToCamerasPage}
          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center justify-center space-x-2 transition-all"
        >
          <span>Open Dedicated Cameras Page</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
