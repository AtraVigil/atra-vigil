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

function tableHeaders(headers: string[]) {
  return headers.length ? headers : ["No columns"];
}

function tableRows(rows: string[][], width: number) {
  if (rows.length) return rows;
  return [Array.from({ length: Math.max(1, width) }, () => "--")];
}

function RawTable({
  title,
  headers,
  rows,
}: {
  title: string;
  headers: string[];
  rows: string[][];
}) {
  const safeHeaders = tableHeaders(headers);
  const safeRows = tableRows(rows, safeHeaders.length);

  return (
    <section className="mb-8 rounded-xl border border-zinc-800 bg-zinc-950 p-5">
      <div className="mb-4 flex items-end justify-between gap-4">
        <p className="text-[12px] uppercase tracking-[0.25em] text-blue-400">{title}</p>
        <p className="text-xs text-zinc-500">{rows.length} rows</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-black">
        <table className="min-w-full divide-y divide-zinc-900 text-xs">
          <thead className="bg-zinc-950">
            <tr>
              {safeHeaders.map((header, index) => (
                <th
                  key={`${header}-${index}`}
                  className="whitespace-nowrap px-3 py-3 text-left text-[10px] uppercase tracking-[0.14em] text-zinc-500"
                >
                  {cell(header)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900">
            {safeRows.map((row, rowIndex) => (
              <tr key={`row-${rowIndex}`} className="hover:bg-zinc-900/70">
                {safeHeaders.map((_, colIndex) => (
                  <td key={`${rowIndex}-${colIndex}`} className="whitespace-nowrap px-3 py-2 text-zinc-300">
                    {cell(row[colIndex])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default async function AtraPraeHistoryPage({
  searchParams,
}: {
  searchParams?: Promise<{ date?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const archive = await loadAtraPraeArchiveData(params?.date);

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
              Archive Dates
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {archive.dates.length === 0 ? (
              <span className="rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-500">
                No archived dates found.
              </span>
            ) : null}

            {archive.dates.map((date) => (
              <a
                key={date}
                href={`/atraprae/history?date=${encodeURIComponent(date)}`}
                className={
                  date === archive.selectedDate
                    ? "rounded-lg border border-blue-900/60 bg-blue-950/30 px-3 py-2 text-sm text-blue-300"
                    : "rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-300 hover:text-white"
                }
              >
                {date}
              </a>
            ))}
          </div>
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
                <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Terminal Rows</p>
                <p className="mt-1 text-base text-white">{cell(archive.daily.terminalRows)}</p>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-black p-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Alert Rows</p>
                <p className="mt-1 text-base text-white">{cell(archive.daily.alertHistoryRows)}</p>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-black p-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">WMicro Rows</p>
                <p className="mt-1 text-base text-white">{cell(archive.daily.wmicroRows)}</p>
              </div>
            </div>

            <p className="mt-4 text-xs text-zinc-500">
              Archived local: {cell(archive.daily.archivedAtLocal)} | Market: {cell(archive.daily.archivedAtMarket)} | Status: {cell(archive.daily.status)}
            </p>
          </section>
        ) : null}

        <RawTable
          title="Archived Candidates / Terminal Snapshot"
          headers={archive.terminal.rawTerminalRows?.[0] || []}
          rows={archive.terminal.rawTerminalRows?.slice(1) || []}
        />

        <RawTable
          title="Archived Alert History"
          headers={archive.alertHistory.headers}
          rows={archive.alertHistory.rows}
        />

        <RawTable
          title="Archived WMicro"
          headers={archive.wmicro.headers}
          rows={archive.wmicro.rows}
        />
      </div>
    </main>
  );
}
