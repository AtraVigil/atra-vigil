import { google } from "googleapis";

export type MarketPulseRow = {
  label: string;
  value: string;
  change: string;
};

export type SystemHealthRow = {
  label: string;
  value: string;
};

export type WatchRow = {
  ticker: string;
  candidateTime: string;
  status: string;
  expires: string;
  detail: string;
};

export type TerminalCandidateRow = {
  time: string;
  ticker: string;
  price: string;
  status: string;
  threeMReturn: string;
  threeMHigh: string;
  threeMLow: string;
  detail: string;
};

export type TerminalHeader = {
  title: string;
  updated: string;
  market: string;
  session: string;
};

export type TerminalSummary = {
  importCount: string;
  runner: string;
  candles: string;
  wmicro: string;
  candidates: string;
  email: string;
  threeMPass: string;
  threeMFail: string;
  threeMPlusTwoPass: string;
  threeMPlusTwoFail: string;
  wmicroSubs: string;
  active: string;
  expired: string;
  pending: string;
};

export type AtraPraeData = {
  source: string;
  header: TerminalHeader;
  summary: TerminalSummary;
  marketPulse: MarketPulseRow[];
  systemHealth: SystemHealthRow[];
  watchRows: WatchRow[];
  watchMessage: string;
  candidateRows: TerminalCandidateRow[];
  rawTerminalRows?: string[][];
  loadError?: string;
};

export type ArchiveTable = {
  headers: string[];
  rows: string[][];
};

export type ArchiveDailyRow = {
  sessionDate: string;
  archivedAtLocal: string;
  archivedAtMarket: string;
  runId: string;
  terminalRows: string;
  alertHistoryRows: string;
  wmicroRows: string;
  status: string;
  notes: string;
};

export type AtraPraeArchiveData = {
  dates: string[];
  selectedDate: string;
  daily?: ArchiveDailyRow;
  terminal: AtraPraeData;
  alertHistory: ArchiveTable;
  wmicro: ArchiveTable;
  loadError?: string;
};

const emptyData: AtraPraeData = {
  source: "Google Sheet: Terminal",
  header: {
    title: "Atra Prae V2 — Live Terminal",
    updated: "--",
    market: "--",
    session: "--",
  },
  summary: {
    importCount: "--",
    runner: "--",
    candles: "--",
    wmicro: "--",
    candidates: "--",
    email: "--",
    threeMPass: "--",
    threeMFail: "--",
    threeMPlusTwoPass: "--",
    threeMPlusTwoFail: "--",
    wmicroSubs: "--",
    active: "--",
    expired: "--",
    pending: "--",
  },
  marketPulse: [],
  systemHealth: [],
  watchRows: [],
  watchMessage: "--",
  candidateRows: [],
  rawTerminalRows: [],
};

type GridRow = string[];

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function upper(value: string): string {
  return clean(value).toUpperCase();
}

function normalize(value: string): string {
  return clean(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function rowCell(row: GridRow | undefined, index: number): string {
  if (!row) return "";
  return clean(row[index]);
}

function parseColonCell(value: string): { label: string; value: string } {
  const text = clean(value);
  const idx = text.indexOf(":");

  if (idx < 0) {
    return { label: text, value: "" };
  }

  return {
    label: clean(text.slice(0, idx)),
    value: clean(text.slice(idx + 1)),
  };
}

function quoteSheetName(name: string): string {
  return `'${name.replace(/'/g, "''")}'!A:ZZ`;
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

async function readRawTab(
  sheets: Awaited<ReturnType<typeof getSheetsClient>>["sheets"],
  sheetId: string,
  name: string,
): Promise<GridRow[]> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: quoteSheetName(name),
    valueRenderOption: "FORMATTED_VALUE",
    dateTimeRenderOption: "FORMATTED_STRING",
  });

  const values = response.data.values || [];
  return values.map((row) => row.map((cell) => clean(cell)));
}

async function readFirstAvailableRawTab(
  sheets: Awaited<ReturnType<typeof getSheetsClient>>["sheets"],
  sheetId: string,
  names: string[],
): Promise<{ name: string; rows: GridRow[] }> {
  const errors: string[] = [];

  for (const name of names) {
    try {
      const rows = await readRawTab(sheets, sheetId, name);
      return { name, rows };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${name}: ${message}`);
    }
  }

  throw new Error(`Unable to read Terminal tab. Tried: ${names.join(", ")}. ${errors.join(" | ")}`);
}

function findSection(rows: GridRow[], sectionName: string): number {
  const target = normalize(sectionName);
  return rows.findIndex((row) => normalize(rowCell(row, 0)) === target);
}

function nextSectionIndex(rows: GridRow[], startIndex: number, sectionNames: string[]): number {
  const sectionSet = new Set(sectionNames.map(normalize));

  for (let i = startIndex + 1; i < rows.length; i += 1) {
    if (sectionSet.has(normalize(rowCell(rows[i], 0)))) {
      return i;
    }
  }

  return rows.length;
}

function parseHeader(rows: GridRow[]): TerminalHeader {
  const title = rowCell(rows[0], 0) || "Atra Prae V2 — Live Terminal";
  const line = rows[1] || [];

  const updated = parseColonCell(rowCell(line, 0)).value || "--";
  const market = parseColonCell(rowCell(line, 1)).value || "--";
  const session = parseColonCell(rowCell(line, 2)).value || "--";

  return { title, updated, market, session };
}

function parseMarketPulse(rows: GridRow[]): MarketPulseRow[] {
  const start = findSection(rows, "MARKET PULSE");
  if (start < 0) return [];

  const end = nextSectionIndex(rows, start, ["SYSTEM HEALTH", "WATCH NOW", "TODAY'S CANDIDATES"]);
  const output: MarketPulseRow[] = [];

  for (let i = start + 1; i < end; i += 1) {
    const label = rowCell(rows[i], 0).replace(/:$/, "");
    const value = rowCell(rows[i], 1);
    const change = rowCell(rows[i], 2);

    if (!label && !value && !change) continue;

    output.push({
      label,
      value: value || "--",
      change: change || "--",
    });
  }

  return output;
}

function parseSystemHealth(rows: GridRow[]): SystemHealthRow[] {
  const start = findSection(rows, "SYSTEM HEALTH");
  if (start < 0) return [];

  const end = nextSectionIndex(rows, start, ["WATCH NOW", "TODAY'S CANDIDATES"]);
  const output: SystemHealthRow[] = [];

  for (let i = start + 1; i < end; i += 1) {
    const row = rows[i] || [];
    const nonEmpty = row.some((value) => clean(value));
    if (!nonEmpty) continue;

    for (let col = 0; col < row.length; col += 2) {
      const label = rowCell(row, col);
      const value = rowCell(row, col + 1);

      if (!label && !value) continue;

      output.push({
        label: label || "--",
        value: value || "--",
      });
    }
  }

  return output;
}

function makeSummary(systemHealth: SystemHealthRow[]): TerminalSummary {
  const map = new Map(systemHealth.map((item) => [normalize(item.label), item.value]));

  return {
    importCount: map.get("import") || "--",
    runner: map.get("runner") || "--",
    candles: map.get("candles") || "--",
    wmicro: map.get("wmicro") || "--",
    candidates: map.get("candidates") || "--",
    email: map.get("email") || "--",
    threeMPass: map.get("3mpass") || "--",
    threeMFail: map.get("3mfail") || "--",
    threeMPlusTwoPass: map.get("3m2pass") || "--",
    threeMPlusTwoFail: map.get("3m2fail") || "--",
    wmicroSubs: map.get("wmicrosubs") || "--",
    active: map.get("active") || "--",
    expired: map.get("expired") || "--",
    pending: map.get("pending") || "--",
  };
}

function parseWatchNow(rows: GridRow[]): { rows: WatchRow[]; message: string } {
  const start = findSection(rows, "WATCH NOW");
  if (start < 0) return { rows: [], message: "--" };

  const end = nextSectionIndex(rows, start, ["TODAY'S CANDIDATES"]);
  const firstData = rows[start + 2];

  if (normalize(rowCell(firstData, 0)) === "noactive") {
    return { rows: [], message: "No Active" };
  }

  const output: WatchRow[] = [];

  for (let i = start + 2; i < end; i += 1) {
    const row = rows[i] || [];
    const ticker = upper(rowCell(row, 0));
    const candidateTime = rowCell(row, 1);
    const status = rowCell(row, 2);
    const expires = rowCell(row, 3);
    const detail = rowCell(row, 4);

    if (!ticker && !candidateTime && !status && !expires && !detail) continue;

    output.push({
      ticker,
      candidateTime,
      status,
      expires,
      detail,
    });
  }

  return {
    rows: output,
    message: output.length ? "" : "No Active",
  };
}

function parseTodayCandidates(rows: GridRow[]): TerminalCandidateRow[] {
  const start = findSection(rows, "TODAY'S CANDIDATES");
  if (start < 0) return [];

  const output: TerminalCandidateRow[] = [];

  for (let i = start + 2; i < rows.length; i += 1) {
    const row = rows[i] || [];
    const time = rowCell(row, 0);
    const ticker = upper(rowCell(row, 1));
    const price = rowCell(row, 2);
    const status = rowCell(row, 3);
    const threeMReturn = rowCell(row, 4);
    const threeMHigh = rowCell(row, 5);
    const threeMLow = rowCell(row, 6);
    const detail = rowCell(row, 7);

    if (!time && !ticker && !price && !status && !threeMReturn && !threeMHigh && !threeMLow && !detail) {
      continue;
    }

    output.push({
      time,
      ticker,
      price,
      status,
      threeMReturn,
      threeMHigh,
      threeMLow,
      detail,
    });
  }

  return output;
}

function parseTerminalRows(rows: GridRow[], sourceName: string): AtraPraeData {
  const header = parseHeader(rows);
  const marketPulse = parseMarketPulse(rows);
  const systemHealth = parseSystemHealth(rows);
  const watch = parseWatchNow(rows);
  const candidateRows = parseTodayCandidates(rows);

  return {
    source: `Google Sheet: ${sourceName}`,
    header,
    summary: makeSummary(systemHealth),
    marketPulse,
    systemHealth,
    watchRows: watch.rows,
    watchMessage: watch.message,
    candidateRows,
    rawTerminalRows: rows,
  };
}

function tableFromRows(rows: GridRow[]): ArchiveTable {
  if (!rows.length) {
    return { headers: [], rows: [] };
  }

  return {
    headers: rows[0] || [],
    rows: rows.slice(1),
  };
}

function headerIndex(headers: string[], name: string): number {
  const target = normalize(name);
  return headers.findIndex((header) => normalize(header) === target);
}

function filterArchiveRowsByDate(rows: GridRow[], sessionDate: string): GridRow[] {
  if (!rows.length) return [];
  const headers = rows[0] || [];
  const dateIndex = headerIndex(headers, "session_date");
  if (dateIndex < 0) return [headers];

  return [
    headers,
    ...rows.slice(1).filter((row) => rowCell(row, dateIndex) === sessionDate),
  ];
}

function stripArchiveMeta(rows: GridRow[], sourcePrefix?: string): GridRow[] {
  if (!rows.length) return [];

  const headers = rows[0] || [];
  const archiveKeyIndex = headerIndex(headers, "archive_key");

  if (sourcePrefix) {
    const sourceStart = headers.findIndex((header) => normalize(header).startsWith(sourcePrefix));
    const startIndex = sourceStart >= 0 ? sourceStart : archiveKeyIndex >= 0 ? archiveKeyIndex + 1 : 7;
    return rows.map((row) => row.slice(startIndex));
  }

  const startIndex = archiveKeyIndex >= 0 ? archiveKeyIndex + 1 : 7;
  return rows.map((row) => row.slice(startIndex));
}

function parseArchiveDaily(rows: GridRow[], selectedDate: string): ArchiveDailyRow | undefined {
  if (!rows.length) return undefined;

  const headers = rows[0] || [];
  const filtered = rows.slice(1).find((row) => {
    const dateIndex = headerIndex(headers, "session_date");
    return dateIndex >= 0 && rowCell(row, dateIndex) === selectedDate;
  });

  if (!filtered) return undefined;

  const get = (name: string) => {
    const idx = headerIndex(headers, name);
    return idx >= 0 ? rowCell(filtered, idx) : "";
  };

  return {
    sessionDate: get("session_date"),
    archivedAtLocal: get("archived_at_local"),
    archivedAtMarket: get("archived_at_market"),
    runId: get("run_id"),
    terminalRows: get("terminal_rows"),
    alertHistoryRows: get("alert_history_rows"),
    wmicroRows: get("wmicro_rows"),
    status: get("status"),
    notes: get("notes"),
  };
}

export async function loadAtraPraeData(): Promise<AtraPraeData> {
  try {
    const { sheetId, sheets } = await getSheetsClient();
    const terminal = await readFirstAvailableRawTab(sheets, sheetId, ["Terminal", "V2_Terminal"]);
    return parseTerminalRows(terminal.rows, terminal.name);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Atra Prae Google Sheet data failed to load.";

    return {
      ...emptyData,
      loadError: message,
    };
  }
}

export async function listAtraPraeArchiveDates(): Promise<string[]> {
  try {
    const { sheetId, sheets } = await getSheetsClient();
    const rows = await readRawTab(sheets, sheetId, "AP_Archive_Daily");

    if (!rows.length) return [];

    const headers = rows[0] || [];
    const dateIndex = headerIndex(headers, "session_date");
    if (dateIndex < 0) return [];

    return Array.from(
      new Set(
        rows
          .slice(1)
          .map((row) => rowCell(row, dateIndex))
          .filter(Boolean),
      ),
    ).sort((a, b) => b.localeCompare(a));
  } catch {
    return [];
  }
}

export async function loadAtraPraeArchiveData(requestedDate?: string): Promise<AtraPraeArchiveData> {
  const dates = await listAtraPraeArchiveDates();
  const selectedDate = requestedDate && dates.includes(requestedDate) ? requestedDate : dates[0] || "";

  if (!selectedDate) {
    return {
      dates,
      selectedDate: "",
      terminal: {
        ...emptyData,
        source: "Google Sheet: AP_Archive_Terminal",
        loadError: "No archived Atra Prae dates found.",
      },
      alertHistory: { headers: [], rows: [] },
      wmicro: { headers: [], rows: [] },
      loadError: "No archived Atra Prae dates found.",
    };
  }

  try {
    const { sheetId, sheets } = await getSheetsClient();

    const [dailyRows, terminalArchiveRows, alertRows, wmicroRows] = await Promise.all([
      readRawTab(sheets, sheetId, "AP_Archive_Daily"),
      readRawTab(sheets, sheetId, "AP_Archive_Terminal"),
      readRawTab(sheets, sheetId, "AP_Archive_Alert_History"),
      readRawTab(sheets, sheetId, "AP_Archive_WMicro"),
    ]);

    const filteredTerminal = filterArchiveRowsByDate(terminalArchiveRows, selectedDate);
    const filteredAlert = filterArchiveRowsByDate(alertRows, selectedDate);
    const filteredWmicro = filterArchiveRowsByDate(wmicroRows, selectedDate);

    const terminalRows = stripArchiveMeta(filteredTerminal, "col");
    const alertTable = tableFromRows(stripArchiveMeta(filteredAlert));
    const wmicroTable = tableFromRows(stripArchiveMeta(filteredWmicro));

    return {
      dates,
      selectedDate,
      daily: parseArchiveDaily(dailyRows, selectedDate),
      terminal: parseTerminalRows(terminalRows, `AP_Archive_Terminal ${selectedDate}`),
      alertHistory: alertTable,
      wmicro: wmicroTable,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Atra Prae archive failed to load.";

    return {
      dates,
      selectedDate,
      terminal: {
        ...emptyData,
        source: "Google Sheet: AP_Archive_Terminal",
        loadError: message,
      },
      alertHistory: { headers: [], rows: [] },
      wmicro: { headers: [], rows: [] },
      loadError: message,
    };
  }
}
