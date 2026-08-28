"use client";

import { CANONICAL_PARAMS } from "@/lib/lorenz";

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  formatValue: (v: number) => string;
}

function Slider({ label, value, min, max, step, onChange, formatValue }: SliderProps) {
  return (
    <label className="block space-y-1.5">
      <div className="flex items-center justify-between text-[13px]">
        <span className="text-neutral-400">{label}</span>
        <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 font-mono text-[12px] tabular-nums text-sky-200">
          {formatValue(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="glow-slider w-full"
      />
    </label>
  );
}

interface ParameterControlsProps {
  sigma: number;
  onSigma: (v: number) => void;
  rho: number;
  onRho: (v: number) => void;
  beta: number;
  onBeta: (v: number) => void;
  speed: number;
  onSpeed: (v: number) => void;
  deltaExponent: number;
  onDeltaExponent: (v: number) => void;
  playing: boolean;
  onTogglePlaying: () => void;
  onReset: () => void;
  onCanonical: () => void;
}

export default function ParameterControls({
  sigma,
  onSigma,
  rho,
  onRho,
  beta,
  onBeta,
  speed,
  onSpeed,
  deltaExponent,
  onDeltaExponent,
  playing,
  onTogglePlaying,
  onReset,
  onCanonical,
}: ParameterControlsProps) {
  return (
    <section className="space-y-5">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
        Parámetros
      </h2>

      <div className="space-y-4">
        <Slider
          label="σ · Prandtl"
          value={sigma}
          min={0}
          max={50}
          step={0.5}
          onChange={onSigma}
          formatValue={(v) => v.toFixed(1)}
        />
        <Slider
          label="ρ · Rayleigh normalizado"
          value={rho}
          min={0}
          max={60}
          step={0.5}
          onChange={onRho}
          formatValue={(v) => v.toFixed(1)}
        />
        <Slider
          label="β · razón geométrica"
          value={beta}
          min={0}
          max={10}
          step={0.05}
          onChange={onBeta}
          formatValue={(v) => v.toFixed(2)}
        />
      </div>

      <div className="space-y-4 border-t border-white/[0.08] pt-4">
        <Slider
          label="Velocidad · pasos RK4/frame"
          value={speed}
          min={1}
          max={60}
          step={1}
          onChange={onSpeed}
          formatValue={(v) => `${v}`}
        />
        <Slider
          label="Separación inicial δ"
          value={deltaExponent}
          min={-7}
          max={-2}
          step={0.5}
          onChange={onDeltaExponent}
          formatValue={(v) => `10^${v.toFixed(1)}`}
        />
      </div>

      <div className="flex flex-wrap gap-2 border-t border-white/[0.08] pt-4">
        <button
          type="button"
          onClick={onTogglePlaying}
          className="rounded-full bg-gradient-to-b from-sky-400 to-sky-600 px-4 py-1.5 text-[13px] font-medium text-neutral-950 shadow-[0_0_16px_rgba(56,189,248,0.45)] transition hover:shadow-[0_0_22px_rgba(56,189,248,0.7)] active:scale-95"
        >
          {playing ? "Pausar" : "Reanudar"}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-[13px] font-medium text-neutral-200 transition hover:bg-white/[0.08] active:scale-95"
        >
          Reiniciar trayectorias
        </button>
        <button
          type="button"
          onClick={onCanonical}
          className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-[13px] font-medium text-neutral-200 transition hover:bg-white/[0.08] active:scale-95"
          title={`σ=${CANONICAL_PARAMS.sigma}, ρ=${CANONICAL_PARAMS.rho}, β=${CANONICAL_PARAMS.beta.toFixed(3)}`}
        >
          Valores canónicos
        </button>
      </div>
    </section>
  );
}
