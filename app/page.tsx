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

const formatBias = (val?: string) => {
    if (!val) return "-";

    const v = val.toLowerCase();

    if (v.includes("bull")) return "Positive";
    if (v.includes("bear")) return "Negative";
    if (v.includes("neutral")) return "Neutral";

    return val;
  };

const formatParticipation = (val?: string) => {
  if (!val) return "-";

  const v = val.toLowerCase();

  if (v.includes("strong")) return "Broad";
  if (v.includes("weak")) return "Limited";
  if (v.includes("mixed")) return "Concentrated";
  if (v.includes("narrow")) return "Limited";   // ← ADD THIS

  return val;
};

useEffect(() => {
setIsLoading(true);

fetch("https://script.google.com/macros/s/AKfycbzav0sRI-Zp9bh41Ui1VOIG3-OECAyHNiPQaRSyKm-WOIfSbWdZuDAsCmre0kCl_RrotQ/exec")
.then((res) => res.json())
.then((json) => setData(json))
.catch((err) => console.error("Fetch error:", err))
.finally(() => setIsLoading(false));

}, []);

const getColor = (val?: number) => {
  if (typeof val !== "number") return "text-zinc-400";
  if (val > 0) return "text-emerald-400";
  if (val < 0) return "text-red-400";
  return "text-zinc-400";
};

const getStateColor = (val?: string) => {
  if (!val) return "text-zinc-400";

  const v = val.toLowerCase();

  // GREEN
  if (
    v.includes("bullish") ||
    v.includes("positive") ||
    v.includes("confirmed") ||
    v.includes("supportive") ||
    v.includes("strong") ||
    v.includes("broad") ||
    v.includes("cyclical")
  ) {
    return "text-emerald-400";
  }

  // NEUTRAL
  if (
  v.includes("mixed") ||
  v.includes("neutral") ||
  v.includes("extended") ||
  v.includes("concentrated") ||
  v.includes("diverging") ||
  v.includes("indeterminate")
) {
  return "text-amber-400";
}

  // RED
  if (
    v.includes("weak") ||
    v.includes("stretched") ||
    v.includes("risk") ||
    v.includes("reactive") ||
    v.includes("limited") ||
    v.includes("defensive")
  ) {
    return "text-red-400";
  }

  return "text-zinc-400";
};

const getVixColor = (val?: number) => {
  if (typeof val !== "number") return "text-zinc-400";
if (val < 15) return "text-emerald-400";
if (val < 22) return "text-amber-400";
return "text-red-400";
};
const getBreadthColor = (val?: string) => {
  const v = formatParticipation(val)?.toLowerCase();
  if (!v) return "text-zinc-400";
  if (v.includes("broad")) return "text-emerald-400";
  if (v.includes("concentrated")) return "text-amber-400";
  if (v.includes("limited")) return "text-red-400";
  return "text-zinc-400";
};

const getLeadershipColor = (val?: string) => {
  if (!val) return "text-zinc-400";

  const v = val.toLowerCase();

  if (v.includes("defensive")) return "text-red-400";
  if (v.includes("cyclical")) return "text-amber-400";
  if (v.includes("mixed")) return "text-amber-400";

  return "text-zinc-400";
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

const getAtraColor = (val?: string) => {
  if (!val) return "text-zinc-400";

  const v = val.toLowerCase();

  if (v.includes("favorable")) return "text-emerald-400";
  if (v.includes("neutral")) return "text-amber-400";
  if (v.includes("defensive")) return "text-red-400";

  return "text-zinc-400";
};
return ( <main className="min-h-screen bg-black text-white p-4 md:p-8"> <div className="max-w-7xl mx-auto">
{/* HEADER */} <header className="mb-6 border-b border-zinc-800 pb-4"> <div className="relative h-32 w-full mb-3 overflow-hidden rounded-lg"> <img
        src="/header-final.png"
        alt="Atra Vigil Header"
        className="absolute inset-0 h-full w-full object-cover opacity-70"
      /> <div className="absolute inset-0 bg-black/30" /> </div>


  <div className="flex justify-center">
  <nav className="flex flex-wrap justify-end gap-4 text-sm md:text-base uppercase tracking-[0.12em]">
</nav>
  </div>
</header>

{/* STATUS */}
<section className="grid grid-cols-1 gap-4 mb-6">
  <div className="rounded-lg border border-zinc-800 p-4 md:p-5">
    <p className="text-sm font-semibold text-zinc-400">SYSTEM STATUS</p>
    <p
      className={`mt-1 text-xl font-semibold uppercase ${
        isLoading ? "text-amber-400 animate-pulse" : "text-emerald-400"
      }`}
    >
      {isLoading ? "Loading" : "Online"}
    </p>
  </div>

{/* OPERATIONAL STATE */}
<section className="mb-6">
  <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-6 text-center">
    
    <p className="text-xs uppercase tracking-[0.22em] text-zinc-500 mb-3">
      Operational State
    </p>

    <p className={`text-5xl md:text-7xl font-semibold tracking-tight ${getAtraColor((data as any)?.operationalState)}`}>
      {formatValue((data as any)?.operationalState)}
    </p>

    <p className="mt-3 text-sm text-zinc-600">
      Market Condition Classification
    </p>

  </div>
</section>

{/* CORE COMPONENTS */}
<section className="mb-6">
  <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">

    <p className="text-sm uppercase tracking-widest text-zinc-400 mb-4">
      Core Components
    </p>

    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">

      {/* MOTUS */}
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-600 mb-2">
          Motus
        </p>
        <p className={`text-lg font-semibold ${getStateColor((data as any)?.components?.motus)}`}>
          {formatBias((data as any)?.components?.motus)}
        </p>
      </div>

      {/* CONCORDIA */}
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-600 mb-2">
          Concordia
        </p>
        <p className={`text-lg font-semibold ${getStateColor((data as any)?.components?.concordia)}`}>
          {formatValue((data as any)?.components?.concordia)}
        </p>
      </div>

      {/* CUSTODIA */}
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-600 mb-2">
          Custodia
        </p>
        <p className={`text-2xl font-semibold ${getStateColor((data as any)?.components?.custodia)}`}>
  {formatValue((data as any)?.components?.custodia)}
</p>
      </div>

      {/* AXIS */}
      <div>
        <p className="text-xs uppercase tracking-widest text-zinc-500 mb-1">
          Axis
        </p>
        <p className={`text-lg font-semibold ${getStateColor((data as any)?.components?.axis)}`}>
  {formatValue((data as any)?.components?.axis)}
</p>
      </div>

    </div>

  </div>
</section>

{/* OBSERVED FORWARD BEHAVIOR */}
<section className="mb-6">
  <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">

    <p className="text-xs uppercase tracking-[0.20em] text-zinc-500 mb-5">
      Observed Forward Behavior (Historical)
    </p>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">

      {/* NEXT DAY */}
      <div>
        <p className="text-zinc-300 font-semibold mb-1">Next Day</p>
        <p>Win Rate: --</p>
        <p>Avg Return: --</p>
      </div>

      {/* 3 DAY */}
      <div>
        <p className="text-zinc-300 font-semibold mb-1">3-Day</p>
        <p>Drift: --</p>
        <p>Volatility: --</p>
      </div>

      {/* TAIL RISK */}
      <div>
        <p className="text-zinc-300 font-semibold mb-1">Tail Risk</p>
        <p>--</p>
      </div>

    </div>

  </div>
</section>
</section>

{/* MARKET SNAPSHOT ONLY */}
<section className="mb-6">
  <div className="rounded-lg border border-zinc-800 p-5">
    <h2 className="mb-4 font-semibold">Current Market State</h2>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
      <div>
        <p className="mb-2 text-base font-semibold text-zinc-300">
          🇺🇸 United States Indices
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
        <p className="mb-2 text-base font-semibold text-zinc-300">
          🌐 International Indices
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