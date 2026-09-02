import Link from "next/link";

export default function Page() {
  return (
    <main className="min-h-screen bg-black px-5 py-6 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <Link
            href="/private"
            className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-blue-200 transition hover:border-blue-400 hover:bg-blue-500/15"
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
          <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/10 to-black/50" />
        </div>

        <section className="rounded-3xl border border-blue-500/20 bg-zinc-950/80 p-8 shadow-2xl shadow-blue-950/20">
          <div className="mb-4 text-xs font-semibold uppercase tracking-[0.34em] text-blue-400">
            Protected Terminal
          </div>

          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Atra Lectio
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-400">
            Protected chart reading and market structure interface. Buildout pending.
          </p>

          <div className="mt-8 rounded-2xl border border-white/10 bg-black/35 p-5">
            <div className="text-xs uppercase tracking-[0.24em] text-zinc-600">
              Status
            </div>
            <div className="mt-2 text-lg font-medium text-blue-300">
              Shell wired. System modules not connected yet.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
