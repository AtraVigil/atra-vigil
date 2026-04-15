"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

type RiskItem = {
live?: number;
change?: number;
score?: string;
};

type AtraData = {
  status: string;
  lastRefresh: string;
  market: {
    dow?: number;
    nasdaq?: number;
    sp500?: number;
    russell?: number;
    nikkei?: number;
    hangSeng?: number;
    ftse?: number;
    dax?: number;

    dowChange?: number;
    nasdaqChange?: number;
    sp500Change?: number;
    russellChange?: number;
    nikkeiChange?: number;
    hangSengChange?: number;
    ftseChange?: number;
    daxChange?: number;
  };
  risk: {
    vix?: RiskItem;
    vvix?: RiskItem;
    hyg?: RiskItem;
    tlt?: RiskItem;
    breadth?: {
      live?: number;
    };
    usdjpy?: RiskItem;
  };
  structure: {
    spy?: {
      live?: number;
      change?: number;
    };
    rsp?: {
      live?: number;
      change?: number;
    };
    breadth?: {
      live?: number;
      score?: string;
    };
    alignmentState?: string;
    leadershipState?: string;
  };
};
export default function Home() {
const [data, setData] = useState<AtraData | null>(null);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
setIsLoading(true);

```
fetch("https://script.google.com/macros/s/AKfycbzK8wLNQT92AXsnRmnnytWHA3pi6gmujinQoL_gTZg7MUZS8b8_enlK0zszufKHiaDw/exec")
  .then((res) => res.json())
  .then((json) => setData(json))
  .catch((err) => console.error("Fetch error:", err))
  .finally(() => setIsLoading(false));
```

}, []);

const getColor = (val?: number) => {
if (typeof val !== "number") return "text-zinc-400";
if (val > 0) return "text-emerald-400";
if (val < 0) return "text-red-400";
return "text-zinc-400";
};

const getStateColor = (val?: string) => {
if (!val) return "text-zinc-400";

```
const v = val.toLowerCase();

if (
  v.includes("bullish") ||
  v.includes("positive") ||
  v.includes("confirmed") ||
  v.includes("supportive") ||
  v.includes("strong")
) {
  return "text-emerald-400";
}

if (
  v.includes("mixed") ||
  v.includes("neutral") ||
  v.includes("extended")
) {
  return "text-yellow-300";
}

if (
  v.includes("weak") ||
  v.includes("stretched") ||
  v.includes("risk") ||
  v.includes("reactive")
) {
  return "text-red-400";
}

return "text-zinc-400";
```

};

const formatPct = (val?: number) => {
if (typeof val !== "number") return "--";
return `${val > 0 ? "+" : ""}${(val * 100).toFixed(2)}%`;
};

const formatValue = (val?: string | number) => {
if (val === null || val === undefined || val === "") return "--";
return val;
};

const formatRiskLive = (val?: number) => {
if (typeof val !== "number") return "--";
return val;
};

const formatRiskScore = (val?: string) => {
if (!val) return "--";
return val;
};

return ( <main className="min-h-screen bg-black text-white p-4 md:p-8"> <div className="max-w-7xl mx-auto">
{/* HEADER */} <header className="mb-6 border-b border-zinc-800 pb-4"> <div className="relative h-32 w-full mb-3 overflow-hidden rounded-lg"> <img
           src="/header-final.png"
           alt="Atra Vigil Header"
           className="absolute inset-0 h-full w-full object-cover opacity-70"
         /> <div className="absolute inset-0 bg-black/30" /> </div>

```
      <div className="flex justify-end">
        <nav className="flex flex-wrap justify-end gap-4 text-sm md:text-base uppercase tracking-[0.12em]">

          <Link href="/night-vector" className="text-yellow-200/85 transition-colors hover:text-yellow-100">
            Night Vector
          </Link>

          <Link href="/night-signal" className="text-sky-200/85 transition-colors hover:text-sky-100">
            Night Signal
          </Link>

          <span className="cursor-default text-orange-300/85 transition-colors hover:text-orange-200">
            Night Stalker
          </span>

          <a href="/sectors" className="text-zinc-300/85 transition-colors hover:text-zinc-100">
            Sectors
          </a>
        </nav>
      </div>
    </header>

    {/* SIGNAL STRIP */}
    <section className="mb-6">
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 md:p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div>
            <p className="text-xs uppercase tracking-widest text-zinc-500 mb-1">
              Night Vector
            </p>
            <p className={`text-xl md:text-2xl font-semibold ${getStateColor((data as any)?.nightVector?.state)}`}>
              {formatValue((data as any)?.nightVector?.state)}
            </p>
            <p className={`text-sm ${getStateColor((data as any)?.nightVector?.character)}`}>
              {formatValue((data as any)?.nightVector?.character)}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-zinc-500 mb-1">
              Night Signal
            </p>
            <p className={`text-xl md:text-2xl font-semibold ${getStateColor((data as any)?.nightSignal?.alignment)}`}>
              {formatValue((data as any)?.nightSignal?.alignment)}
            </p>
            <p className={`text-sm ${getStateColor((data as any)?.nightSignal?.alignmentStrength)}`}>
              {formatValue((data as any)?.nightSignal?.alignmentStrength)}
            </p>
          </div>

        </div>
      </div>
    </section>
```


        {/* STATUS */}
        <section className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2">
          <div className="rounded-lg border border-zinc-800 p-4 md:p-5">
            <p className="text-sm font-medium text-zinc-400">SYSTEM STATUS</p>
            <p
              className={`mt-1 text-xl font-semibold uppercase ${
                isLoading ? "text-amber-400 animate-pulse" : "text-emerald-400"
              }`}
            >
              {isLoading ? "Loading" : "Online"}
            </p>
          </div>

          <div className="rounded-lg border border-zinc-800 p-4 md:p-5">
            <p className="text-sm font-medium text-zinc-400">LAST REFRESH</p>
            <p className="mt-1 text-xl font-medium">
              {data?.lastRefresh ? new Date(data.lastRefresh).toLocaleString() : "--"}
            </p>
          </div>
        </section>

        {/* MARKET STRUCTURE */}
        <section className="mb-6">
          <div className="rounded-lg border border-zinc-800 p-5">
            <h2 className="mb-4 text-xl md:text-2xl font-semibold text-zinc-100 tracking-wide">
              Market Structure
            </h2>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 md:p-4">
                <p className="text-sm font-medium text-zinc-400">SPY</p>
                <p className="mt-1 text-xl md:text-2xl font-bold">
                  {formatRiskLive(data?.structure?.spy?.live)}
                </p>
                <p className={getColor(data?.structure?.spy?.change)}>
                  {formatPct(data?.structure?.spy?.change)}
                </p>
              </div>

              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 md:p-4">
                <p className="text-sm font-medium text-zinc-400">RSP</p>
                <p className="mt-1 text-xl md:text-2xl font-bold">
                  {formatRiskLive(data?.structure?.rsp?.live)}
                </p>
                <p className={getColor(data?.structure?.rsp?.change)}>
                  {formatPct(data?.structure?.rsp?.change)}
                </p>
              </div>

              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 md:p-4">
                <p className="text-sm font-medium text-zinc-400">Breadth</p>
                <p className="mt-1 text-xl md:text-2xl font-bold">
                  {formatPct(data?.structure?.breadth?.live)}
                </p>
                <p className="mt-1 text-sm font-semibold text-zinc-300">
                  {formatRiskScore(data?.structure?.breadth?.score)}
                </p>
              </div>

              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 md:p-4">
                <p className="text-sm font-medium text-zinc-400">Alignment State</p>
                <p className="mt-1 text-xl md:text-2xl font-bold text-zinc-100">
                  {formatValue(data?.structure?.alignmentState)}
                </p>
              </div>

              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 md:p-4">
                <p className="text-sm font-medium text-zinc-400">Leadership State</p>
                <p className="mt-1 text-xl md:text-2xl font-bold text-zinc-100">
                  {formatValue(data?.structure?.leadershipState)}
                </p>
              </div>
            </div>
          </div>
        </section>

      {/* MARKET SNAPSHOT ONLY */}
<section className="mb-6">
  <div className="rounded-lg border border-zinc-800 p-5">
    <h2 className="mb-4 text-2xl md:text-3xl font-semibold text-zinc-100 tracking-wide">
      Market Snapshot
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
      <div>
        <p className="mb-2 text-base font-medium text-zinc-300">
          🇺🇸 United States
        </p>
        <div className="space-y-1 text-sm">
          <p>
            Dow: {formatValue(data?.market?.dow)}{" "}
            <span className={getColor(data?.market?.dowChange)}>
              {formatPct(data?.market?.dowChange)}
            </span>
          </p>
          <p>
            Nasdaq: {formatValue(data?.market?.nasdaq)}{" "}
            <span className={getColor(data?.market?.nasdaqChange)}>
              {formatPct(data?.market?.nasdaqChange)}
            </span>
          </p>
          <p>
            S&amp;P: {formatValue(data?.market?.sp500)}{" "}
            <span className={getColor(data?.market?.sp500Change)}>
              {formatPct(data?.market?.sp500Change)}
            </span>
          </p>
          <p>
            Russell: {formatValue(data?.market?.russell)}{" "}
            <span className={getColor(data?.market?.russellChange)}>
              {formatPct(data?.market?.russellChange)}
            </span>
          </p>
        </div>
      </div>

      <div>
        <p className="mb-2 text-base font-medium text-zinc-300">
          Global
        </p>
        <div className="space-y-1 text-sm">
          <p>
            🇯🇵 Nikkei: {formatValue(data?.market?.nikkei)}{" "}
            <span className={getColor(data?.market?.nikkeiChange)}>
              {formatPct(data?.market?.nikkeiChange)}
            </span>
          </p>
          <p>
            🇭🇰 Hang Seng: {formatValue(data?.market?.hangSeng)}{" "}
            <span className={getColor(data?.market?.hangSengChange)}>
              {formatPct(data?.market?.hangSengChange)}
            </span>
          </p>
          <p>
            🇬🇧 FTSE: {formatValue(data?.market?.ftse)}{" "}
            <span className={getColor(data?.market?.ftseChange)}>
              {formatPct(data?.market?.ftseChange)}
            </span>
          </p>
          <p>
            🇩🇪 DAX: {formatValue(data?.market?.dax)}{" "}
            <span className={getColor(data?.market?.daxChange)}>
              {formatPct(data?.market?.daxChange)}
            </span>
          </p>
        </div>
      </div>
    </div>
  </div>
</section>

        {/* DISCLAIMER */}
        <section className="border-t border-zinc-800 pt-4">
          <p className="text-sm text-zinc-500">
            This dashboard is for informational and educational purposes only and does not constitute financial advice, investment advice, or a recommendation to buy or sell any security.
          </p>
        </section>
      </div>
    </main>
  );
}