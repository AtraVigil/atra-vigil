"use client";

import { useEffect, useState } from "react";

export default function NightVectorPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("https://script.google.com/macros/s/AKfycbzK8wLNQT92AXsnRmnnytWHA3pi6gmujinQoL_gTZg7MUZS8b8_enlK0zszufKHiaDw/exec");
        const json = await res.json();
        setData(json.nightVector);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, []);

  if (!data) {
    return <div className="min-h-screen bg-black p-6 text-zinc-400">Loading Night Vector...</div>;
  }

  const getStateColor = (state: string) => {
    if (state.includes("Bullish")) return "text-emerald-400";
    if (state.includes("Bearish")) return "text-red-400";
    return "text-zinc-300";
  };

  const getCharacterColor = (char: string) => {
    if (char === "Expansion") return "text-emerald-300";
    if (char === "Drift") return "text-zinc-400";
    if (char === "Extended") return "text-amber-400";
    if (char === "Breakdown") return "text-red-400";
    return "text-zinc-400";
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl border border-zinc-800 bg-black p-8">
          <div className="flex items-start gap-6">
            <img
              src="/Vector.png"
              alt="Night Vector Header"
              className="h-28 w-28 flex-shrink-0 rounded-md object-contain"
            />

            <div className="min-w-0 flex-1">
              <div className="text-sm tracking-[0.18em] text-zinc-400 uppercase">
                Night Vector
              </div>

              <div className={`mt-4 text-5xl font-semibold leading-none ${getStateColor(data.state)}`}>
                {data.state}
              </div>

              <div className={`mt-3 text-2xl font-medium ${getCharacterColor(data.character)}`}>
                {data.character}
              </div>

              <div className="mt-4 text-sm text-zinc-400">
                Score: <span className="text-zinc-200">{Number(data.score).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">Macro</div>
            <div className="mt-3 text-2xl font-semibold text-zinc-100">{data.macro.label}</div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">Volatility</div>
            <div className="mt-3 text-2xl font-semibold text-zinc-100">{data.volatility.label}</div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">Price</div>
            <div className="mt-3 text-2xl font-semibold text-zinc-100">{data.price.label}</div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">Durability</div>
            <div className="mt-3 text-2xl font-semibold text-zinc-100">{data.durability.label}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">Interpretation</div>
          <div className="mt-3 text-lg leading-relaxed text-zinc-200">
            {data.state === "Mild Bullish" && data.character === "Extended" &&
              "Uptrend intact, but extended with mixed underlying support."}

            {data.state === "Bullish Vector" && data.character === "Expansion" &&
              "Broad expansion with strong underlying support."}

            {data.state === "Neutral" &&
              "No clear directional bias."}

            {data.state.includes("Bearish") &&
              "Downside pressure with weakening conditions."}
          </div>
        </div>
      </div>
    </div>
  );
}