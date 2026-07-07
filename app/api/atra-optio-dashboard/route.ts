import { NextResponse } from "next/server";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";

const SHEET_ID = "17TeLmbUIW6-wU4y07KPZMhqqfHHstmG9liq3pgGlxXI";

const TAB_NAMES = {
  runtime: "Optio_Runtime",
  counts: "Optio_Counts",
  ranked: "Optio_Ranked",
  selected: "Optio_Selected",
  snapshots: "Optio_Snapshots",
  outcomes: "Optio_OptionOutcomes_InvalidProvider",
  dataQuality: "Optio_DataQuality",
  sourceFiles: "Optio_SourceFiles",
};

const SCHEMA_VERSION = "atra_optio_dashboard_v3_setup_outcomes_underlying_only";

type Row = Record<string, any>;

function base64url(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function normalizePrivateKey(key: string) {
  return key.replace(/\\n/g, "\n");
}

function getServiceAccount() {
  const rawJson =
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON ||
    process.env.GOOGLE_CREDENTIALS_JSON ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ||
    "";

  const rawBase64 =
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 ||
    process.env.GOOGLE_CREDENTIALS_BASE64 ||
    "";

  if (rawJson.trim()) {
    const parsed = JSON.parse(rawJson);
    return {
      client_email: parsed.client_email,
      private_key: normalizePrivateKey(parsed.private_key),
    };
  }

  if (rawBase64.trim()) {
    const parsed = JSON.parse(Buffer.from(rawBase64, "base64").toString("utf8"));
    return {
      client_email: parsed.client_email,
      private_key: normalizePrivateKey(parsed.private_key),
    };
  }

  const clientEmail =
    process.env.GOOGLE_CLIENT_EMAIL ||
    process.env.ATRA_PRAE_GOOGLE_CLIENT_EMAIL ||
    "";

  const privateKey =
    process.env.GOOGLE_PRIVATE_KEY ||
    process.env.ATRA_PRAE_GOOGLE_PRIVATE_KEY ||
    "";

  if (clientEmail && privateKey) {
    return {
      client_email: clientEmail,
      private_key: normalizePrivateKey(privateKey),
    };
  }

  throw new Error("GOOGLE_SERVICE_ACCOUNT_CREDENTIALS_NOT_CONFIGURED");
}

async function getAccessToken() {
  const service = getServiceAccount();

  if (!service.client_email || !service.private_key) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_MISSING_EMAIL_OR_PRIVATE_KEY");
  }

  const now = Math.floor(Date.now() / 1000);

  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const claim = {
    iss: service.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claim))}`;
  const signature = crypto
    .createSign("RSA-SHA256")
    .update(unsigned)
    .sign(service.private_key);

  const jwt = `${unsigned}.${base64url(signature)}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GOOGLE_TOKEN_REQUEST_FAILED_${response.status}_${text.slice(0, 160)}`);
  }

  const json = await response.json();
  return json.access_token as string;
}

async function readRange(accessToken: string, tabName: string) {
  const range = encodeURIComponent(`'${tabName}'`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?majorDimension=ROWS`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SHEET_READ_FAILED_${tabName}_${response.status}_${text.slice(0, 160)}`);
  }

  const json = await response.json();
  return (json.values || []) as any[][];
}

async function readOptionalRange(accessToken: string, tabName: string) {
  try {
    return await readRange(accessToken, tabName);
  } catch {
    return [] as any[][];
  }
}

function deriveCounts(runtime: Row, selectedContracts: Row[], rankedBoard: Row[], countsParsed: Row[] | Row) {
  const fromTab = countsToObject(countsParsed);
  const out: Row = { ...fromTab };

  const labels = ["CALL_TEST", "CALL_WATCH", "NO_TRADE", "AVOID"];

  for (const label of labels) {
    if (out[label] === undefined || out[label] === null) {
      const runtimeKey = cleanKey(`${label}_count`);
      if (runtime[runtimeKey] !== undefined && runtime[runtimeKey] !== null) {
        out[label] = runtime[runtimeKey];
      }
    }
  }

  if (out.CALL_TEST === undefined || out.CALL_WATCH === undefined) {
    const selectedCounts: Row = {};
    for (const row of selectedContracts) {
      const label = String(row.signal_label || row.system_state || "").trim();
      if (!label) continue;
      selectedCounts[label] = (Number(selectedCounts[label] || 0) || 0) + 1;
    }

    for (const label of labels) {
      if (out[label] === undefined && selectedCounts[label] !== undefined) {
        out[label] = selectedCounts[label];
      }
    }
  }

  if (out.NO_TRADE === undefined || out.AVOID === undefined) {
    const rankedCounts: Row = {};
    for (const row of rankedBoard) {
      const label = String(row.system_state || row.signal_label || "").trim();
      if (!label) continue;
      rankedCounts[label] = (Number(rankedCounts[label] || 0) || 0) + 1;
    }

    for (const label of labels) {
      if (out[label] === undefined && rankedCounts[label] !== undefined) {
        out[label] = rankedCounts[label];
      }
    }
  }

  for (const label of labels) {
    if (out[label] === undefined || out[label] === null) out[label] = 0;
  }

  return out;
}


function cleanKey(key: any) {
  return String(key || "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\w]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase();
}

function coerce(value: any) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  if (text === "") return null;

  if (text === "TRUE") return true;
  if (text === "FALSE") return false;
  if (text === "true") return true;
  if (text === "false") return false;

  if ((text.startsWith("[") && text.endsWith("]")) || (text.startsWith("{") && text.endsWith("}"))) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  const numeric = Number(text.replace(/,/g, ""));
  if (Number.isFinite(numeric) && /^-?\d+(\.\d+)?$/.test(text.replace(/,/g, ""))) {
    return numeric;
  }

  return text;
}

function rowsToObjects(values: any[][]): Row[] {
  if (!values.length) return [];

  const headers = values[0].map(cleanKey);

  return values.slice(1).map((row) => {
    const obj: Row = {};
    headers.forEach((header, index) => {
      if (!header) return;
      obj[header] = coerce(row[index]);
    });
    return obj;
  });
}

function keyValueRowsToObject(values: any[][]): Row {
  const obj: Row = {};

  for (const row of values) {
    if (!row || row.length < 2) continue;
    const key = cleanKey(row[0]);
    if (!key) continue;
    obj[key] = coerce(row[1]);
  }

  return obj;
}

function parseFlexible(values: any[][]): Row[] | Row {
  if (!values.length) return [];

  const first = values[0] || [];
  const firstA = cleanKey(first[0]);
  const firstB = cleanKey(first[1]);

  const looksLikeKeyValue =
    values.length > 1 &&
    first.length <= 2 &&
    !["ticker", "symbol", "contract", "selected_contract", "checkpoint"].includes(firstA) &&
    !["ticker", "symbol", "contract", "selected_contract", "checkpoint"].includes(firstB);

  if (looksLikeKeyValue) return keyValueRowsToObject(values);

  return rowsToObjects(values);
}

function valueFromRows(rows: Row[], key: string) {
  const cleaned = cleanKey(key);

  for (const row of rows) {
    if (row[cleaned] !== undefined) return row[cleaned];
    if (cleanKey(row.key) === cleaned) return row.value;
    if (cleanKey(row.field) === cleaned) return row.value;
    if (cleanKey(row.metric) === cleaned) return row.value;
    if (cleanKey(row.name) === cleaned) return row.value;
  }

  return undefined;
}

function countsToObject(parsed: Row[] | Row) {
  if (!Array.isArray(parsed)) return parsed || {};

  const out: Row = {};
  for (const row of parsed) {
    const label =
      row.signal_label ||
      row.system_state ||
      row.state ||
      row.label ||
      row.key ||
      row.metric ||
      row.name;

    const count =
      row.count ??
      row.value ??
      row.total ??
      row.rows ??
      row.qty ??
      row.quantity;

    if (label !== undefined) out[String(label)] = count ?? 0;
  }

  return out;
}

function dataQualityToObject(parsed: Row[] | Row) {
  if (!Array.isArray(parsed)) {
    const out = parsed || {};
    return {
      errors: Array.isArray(out.errors) ? out.errors : out.errors ? [out.errors] : [],
      warnings: Array.isArray(out.warnings) ? out.warnings : out.warnings ? [out.warnings] : [],
      forbidden_scheduler_files: Array.isArray(out.forbidden_scheduler_files)
        ? out.forbidden_scheduler_files
        : out.forbidden_scheduler_files
          ? [out.forbidden_scheduler_files]
          : [],
      ...out,
    };
  }

  const out: Row = {
    errors: [],
    warnings: [],
    forbidden_scheduler_files: [],
  };

  for (const row of parsed) {
    const key = cleanKey(row.key || row.field || row.metric || row.name || row.check || row.item);
    const val = row.value ?? row.status ?? row.result ?? row.notes ?? row.note;

    if (!key) continue;

    if (key.includes("error") && val) out.errors.push(val);
    else if (key.includes("warning") && val) out.warnings.push(val);
    else if (key.includes("forbidden_scheduler") && val) out.forbidden_scheduler_files.push(val);
    else out[key] = val;
  }

  return out;
}

function sourceFilesToObject(parsed: Row[] | Row) {
  if (!Array.isArray(parsed)) return parsed || {};

  const out: Row = {};
  for (const row of parsed) {
    const key = cleanKey(row.key || row.field || row.metric || row.name || row.file || row.source);
    const val = row.value ?? row.path ?? row.file_path ?? row.location ?? row.status;
    if (key) out[key] = val;
  }
  return out;
}

function runtimeToObject(parsed: Row[] | Row) {
  if (!Array.isArray(parsed)) return parsed || {};

  const direct = keyValueRowsToObject(
    parsed.map((row) => [
      row.key || row.field || row.metric || row.name || row.runtime_field,
      row.value ?? row.status ?? row.result ?? row.rows ?? row.timestamp,
    ]),
  );

  if (Object.keys(direct).length) return direct;

  return parsed[0] || {};
}

function unavailablePayload(message: string) {
  return {
    ok: false,
    schema_version: SCHEMA_VERSION,
    generated_at_utc: new Date().toISOString(),
    generated_at_market: null,
    session_date: null,
    runtime: {
      run_mode: "SHEET_READ_ERROR",
      market_window_state: "SHEET_READ_ERROR",
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
    source_files: {
      google_sheet_id: SHEET_ID,
    },
    display_rules: {},
    disclaimer:
      "Atra Optio is a calls-only learning dashboard. Research only. No execution. Option-chain prices are delayed/reference only; setup follow-up is based on underlying stock movement.",
  };
}

export async function GET() {
  try {
    const accessToken = await getAccessToken();

    const [
      runtimeValues,
      countsValues,
      rankedValues,
      selectedValues,
      snapshotsValues,
      outcomesValues,
      dataQualityValues,
      sourceFilesValues,
    ] = await Promise.all([
      readRange(accessToken, TAB_NAMES.runtime),
      readOptionalRange(accessToken, TAB_NAMES.counts),
      readRange(accessToken, TAB_NAMES.ranked),
      readRange(accessToken, TAB_NAMES.selected),
      readOptionalRange(accessToken, TAB_NAMES.snapshots),
      readOptionalRange(accessToken, TAB_NAMES.outcomes),
      readOptionalRange(accessToken, TAB_NAMES.dataQuality),
      readOptionalRange(accessToken, TAB_NAMES.sourceFiles),
    ]);

    const runtimeParsed = parseFlexible(runtimeValues);
    const countsParsed = parseFlexible(countsValues);
    const rankedBoard = rowsToObjects(rankedValues);
    const selectedContracts = rowsToObjects(selectedValues);
    const snapshotTapeLatest = rowsToObjects(snapshotsValues);
    const outcomes = rowsToObjects(outcomesValues);
    const dataQualityParsed = parseFlexible(dataQualityValues);
    const sourceFilesParsed = parseFlexible(sourceFilesValues);

    const runtime = runtimeToObject(runtimeParsed);
    const dataQuality = dataQualityToObject(dataQualityParsed);
    const sourceFiles = {
      google_sheet_id: SHEET_ID,
      ...sourceFilesToObject(sourceFilesParsed),
    };

    const payload = {
      ok: true,
      schema_version: SCHEMA_VERSION,
      generated_at_utc:
        runtime.generated_at_utc ||
        runtime.generated_utc ||
        runtime.latest_generated_at_utc ||
        new Date().toISOString(),
      generated_at_market:
        runtime.generated_at_market ||
        runtime.generated_market ||
        runtime.latest_feed_market ||
        runtime.latest_file_timestamp_local ||
        null,
      session_date: runtime.session_date || runtime.date || null,
      runtime,
      counts: deriveCounts(runtime, selectedContracts, rankedBoard, countsParsed),
      ranked_board: rankedBoard,
      selected_contracts: selectedContracts,
      snapshot_tape_latest: snapshotTapeLatest,
      outcomes,
      outcome_counts: {},
      data_quality: {
        errors: [],
        warnings: [
          ...(!countsValues.length ? ["Optio_Counts tab is missing; counts derived from runtime/rows."] : []),
          ...(!snapshotsValues.length ? ["Optio_Snapshots tab is missing; snapshot tape hidden for learning view."] : []),
          ...(!outcomesValues.length ? ["Optio outcomes tab is missing; setup follow-up is empty."] : []),
        ],
        forbidden_scheduler_files: [],
        score_rows_available: rankedBoard.length,
        snapshot_rows_available: snapshotTapeLatest.length,
        outcome_rows_available: outcomes.length,
        ...dataQuality,
      },
      source_files: sourceFiles,
      display_rules: {
        source: "google_sheets_read_only",
        no_finnhub_calls_from_website: true,
        no_website_side_scoring: true,
        no_sheet_mutation: true,
      },
      disclaimer:
        "Atra Optio is a calls-only learning dashboard. Research only. No execution. Option-chain prices are delayed/reference only; setup follow-up is based on underlying stock movement.",
    };

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_SHEET_READ_ERROR";

    return NextResponse.json(unavailablePayload(message), {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  }
}
