import Link from "next/link";

const cards = [
  {
    title: "Atra Fundamenta",
    kicker: "Economic Foundation",
    href: "/atrafundamenta",
    body: "Placeholder for the economic data foundation.",
  },
  {
    title: "Night Signal",
    kicker: "Macro",
    href: "/night-signal",
    body: "Macro regime and pressure view.",
  },
  {
    title: "Night Stalker",
    kicker: "Market Structure",
    href: "/night-stalker",
    body: "Structure and degradation view.",
  },
  {
    title: "Night Vector",
    kicker: "Directional Pressure",
    href: "/night-vector",
    body: "Directional pressure view.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#030407] px-5 py-6 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-2xl border border-white/10 bg-zinc-950/75 p-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.30em] text-blue-300">
            Atra Vigil
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
            System Dashboard
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-400">
            Current public website surface. Atra Fundamenta is a placeholder only until its data view is wired.
          </p>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-2">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              prefetch={false}
              className="rounded-2xl border border-white/10 bg-zinc-950/70 p-5 transition hover:border-blue-400/40 hover:bg-zinc-900/70"
            >
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-300">
                {card.kicker}
              </div>
              <div className="mt-2 text-lg font-semibold text-white">
                {card.title}
              </div>
              <div className="mt-2 text-sm leading-6 text-zinc-400">
                {card.body}
              </div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
