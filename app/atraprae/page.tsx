import { existsSync, readFileSync } from "node:fs";

export const metadata = {
  title: "Atra Prae V2 | Atra Vigil",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

type ImportRow = {
  ticker: string;
  date?: string;
  snapshotTime?: string;
};

type ImportSource = {
  file: string;
  sessionDate: string;
  snapshotTime: string;
  count: number;
};

type CandidateRow = {
  eventId: string;
  ticker: string;
  timestamp: string;
  price: string;
  threeMPass: string;
  wmicroActive: string;
};

type CandidateSummary = {
  count: number;
  threeMPassCount: number;
  wmicroActiveCount: number;
};

type WMicroRow = {
  eventId: string;
  ticker: string;
  candidateTime: string;
  state: string;
  status: string;
  tickCount: string;
  lastReturn: string;
  highReturn: string;
  lowReturn: string;
};

type WMicroSummary = {
  sessions: number;
  active: number;
  supporting: number;
  fading: number;
  thin: number;
  neutral: number;
};

type AtraPraeData = {
  importSource: ImportSource;
  importRows: ImportRow[];
  candidateSummary: CandidateSummary;
  candidateRows: CandidateRow[];
  wmicroSummary: WMicroSummary;
  wmicroRows: WMicroRow[];
  loadError?: string;
};

const emptyData: AtraPraeData = {
  importSource: {
    file: "not configured",
    sessionDate: "--",
    snapshotTime: "--",
    count: 0,
  },
  importRows: [],
  candidateSummary: {
    count: 0,
    threeMPassCount: 0,
    wmicroActiveCount: 0,
  },
  candidateRows: [],
  wmicroSummary: {
    sessions: 0,
    active: 0,
    supporting: 0,
    fading: 0,
    thin: 0,
    neutral: 0,
  },
  wmicroRows: [],
};

function parseAtraPraeData(text: string): AtraPraeData {
  const parsed = JSON.parse(text);

  return {
    ...emptyData,
    ...parsed,
    importSource: {
      ...emptyData.importSource,
      ...(parsed.importSource || {}),
    },
    candidateSummary: {
      ...emptyData.candidateSummary,
      ...(parsed.candidateSummary || {}),
    },
    wmicroSummary: {
      ...emptyData.wmicroSummary,
      ...(parsed.wmicroSummary || {}),
    },
    importRows: Array.isArray(parsed.importRows) ? parsed.importRows : [],
    candidateRows: Array.isArray(parsed.candidateRows) ? parsed.candidateRows : [],
    wmicroRows: Array.isArray(parsed.wmicroRows) ? parsed.wmicroRows : [],
  };
}

function loadAtraPraeData(): AtraPraeData {
  try {
    const b64 = process.env.ATRA_PRAE_DATA_B64;
    if (b64) {
      return parseAtraPraeData(Buffer.from(b64, "base64").toString("utf-8"));
    }

    const rawJson = process.env.ATRA_PRAE_DATA_JSON;
    if (rawJson) {
      return parseAtraPraeData(rawJson);
    }

    const file = process.env.ATRA_PRAE_DATA_FILE;
    if (file && existsSync(file)) {
      return parseAtraPraeData(readFileSync(file, "utf-8"));
    }

    return {
      ...emptyData,
      loadError: "Atra Prae data source is not configured.",
    };
  } catch {
    return {
      ...emptyData,
      loadError: "Atra Prae data failed to load.",
    };
  }
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-black p-4">
      <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </p>
      <p className="text-lg text-white">{value}</p>
    </div>
  );
}

function YesNoPill({
  value,
  activeType,
}: {
  value: string;
  activeType: "pass" | "active";
}) {
  if (value === "YES" && activeType === "pass") {
    return (
      <span className="rounded-full border border-emerald-900/60 bg-emerald-950/30 px-2 py-1 text-xs text-emerald-300">
        YES
      </span>
    );
  }

  if (value === "YES" && activeType === "active") {
    return (
      <span className="rounded-full border border-blue-900/60 bg-blue-950/30 px-2 py-1 text-xs text-blue-300">
        YES
      </span>
    );
  }

  return (
    <span className="rounded-full border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs text-zinc-500">
      NO
    </span>
  );
}

function StatePill({ value }: { value: string }) {
  const state = value.toUpperCase();

  if (state === "SUPPORTING") {
    return (
      <span className="rounded-full border border-emerald-900/60 bg-emerald-950/30 px-2 py-1 text-xs text-emerald-300">
        SUPPORTING
      </span>
    );
  }

  if (state === "FADING") {
    return (
      <span className="rounded-full border border-red-900/60 bg-red-950/30 px-2 py-1 text-xs text-red-300">
        FADING
      </span>
    );
  }

  if (state === "THIN" || state === "NO_DATA") {
    return (
      <span className="rounded-full border border-zinc-700 bg-zinc-900/60 px-2 py-1 text-xs text-zinc-300">
        {state}
      </span>
    );
  }

  if (state === "ACTIVE") {
    return (
      <span className="rounded-full border border-blue-900/60 bg-blue-950/30 px-2 py-1 text-xs text-blue-300">
        ACTIVE
      </span>
    );
  }

  return (
    <span className="rounded-full border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs text-zinc-400">
      {state || "--"}
    </span>
  );
}

export default function AtraPraePage() {
  const data = loadAtraPraeData();

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
          <p className="text-[12px] uppercase tracking-[0.25em] text-blue-400">
            Import
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            Tickers loaded from the configured private Atra Prae V2 data source.
          </p>
        </section>

        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <Metric label="Session Date" value={data.importSource.sessionDate || "--"} />
          <Metric label="Import Count" value={data.importSource.count} />
          <Metric label="Snapshot Time" value={data.importSource.snapshotTime || "--"} />
          <Metric label="Source" value={data.importSource.file} />
        </section>

        <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-950 p-5">
          <div className="mb-4">
            <p className="text-[12px] uppercase tracking-[0.25em] text-blue-400">
              Imported Tickers
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Five segments per row. Left aligned.
            </p>
          </div>

          <div className="overflow-hidden rounded-lg border border-zinc-800 bg-black">
            <div className="grid grid-cols-5 divide-x divide-y divide-zinc-900">
              {data.importRows.map((row) => (
                <div
                  key={row.ticker}
                  className="min-h-10 px-4 py-3 text-left text-base font-medium tracking-wide text-white"
                >
                  {row.ticker}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-950 p-5">
          <div className="mb-4">
            <p className="text-[12px] uppercase tracking-[0.25em] text-blue-400">
              Candidates
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Candidate events joined to 3m result and WMicro active state by Event ID.
            </p>
          </div>

          <section className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Metric label="Candidates" value={data.candidateSummary.count} />
            <Metric label="3m Pass" value={data.candidateSummary.threeMPassCount} />
            <Metric label="WMicro Active" value={data.candidateSummary.wmicroActiveCount} />
          </section>

          <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-black">
            <table className="min-w-full divide-y divide-zinc-900 text-sm">
              <thead className="bg-zinc-950">
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.16em] text-zinc-500">Ticker</th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.16em] text-zinc-500">Timestamp</th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.16em] text-zinc-500">Price</th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.16em] text-zinc-500">3m Pass</th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.16em] text-zinc-500">WMicro Active</th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.16em] text-zinc-500">Event ID</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-900">
                {data.candidateRows.map((row) => (
                  <tr key={row.eventId} className="hover:bg-zinc-900/70">
                    <td className="px-4 py-3 font-medium tracking-wide text-white">{row.ticker}</td>
                    <td className="px-4 py-3 text-zinc-200">{row.timestamp || "--"}</td>
                    <td className="px-4 py-3 text-zinc-200">{row.price || "--"}</td>
                    <td className="px-4 py-3"><YesNoPill value={row.threeMPass} activeType="pass" /></td>
                    <td className="px-4 py-3"><YesNoPill value={row.wmicroActive} activeType="active" /></td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-500">{row.eventId || "--"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-10 rounded-xl border border-zinc-800 bg-zinc-950 p-5">
          <div className="mb-4">
            <p className="text-[12px] uppercase tracking-[0.25em] text-blue-400">
              WMicro
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              WMicro state and return telemetry joined by Event ID.
            </p>
          </div>

          <section className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-5">
            <Metric label="Sessions" value={data.wmicroSummary.sessions} />
            <Metric label="Active" value={data.wmicroSummary.active} />
            <Metric label="Supporting" value={data.wmicroSummary.supporting} />
            <Metric label="Fading" value={data.wmicroSummary.fading} />
            <Metric label="Thin" value={data.wmicroSummary.thin} />
          </section>

          <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-black">
            <table className="min-w-full divide-y divide-zinc-900 text-sm">
              <thead className="bg-zinc-950">
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.16em] text-zinc-500">Ticker</th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.16em] text-zinc-500">Candidate Time</th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.16em] text-zinc-500">State</th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.16em] text-zinc-500">Status</th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.16em] text-zinc-500">Tick Count</th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.16em] text-zinc-500">Last Return %</th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.16em] text-zinc-500">High Return %</th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.16em] text-zinc-500">Low Return %</th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.16em] text-zinc-500">Event ID</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-900">
                {data.wmicroRows.map((row) => (
                  <tr key={row.eventId} className="hover:bg-zinc-900/70">
                    <td className="px-4 py-3 font-medium tracking-wide text-white">{row.ticker}</td>
                    <td className="px-4 py-3 text-zinc-200">{row.candidateTime || "--"}</td>
                    <td className="px-4 py-3"><StatePill value={row.state} /></td>
                    <td className="px-4 py-3"><StatePill value={row.status} /></td>
                    <td className="px-4 py-3 text-zinc-200">{row.tickCount}</td>
                    <td className="px-4 py-3 text-zinc-200">{row.lastReturn}</td>
                    <td className="px-4 py-3 text-zinc-200">{row.highReturn}</td>
                    <td className="px-4 py-3 text-zinc-200">{row.lowReturn}</td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-500">{row.eventId || "--"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
