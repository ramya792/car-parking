import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { CarModel } from './CarModel';

export interface ExitAnimationData {
  plateNumber: string;
  vehicleType: 'SEDAN' | 'SUV' | 'HATCHBACK';
  color: string;
  sourceSlotId: string;
  sourcePosition: [number, number, number];
  sourceRotation: [number, number, number];
  waitForPayment?: boolean;
  isPaid?: boolean;
  onArriveAtPayment?: () => void;
  onBarrierOpen?: () => void;
  onBarrierClose?: () => void;
  onComplete: () => void;
}

type ExitHudPhase = 'DEPARTING' | 'PAYMENT' | 'CLEARED';

export const ExitingVehicleAnimation: React.FC<{
  animationData: ExitAnimationData | null;
}> = ({ animationData }) => {
  const groupRef = useRef<THREE.Group>(null);
  const waypoints = useRef<THREE.Vector3[]>([]);
  const currentWaypointIndex = useRef(0);
  const barrierTriggered = useRef(false);
  const paymentArriveTriggered = useRef(false);

  const [hudPhase, setHudPhase] = useState<ExitHudPhase>('DEPARTING');
  const phaseRef = useRef<ExitHudPhase>('DEPARTING');

  useEffect(() => {
    if (!animationData) {
      currentWaypointIndex.current = 0;
      barrierTriggered.current = false;
      paymentArriveTriggered.current = false;
      phaseRef.current = 'DEPARTING';
      setHudPhase('DEPARTING');
      return;
    }

    const [sx, sy, sz] = animationData.sourcePosition;
    const isTopRow = sz < 0;
    const exitLaneZ = -1.8;

    const pts: THREE.Vector3[] = [
      new THREE.Vector3(sx, sy, sz),
      new THREE.Vector3(sx, sy, isTopRow ? sz + 3.2 : sz - 3.2), // Pull forward out of bay into aisle
      new THREE.Vector3(sx + 2.2, sy, exitLaneZ),                  // Turn into North egress lane
    ];

    if (sx < 8.0) {
      pts.push(new THREE.Vector3(Math.max(sx + 4.5, 9.0), sy, exitLaneZ));
    }

    pts.push(
      new THREE.Vector3(16.5, sy, exitLaneZ), // Stop line at exit barrier
      new THREE.Vector3(20.0, sy, exitLaneZ), // Clearing gate barrier
      new THREE.Vector3(26.5, sy, exitLaneZ), // Through perimeter gateway
      new THREE.Vector3(34.0, sy, exitLaneZ), // Along external departure road
      new THREE.Vector3(42.0, sy, exitLaneZ)  // Continues onto open highway
    );

    waypoints.current = pts;

    if (groupRef.current) {
      groupRef.current.position.copy(waypoints.current[0]);
      const initYaw = isTopRow ? 0 : Math.PI;
      groupRef.current.rotation.set(0, initYaw, 0);
    }

    currentWaypointIndex.current = 1;
    barrierTriggered.current = false;
    paymentArriveTriggered.current = false;
    phaseRef.current = 'DEPARTING';
    setHudPhase('DEPARTING');
  }, [Boolean(animationData), animationData?.sourceSlotId, animationData?.plateNumber]);

  useFrame((_, delta) => {
    if (!animationData || !groupRef.current || waypoints.current.length === 0) return;

    const targetPt = waypoints.current[currentWaypointIndex.current];
    if (!targetPt) return;

    const currentPos = groupRef.current.position;

    // Traffic rules speed regulation
    let baseSpeed = 8.5;
    if (currentWaypointIndex.current <= 1) {
      baseSpeed = 4.2; // Slow cautious pull-out from bay
    } else if (currentPos.x >= 14.0 && currentPos.x <= 20.0) {
      baseSpeed = 5.5; // Controlled speed at exit barrier zone
    }
    const speed = baseSpeed * delta;

    // Check payment gate stopping behavior
    const isAtPaymentPoint = Math.abs(targetPt.x - 16.5) < 0.2;
    if (animationData.waitForPayment) {
      if (isAtPaymentPoint && currentPos.distanceTo(targetPt) < 0.45) {
        if (!paymentArriveTriggered.current) {
          paymentArriveTriggered.current = true;
          animationData.onArriveAtPayment?.();
        }

        phaseRef.current = 'PAYMENT';
        setHudPhase('PAYMENT');

        // If payment is not yet verified, wait here with barrier closed!
        if (!animationData.isPaid) {
          return;
        }

        // Only after payment is verified: open barrier and proceed!
        if (!barrierTriggered.current) {
          barrierTriggered.current = true;
          animationData.onBarrierOpen?.();
        }

        phaseRef.current = 'CLEARED';
        setHudPhase('CLEARED');
      }
    } else {
      if (currentPos.x >= 15.2 && !barrierTriggered.current) {
        barrierTriggered.current = true;
        animationData.onBarrierOpen?.();
      }
      if (currentPos.x >= 18.0) {
        phaseRef.current = 'CLEARED';
        setHudPhase('CLEARED');
      }
    }

    // Move towards target waypoint
    const dir = new THREE.Vector3().subVectors(targetPt, currentPos);
    const dist = dir.length();

    if (dist < speed) {
      currentPos.copy(targetPt);
      if (currentWaypointIndex.current < waypoints.current.length - 1) {
        currentWaypointIndex.current += 1;
      } else {
        // Departed facility
        animationData.onBarrierClose?.();
        animationData.onComplete();
      }
    } else {
      dir.normalize();
      currentPos.addScaledVector(dir, speed);

      // Smooth yaw rotation facing movement direction
      const angle = Math.atan2(dir.x, dir.z);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        angle,
        Math.min(delta * 7.5, 1.0)
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

      {/* Floating 3D Telemetry HUD over exiting vehicle */}
      <Html center position={[0, 2.4, 0]} distanceFactor={22} zIndexRange={[120, 0]}>
        <div className="pointer-events-none select-none transition-all">
          {hudPhase === 'DEPARTING' && (
            <div className="bg-slate-950/95 border border-amber-400/80 px-2.5 py-1 rounded-xl shadow-2xl backdrop-blur-md flex items-center space-x-2 text-white font-mono text-[10px] whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>6. DEPARTING BAY ➔ EAST EXIT GATE</span>
            </div>
          )}

          {hudPhase === 'PAYMENT' && (
            <div className="bg-slate-950/95 border-2 border-emerald-400 px-3 py-1.5 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.5)] backdrop-blur-md flex flex-col items-center text-white font-mono text-[10px] whitespace-nowrap animate-bounce">
              <div className="flex items-center space-x-1.5 text-emerald-300 font-bold text-[9px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>7. TARIFF STOP LINE</span>
              </div>
              <div className="text-xs font-black text-amber-400 mt-0.5">
                DUE: ₹50.00 • AWAITING PAYMENT
              </div>
            </div>
          )}

          {hudPhase === 'CLEARED' && (
            <div className="bg-slate-950/95 border border-emerald-400 px-3 py-1 rounded-xl shadow-2xl backdrop-blur-md flex items-center space-x-2 text-white font-mono text-[10px] whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-bold text-emerald-300">
                8. MODBUS 0x01: CLEARED ➔ HIGHWAY
              </span>
            </div>
          )}
        </div>
      </Html>
    </group>
  );
};
