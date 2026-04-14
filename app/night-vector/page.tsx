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
    return <div className="p-6 text-zinc-400">Loading Night Vector...</div>;
  }

  const getStateColor = (state: string) => {
    if (state.includes("Bullish")) return "text-green-400";
    if (state.includes("Bearish")) return "text-red-400";
    return "text-zinc-300";
  };

  const getCharacterColor = (char: string) => {
    if (char === "Expansion") return "text-green-300";
    if (char === "Drift") return "text-zinc-400";
    if (char === "Extended") return "text-yellow-400";
    if (char === "Breakdown") return "text-red-400";
    return "text-zinc-400";
  };

  return (
    <div className="p-6 space-y-6 bg-black text-zinc-100">
   {/* Header Image */}
   
      {/* Header */}
      <div className="border border-zinc-800 rounded-lg p-6">
        
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-lg">Night Vector</h1>

          <img
  src="/Vector.png"
  alt="Night Vector Header"
  className="h-16 w-auto object-contain"
/>
        </div>

        <div className={`text-3xl font-semibold ${getStateColor(data.state)}`}>
          {data.state}
        </div>

        <div className={`text-sm mt-2 ${getCharacterColor(data.character)}`}>
          {data.character}
        </div>

        <div className="text-xs text-zinc-400 mt-2">
          Score: {data.score}
        </div>
      </div>

      {/* Core Factors */}
      <div className="border border-zinc-800 rounded-lg p-6 grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-zinc-400">Macro</div>
          <div>{data.macro.label}</div>
        </div>

        <div>
          <div className="text-zinc-400">Volatility</div>
          <div>{data.volatility.label}</div>
        </div>

        <div>
          <div className="text-zinc-400">Price</div>
          <div>{data.price.label}</div>
        </div>

        <div>
          <div className="text-zinc-400">Durability</div>
          <div>{data.durability.label}</div>
        </div>
      </div>

      {/* Interpretation */}
      <div className="border border-zinc-800 rounded-lg p-6 text-sm text-zinc-300">
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
  );
}