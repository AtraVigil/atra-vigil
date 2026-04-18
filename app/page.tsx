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
              <p className="text-[14px] uppercase tracking-[0.25em] text-zinc-500 mb-3">
                Operational State
              </p>

              <p className="text-6xl md:text-7xl font-semibold tracking-tight 
bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 
bg-clip-text text-transparent 
drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]">
                {isLoading ? "--" : data?.operationalState}
              </p>

              <p className="mt-2 text-xs text-zinc-600">
                Market Condition Classification
              </p>
            </div>

          </div>
        </section>

      </div>
    </main>
  );
}