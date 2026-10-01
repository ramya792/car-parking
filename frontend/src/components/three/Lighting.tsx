import React from 'react';

interface LightingProps {
  timeOfDay?: 'DAY' | 'NIGHT';
}

export const Lighting: React.FC<LightingProps> = ({ timeOfDay = 'DAY' }) => {
  const isDay = timeOfDay === 'DAY';

  return (
    <>
      {/* Bright atmospheric daylight ambient light */}
      <ambientLight intensity={isDay ? 1.25 : 0.4} color={isDay ? '#ffffff' : '#a6c8e0'} />

      {/* Main directional key light (Sun in Day, Moon at Night) */}
      <directionalLight
        position={isDay ? [30, 48, 22] : [25, 40, 20]}
        intensity={isDay ? 2.6 : 1.2}
        color={isDay ? '#ffffff' : '#d4e6f1'}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={120}
        shadow-camera-left={-35}
        shadow-camera-right={35}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
        shadow-bias={-0.0005}
      />

      {/* Fill light from opposite angle */}
      <directionalLight
        position={[-20, 25, -15]}
        intensity={isDay ? 0.95 : 0.35}
        color={isDay ? '#e0f2fe' : '#fed7aa'}
      />

      {/* Street lights along the central driving lane (glows at night) */}
      <pointLight
        position={[-12, 6.5, 0]}
        intensity={isDay ? 0.2 : 1.8}
        distance={16}
        color="#fef08a"
        decay={2}
      />
      <pointLight
        position={[0, 6.5, 0]}
        intensity={isDay ? 0.25 : 2.2}
        distance={18}
        color="#fef08a"
        decay={2}
      />
      <pointLight
        position={[12, 6.5, 0]}
        intensity={isDay ? 0.2 : 1.8}
        distance={16}
        color="#fef08a"
        decay={2}
      />

      {/* Entry & Exit gate illumination */}
      <pointLight
        position={[-21, 5, 2]}
        intensity={isDay ? 0.5 : 2.5}
        distance={12}
        color="#ffffff"
        decay={2}
      />
      <pointLight
        position={[21, 5, -2]}
        intensity={isDay ? 0.5 : 2.5}
        distance={12}
        color="#ffffff"
        decay={2}
      />
    </>
  );
};
