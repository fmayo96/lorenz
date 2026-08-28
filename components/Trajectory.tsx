"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { TrajectoryBuffer } from "@/lib/useLorenzSim";

interface TrajectoryProps {
  buffer: TrajectoryBuffer;
  color: string;
}

export default function Trajectory({ buffer, color }: TrajectoryProps) {
  const groupRef = useRef<THREE.Group>(null);
  const lineRef = useRef<THREE.Line | null>(null);
  const markerRef = useRef<THREE.Mesh>(null);
  // Cuántos puntos ya subimos a la GPU: permite subir sólo los puntos nuevos
  // de cada frame (addUpdateRange) en vez de todo el buffer completo, que es
  // el costo real dominante con estelas de miles de puntos.
  const uploadedLengthRef = useRef(0);

  // La línea de estela se construye imperativamente y se agrega/quita del
  // grupo en un efecto (no durante el render). La geometría envuelve
  // directamente `buffer.positions` (un Float32Array fijo): no se recrea ni
  // se copia nada en cada frame, sólo se marca needsUpdate.
  useEffect(() => {
    const group = groupRef.current;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(buffer.positions, 3));
    geometry.setDrawRange(0, buffer.length);
    const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9, toneMapped: false });
    const line = new THREE.Line(geometry, material);
    line.frustumCulled = false;

    lineRef.current = line;
    uploadedLengthRef.current = 0;
    group?.add(line);

    return () => {
      group?.remove(line);
      geometry.dispose();
      material.dispose();
      lineRef.current = null;
    };
  }, [buffer, color]);

  useFrame(() => {
    const line = lineRef.current;
    if (line) {
      const currentLength = buffer.length;
      const uploadedLength = uploadedLengthRef.current;
      if (currentLength !== uploadedLength) {
        const attr = line.geometry.attributes.position as THREE.BufferAttribute;
        attr.clearUpdateRanges();
        if (currentLength < uploadedLength) {
          // El buffer se recortó (copyWithin) o se reinició: los puntos
          // sobrevivientes cambiaron de posición dentro del array.
          attr.addUpdateRange(0, currentLength * 3);
        } else {
          // Caso normal: sólo se agregaron puntos nuevos al final.
          attr.addUpdateRange(uploadedLength * 3, (currentLength - uploadedLength) * 3);
        }
        attr.needsUpdate = true;
        line.geometry.setDrawRange(0, currentLength);
        uploadedLengthRef.current = currentLength;
      }
    }
    if (markerRef.current) {
      markerRef.current.position.set(buffer.current[0], buffer.current[1], buffer.current[2]);
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={markerRef}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color={color} toneMapped={false} />
        <mesh>
          <sphereGeometry args={[1, 12, 12]} />
          <meshBasicMaterial color={color} toneMapped={false} transparent opacity={0.2} depthWrite={false} />
        </mesh>
      </mesh>
    </group>
  );
}
