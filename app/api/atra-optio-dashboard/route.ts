import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

const SUPPORTED_SCHEMA = "atra_optio_dashboard_v1";

function unavailablePayload(message: string) {
  return {
    ok: false,
    schema_version: null,
    generated_at_utc: null,
    generated_at_market: null,
    session_date: null,
    runtime: {
      run_mode: "NO_FEED",
      market_window_state: "NO_FEED",
      artifact_policy: "display_only",
    },
    counts: {},
    ranked_board: [],
    selected_contracts: [],
    snapshot_tape_latest: [],
    outcomes: [],
    outcome_counts: {},
    data_quality: {
      errors: [message],
      warnings: [],
      forbidden_scheduler_files: [],
      score_rows_available: 0,
      snapshot_rows_available: 0,
      outcome_rows_available: 0,
    },
    source_files: {},
    display_rules: {},
    disclaimer:
      "Atra Optio is forward-test research only. Long calls only. No execution. No edge claim.",
  };
}

export async function GET() {
  const filePath = path.join(process.cwd(), "data", "web", "atra_optio_dashboard.json");

  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);

    if (parsed?.schema_version !== SUPPORTED_SCHEMA) {
      return NextResponse.json(
        unavailablePayload("UNSUPPORTED_OR_MISSING_SCHEMA_VERSION"),
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        ...parsed,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch {
    return NextResponse.json(unavailablePayload("ATRA_OPTIO_DASHBOARD_JSON_NOT_FOUND"), {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  }
}
