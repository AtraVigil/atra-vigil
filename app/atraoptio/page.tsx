"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type AnyRecord = Record<string, any>;

type DashboardPayload = {
  ok?: boolean;
  schema_version?: string | null;
  generated_at_utc?: string | null;
  generated_at_market?: string | null;
  session_date?: string | null;
  runtime?: AnyRecord;
  counts?: AnyRecord;
  ranked_board?: AnyRecord[];
  selected_contracts?: AnyRecord[];
  snapshot_tape_latest?: AnyRecord[];
  outcomes?: AnyRecord[];
  outcome_counts?: AnyRecord;
  data_quality?: AnyRecord;
  source_files?: AnyRecord;
  disclaimer?: string;
};

const researchDisclaimer =
  "Atra Optio is forward-test research only. Long calls only. No execution. No edge claim.";

const signalOrder: Record<string, number> = {
  CALL_TEST: 1,
  CALL_WATCH: 2,
  NO_TRADE: 3,
  AVOID: 4,
};

function value(v: any) {
  if (v === null || v === undefined || v === "") return "not available";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "none";
  return String(v);
}

function pct(v: any) {
  const n = Number(v);
  if (!Number.isFinite(n)) return value(v);
  return `${(n * 100).toFixed(2)}%`;
}

function num(v: any, digits = 2) {
  const n = Number(v);
  if (!Number.isFinite(n)) return value(v);
  return n.toFixed(digits);
}

function money(v: any) {
  const n = Number(v);
  if (!Number.isFinite(n)) return value(v);
  return `$${n.toFixed(2)}`;
}

function statusFromFeed(data: DashboardPayload) {
  const runtime = data.runtime || {};
  const dq = data.data_quality || {};
  const errors = Array.isArray(dq.errors) ? dq.errors : [];
  const warnings = Array.isArray(dq.warnings) ? dq.warnings : [];
  const market = String(runtime.market_window_state || "");
  const runMode = String(runtime.run_mode || "");
  const rankedCount = data.ranked_board?.length || 0;

  if (!data.ok || data.schema_version !== "atra_optio_dashboard_v1") {
    return { label: "FEED ERROR", tone: "red" };
  }

  if (errors.length > 0) return { label: "DATA ERROR", tone: "red" };

  if (
    market === "MARKET_WINDOW_OPEN" &&
    (dq.missing_snapshot_file === true || rankedCount === 0)
  ) {
    return { label: "LIVE WARNING", tone: "red" };
  }

  if (
    warnings.length > 0 ||
    runMode === "TEST_MODE" ||
    market.includes("CLOSED") ||
    market.includes("WEEKEND") ||
    (data.selected_contracts?.length || 0) === 0 ||
    (data.outcomes?.length || 0) === 0
  ) {
    return { label: "INFORMATIONAL", tone: "yellow" };
  }

  return { label: "LIVE OK", tone: "green" };
}

function toneClass(tone: string) {
  if (tone === "green") return "border-emerald-400/30 bg-emerald-500/10 text-emerald-300";
  if (tone === "red") return "border-red-400/30 bg-red-500/10 text-red-300";
  if (tone === "yellow") return "border-amber-400/30 bg-amber-500/10 text-amber-300";
  return "border-blue-400/30 bg-blue-500/10 text-blue-300";
}

function signalTone(label: string) {
  if (label === "CALL_TEST") return "border-emerald-400/30 bg-emerald-500/10 text-emerald-300";
  if (label === "CALL_WATCH") return "border-blue-400/30 bg-blue-500/10 text-blue-300";
  if (label === "AVOID") return "border-red-400/20 bg-red-500/5 text-red-300";
  return "border-white/10 bg-white/[0.03] text-zinc-300";
}

function FieldCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950/75 p-4 shadow-xl shadow-black/25">
      <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-600">
        {title}
      </div>
      <div className="mt-2 text-sm font-medium text-zinc-200">{children}</div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5 rounded-3xl border border-white/10 bg-zinc-950/65 p-5 shadow-2xl shadow-black/25">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {subtitle ? (
          <div className="text-xs uppercase tracking-[0.20em] text-zinc-600">{subtitle}</div>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-sm text-zinc-500">
      {children}
    </div>
  );
}

function Table({
  columns,
  rows,
  render,
}: {
  columns: string[];
  rows: AnyRecord[];
  render: (row: AnyRecord, col: string) => React.ReactNode;
}) {
  if (!rows.length) return <EmptyState>No rows in current feed.</EmptyState>;

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10">
      <table className="min-w-full border-collapse text-left text-xs">
        <thead className="bg-white/[0.04] text-[10px] uppercase tracking-[0.18em] text-zinc-500">
          <tr>
            {columns.map((col) => (
              <th key={col} className="whitespace-nowrap border-b border-white/10 px-3 py-3">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={`${row.ticker || row.contract || row.selected_contract || "row"}-${idx}`} className="border-b border-white/5 last:border-0">
              {columns.map((col) => (
                <td key={col} className="max-w-[260px] whitespace-nowrap px-3 py-3 text-zinc-300">
                  {render(row, col)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AtraOptioPage() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rankFilter, setRankFilter] = useState("ALL");
  const [tickerSearch, setTickerSearch] = useState("");
  const [showAllSnapshots, setShowAllSnapshots] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const res = await fetch(`/api/atra-optio-dashboard?v=${Date.now()}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (!mounted) return;
        setData(json);
        setError(null);
      } catch {
        if (!mounted) return;
        setError("Failed to load Atra Optio dashboard feed.");
      }
    }

    load();
    const id = window.setInterval(load, 60_000);

    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, []);

  const feed = data || {};
  const runtime = feed.runtime || {};
  const counts = feed.counts || {};
  const dq = feed.data_quality || {};
  const sourceFiles = feed.source_files || {};
  const status = statusFromFeed(feed);

  const rankedRows = useMemo(() => {
    const rows = [...(feed.ranked_board || [])];

    rows.sort((a, b) => {
      const ao = signalOrder[a.system_state] || signalOrder[a.signal_label] || 99;
      const bo = signalOrder[b.system_state] || signalOrder[b.signal_label] || 99;
      if (ao !== bo) return ao - bo;
      return Number(b.final_score || b.score || 0) - Number(a.final_score || a.score || 0);
    });

    return rows.filter((row) => {
      const label = row.system_state || row.signal_label || "";
      const ticker = String(row.ticker || "").toLowerCase();
      const group = String(row.group_name || "").toLowerCase();
      const query = tickerSearch.trim().toLowerCase();

      if (rankFilter !== "ALL" && label !== rankFilter && row.group_name !== rankFilter) {
        return false;
      }

      if (query && !ticker.includes(query) && !group.includes(query)) {
        return false;
      }

      return true;
    });
  }, [feed.ranked_board, rankFilter, tickerSearch]);

  const snapshotRows = useMemo(() => {
    const rows = feed.snapshot_tape_latest || [];
    if (showAllSnapshots) return rows;
    return rows.filter((row) => ["CALL_TEST", "CALL_WATCH"].includes(row.signal_label || row.system_state));
  }, [feed.snapshot_tape_latest, showAllSnapshots]);

  const groupNames = Array.from(
    new Set((feed.ranked_board || []).map((row) => row.group_name).filter(Boolean)),
  );

  return (
    <main className="min-h-screen bg-[#030407] px-5 py-6 text-white sm:px-8">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(37,99,235,0.22),transparent_34%),radial-gradient(circle_at_90%_55%,rgba(59,130,246,0.08),transparent_28%)]" />
      <div className="relative z-10 mx-auto max-w-[1800px]">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            prefetch={false}
            className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-blue-200 transition hover:border-blue-400 hover:bg-blue-500/15"
          >
            ← Back to Market Command
          </Link>

          <div className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.20em] ${toneClass(status.tone)}`}>
            {status.label}
          </div>
        </div>

        <header className="overflow-hidden rounded-[1.7rem] border border-blue-400/15 bg-zinc-950/70 shadow-2xl shadow-blue-950/20">
          <div className="relative h-28 sm:h-36">
            <img
              src="/header-final.png"
              alt="Atra Vigil Header"
              className="absolute inset-0 h-full w-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/10 to-black/55" />
          </div>

          <div className="p-6 sm:p-8">
            <div className="text-xs font-semibold uppercase tracking-[0.34em] text-blue-400">
              Protected Terminal
            </div>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Atra Optio
            </h1>
            <p className="mt-3 text-sm uppercase tracking-[0.22em] text-zinc-500">
              Long-Call Forward Test Dashboard
            </p>

            <div className="mt-6 grid gap-3 md:grid-cols-5">
              <FieldCard title="Session">{value(feed.session_date)}</FieldCard>
              <FieldCard title="Latest Feed ET">{value(feed.generated_at_market)}</FieldCard>
              <FieldCard title="Latest Feed UTC">{value(feed.generated_at_utc)}</FieldCard>
              <FieldCard title="Run Mode">{value(runtime.run_mode)}</FieldCard>
              <FieldCard title="Market">{value(runtime.market_window_state)}</FieldCard>
            </div>
          </div>
        </header>

        {error ? (
          <Section title="Feed Error">
            <EmptyState>{error}</EmptyState>
          </Section>
        ) : null}

        <Section title="Runtime Health" subtitle="display only">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            <FieldCard title="Market Window">{value(runtime.market_window_state)}</FieldCard>
            <FieldCard title="Run Mode">{value(runtime.run_mode)}</FieldCard>
            <FieldCard title="Latest Run ID">{value(runtime.latest_run_id)}</FieldCard>
            <FieldCard title="Ticker Count">{value(runtime.ticker_count)}</FieldCard>
            <FieldCard title="Rows Written">{value(runtime.rows_written)}</FieldCard>
            <FieldCard title="Ledger">{value(runtime.ledger_append_status)}</FieldCard>
            <FieldCard title="Snapshot Archive">
              {value(runtime.snapshot_archive_status)}
              <div className="mt-1 text-xs text-zinc-500">
                rows: {value(runtime.snapshot_rows_written)}
              </div>
            </FieldCard>
            <FieldCard title="Outcome Capture">
              {value(runtime.outcome_capture_status)}
              <div className="mt-1 text-xs text-zinc-500">
                written: {value(runtime.outcome_rows_written)} | updated: {value(runtime.outcome_rows_updated)}
              </div>
            </FieldCard>
            <FieldCard title="Outcome Pending">{value(runtime.outcome_pending_count)}</FieldCard>
            <FieldCard title="Artifact Policy">{value(runtime.artifact_policy)}</FieldCard>
            <FieldCard title="Latest File Time">{value(runtime.latest_file_timestamp_local)}</FieldCard>
          </div>
        </Section>

        <Section title="Signal Counts">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {["CALL_TEST", "CALL_WATCH", "NO_TRADE", "AVOID"].map((label) => (
              <div key={label} className={`rounded-2xl border p-5 ${signalTone(label)}`}>
                <div className="text-[10px] font-semibold uppercase tracking-[0.24em] opacity-80">
                  {label}
                </div>
                <div className="mt-2 text-3xl font-semibold">{value(counts[label] ?? 0)}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Current Ranked Board" subtitle={`${rankedRows.length} rows displayed`}>
          <div className="mb-4 flex flex-wrap gap-2">
            {["ALL", "CALL_TEST", "CALL_WATCH", "NO_TRADE", "AVOID", ...groupNames].map((filter) => (
              <button
                key={filter}
                onClick={() => setRankFilter(filter)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  rankFilter === filter
                    ? "border-blue-400/50 bg-blue-500/15 text-blue-200"
                    : "border-white/10 bg-white/[0.03] text-zinc-500 hover:text-white"
                }`}
              >
                {filter}
              </button>
            ))}

            <input
              value={tickerSearch}
              onChange={(e) => setTickerSearch(e.target.value)}
              placeholder="Search ticker/group"
              className="ml-auto min-w-[220px] rounded-full border border-white/10 bg-black/40 px-4 py-1.5 text-xs text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-blue-400/50"
            />
          </div>

          <Table
            rows={rankedRows}
            columns={[
              "rank",
              "ticker",
              "group",
              "state",
              "score",
              "ticker_ret",
              "group_ret",
              "rel_group",
              "rel_bench",
              "vwap",
              "vol",
              "contract",
              "dte",
              "strike",
              "bid",
              "ask",
              "mid",
              "spread",
              "vol/oi",
              "reason",
            ]}
            render={(row, col) => {
              if (col === "rank") return value(row.ticker_rank ?? row.rank);
              if (col === "ticker") return <span className="font-semibold text-white">{value(row.ticker)}</span>;
              if (col === "group") return value(row.group_name);
              if (col === "state") return <span className={`rounded-full border px-2 py-1 ${signalTone(row.system_state)}`}>{value(row.system_state)}</span>;
              if (col === "score") return num(row.final_score);
              if (col === "ticker_ret") return pct(row.ticker_return);
              if (col === "group_ret") return pct(row.group_return);
              if (col === "rel_group") return pct(row.relative_to_group);
              if (col === "rel_bench") return pct(row.relative_to_benchmark);
              if (col === "vwap") return `${value(row.vwap_state)} / ${pct(row.distance_from_vwap_pct)}`;
              if (col === "vol") return value(row.volume_state);
              if (col === "contract") return value(row.selected_contract);
              if (col === "dte") return value(row.option_dte);
              if (col === "strike") return money(row.option_strike);
              if (col === "bid") return money(row.option_bid);
              if (col === "ask") return money(row.option_ask);
              if (col === "mid") return money(row.option_mid);
              if (col === "spread") return pct(row.option_spread_pct);
              if (col === "vol/oi") return `${value(row.option_volume)} / ${value(row.option_oi)}`;
              if (col === "reason") return <span title={value(row.reason_codes)}>{value(row.reason_codes)}</span>;
              return value(row[col]);
            }}
          />
        </Section>

        <Section title="Selected Contracts" subtitle="CALL_TEST / CALL_WATCH only">
          {(feed.selected_contracts || []).length ? (
            <Table
              rows={feed.selected_contracts || []}
              columns={[
                "ticker",
                "group",
                "signal",
                "score",
                "contract",
                "expiration",
                "dte",
                "strike",
                "bid",
                "ask",
                "mid",
                "last",
                "spread",
                "volume",
                "oi",
                "status",
                "reason",
                "quality",
              ]}
              render={(row, col) => {
                if (col === "ticker") return <span className="font-semibold text-white">{value(row.ticker)}</span>;
                if (col === "group") return value(row.group_name);
                if (col === "signal") return <span className={`rounded-full border px-2 py-1 ${signalTone(row.signal_label)}`}>{value(row.signal_label)}</span>;
                if (col === "score") return num(row.score);
                if (col === "contract") return value(row.selected_contract);
                if (col === "expiration") return value(row.selected_expiration);
                if (col === "dte") return value(row.selected_dte);
                if (col === "strike") return money(row.selected_strike);
                if (col === "bid") return money(row.selected_bid);
                if (col === "ask") return money(row.selected_ask);
                if (col === "mid") return money(row.selected_mid);
                if (col === "last") return money(row.selected_last);
                if (col === "spread") return pct(row.selected_spread_pct);
                if (col === "volume") return value(row.selected_volume);
                if (col === "oi") return value(row.selected_open_interest);
                if (col === "status") return value(row.selection_status);
                if (col === "reason") return <span title={value(row.selection_reason)}>{value(row.selection_reason)}</span>;
                if (col === "quality") return <span title={value(row.data_quality_notes)}>{value(row.data_quality_notes)}</span>;
                return value(row[col]);
              }}
            />
          ) : (
            <EmptyState>No CALL_TEST or CALL_WATCH contracts in current feed.</EmptyState>
          )}
        </Section>

        <Section title="Snapshot Tape" subtitle={showAllSnapshots ? "all tickers" : "CALL_TEST / CALL_WATCH"}>
          <div className="mb-4">
            <button
              onClick={() => setShowAllSnapshots((x) => !x)}
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400 transition hover:border-blue-400/40 hover:text-white"
            >
              {showAllSnapshots ? "Show CALL_TEST / CALL_WATCH" : "Show all tickers"}
            </button>
          </div>

          <Table
            rows={snapshotRows}
            columns={[
              "time",
              "ticker",
              "group",
              "signal",
              "score",
              "rank",
              "contract",
              "expiration",
              "dte",
              "strike",
              "bid",
              "ask",
              "mid",
              "spread",
              "chain",
              "eligible",
              "usable",
              "rejected",
              "chain_status",
              "selection_status",
              "reason",
              "quality",
            ]}
            render={(row, col) => {
              if (col === "time") return value(row.timestamp_market_et);
              if (col === "ticker") return <span className="font-semibold text-white">{value(row.ticker)}</span>;
              if (col === "group") return value(row.group_name);
              if (col === "signal") return <span className={`rounded-full border px-2 py-1 ${signalTone(row.signal_label)}`}>{value(row.signal_label)}</span>;
              if (col === "score") return num(row.score);
              if (col === "rank") return value(row.rank);
              if (col === "contract") return value(row.selected_contract);
              if (col === "expiration") return value(row.selected_expiration);
              if (col === "dte") return value(row.selected_dte);
              if (col === "strike") return money(row.selected_strike);
              if (col === "bid") return money(row.selected_bid);
              if (col === "ask") return money(row.selected_ask);
              if (col === "mid") return money(row.selected_mid);
              if (col === "spread") return pct(row.selected_spread_pct);
              if (col === "chain") return value(row.chain_contract_count);
              if (col === "eligible") return value(row.eligible_contract_count);
              if (col === "usable") return value(row.usable_contract_count);
              if (col === "rejected") return value(row.rejected_contract_count);
              if (col === "chain_status") return value(row.option_chain_status);
              if (col === "selection_status") return value(row.selection_status);
              if (col === "reason") return <span title={value(row.selection_reason)}>{value(row.selection_reason)}</span>;
              if (col === "quality") return <span title={value(row.data_quality_notes)}>{value(row.data_quality_notes)}</span>;
              return value(row[col]);
            }}
          />
        </Section>

        <Section title="Outcome Tracker">
          <Table
            rows={feed.outcomes || []}
            columns={[
              "signal_time",
              "checkpoint",
              "due",
              "timestamp",
              "ticker",
              "contract",
              "signal",
              "entry_mid",
              "entry_ask",
              "entry_bid",
              "checkpoint_bid",
              "checkpoint_ask",
              "checkpoint_last",
              "checkpoint_mid",
              "return_mid",
              "return_ask_bid",
              "quote_status",
              "outcome_status",
              "quality",
            ]}
            render={(row, col) => {
              if (col === "signal_time") return value(row.signal_timestamp);
              if (col === "checkpoint") return value(row.checkpoint);
              if (col === "due") return value(row.checkpoint_due_timestamp);
              if (col === "timestamp") return value(row.checkpoint_timestamp);
              if (col === "ticker") return <span className="font-semibold text-white">{value(row.ticker)}</span>;
              if (col === "contract") return value(row.contract);
              if (col === "signal") return <span className={`rounded-full border px-2 py-1 ${signalTone(row.signal_label)}`}>{value(row.signal_label)}</span>;
              if (col === "entry_mid") return money(row.entry_mid);
              if (col === "entry_ask") return money(row.entry_ask);
              if (col === "entry_bid") return money(row.entry_bid);
              if (col === "checkpoint_bid") return money(row.checkpoint_bid);
              if (col === "checkpoint_ask") return money(row.checkpoint_ask);
              if (col === "checkpoint_last") return money(row.checkpoint_last);
              if (col === "checkpoint_mid") return money(row.checkpoint_mid);
              if (col === "return_mid") return pct(row.return_mid);
              if (col === "return_ask_bid") return pct(row.return_ask_to_bid);
              if (col === "quote_status") return value(row.quote_status);
              if (col === "outcome_status") return value(row.outcome_status);
              if (col === "quality") return <span title={value(row.data_quality_notes)}>{value(row.data_quality_notes)}</span>;
              return value(row[col]);
            }}
          />

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <FieldCard title="Quote Status Counts">
              <pre className="whitespace-pre-wrap text-xs text-zinc-400">
                {JSON.stringify(feed.outcome_counts?.quote_status || {}, null, 2)}
              </pre>
            </FieldCard>
            <FieldCard title="Outcome Status Counts">
              <pre className="whitespace-pre-wrap text-xs text-zinc-400">
                {JSON.stringify(feed.outcome_counts?.outcome_status || {}, null, 2)}
              </pre>
            </FieldCard>
          </div>
        </Section>

        <Section title="Data Quality">
          <div className="grid gap-3 lg:grid-cols-3">
            <FieldCard title="Errors">
              <pre className="whitespace-pre-wrap text-xs text-red-300">
                {JSON.stringify(dq.errors || [], null, 2)}
              </pre>
            </FieldCard>
            <FieldCard title="Warnings">
              <pre className="whitespace-pre-wrap text-xs text-amber-300">
                {JSON.stringify(dq.warnings || [], null, 2)}
              </pre>
            </FieldCard>
            <FieldCard title="Missing / Row Availability">
              <div className="space-y-1 text-xs text-zinc-400">
                <div>missing_status_file: {value(dq.missing_status_file)}</div>
                <div>missing_scores_file: {value(dq.missing_scores_file)}</div>
                <div>missing_snapshot_file: {value(dq.missing_snapshot_file)}</div>
                <div>missing_outcome_file: {value(dq.missing_outcome_file)}</div>
                <div>score_rows_available: {value(dq.score_rows_available)}</div>
                <div>snapshot_rows_available: {value(dq.snapshot_rows_available)}</div>
                <div>outcome_rows_available: {value(dq.outcome_rows_available)}</div>
              </div>
            </FieldCard>
          </div>

          {(dq.forbidden_scheduler_files || []).length ? (
            <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-300">
              Unexpected scheduler/launchd/cron-like file found. Atra Optio is intended to be manual-run only.
            </div>
          ) : null}
        </Section>

        <details className="mt-5 rounded-3xl border border-white/10 bg-zinc-950/65 p-5">
          <summary className="cursor-pointer text-lg font-semibold text-white">Source Files / Debug</summary>
          <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-black/35 p-4 text-xs text-zinc-400">
            {JSON.stringify(sourceFiles, null, 2)}
          </pre>
        </details>

        <footer className="mt-6 rounded-3xl border border-blue-400/15 bg-blue-500/5 p-5 text-sm leading-7 text-zinc-400">
          <div className="font-semibold text-blue-300">Long-call research only.</div>
          <div>{feed.disclaimer || researchDisclaimer}</div>
          <div className="mt-2">
            Display only · No broker connection · No trade execution · No website-side scoring · No Finnhub calls from website · No crypto exposure
          </div>
        </footer>
      </div>
    </main>
  );
}
