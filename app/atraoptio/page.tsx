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

type SectorGroup = {
  groupName: string;
  rows: AnyRecord[];
  best: AnyRecord | null;
  bestStateRank: number;
  bestScore: number;
  avgScore: number;
};

const acceptedSchemas = new Set([
  "atra_optio_dashboard_v1",
  "atra_optio_dashboard_v3_setup_outcomes_underlying_only",
]);

const fallbackDisclaimer =
  "Atra Optio is a calls-only learning dashboard. Research only. No execution. Option-chain prices are delayed/reference only; setup follow-up is based on underlying stock movement.";

const stateLabels: Record<string, string> = {
  CALL_TEST: "Strong",
  CALL_WATCH: "Watch",
  NO_TRADE: "No Setup",
  AVOID: "Avoid",
};

const longStateLabels: Record<string, string> = {
  CALL_TEST: "Strong Candidate",
  CALL_WATCH: "Watch Candidate",
  NO_TRADE: "No Setup",
  AVOID: "Avoid",
};

const stateRank: Record<string, number> = {
  CALL_TEST: 1,
  CALL_WATCH: 2,
  NO_TRADE: 3,
  AVOID: 4,
};

const reasonTranslations: Record<string, string> = {
  MARKET_RISK_OFF_BLOCKS_CALL_TEST: "Market risk reduced confidence.",
  NO_PREFERRED_DTE_USABLE_CONTRACT_BLOCKS_CALL_TEST: "No preferred-date contract passed.",
  PREFERRED_DTE_HARD_FAIL_FOR_CALL_TEST: "Expiration outside preferred range.",
  BELOW_VWAP_AND_LAGGING_GROUP_BLOCKS_CALL_TEST: "Below VWAP and lagging group.",
  DTE_OUTSIDE_PREFERRED_RANGE: "Expiration outside preferred range.",
  DTE_TOO_LOW: "Expires too soon.",
  CALL_TOO_EXPENSIVE: "Above preferred price range.",
  CALL_TOO_FAR_OTM: "Too far out of the money.",
  NEWS_WIRE_NOT_WIRED: "News wire not wired.",
  BELOW_VWAP: "Below VWAP.",
};

function value(v: any) {
  if (v === null || v === undefined || v === "") return "—";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
  return String(v);
}

function num(v: any, digits = 1) {
  const n = Number(v);
  if (!Number.isFinite(n)) return value(v);
  return n.toFixed(digits);
}

function pct(v: any) {
  const n = Number(v);
  if (!Number.isFinite(n)) return value(v);

  // Optio feed mixes true ratios such as 0.1159 for spread_pct
  // with percent-point fields such as 5.49 for ticker_return.
  const shown = Math.abs(n) > 1 ? n : n * 100;
  return `${shown.toFixed(2)}%`;
}

function money(v: any) {
  const n = Number(v);
  if (!Number.isFinite(n)) return value(v);
  return `$${n.toFixed(2)}`;
}

function rowState(row: AnyRecord) {
  return String(row.signal_label || row.system_state || "").trim();
}

function rowScore(row: AnyRecord) {
  const n = Number(row.score ?? row.final_score);
  return Number.isFinite(n) ? n : -999;
}

function labelState(state: any, long = false) {
  const key = String(state || "");
  return (long ? longStateLabels[key] : stateLabels[key]) || value(key);
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
  if (warnings.length) return { label: "Feed Notes", tone: "yellow" };
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
  if (state === "AVOID") return "border-red-400/20 bg-red-500/5 text-red-300";
  return "border-white/10 bg-white/[0.03] text-zinc-300";
}

function sectorClass(bestState: string) {
  if (bestState === "CALL_TEST") return "border-emerald-400/25";
  if (bestState === "CALL_WATCH") return "border-blue-400/25";
  if (bestState === "AVOID") return "border-red-400/15";
  return "border-white/10";
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

function buildSectorGroups(rows: AnyRecord[]): SectorGroup[] {
  const byGroup = new Map<string, AnyRecord[]>();

  for (const row of rows) {
    const groupName = String(row.group_name || "Unassigned").trim() || "Unassigned";
    if (!byGroup.has(groupName)) byGroup.set(groupName, []);
    byGroup.get(groupName)!.push(row);
  }

  const groups: SectorGroup[] = Array.from(byGroup.entries()).map(([groupName, groupRows]) => {
    const sortedRows = [...groupRows].sort((a, b) => {
      const ar = stateRank[rowState(a)] || 99;
      const br = stateRank[rowState(b)] || 99;
      if (ar !== br) return ar - br;
      return rowScore(b) - rowScore(a);
    });

    const best = sortedRows[0] || null;
    const scores = sortedRows.map(rowScore).filter((n) => n > -999);
    const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : -999;

    return {
      groupName,
      rows: sortedRows,
      best,
      bestStateRank: best ? stateRank[rowState(best)] || 99 : 99,
      bestScore: best ? rowScore(best) : -999,
      avgScore,
    };
  });

  groups.sort((a, b) => {
    if (a.bestStateRank !== b.bestStateRank) return a.bestStateRank - b.bestStateRank;
    if (b.bestScore !== a.bestScore) return b.bestScore - a.bestScore;
    return b.avgScore - a.avgScore;
  });

  return groups;
}

function SectorCard({ group, index }: { group: SectorGroup; index: number }) {
  const best = group.best || {};
  const bestState = rowState(best);

  return (
    <div className={`rounded-2xl border bg-zinc-950/75 p-4 ${sectorClass(bestState)}`}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
            Sector #{index + 1}
          </div>
          <h3 className="mt-1 text-base font-semibold text-white">{group.groupName}</h3>
          <div className="mt-2 text-xs text-zinc-500">
            Best: <span className="text-zinc-200">{value(best.ticker)}</span>
            {" · "}
            <span className={bestState === "CALL_TEST" ? "text-emerald-300" : bestState === "CALL_WATCH" ? "text-blue-300" : "text-zinc-300"}>
              {labelState(bestState, true)}
            </span>
            {" · "}
            Score {num(group.bestScore)}
          </div>
        </div>

        <div className="text-right text-xs text-zinc-500">
          <div>Avg score</div>
          <div className="mt-1 text-lg font-semibold text-zinc-200">{group.avgScore > -999 ? num(group.avgScore) : "—"}</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="bg-white/[0.04] text-[10px] uppercase tracking-[0.14em] text-zinc-500">
            <tr>
              <th className="px-2 py-2">#</th>
              <th className="px-2 py-2">Ticker</th>
              <th className="px-2 py-2">State</th>
              <th className="px-2 py-2 text-right">Score</th>
              <th className="px-2 py-2 text-right">Ask</th>
              <th className="px-2 py-2">Reason</th>
            </tr>
          </thead>
          <tbody>
            {group.rows.map((row, rowIndex) => {
              const state = rowState(row);
              const reason = explainReason(row.selection_reason ?? row.reason_codes);
              return (
                <tr key={`${group.groupName}-${row.ticker}-${rowIndex}`} className="border-t border-white/5">
                  <td className="px-2 py-2 text-zinc-500">{rowIndex + 1}</td>
                  <td className="px-2 py-2 font-semibold text-white">{value(row.ticker)}</td>
                  <td className="px-2 py-2">
                    <span className={`rounded-full border px-2 py-1 text-[10px] ${stateClass(state)}`}>
                      {labelState(state)}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-right text-zinc-300">{num(rowScore(row))}</td>
                  <td className="px-2 py-2 text-right text-zinc-300">{money(row.selected_ask ?? row.option_ask)}</td>
                  <td className="max-w-[220px] truncate px-2 py-2 text-zinc-400" title={reason}>
                    {reason}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <details className="mt-3">
        <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-300">Contract details</summary>
        <div className="mt-3 space-y-2">
          {group.rows.map((row, idx) => (
            <div key={`${row.ticker}-detail-${idx}`} className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs leading-6 text-zinc-400">
              <div className="font-semibold text-zinc-200">{value(row.ticker)} · {value(row.selected_contract)}</div>
              <div>
                Exp: {value(row.selected_expiration ?? row.option_expiration)} · DTE: {value(row.selected_dte ?? row.option_dte)} · Strike: {money(row.selected_strike ?? row.option_strike)} · Spread: {pct(row.selected_spread_pct ?? row.option_spread_pct)}
              </div>
              <div>Stock move: {pct(row.ticker_return)} · Vs group: {pct(row.relative_to_group)}</div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

function FollowUpTable({ rows }: { rows: AnyRecord[] }) {
  if (!rows.length) return <EmptyState>No setup follow-up rows in current feed.</EmptyState>;

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="min-w-full border-collapse text-left text-xs">
        <thead className="bg-white/[0.04] text-[10px] uppercase tracking-[0.16em] text-zinc-500">
          <tr>
            {["Ticker", "Signal Time", "Checkpoint", "Due", "Status", "Underlying Entry", "Underlying Checkpoint", "Underlying Return", "Notes"].map((col) => (
              <th key={col} className="whitespace-nowrap border-b border-white/10 px-3 py-3">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={`${row.ticker || "row"}-${idx}`} className="border-b border-white/5 last:border-0">
              <td className="px-3 py-3 font-semibold text-white">{value(row.ticker)}</td>
              <td className="px-3 py-3 text-zinc-300">{value(row.signal_timestamp || row.timestamp_market_et || row.timestamp_market)}</td>
              <td className="px-3 py-3 text-zinc-300">{value(row.checkpoint)}</td>
              <td className="px-3 py-3 text-zinc-300">{value(row.checkpoint_due_timestamp || row.due_timestamp)}</td>
              <td className="px-3 py-3 text-zinc-300">{value(row.status || row.outcome_status)}</td>
              <td className="px-3 py-3 text-zinc-300">{money(row.underlying_entry_price || row.entry_underlying_price || row.entry_price)}</td>
              <td className="px-3 py-3 text-zinc-300">{money(row.underlying_checkpoint_price || row.checkpoint_underlying_price || row.checkpoint_price)}</td>
              <td className="px-3 py-3 text-zinc-300">{pct(row.underlying_return || row.underlying_return_pct || row.return_pct)}</td>
              <td className="max-w-[320px] truncate px-3 py-3 text-zinc-400" title={value(row.data_quality_notes)}>{value(row.data_quality_notes)}</td>
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

  const boardRows = useMemo(() => {
    const ranked = feed.ranked_board || [];
    const selected = feed.selected_contracts || [];

    const selectedByTicker = new Map<string, AnyRecord>();
    for (const row of selected) {
      const ticker = String(row.ticker || "").trim();
      if (ticker) selectedByTicker.set(ticker, row);
    }

    return ranked.map((row) => {
      const ticker = String(row.ticker || "").trim();
      const selectedRow = selectedByTicker.get(ticker);
      return selectedRow ? { ...row, ...selectedRow } : row;
    });
  }, [feed.ranked_board, feed.selected_contracts]);

  const sectorGroups = useMemo(() => buildSectorGroups(boardRows), [boardRows]);

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
            Atra Optio ranks sectors, ranks the five tickers inside each sector, and identifies possible long-call contracts for research.
            No execution. Option-chain bid, ask, and mid values are delayed/reference fields.
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
            <Card title="Sector first">
              Each box is one sector. Sectors are ranked by the strongest ticker setup inside that sector.
            </Card>
            <Card title="Ticker second">
              Each sector ranks its five tickers from strongest to weakest using signal state first, then score.
            </Card>
            <Card title="Contract context">
              Ask, strike, expiration, DTE, and spread are contract context only. They are not trade instructions.
            </Card>
          </div>
        </Section>

        <Section title="Sector Candidate Board" subtitle="Seven sectors expected · five tickers per sector">
          {sectorGroups.length ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {sectorGroups.map((group, index) => (
                <SectorCard key={group.groupName} group={group} index={index} />
              ))}
            </div>
          ) : (
            <EmptyState>No sector rows in current feed.</EmptyState>
          )}
        </Section>

        <Section title="Setup Follow-Up" subtitle="Underlying-stock follow-up only">
          <FollowUpTable rows={feed.outcomes || []} />
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
