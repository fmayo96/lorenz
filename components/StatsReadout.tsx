"use client";

import { useEffect, useRef } from "react";
import { TRAJECTORY_COLORS, type TrajectoryBuffer } from "@/lib/useLorenzSim";

interface StatsReadoutProps {
  buffers: [TrajectoryBuffer, TrajectoryBuffer, TrajectoryBuffer];
}

function distance(a: readonly number[], b: readonly number[]): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/**
 * Lee `buffer.current` en un loop de rAF propio y escribe directo al DOM vía
 * refs (sin pasar por estado de React) para no forzar re-renders en cada
 * paso de integración.
 */
export default function StatsReadout({ buffers }: StatsReadoutProps) {
  const separationRef = useRef<HTMLSpanElement>(null);
  const coordRefs = [
    useRef<HTMLSpanElement>(null),
    useRef<HTMLSpanElement>(null),
    useRef<HTMLSpanElement>(null),
  ] as const;

  useEffect(() => {
    let raf = 0;
    let cancelled = false;

    const tick = () => {
      const sep = distance(buffers[0].current, buffers[2].current);
      if (separationRef.current) {
        separationRef.current.textContent = sep.toExponential(2);
      }
      buffers.forEach((buf, i) => {
        const el = coordRefs[i].current;
        if (el) {
          const [x, y, z] = buf.current;
          el.textContent = `${x.toFixed(1)}, ${y.toFixed(1)}, ${z.toFixed(1)}`;
        }
      });
      if (!cancelled) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- coordRefs son refs estables
  }, [buffers]);

  return (
    <section className="space-y-2 text-xs">
      <div className="flex items-center justify-between text-neutral-400">
        <span>Separación |traj. 1 − traj. 3|</span>
        <span ref={separationRef} className="font-mono tabular-nums text-neutral-100">
          0.00e+0
        </span>
      </div>
      <div className="space-y-1">
        {buffers.map((_, i) => (
          <div key={i} className="flex items-center gap-2 text-neutral-500">
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: TRAJECTORY_COLORS[i], boxShadow: `0 0 6px ${TRAJECTORY_COLORS[i]}` }}
            />
            <span className="w-12 shrink-0">traj. {i + 1}</span>
            <span ref={coordRefs[i]} className="font-mono tabular-nums text-neutral-300">
              0.0, 0.0, 0.0
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
