import React from 'react';
import { Lighting } from './Lighting';
import { Ground } from './Ground';
import { PerimeterWalls } from './PerimeterWalls';
import { Landscaping } from './Trees';
import { StreetLights } from './StreetLights';
import { Gates } from './Gates';
import { CCTVPosts } from './CCTVPosts';
import { RoadMarkings } from './RoadMarkings';
import { ParkingSlotsGroup } from './ParkingSlotsGroup';
import { ParkedVehicles } from './ParkedVehicles';
import { SlotFloatingBadge } from './SlotFloatingBadge';
import { EnteringVehicleAnimation } from './EnteringVehicleAnimation';
import type { EntryAnimationData } from './EnteringVehicleAnimation';
import { ExitingVehicleAnimation } from './ExitingVehicleAnimation';
import type { ExitAnimationData } from './ExitingVehicleAnimation';
import { GroundTrajectoryPath } from './GroundTrajectoryPath';

interface ParkingSceneProps {
  isEntryGateOpen?: boolean;
  isExitGateOpen?: boolean;
  timeOfDay?: 'DAY' | 'NIGHT';
  onSelectCamera?: (cameraId: string, name?: string, direction?: string) => void;
  onSlotSelect?: (slotId: string) => void;
  entryAnimationData?: EntryAnimationData | null;
  exitingAnimationData?: ExitAnimationData | null;
  activeEntryPlate?: string;
  activeEntrySlot?: string;
  activeExitPlate?: string;
  exitFee?: number;
  isExitPaid?: boolean;
  children?: React.ReactNode;
}

export const ParkingScene: React.FC<ParkingSceneProps> = ({
  isEntryGateOpen = false,
  isExitGateOpen = false,
  timeOfDay = 'DAY',
  onSelectCamera,
  onSlotSelect,
  entryAnimationData = null,
  exitingAnimationData = null,
  activeEntryPlate,
  activeEntrySlot,
  activeExitPlate,
  exitFee = 50,
  isExitPaid = true,
  children,
}) => {
  return (
    <group>
      {/* Dynamic Lighting & Atmospheric Highlights */}
      <Lighting timeOfDay={timeOfDay} />

      {/* 3D Physical Ground, Curbs, and Perimeter Verges */}
      <Ground />

      {/* Road Stencils, Stop Lines, Direction Arrows, Zebra Crossing */}
      <RoadMarkings />

      {/* Concrete Boundary Walls and Pillars */}
      <PerimeterWalls />

      {/* Surrounding Foliage, Trees and Landscaping Bushes */}
      <Landscaping />

      {/* Street Lamps along driving aisle */}
      <StreetLights />

      {/* Entry and Exit Guard Cabins with Overhead LED Signage, Barrier Arms & Bollards */}
      <Gates
        isEntryOpen={isEntryGateOpen}
        isExitOpen={isExitGateOpen}
        activeEntryPlate={activeEntryPlate || entryAnimationData?.plateNumber}
        activeEntrySlot={activeEntrySlot || entryAnimationData?.targetSlotId}
        activeExitPlate={activeExitPlate || exitingAnimationData?.plateNumber}
        exitFee={exitFee}
        isExitPaid={isExitPaid}
      />

      {/* CCTV Camera Posts (CAM 01, CAM 02, CAM 03) */}
      <CCTVPosts onSelectCamera={onSelectCamera} />

      {/* 20 Calibrated 3D Parking Slots (P01 - P20) */}
      <ParkingSlotsGroup onSlotSelect={onSlotSelect} />

      {/* Realistic 3D Parked Vehicles & Arriving Vehicle (Duplicate-Protected) */}
      <ParkedVehicles
        onVehicleClick={onSlotSelect}
        animatingSlotId={entryAnimationData?.targetSlotId || exitingAnimationData?.sourceSlotId}
      />

      {/* Floating 3D HUD Badge on Selected Slot */}
      <SlotFloatingBadge />

      {/* Dijkstra Spatial Allocation 3D Trajectory Ribbon */}
      <GroundTrajectoryPath
        targetSlotId={entryAnimationData?.targetSlotId}
        targetPosition={entryAnimationData?.targetPosition}
        visible={Boolean(entryAnimationData)}
      />

      {/* Dynamic Entering Vehicle Driving Animation */}
      <EnteringVehicleAnimation animationData={entryAnimationData} />

      {/* Dynamic Exiting Vehicle Driving Animation */}
      <ExitingVehicleAnimation animationData={exitingAnimationData} />

      {/* Additional dynamic overlays */}
      {children}
    </group>
  );
};
