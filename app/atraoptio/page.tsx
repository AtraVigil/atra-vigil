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

const acceptedSchemas = new Set([
  "atra_optio_dashboard_v1",
  "atra_optio_dashboard_v3_setup_outcomes_underlying_only",
]);

const fallbackDisclaimer =
  "Atra Optio is a calls-only learning dashboard. Research only. No execution. Option-chain prices are delayed/reference only; setup follow-up is based on underlying stock movement.";

const stateLabels: Record<string, string> = {
  CALL_TEST: "Strong Candidate",
  CALL_WATCH: "Watch Candidate",
  NO_TRADE: "No Setup",
  AVOID: "Avoid",
};

const reasonTranslations: Record<string, string> = {
  MARKET_RISK_OFF_BLOCKS_CALL_TEST: "Market risk condition reduced confidence.",
  NO_PREFERRED_DTE_USABLE_CONTRACT_BLOCKS_CALL_TEST: "No preferred-date contract passed rules.",
  PREFERRED_DTE_HARD_FAIL_FOR_CALL_TEST: "Contract expiration was outside the preferred range.",
  BELOW_VWAP_AND_LAGGING_GROUP_BLOCKS_CALL_TEST: "Stock was below VWAP and lagging its group.",
  DTE_OUTSIDE_PREFERRED_RANGE: "Contract expiration was outside the preferred range.",
  DTE_TOO_LOW: "Contract expires too soon.",
  CALL_TOO_EXPENSIVE: "Contract was above the preferred price range.",
  CALL_TOO_FAR_OTM: "Contract was too far out of the money.",
};

function value(v: any) {
  if (v === null || v === undefined || v === "") return "—";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
  return String(v);
}

function num(v: any, digits = 2) {
  const n = Number(v);
  if (!Number.isFinite(n)) return value(v);
  return n.toFixed(digits);
}

function pct(v: any) {
  const n = Number(v);
  if (!Number.isFinite(n)) return value(v);
  return `${(n * 100).toFixed(2)}%`;
}

function money(v: any) {
  const n = Number(v);
  if (!Number.isFinite(n)) return value(v);
  return `$${n.toFixed(2)}`;
}

function labelState(state: any) {
  const key = String(state || "");
  return stateLabels[key] || value(key);
}

function explainReason(raw: any) {
  const text = value(raw);
  if (text === "—") return "No reason supplied.";

  const parts = text
    .split(/[;,|]/)
    .map((x) => x.trim())
    .filter(Boolean);

  if (!parts.length) return text;

  const translated = parts.map((part) => reasonTranslations[part] || part.replaceAll("_", " ").toLowerCase());
  return Array.from(new Set(translated)).join(" ");
}

function statusFromFeed(data: DashboardPayload) {
  const dq = data.data_quality || {};
  const errors = Array.isArray(dq.errors) ? dq.errors : [];
  const warnings = Array.isArray(dq.warnings) ? dq.warnings : [];

  if (!data.ok) return { label: "Feed Error", tone: "red" };
  if (data.schema_version && !acceptedSchemas.has(data.schema_version)) {
    return { label: "Schema Warning", tone: "yellow" };
  }
  if (errors.length) return { label: "Data Error", tone: "red" };
  if (warnings.length) return { label: "Feed Warning", tone: "yellow" };
  return { label: "Feed OK", tone: "green" };
}

function toneClass(tone: string) {
  if (tone === "green") return "border-emerald-400/30 bg-emerald-500/10 text-emerald-300";
  if (tone === "red") return "border-red-400/30 bg-red-500/10 text-red-300";
  return "border-amber-400/30 bg-amber-500/10 text-amber-300";
}

function stateClass(state: string) {
  if (state === "CALL_TEST") return "border-emerald-400/30 bg-emerald-500/10 text-emerald-300";
  if (state === "CALL_WATCH") return "border-blue-400/30 bg-blue-500/10 text-blue-300";
  return "border-white/10 bg-white/[0.03] text-zinc-300";
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4">
      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">{title}</div>
      <div className="mt-2 text-sm text-zinc-100">{children}</div>
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
    <section className="mt-5 rounded-2xl border border-white/10 bg-zinc-950/70 p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {subtitle ? <div className="mt-1 text-xs text-zinc-500">{subtitle}</div> : null}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-black/20 p-5 text-sm text-zinc-500">
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
  if (!rows.length) return <EmptyState>No current rows.</EmptyState>;

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="min-w-full border-collapse text-left text-xs">
        <thead className="bg-white/[0.04] text-[10px] uppercase tracking-[0.16em] text-zinc-500">
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
            <tr key={`${row.ticker || row.selected_contract || row.contract || "row"}-${idx}`} className="border-b border-white/5 last:border-0">
              {columns.map((col) => (
                <td key={col} className="max-w-[320px] whitespace-nowrap px-3 py-3 text-zinc-300">
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
  const status = statusFromFeed(feed);

  const candidates = useMemo(() => {
    const selected = feed.selected_contracts || [];
    if (selected.length) return selected;

    return (feed.ranked_board || []).filter((row) =>
      ["CALL_TEST", "CALL_WATCH"].includes(row.system_state || row.signal_label),
    );
  }, [feed.selected_contracts, feed.ranked_board]);

  const setupFollowUp = useMemo(() => {
    return feed.outcomes || [];
  }, [feed.outcomes]);

  const warnings = Array.isArray(dq.warnings) ? dq.warnings : [];
  const errors = Array.isArray(dq.errors) ? dq.errors : [];

  return (
    <main className="min-h-screen bg-[#030407] px-5 py-6 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            prefetch={false}
            className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400 hover:border-blue-400/40 hover:text-white"
          >
            ← Back
          </Link>

          <div className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${toneClass(status.tone)}`}>
            {status.label}
          </div>
        </div>

        <header className="rounded-2xl border border-white/10 bg-zinc-950/75 p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.30em] text-blue-300">
            Atra Optio
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
            Calls-Only Learning Dashboard
          </h1>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-zinc-400">
            Atra Optio ranks stocks and identifies possible long-call contracts for research. It does not place trades.
            It does not show live option P&amp;L. Option-chain bid, ask, and mid values are delayed/reference fields.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Card title="Session">{value(feed.session_date)}</Card>
            <Card title="Last Updated ET">{value(feed.generated_at_market)}</Card>
            <Card title="Market">{value(runtime.market_window_state)}</Card>
            <Card title="Mode">{value(runtime.run_mode)}</Card>
            <Card title="Candidates">
              Strong: {value(counts.CALL_TEST ?? 0)} · Watch: {value(counts.CALL_WATCH ?? 0)}
            </Card>
          </div>
        </header>

        {error ? (
          <Section title="Feed Error">
            <EmptyState>{error}</EmptyState>
          </Section>
        ) : null}

        <Section title="What this means">
          <div className="grid gap-3 md:grid-cols-3">
            <Card title="Stock setup">
              The system first ranks the underlying stock using group strength, relative strength, volume, chart, and market context.
            </Card>
            <Card title="Call contract">
              The contract shown is a research candidate. Strike, expiration, DTE, ask, and spread are context fields, not trade instructions.
            </Card>
            <Card title="Follow-up">
              Current follow-up should be judged on the underlying stock setup. Option P&amp;L is not valid from the current provider.
            </Card>
          </div>
        </Section>

        <Section title="Current Call Candidates" subtitle="Strong Candidate and Watch Candidate only">
          <Table
            rows={candidates}
            columns={[
              "rank",
              "ticker",
              "group",
              "state",
              "score",
              "stock move",
              "vs group",
              "contract",
              "strike",
              "expiration",
              "dte",
              "ask ref",
              "spread",
              "reason",
            ]}
            render={(row, col) => {
              const state = row.signal_label || row.system_state;
              if (col === "rank") return value(row.rank ?? row.ticker_rank);
              if (col === "ticker") return <span className="font-semibold text-white">{value(row.ticker)}</span>;
              if (col === "group") return value(row.group_name);
              if (col === "state") return <span className={`rounded-full border px-2 py-1 ${stateClass(state)}`}>{labelState(state)}</span>;
              if (col === "score") return num(row.score ?? row.final_score);
              if (col === "stock move") return pct(row.ticker_return);
              if (col === "vs group") return pct(row.relative_to_group);
              if (col === "contract") return value(row.selected_contract);
              if (col === "strike") return money(row.selected_strike ?? row.option_strike);
              if (col === "expiration") return value(row.selected_expiration ?? row.option_expiration);
              if (col === "dte") return value(row.selected_dte ?? row.option_dte);
              if (col === "ask ref") return money(row.selected_ask ?? row.option_ask);
              if (col === "spread") return pct(row.selected_spread_pct ?? row.option_spread_pct);
              if (col === "reason") return <span title={value(row.selection_reason ?? row.reason_codes)}>{explainReason(row.selection_reason ?? row.reason_codes)}</span>;
              return value(row[col]);
            }}
          />
        </Section>

        <Section title="Setup Follow-Up" subtitle="Underlying-stock follow-up only">
          <Table
            rows={setupFollowUp}
            columns={[
              "ticker",
              "signal time",
              "checkpoint",
              "due",
              "status",
              "underlying entry",
              "underlying checkpoint",
              "underlying return",
              "notes",
            ]}
            render={(row, col) => {
              if (col === "ticker") return <span className="font-semibold text-white">{value(row.ticker)}</span>;
              if (col === "signal time") return value(row.signal_timestamp || row.timestamp_market_et || row.timestamp_market);
              if (col === "checkpoint") return value(row.checkpoint);
              if (col === "due") return value(row.checkpoint_due_timestamp || row.due_timestamp);
              if (col === "status") return value(row.status || row.outcome_status);
              if (col === "underlying entry") return money(row.underlying_entry_price || row.entry_underlying_price || row.entry_price);
              if (col === "underlying checkpoint") return money(row.underlying_checkpoint_price || row.checkpoint_underlying_price || row.checkpoint_price);
              if (col === "underlying return") return pct(row.underlying_return || row.underlying_return_pct || row.return_pct);
              if (col === "notes") return <span title={value(row.data_quality_notes)}>{value(row.data_quality_notes)}</span>;
              return value(row[col]);
            }}
          />
        </Section>

        <details className="mt-5 rounded-2xl border border-white/10 bg-zinc-950/70 p-5">
          <summary className="cursor-pointer text-sm font-semibold text-white">Data / Feed Notes</summary>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Card title="Errors">
              <pre className="whitespace-pre-wrap text-xs text-red-300">
                {JSON.stringify(errors, null, 2)}
              </pre>
            </Card>
            <Card title="Warnings">
              <pre className="whitespace-pre-wrap text-xs text-amber-300">
                {JSON.stringify(warnings, null, 2)}
              </pre>
            </Card>
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 text-xs leading-6 text-zinc-400">
            Google Sheet read-only display. No website-side scoring. No broker connection. No execution.
          </div>
        </details>

        <footer className="mt-5 rounded-2xl border border-white/10 bg-zinc-950/70 p-4 text-sm leading-6 text-zinc-400">
          {feed.disclaimer || fallbackDisclaimer}
        </footer>
      </div>
    </main>
  );
}
