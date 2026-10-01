import React, { useState } from 'react';
import { Text } from '@react-three/drei';
import type { ParkingSlot as ParkingSlotType } from '../../types/parking';

interface ParkingSlotProps {
  slot: ParkingSlotType;
  isSelected?: boolean;
  onSelect?: (slotId: string) => void;
}

export const ParkingSlot: React.FC<ParkingSlotProps> = ({
  slot,
  isSelected = false,
  onSelect,
}) => {
  const [hovered, setHovered] = useState(false);

  // Status Colors
  const getColor = () => {
    switch (slot.status) {
      case 'AVAILABLE':
        return '#10b981'; // Vivid Green
      case 'OCCUPIED':
        return '#ef4444'; // Vivid Red
      case 'RESERVED':
        return '#f59e0b'; // Amber / Yellow
      default:
        return '#3b82f6';
    }
  };

  const statusColor = getColor();
  const isTopRow = slot.row === 'TOP';
  const width = 2.8;
  const depth = 5.2;
  const halfW = width / 2;
  const halfD = depth / 2;

  // The slot opens towards Z=0 (the central driving aisle).
  // For TOP row (Z = -6.2), the entrance is at +halfD (facing south towards Z=0). Back is at -halfD.
  // For BOTTOM row (Z = 6.2), the entrance is at -halfD (facing north towards Z=0). Back is at +halfD.
  const backZ = isTopRow ? -halfD : halfD;
  const entryZ = isTopRow ? halfD : -halfD;
  const wheelStopZ = isTopRow ? -halfD + 0.4 : halfD - 0.4;
  const labelZ = isTopRow ? halfD - 0.7 : -halfD + 0.7;

  return (
    <group
      position={slot.position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(slot.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      {/* Parking Slot Ground Bed */}
      <mesh
        position={[0, 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[width - 0.1, depth - 0.1]} />
        <meshStandardMaterial
          color={hovered || isSelected ? '#1e293b' : '#141b26'}
          roughness={0.7}
        />
      </mesh>

      {/* Faint ground illumination glow underneath */}
      <mesh
        position={[0, 0.015, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[width, depth]} />
        <meshBasicMaterial
          color={statusColor}
          transparent
          opacity={isSelected ? 0.25 : hovered ? 0.18 : 0.08}
        />
      </mesh>

      {/* 3D Illuminated Glowing Border (Left, Back, Right) */}
      {/* Left glowing border bar */}
      <mesh
        position={[-halfW, 0.03, 0]}
        castShadow={false}
      >
        <boxGeometry args={[0.08, 0.04, depth]} />
        <meshStandardMaterial
          color={statusColor}
          emissive={statusColor}
          emissiveIntensity={isSelected ? 3.5 : hovered ? 2.8 : 2.0}
          toneMapped={false}
        />
      </mesh>

      {/* Right glowing border bar */}
      <mesh
        position={[halfW, 0.03, 0]}
        castShadow={false}
      >
        <boxGeometry args={[0.08, 0.04, depth]} />
        <meshStandardMaterial
          color={statusColor}
          emissive={statusColor}
          emissiveIntensity={isSelected ? 3.5 : hovered ? 2.8 : 2.0}
          toneMapped={false}
        />
      </mesh>

      {/* Back glowing border bar */}
      <mesh
        position={[0, 0.03, backZ]}
        castShadow={false}
      >
        <boxGeometry args={[width + 0.08, 0.04, 0.08]} />
        <meshStandardMaterial
          color={statusColor}
          emissive={statusColor}
          emissiveIntensity={isSelected ? 3.5 : hovered ? 2.8 : 2.0}
          toneMapped={false}
        />
      </mesh>

      {/* Entrance Corner L-Marks */}
      <mesh position={[-halfW + 0.2, 0.025, entryZ]}>
        <boxGeometry args={[0.4, 0.02, 0.06]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.7} />
      </mesh>
      <mesh position={[halfW - 0.2, 0.025, entryZ]}>
        <boxGeometry args={[0.4, 0.02, 0.06]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.7} />
      </mesh>

      {/* Wheel Stop Concrete Bumper */}
      <group position={[0, 0, wheelStopZ]}>
        <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.0, 0.14, 0.22]} />
          <meshStandardMaterial color="#475569" roughness={0.6} />
        </mesh>
        {/* Yellow reflective warning stripes on bumper */}
        {[-0.6, 0, 0.6].map((stripeX, sIdx) => (
          <mesh key={`bumper-stripe-${sIdx}`} position={[stripeX, 0.082, 0]}>
            <boxGeometry args={[0.25, 0.145, 0.225]} />
            <meshStandardMaterial color="#eab308" roughness={0.4} />
          </mesh>
        ))}
      </group>

      {/* Slot ID Label Printed on Ground */}
      <Text
        position={[0, 0.03, labelZ]}
        rotation={[-Math.PI / 2, 0, isTopRow ? 0 : Math.PI]}
        fontSize={0.42}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
        letterSpacing={0.05}
      >
        {slot.id}
      </Text>

      {/* Pulsing Selection Ring when clicked */}
      {isSelected && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[width + 0.3, depth + 0.3]} />
          <meshBasicMaterial
            color="#38bdf8"
            wireframe
            transparent
            opacity={0.8}
          />
        </mesh>
      )}
    </group>
  );
};
