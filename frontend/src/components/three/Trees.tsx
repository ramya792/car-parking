import React from 'react';

interface TreeProps {
  position: [number, number, number];
  scale?: number;
}

const Tree: React.FC<TreeProps> = ({ position, scale = 1 }) => {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Trunk */}
      <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.15, 0.25, 2.4, 8]} />
        <meshStandardMaterial color="#422006" roughness={0.9} />
      </mesh>
      {/* Lower foliage clump */}
      <mesh position={[0, 2.8, 0]} castShadow>
        <dodecahedronGeometry args={[1.3, 1]} />
        <meshStandardMaterial color="#1e4620" roughness={0.8} />
      </mesh>
      {/* Mid foliage clump */}
      <mesh position={[0, 3.8, 0]} castShadow>
        <dodecahedronGeometry args={[1.0, 1]} />
        <meshStandardMaterial color="#2d6a30" roughness={0.75} />
      </mesh>
      {/* Top foliage clump */}
      <mesh position={[0, 4.6, 0]} castShadow>
        <dodecahedronGeometry args={[0.7, 1]} />
        <meshStandardMaterial color="#388e3c" roughness={0.7} />
      </mesh>
    </group>
  );
};

const Bush: React.FC<{ position: [number, number, number]; scale?: number }> = ({
  position,
  scale = 1,
}) => {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshStandardMaterial color="#22542a" roughness={0.85} />
      </mesh>
      <mesh position={[0.3, 0.3, 0.2]} castShadow>
        <sphereGeometry args={[0.4, 8, 8]} />
        <meshStandardMaterial color="#2e7d32" roughness={0.8} />
      </mesh>
    </group>
  );
};

export const Landscaping: React.FC = () => {
  // Tree positions along back boundary
  const backTreeX = [-23, -19, -15, -11, -7, -3, 1, 5, 9, 13, 17, 21];
  
  // Side trees (Clear zone between z = -4.5 and z = 4.5 for incoming and outgoing roads)
  const sideLeftZ = [-11, -7, 6.5, 10.5];
  const sideRightZ = [-11, -7, 6.5, 10.5];

  return (
    <group>
      {/* Back row of trees behind the boundary wall */}
      {backTreeX.map((x, i) => (
        <Tree
          key={`back-tree-${i}`}
          position={[x, 0, -14.2]}
          scale={0.85 + (i % 3) * 0.15}
        />
      ))}

      {/* Side trees outside boundary */}
      {sideLeftZ.map((z, i) => (
        <Tree key={`left-tree-${i}`} position={[-28.5, 0, z]} scale={0.9} />
      ))}
      {sideRightZ.map((z, i) => (
        <Tree key={`right-tree-${i}`} position={[28.5, 0, z]} scale={0.9} />
      ))}

      {/* Decorative Bushes in front of back wall */}
      {[-21, -17, -13, -9, -5, -1, 3, 7, 11, 15, 19, 23].map((x, i) => (
        <Bush key={`bush-${i}`} position={[x, 0, -12.2]} scale={0.8 + (i % 2) * 0.3} />
      ))}
    </group>
  );
};
