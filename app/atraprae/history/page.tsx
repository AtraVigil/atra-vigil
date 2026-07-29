import { loadAtraPraeArchiveData } from "../../../lib/atrapraeSheet";

export const metadata = {
  title: "Atra Prae History | Atra Vigil",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

function cell(value: string | undefined): string {
  return value && String(value).trim() ? String(value).trim() : "--";
}

function returnTone(value: string): string {
  const text = String(value || "").trim();
  if (text.startsWith("+")) return "text-emerald-300";
  if (text.startsWith("-")) return "text-red-300";
  return "text-zinc-300";
}

function statusPillClass(value: string): string {
  const text = String(value || "").trim().toUpperCase();
  const base = "inline-flex rounded-full border px-2 py-1 text-[11px] font-medium uppercase tracking-[0.12em]";

  if (text.includes("PASS")) {
    return `${base} border-emerald-900/60 bg-emerald-950/30 text-emerald-300`;
  }

  if (text.includes("FAIL")) {
    return `${base} border-red-900/60 bg-red-950/30 text-red-300`;
  }

  if (text.includes("ACTIVE") || text.includes("WATCH")) {
    return `${base} border-blue-900/60 bg-blue-950/30 text-blue-300`;
  }

  if (text.includes("FALLBACK") || text.includes("PENDING")) {
    return `${base} border-amber-900/60 bg-amber-950/30 text-amber-300`;
  }

  return `${base} border-zinc-800 bg-zinc-950 text-zinc-400`;
}

export default async function AtraPraeHistoryPage({
  searchParams,
}: {
  searchParams?: Promise<{ date?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const archive = await loadAtraPraeArchiveData(params?.date);
  const candidates = archive.terminal.candidateRows;

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
                Atra Prae History
              </h1>
            </div>
          </div>

          <nav className="flex flex-wrap gap-3 text-sm">
            <a
              href="/"
              className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-300 hover:text-white"
            >
              Atra Vigil
            </a>
            <a
              href="/atraprae"
              className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-300 hover:text-white"
            >
              Atra Prae Live
            </a>
            <span className="rounded-lg border border-blue-900/60 bg-blue-950/30 px-3 py-2 text-blue-300">
              Atra Prae History
            </span>
          </nav>
        </header>

        {archive.loadError ? (
          <section className="mb-6 rounded-xl border border-red-900/60 bg-red-950/20 p-5">
            <p className="text-sm text-red-300">{archive.loadError}</p>
          </section>
        ) : null}

        <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-950 p-5">
          <div className="mb-4">
            <p className="text-[12px] uppercase tracking-[0.25em] text-blue-400">
              Select Archive Date
            </p>
          </div>

          {archive.dates.length === 0 ? (
            <div className="rounded-lg border border-zinc-800 bg-black p-5 text-sm text-zinc-500">
              No archived dates found.
            </div>
          ) : (
            <form action="/atraprae/history" className="flex flex-wrap items-center gap-3">
              <select
                name="date"
                defaultValue={archive.selectedDate}
                className="min-w-48 rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white"
              >
                {archive.dates.map((date) => (
                  <option key={date} value={date}>
                    {date}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                className="rounded-lg border border-blue-900/60 bg-blue-950/30 px-4 py-2 text-sm text-blue-300 hover:text-white"
              >
                Load Date
              </button>
            </form>
          )}
        </section>

        {archive.daily ? (
          <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-950 p-5">
            <div className="mb-4">
              <p className="text-[12px] uppercase tracking-[0.25em] text-blue-400">
                Daily Summary
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-lg border border-zinc-800 bg-black p-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Session</p>
                <p className="mt-1 text-base text-white">{cell(archive.daily.sessionDate)}</p>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-black p-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Candidates</p>
                <p className="mt-1 text-base text-white">{candidates.length}</p>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-black p-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Archived Local</p>
                <p className="mt-1 text-base text-white">{cell(archive.daily.archivedAtLocal)}</p>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-black p-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Status</p>
                <p className="mt-1 text-base text-white">{cell(archive.daily.status)}</p>
              </div>
            </div>
          </section>
        ) : null}

        <section className="mb-10 rounded-xl border border-zinc-800 bg-zinc-950 p-5">
          <div className="mb-4 flex items-end justify-between gap-4">
            <p className="text-[12px] uppercase tracking-[0.25em] text-blue-400">
              Archived Candidates
            </p>
            <p className="text-xs text-zinc-500">{candidates.length} rows</p>
          </div>

          <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-black">
            <table className="min-w-full divide-y divide-zinc-900 text-sm">
              <thead className="bg-zinc-950">
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.16em] text-zinc-500">Time</th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.16em] text-zinc-500">Ticker</th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.16em] text-zinc-500">Price</th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.16em] text-zinc-500">Status</th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.16em] text-zinc-500">3m Ret</th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.16em] text-zinc-500">3m High</th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.16em] text-zinc-500">3m Low</th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.16em] text-zinc-500">180M Ret</th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.16em] text-zinc-500">Tick3+</th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.16em] text-zinc-500">Vol3k+</th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.16em] text-zinc-500">Room5+</th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.16em] text-zinc-500">Detail</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-900">
                {candidates.map((row, index) => (
                  <tr key={`${row.ticker}-${row.time}-${index}`} className="hover:bg-zinc-900/70">
                    <td className="px-4 py-3 text-zinc-200">{cell(row.time)}</td>
                    <td className="px-4 py-3 font-medium tracking-wide text-white">{cell(row.ticker)}</td>
                    <td className="px-4 py-3 text-zinc-200">{cell(row.price)}</td>
                    <td className="px-4 py-3">
                      <span className={statusPillClass(row.status)}>{cell(row.status)}</span>
                    </td>
                    <td className={`px-4 py-3 ${returnTone(row.threeMReturn)}`}>{cell(row.threeMReturn)}</td>
                    <td className={`px-4 py-3 ${returnTone(row.threeMHigh)}`}>{cell(row.threeMHigh)}</td>
                    <td className={`px-4 py-3 ${returnTone(row.threeMLow)}`}>{cell(row.threeMLow)}</td>
                    <td className={`px-4 py-3 ${returnTone(row.oneEightyMReturn)}`}>{cell(row.oneEightyMReturn)}</td>
                    <td className="px-4 py-3 text-zinc-200">{cell(row.tick3Plus)}</td>
                    <td className="px-4 py-3 text-zinc-200">{cell(row.vol3kPlus)}</td>
                    <td className="px-4 py-3 text-zinc-200">{cell(row.room5Plus)}</td>
                    <td className="px-4 py-3 text-zinc-400">{cell(row.detail)}</td>
                  </tr>
                ))}

                {candidates.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-4 py-6 text-center text-zinc-500">
                      No archived candidate rows.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
