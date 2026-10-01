import React from 'react';

export const PerimeterWalls: React.FC = () => {
  // Pillars along the back wall
  const backPillars = Array.from({ length: 11 }, (_, i) => -25 + i * 5);

  return (
    <group>
      {/* Back Boundary Wall */}
      <mesh position={[0, 1.8, -13.5]} castShadow receiveShadow>
        <boxGeometry args={[52, 3.6, 0.4]} />
        <meshStandardMaterial color="#475569" roughness={0.75} />
      </mesh>
      {/* Back Wall Top Capstone */}
      <mesh position={[0, 3.65, -13.5]} castShadow receiveShadow>
        <boxGeometry args={[52.4, 0.2, 0.6]} />
        <meshStandardMaterial color="#64748b" roughness={0.65} />
      </mesh>

      {/* Decorative Architectural Wall Pillars */}
      {backPillars.map((x, idx) => (
        <group key={`back-pillar-${idx}`} position={[x, 0, -13.4]}>
          <mesh position={[0, 1.9, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.7, 3.8, 0.55]} />
            <meshStandardMaterial color="#334155" roughness={0.7} />
          </mesh>
          <mesh position={[0, 3.85, 0]} castShadow>
            <boxGeometry args={[0.9, 0.15, 0.7]} />
            <meshStandardMaterial color="#94a3b8" roughness={0.5} />
          </mesh>
          {/* Wall light fixture on pillar */}
          <mesh position={[0, 2.8, 0.35]}>
            <boxGeometry args={[0.2, 0.3, 0.15]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <mesh position={[0, 2.8, 0.45]}>
            <sphereGeometry args={[0.07, 12, 12]} />
            <meshStandardMaterial color="#fed7aa" emissive="#f59e0b" emissiveIntensity={0.8} />
          </mesh>
        </group>
      ))}

      {/* Left Wall (West Boundary - Section behind incoming road) */}
      <mesh position={[-26, 1.6, -6.6]} castShadow receiveShadow>
        <boxGeometry args={[0.4, 3.2, 11.8]} />
        <meshStandardMaterial color="#475569" roughness={0.75} />
      </mesh>
      {/* Left Wall (West Boundary - Section in front of incoming road) */}
      <mesh position={[-26, 1.6, 8.4]} castShadow receiveShadow>
        <boxGeometry args={[0.4, 3.2, 8.2]} />
        <meshStandardMaterial color="#475569" roughness={0.75} />
      </mesh>

      {/* West Entrance Architectural Gate Pillars */}
      <mesh position={[-26, 1.8, -0.6]} castShadow receiveShadow>
        <boxGeometry args={[0.7, 3.6, 0.7]} />
        <meshStandardMaterial color="#334155" roughness={0.7} />
      </mesh>
      <mesh position={[-26, 1.8, 4.2]} castShadow receiveShadow>
        <boxGeometry args={[0.7, 3.6, 0.7]} />
        <meshStandardMaterial color="#334155" roughness={0.7} />
      </mesh>

      {/* Right Wall (East Boundary - Section behind outgoing road) */}
      <mesh position={[26, 1.6, -8.4]} castShadow receiveShadow>
        <boxGeometry args={[0.4, 3.2, 8.2]} />
        <meshStandardMaterial color="#475569" roughness={0.75} />
      </mesh>
      {/* Right Wall (East Boundary - Section in front of outgoing road) */}
      <mesh position={[26, 1.6, 6.6]} castShadow receiveShadow>
        <boxGeometry args={[0.4, 3.2, 11.8]} />
        <meshStandardMaterial color="#475569" roughness={0.75} />
      </mesh>

      {/* East Exit Architectural Gate Pillars */}
      <mesh position={[26, 1.8, -4.2]} castShadow receiveShadow>
        <boxGeometry args={[0.7, 3.6, 0.7]} />
        <meshStandardMaterial color="#334155" roughness={0.7} />
      </mesh>
      <mesh position={[26, 1.8, 0.6]} castShadow receiveShadow>
        <boxGeometry args={[0.7, 3.6, 0.7]} />
        <meshStandardMaterial color="#334155" roughness={0.7} />
      </mesh>
    </group>
  );
};
