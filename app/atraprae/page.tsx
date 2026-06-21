export const metadata = {
  title: "Atra Prae V2 | Atra Vigil",
};

export default function AtraPraePage() {
  return (
    <main className="min-h-screen bg-black p-4 text-white md:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 border-b border-zinc-800 pb-4">
          <div className="relative mb-4 h-32 w-full overflow-hidden rounded-lg">
            <img
              src="/header-final.png"
              alt="Atra Vigil Header"
              className="absolute inset-0 h-full w-full object-cover opacity-70"
            />
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute bottom-4 left-4">
              <p className="text-[12px] uppercase tracking-[0.3em] text-blue-300">
                Atra Prae V2
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-white">
                Manual Runtime
              </h1>
            </div>
          </div>
        </header>

        <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">
          <p className="mb-2 text-[12px] uppercase tracking-[0.25em] text-blue-400">
            Candidate / 3m / WMicro Telemetry
          </p>
          <p className="text-sm text-zinc-400">
            Atra Prae V2 dashboard placeholder. The engine remains local. No keys, credentials, scheduler controls, or execution logic are stored here.
          </p>
        </section>
      </div>
    </main>
  );
}
