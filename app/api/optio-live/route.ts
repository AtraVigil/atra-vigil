import { google } from "googleapis";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SPREADSHEET_ID = "17TeLmbUIW6-wU4y07KPZMhqqfHHstmG9liq3pgGlxXI";
const RANGE = "Optio_LiveMonitor!A1:Q100";

const EXPECTED_HEADERS = [
  "session_date",
  "capture_timestamp_utc",
  "capture_timestamp_ct",
  "group_name",
  "underlying_ticker",
  "call_contracts",
  "put_contracts",
  "put_contract_count",
  "put_open_interest_total",
  "put_day_volume_total",
  "put_iv_min",
  "put_iv_median",
  "put_iv_max",
  "data_status",
  "minutes_since_capture",
  "manifest_available",
  "put_context_available",
];

function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function boolFromCell(value: unknown) {
  return String(value || "").toUpperCase() === "TRUE";
}

function privateKey() {
  return (process.env.ATRA_PRAE_GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
}

export async function GET() {
  try {
    const clientEmail = process.env.ATRA_PRAE_GOOGLE_CLIENT_EMAIL || "";
    const key = privateKey();

    if (!clientEmail || !key) {
      return NextResponse.json(
        { ok: false, error: "Google Sheets credentials are not configured" },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }

    const auth = new google.auth.JWT({
      email: clientEmail,
      key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
      valueRenderOption: "UNFORMATTED_VALUE",
    });

    const values = res.data.values || [];
    if (!values.length) {
      throw new Error("Optio_LiveMonitor is empty");
    }

    const headers = values[0].map(String);
    if (headers.join("|") !== EXPECTED_HEADERS.join("|")) {
      throw new Error("Optio_LiveMonitor header contract mismatch");
    }

    const rows = values.slice(1).filter((row) => row[4]).map((row) => ({
      sessionDate: String(row[0] || ""),
      captureTimestampUtc: String(row[1] || ""),
      captureTimestampCt: String(row[2] || ""),
      groupName: String(row[3] || ""),
      ticker: String(row[4] || ""),
      callContracts: numberOrNull(row[5]),
      putContracts: numberOrNull(row[6]),
      putContractCount: numberOrNull(row[7]),
      putOpenInterestTotal: numberOrNull(row[8]),
      putDayVolumeTotal: numberOrNull(row[9]),
      putIvMin: numberOrNull(row[10]),
      putIvMedian: numberOrNull(row[11]),
      putIvMax: numberOrNull(row[12]),
      dataStatus: String(row[13] || "MISSING"),
      minutesSinceCapture: numberOrNull(row[14]),
      manifestAvailable: boolFromCell(row[15]),
      putContextAvailable: boolFromCell(row[16]),
    }));

    if (rows.length !== 35) {
      throw new Error(`Expected 35 Optio rows, received ${rows.length}`);
    }

    const first = rows[0];
    return NextResponse.json(
      {
        ok: true,
        source: "Optio_LiveMonitor",
        updatedAt: new Date().toISOString(),
        sessionDate: first?.sessionDate || null,
        captureTimestampUtc: first?.captureTimestampUtc || null,
        captureTimestampCt: first?.captureTimestampCt || null,
        rows,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Unknown Optio LiveMonitor error",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
