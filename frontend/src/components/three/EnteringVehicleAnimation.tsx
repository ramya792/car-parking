import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { CarModel } from './CarModel';

export interface EntryAnimationData {
  plateNumber: string;
  vehicleType: 'SEDAN' | 'SUV' | 'HATCHBACK';
  color: string;
  targetSlotId: string;
  targetPosition: [number, number, number];
  targetRotation: [number, number, number];
  onComplete: () => void;
}

type EntryHudPhase = 'INGESTION' | 'ANPR' | 'GATE' | 'ROUTING';

export const EnteringVehicleAnimation: React.FC<{
  animationData: EntryAnimationData | null;
}> = ({ animationData }) => {
  const groupRef = useRef<THREE.Group>(null);
  const waypoints = useRef<THREE.Vector3[]>([]);
  const currentWaypointIndex = useRef(0);

  const [hudPhase, setHudPhase] = useState<EntryHudPhase>('INGESTION');
  const phaseRef = useRef<EntryHudPhase>('INGESTION');

  useEffect(() => {
    if (!animationData) {
      currentWaypointIndex.current = 0;
      phaseRef.current = 'INGESTION';
      setHudPhase('INGESTION');
      return;
    }

    const [tx, ty, tz] = animationData.targetPosition;
    const isTopRow = tz < 0;
    const ingressLaneZ = 1.8;

    const pts: THREE.Vector3[] = [
      new THREE.Vector3(-40.0, ty, ingressLaneZ),
      new THREE.Vector3(-31.0, ty, ingressLaneZ),
      new THREE.Vector3(-24.5, ty, ingressLaneZ),
      new THREE.Vector3(-20.2, ty, ingressLaneZ),
      new THREE.Vector3(-16.0, ty, ingressLaneZ),
    ];

    if (tx > -10.0) {
      pts.push(new THREE.Vector3(-8.0, ty, ingressLaneZ));
    }
    if (tx > 0.0) {
      pts.push(new THREE.Vector3(Math.min(tx - 3.5, 0.0), ty, ingressLaneZ));
    }

    // Decelerate and turn squarely into parking bay
    pts.push(
      new THREE.Vector3(Math.max(tx - 2.5, -16.0), ty, ingressLaneZ),
      new THREE.Vector3(tx, ty, isTopRow ? 0.0 : 2.5),
      new THREE.Vector3(tx, ty, tz)
    );

    waypoints.current = pts;

    if (groupRef.current) {
      groupRef.current.position.copy(waypoints.current[0]);
      groupRef.current.rotation.set(0, Math.PI / 2, 0); // Face East down the roadway
    }

    currentWaypointIndex.current = 1;
    phaseRef.current = 'INGESTION';
    setHudPhase('INGESTION');
  }, [Boolean(animationData), animationData?.targetSlotId, animationData?.plateNumber]);

  useFrame((_, delta) => {
    if (!animationData || !groupRef.current || waypoints.current.length === 0) return;

    const targetPt = waypoints.current[currentWaypointIndex.current];
    if (!targetPt) return;

    const currentPos = groupRef.current.position;

    // Determine current HUD telemetry phase
    let nextPhase: EntryHudPhase = 'INGESTION';
    if (currentPos.x >= -23.5 && currentPos.x < -16.8) {
      nextPhase = 'ANPR';
    } else if (currentPos.x >= -16.8 && currentPos.x < -12.0) {
      nextPhase = 'GATE';
    } else if (currentPos.x >= -12.0) {
      nextPhase = 'ROUTING';
    }

    if (nextPhase !== phaseRef.current) {
      phaseRef.current = nextPhase;
      setHudPhase(nextPhase);
    }

    // Traffic Rule: Cruise on outside highway, decelerate at gate & zebra crossing, slow crawl into bay
    let baseSpeed = 8.5;
    if (currentPos.x >= -22.0 && currentPos.x <= -15.0) {
      baseSpeed = 5.5; // Controlled speed through gate barrier zone (Speed limit 10 km/h)
    } else if (currentWaypointIndex.current >= waypoints.current.length - 2) {
      baseSpeed = 4.2; // Slow precision parking maneuver into bay
    }
    const speed = baseSpeed * delta;

    // Move towards current waypoint
    const dir = new THREE.Vector3().subVectors(targetPt, currentPos);
    const dist = dir.length();

    if (dist < speed) {
      currentPos.copy(targetPt);
      if (currentWaypointIndex.current < waypoints.current.length - 1) {
        currentWaypointIndex.current += 1;
      } else {
        // Reached final destination deep in slot
        animationData.onComplete();
      }
    } else {
      dir.normalize();
      currentPos.addScaledVector(dir, speed);

      // Smoothly rotate car facing movement direction
      const angle = Math.atan2(dir.x, dir.z);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        angle,
        Math.min(delta * 8.5, 1.0)
      );
    }
  });

  if (!animationData) return null;

  return (
    <group ref={groupRef}>
      <CarModel
        color={animationData.color}
        type={animationData.vehicleType}
        plateNumber={animationData.plateNumber}
        headlightsOn={true}
        scale={0.96}
      />

      {/* Floating 3D Telemetry HUD over the moving car */}
      <Html center position={[0, 2.4, 0]} distanceFactor={22} zIndexRange={[120, 0]}>
        <div className="pointer-events-none select-none transition-all">
          <div className="bg-black/95 border-2 border-yellow-400 px-3 py-1 rounded-lg shadow-[0_0_18px_rgba(250,204,21,0.65)] text-yellow-300 font-mono text-sm font-black tracking-wider whitespace-nowrap text-center mb-1">
            {animationData.plateNumber}
          </div>

          {hudPhase === 'INGESTION' && (
            <div className="bg-slate-950/95 border border-cyan-500/80 px-2.5 py-1 rounded-xl shadow-2xl backdrop-blur-md flex items-center space-x-2 text-white font-mono text-[10px] whitespace-nowrap animate-pulse">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>1. OPTICAL INGESTION • 60 FPS</span>
            </div>
          )}

          {hudPhase === 'ANPR' && (
            <div className="bg-slate-950/95 border-2 border-yellow-400/90 px-3 py-1.5 rounded-xl shadow-[0_0_20px_rgba(250,204,21,0.6)] backdrop-blur-md flex flex-col items-center text-white font-mono text-[10px] whitespace-nowrap animate-bounce">
              <div className="flex items-center space-x-1.5 text-yellow-300 font-bold text-[9px]">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping" />
                <span>2. NEURAL OCR (99.52% CONF)</span>
              </div>
              <div className="text-[8px] text-slate-300 mt-0.5">
                FASTAG: AUTH • BLUE SEDAN
              </div>
            </div>
          )}

          {hudPhase === 'GATE' && (
            <div className="bg-slate-950/95 border border-emerald-400 px-3 py-1 rounded-xl shadow-2xl backdrop-blur-md flex items-center space-x-2 text-white font-mono text-[10px] whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-emerald-300">
                3. PLC MODBUS: BARRIER 90° RAISED
              </span>
            </div>
          )}

          {hudPhase === 'ROUTING' && (
            <div className="bg-slate-950/95 border border-cyan-400/80 px-3 py-1.5 rounded-xl shadow-2xl backdrop-blur-md flex flex-col items-center text-white font-mono text-[10px] whitespace-nowrap">
              <div className="flex items-center space-x-1.5 text-cyan-300 font-bold text-[9px]">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span>4. DIJKSTRA GUIDANCE</span>
              </div>
              <span className="text-white font-bold mt-0.5">
                Target Bay: <strong className="text-emerald-400">{animationData.targetSlotId}</strong>
              </span>
            </div>
          )}
        </div>
      </Html>
    </group>
  );
};
