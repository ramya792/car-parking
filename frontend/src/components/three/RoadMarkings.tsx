import React from 'react';
import { Text } from '@react-three/drei';

export const RoadMarkings: React.FC = () => {
  // Dashed white centerlines along the central driving aisle (X from -16 to 16, Z = 0)
  const centerDashes = Array.from({ length: 9 }, (_, i) => -16 + i * 4);

  // Dashed white centerlines along West external approach road (X from -44 to -22)
  const westRoadDashes = [-42, -38, -34, -30, -26, -22];

  // Dashed white centerlines along East external departure road (X from 22 to 44)
  const eastRoadDashes = [22, 26, 30, 34, 38, 42];

  return (
    <group position={[0, 0.015, 0]}>
      {/* Central aisle dashed lane dividing lines */}
      {centerDashes.map((x, idx) => (
        <mesh
          key={`dash-${idx}`}
          position={[x, 0, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[2.2, 0.18]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.85} />
        </mesh>
      ))}

      {/* West External Approach Road Dashes */}
      {westRoadDashes.map((x, idx) => (
        <mesh
          key={`west-dash-${idx}`}
          position={[x, 0, -0.4]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[2.2, 0.16]} />
          <meshBasicMaterial color="#facc15" transparent opacity={0.8} />
        </mesh>
      ))}

      {/* East External Departure Road Dashes */}
      {eastRoadDashes.map((x, idx) => (
        <mesh
          key={`east-dash-${idx}`}
          position={[x, 0, 0.4]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[2.2, 0.16]} />
          <meshBasicMaterial color="#facc15" transparent opacity={0.8} />
        </mesh>
      ))}

      {/* ===================== ENTRY GATE ROAD MARKINGS ===================== */}
      {/* Stop Line at Entry Barrier (West Ingress Lane) */}
      <mesh position={[-19.8, 0, 1.8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.35, 3.2]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.95} />
      </mesh>

      {/* Stenciled "STOP" before Entry Barrier Stop Line */}
      <Text
        position={[-21.0, 0, 1.8]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.8}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.9}
        fontWeight="bold"
      >
        STOP
      </Text>

      {/* "ENTRY" Stenciled Text on incoming road */}
      <Text
        position={[-26.5, 0, 1.8]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.85}
        color="#38bdf8"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.9}
        fontWeight="bold"
      >
        ENTRY ➔
      </Text>

      {/* Approach Road Direction Arrows (West -> East traffic flow) */}
      <Text
        position={[-39, 0, 1.8]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={1.4}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.85}
      >
        ➜
      </Text>
      <Text
        position={[-33, 0, 1.8]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={1.4}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.85}
      >
        ➜
      </Text>

      {/* Facility Ingress Lane Arrows */}
      <Text
        position={[-14, 0, 1.8]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={1.3}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.85}
      >
        ➜
      </Text>
      <Text
        position={[-4, 0, 1.8]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={1.3}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.85}
      >
        ➜
      </Text>
      <Text
        position={[6, 0, 1.8]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={1.3}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.85}
      >
        ➜
      </Text>

      {/* ===================== EXIT GATE ROAD MARKINGS ===================== */}
      {/* Stop Line at Exit Barrier (East Egress Lane) */}
      <mesh position={[16.8, 0, -1.8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.35, 3.2]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.95} />
      </mesh>

      {/* Stenciled "STOP" before Exit Barrier Stop Line */}
      <Text
        position={[15.2, 0, -1.8]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.8}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.9}
        fontWeight="bold"
      >
        STOP
      </Text>

      {/* "EXIT" Stenciled Text on road */}
      <Text
        position={[19.2, 0, -1.8]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.85}
        color="#f43f5e"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.9}
        fontWeight="bold"
      >
        EXIT ➔
      </Text>

      {/* Facility Egress Lane Arrows (Eastbound toward Exit Gate) */}
      <Text
        position={[2, 0, -1.8]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={1.3}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.85}
      >
        ➜
      </Text>
      <Text
        position={[10, 0, -1.8]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={1.3}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.85}
      >
        ➜
      </Text>

      {/* Departure Road Direction Arrows (Past exit gate into public road) */}
      <Text
        position={[27, 0, -1.8]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={1.4}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.85}
      >
        ➜
      </Text>
      <Text
        position={[35, 0, -1.8]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={1.4}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.85}
      >
        ➜
      </Text>

      {/* Pedestrian Zebra Crosswalk across driving aisle */}
      {[-1.2, -0.6, 0, 0.6, 1.2].map((zOffset, zIdx) => (
        <mesh
          key={`crosswalk-${zIdx}`}
          position={[0, 0, zOffset]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[1.4, 0.35]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.75} />
        </mesh>
      ))}
    </group>
  );
};
