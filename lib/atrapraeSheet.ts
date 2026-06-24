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

async function readFirstAvailableRawTab(
  sheets: Awaited<ReturnType<typeof getSheetsClient>>["sheets"],
  sheetId: string,
  names: string[],
): Promise<{ name: string; rows: GridRow[] }> {
  const errors: string[] = [];

  for (const name of names) {
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: quoteSheetName(name),
        valueRenderOption: "FORMATTED_VALUE",
        dateTimeRenderOption: "FORMATTED_STRING",
      });

      const values = response.data.values || [];
      return {
        name,
        rows: values.map((row) => row.map((cell) => clean(cell))),
      };
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
