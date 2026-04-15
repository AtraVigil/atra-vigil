"use client";

import { useEffect, useState } from "react";

export default function NightSignalPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("PASTE_YOUR_APPS_SCRIPT_URL_HERE");
        const json = await res.json();
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

      {/* BACK LINK */}
      <div>
        <a href="/" className="text-sm text-zinc-400 hover:text-white">
          ← Dashboard
        </a>
      </div>

      {/* HEADER */}
      <div className="flex items-center gap-4">
        <img
          src="/Signal.png"
          alt="Night Signal"
          className="h-24 w-24 object-contain"
        />

        <div>
          <div className="text-2xl font-semibold text-white">
            {data.alignment}
          </div>

          <div className="text-sm text-zinc-400">
            {data.alignmentStrength}
          </div>
        </div>
      </div>

      {/* DIVIDER */}
      <div className="border-t border-zinc-800"></div>

      {/* OVERSEAS */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-white">OVERSEAS STATE</span>
          <span className="text-zinc-300">
            {data.overseas.state}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-white">OVERSEAS STRENGTH</span>
          <span className="text-zinc-300">
            {data.overseas.strength}
          </span>
        </div>
      </div>

      {/* DIVIDER */}
      <div className="border-t border-zinc-800"></div>

      {/* U.S. */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-white">U.S. STATE</span>
          <span className="text-zinc-300">
            {data.us.state}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-white">U.S. STRENGTH</span>
          <span className="text-zinc-300">
            {data.us.strength}
          </span>
        </div>
      </div>

    </div>
  </div>
);
}