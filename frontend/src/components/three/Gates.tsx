import React from 'react';
import { Text } from '@react-three/drei';

interface GateProps {
  position: [number, number, number];
  type: 'ENTRY' | 'EXIT';
  isOpen?: boolean;
  activePlate?: string;
  activeSlot?: string;
  availableCount?: number;
  exitFee?: number;
  isPaid?: boolean;
}

export const GateBooth: React.FC<GateProps> = ({
  position,
  type,
  isOpen = false,
  activePlate,
  activeSlot,
  availableCount = 6,
  exitFee = 50,
  isPaid = true,
}) => {
  const isEntry = type === 'ENTRY';
  // Entry booth is on the South sidewalk (z=4.8), Exit booth is on the North sidewalk (z=-4.8)
  const armDirectionZ = isEntry ? -1 : 1; // Arm points across the road towards the center aisle

  return (
    <group position={position}>
      {/* ===================== GUARD BOOTH (ON SIDEWALK) ===================== */}
      {/* Concrete foundation pad */}
      <mesh position={[0, 0.1, 0]} receiveShadow castShadow>
        <boxGeometry args={[3.2, 0.2, 2.4]} />
        <meshStandardMaterial color="#64748b" roughness={0.7} />
      </mesh>

      {/* Main Machine / Server Cabin */}
      <mesh position={[0, 1.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.6, 2.4, 1.8]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.4} />
      </mesh>

      {/* Overhanging Modern Canopy Roof */}
      <mesh position={[0, 2.65, 0]} castShadow>
        <boxGeometry args={[3.0, 0.15, 2.2]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} />
      </mesh>

      {/* Large tinted glass monitoring display facing the road */}
      <mesh position={[0, 1.5, armDirectionZ * 0.91]}>
        <boxGeometry args={[1.6, 1.1, 0.02]} />
        <meshPhysicalMaterial
          color="#38bdf8"
          roughness={0.1}
          metalness={0.1}
          transmission={0.8}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Signboard on booth */}
      <mesh position={[0, 2.3, armDirectionZ * 0.92]}>
        <boxGeometry args={[2.0, 0.4, 0.04]} />
        <meshStandardMaterial color={isEntry ? '#0284c7' : '#e11d48'} />
      </mesh>
      <Text
        position={[0, 2.3, armDirectionZ * 0.95]}
        fontSize={0.22}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        {isEntry ? 'ENTRY' : 'EXIT'}
      </Text>

      {/* ===================== TRAFFIC SIGNAL & SPEED LIMIT POST ===================== */}
      {/* Positioned at the curb in front of booth facing oncoming cars */}
      <group position={[isEntry ? -1.8 : 1.8, 0, armDirectionZ * 1.3]}>
        {/* Metal signal pole */}
        <mesh position={[0, 1.1, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 2.2, 12]} />
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </mesh>

        {/* Traffic Light Housing (2-aspect: Red / Green) */}
        <mesh position={[0, 1.85, 0]} castShadow>
          <boxGeometry args={[0.22, 0.52, 0.16]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} />
        </mesh>

        {/* RED Traffic Light (Top) */}
        <mesh position={[0, 1.98, isEntry ? -0.09 : 0.09]}>
          <circleGeometry args={[0.08, 16]} />
          <meshStandardMaterial
            color={!isOpen ? '#ef4444' : '#450a0a'}
            emissive={!isOpen ? '#ef4444' : '#200'}
            emissiveIntensity={!isOpen ? 3.0 : 0.2}
          />
        </mesh>

        {/* GREEN Traffic Light (Bottom) */}
        <mesh position={[0, 1.72, isEntry ? -0.09 : 0.09]}>
          <circleGeometry args={[0.08, 16]} />
          <meshStandardMaterial
            color={isOpen ? '#22c55e' : '#052e16'}
            emissive={isOpen ? '#22c55e' : '#002'}
            emissiveIntensity={isOpen ? 3.0 : 0.2}
          />
        </mesh>

        {/* Circular Traffic Speed Limit Sign (10 km/h) */}
        <group position={[0, 1.3, isEntry ? -0.08 : 0.08]} rotation={[0, isEntry ? -Math.PI / 2 : Math.PI / 2, 0]}>
          <mesh>
            <cylinderGeometry args={[0.18, 0.18, 0.02, 24]} />
            <meshStandardMaterial color="#dc2626" />
          </mesh>
          <mesh position={[0, 0.015, 0]}>
            <cylinderGeometry args={[0.14, 0.14, 0.02, 24]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <Text
            position={[0, 0.03, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.12}
            color="#000000"
            fontWeight="bold"
            anchorX="center"
            anchorY="middle"
          >
            10
          </Text>
        </group>
      </group>

      {/* ===================== BOOM BARRIER UNIT AT ROAD CURB ===================== */}
      {/* Placed at curb edge beside the road (offset in Z toward road) */}
      <group position={[0, 0, armDirectionZ * 1.35]}>
        {/* Barrier Cabinet Housing */}
        <mesh position={[0, 0.6, 0]} castShadow>
          <boxGeometry args={[0.45, 1.2, 0.45]} />
          <meshStandardMaterial color="#f97316" metalness={0.3} roughness={0.3} />
        </mesh>

        {/* Status LED ring on barrier unit */}
        <mesh position={[0, 1.15, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.08, 16]} />
          <meshStandardMaterial
            color={isOpen ? '#22c55e' : '#ef4444'}
            emissive={isOpen ? '#22c55e' : '#ef4444'}
            emissiveIntensity={2.5}
          />
        </mesh>

        {/* Barrier Pivot & Boom Arm extending ACROSS THE ROAD */}
        <group
          position={[0, 0.95, 0]}
          rotation={[isOpen ? (isEntry ? Math.PI / 2.2 : -Math.PI / 2.2) : 0, 0, 0]}
        >
          {/* Pivot joint */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.08, 0.08, 0.35, 16]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>

          {/* Boom arm extending across the 3.2m road lane */}
          <mesh position={[0, 0, armDirectionZ * 1.6]} castShadow>
            <boxGeometry args={[0.08, 0.09, 3.2]} />
            <meshStandardMaterial color="#ffffff" roughness={0.3} />
          </mesh>

          {/* Red hazard stripes on boom arm */}
          {[-1.2, -0.6, 0, 0.6, 1.2].map((stripeZ, sIdx) => (
            <mesh key={`stripe-${sIdx}`} position={[0, 0, armDirectionZ * (1.6 + stripeZ * 0.9)]}>
              <boxGeometry args={[0.085, 0.095, 0.28]} />
              <meshStandardMaterial color="#dc2626" />
            </mesh>
          ))}
        </group>
      </group>

      {/* ===================== OVERHEAD ELECTRONIC LED GANTRY ===================== */}
      {/* Arching directly over the road lane (centered at lane Z = 2.8m from booth) */}
      <group position={[0, 0, armDirectionZ * 2.8]}>
        {/* Support pole near booth */}
        <mesh position={[0, 1.9, -armDirectionZ * 1.7]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 3.8, 16]} />
          <meshStandardMaterial color="#475569" metalness={0.8} />
        </mesh>

        {/* Support pole across road */}
        <mesh position={[0, 1.9, armDirectionZ * 1.7]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 3.8, 16]} />
          <meshStandardMaterial color="#475569" metalness={0.8} />
        </mesh>

        {/* Crossbar overhead */}
        <mesh position={[0, 3.8, 0]} castShadow>
          <boxGeometry args={[0.15, 0.15, 3.6]} />
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </mesh>

        {/* LED Billboard Display Box */}
        <mesh position={[0, 3.8, 0]} castShadow>
          <boxGeometry args={[0.2, 1.0, 2.8]} />
          <meshStandardMaterial color="#020617" roughness={0.2} metalness={0.6} />
        </mesh>

        {/* Glowing LED display screen facing oncoming traffic (West side for entry, East side for exit) */}
        <mesh position={[isEntry ? -0.11 : 0.11, 3.8, 0]} rotation={[0, isEntry ? -Math.PI / 2 : Math.PI / 2, 0]}>
          <planeGeometry args={[2.65, 0.88]} />
          <meshBasicMaterial color="#050b14" />
        </mesh>

        {isEntry ? (
          /* Entry Billboard */
          <group position={[-0.12, 3.8, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <Text position={[0, 0.22, 0]} fontSize={0.15} color="#facc15" fontWeight="bold">
              {activePlate ? `PLATE: ${activePlate}` : 'ANPR SCANNING...'}
            </Text>
            <Text position={[0, -0.02, 0]} fontSize={0.15} color="#4ade80" fontWeight="bold">
              {activeSlot ? `BAY ALLOCATED: ${activeSlot}` : `${availableCount} SLOTS AVAILABLE`}
            </Text>
            <Text position={[0, -0.25, 0]} fontSize={0.11} color="#94a3b8">
              PROCEED TO DESIGNATED BAY
            </Text>
          </group>
        ) : (
          /* Exit Billboard */
          <group position={[0.12, 3.8, 0]} rotation={[0, Math.PI / 2, 0]}>
            <Text position={[0, 0.22, 0]} fontSize={0.15} color="#facc15" fontWeight="bold">
              {activePlate ? `VEHICLE: ${activePlate}` : 'ANPR EXIT SCANNER'}
            </Text>
            <Text position={[0, -0.02, 0]} fontSize={0.14} color="#38bdf8" fontWeight="bold">
              PARKING FEE: ₹{exitFee}
            </Text>
            <Text position={[0, -0.25, 0]} fontSize={0.12} color={isPaid ? '#4ade80' : '#fb923c'} fontWeight="bold">
              {isPaid ? '✅ PAYMENT VERIFIED • EXIT OPEN' : '📱 SCAN UPI QR TO PAY'}
            </Text>
          </group>
        )}
      </group>
    </group>
  );
};

export const Gates: React.FC<{
  isEntryOpen?: boolean;
  isExitOpen?: boolean;
  activeEntryPlate?: string;
  activeEntrySlot?: string;
  activeExitPlate?: string;
  exitFee?: number;
  isExitPaid?: boolean;
}> = ({
  isEntryOpen = false,
  isExitOpen = false,
  activeEntryPlate,
  activeEntrySlot,
  activeExitPlate,
  exitFee = 50,
  isExitPaid = true,
}) => {
  return (
    <group>
      {/* Entry Gate on the South sidewalk (z = 4.8), beside the incoming lane at z = 2.0 */}
      <GateBooth
        position={[-18.5, 0, 4.8]}
        type="ENTRY"
        isOpen={isEntryOpen}
        activePlate={activeEntryPlate}
        activeSlot={activeEntrySlot}
      />

      {/* Exit Gate on the North sidewalk (z = -4.8), beside the exiting lane at z = -2.0 */}
      <GateBooth
        position={[18.5, 0, -4.8]}
        type="EXIT"
        isOpen={isExitOpen}
        activePlate={activeExitPlate}
        exitFee={exitFee}
        isPaid={isExitPaid}
      />
    </group>
  );
};
