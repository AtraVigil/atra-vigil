"use client";

import { useEffect, useState } from "react";

const getSignalColor = (val: string | number) => {
  if (val === null || val === undefined) return "text-zinc-300";

  const v = String(val).toLowerCase();

  if (["positive", "strong", "aligned positive"].some(x => v.includes(x)))
    return "text-emerald-400";

  if (["mixed", "moderate", "neutral"].some(x => v.includes(x)))
    return "text-amber-400";

  if (["negative", "weak", "diverging"].some(x => v.includes(x)))
    return "text-red-400";

  return "text-zinc-300";
};

export default function NightSignalPage() {
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
        setData(json.nightSignal);
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
            src="/Signal.png"
            alt="Night Signal"
            className="h-24 w-24 object-contain"
          />

          <div>
            <div className={`text-2xl font-semibold ${getSignalColor(data.alignment)}`}>
              {data.alignment}
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-800"></div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-white">OVERSEAS STATE</span>
            <span className={getSignalColor(data.overseas.state)}>
              {data.overseas.state}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-white">OVERSEAS STRENGTH</span>
            <span className={getSignalColor(data.overseas.strength)}>
              {data.overseas.strength}
            </span>
          </div>
        </div>

        <div className="border-t border-zinc-800"></div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-white">U.S. STATE</span>
            <span className={getSignalColor(data.us.state)}>
              {data.us.state}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-white">U.S. STRENGTH</span>
            <span className={getSignalColor(data.us.strength)}>
              {data.us.strength}
            </span>
          </div>
        </div>

        <div className="border-t border-zinc-800"></div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-white">ALIGNMENT STRENGTH</span>
            <span className={getSignalColor(data.alignmentStrength)}>
              {data.alignmentStrength}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}