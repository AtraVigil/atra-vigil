import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import styles from "./page.module.css";

type Outcome = Record<string, unknown> & { status?: string };

type RankingRow = {
  bucket?: string;
  call_delta_favorable_rank?: number | null;
  call_delta_median?: number | null;
  call_oi_total?: number | null;
  call_volume_total?: number | null;
  group_name?: string;
  latest_price_context?: unknown;
  options_activity_rank?: number | null;
  outcomes?: {
    H1?: Outcome;
    H3?: Outcome;
    H5?: Outcome;
  };
  percentile_score?: number | null;
  put_iv_range_favorable_rank?: number | null;
  put_iv_range_median?: number | null;
  put_oi_total?: number | null;
  rank?: number | null;
  signal_date?: string;
  ticker?: string;
};

type LatestPayload = {
  rankings?: RankingRow[];
  run?: {
    formula_version?: string;
    signal_date?: string;
    status?: string;
    ticker_count?: number;
  };
};

type HistoryPayload = {
  signals?: unknown[];
};

type HorizonSummary = {
  bottom20_mean?: number | null;
  completed_signal_dates?: number;
  session_win_rate?: number | null;
  spread_mean?: number | null;
  top20_mean?: number | null;
};

type SummaryPayload = {
  H1?: HorizonSummary;
  H3?: HorizonSummary;
  H5?: HorizonSummary;
  formula_version?: string;
  latest_signal_date?: string;
  signal_date_count?: number;
};

const dataDir = path.join(process.cwd(), "data", "optio-stock-signal");

function readJson<T>(name: string): T {
  return JSON.parse(fs.readFileSync(path.join(dataDir, name), "utf8")) as T;
}

const latest = readJson<LatestPayload>("latest.json");
const history = readJson<HistoryPayload>("history.json");
const summary = readJson<SummaryPayload>("summary.json");

function fmt(value: unknown, digits = 4) {
  if (value === null || value === undefined || value === "") return "—";
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(digits) : String(value);
}

function sourceOutcome(outcome?: Outcome) {
  if (!outcome) return "PENDING";

  const status = String(outcome.status ?? "PENDING");
  if (status.toUpperCase() === "PENDING") return "PENDING";

  const supplied = Object.entries(outcome).filter(([key]) => key !== "status");
  if (supplied.length === 0) return status;

  return supplied
    .map(([key, value]) => `${key}: ${value === null || value === undefined ? "—" : String(value)}`)
    .join(" · ");
}

function pct(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "PENDING";
  return `${value >= 0 ? "+" : ""}${(Math.abs(value) <= 1.5 ? value * 100 : value).toFixed(2)}%`;
}

export default function Page() {
  const ranking = Array.isArray(latest.rankings) ? latest.rankings : [];
  const signalDateCount = summary.signal_date_count ?? (Array.isArray(history.signals) ? history.signals.length : 0);

  const params = [
    ["Status", "Research / Forward Validation — Not Production"],
    ["Formula", latest.run?.formula_version ?? summary.formula_version ?? "THREE_FACTOR_V1_FROZEN"],
    ["Forward Validation Start", "2026-09-02"],
    ["Universe", `${latest.run?.ticker_count ?? ranking.length} stocks`],
    ["Ranking Buckets", "Top 20% / Middle 60% / Bottom 20%"],
    ["Factor 1", "Options Activity Composite: Call OI, Put OI, Call Volume"],
    ["Factor 2", "Call Delta: lower is favorable"],
    ["Factor 3", "Put IV Range: higher is favorable"],
    ["Factor Weighting", "Equal weight across all three factors"],
    ["Entry", "Next trading day open"],
    ["H1 Exit", "First future trading day close"],
    ["H3 Exit", "Third future trading day close"],
    ["H5 Exit", "Fifth future trading day close"],
    ["Website Role", "Read-only; no scoring, inference, modification, or re-fitting"],
  ];

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.eyebrow}>Atra Optio Research</div>
        <h1 className={styles.title}>Ata Optio Test 1</h1>
        <p className={styles.subtitle}>
          Prospective forward validation of the frozen three-factor stock-ranking research.
        </p>
        <div className={styles.warning}>Research / Forward Validation — Not Production</div>
        <div className={styles.nav}>
          <Link className={styles.link} href="/optio">Atra Optio Live Monitor</Link>
          <Link className={styles.link} href="/private">Atra Vigil Private</Link>
        </div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Test Parameters</h2>
          <div className={styles.params}>
            {params.map(([label, value]) => (
              <div className={styles.param} key={label}>
                <div className={styles.paramLabel}>{label}</div>
                <div className={styles.paramValue}>{value}</div>
              </div>
            ))}
          </div>
        </section>

        <div className={styles.cards}>
          <div className={styles.card}>
            <div className={styles.label}>Latest Signal</div>
            <div className={styles.value}>{latest.run?.signal_date ?? summary.latest_signal_date ?? "—"}</div>
          </div>
          <div className={styles.card}>
            <div className={styles.label}>Formula Version</div>
            <div className={styles.value}>{latest.run?.formula_version ?? summary.formula_version ?? "—"}</div>
          </div>
          <div className={styles.card}>
            <div className={styles.label}>Signal Dates</div>
            <div className={styles.value}>{signalDateCount}</div>
          </div>
          <div className={styles.card}>
            <div className={styles.label}>Completed H1 / H3 / H5</div>
            <div className={styles.value}>
              {summary.H1?.completed_signal_dates ?? 0} / {summary.H3?.completed_signal_dates ?? 0} / {summary.H5?.completed_signal_dates ?? 0}
            </div>
          </div>
        </div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Current Ranking</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Ticker</th>
                  <th>Group</th>
                  <th>Score</th>
                  <th>Activity</th>
                  <th>Delta</th>
                  <th>Put IV Range</th>
                  <th>Bucket</th>
                  <th>H1</th>
                  <th>H3</th>
                  <th>H5</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((row) => {
                  const bucket = String(row.bucket ?? "—");
                  return (
                    <tr
                      key={`${row.signal_date ?? "signal"}-${row.ticker ?? row.rank}`}
                      className={bucket === "TOP_20" ? styles.top : bucket === "BOTTOM_20" ? styles.bottom : ""}
                    >
                      <td>{fmt(row.rank, 0)}</td>
                      <td><strong>{row.ticker ?? "—"}</strong></td>
                      <td>{row.group_name ?? "—"}</td>
                      <td>{fmt(row.percentile_score)}</td>
                      <td>{fmt(row.options_activity_rank)}</td>
                      <td>{fmt(row.call_delta_favorable_rank)}</td>
                      <td>{fmt(row.put_iv_range_favorable_rank)}</td>
                      <td><span className={styles.pill}>{bucket}</span></td>
                      <td><span className={styles.pill}>{sourceOutcome(row.outcomes?.H1)}</span></td>
                      <td><span className={styles.pill}>{sourceOutcome(row.outcomes?.H3)}</span></td>
                      <td><span className={styles.pill}>{sourceOutcome(row.outcomes?.H5)}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Forward Validation Summary</h2>
          <div className={styles.contextGrid}>
            {(["H1", "H3", "H5"] as const).map((horizon) => {
              const item = summary[horizon];
              return (
                <div className={styles.context} key={horizon}>
                  <strong>{horizon}</strong>
                  <div className={styles.stat}><span>Completed signal dates</span><b>{item?.completed_signal_dates ?? 0}</b></div>
                  <div className={styles.stat}><span>Top-20 mean</span><b>{pct(item?.top20_mean)}</b></div>
                  <div className={styles.stat}><span>Bottom-20 mean</span><b>{pct(item?.bottom20_mean)}</b></div>
                  <div className={styles.stat}><span>Spread</span><b>{pct(item?.spread_mean)}</b></div>
                  <div className={styles.stat}><span>Session win rate</span><b>{pct(item?.session_win_rate)}</b></div>
                </div>
              );
            })}
          </div>
          <p className={styles.note}>
            Forward-validation values are displayed only when supplied by the durable research export. Missing values remain PENDING.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>In-Sample Research Context</h2>
          <div className={styles.contextGrid}>
            <div className={styles.context}>
              <strong>H1</strong>
              <div className={styles.stat}><span>Top-20 mean</span><b>+0.06%</b></div>
              <div className={styles.stat}><span>Bottom-20 mean</span><b>-1.18%</b></div>
              <div className={styles.stat}><span>Spread</span><b>+1.25 pp</b></div>
              <div className={styles.stat}><span>Session win rate</span><b>59.1%</b></div>
            </div>
            <div className={styles.context}>
              <strong>H3</strong>
              <div className={styles.stat}><span>Top-20 mean</span><b>+1.08%</b></div>
              <div className={styles.stat}><span>Bottom-20 mean</span><b>-1.69%</b></div>
              <div className={styles.stat}><span>Spread</span><b>+2.78 pp</b></div>
              <div className={styles.stat}><span>Session win rate</span><b>80.0%</b></div>
            </div>
            <div className={styles.context}>
              <strong>H5</strong>
              <div className={styles.stat}><span>Top-20 mean</span><b>+2.47%</b></div>
              <div className={styles.stat}><span>Bottom-20 mean</span><b>-2.87%</b></div>
              <div className={styles.stat}><span>Spread</span><b>+5.34 pp</b></div>
              <div className={styles.stat}><span>Session win rate</span><b>83.3%</b></div>
            </div>
          </div>
          <p className={styles.note}>
            These figures are in-sample research results, not forward-validated performance.
          </p>
        </section>
      </div>
    </main>
  );
}
