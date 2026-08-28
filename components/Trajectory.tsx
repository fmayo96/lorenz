"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { TrajectoryBuffer } from "@/lib/useLorenzSim";

interface TrajectoryProps {
  buffer: TrajectoryBuffer;
  color: string;
}

// Se usan líneas "gordas" (LineSegments2/LineMaterial, geometría de
// triángulos) en vez del THREE.Line nativo: los GL_LINES nativos quedan
// fijos en ~1px de dispositivo y casi ningún driver WebGL los antialiasea
// vía MSAA, así que en mobile (iPhone) se ven pixelados sin importar el
// dpr o el multisampling del EffectComposer. Al ser triángulos normales,
// sí se benefician del multisampling y se ven nítidos.
export default function Trajectory({ buffer, color }: TrajectoryProps) {
  const groupRef = useRef<THREE.Group>(null);
  const lineRef = useRef<LineSegments2 | null>(null);
  const instanceBufferRef = useRef<THREE.InstancedInterleavedBuffer | null>(null);
  const segmentsRef = useRef<Float32Array | null>(null);
  const markerRef = useRef<THREE.Mesh>(null);
  // Cuántos puntos ya subimos a la GPU: permite subir sólo los segmentos
  // nuevos de cada frame en vez de reconstruir todo el buffer, que es el
  // costo real dominante con estelas de miles de puntos.
  const uploadedLengthRef = useRef(0);

  useEffect(() => {
    const group = groupRef.current;
    const maxPoints = buffer.positions.length / 3;
    // Cada segmento son 2 puntos consecutivos (xyz, xyz): un buffer de N
    // puntos tiene N-1 segmentos.
    const segments = new Float32Array(Math.max(0, maxPoints - 1) * 6);
    segmentsRef.current = segments;

    const geometry = new LineSegmentsGeometry();
    const instanceBuffer = new THREE.InstancedInterleavedBuffer(segments, 6, 1);
    geometry.setAttribute("instanceStart", new THREE.InterleavedBufferAttribute(instanceBuffer, 3, 0));
    geometry.setAttribute("instanceEnd", new THREE.InterleavedBufferAttribute(instanceBuffer, 3, 3));
    geometry.instanceCount = 0;
    instanceBufferRef.current = instanceBuffer;

    const material = new LineMaterial({
      color,
      linewidth: 1.6,
      worldUnits: false,
      transparent: true,
      opacity: 0.9,
      alphaToCoverage: true,
    });
    material.toneMapped = false;

    const line = new LineSegments2(geometry, material);
    line.frustumCulled = false;

    lineRef.current = line;
    uploadedLengthRef.current = 0;
    group?.add(line);

    return () => {
      group?.remove(line);
      geometry.dispose();
      material.dispose();
      lineRef.current = null;
      instanceBufferRef.current = null;
      segmentsRef.current = null;
    };
  }, [buffer, color]);

  useFrame(() => {
    const line = lineRef.current;
    const segments = segmentsRef.current;
    const instanceBuffer = instanceBufferRef.current;
    if (line && segments && instanceBuffer) {
      const currentLength = buffer.length;
      const uploadedLength = uploadedLengthRef.current;
      if (currentLength !== uploadedLength) {
        const positions = buffer.positions;
        // Rango de segmentos a reescribir: normalmente sólo los nuevos al
        // final, pero si el buffer se recortó (copyWithin) o se reinició,
        // las posiciones sobrevivientes cambiaron de lugar y hay que
        // reescribir todos los segmentos activos.
        const fromSeg = currentLength < uploadedLength ? 0 : Math.max(0, uploadedLength - 1);
        const toSeg = Math.max(0, currentLength - 1);

        for (let i = fromSeg; i < toSeg; i++) {
          const base = i * 6;
          const p0 = i * 3;
          const p1 = p0 + 3;
          segments[base] = positions[p0];
          segments[base + 1] = positions[p0 + 1];
          segments[base + 2] = positions[p0 + 2];
          segments[base + 3] = positions[p1];
          segments[base + 4] = positions[p1 + 1];
          segments[base + 5] = positions[p1 + 2];
        }

        instanceBuffer.clearUpdateRanges();
        instanceBuffer.addUpdateRange(fromSeg * 6, (toSeg - fromSeg) * 6);
        instanceBuffer.needsUpdate = true;

        line.geometry.instanceCount = toSeg;
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
