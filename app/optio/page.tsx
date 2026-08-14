"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type OptioRow = {
  sessionDate: string;
  captureTimestampUtc: string;
  captureTimestampCt: string;
  groupName: string;
  ticker: string;
  callContracts: number | null;
  putContracts: number | null;
  putContractCount: number | null;
  putOpenInterestTotal: number | null;
  putDayVolumeTotal: number | null;
  putIvMin: number | null;
  putIvMedian: number | null;
  putIvMax: number | null;
  dataStatus: string;
  minutesSinceCapture: number | null;
  manifestAvailable: boolean;
  putContextAvailable: boolean;
};

type Payload = {
  ok: boolean;
  updatedAt?: string;
  sessionDate?: string | null;
  captureTimestampCt?: string | null;
  rows?: OptioRow[];
  error?: string;
};

const GROUP_ORDER = [
  "AI Data Center",
  "Quantum",
  "Space",
  "Uranium",
  "Infrastructure / Engineering / Construction",
  "Semiconductors",
  "Aerospace / Defense",
];

function fmt(value: number | null, digits = 0) {
  if (value === null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function pct(value: number | null) {
  if (value === null || Number.isNaN(value)) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

function statusClass(status: string) {
  if (status === "CURRENT") return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
  if (status === "STALE") return "border-amber-400/30 bg-amber-400/10 text-amber-200";
  if (status === "PARTIAL") return "border-orange-400/30 bg-orange-400/10 text-orange-200";
  return "border-red-400/30 bg-red-400/10 text-red-200";
}

export default function OptioPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch(`/api/optio-live?v=${Date.now()}`, {
        cache: "no-store",
        credentials: "same-origin",
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
    const map = new Map<string, OptioRow[]>();
    for (const group of GROUP_ORDER) map.set(group, []);
    for (const row of data?.rows || []) {
      map.get(row.groupName)?.push(row);
    }
    return map;
  }, [data]);

  const currentCount = (data?.rows || []).filter((r) => r.dataStatus === "CURRENT").length;

  return (
    <main className="min-h-screen bg-black px-5 py-6 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-blue-400/30 bg-blue-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-blue-200 transition hover:border-blue-300 hover:bg-blue-400/15"
          >
            ← Back to Market Command
          </Link>
        </div>

        <div className="relative mb-6 h-28 w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 md:h-36">
          <img
            src="/header-final.png"
            alt="Atra Vigil Header"
            className="absolute inset-0 h-full w-full object-cover opacity-75"
          />
        </div>

        <header className="mb-8 rounded-3xl border border-white/10 bg-zinc-950/80 p-6 shadow-2xl shadow-black/30">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 text-xs uppercase tracking-[0.24em] text-blue-300">
                Atra Optio
              </div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
                Live Research Monitor
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
                Current options research collection by group and ticker. Descriptive monitor only.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-600">Session</div>
                <div className="mt-1 font-medium text-zinc-200">{data?.sessionDate || "Loading"}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-600">Current</div>
                <div className="mt-1 font-medium text-zinc-200">{currentCount}/35</div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-4 text-xs text-zinc-500">
            <span>
              Capture: {data?.captureTimestampCt ? new Date(data.captureTimestampCt).toLocaleString() : "Loading"}
            </span>
            <span>Page refresh: 60 seconds</span>
            <span>Publication target: ~15 minutes</span>
          </div>
        </header>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6">
          {GROUP_ORDER.map((group) => (
            <section key={group} className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5">
              <div className="mb-5 flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-white">{group}</h2>
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-600">
                  {(grouped.get(group) || []).length}/5
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-[0.16em] text-zinc-600">
                      <th className="px-3 py-3">Ticker</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3 text-right">Calls</th>
                      <th className="px-3 py-3 text-right">Puts</th>
                      <th className="px-3 py-3 text-right">Put OI</th>
                      <th className="px-3 py-3 text-right">Put Volume</th>
                      <th className="px-3 py-3 text-right">IV Min</th>
                      <th className="px-3 py-3 text-right">IV Max</th>
                      <th className="px-3 py-3 text-right">Age</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(grouped.get(group) || []).map((row) => (
                      <tr key={row.ticker} className="border-b border-white/[0.06] last:border-b-0">
                        <td className="px-3 py-4 font-semibold text-white">{row.ticker}</td>
                        <td className="px-3 py-4">
                          <span className={`rounded-full border px-2.5 py-1 text-[11px] ${statusClass(row.dataStatus)}`}>
                            {row.dataStatus}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-right text-zinc-300">{fmt(row.callContracts)}</td>
                        <td className="px-3 py-4 text-right text-zinc-300">{fmt(row.putContracts)}</td>
                        <td className="px-3 py-4 text-right text-zinc-300">{fmt(row.putOpenInterestTotal)}</td>
                        <td className="px-3 py-4 text-right text-zinc-300">{fmt(row.putDayVolumeTotal)}</td>
                        <td className="px-3 py-4 text-right text-zinc-300">{pct(row.putIvMin)}</td>
                        <td className="px-3 py-4 text-right text-zinc-300">{pct(row.putIvMax)}</td>
                        <td className="px-3 py-4 text-right text-zinc-500">
                          {row.minutesSinceCapture === null ? "—" : `${row.minutesSinceCapture.toFixed(1)}m`}
                        </td>
                      </tr>
                    ))}

                    {!data && [1,2,3,4,5].map((i) => (
                      <tr key={i}>
                        <td colSpan={9} className="px-3 py-3">
                          <div className="h-8 animate-pulse rounded-lg bg-white/[0.03]" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>

        <footer className="mt-8 text-xs leading-6 text-zinc-600">
          Descriptive research monitor only. No scores, signals, recommendations, probabilities, or trade instructions are displayed.
        </footer>
      </div>
    </main>
  );
}
