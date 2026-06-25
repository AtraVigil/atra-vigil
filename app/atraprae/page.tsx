import {
  type ArchiveTable,
  type AtraPraeData,
  loadAtraPraeArchiveData,
  loadAtraPraeData,
} from "../../lib/atrapraeSheet";

export const metadata = {
  title: "Atra Prae V2 | Atra Vigil",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

function valueTone(value: string): string {
  const text = String(value || "").trim().toUpperCase();

  if (text.includes("OPEN") || text === "OK" || text.includes("PASS")) {
    return "text-emerald-300";
  }

  if (text.includes("FAIL") || text.includes("ERROR") || text.includes("CLOSED")) {
    return "text-red-300";
  }

  if (text.includes("APPS SCRIPT") || text.includes("PENDING") || text.includes("FALLBACK")) {
    return "text-amber-300";
  }

  return "text-white";
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

function HeaderNav({ mode }: { mode: "live" | "history" }) {
  return (
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
            {mode === "history" ? "Atra Prae History" : "Live Terminal"}
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
          className={
            mode === "live"
              ? "rounded-lg border border-blue-900/60 bg-blue-950/30 px-3 py-2 text-blue-300"
              : "rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-300 hover:text-white"
          }
        >
          Live Terminal
        </a>
        <a
          href="/atraprae/history"
          className={
            mode === "history"
              ? "rounded-lg border border-blue-900/60 bg-blue-950/30 px-3 py-2 text-blue-300"
              : "rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-300 hover:text-white"
          }
        >
          History
        </a>
      </nav>
    </header>
  );
}

function SystemHealthSection({ data }: { data: AtraPraeData }) {
  return (
    <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-950 p-5">
      <div className="mb-4">
        <p className="text-[12px] uppercase tracking-[0.25em] text-blue-400">
          System Health
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {data.systemHealth.map((row, index) => (
          <div key={`${row.label}-${index}`} className="rounded-lg border border-zinc-800 bg-black p-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">{row.label}</p>
            <p className={`mt-1 text-base ${valueTone(row.value)}`}>{row.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function WatchNowSection({ data }: { data: AtraPraeData }) {
  return (
    <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-950 p-5">
      <div className="mb-4">
        <p className="text-[12px] uppercase tracking-[0.25em] text-blue-400">
          Watch Now
        </p>
      </div>

      {data.watchRows.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-black p-5 text-sm text-zinc-400">
          {data.watchMessage || "No Active"}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-black">
          <table className="min-w-full divide-y divide-zinc-900 text-sm">
            <thead className="bg-zinc-950">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.16em] text-zinc-500">Ticker</th>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.16em] text-zinc-500">Candidate Time</th>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.16em] text-zinc-500">Status</th>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.16em] text-zinc-500">Expires</th>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.16em] text-zinc-500">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {data.watchRows.map((row, index) => (
                <tr key={`${row.ticker}-${row.candidateTime}-${index}`} className="hover:bg-zinc-900/70">
                  <td className="px-4 py-3 font-medium tracking-wide text-white">{row.ticker || "--"}</td>
                  <td className="px-4 py-3 text-zinc-200">{row.candidateTime || "--"}</td>
                  <td className="px-4 py-3"><span className={statusPillClass(row.status)}>{row.status || "--"}</span></td>
                  <td className="px-4 py-3 text-zinc-200">{row.expires || "--"}</td>
                  <td className="px-4 py-3 text-zinc-400">{row.detail || "--"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function CandidatesSection({ data, title = "Today’s Candidates" }: { data: AtraPraeData; title?: string }) {
  return (
    <section className="mb-10 rounded-xl border border-zinc-800 bg-zinc-950 p-5">
      <div className="mb-4">
        <p className="text-[12px] uppercase tracking-[0.25em] text-blue-400">
          {title}
        </p>
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
              <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.16em] text-zinc-500">Detail</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-900">
            {data.candidateRows.map((row, index) => (
              <tr key={`${row.ticker}-${row.time}-${index}`} className="hover:bg-zinc-900/70">
                <td className="px-4 py-3 text-zinc-200">{row.time || "--"}</td>
                <td className="px-4 py-3 font-medium tracking-wide text-white">{row.ticker || "--"}</td>
                <td className="px-4 py-3 text-zinc-200">{row.price || "--"}</td>
                <td className="px-4 py-3"><span className={statusPillClass(row.status)}>{row.status || "--"}</span></td>
                <td className={`px-4 py-3 ${returnTone(row.threeMReturn)}`}>{row.threeMReturn || "--"}</td>
                <td className={`px-4 py-3 ${returnTone(row.threeMHigh)}`}>{row.threeMHigh || "--"}</td>
                <td className={`px-4 py-3 ${returnTone(row.threeMLow)}`}>{row.threeMLow || "--"}</td>
                <td className="px-4 py-3 text-zinc-400">{row.detail || "--"}</td>
              </tr>
            ))}

            {data.candidateRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-zinc-500">
                  No candidate rows.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RawTable({ title, table, maxRows }: { title: string; table: ArchiveTable; maxRows?: number }) {
  const rows = typeof maxRows === "number" ? table.rows.slice(0, maxRows) : table.rows;

  return (
    <section className="mb-10 rounded-xl border border-zinc-800 bg-zinc-950 p-5">
      <div className="mb-4 flex items-end justify-between gap-4">
        <p className="text-[12px] uppercase tracking-[0.25em] text-blue-400">{title}</p>
        <p className="text-xs text-zinc-500">{table.rows.length} rows</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-black">
        <table className="min-w-full divide-y divide-zinc-900 text-xs">
          <thead className="bg-zinc-950">
            <tr>
              {table.headers.map((header, index) => (
                <th key={`${header}-${index}`} className="whitespace-nowrap px-3 py-3 text-left text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                  {header || `Column ${index + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900">
            {rows.map((row, rowIndex) => (
              <tr key={`row-${rowIndex}`} className="hover:bg-zinc-900/70">
                {table.headers.map((_, colIndex) => (
                  <td key={`${rowIndex}-${colIndex}`} className="whitespace-nowrap px-3 py-2 text-zinc-300">
                    {row[colIndex] || "--"}
                  </td>
                ))}
              </tr>
            ))}

            {rows.length === 0 ? (
              <tr>
                <td colSpan={Math.max(1, table.headers.length)} className="px-4 py-6 text-center text-zinc-500">
                  No rows.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {typeof maxRows === "number" && table.rows.length > maxRows ? (
        <p className="mt-3 text-xs text-zinc-500">
          Showing first {maxRows} rows.
        </p>
      ) : null}
    </section>
  );
}

function LiveView({ data }: { data: AtraPraeData }) {
  return (
    <>
      {data.loadError ? (
        <section className="mb-6 rounded-xl border border-red-900/60 bg-red-950/20 p-5">
          <p className="text-sm text-red-300">{data.loadError}</p>
        </section>
      ) : null}

      <SystemHealthSection data={data} />
      <WatchNowSection data={data} />
      <CandidatesSection data={data} />
    </>
  );
}

async function HistoryView({ selectedDate }: { selectedDate?: string }) {
  const archive = await loadAtraPraeArchiveData(selectedDate);

  return (
    <>
      {archive.loadError ? (
        <section className="mb-6 rounded-xl border border-red-900/60 bg-red-950/20 p-5">
          <p className="text-sm text-red-300">{archive.loadError}</p>
        </section>
      ) : null}

      <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-950 p-5">
        <div className="mb-4">
          <p className="text-[12px] uppercase tracking-[0.25em] text-blue-400">
            Archive Date
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {archive.dates.length === 0 ? (
            <span className="rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-500">
              No archive dates found.
            </span>
          ) : null}

          {archive.dates.map((date) => (
            <a
              key={date}
              href={`/atraprae?mode=history&date=${encodeURIComponent(date)}`}
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
              <p className="mt-1 text-base text-white">{archive.daily.sessionDate || "--"}</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-black p-3">
              <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Terminal Rows</p>
              <p className="mt-1 text-base text-white">{archive.daily.terminalRows || "--"}</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-black p-3">
              <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Alert Rows</p>
              <p className="mt-1 text-base text-white">{archive.daily.alertHistoryRows || "--"}</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-black p-3">
              <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">WMicro Rows</p>
              <p className="mt-1 text-base text-white">{archive.daily.wmicroRows || "--"}</p>
            </div>
          </div>

          <p className="mt-4 text-xs text-zinc-500">
            Archived local: {archive.daily.archivedAtLocal || "--"} | Market: {archive.daily.archivedAtMarket || "--"} | Status: {archive.daily.status || "--"}
          </p>
        </section>
      ) : null}

      <SystemHealthSection data={archive.terminal} />
      <CandidatesSection data={archive.terminal} title="Archived Candidates" />
      <RawTable title="Archived Alert History" table={archive.alertHistory} />
      <RawTable title="Archived WMicro" table={archive.wmicro} />
    </>
  );
}

export default async function AtraPraePage({
  searchParams,
}: {
  searchParams?: Promise<{ mode?: string; date?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const mode = params?.mode === "history" ? "history" : "live";

  const liveData = mode === "live" ? await loadAtraPraeData() : null;

  return (
    <main className="min-h-screen bg-black p-4 text-white md:p-8">
      <div className="mx-auto max-w-7xl">
        <HeaderNav mode={mode} />

        {mode === "history" ? (
          <HistoryView selectedDate={params?.date} />
        ) : (
          <LiveView data={liveData as AtraPraeData} />
        )}
      </div>
    </main>
  );
}
