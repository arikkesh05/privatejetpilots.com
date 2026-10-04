import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MathUtils } from 'three';
import type { Group } from 'three';

/**
 * Procedural swept-wing business jet: fuselage, nose and tail cones, swept main
 * wings, horizontal stabilisers, a vertical fin, a smoked canopy and twin
 * under-wing nacelles. It is lit by a champagne key with a platinum rim so the
 * airframe reads as warm metal on obsidian, and it tilts toward the pointer
 * under a damped spring rather than snapping.
 */
function AircraftScene() {
  const aircraftRef = useRef<Group>(null);

  useFrame((state, delta) => {
    const aircraft = aircraftRef.current;
    if (!aircraft) return;
    aircraft.rotation.y = MathUtils.damp(aircraft.rotation.y, state.pointer.x * 0.4, 3, delta);
    aircraft.rotation.x = MathUtils.damp(aircraft.rotation.x, -state.pointer.y * 0.22, 3, delta);
  });

  return (
    <group ref={aircraftRef}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 3.2, 28]} />
        <meshStandardMaterial color="#3a3939" metalness={0.6} roughness={0.32} />
      </mesh>

      <mesh position={[0, 0, -1.92]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.18, 0.72, 28]} />
        <meshStandardMaterial color="#3a3939" metalness={0.6} roughness={0.32} />
      </mesh>

      <mesh position={[0, 0, 1.78]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.18, 0.56, 28]} />
        <meshStandardMaterial color="#2e2d2c" metalness={0.6} roughness={0.4} />
      </mesh>

      <mesh position={[0, 0.16, -0.72]} scale={[0.95, 0.6, 2.1]}>
        <sphereGeometry args={[0.17, 24, 18]} />
        <meshStandardMaterial color="#4a4030" metalness={0.6} roughness={0.16} />
      </mesh>

      <mesh position={[1.05, -0.03, 0.28]} rotation={[0, -0.42, 0.06]}>
        <boxGeometry args={[2.1, 0.07, 0.66]} />
        <meshStandardMaterial color="#2e2d2c" metalness={0.55} roughness={0.4} />
      </mesh>
      <mesh position={[-1.05, -0.03, 0.28]} rotation={[0, 0.42, -0.06]}>
        <boxGeometry args={[2.1, 0.07, 0.66]} />
        <meshStandardMaterial color="#2e2d2c" metalness={0.55} roughness={0.4} />
      </mesh>

      <mesh position={[0.5, 0.04, 1.42]} rotation={[0, -0.4, 0]}>
        <boxGeometry args={[0.95, 0.05, 0.4]} />
        <meshStandardMaterial color="#2e2d2c" metalness={0.55} roughness={0.4} />
      </mesh>
      <mesh position={[-0.5, 0.04, 1.42]} rotation={[0, 0.4, 0]}>
        <boxGeometry args={[0.95, 0.05, 0.4]} />
        <meshStandardMaterial color="#2e2d2c" metalness={0.55} roughness={0.4} />
      </mesh>

      <mesh position={[0, 0.46, 1.28]} rotation={[-0.34, 0, 0]}>
        <boxGeometry args={[0.07, 0.78, 0.74]} />
        <meshStandardMaterial color="#2e2d2c" metalness={0.55} roughness={0.38} />
      </mesh>

      <mesh position={[0.74, -0.16, 0.62]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.16, 1.05, 22]} />
        <meshStandardMaterial color="#1a1919" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[-0.74, -0.16, 0.62]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.16, 1.05, 22]} />
        <meshStandardMaterial color="#1a1919" metalness={0.7} roughness={0.3} />
      </mesh>

      <mesh position={[0.74, -0.16, 0.11]}>
        <torusGeometry args={[0.14, 0.028, 12, 24]} />
        <meshStandardMaterial color="#cbb079" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[-0.74, -0.16, 0.11]}>
        <torusGeometry args={[0.14, 0.028, 12, 24]} />
        <meshStandardMaterial color="#cbb079" metalness={0.85} roughness={0.25} />
      </mesh>

      <ambientLight color="#e0cca0" intensity={0.4} />
      <directionalLight color="#e0cca0" intensity={2.4} position={[4, 6, 4]} />
      <directionalLight color="#d6d3ce" intensity={1.1} position={[-5, 2, -5]} />
      <pointLight color="#cbb079" intensity={0.7} position={[0, -3, 2]} />
    </group>
  );
}

export function ThreeJetGlide() {
  return (
    <div className="relative w-full h-full">
      <Canvas camera={{ fov: 40, position: [0, 2.4, 5.6] }} dpr={[1, 2]} gl={{ alpha: true, antialias: true }}>
        <Suspense fallback={null}>
          <AircraftScene />
        </Suspense>
      </Canvas>
    </div>
  );
}
