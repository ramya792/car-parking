import React from 'react';
import { Text } from '@react-three/drei';

export interface CarModelProps {
  color?: string;
  type?: 'CAR' | 'SEDAN' | 'SUV' | 'HATCHBACK';
  plateNumber?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  headlightsOn?: boolean;
  scale?: number;
}

export const CarModel: React.FC<CarModelProps> = ({
  color = '#2563eb',
  type = 'SEDAN',
  plateNumber,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  headlightsOn = true,
  scale = 1,
}) => {
  const isSUV = type === 'SUV';
  const isHatchback = type === 'HATCHBACK';

  const bodyHeight = isSUV ? 0.8 : 0.65;
  const cabinHeight = isSUV ? 0.75 : 0.6;
  const cabinLength = isHatchback ? 2.3 : isSUV ? 2.5 : 2.2;
  const cabinZ = isHatchback ? -0.2 : isSUV ? -0.1 : 0;

  return (
    <group position={position} rotation={rotation} scale={[scale, scale, scale]}>
      {/* Soft Contact Shadow beneath the vehicle */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.5, 4.8]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.6} />
      </mesh>

      {/* Main Lower Chassis / Body */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.9, bodyHeight, 4.3]} />
        <meshStandardMaterial
          color={color}
          metalness={0.7}
          roughness={0.25}
        />
      </mesh>

      {/* Front Hood Bevel Curve */}
      <mesh position={[0, 0.55, 1.4]} rotation={[0.12, 0, 0]} castShadow>
        <boxGeometry args={[1.82, 0.35, 1.3]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.25} />
      </mesh>

      {/* Front Radiator Grille */}
      <mesh position={[0, 0.4, 2.16]} castShadow>
        <boxGeometry args={[1.2, 0.28, 0.04]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </mesh>

      {/* Cabin / Roof Structure */}
      <mesh position={[0, 0.85 + cabinHeight / 2, cabinZ]} castShadow>
        <boxGeometry args={[1.65, cabinHeight, cabinLength]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.25} />
      </mesh>

      {/* Front Windshield (Angled Glass) */}
      <mesh
        position={[0, 0.95, isHatchback ? 1.05 : 1.15]}
        rotation={[-0.45, 0, 0]}
      >
        <planeGeometry args={[1.55, 0.8]} />
        <meshPhysicalMaterial
          color="#0f172a"
          roughness={0.05}
          metalness={0.9}
          transmission={0.4}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Rear Window (Angled Glass) */}
      <mesh
        position={[0, 0.95, isHatchback ? -1.35 : -1.25]}
        rotation={[isHatchback ? 0.55 : 0.42, Math.PI, 0]}
      >
        <planeGeometry args={[1.5, 0.75]} />
        <meshPhysicalMaterial
          color="#0f172a"
          roughness={0.05}
          metalness={0.9}
          transmission={0.4}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Side Windows (Left & Right) */}
      <mesh position={[-0.83, 1.05, cabinZ]}>
        <boxGeometry args={[0.02, 0.45, cabinLength - 0.2]} />
        <meshPhysicalMaterial
          color="#090d16"
          roughness={0.05}
          metalness={0.8}
          transparent
          opacity={0.9}
        />
      </mesh>
      <mesh position={[0.83, 1.05, cabinZ]}>
        <boxGeometry args={[0.02, 0.45, cabinLength - 0.2]} />
        <meshPhysicalMaterial
          color="#090d16"
          roughness={0.05}
          metalness={0.8}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Side Mirrors */}
      <mesh position={[-0.98, 0.82, 0.8]} castShadow>
        <boxGeometry args={[0.2, 0.12, 0.16]} />
        <meshStandardMaterial color={color} roughness={0.3} />
      </mesh>
      <mesh position={[0.98, 0.82, 0.8]} castShadow>
        <boxGeometry args={[0.2, 0.12, 0.16]} />
        <meshStandardMaterial color={color} roughness={0.3} />
      </mesh>

      {/* Headlights (Front Left & Front Right) */}
      <mesh position={[-0.72, 0.52, 2.16]}>
        <boxGeometry args={[0.38, 0.16, 0.05]} />
        <meshStandardMaterial
          color="#f8fafc"
          emissive="#e0f2fe"
          emissiveIntensity={headlightsOn ? 2.5 : 0.4}
        />
      </mesh>
      <mesh position={[0.72, 0.52, 2.16]}>
        <boxGeometry args={[0.38, 0.16, 0.05]} />
        <meshStandardMaterial
          color="#f8fafc"
          emissive="#e0f2fe"
          emissiveIntensity={headlightsOn ? 2.5 : 0.4}
        />
      </mesh>

      {/* Taillights (Rear Left & Rear Right) */}
      <mesh position={[-0.72, 0.55, -2.16]}>
        <boxGeometry args={[0.42, 0.14, 0.05]} />
        <meshStandardMaterial
          color="#ef4444"
          emissive="#dc2626"
          emissiveIntensity={2.0}
        />
      </mesh>
      <mesh position={[0.72, 0.55, -2.16]}>
        <boxGeometry args={[0.42, 0.14, 0.05]} />
        <meshStandardMaterial
          color="#ef4444"
          emissive="#dc2626"
          emissiveIntensity={2.0}
        />
      </mesh>

      {/* Front Number Plate */}
      <group position={[0, 0.28, 2.17]}>
        <mesh>
          <boxGeometry args={[0.65, 0.16, 0.03]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} />
        </mesh>
        {/* Blue IND strip on left of plate */}
        <mesh position={[-0.28, 0, 0.02]}>
          <boxGeometry args={[0.08, 0.15, 0.01]} />
          <meshBasicMaterial color="#1d4ed8" />
        </mesh>
        {plateNumber && (
          <Text
            position={[0.03, 0, 0.025]}
            fontSize={0.09}
            color="#000000"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            {plateNumber}
          </Text>
        )}
      </group>

      {/* Rear Number Plate */}
      <group position={[0, 0.35, -2.17]} rotation={[0, Math.PI, 0]}>
        <mesh>
          <boxGeometry args={[0.65, 0.16, 0.03]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} />
        </mesh>
        {/* Blue IND strip */}
        <mesh position={[-0.28, 0, 0.02]}>
          <boxGeometry args={[0.08, 0.15, 0.01]} />
          <meshBasicMaterial color="#1d4ed8" />
        </mesh>
        {plateNumber && (
          <Text
            position={[0.03, 0, 0.025]}
            fontSize={0.09}
            color="#000000"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            {plateNumber}
          </Text>
        )}
      </group>

      {/* 4 Wheels (Rubber Tire + Alloy Rims) */}
      {[
        [-0.92, 0.32, 1.25],  // Front Left
        [0.92, 0.32, 1.25],   // Front Right
        [-0.92, 0.32, -1.3],  // Rear Left
        [0.92, 0.32, -1.3],   // Rear Right
      ].map((pos, idx) => (
        <group key={`wheel-${idx}`} position={pos as [number, number, number]}>
          {/* Black Rubber Tire */}
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.34, 0.34, 0.24, 16]} />
            <meshStandardMaterial color="#18181b" roughness={0.8} />
          </mesh>
          {/* Metallic Alloy Rim */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.22, 0.22, 0.25, 12]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Wheel Hub Center Cap */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.07, 0.07, 0.26, 8]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
        </group>
      ))}
    </group>
  );
};
