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
  <div className="min-h-screen bg-black text-zinc-100 px-6 py-10">
    <div className="mx-auto max-w-3xl space-y-8">

      {/* HEADER */}
      <div className="rounded-2xl border border-zinc-800 bg-black p-8">
        <div className="flex items-center gap-6">
          
          <img
            src="/Vector.png"
            alt="Night Vector"
            className="h-20 w-20 object-contain"
          />

          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
              Night Vector
            </div>

            <div className={`mt-2 text-4xl font-semibold ${getStateColor(data.state)}`}>
              {data.state}
            </div>

            <div className={`mt-1 text-lg ${getCharacterColor(data.character)}`}>
              {data.character}
            </div>

            <div className="mt-2 text-sm text-zinc-400">
              Score: {Number(data.score).toFixed(2)}
            </div>
          </div>

        </div>
      </div>

      {/* FACTORS */}
      <div className="rounded-2xl border border-zinc-800 bg-black p-6 space-y-4">

        <div className="flex justify-between">
          <span className="text-zinc-500">Macro</span>
          <span className="text-zinc-200">{data.macro.label}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-zinc-500">Volatility</span>
          <span className="text-zinc-200">{data.volatility.label}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-zinc-500">Price</span>
          <span className="text-zinc-200">{data.price.label}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-zinc-500">Durability</span>
          <span className="text-zinc-200">{data.durability.label}</span>
        </div>

      </div>

      {/* INTERPRETATION */}
      <div className="rounded-2xl border border-zinc-800 bg-black p-6">
        <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">
          Interpretation
        </div>

        <div className="mt-3 text-base text-zinc-300 leading-relaxed">
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