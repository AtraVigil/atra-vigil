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
    return <div className="min-h-screen bg-black p-6 text-zinc-500">Loading...</div>;
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

  const getValueColor = (val: string) => {
    if (!val) return "text-white";

    const v = val.toLowerCase();

    if (["supportive", "confirmed", "stable"].some(x => v.includes(x)))
      return "text-emerald-400";

    if (["mixed", "neutral"].some(x => v.includes(x)))
      return "text-amber-400";

    if (["weak", "stretched", "hostile"].some(x => v.includes(x)))
      return "text-red-400";

    return "text-white";
  };

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-mono px-6 py-8">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex items-center gap-4">
          <img
            src="/Vector.png"
            alt="Night Vector"
            className="h-12 w-12 object-contain"
          />

          <div>
            <div className="text-xs text-white tracking-widest">
              NIGHT_VECTOR
            </div>

            <div className={`text-2xl font-semibold ${getStateColor(data.state)}`}>
              {data.state}
            </div>

            <div className={`text-sm ${getCharacterColor(data.character)}`}>
              {data.character}
            </div>

            <div className="text-xs text-white mt-1">
              SCORE {Number(data.score).toFixed(2)}
            </div>
          </div>
        </div>

        {/* DIVIDER */}
        <div className="border-t border-zinc-800"></div>

        {/* FACTORS */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-white">MACRO</span>
            <span className={getValueColor(data.macro.label)}>
              {data.macro.label}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-white">VOLATILITY</span>
            <span className={getValueColor(data.volatility.label)}>
              {data.volatility.label}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-white">PRICE</span>
            <span className={getValueColor(data.price.label)}>
              {data.price.label}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-white">DURABILITY</span>
            <span className={getValueColor(data.durability.label)}>
              {data.durability.label}
            </span>
          </div>
        </div>

        {/* DIVIDER */}
        <div className="border-t border-zinc-800"></div>

        {/* INTERPRETATION */}
        <div className="text-sm leading-relaxed">
          <div className="text-white mb-1 tracking-widest">
            INTERPRETATION
          </div>

          <div>
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