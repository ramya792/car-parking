import React from 'react';

export const Ground: React.FC = () => {
  return (
    <group>
      {/* Outer surrounding light pavement ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[110, 68]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
      </mesh>

      {/* Main Parking Lot Daylight Asphalt Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[52, 26]} />
        <meshStandardMaterial color="#334155" roughness={0.75} metalness={0.08} />
      </mesh>

      {/* ===================== EXTERNAL ACCESS ROADS ===================== */}
      {/* West External Approach Road (Coming from public highway into facility) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-36, 0.005, 1.8]} receiveShadow>
        <planeGeometry args={[20.5, 4.6]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} metalness={0.1} />
      </mesh>
      {/* West road curbs */}
      <mesh position={[-36, 0.1, -0.6]} receiveShadow castShadow>
        <boxGeometry args={[20.5, 0.2, 0.3]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.5} />
      </mesh>
      <mesh position={[-36, 0.1, 4.2]} receiveShadow castShadow>
        <boxGeometry args={[20.5, 0.2, 0.3]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.5} />
      </mesh>

      {/* East External Departure Road (Exiting facility onto public highway) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[36, 0.005, -1.8]} receiveShadow>
        <planeGeometry args={[20.5, 4.6]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} metalness={0.1} />
      </mesh>
      {/* East road curbs */}
      <mesh position={[36, 0.1, -4.2]} receiveShadow castShadow>
        <boxGeometry args={[20.5, 0.2, 0.3]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.5} />
      </mesh>
      <mesh position={[36, 0.1, 0.6]} receiveShadow castShadow>
        <boxGeometry args={[20.5, 0.2, 0.3]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.5} />
      </mesh>

      {/* ===================== PERIMETER CURBS (WITH ROAD OPENINGS) ===================== */}
      {/* Back curb (North) */}
      <mesh position={[0, 0.1, -12.5]} receiveShadow castShadow>
        <boxGeometry args={[52.2, 0.2, 0.4]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.5} />
      </mesh>
      {/* Front curb (South) */}
      <mesh position={[0, 0.1, 12.5]} receiveShadow castShadow>
        <boxGeometry args={[52.2, 0.2, 0.4]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.5} />
      </mesh>

      {/* Left perimeter curbs (West side) - Open between z = -0.5 and z = 4.1 for incoming road */}
      <mesh position={[-25.9, 0.1, -6.6]} receiveShadow castShadow>
        <boxGeometry args={[0.4, 0.2, 11.8]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.5} />
      </mesh>
      <mesh position={[-25.9, 0.1, 8.4]} receiveShadow castShadow>
        <boxGeometry args={[0.4, 0.2, 8.2]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.5} />
      </mesh>

      {/* Right perimeter curbs (East side) - Open between z = -4.1 and z = 0.5 for outgoing road */}
      <mesh position={[25.9, 0.1, -8.4]} receiveShadow castShadow>
        <boxGeometry args={[0.4, 0.2, 8.2]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.5} />
      </mesh>
      <mesh position={[25.9, 0.1, 6.6]} receiveShadow castShadow>
        <boxGeometry args={[0.4, 0.2, 11.8]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.5} />
      </mesh>

      {/* ===================== SURROUNDING GRASS VERGES ===================== */}
      {/* Perimeter Grass Strip behind back curb */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -14]} receiveShadow>
        <planeGeometry args={[54, 3]} />
        <meshStandardMaterial color="#16a34a" roughness={0.8} />
      </mesh>

      {/* West Grass Verges (Framing the approach road) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-36, 0.02, -7.0]} receiveShadow>
        <planeGeometry args={[20.5, 12.0]} />
        <meshStandardMaterial color="#15803d" roughness={0.8} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-36, 0.02, 8.6]} receiveShadow>
        <planeGeometry args={[20.5, 8.5]} />
        <meshStandardMaterial color="#15803d" roughness={0.8} />
      </mesh>

      {/* East Grass Verges (Framing the departure road) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[36, 0.02, -8.6]} receiveShadow>
        <planeGeometry args={[20.5, 8.5]} />
        <meshStandardMaterial color="#15803d" roughness={0.8} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[36, 0.02, 7.0]} receiveShadow>
        <planeGeometry args={[20.5, 12.0]} />
        <meshStandardMaterial color="#15803d" roughness={0.8} />
      </mesh>

      {/* Central lane divider curbs / median planters (between slot bays and aisle) */}
      <mesh position={[-2, 0.06, 0]} rotation={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[0.15, 0.04, 22]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.6} />
      </mesh>
    </group>
  );
};

