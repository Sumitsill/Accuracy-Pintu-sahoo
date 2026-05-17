"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Sphere } from "@react-three/drei";
import * as THREE from "three";

function Atom() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.x = state.clock.getElapsedTime() * 0.1;
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Nucleus */}
      <Sphere args={[1, 32, 32]}>
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </Sphere>
      {/* Glow around nucleus */}
      <Sphere args={[1.5, 32, 32]}>
        <meshBasicMaterial color="#00f2ff" transparent opacity={0.3} toneMapped={false} />
      </Sphere>
      <pointLight color="#00f2ff" intensity={50} distance={20} />

      {/* Electrons */}
      <ElectronOrbit radius={4.5} speed={1.5} rotation={[Math.PI / 4, Math.PI / 4, 0]} color="#ff8a00" />
      <ElectronOrbit radius={4.5} speed={2} rotation={[-Math.PI / 4, -Math.PI / 4, 0]} color="#00f2ff" />
      <ElectronOrbit radius={4.5} speed={1.2} rotation={[0, Math.PI / 2, 0]} color="#ff8a00" />
      <ElectronOrbit radius={4.5} speed={1.8} rotation={[Math.PI / 2, 0, 0]} color="#00f2ff" />
    </group>
  );
}

function ElectronOrbit({ radius, speed, rotation, color }: { radius: number, speed: number, rotation: [number, number, number], color: string }) {
  const electronRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * speed;
    if (electronRef.current) {
      electronRef.current.position.x = Math.cos(t) * radius;
      electronRef.current.position.z = Math.sin(t) * radius;
    }
  });

  return (
    <group rotation={rotation}>
      {/* Orbit path */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.02, 16, 100]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} />
      </mesh>
      
      {/* Electron particle */}
      <mesh ref={electronRef}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color={color} toneMapped={false} />
        <pointLight color={color} intensity={20} distance={5} />
      </mesh>
    </group>
  );
}

export default function ThreeBackground() {
  return (
    <div className="absolute inset-0 -z-10 w-full h-full bg-[#030816]">
      <Canvas camera={{ position: [0, 0, 12], fov: 45 }}>
        <ambientLight intensity={0.1} />
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1.5} />
        <Atom />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.8} maxPolarAngle={Math.PI / 1.5} minPolarAngle={Math.PI / 3} />
      </Canvas>
    </div>
  );
}
