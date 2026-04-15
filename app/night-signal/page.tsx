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

        <div>
          <a href="/" className="text-sm text-zinc-400 hover:text-white">
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
            <div className="text-2xl font-semibold text-white">
              {data.alignment}
            </div>

            <div className="text-sm text-zinc-400">
              Night Signal
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}