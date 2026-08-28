"use client";

import { AdaptiveDpr, Grid, OrbitControls, PerformanceMonitor, Stars } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { useState } from "react";
import * as THREE from "three";
import Trajectory from "./Trajectory";
import { TRAJECTORY_COLORS, type TrajectoryBuffer } from "@/lib/useLorenzSim";

interface LorenzSceneProps {
  buffers: [TrajectoryBuffer, TrajectoryBuffer, TrajectoryBuffer];
}

// El atractor de Lorenz (valores canónicos) ocupa aprox. x,y en [-20,20] y
// z en [0,50]; se apunta la cámara y el target de OrbitControls al centro
// aproximado (0,0,25) para que quede encuadrado por defecto.
const ATTRACTOR_CENTER: [number, number, number] = [0, 0, 25];

export default function LorenzScene({ buffers }: LorenzSceneProps) {
  // Resolución de render adaptativa: arranca en 1.5x y drei la sube/baja
  // sola (PerformanceMonitor + AdaptiveDpr) según el FPS real del
  // dispositivo, en vez de fijar dpr=2 y forzar el bloom/vignette a
  // sombrear 4x los píxeles en cualquier pantalla retina.
  const [dpr, setDpr] = useState(1.5);

  return (
    <Canvas
      camera={{ position: [72, -88, 58], fov: 50, near: 1, far: 600 }}
      gl={{
        antialias: false,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.1,
      }}
      dpr={dpr}
    >
      <PerformanceMonitor onIncline={() => setDpr(2)} onDecline={() => setDpr(1)} />
      <AdaptiveDpr pixelated />

      <color attach="background" args={["#030308"]} />
      <fog attach="fog" args={["#030308", 140, 340]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[60, 60, 100]} intensity={0.5} color="#9fb4ff" />
      <pointLight position={[0, 0, 25]} intensity={40} distance={140} color="#6d8bff" />

      <Stars radius={220} depth={80} count={1500} factor={2.2} saturation={0} fade speed={0.4} />

      <Grid
        position={[0, 0, -18]}
        rotation={[Math.PI / 2, 0, 0]}
        args={[10, 10]}
        cellSize={4}
        cellThickness={0.5}
        cellColor="#1c2540"
        sectionSize={20}
        sectionThickness={1}
        sectionColor="#2b3a66"
        fadeDistance={140}
        fadeStrength={1.5}
        infiniteGrid
      />

      {buffers.map((buf, i) => (
        <Trajectory key={i} buffer={buf} color={TRAJECTORY_COLORS[i]} />
      ))}

      <OrbitControls
        target={ATTRACTOR_CENTER}
        enableDamping
        dampingFactor={0.08}
        minDistance={20}
        maxDistance={260}
      />

      <EffectComposer multisampling={0}>
        <Bloom
          mipmapBlur
          intensity={0.9}
          luminanceThreshold={0.25}
          luminanceSmoothing={0.25}
          radius={0.7}
        />
        <Vignette eskil={false} offset={0.15} darkness={0.9} />
      </EffectComposer>
    </Canvas>
  );
}
