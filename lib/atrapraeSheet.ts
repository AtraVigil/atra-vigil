import { google } from "googleapis";

export type ImportRow = {
  ticker: string;
  date?: string;
  snapshotTime?: string;
};

export type ImportSource = {
  file: string;
  sessionDate: string;
  snapshotTime: string;
  count: number;
};

export type CandidateRow = {
  eventId: string;
  ticker: string;
  timestamp: string;
  price: string;
  threeMPass: string;
  wmicroActive: string;
};

export type CandidateSummary = {
  count: number;
  threeMPassCount: number;
  wmicroActiveCount: number;
};

export type WMicroRow = {
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

export type WMicroSummary = {
  sessions: number;
  active: number;
  supporting: number;
  fading: number;
  thin: number;
  neutral: number;
};

export type AtraPraeData = {
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
    file: "Google Sheet not configured",
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

type SheetRow = Record<string, string>;

function normalizeKey(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function cell(row: SheetRow, keys: string[]): string {
  for (const key of keys) {
    const value = row[normalizeKey(key)];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

function upper(value: string): string {
  return String(value || "").trim().toUpperCase();
}

function yesNo(value: boolean): "YES" | "NO" {
  return value ? "YES" : "NO";
}

function quoteSheetName(name: string): string {
  return `'${name.replace(/'/g, "''")}'!A:ZZ`;
}

function rowsFromValues(values: unknown[][] | undefined | null): SheetRow[] {
  if (!values || values.length < 2) {
    return [];
  }

  const headers = values[0].map((header) => normalizeKey(String(header || "")));

  return values.slice(1).map((line) => {
    const row: SheetRow = {};

    headers.forEach((header, index) => {
      if (!header) return;
      row[header] = String(line[index] ?? "").trim();
    });

    return row;
  });
}

async function getSheetsClient(): Promise<{
  sheetId: string;
  sheets: ReturnType<typeof google.sheets>;
}> {
  const sheetId = process.env.ATRA_PRAE_SHEET_ID;
  const clientEmail = process.env.ATRA_PRAE_GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.ATRA_PRAE_GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!sheetId) {
    throw new Error("Google Sheets data source is not configured. Missing: ATRA_PRAE_SHEET_ID");
  }

  if (!clientEmail) {
    throw new Error("Google Sheets data source is not configured. Missing: ATRA_PRAE_GOOGLE_CLIENT_EMAIL");
  }

  if (!privateKey) {
    throw new Error("Google Sheets data source is not configured. Missing: ATRA_PRAE_GOOGLE_PRIVATE_KEY");
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  return {
    sheetId,
    sheets: google.sheets({ version: "v4", auth }),
  };
}

async function readFirstAvailableTab(
  sheets: Awaited<ReturnType<typeof getSheetsClient>>["sheets"],
  sheetId: string,
  names: string[],
): Promise<{ name: string; rows: SheetRow[] }> {
  const errors: string[] = [];

  for (const name of names) {
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: quoteSheetName(name),
        valueRenderOption: "FORMATTED_VALUE",
        dateTimeRenderOption: "FORMATTED_STRING",
      });

      return {
        name,
        rows: rowsFromValues(response.data.values),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${name}: ${message}`);
    }
  }

  return {
    name: names[0] || "unknown",
    rows: [],
  };
}

function mapImportRows(rows: SheetRow[], sourceName: string): { source: ImportSource; rows: ImportRow[] } {
  const importRows = rows
    .map((row) => ({
      ticker: upper(cell(row, ["ticker", "symbol"])),
      date: cell(row, ["date", "session_date", "session date"]),
      snapshotTime: cell(row, ["snapshot_time", "snapshot time", "timestamp", "created_at"]),
    }))
    .filter((row) => row.ticker);

  const sessionDate =
    importRows.find((row) => row.date)?.date ||
    cell(rows[0] || {}, ["date", "session_date", "session date"]) ||
    "--";

  const snapshotTime =
    importRows.find((row) => row.snapshotTime)?.snapshotTime ||
    cell(rows[0] || {}, ["snapshot_time", "snapshot time", "timestamp", "created_at"]) ||
    "--";

  return {
    rows: importRows,
    source: {
      file: `Google Sheet: ${sourceName}`,
      sessionDate,
      snapshotTime,
      count: importRows.length,
    },
  };
}

function buildThreeMStatusMap(rows: SheetRow[]): Map<string, string> {
  const map = new Map<string, string>();

  for (const row of rows) {
    const eventId = cell(row, ["event_id", "event id", "Event ID"]);
    const status = cell(row, ["3m Status", "three_m_status", "threemstatus", "3m_status"]);
    if (eventId && status) {
      map.set(eventId, upper(status));
    }
  }

  return map;
}

function mapWMicroRows(rows: SheetRow[]): WMicroRow[] {
  const mapped = rows
    .map((row) => {
      const eventId = cell(row, ["event_id", "event id", "Event ID"]);
      return {
        eventId,
        ticker: upper(cell(row, ["ticker", "symbol"])),
        candidateTime: cell(row, ["candidate_time_et", "candidate_time", "candidate time", "Candidate Time"]),
        state: upper(cell(row, ["state", "wmicro_state", "WMicro State"])) || "--",
        status: upper(cell(row, ["status", "wmicro_status", "WMicro Status"])) || "--",
        tickCount: cell(row, ["raw_tick_count", "tick_count", "tick count", "Raw Tick Count"]) || "0",
        lastReturn: cell(row, ["last_pct_from_candidate", "last_return", "Last Return %"]) || "--",
        highReturn: cell(row, ["max_pct_from_candidate", "high_return", "High Return %"]) || "--",
        lowReturn: cell(row, ["min_pct_from_candidate", "low_return", "Low Return %"]) || "--",
      };
    })
    .filter((row) => row.eventId || row.ticker);

  const deduped = new Map<string, WMicroRow>();
  for (const row of mapped) {
    const key = row.eventId || `${row.ticker}:${row.candidateTime}`;
    deduped.set(key, row);
  }

  return Array.from(deduped.values());
}

function mapCandidateRows(
  candidateRowsRaw: SheetRow[],
  alertRowsRaw: SheetRow[],
  wmicroRows: WMicroRow[],
): CandidateRow[] {
  const statusMap = buildThreeMStatusMap([...candidateRowsRaw, ...alertRowsRaw]);
  const activeWMicroEventIds = new Set(
    wmicroRows
      .filter((row) => upper(row.status) === "ACTIVE")
      .map((row) => row.eventId)
      .filter(Boolean),
  );

  const deduped = new Map<string, CandidateRow>();

  for (const row of candidateRowsRaw) {
    const eventType = upper(cell(row, ["event_type", "event type", "type", "stage", "row_type", "row type"]));
    const eventId = cell(row, ["event_id", "event id", "Event ID"]);
    const ticker = upper(cell(row, ["ticker", "symbol"]));
    const candidateTime = cell(row, ["candidate_time", "candidate time", "Candidate Time", "timestamp", "time"]);
    const candidatePrice = cell(row, ["candidate_price", "candidate price", "Candidate Price", "price"]);

    const looksLikeCandidate =
      eventType.includes("CANDIDATE") ||
      (!eventType && Boolean(eventId || ticker) && Boolean(candidateTime || candidatePrice));

    if (!looksLikeCandidate || (!eventId && !ticker)) {
      continue;
    }

    const threeMStatus = statusMap.get(eventId) || "";
    const mapped: CandidateRow = {
      eventId,
      ticker,
      timestamp: candidateTime,
      price: candidatePrice,
      threeMPass: yesNo(threeMStatus === "PASS"),
      wmicroActive: yesNo(Boolean(eventId && activeWMicroEventIds.has(eventId))),
    };

    const key = eventId || `${ticker}:${candidateTime}`;
    if (!deduped.has(key)) {
      deduped.set(key, mapped);
    }
  }

  return Array.from(deduped.values());
}

function summarizeCandidates(rows: CandidateRow[]): CandidateSummary {
  return {
    count: rows.length,
    threeMPassCount: rows.filter((row) => row.threeMPass === "YES").length,
    wmicroActiveCount: rows.filter((row) => row.wmicroActive === "YES").length,
  };
}

function summarizeWMicro(rows: WMicroRow[]): WMicroSummary {
  return {
    sessions: rows.length,
    active: rows.filter((row) => upper(row.status) === "ACTIVE").length,
    supporting: rows.filter((row) => upper(row.state) === "SUPPORTING").length,
    fading: rows.filter((row) => upper(row.state) === "FADING").length,
    thin: rows.filter((row) => upper(row.state) === "THIN").length,
    neutral: rows.filter((row) => upper(row.state) === "NEUTRAL").length,
  };
}

export async function loadAtraPraeData(): Promise<AtraPraeData> {
  try {
    const { sheetId, sheets } = await getSheetsClient();

    const [importTab, liveEventsTab, alertTab, wmicroTab] = await Promise.all([
      readFirstAvailableTab(sheets, sheetId, ["Import"]),
      readFirstAvailableTab(sheets, sheetId, ["V2_Live_Events", "Candidate_Events", "candidate_events", "Candidates"]),
      readFirstAvailableTab(sheets, sheetId, ["Alert History", "Alert_History", "alert_history", "V2_Alert_History"]),
      readFirstAvailableTab(sheets, sheetId, ["V2_WMicro", "WMicro", "wmicro_current_state", "Wmicro_Current"]),
    ]);

    const mappedImport = mapImportRows(importTab.rows, importTab.name);
    const wmicroRows = mapWMicroRows(wmicroTab.rows);
    const candidateSourceRows = liveEventsTab.rows.length ? liveEventsTab.rows : alertTab.rows;
    const candidateRows = mapCandidateRows(candidateSourceRows, alertTab.rows, wmicroRows);

    return {
      importSource: mappedImport.source,
      importRows: mappedImport.rows,
      candidateSummary: summarizeCandidates(candidateRows),
      candidateRows,
      wmicroSummary: summarizeWMicro(wmicroRows),
      wmicroRows,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Atra Prae Google Sheet data failed to load.";

    return {
      ...emptyData,
      loadError: message,
    };
  }
}
