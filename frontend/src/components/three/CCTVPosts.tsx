import React, { useState } from 'react';
import { Html } from '@react-three/drei';

interface CCTVPostProps {
  id: string;
  name: string;
  direction?: 'TOP' | 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';
  position: [number, number, number];
  rotationY?: number;
  pitch?: number; // tilt angle downwards
  poleHeight?: number;
  onSelectCamera?: (id: string, name?: string, direction?: string) => void;
}

export const CCTVCamera: React.FC<CCTVPostProps> = ({
  id,
  name,
  direction,
  position,
  rotationY = 0,
  pitch = 0.45,
  poleHeight = 5.2,
  onSelectCamera,
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onSelectCamera?.(id, name, direction);
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
      {/* Interactive Tooltip on hover */}
      {hovered && (
        <Html position={[0, poleHeight + 1.2, 0]} center pointerEvents="none">
          <div className="bg-slate-950/90 text-blue-400 border border-blue-500/50 text-[11px] font-mono px-2 py-0.5 rounded shadow-lg whitespace-nowrap flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{name}</span>
            {direction && (
              <span className="text-[9px] bg-blue-600/40 text-blue-200 px-1 rounded font-bold">
                {direction}
              </span>
            )}
          </div>
        </Html>
      )}
      {/* CCTV Base */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.32, 0.5, 12]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} />
      </mesh>

      {/* Tall mounting post */}
      <mesh position={[0, poleHeight / 2, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.1, poleHeight, 12]} />
        <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Camera Mount Arm */}
      <group position={[0, poleHeight, 0]} rotation={[0, rotationY, 0]}>
        <mesh position={[0.3, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.6, 8]} />
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </mesh>

        {/* Camera Enclosure pivoted down */}
        <group position={[0.6, -0.05, 0]} rotation={[0, 0, -pitch]}>
          {/* Main camera body */}
          <mesh castShadow>
            <boxGeometry args={[0.6, 0.25, 0.28]} />
            <meshStandardMaterial
              color={hovered ? '#38bdf8' : '#e2e8f0'}
              metalness={0.6}
              roughness={0.3}
            />
          </mesh>

          {/* Sunshield visor */}
          <mesh position={[0.05, 0.16, 0]}>
            <boxGeometry args={[0.65, 0.04, 0.32]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>

          {/* Camera Lens */}
          <mesh position={[0.32, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.09, 0.09, 0.08, 16]} />
            <meshStandardMaterial color="#020617" roughness={0.1} metalness={0.9} />
          </mesh>

          {/* Lens Glass */}
          <mesh position={[0.36, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <circleGeometry args={[0.075, 16]} />
            <meshBasicMaterial color="#0ea5e9" />
          </mesh>

          {/* Live Recording Red Indicator LED */}
          <mesh position={[-0.25, 0.12, 0.12]}>
            <sphereGeometry args={[0.035, 8, 8]} />
            <meshStandardMaterial
              color="#ef4444"
              emissive="#ef4444"
              emissiveIntensity={3}
              toneMapped={false}
            />
          </mesh>
        </group>
      </group>
    </group>
  );
};

export const CCTVPosts: React.FC<{
  onSelectCamera?: (id: string, name?: string, direction?: string) => void;
}> = ({ onSelectCamera }) => {
  return (
    <group>
      {/* CAM TOP - High Mast Overhead Camera surveying the whole lot */}
      <CCTVCamera
        id="CAM_02"
        name="CAM Top — Overhead Lot"
        direction="TOP"
        position={[-0.5, 0, -11.2]}
        rotationY={-Math.PI / 2}
        pitch={0.82}
        poleHeight={7.2}
        onSelectCamera={onSelectCamera}
      />

      {/* CAM NORTH - North Perimeter Camera surveying Bays P01-P10 & Aisle */}
      <CCTVCamera
        id="CAM_04"
        name="CAM North — North Wing (P01-P10)"
        direction="NORTH"
        position={[6, 0, -11.2]}
        rotationY={-Math.PI / 2}
        pitch={0.48}
        poleHeight={5.2}
        onSelectCamera={onSelectCamera}
      />

      {/* CAM SOUTH - South Perimeter Camera surveying Bays P11-P20 & Aisle */}
      <CCTVCamera
        id="CAM_05"
        name="CAM South — South Wing (P11-P20)"
        direction="SOUTH"
        position={[-6, 0, 11.2]}
        rotationY={Math.PI / 2}
        pitch={0.48}
        poleHeight={5.2}
        onSelectCamera={onSelectCamera}
      />

      {/* CAM WEST - Entrance Gate Camera looking east at arriving cars */}
      <CCTVCamera
        id="CAM_01"
        name="CAM West — Entrance Gate"
        direction="WEST"
        position={[-19, 0, 6.5]}
        rotationY={0}
        pitch={0.48}
        poleHeight={5.2}
        onSelectCamera={onSelectCamera}
      />

      {/* CAM EAST - Exit Gate Camera looking west at departing cars */}
      <CCTVCamera
        id="CAM_03"
        name="CAM East — Exit Gate"
        direction="EAST"
        position={[19, 0, -6.5]}
        rotationY={Math.PI}
        pitch={0.48}
        poleHeight={5.2}
        onSelectCamera={onSelectCamera}
      />
    </group>
  );
};
