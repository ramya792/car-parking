import React from 'react';

interface LightPoleProps {
  position: [number, number, number];
  rotationY?: number;
}

const LightPole: React.FC<LightPoleProps> = ({ position, rotationY = 0 }) => {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Base mount */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.35, 0.4, 8]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Vertical pole */}
      <mesh position={[0, 3, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 5.6, 8]} />
        <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Horizontal arched arm */}
      <mesh position={[0.4, 5.7, 0]} rotation={[0, 0, -Math.PI / 8]} castShadow>
        <cylinderGeometry args={[0.06, 0.07, 1.0, 8]} />
        <meshStandardMaterial color="#475569" metalness={0.8} />
      </mesh>

      {/* Lamp fixture housing */}
      <mesh position={[0.9, 5.6, 0]} castShadow>
        <boxGeometry args={[0.45, 0.12, 0.25]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Emissive light panel */}
      <mesh position={[0.9, 5.52, 0]}>
        <boxGeometry args={[0.4, 0.04, 0.2]} />
        <meshStandardMaterial
          color="#fef08a"
          emissive="#fef08a"
          emissiveIntensity={2.5}
          toneMapped={false}
        />
      </mesh>

      {/* Actual spot light casting warm beam on the ground */}
      <spotLight
        position={[0.9, 5.5, 0]}
        target-position={[position[0] + 1, 0, position[2]]}
        angle={Math.PI / 4}
        penumbra={0.6}
        intensity={18}
        distance={15}
        color="#fffbeb"
        castShadow
        shadow-bias={-0.001}
      />
    </group>
  );
};

export const StreetLights: React.FC = () => {
  return (
    <group>
      {/* Central driving aisle light poles */}
      <LightPole position={[-14, 0, -0.2]} rotationY={0} />
      <LightPole position={[-2, 0, -0.2]} rotationY={0} />
      <LightPole position={[10, 0, -0.2]} rotationY={0} />
      
      {/* Corner / entrance illumination poles */}
      <LightPole position={[-23, 0, 8]} rotationY={Math.PI / 2} />
      <LightPole position={[23, 0, 8]} rotationY={-Math.PI / 2} />
    </group>
  );
};
