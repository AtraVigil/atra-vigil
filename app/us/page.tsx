"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Asset = {
  key: string;
  name: string;
  symbol: string;
  group: "Major Tape" | "Volatility";
  sourceLabel: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  previousClose: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  dataAgeMinutes: number | null;
  dataSource: string;
  dataStatus: string;
  dataTone: "green" | "amber" | "red" | "neutral";
  changeTone: "green" | "red" | "neutral";
};

type UsMarketPayload = {
  ok: boolean;
  updatedAt: string;
  error?: string;
  marketStatus: {
    isOpen: boolean;
    label: string;
    tone: "green" | "amber" | "red";
    detail: string;
    exchangeTimeZone: string;
  };
  assets: Asset[];
};

const GROUPS: Asset["group"][] = ["Major Tape", "Volatility"];

function formatNumber(value: number | null, digits = 2) {
  if (value === null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function formatSigned(value: number | null, digits = 2) {
  if (value === null || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatNumber(value, digits)}`;
}

function toneClass(tone: string) {
  if (tone === "green") return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
  if (tone === "red") return "border-red-400/30 bg-red-400/10 text-red-200";
  if (tone === "amber") return "border-amber-400/30 bg-amber-400/10 text-amber-200";
  return "border-white/10 bg-white/5 text-zinc-300";
}

function valueClass(tone: string) {
  if (tone === "green") return "text-emerald-300";
  if (tone === "red") return "text-red-300";
  return "text-zinc-300";
}

export default function UsMarketPage() {
  const [data, setData] = useState<UsMarketPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch(`/api/us-market?v=${Date.now()}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error || `HTTP ${res.status}`);
      } else {
        setError(null);
      }
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown load error");
    }
  }

  useEffect(() => {
    load();
    const id = window.setInterval(load, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<Asset["group"], Asset[]>();
    for (const group of GROUPS) map.set(group, []);
    for (const asset of data?.assets || []) {
      map.get(asset.group)?.push(asset);
    }
    return map;
  }, [data]);

  return (
    <main className="min-h-screen bg-black px-5 py-6 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 rounded-3xl border border-white/10 bg-zinc-950/80 p-6 shadow-2xl shadow-black/30 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap gap-3 text-xs uppercase tracking-[0.24em] text-zinc-500">
              <Link href="/" className="hover:text-white">
                Atra Vigil
              </Link>
              <span>/</span>
              <span>U.S. Markets</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
              U.S. Market Command
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
              Strict no-proxy view. Only direct index symbols currently verified with your Finnhub feed are shown.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:items-end">
            <div className={`w-fit rounded-full border px-4 py-2 text-sm font-medium ${toneClass(data?.marketStatus?.tone || "neutral")}`}>
              {data?.marketStatus?.label || "Loading"}
            </div>
            <div className="text-xs text-zinc-500">
              {data?.updatedAt ? `Updated ${new Date(data.updatedAt).toLocaleString()}` : "Loading market data"}
            </div>
          </div>
        </header>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6">
          {GROUPS.map((group) => (
            <section key={group} className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5 shadow-xl shadow-black/20">
              <div className="mb-5 flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-white">{group}</h2>
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-600">
                  60s refresh
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {(grouped.get(group) || []).map((asset) => (
                  <article key={asset.key} className="rounded-2xl border border-white/10 bg-black/40 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-white">{asset.name}</div>
                        <div className="mt-1 text-xs text-zinc-500">
                          {asset.symbol} · {asset.sourceLabel}
                        </div>
                      </div>
                      <div className={`rounded-full border px-2.5 py-1 text-[11px] ${toneClass(asset.dataTone)}`}>
                        {asset.dataSource}
                      </div>
                    </div>

                    <div className="mt-6 text-3xl font-semibold tracking-tight">
                      {formatNumber(asset.price)}
                    </div>

                    <div className={`mt-2 text-sm font-medium ${valueClass(asset.changeTone)}`}>
                      {formatSigned(asset.change)} / {formatSigned(asset.changePercent)}%
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
                      <div className="rounded-xl bg-white/[0.03] p-3">
                        <div className="text-zinc-600">Open</div>
                        <div className="mt-1 text-zinc-300">{formatNumber(asset.open)}</div>
                      </div>
                      <div className="rounded-xl bg-white/[0.03] p-3">
                        <div className="text-zinc-600">Prev Close</div>
                        <div className="mt-1 text-zinc-300">{formatNumber(asset.previousClose)}</div>
                      </div>
                      <div className="rounded-xl bg-white/[0.03] p-3">
                        <div className="text-zinc-600">High</div>
                        <div className="mt-1 text-zinc-300">{formatNumber(asset.high)}</div>
                      </div>
                      <div className="rounded-xl bg-white/[0.03] p-3">
                        <div className="text-zinc-600">Low</div>
                        <div className="mt-1 text-zinc-300">{formatNumber(asset.low)}</div>
                      </div>
                    </div>

                    <div className="mt-4 text-xs text-zinc-600">
                      Data age: {asset.dataAgeMinutes === null ? "—" : `${asset.dataAgeMinutes}m`}
                    </div>
                  </article>
                ))}

                {!data && [1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-64 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
                ))}
              </div>
            </section>
          ))}
        </div>

        <footer className="mt-8 flex flex-wrap gap-4 text-xs text-zinc-600">
          <Link href="/overnight" className="hover:text-zinc-300">
            Overnight Markets
          </Link>
          <Link href="/atraprae" className="hover:text-zinc-300">
            Atra Prae V2
          </Link>
        </footer>
      </div>
    </main>
  );
}
