import React from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { Lighting } from '../three/Lighting';
import { Ground } from '../three/Ground';
import { PerimeterWalls } from '../three/PerimeterWalls';
import { Landscaping } from '../three/Trees';
import { StreetLights } from '../three/StreetLights';
import { Gates } from '../three/Gates';
import { CCTVPosts } from '../three/CCTVPosts';
import { RoadMarkings } from '../three/RoadMarkings';
import { ParkingSlotsGroup } from '../three/ParkingSlotsGroup';
import { ParkedVehicles } from '../three/ParkedVehicles';
import { SlotFloatingBadge } from '../three/SlotFloatingBadge';
import { EnteringVehicleAnimation } from '../three/EnteringVehicleAnimation';
import type { EntryAnimationData } from '../three/EnteringVehicleAnimation';
import { ExitingVehicleAnimation } from '../three/ExitingVehicleAnimation';
import type { ExitAnimationData } from '../three/ExitingVehicleAnimation';
import { useParkingStore } from '../../store/parkingStore';

export type CCTVCameraId = 'CAM_01' | 'CAM_02' | 'CAM_03' | 'CAM_04' | 'CAM_05';

interface CCTV3DCanvasProps {
  cameraId: CCTVCameraId;
  timeOfDay?: 'DAY' | 'NIGHT';
  showOverlay?: boolean;
  onSlotSelect?: (slotId: string) => void;
  entryAnimationData?: EntryAnimationData | null;
  exitingAnimationData?: ExitAnimationData | null;
  className?: string;
}

interface CameraConfig {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  name: string;
  type: string;
}

const CAMERA_CONFIGS: Record<CCTVCameraId, CameraConfig> = {
  CAM_01: {
    position: [-24.0, 7.2, 6.5],
    target: [-16.5, 1.0, 1.8],
    fov: 46,
    name: 'CAM 01 - Entrance Gate (West)',
    type: 'ENTRY CAMERA',
  },
  CAM_02: {
    position: [0, 32, 0.1],
    target: [0, 0, 0],
    fov: 50,
    name: 'CAM 02 - Parking Area (20 Bays)',
    type: 'PARKING AREA CAMERA',
  },
  CAM_03: {
    position: [24.0, 7.2, -6.5],
    target: [16.5, 1.0, -1.8],
    fov: 46,
    name: 'CAM 03 - Exit Gate (East)',
    type: 'EXIT CAMERA',
  },
  CAM_04: {
    position: [0, 9.8, -1.8],
    target: [0, 0.5, -8.2],
    fov: 48,
    name: 'CAM 04 - North Wing (P01-P10)',
    type: 'NORTH ZONE',
  },
  CAM_05: {
    position: [0, 9.8, 1.8],
    target: [0, 0.5, 8.2],
    fov: 48,
    name: 'CAM 05 - South Wing (P11-P20)',
    type: 'SOUTH ZONE',
  },
};

export const CCTV3DCanvas: React.FC<CCTV3DCanvasProps> = ({
  cameraId,
  timeOfDay = 'DAY',
  showOverlay = true,
  onSlotSelect,
  entryAnimationData = null,
  exitingAnimationData = null,
  className = 'w-full h-full',
}) => {
  const config = CAMERA_CONFIGS[cameraId] || CAMERA_CONFIGS.CAM_02;
  const { slots, entryGateOpen, exitGateOpen } = useParkingStore();

  const occupiedCount = slots.filter((s) => s.status === 'OCCUPIED').length;
  const availableCount = slots.filter((s) => s.status === 'AVAILABLE').length;

  const firstOccupied = slots.find((s) => s.status === 'OCCUPIED' && s.currentVehicle);
  const activePlate = firstOccupied?.currentVehicle?.plateNumber || '';
  const occupancyPercent = Math.round((occupiedCount / 20) * 100);

  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
      <Canvas
        camera={{
          position: config.position,
          fov: config.fov,
        }}
        onCreated={({ camera }) => {
          camera.lookAt(new THREE.Vector3(...config.target));
        }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#e2e8f0']} />
        <Lighting timeOfDay={timeOfDay} />
        <Ground />
        <RoadMarkings />
        <PerimeterWalls />
        <Landscaping />
        <StreetLights />
        <Gates
          isEntryOpen={entryGateOpen}
          isExitOpen={exitGateOpen}
          activeEntryPlate={entryGateOpen ? (entryAnimationData?.plateNumber || 'INCOMING') : undefined}
          activeEntrySlot={undefined}
          activeExitPlate={exitGateOpen ? activePlate : undefined}
          exitFee={exitGateOpen ? 10 : undefined}
          isExitPaid={exitGateOpen}
        />
        <CCTVPosts />
        <ParkingSlotsGroup onSlotSelect={onSlotSelect} />
        <ParkedVehicles onVehicleClick={onSlotSelect} />
        {cameraId === 'CAM_01' && entryAnimationData && (
          <EnteringVehicleAnimation
            animationData={{ ...entryAnimationData, onComplete: () => undefined }}
          />
        )}
        {cameraId === 'CAM_03' && exitingAnimationData && (
          <ExitingVehicleAnimation
            animationData={{
              ...exitingAnimationData,
              onBarrierOpen: () => undefined,
              onBarrierClose: () => undefined,
              onComplete: () => undefined,
              onArriveAtPayment: () => undefined,
            }}
          />
        )}
        <SlotFloatingBadge />
      </Canvas>

      {/* CCTV HUD Watermark & In-Photo Real-time Indicators */}
      {showOverlay && (
        <>
          {/* Top Left Camera Identifier */}
          <div className="absolute top-2 left-2 z-10 flex items-center space-x-1.5 font-mono text-[11px] pointer-events-none select-none">
            <span className="bg-red-600 text-white font-bold px-2 py-0.5 rounded flex items-center space-x-1 shadow">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              <span>REC</span>
            </span>
            <span className="bg-slate-900/90 text-slate-100 px-2 py-0.5 rounded border border-slate-700 font-bold shadow">
              {cameraId === 'CAM_01' && 'CAM 01 • ENTRY GATE (WEST)'}
              {cameraId === 'CAM_02' && 'CAM 02 • PARKING 3D TWIN (20 BAYS)'}
              {cameraId === 'CAM_03' && 'CAM 03 • EXIT GATE (EAST)'}
              {cameraId === 'CAM_04' && 'CAM 04 • NORTH ZONE (P01-P10)'}
              {cameraId === 'CAM_05' && 'CAM 05 • SOUTH ZONE (P11-P20)'}
            </span>
          </div>

          {/* Top Right Live Time / Status */}
          <div className="absolute top-2 right-2 z-10 font-mono text-[10px] text-slate-200 bg-slate-900/90 px-2 py-0.5 rounded border border-slate-700 pointer-events-none select-none shadow">
            {new Date().toISOString().replace('T', ' ').substring(0, 19)} UTC
          </div>



          {/* CAM 02 (Parking 3D Twin) In-Photo HUD Understanding */}
          {cameraId === 'CAM_02' && (
            <>
              {/* Prominent Occupancy Pill right inside photo */}
              <div className="absolute top-10 inset-x-6 z-10 flex justify-center pointer-events-none">
                <div className="bg-slate-900/95 border border-slate-700 rounded-xl px-4 py-1.5 shadow-2xl backdrop-blur-sm flex items-center space-x-4 font-mono text-xs">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-red-400 font-bold">{occupiedCount} OCCUPIED</span>
                  </div>
                  <span className="text-slate-600">|</span>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="text-emerald-400 font-bold">{availableCount} AVAILABLE</span>
                  </div>
                  <span className="text-slate-600">|</span>
                  <span className="text-blue-400 font-semibold">{occupancyPercent}% FULL</span>
                </div>
              </div>
            </>
          )}



          {/* Bottom HUD Banner */}
          <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center justify-between font-mono text-[10px] pointer-events-none select-none">
            <div className="bg-slate-950/90 text-emerald-400 border border-slate-800 px-2 py-0.5 rounded shadow">
              STATUS: ONLINE • 1080P 60FPS
            </div>

            {cameraId === 'CAM_01' && (
              <div className="bg-slate-950/90 text-emerald-300 border border-slate-800 px-2 py-0.5 rounded shadow font-semibold">
                INGRESS GATE: OPEN
              </div>
            )}
            {cameraId === 'CAM_02' && (
              <div className="bg-slate-950/90 text-blue-300 border border-slate-800 px-2 py-0.5 rounded shadow font-semibold">
                ALL 20 BAYS (P01–P20) IN SYNC
              </div>
            )}
            {cameraId === 'CAM_03' && (
              <div className="bg-slate-950/90 text-emerald-300 border border-slate-800 px-2 py-0.5 rounded shadow font-semibold">
                EGRESS GATE: RELEASED
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
