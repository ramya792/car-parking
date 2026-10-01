import React from 'react';
import { CarModel } from './CarModel';
import { useParkingStore } from '../../store/parkingStore';

interface ParkedVehiclesProps {
  onVehicleClick?: (slotId: string) => void;
  animatingSlotId?: string | null;
}

export const ParkedVehicles: React.FC<ParkedVehiclesProps> = ({ onVehicleClick, animatingSlotId }) => {
  const { slots } = useParkingStore();

  return (
    <group>
      {/* Parked Cars in Occupied Slots */}
      {slots.map((slot) => {
        if (slot.status !== 'OCCUPIED' || !slot.currentVehicle) {
          return null;
        }

        // Prevent duplicate overlapping cars while a vehicle is actively driving into or out of this slot
        if (animatingSlotId && slot.id === animatingSlotId) {
          return null;
        }

        const vehicle = slot.currentVehicle;

        return (
          <group
            key={`vehicle-${slot.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onVehicleClick?.(slot.id);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              document.body.style.cursor = 'auto';
            }}
          >
            <CarModel
              color={vehicle.color}
              type={vehicle.vehicleType}
              plateNumber={vehicle.plateNumber}
              position={slot.position}
              rotation={slot.rotation}
              headlightsOn={false}
              scale={0.96}
            />
          </group>
        );
      })}
    </group>
  );
};
