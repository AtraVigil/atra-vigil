import { loadAtraPraeData } from "../../lib/atrapraeSheet";

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

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-black p-4">
      <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </p>
      <p className={`text-lg ${tone || valueTone(String(value))}`}>{value || "--"}</p>
    </div>
  );
}

export default async function AtraPraePage() {
  const data = await loadAtraPraeData();

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
                Live Terminal
              </h1>
            </div>
          </div>

          <nav className="flex gap-3 text-sm">
            <a
              href="/"
              className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-300 hover:text-white"
            >
              Atra Vigil
            </a>
            <span className="rounded-lg border border-blue-900/60 bg-blue-950/30 px-3 py-2 text-blue-300">
              AtraPrae
            </span>
          </nav>
        </header>

        {data.loadError ? (
          <section className="mb-6 rounded-xl border border-red-900/60 bg-red-950/20 p-5">
            <p className="text-sm text-red-300">{data.loadError}</p>
          </section>
        ) : null}

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

        <section className="mb-10 rounded-xl border border-zinc-800 bg-zinc-950 p-5">
          <div className="mb-4">
            <p className="text-[12px] uppercase tracking-[0.25em] text-blue-400">
              Today&apos;s Candidates
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
      </div>
    </main>
  );
}
