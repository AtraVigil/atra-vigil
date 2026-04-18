"use client";

import { useEffect, useState } from "react";

type AtraData = {
  status: string;
  operationalState: string;
  components: {
    motus: string;
    concordia: string;
    custodia: string;
    axis: string;
  };
};

export default function Home() {
  const [data, setData] = useState<AtraData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("https://script.google.com/macros/s/AKfycbzav0sRI-Zp9bh41Ui1VOIG3-OECAyHNiPQaRSyKm-WOIfSbWdZuDAsCmre0kCl_RrotQ/exec")
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <header className="mb-6 border-b border-zinc-800 pb-4">
          <div className="relative h-32 w-full mb-3 overflow-hidden rounded-lg">
            <img
              src="/header-final.png"
              alt="Atra Vigil Header"
              className="absolute inset-0 h-full w-full object-cover opacity-70"
            />
            <div className="absolute inset-0 bg-black/30" />
          </div>
        </header>

        {/* STATUS + OPERATIONAL */}
        <section className="mb-8">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">

            {/* TOP ROW */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-[14px] uppercase tracking-[0.25em] text-zinc-500 mb-1">
                  System Status
                </p>
                <p className={`text-lg font-semibold ${
                  isLoading ? "text-amber-400" : "text-emerald-400"
                }`}>
                  {isLoading ? "Loading" : "Online"}
                </p>
              </div>

              <div className="text-right">
                <p className="text-[14px] uppercase tracking-[0.25em] text-zinc-500 mb-1">
                  Framework
                </p>
                <p className="text-sm text-zinc-400">
                  Atra Vigil
                </p>
              </div>
            </div>

            {/* DIVIDER */}
            <div className="h-px bg-zinc-800 mb-6" />

            {/* OPERATIONAL STATE */}
            <div className="text-center">
              <p className="text-[14px] uppercase tracking-[0.25em] text-blue-400 mb-3">
                Market Operational State
              </p>

              <p
                className={`text-6xl md:text-4xl font-semibold tracking-tight
                ${
                  data?.operationalState === "Favorable"
                    ? "text-emerald-300 bg-gradient-to-r from-emerald-300 via-green-400 to-emerald-500 drop-shadow-[0_0_16px_rgba(34,197,94,0.6)]"
                    : data?.operationalState === "Mixed"
                    ? "text-amber-300 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 drop-shadow-[0_0_16px_rgba(251,191,36,0.6)]"
                    : data?.operationalState === "Unfavorable"
                    ? "text-red-300 bg-gradient-to-r from-red-300 via-red-500 to-red-600 drop-shadow-[0_0_16px_rgba(239,68,68,0.6)]"
                    : "text-white"
                }
                bg-clip-text text-transparent`}
              >
                {isLoading ? "--" : data?.operationalState}
              </p>
            </div>

            {/* COMPONENTS (INTEGRATED) */}
            <div className="mt-8 pt-5 border-t border-zinc-800">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">

                <div>
                  <p className="text-blue-400 text-xs tracking-[0.18em] mb-1">Direction</p>
                  <p className="text-white text-lg">
                    {isLoading ? "--" : data?.components?.motus}
                  </p>
                </div>

                <div>
                  <p className="text-blue-400 text-xs tracking-[0.18em] mb-1">Alignment</p>
                  <p className="text-white text-lg">
                    {isLoading ? "--" : data?.components?.concordia}
                  </p>
                </div>

                <div>
                  <p className="text-blue-400 text-xs tracking-[0.18em] mb-1">Stability</p>
                  <p className="text-white text-lg">
                    {isLoading ? "--" : data?.components?.custodia}
                  </p>
                </div>

                <div>
                  <p className="text-blue-400 text-xs tracking-[0.18em] mb-1">Structure</p>
                  <p className="text-white text-lg">
                    {isLoading ? "--" : data?.components?.axis}
                  </p>
                </div>

              </div>
            </div>

          </div>
        </section>

{/* HISTORICAL BEHAVIOR */}
<section className="mb-8">
  <div className="border border-zinc-800 bg-black p-6">

    <div className="mb-6">
      <p className="text-[14px] uppercase tracking-[0.25em] text-violet-400 text-center">
        HISTORICAL Behavior
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-center">

      <div>
        <p className="text-violet-500 mb-2">Next Day</p>
        <p className="text-white">Win Rate: --</p>
        <p className="text-white">Avg Return: --</p>
      </div>

      <div>
        <p className="text-violet-500 mb-2">3-Day</p>
        <p className="text-white">Drift: --</p>
        <p className="text-white">Volatility: --</p>
      </div>

      <div>
        <p className="text-violet-500 mb-2">Tail Risk</p>
        <p className="text-white">--</p>
      </div>

    </div>

  </div>
</section>

      </div>
    </main>
  );
}