"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type TapeTone = "green" | "red" | "orange" | "blue";

type OvernightMarket = {
  key: string;
  changePercent: number | null;
};

type OvernightPayload = {
  ok: boolean;
  markets: OvernightMarket[];
};

type UsAsset = {
  key?: string;
  name: string;
  symbol: string;
  changePercent: number | null;
};

type UsPayload = {
  ok: boolean;
  assets: UsAsset[];
};

const destinations = [
  {
    key: "global",
    title: "Overnight Markets",
    eyebrow: "🌐 Global",
    href: "/overnight",
    detail: "International session monitor",
  },
  {
    key: "domestic",
    title: "U.S. Markets",
    eyebrow: "🇺🇸 United States",
    href: "/us",
    detail: "Primary U.S. index command",
  },
  {
    key: "optio",
    title: "Atra Optio",
    eyebrow: "🔒 Protected Research",
    href: "/optio",
    detail: "Live options research monitor",
  },
];

function toneText(tone: TapeTone) {
  if (tone === "green") return "text-emerald-300";
  if (tone === "red") return "text-red-300";
  if (tone === "orange") return "text-amber-300";
  return "text-blue-400";
}

function toneBorder(tone: TapeTone) {
  if (tone === "green") return "group-hover:border-emerald-400/45";
  if (tone === "red") return "group-hover:border-red-400/45";
  if (tone === "orange") return "group-hover:border-amber-400/45";
  return "group-hover:border-blue-500/50";
}

function toneDot(tone: TapeTone) {
  if (tone === "green") return "bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.45)]";
  if (tone === "red") return "bg-red-400 shadow-[0_0_18px_rgba(248,113,113,0.42)]";
  if (tone === "orange") return "bg-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.36)]";
  return "bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.55)]";
}

function statusLabel(tone: TapeTone) {
  if (tone === "green") return "Positive";
  if (tone === "red") return "Negative";
  if (tone === "orange") return "Mixed";
  return "Secured";
}

function calcGlobalTone(markets: OvernightMarket[]): TapeTone {
  let up = 0;
  let down = 0;

  for (const market of markets || []) {
    const value = market.changePercent;
    if (value === null || Number.isNaN(value)) continue;
    if (value > 0) up += 1;
    if (value < 0) down += 1;
  }

  if (up > down) return "green";
  if (down > up) return "red";
  return "orange";
}

function calcDomesticTone(assets: UsAsset[]): TapeTone {
  const sp = assets.find((asset) => {
    const name = asset.name.toLowerCase();
    const symbol = asset.symbol.toUpperCase();
    return name.includes("s&p") || symbol.includes("SPX") || symbol.includes("GSPC");
  });

  const nasdaq = assets.find((asset) => {
    const name = asset.name.toLowerCase();
    const symbol = asset.symbol.toUpperCase();
    return name.includes("nasdaq") || symbol.includes("NDX") || symbol.includes("IXIC");
  });

  const values = [sp?.changePercent, nasdaq?.changePercent].filter(
    (value): value is number => value !== null && value !== undefined && !Number.isNaN(value),
  );

  if (values.length < 2) return "orange";

  const up = values.filter((value) => value > 0).length;
  const down = values.filter((value) => value < 0).length;

  if (up === 2) return "green";
  if (down === 2) return "red";
  return "orange";
}

export default function Home() {
  const [overnightData, setOvernightData] = useState<OvernightPayload | null>(null);
  const [usData, setUsData] = useState<UsPayload | null>(null);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const splashId = window.setTimeout(() => {
      setShowSplash(false);
    }, 850);

    return () => window.clearTimeout(splashId);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadToneData() {
      try {
        const [overnightRes, usRes] = await Promise.all([
          fetch(`/api/overnight?v=${Date.now()}`, { cache: "no-store" }),
          fetch(`/api/us-market?v=${Date.now()}`, { cache: "no-store" }),
        ]);

        const [overnightJson, usJson] = await Promise.all([
          overnightRes.json(),
          usRes.json(),
        ]);

        if (!isMounted) return;

        setOvernightData(overnightJson);
        setUsData(usJson);
      } catch {
        if (!isMounted) return;
        setOvernightData(null);
        setUsData(null);
      }
    }

    loadToneData();
    const id = window.setInterval(loadToneData, 60_000);

    return () => {
      isMounted = false;
      window.clearInterval(id);
    };
  }, []);

  const cardTones = useMemo(() => {
    return {
      global: calcGlobalTone((overnightData?.markets || []).filter((market) => market.key !== "sti")),
      domestic: calcDomesticTone(usData?.assets || []),
      protected: "blue" as TapeTone,
      optio: "blue" as TapeTone,
      lectio: "blue" as TapeTone,
      dis: "blue" as TapeTone,
    };
  }, [overnightData, usData]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#030407] text-white">
      {showSplash ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
          <div className="relative w-[min(82vw,760px)]">
            <div className="absolute -inset-10 rounded-full bg-blue-500/10 blur-3xl" />
            <img
              src="/logo.png"
              alt="Atra Vigil"
              className="relative w-full object-contain opacity-95 animate-[atraSplash_850ms_ease-out_forwards]"
            />
            <div className="mx-auto mt-8 h-px w-64 overflow-hidden bg-white/10">
              <div className="h-full w-full animate-[atraLoad_850ms_ease-out_forwards] bg-blue-400" />
            </div>
          </div>
        </div>
      ) : null}

      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(37,99,235,0.24),transparent_34%),radial-gradient(circle_at_85%_72%,rgba(59,130,246,0.10),transparent_28%),radial-gradient(circle_at_15%_78%,rgba(14,165,233,0.08),transparent_30%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.024)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.024)_1px,transparent_1px)] bg-[size:72px_72px] opacity-20" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-24 bg-gradient-to-b from-blue-950/25 to-transparent" />

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center px-5 py-10 sm:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-7 flex items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-blue-300">
                Atra Vigil
              </div>
              <div className="mt-1 text-xs uppercase tracking-[0.22em] text-zinc-600">
                Market systems interface
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="https://x.com/atravigil"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Atra Vigil on X"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-zinc-400 transition hover:border-blue-400/40 hover:bg-blue-500/10 hover:text-white"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="currentColor"
                >
                  <path d="M18.244 2H21.5l-7.11 8.13L22.75 22h-6.55l-5.13-6.71L5.2 22H1.94l7.61-8.7L1.5 2h6.72l4.64 6.14L18.244 2Zm-1.14 17.91h1.8L7.24 3.98H5.31l11.794 15.93Z" />
                </svg>
              </a>

              <div className="hidden rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-zinc-500 sm:block">
                Secure Command Layer
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.7rem] border border-blue-400/15 bg-zinc-950/65 shadow-2xl shadow-blue-950/20 backdrop-blur">
            <div className="relative h-36 sm:h-44 md:h-52">
              <img
                src="/header-final.png"
                alt="Atra Vigil Header"
                className="absolute inset-0 h-full w-full object-cover opacity-95"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-black/0 to-black/35" />
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#030407] to-transparent" />
            </div>

            <div className="px-6 pb-7 pt-2 sm:px-8">
              <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <h1 className="text-3xl font-semibold uppercase tracking-[0.32em] text-zinc-100 sm:text-4xl">
                    Market Command
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
                    Central access layer for active market views and protected Atra systems.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-right">
                  <div className="text-[10px] uppercase tracking-[0.24em] text-zinc-600">
                    Refresh
                  </div>
                  <div className="mt-1 text-sm font-medium text-zinc-300">
                    60 seconds
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {destinations.map((item) => {
              const tone = cardTones[item.key as keyof typeof cardTones];

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/78 p-6 shadow-xl shadow-black/35 backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:bg-zinc-900/85 ${toneBorder(tone)}`}
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
                  <div className="mb-7 flex items-center justify-between gap-4">
                    <div className={`text-[11px] font-semibold uppercase tracking-[0.34em] ${toneText(tone)}`}>
                      {item.eyebrow}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-[0.22em] text-zinc-600">
                        {statusLabel(tone)}
                      </span>
                      <span className={`h-2.5 w-2.5 rounded-full ${toneDot(tone)}`} />
                    </div>
                  </div>

                  <div className="text-2xl font-semibold tracking-tight text-white">
                    {item.title}
                  </div>

                  <div className="mt-2 text-sm text-zinc-500">
                    {item.detail}
                  </div>

                  <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-4 text-sm text-zinc-400 transition group-hover:text-white">
                    <span>Open interface</span>
                    <span aria-hidden="true" className="transition group-hover:translate-x-1">→</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <style>{`
        @keyframes atraSplash {
          0% {
            opacity: 0;
            transform: scale(0.975);
            filter: brightness(0.7);
          }
          45% {
            opacity: 1;
            filter: brightness(1.05);
          }
          100% {
            opacity: 0;
            transform: scale(1.015);
            filter: brightness(0.95);
          }
        }

        @keyframes atraLoad {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(0%);
          }
        }
      `}</style>
    </main>
  );
}
