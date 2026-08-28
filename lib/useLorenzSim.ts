"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FIXED_DT, perturbedInitialStates, rk4Step, type LorenzParams, type State } from "./lorenz";

export const TRAJECTORY_COLORS = ["#ff3d81", "#2effc0", "#3fa9ff"] as const;

// Capacidad "visible" de la estela y margen de amortiguación: el buffer real
// tiene CAPACITY + MARGIN puntos; al llenarse se descartan de golpe los
// MARGIN puntos más viejos (copyWithin), en vez de desplazar de a uno, para
// que el costo de mantener la estela quede amortizado en el tiempo.
const CAPACITY = 4000;
const MARGIN = 200;
const BUFFER_SIZE = CAPACITY + MARGIN;

export class TrajectoryBuffer {
  readonly positions = new Float32Array(BUFFER_SIZE * 3);
  length = 0;
  current: State;

  constructor(initial: State) {
    this.current = initial;
    this.push(initial);
  }

  push(s: State) {
    if (this.length >= BUFFER_SIZE) {
      this.positions.copyWithin(0, MARGIN * 3, this.length * 3);
      this.length -= MARGIN;
    }
    const i = this.length * 3;
    this.positions[i] = s[0];
    this.positions[i + 1] = s[1];
    this.positions[i + 2] = s[2];
    this.length += 1;
    this.current = s;
  }

  reset(s: State) {
    this.length = 0;
    this.push(s);
  }
}

type Buffers = [TrajectoryBuffer, TrajectoryBuffer, TrajectoryBuffer];

export interface LorenzSimInput extends LorenzParams {
  delta: number;
  stepsPerFrame: number;
  playing: boolean;
}

export interface LorenzSim {
  buffers: Buffers;
  reset: (delta: number) => void;
}

function createBuffers(delta: number): Buffers {
  const [a, b, c] = perturbedInitialStates(delta);
  return [new TrajectoryBuffer(a), new TrajectoryBuffer(b), new TrajectoryBuffer(c)];
}

/**
 * Corre la integración RK4 de las 3 trayectorias en un loop de
 * requestAnimationFrame propio (independiente del loop de render de r3f).
 * Los parámetros reactivos (sigma/rho/beta/velocidad/play-pausa) entran como
 * argumentos del hook y éste los sincroniza a sus propios refs internos: así
 * quien lo consume nunca necesita escribir directamente en un ref devuelto
 * por el hook.
 */
export function useLorenzSim({ sigma, rho, beta, delta, stepsPerFrame, playing }: LorenzSimInput): LorenzSim {
  const paramsRef = useRef<LorenzParams>({ sigma, rho, beta });
  const stepsPerFrameRef = useRef(stepsPerFrame);
  const playingRef = useRef(playing);

  // Los 3 buffers viven en un valor de estado inicializado una sola vez
  // (nunca se llama al setter): da una identidad estable sin necesidad de
  // leer un ref durante el render.
  const [buffers] = useState<Buffers>(() => createBuffers(delta));

  const reset = useCallback(
    (d: number) => {
      const [a, b, c] = perturbedInitialStates(d);
      buffers[0].reset(a);
      buffers[1].reset(b);
      buffers[2].reset(c);
    },
    [buffers],
  );

  useEffect(() => {
    paramsRef.current = { sigma, rho, beta };
  }, [sigma, rho, beta]);

  useEffect(() => {
    stepsPerFrameRef.current = stepsPerFrame;
  }, [stepsPerFrame]);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  // Cambiar sigma/rho/beta reinicia las 3 trayectorias: si no, la estela
  // mezclaría dinámica de dos regímenes distintos y confundiría la lectura.
  // `delta` se lee del closure a propósito, sin disparar el reset por sí solo.
  useEffect(() => {
    reset(delta);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sigma, rho, beta, reset]);

  useEffect(() => {
    let raf = 0;
    let cancelled = false;

    const tick = () => {
      if (playingRef.current) {
        const params = paramsRef.current;
        const steps = stepsPerFrameRef.current;
        for (let s = 0; s < steps; s++) {
          for (const buf of buffers) {
            buf.push(rk4Step(buf.current, FIXED_DT, params));
          }
        }
      }
      if (!cancelled) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [buffers]);

  return useMemo(() => ({ buffers, reset }), [buffers, reset]);
}
