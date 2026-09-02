"use client";

import React, { useEffect, useState } from "react";

type Sector = {
  live?: number;
  last?: number;
  direction?: string;
  aligned?: string;
  type?: string;
};

type Data = {
  sectors?: {
    materials?: Sector;
    energy?: Sector;
    financials?: Sector;
    industrials?: Sector;
    technology?: Sector;
    consumerStaples?: Sector;
    utilities?: Sector;
    healthcare?: Sector;
    consumerDiscretionary?: Sector;
    communicationServices?: Sector;
    realEstate?: Sector;
  };
};

export default function SectorsPage() {
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    fetch("https://script.google.com/macros/s/AKfycbzK8wLNQT92AXsnRmnnytWHA3pi6gmujinQoL_gTZg7MUZS8b8_enlK0zszufKHiaDw/exec")
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error(err));
  }, []);

  const sectors = data?.sectors;

  const sectorCards: [string, Sector | undefined][] = [
    ["Materials", sectors?.materials],
    ["Energy", sectors?.energy],
    ["Financials", sectors?.financials],
    ["Industrials", sectors?.industrials],
    ["Technology", sectors?.technology],
    ["Consumer Staples", sectors?.consumerStaples],
    ["Utilities", sectors?.utilities],
    ["Health Care", sectors?.healthcare],
    ["Consumer Discretionary", sectors?.consumerDiscretionary],
    ["Communication Services", sectors?.communicationServices],
    ["Real Estate", sectors?.realEstate],
  ];

  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-semibold">Sectors</h1>
          <a href="/private" className="text-sm text-zinc-400 hover:text-zinc-100">
            ← Dashboard
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sectorCards.map(([name, s]) => {
            const directionColor =
              s?.direction === "Up"
                ? "text-emerald-400"
                : s?.direction === "Down"
                ? "text-red-400"
                : "text-zinc-400";

            return (
              <div
                key={name}
                className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 hover:border-zinc-600 transition"
              >
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-zinc-400">{name}</p>
                  <p className="text-xs text-zinc-500">{s?.type || "--"}</p>
                </div>

                <p className="text-3xl font-bold tracking-tight">
                  {typeof s?.live === "number" ? s.live.toFixed(2) : "--"}
                </p>

                <div className="flex justify-between text-sm mt-2">
                  <span className="text-zinc-400">
                    Last: {typeof s?.last === "number" ? s.last.toFixed(2) : "--"}
                  </span>
                  <span className={directionColor}>{s?.direction || "--"}</span>
                </div>

                <div className="mt-3 text-xs text-zinc-500">
                  Alignment: {s?.aligned || "--"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}