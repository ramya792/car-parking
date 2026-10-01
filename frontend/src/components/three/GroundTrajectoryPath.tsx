import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';

interface GroundTrajectoryPathProps {
  targetSlotId?: string;
  targetPosition?: [number, number, number];
  visible?: boolean;
}

export const GroundTrajectoryPath: React.FC<GroundTrajectoryPathProps> = ({
  targetSlotId,
  targetPosition,
  visible = true,
}) => {
  const lineRef = useRef<THREE.LineSegments>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  const { lineGeometry } = useMemo(() => {
    if (!targetPosition) return { points: [], lineGeometry: null };
    const [tx, , tz] = targetPosition;
    const ingressLaneZ = 1.8;

    const curvePoints: THREE.Vector3[] = [
      new THREE.Vector3(-22.0, 0.04, ingressLaneZ),
      new THREE.Vector3(-16.0, 0.04, ingressLaneZ),
      new THREE.Vector3(Math.max(tx - 2.5, -14.0), 0.04, ingressLaneZ),
      new THREE.Vector3(tx, 0.04, tz < 0 ? 0.0 : 2.5),
      new THREE.Vector3(tx, 0.04, tz),
    ];

    const curve = new THREE.CatmullRomCurve3(curvePoints, false, 'catmullrom', 0.15);
    const sampled = curve.getPoints(40);

    const positions: number[] = [];
    for (let i = 0; i < sampled.length - 1; i++) {
      positions.push(sampled[i].x, sampled[i].y, sampled[i].z);
      positions.push(sampled[i + 1].x, sampled[i + 1].y, sampled[i + 1].z);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    return { lineGeometry: geo };
  }, [targetPosition]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 1.5;
      const s = 1 + Math.sin(t * 4) * 0.12;
      ringRef.current.scale.set(s, s, s);
    }
  });

  if (!visible || !targetPosition || !lineGeometry) return null;

  const [tx, , tz] = targetPosition;

  return (
    <group>
      {/* Glowing Dynamic Trajectory Line on Roadway */}
      <lineSegments ref={lineRef} geometry={lineGeometry}>
        <lineBasicMaterial color="#06b6d4" linewidth={3} transparent opacity={0.85} />
      </lineSegments>

      {/* Target Bay Pulsing Ground Marker */}
      <group position={[tx, 0.05, tz]}>
        {/* Outer glowing pulsing ring */}
        <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.1, 1.25, 32]} />
          <meshBasicMaterial color="#10b981" transparent opacity={0.9} side={THREE.DoubleSide} />
        </mesh>

        {/* Inner target circle */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.4, 24]} />
          <meshBasicMaterial color="#06b6d4" transparent opacity={0.6} />
        </mesh>

        {/* 3D Dijkstra Allocation Text Label on Asphalt */}
        <Text
          position={[0, 0.02, 0.8]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.32}
          color="#38bdf8"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          {`DIJKSTRA ➔ BAY ${targetSlotId || ''}`}
        </Text>
      </group>
    </group>
  );
};
