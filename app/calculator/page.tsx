"use client";

import { useMemo, useState } from "react";

const syringeOptions = [
  { label: "1 mL (100 units)", unitsPerMl: 100 },
  { label: "0.5 mL (50 units)", unitsPerMl: 50 },
  { label: "0.3 mL (30 units)", unitsPerMl: 30 },
];

function toPositiveNumber(value: string, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

export default function CalculatorPage() {
  const [doseMg, setDoseMg] = useState("1");
  const [vialMg, setVialMg] = useState("10");
  const [waterMl, setWaterMl] = useState("1");
  const [unitsPerMl, setUnitsPerMl] = useState(100);

  const result = useMemo(() => {
    const safeDose = toPositiveNumber(doseMg, 1);
    const safeVial = toPositiveNumber(vialMg, 10);
    const safeWater = toPositiveNumber(waterMl, 1);

    const concentrationMgPerMl = safeVial / safeWater;
    const drawMl = safeDose / concentrationMgPerMl;
    const syringeUnits = drawMl * unitsPerMl;
    const totalDoses = safeVial / safeDose;

    return {
      concentrationMgPerMl,
      drawMl,
      syringeUnits,
      totalDoses,
    };
  }, [doseMg, vialMg, waterMl, unitsPerMl]);

  return (
    <div className="space-y-8 pb-12">
      <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-10">
        <p className="section-kicker">Research tool</p>
        <h1 className="section-title mt-2">Peptide reconstitution calculator</h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Calculate draw volume and syringe units from dose, vial strength, and bacteriostatic water volume.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-xl font-semibold text-slate-900">Inputs</h2>
          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Dose (mg)</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={doseMg}
                onChange={(event) => setDoseMg(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:border-sky-400"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Vial strength (mg)
              </span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={vialMg}
                onChange={(event) => setVialMg(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:border-sky-400"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Bacteriostatic water (mL)
              </span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={waterMl}
                onChange={(event) => setWaterMl(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:border-sky-400"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Syringe type</span>
              <select
                value={unitsPerMl}
                onChange={(event) => setUnitsPerMl(Number(event.target.value))}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:border-sky-400"
              >
                {syringeOptions.map((option) => (
                  <option key={option.unitsPerMl} value={option.unitsPerMl}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-xl font-semibold text-slate-900">Results</h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Draw volume</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{result.drawMl.toFixed(3)} mL</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Syringe units</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{result.syringeUnits.toFixed(1)} units</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Concentration</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {result.concentrationMgPerMl.toFixed(2)} mg/mL
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Estimated doses</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">{result.totalDoses.toFixed(1)}</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
            <p className="font-semibold uppercase tracking-[0.16em]">Notice</p>
            <p className="mt-1">
              This tool is for laboratory planning only and does not provide medical or treatment guidance.
            </p>
          </div>
        </article>
      </section>
    </div>
  );
}

