import React, { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useParkingStore } from '../../store/parkingStore';

export type CameraPreset =
  | 'DEFAULT'
  | 'TOP'
  | 'NORTH'
  | 'SOUTH'
  | 'EAST'
  | 'WEST'
  | 'ISOMETRIC'
  | 'ENTRY_GATE'
  | 'EXIT_GATE';

interface CameraRigProps {
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  cameraPreset: CameraPreset;
  onPresetChange?: (preset: CameraPreset) => void;
}

export const CameraRig: React.FC<CameraRigProps> = ({
  controlsRef,
  cameraPreset,
  onPresetChange,
}) => {
  const { camera } = useThree();
  const { slots, selectedSlotId, selectSlot } = useParkingStore();

  const desiredCamPos = useRef(new THREE.Vector3(0, 24, 26));
  const desiredTarget = useRef(new THREE.Vector3(0, 0, 0));
  const isTransitioning = useRef(true);

  // Keyboard Navigation & Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === 'Escape') {
        selectSlot(null);
        onPresetChange?.('DEFAULT');
      } else if (e.key === 'r' || e.key === 'R') {
        selectSlot(null);
        onPresetChange?.('DEFAULT');
      } else if (e.key === 't' || e.key === 'T') {
        selectSlot(null);
        onPresetChange?.('TOP');
      } else if (e.key === 'n' || e.key === 'N') {
        selectSlot(null);
        onPresetChange?.('NORTH');
      } else if (e.key === 's' || e.key === 'S') {
        selectSlot(null);
        onPresetChange?.('SOUTH');
      } else if (e.key === 'e' || e.key === 'E') {
        selectSlot(null);
        onPresetChange?.('EAST');
      } else if (e.key === 'w' || e.key === 'W') {
        selectSlot(null);
        onPresetChange?.('WEST');
      } else if (e.key === 'i' || e.key === 'I') {
        selectSlot(null);
        onPresetChange?.('ISOMETRIC');
      } else if (e.key === '1') {
        selectSlot(null);
        onPresetChange?.('WEST');
      } else if (e.key === '2') {
        selectSlot(null);
        onPresetChange?.('EAST');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectSlot, onPresetChange]);

  // Compute desired camera and target coordinates
  useEffect(() => {
    isTransitioning.current = true;

    if (selectedSlotId) {
      const slot = slots.find((s) => s.id === selectedSlotId);
      if (slot) {
        const [x, , z] = slot.position;
        const isTop = slot.row === 'TOP';
        // Position camera angled in front of the slot
        const camZOffset = isTop ? 10.5 : -10.5;
        desiredCamPos.current.set(x, 9.5, z + camZOffset);
        desiredTarget.current.set(x, 0.5, z);
        return;
      }
    }

    // Dedicated CCTV Camera Perspectives (Framing ONLY that specific camera location)
    switch (cameraPreset) {
      case 'TOP':
        // CAM 02: Overhead Master Perception Camera looking down at all 20 bays
        desiredCamPos.current.set(0, 32, 0.1);
        desiredTarget.current.set(0, 0, 0);
        break;
      case 'NORTH':
        // CAM 04: North Wing CCTV Camera - Frames ONLY North bays (P01 to P10)
        desiredCamPos.current.set(0, 20, 25);
        desiredTarget.current.set(0, 0.5, -6.2);
        break;
      case 'SOUTH':
        // CAM 05: South Wing CCTV Camera - Frames ONLY South bays (P11 to P20)
        desiredCamPos.current.set(0, 9.8, 1.8);
        desiredTarget.current.set(0, 0.5, 8.2);
        break;
      case 'EAST':
      case 'EXIT_GATE':
        // CAM 03: East Exit Gate CCTV Camera - Frames ONLY East Exit Gate & Barrier (Unobstructed Pole View)
        desiredCamPos.current.set(24.0, 7.2, -6.5);
        desiredTarget.current.set(16.5, 1.0, -1.8);
        break;
      case 'WEST':
      case 'ENTRY_GATE':
        // CAM 01: West Entrance Gate CCTV Camera - Frames ONLY West Entry Gate & Barrier (Unobstructed Pole View)
        desiredCamPos.current.set(-24.0, 7.2, 6.5);
        desiredTarget.current.set(-16.5, 1.0, 1.8);
        break;
      case 'ISOMETRIC':
        desiredCamPos.current.set(-24, 22, 22);
        desiredTarget.current.set(0, 0, 0);
        break;
      case 'DEFAULT':
      default:
        // Full Facility 3D Digital Twin View
        desiredCamPos.current.set(0, 24, 26);
        desiredTarget.current.set(0, 0, 0);
        break;
    }
  }, [selectedSlotId, cameraPreset, slots]);

  // Smooth lerp frame by frame
  useFrame((_, delta) => {
    if (!isTransitioning.current || !controlsRef.current) return;

    const lerpSpeed = Math.min(delta * 5.0, 1.0);

    camera.position.lerp(desiredCamPos.current, lerpSpeed);
    controlsRef.current.target.lerp(desiredTarget.current, lerpSpeed);
    controlsRef.current.update();

    // Stop lerping when close enough to save calculations
    const distCam = camera.position.distanceTo(desiredCamPos.current);
    const distTarget = controlsRef.current.target.distanceTo(desiredTarget.current);

    if (distCam < 0.08 && distTarget < 0.08) {
      camera.position.copy(desiredCamPos.current);
      controlsRef.current.target.copy(desiredTarget.current);
      controlsRef.current.update();
      isTransitioning.current = false;
    }
  });

  return null;
};
