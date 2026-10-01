import React from 'react';
import { ParkingSlot } from './ParkingSlot';
import { useParkingStore } from '../../store/parkingStore';

interface ParkingSlotsGroupProps {
  onSlotSelect?: (slotId: string) => void;
}

export const ParkingSlotsGroup: React.FC<ParkingSlotsGroupProps> = ({ onSlotSelect }) => {
  const { slots, selectedSlotId, selectSlot } = useParkingStore();

  const handleSelect = (id: string) => {
    selectSlot(id);
    onSlotSelect?.(id);
  };

  return (
    <group>
      {slots.map((slot) => (
        <ParkingSlot
          key={slot.id}
          slot={slot}
          isSelected={selectedSlotId === slot.id}
          onSelect={handleSelect}
        />
      ))}
    </group>
  );
};
