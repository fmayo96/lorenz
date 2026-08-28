import TeX from "./TeX";
import type { LorenzParams } from "@/lib/lorenz";

interface EquationsPanelProps {
  params: LorenzParams;
}

export default function EquationsPanel({ params }: EquationsPanelProps) {
  const { sigma, rho, beta } = params;

  return (
    <section className="space-y-3">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
        Sistema de Lorenz (1963)
      </h2>
      <div className="space-y-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-neutral-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
        <TeX display className="block" math={String.raw`\dot{x} = \sigma\,(y - x)`} />
        <TeX display className="block" math={String.raw`\dot{y} = x\,(\rho - z) - y`} />
        <TeX display className="block" math={String.raw`\dot{z} = x y - \beta z`} />
      </div>
      <p className="text-[13px] text-neutral-500">
        Valores actuales:{" "}
        <TeX math={String.raw`\sigma = ${sigma.toFixed(2)}`} />
        {", "}
        <TeX math={String.raw`\rho = ${rho.toFixed(2)}`} />
        {", "}
        <TeX math={String.raw`\beta = ${beta.toFixed(3)}`} />.
      </p>
    </section>
  );
}
