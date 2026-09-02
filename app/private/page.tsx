"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const splashId = window.setTimeout(() => {
      setShowSplash(false);
    }, 850);

    return () => window.clearTimeout(splashId);
  }, []);


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



          <section className="mt-8 pb-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {[
                {
                  number: "01",
                  short: "AP",
                  title: "Asia-Pacific",
                  description: "Asia-Pacific equity index coverage.",
                  capability: "Equity Indexes",
                  href: "/overnight?region=asia-pacific",
                  link: "Explore Asia-Pacific",
                  protected: false,
                },
                {
                  number: "02",
                  short: "EU",
                  title: "Europe",
                  description: "European equity index coverage.",
                  capability: "Equity Indexes",
                  href: "/overnight?region=europe",
                  link: "Explore Europe",
                  protected: false,
                },
                {
                  number: "03",
                  short: "US",
                  title: "United States",
                  description: "U.S. equity index coverage.",
                  capability: "Equity Indexes",
                  href: "/us",
                  link: "Explore United States",
                  protected: false,
                },
                {
                  number: "04",
                  short: "RT",
                  title: "Economic Research",
                  description: "Trackers, workbooks, and reference materials.",
                  capability: "Research Tools",
                  href: "/research",
                  link: "Explore Economic Research",
                  protected: false,
                },
                {
                  number: "05",
                  short: "AO",
                  title: "Atra Optio",
                  description: "Protected research environment, datasets, and reports.",
                  capability: "Protected Research",
                  href: "/optio",
                  link: "Learn About Atra Optio",
                  protected: true,
                },
              ].map((card) => {
                const isPrimaryRegionalCard = ["01", "02", "03"].includes(card.number);
                const accent = card.protected ? "violet" : "blue";
                const badge = accent === "violet"
                  ? "border-violet-400/35 bg-violet-500/[0.07] text-violet-300"
                  : "border-blue-400/30 bg-blue-500/[0.06] text-blue-300";
                const capability = accent === "violet"
                  ? "border-violet-400/30 text-violet-200"
                  : "border-blue-400/30 text-blue-200";
                const link = accent === "violet"
                  ? "text-violet-300 group-hover:text-violet-200"
                  : "text-blue-300 group-hover:text-blue-200";

                return (
                  <Link
                    key={card.number}
                    href={card.href}
                    prefetch={false}
                    className="group flex min-h-[470px] flex-col overflow-hidden rounded-[14px] border border-[#203044] bg-[#050a10] shadow-[0_18px_50px_rgba(0,0,0,0.24)] transition duration-200 hover:-translate-y-0.5 hover:border-[#345574]"
                  >
                    {!isPrimaryRegionalCard ? (
                      <div className="flex items-center gap-3 px-4 pb-4 pt-4">
                        <div className={`inline-flex h-8 min-w-10 items-center justify-center rounded border px-2 font-mono text-[10px] tracking-[0.18em] ${badge}`}>
                          {card.number}
                        </div>
                        <div className={`inline-flex h-10 w-10 items-center justify-center rounded-full border font-mono text-[10px] tracking-[0.12em] ${badge}`}>
                          {card.short}
                        </div>
                      </div>
                    ) : null}

                    <div className="px-4">
                      <h3 className={`${isPrimaryRegionalCard ? "min-h-0 py-4" : "min-h-[54px]"} font-serif text-[22px] leading-[1.08] tracking-[-0.02em] text-[#f0f3f6]`}>
                        {card.title}
                      </h3>
                      {!isPrimaryRegionalCard ? (
                        <p className="mt-2 min-h-[48px] text-[12px] leading-5 text-[#78879a]">
                          {card.description}
                        </p>
                      ) : null}
                    </div>

                    {card.number === "01" ? (
                      <div className="relative mt-3 h-36 overflow-hidden border-y border-white/[0.06] bg-[#07101a]">
                        <Image
                          src="/asia-pacific-card-network.png"
                          alt="Asia-Pacific market network"
                          fill
                          sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 20vw"
                          className="object-cover object-center brightness-[1.08]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-transparent to-black/15" />
                      </div>
                    ) : card.number === "02" ? (
                      <div className="relative mt-3 h-36 overflow-hidden border-y border-white/[0.06] bg-[#07101a]">
                        <Image
                          src="/europe-card-network.png"
                          alt="Europe market network"
                          fill
                          sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 20vw"
                          className="object-cover object-center brightness-[1.04]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-transparent to-black/15" />
                      </div>
                    ) : card.number === "03" ? (
                      <div className="relative mt-3 h-36 overflow-hidden border-y border-white/[0.06] bg-[#07101a]">
                        <Image
                          src="/us-card-network.png"
                          alt="United States market network"
                          fill
                          sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 20vw"
                          className="object-cover object-center brightness-[1.02]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-transparent to-black/15" />
                      </div>
                    ) : (
                      <div className="relative mt-3 h-36 border-y border-white/[0.06] bg-[#07101a]">
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:28px_28px]" />
                        <div className="absolute bottom-3 left-4 font-mono text-[8px] uppercase tracking-[0.22em] text-[#33465a]">
                          Visual reserved
                        </div>
                      </div>
                    )}

                    <div className="flex flex-1 flex-col px-4 pb-4 pt-5">
                      <div className="flex items-center gap-2.5">
                        <span className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] ${capability}`}>
                          ✓
                        </span>
                        <span className="text-[12px] leading-5 text-[#a7b3c2]">
                          {card.capability}
                        </span>
                      </div>

                      <div className={`mt-auto flex items-center justify-between border-t border-white/[0.07] pt-4 text-[12px] font-medium ${link}`}>
                        <span>{card.link}</span>
                        <span aria-hidden="true" className="transition group-hover:translate-x-1">→</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
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
