import Link from "next/link";

export default function AtraFundamentaPage() {
  return (
    <main className="min-h-screen bg-[#030407] px-5 py-6 text-white sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5">
          <Link
            href="/"
            prefetch={false}
            className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400 hover:border-blue-400/40 hover:text-white"
          >
            ← Back
          </Link>
        </div>

        <section className="rounded-2xl border border-white/10 bg-zinc-950/75 p-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.30em] text-blue-300">
            Atra Fundamenta
          </div>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
            Economic Foundation
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-400">
            Placeholder page for Atra Fundamenta. This section will be used for the economic data foundation once the website view is ready.
          </p>

          <div className="mt-6 rounded-xl border border-dashed border-white/15 bg-black/20 p-5 text-sm leading-6 text-zinc-400">
            Status: placeholder only. No live data is wired on this page yet.
          </div>
        </section>
      </div>
    </main>
  );
}
