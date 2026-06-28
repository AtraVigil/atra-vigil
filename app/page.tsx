import Link from "next/link";

const logoUrl = "/logo.png";

const destinations = [
  {
    title: "Overnight Markets",
    eyebrow: "Global tape",
    description: "Japan, London, and Germany market command.",
    href: "/overnight",
  },
  {
    title: "U.S. Markets",
    eyebrow: "Domestic tape",
    description: "S&P 500, NASDAQ 100, Dow, Russell 2000, and VIX.",
    href: "/us",
  },
  {
    title: "Atra Prae V2",
    eyebrow: "Protected terminal",
    description: "Live Atra Prae system health, watch state, and candidate feed.",
    href: "/atraprae",
  },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div
        aria-hidden="true"
        data-mark="AV_BACKGROUND_MARK"
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
      >
        <div className="select-none text-[28vw] font-black tracking-[-0.12em] text-cyan-400/[0.035]">
          AV
        </div>
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),transparent_45%)]" />

      {logoUrl ? (
        <div
          className="atra-logo-bg pointer-events-none absolute inset-0 bg-center bg-no-repeat opacity-35"
          style={{
            backgroundImage: `url(${logoUrl})`,
            backgroundSize: "min(82vw, 900px)",
          }}
        />
      ) : (
        <div className="atra-wordmark-bg absolute inset-0 flex items-center justify-center text-5xl font-black tracking-[0.28em] text-white/10 sm:text-7xl">
          ATRA VIGIL
        </div>
      )}

      <section className="relative z-10 flex min-h-screen items-center justify-center px-6 py-16">
        <div className="w-full max-w-6xl">
          <div className="mx-auto mb-10 max-w-4xl text-center">
            <h1 className="tracking-tight">
              <span className="block text-7xl font-black tracking-[-0.07em] text-blue-300 drop-shadow-[0_0_28px_rgba(96,165,250,0.22)] sm:text-8xl md:text-9xl">
                Atra Vigil
              </span>
              <span className="mt-4 block text-xl font-semibold uppercase tracking-[0.34em] text-zinc-300 sm:text-2xl">
                Market Command
              </span>
            </h1>
            <p className="mt-5 text-sm leading-6 text-zinc-400 sm:text-base">
              Select the operating view.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {destinations.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-3xl border border-white/10 bg-zinc-950/70 p-6 shadow-2xl shadow-black/40 backdrop-blur transition hover:border-white/30 hover:bg-zinc-900/80"
              >
                <div className="text-xs uppercase tracking-[0.28em] text-zinc-500">
                  {item.eyebrow}
                </div>
                <div className="mt-5 text-2xl font-semibold text-white">
                  {item.title}
                </div>
                <p className="mt-4 min-h-12 text-sm leading-6 text-zinc-400">
                  {item.description}
                </p>
                <div className="mt-8 text-sm font-medium text-zinc-300 transition group-hover:text-white">
                  Open →
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        .atra-logo-bg {
          filter: brightness(0.30) saturate(1.15);
          animation: atraBrighten 1.75s ease-out forwards;
        }

        .atra-wordmark-bg {
          filter: brightness(0.35);
          animation: atraBrighten 1.75s ease-out forwards;
        }

        @keyframes atraBrighten {
          0% {
            opacity: 0.06;
            filter: brightness(0.18) saturate(1.05);
            transform: scale(0.985);
          }
          55% {
            opacity: 0.16;
            filter: brightness(0.45) saturate(1.10);
          }
          100% {
            opacity: 0.42;
            filter: brightness(0.95) saturate(1.22);
            transform: scale(1);
          }
        }
      `}</style>
    </main>
  );
}
