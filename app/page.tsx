"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import EquationsPanel from "@/components/EquationsPanel";
import ParameterControls from "@/components/ParameterControls";
import StatsReadout from "@/components/StatsReadout";
import { CANONICAL_PARAMS } from "@/lib/lorenz";
import { useLorenzSim } from "@/lib/useLorenzSim";

// react-three-fiber usa APIs de navegador (WebGL, window) al montar el
// Canvas: se importa sin SSR para evitar cualquier desajuste de hidratación.
const LorenzScene = dynamic(() => import("@/components/LorenzScene"), { ssr: false });

const INITIAL_SPEED = 15;
const INITIAL_DELTA_EXPONENT = -5;

function deltaFromExponent(exponent: number): number {
  return 10 ** exponent;
}

export default function Home() {
  const [sigma, setSigma] = useState(CANONICAL_PARAMS.sigma);
  const [rho, setRho] = useState(CANONICAL_PARAMS.rho);
  const [beta, setBeta] = useState(CANONICAL_PARAMS.beta);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [deltaExponent, setDeltaExponent] = useState(INITIAL_DELTA_EXPONENT);
  const [playing, setPlaying] = useState(true);

  const delta = deltaFromExponent(deltaExponent);

  const sim = useLorenzSim({ sigma, rho, beta, delta, stepsPerFrame: speed, playing });

  const handleReset = useCallback(() => sim.reset(delta), [sim, delta]);

  const handleCanonical = useCallback(() => {
    setSigma(CANONICAL_PARAMS.sigma);
    setRho(CANONICAL_PARAMS.rho);
    setBeta(CANONICAL_PARAMS.beta);
  }, []);

  return (
    <main className="bg-neutral-950 text-neutral-100 lg:h-screen lg:overflow-hidden">
      <div className="h-[58vh] w-full lg:fixed lg:inset-0 lg:h-screen">
        <LorenzScene buffers={sim.buffers} />
      </div>

      <div className="relative z-10 lg:pointer-events-none lg:absolute lg:inset-0 lg:flex lg:items-stretch">
        <div className="panel-fade-in overflow-y-auto rounded-t-3xl border border-white/10 border-b-0 bg-neutral-950/70 p-6 shadow-2xl backdrop-blur-2xl lg:pointer-events-auto lg:my-6 lg:ml-6 lg:h-[calc(100vh-3rem)] lg:w-[400px] lg:rounded-3xl lg:border-b lg:shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
          <div className="flex flex-col gap-6">
            <header className="space-y-3">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-sky-400/20 bg-sky-400/10 px-2.5 py-1 text-[11px] font-medium tracking-wide text-sky-300">
                L63 · Lorenz (1963)
              </span>
              <h1 className="bg-gradient-to-br from-white via-white to-sky-200 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
                Atractor de Lorenz
              </h1>
              <p className="text-[13px] leading-relaxed text-neutral-400">
                Tres trayectorias con condiciones iniciales casi idénticas (separadas por δ
                en x) se integran en simultáneo con el mismo RK4 de paso fijo. La
                divergencia visible entre ellas, pese a partir de puntos casi
                indistinguibles, ilustra la dependencia sensible a las condiciones
                iniciales.
              </p>
            </header>

            <EquationsPanel params={{ sigma, rho, beta }} />

            <ParameterControls
              sigma={sigma}
              onSigma={setSigma}
              rho={rho}
              onRho={setRho}
              beta={beta}
              onBeta={setBeta}
              speed={speed}
              onSpeed={setSpeed}
              deltaExponent={deltaExponent}
              onDeltaExponent={setDeltaExponent}
              playing={playing}
              onTogglePlaying={() => setPlaying((p) => !p)}
              onReset={handleReset}
              onCanonical={handleCanonical}
            />

            <div className="border-t border-white/[0.08] pt-4">
              <StatsReadout buffers={sim.buffers} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
