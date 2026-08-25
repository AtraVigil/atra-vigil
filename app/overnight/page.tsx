"use client";

import Link from "next/link";

import { useEffect, useMemo, useState } from "react";

type DataTone = "green" | "red" | "amber";

type OvernightMarket = {
  key: string;
  name: string;
  symbol: string;
  region: string;
  flag: string;
  ok: boolean;
  error: string | null;
  isMarketOpen: boolean;
  marketStatusLabel: "Open" | "Closed" | "Holiday" | "Lunch Break";
  marketTone: DataTone;
  holidayName: string | null;
  localClock: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  previousClose: number | null;
  high: number | null;
  low: number | null;
  open: number | null;
  quoteTime: string | null;
  exchangeTime: string | null;
  quoteAgeMinutes: number | null;
  dataStatus: "open" | "closed" | "stale";
  dataStatusLabel: "Open" | "Closed" | "Stale";
  dataTone: DataTone;
};

type OvernightResponse = {
  ok: boolean;
  updatedAt: string;
  error?: string;
  markets: OvernightMarket[];
};

const EMPTY_DATA: OvernightResponse = {
  ok: false,
  updatedAt: new Date().toISOString(),
  markets: [],
};

function numberFmt(value: number | null) {
  if (value === null || Number.isNaN(value)) return "--";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

function signedFmt(value: number | null) {
  if (value === null || Number.isNaN(value)) return "--";
  const sign = value > 0 ? "+" : "";
  return `${sign}${numberFmt(value)}`;
}

function percentFmt(value: number | null) {
  if (value === null || Number.isNaN(value)) return "--";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function toneClass(value: number | null) {
  if (value === null || Number.isNaN(value)) return "text-zinc-400";
  if (value > 0) return "text-emerald-300";
  if (value < 0) return "text-red-300";
  return "text-zinc-300";
}

function statusToneClass(tone: DataTone) {
  if (tone === "green") return "text-emerald-300";
  if (tone === "red") return "text-red-300";
  return "text-amber-300";
}

function dotToneClass(tone: DataTone) {
  if (tone === "green") return "bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.45)]";
  if (tone === "red") return "bg-red-400 shadow-[0_0_14px_rgba(248,113,113,0.35)]";
  return "bg-amber-400 shadow-[0_0_14px_rgba(251,191,36,0.35)]";
}

function ageFmt(minutes: number | null) {
  if (minutes === null) return "--";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function Home() {
  const [data, setData] = useState<OvernightResponse>(EMPTY_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [lastClientRefresh, setLastClientRefresh] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);

  async function loadOvernightMarkets() {
    try {
      const res = await fetch("/api/overnight", {
        cache: "no-store",
      });

      if (!res.ok) throw new Error(`API returned ${res.status}`);

      const json = (await res.json()) as OvernightResponse;
      setData(json);
      setClientError(null);
      setLastClientRefresh(new Date().toISOString());
    } catch (err) {
      setClientError(err instanceof Error ? err.message : "Unknown overnight market error.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadOvernightMarkets();
    const interval = window.setInterval(loadOvernightMarkets, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const { positive, negative, tapeState } = useMemo(() => {
    const tapeMarkets = data.markets.filter((m) => m.key !== "sti");
    const pos = tapeMarkets.filter((m) => (m.changePercent ?? 0) > 0).length;
    const neg = tapeMarkets.filter((m) => (m.changePercent ?? 0) < 0).length;

    let state = "Mixed";
    if (pos >= 3) state = "Risk-On";
    if (neg >= 3) state = "Risk-Off";

    return { positive: pos, negative: neg, tapeState: state };
  }, [data.markets]);

  const updatedDisplay = lastClientRefresh
    ? new Date(lastClientRefresh).toLocaleString("en-US")
    : "--";

  return (
    <main className="min-h-screen bg-[#050608] text-white">

        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-400/15"
          >
            ← Back to Market Command
          </Link>
        </div>
      <div className="mx-auto max-w-7xl px-5 py-6 md:px-8">
        <header className="mb-8 border-b border-zinc-800 pb-6">
          <div className="relative mb-5 h-28 w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 md:h-36">
            <img
              src="/header-final.png"
              alt="Atra Vigil Header"
              className="absolute inset-0 h-full w-full object-cover opacity-75"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/10 to-black/50" />
          </div>

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-blue-300">Atra Vigil</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-5xl">
                Global Overnight Command
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-zinc-400">
                Live overseas index tape. Refreshes every 60 seconds while this page is open.
              </p>
            </div>

            <nav className="flex flex-wrap gap-2 text-sm">
            </nav>
          </div>
        </header>

        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">System</p>
            <p className={data.ok ? "mt-2 text-xl font-semibold text-emerald-300" : "mt-2 text-xl font-semibold text-red-300"}>
              {isLoading ? "Loading" : data.ok ? "Online" : "Degraded"}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Overnight Tape</p>
            <p className="mt-2 text-xl font-semibold text-white">{isLoading ? "--" : tapeState}</p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Advancing</p>
            <p className="mt-2 text-xl font-semibold text-emerald-300">{isLoading ? "--" : positive}</p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Declining</p>
            <p className="mt-2 text-xl font-semibold text-red-300">{isLoading ? "--" : negative}</p>
          </div>
        </section>

        {clientError || data.error ? (
          <section className="mb-6 rounded-xl border border-red-900/60 bg-red-950/20 p-4 text-sm text-red-200">
            {clientError ?? data.error}
          </section>
        ) : null}

        <section className="rounded-2xl border border-zinc-800 bg-black/40 p-5 md:p-6">
          <div className="mb-5 flex flex-col justify-between gap-2 border-b border-zinc-800 pb-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-blue-300">
                Live Overnight Markets
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Overseas Market Tape</h2>
            </div>
            <div className="text-xs text-zinc-500 md:text-right">
              <p>Refresh cadence: 60 seconds</p>
              <p>Last refresh: {updatedDisplay}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
            {data.markets.map((market) => (
              <article
                key={market.key}
                className="flex h-full min-h-[520px] flex-col rounded-xl border border-zinc-800 bg-zinc-950/80 p-5"
              >
                <div className="mb-6 flex min-h-[82px] items-start justify-between gap-3">
                  <div>
                    <p className="whitespace-nowrap text-xs uppercase tracking-[0.22em] text-zinc-500">
                      <span className="mr-2">{market.flag}</span>
                      {market.region}
                    </p>
                    <h3 className="mt-2 whitespace-nowrap text-xl font-semibold text-white">
                      {market.name}
                    </h3>
                    <p className="mt-1 text-xs text-zinc-500">{market.symbol}</p>
                  </div>

                  <div className="text-right">
                    <div className={`ml-auto h-2.5 w-2.5 rounded-full ${dotToneClass(market.marketTone)}`} />
                    <p className={`mt-3 text-xs font-semibold uppercase tracking-[0.2em] ${statusToneClass(market.dataTone)}`}>
                      {market.marketStatusLabel}
                    </p>
                  </div>
                </div>

                <p className="text-4xl font-semibold tracking-tight">{numberFmt(market.price)}</p>

                <div className="mt-3 flex items-baseline gap-3">
                  <p className={`text-lg font-semibold ${toneClass(market.changePercent)}`}>
                    {percentFmt(market.changePercent)}
                  </p>
                  <p className={`text-sm ${toneClass(market.change)}`}>
                    {signedFmt(market.change)}
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-zinc-800 pt-4 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-600">Open</p>
                    <p className="mt-1 text-zinc-300">{numberFmt(market.open)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-600">Prev Close</p>
                    <p className="mt-1 text-zinc-300">{numberFmt(market.previousClose)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-600">High</p>
                    <p className="mt-1 text-zinc-300">{numberFmt(market.high)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-600">Low</p>
                    <p className="mt-1 text-zinc-300">{numberFmt(market.low)}</p>
                  </div>
                </div>

                <div className="mt-auto border-t border-zinc-800 pt-4 text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-zinc-500">Data status</span>
                    <span className={statusToneClass(market.dataTone)}>{market.dataStatusLabel}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-zinc-500">Quote age</span>
                    <span className="text-zinc-400">{ageFmt(market.quoteAgeMinutes)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-zinc-500">Quote timestamp</span>
                    <span className="text-zinc-400">{market.exchangeTime ?? "--"}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-zinc-500">Local time</span>
                    <span className="text-zinc-400">{market.localClock}</span>
                  </div>
                  {!market.ok ? (
                    <p className="mt-3 text-red-300">{market.error ?? "Unavailable"}</p>
                  ) : null}
                </div>
              </article>
            ))}

            {!isLoading && data.markets.length === 0 ? (
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-5 text-sm text-zinc-400">
                No overnight market data returned.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
