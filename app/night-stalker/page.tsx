"use client";

import { useEffect, useState } from "react";

const getScoreColor = (val: number) => {
  if (val === null || val === undefined) return "text-zinc-300";

  if (val >= 75) return "text-red-400";
  if (val >= 60) return "text-amber-400";
  return "text-emerald-400";
};

const getStalkerState = (val: number) => {
  if (val === null || val === undefined) return "--";
  if (val < 40) return "Stable";
  if (val < 60) return "Neutral";
  if (val < 75) return "Fragile";
  return "Critical";
};

export default function NightStalkerPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("https://script.google.com/macros/s/AKfycbzK8wLNQT92AXsnRmnnytWHA3pi6gmujinQoL_gTZg7MUZS8b8_enlK0zszufKHiaDw/exec");

        const text = await res.text();

        if (!text.startsWith("{")) {
          console.error("Invalid JSON response:", text);
          return;
        }

        const json = JSON.parse(text);
        setData(json.nightStalker);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, []);

  if (!data) {
    return <div className="min-h-screen bg-black p-6 text-zinc-500">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-mono px-6 py-8">
      <div className="max-w-3xl mx-auto space-y-6">

        <div>
          <a href="/private" className="text-sm text-zinc-400 hover:text-white">
            ← Dashboard
          </a>
        </div>

        <div className="flex items-center gap-4">
          <img
            src="/Stalker.png"
            alt="Night Stalker"
            className="h-24 w-24 object-contain"
          />

          <div>
            <div className={`text-2xl font-semibold ${getScoreColor(data.score)}`}>
  {getStalkerState(data.score)}
</div>
            <div className="text-sm text-zinc-400">
  Composite State
</div>
          </div>
        </div>

        <div className="border-t border-zinc-800"></div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-white">LR (LIQUIDITY RESILIENCY)</span>
            <span className={getScoreColor(data.lr)}>
              {data.lr?.toFixed(1)}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-white">CG (CORRELATION GRIP)</span>
            <span className={getScoreColor(data.cg)}>
              {data.cg?.toFixed(1)}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-white">TS (TAIL SYNCHRONIZATION)</span>
            <span className={getScoreColor(data.ts)}>
              {data.ts?.toFixed(2)}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}