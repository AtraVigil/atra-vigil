"use client";

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

          <section className="mt-8 overflow-hidden border-y border-white/[0.08] py-10 sm:py-12">
            <div className="grid items-center gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-12">
              <div className="max-w-xl">
                <div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.32em] text-blue-400">
                  Global Coverage
                </div>
                <h2 className="font-serif text-4xl leading-[0.98] tracking-[-0.035em] text-[#f2f4f7] sm:text-5xl lg:text-[3.7rem]">
                  Global Market Coverage
                </h2>
                <p className="mt-5 max-w-lg text-sm leading-7 text-[#8290a3] sm:text-[15px]">
                  Asia-Pacific, Europe, U.S., economic research tools, and protected research access.
                </p>
              </div>

              <div className="relative min-h-[250px] overflow-hidden sm:min-h-[290px] lg:min-h-[330px]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_42%,rgba(8,124,255,0.16),transparent_30%),radial-gradient(circle_at_42%_58%,rgba(10,132,255,0.10),transparent_35%)]" />
                <svg
                  viewBox="0 0 900 420"
                  role="img"
                  aria-label="Abstract global market connectivity map"
                  className="absolute inset-0 h-full w-full"
                >
                  <defs>
                    <linearGradient id="mapFade" x1="0" x2="1">
                      <stop offset="0%" stopColor="#02070d" stopOpacity="0" />
                      <stop offset="28%" stopColor="#07111f" stopOpacity=".55" />
                      <stop offset="100%" stopColor="#07111f" stopOpacity=".95" />
                    </linearGradient>
                    <filter id="softBlue">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <rect width="900" height="420" fill="url(#mapFade)" />
                  <g fill="#0b1f34" stroke="#173554" strokeWidth="1.1" opacity=".9">
                    <path d="M96 132l46-34 69 4 39 28 54 8 27 40-27 31-57 8-31 40-62-9-23-32-44-10-31-36z" />
                    <path d="M333 116l34-28 39 8 18 29-11 37 25 28-28 21-48-11-22-32z" />
                    <path d="M408 210l44-12 37 24 8 44-17 53-26 54-32-17-13-54-29-33z" />
                    <path d="M486 112l41-18 54 12 36-9 52 19 48-3 42 29-7 39-48 20-24 43-53 5-42 36-47-10-17-47-39-18-12-38z" />
                    <path d="M680 278l45-8 37 16 35-4 29 21-17 26-61 9-52-12-25-26z" />
                  </g>
                  <g fill="none" stroke="#0a84ff" strokeWidth="1.5" opacity=".48" filter="url(#softBlue)">
                    <path d="M183 173Q350 72 527 151" />
                    <path d="M183 173Q438 251 720 301" />
                    <path d="M386 139Q518 97 665 166" />
                    <path d="M462 250Q545 172 665 166" />
                    <path d="M527 151Q638 214 720 301" />
                  </g>
                  <g fill="#0a84ff" filter="url(#softBlue)">
                    <circle cx="183" cy="173" r="4.8" />
                    <circle cx="386" cy="139" r="4.2" />
                    <circle cx="462" cy="250" r="4.5" />
                    <circle cx="527" cy="151" r="4.8" />
                    <circle cx="665" cy="166" r="5.2" />
                    <circle cx="720" cy="301" r="4.4" />
                  </g>
                </svg>
                <div className="absolute inset-y-0 left-0 w-[32%] bg-gradient-to-r from-[#030407] via-[#030407]/65 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 h-[30%] bg-gradient-to-t from-[#030407] to-transparent" />
              </div>
            </div>
          </section>

          <section className="mt-8">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {[
                {
                  number: "01",
                  title: "Asia-Pacific Markets",
                  description: "Indexes, rates, currencies, and regional reference data.",
                  href: "/overnight",
                  link: "Explore Asia-Pacific",
                  accent: "blue",
                  icon: "AP",
                  capabilities: ["Equity indexes", "Interest rates", "Currencies", "Reference data"],
                  scene: "asia",
                },
                {
                  number: "02",
                  title: "European Markets",
                  description: "Regional indexes, rates, and market reference data.",
                  href: "/overnight",
                  link: "Explore Europe",
                  accent: "blue",
                  icon: "EU",
                  capabilities: ["Equity indexes", "Interest rates", "Currencies", "Reference data"],
                  scene: "europe",
                },
                {
                  number: "03",
                  title: "United States",
                  description: "U.S. markets, policy, and economic reference data.",
                  href: "/us",
                  link: "Explore United States",
                  accent: "blue",
                  icon: "US",
                  capabilities: ["Equity indexes", "Interest rates", "Economic indicators", "Reference data"],
                  scene: "us",
                },
                {
                  number: "04",
                  title: "Economic Research Tools",
                  description: "Trackers, workbooks, and reference materials.",
                  href: "/atralectio",
                  link: "Explore Tools",
                  accent: "blue",
                  icon: "▥",
                  capabilities: ["Economic condition trackers", "Interactive data tables", "Workbooks and templates", "Reference materials"],
                  scene: "tools",
                },
                {
                  number: "05",
                  title: "Atra Optio",
                  description: "Protected research environment, datasets, and reports.",
                  href: "/optio",
                  link: "Learn About Atra Optio",
                  accent: "violet",
                  icon: "◇",
                  capabilities: ["Protected research access", "Datasets and reference data", "Reports and documentation", "Methodology references"],
                  scene: "optio",
                },
              ].map((card) => {
                const violet = card.accent === "violet";
                const accentText = violet ? "text-violet-300" : "text-blue-300";
                const accentBorder = violet ? "border-violet-400/35" : "border-blue-400/30";
                const accentBg = violet ? "bg-violet-500/[0.08]" : "bg-blue-500/[0.07]";
                const linkText = violet ? "text-violet-300 group-hover:text-violet-200" : "text-blue-300 group-hover:text-blue-200";

                return (
                  <Link
                    key={card.number}
                    href={card.href}
                    prefetch={false}
                    className="group flex min-h-[620px] flex-col overflow-hidden rounded-[13px] border border-[#203044] bg-[#050a10] shadow-[0_22px_60px_rgba(0,0,0,0.28)] transition duration-200 hover:-translate-y-0.5 hover:border-[#31506f]"
                  >
                    <div className="flex items-center gap-3 px-4 pb-3 pt-4">
                      <div className={`inline-flex h-7 min-w-9 items-center justify-center rounded border px-2 font-mono text-[10px] tracking-[0.18em] ${accentBorder} ${accentBg} ${accentText}`}>
                        {card.number}
                      </div>
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] ${accentBorder} ${accentBg} ${accentText}`}>
                        {card.icon}
                      </div>
                    </div>

                    <div className="px-4">
                      <h3 className="min-h-[64px] font-serif text-[22px] leading-[1.08] tracking-[-0.02em] text-[#f0f3f6]">
                        {card.title}
                      </h3>
                      <p className="mt-3 min-h-[62px] text-[12px] leading-5 text-[#78879a]">
                        {card.description}
                      </p>
                    </div>

                    <div className="relative mt-4 h-40 overflow-hidden border-y border-white/[0.06] bg-[#07101a]">
                      {card.scene === "tools" ? (
                        <div className="absolute inset-0 p-4">
                          <div className="grid h-full grid-cols-[1.3fr_.7fr] gap-2">
                            <div className="rounded border border-blue-400/15 bg-black/20 p-2">
                              <div className="mb-2 flex gap-1">
                                <span className="h-1.5 w-8 rounded-full bg-blue-400/30" />
                                <span className="h-1.5 w-5 rounded-full bg-white/10" />
                              </div>
                              <div className="flex h-[78%] items-end gap-1.5">
                                {[24, 42, 34, 61, 48, 76, 66].map((height, i) => (
                                  <span key={i} className="flex-1 rounded-t-sm border-t border-blue-300/30 bg-blue-500/10" style={{ height: `${height}%` }} />
                                ))}
                              </div>
                            </div>
                            <div className="grid gap-2">
                              <div className="rounded border border-blue-400/15 bg-black/20 p-2">
                                <div className="h-2 w-8 rounded-full bg-blue-400/25" />
                                <div className="mt-3 h-px bg-white/10" />
                                <div className="mt-2 h-px bg-white/10" />
                                <div className="mt-2 h-px bg-white/10" />
                              </div>
                              <div className="rounded border border-blue-400/15 bg-black/20 p-2">
                                <div className="h-8 w-8 rounded-full border-[3px] border-blue-400/30 border-r-blue-300/80" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : card.scene === "optio" ? (
                        <>
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_28%,rgba(139,92,246,0.24),transparent_32%),linear-gradient(160deg,#07101a_18%,#0b1020_55%,#04060b_100%)]" />
                          <div className="absolute bottom-0 left-[-8%] h-[74%] w-[70%] rotate-[-9deg] bg-[linear-gradient(145deg,transparent_0_38%,rgba(71,85,105,0.35)_39_42%,rgba(30,41,59,0.5)_43_58%,transparent_59%)]" />
                          <div className="absolute bottom-[-4%] right-[-3%] h-[80%] w-[78%] rotate-[8deg] bg-[linear-gradient(145deg,transparent_0_34%,rgba(124,58,237,0.25)_35_37%,rgba(30,41,59,0.55)_38_54%,transparent_55%)]" />
                        </>
                      ) : (
                        <>
                          <div className="absolute inset-0 bg-[linear-gradient(180deg,#08131f_0%,#050b12_62%,#020408_100%)]" />
                          <div className="absolute inset-x-0 bottom-0 flex h-[68%] items-end gap-[3px] px-3">
                            {[34, 54, 43, 71, 49, 79, 61, 88, 58, 72, 46, 64, 39, 57].map((height, i) => (
                              <span
                                key={i}
                                className="flex-1 border-t border-blue-300/10 bg-[linear-gradient(180deg,rgba(18,53,84,0.82),rgba(3,12,21,0.9))]"
                                style={{ height: `${height}%` }}
                              />
                            ))}
                          </div>
                          <svg viewBox="0 0 320 100" className="absolute inset-x-0 bottom-[22%] h-20 w-full" aria-hidden="true">
                            <path
                              d={card.scene === "asia" ? "M0 68 C38 58, 52 76, 88 55 S140 36, 175 50 S228 28, 320 21" : card.scene === "europe" ? "M0 63 C42 71, 72 48, 106 57 S164 29, 202 42 S248 30, 320 17" : "M0 70 C40 69, 72 44, 108 51 S162 56, 197 34 S252 39, 320 18"}
                              fill="none"
                              stroke="#0a84ff"
                              strokeWidth="1.6"
                              opacity=".72"
                            />
                          </svg>
                          {card.scene === "europe" ? <div className="absolute right-[12%] top-[24%] h-10 w-px bg-amber-200/20" /> : null}
                        </>
                      )}
                      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#050a10] to-transparent" />
                    </div>

                    <div className="flex flex-1 flex-col px-4 pb-4 pt-4">
                      <div className="space-y-3">
                        {card.capabilities.map((item) => (
                          <div key={item} className="flex items-start gap-2.5 text-[11px] leading-4 text-[#9aa7b6]">
                            <span className={`mt-[1px] inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[9px] ${accentBorder} ${accentText}`}>
                              ✓
                            </span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>

                      <div className={`mt-auto flex items-center justify-between border-t border-white/[0.07] pt-4 text-[11px] font-medium ${linkText}`}>
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
