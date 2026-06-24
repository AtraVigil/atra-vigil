import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type AssetConfig = {
  key: string;
  name: string;
  symbol: string;
  group: "Major Tape" | "Volatility";
  sourceLabel: string;
};

const ASSETS: AssetConfig[] = [
  { key: "sp500", name: "S&P 500", symbol: "^GSPC", group: "Major Tape", sourceLabel: "Index feed" },
  { key: "nasdaq100", name: "NASDAQ 100", symbol: "^NDX", group: "Major Tape", sourceLabel: "Index feed" },
  { key: "dow", name: "Dow Jones", symbol: "^DJI", group: "Major Tape", sourceLabel: "Index feed" },
  { key: "russell", name: "Russell 2000", symbol: "^RUT", group: "Major Tape", sourceLabel: "Index feed" },
  { key: "vix", name: "VIX", symbol: "^VIX", group: "Volatility", sourceLabel: "Index feed" },
];

const CACHE_MS = 20_000;

let cachedAt = 0;
let cachedPayload: unknown = null;

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function changeTone(value: number | null) {
  if (value === null) return "neutral";
  if (value > 0) return "green";
  if (value < 0) return "red";
  return "neutral";
}

function easternParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value || "";

  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    weekday: get("weekday"),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
  };
}

function usMarketStatus(now: Date) {
  const et = easternParts(now);
  const minutes = et.hour * 60 + et.minute;

  if (et.weekday === "Sat" || et.weekday === "Sun") {
    return { isOpen: false, label: "Closed", tone: "red", detail: "Weekend", exchangeTimeZone: "America/New_York" };
  }

  if (minutes < 4 * 60) {
    return { isOpen: false, label: "Closed", tone: "red", detail: "Before pre-market", exchangeTimeZone: "America/New_York" };
  }

  if (minutes < 9 * 60 + 30) {
    return { isOpen: false, label: "Pre-market", tone: "amber", detail: "Regular session not open", exchangeTimeZone: "America/New_York" };
  }

  if (minutes <= 16 * 60) {
    return { isOpen: true, label: "Open", tone: "green", detail: "Regular session", exchangeTimeZone: "America/New_York" };
  }

  if (minutes < 20 * 60) {
    return { isOpen: false, label: "After-hours", tone: "amber", detail: "Regular session closed", exchangeTimeZone: "America/New_York" };
  }

  return { isOpen: false, label: "Closed", tone: "red", detail: "After extended session", exchangeTimeZone: "America/New_York" };
}

async function yahooChart(symbol: string) {
  const enc = encodeURIComponent(symbol);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${enc}?interval=1m&range=1d`;

  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "application/json,text/plain,*/*",
    },
  });

  if (!res.ok) {
    throw new Error(`Yahoo HTTP ${res.status}`);
  }

  return res.json();
}

function parseYahoo(chart: Record<string, unknown>) {
  const result = (((chart.chart as Record<string, unknown>)?.result as unknown[]) || [])[0] as Record<string, unknown> | undefined;

  if (!result) throw new Error("Yahoo returned no chart result");

  const meta = result.meta as Record<string, unknown>;
  const timestamps = (result.timestamp as unknown[]) || [];
  const quote = (((result.indicators as Record<string, unknown>)?.quote as unknown[]) || [])[0] as Record<string, unknown>;

  const opens = ((quote.open as unknown[]) || []).map(numberOrNull);
  const highs = ((quote.high as unknown[]) || []).map(numberOrNull);
  const lows = ((quote.low as unknown[]) || []).map(numberOrNull);
  const closes = ((quote.close as unknown[]) || []).map(numberOrNull);

  const validIndexes = closes
    .map((value, index) => ({ value, index }))
    .filter((row): row is { value: number; index: number } => row.value !== null && row.value > 0);

  if (!validIndexes.length) throw new Error("Yahoo returned no valid closes");

  const last = validIndexes[validIndexes.length - 1];
  const first = validIndexes[0];

  const validOpens = opens.filter((v): v is number => v !== null && v > 0);
  const validHighs = highs.filter((v): v is number => v !== null && v > 0);
  const validLows = lows.filter((v): v is number => v !== null && v > 0);

  const price = numberOrNull(meta.regularMarketPrice) ?? last.value;
  const previousClose = numberOrNull(meta.chartPreviousClose);
  const open = validOpens.length ? validOpens[0] : first.value;
  const high = validHighs.length ? Math.max(...validHighs) : null;
  const low = validLows.length ? Math.min(...validLows) : null;

  const change = previousClose && previousClose !== 0 ? price - previousClose : price - open;
  const changePercent =
    previousClose && previousClose !== 0 ? (change / previousClose) * 100 : open ? (change / open) * 100 : null;

  const dataTime = numberOrNull(meta.regularMarketTime) || numberOrNull(timestamps[last.index]);
  const ageMinutes =
    dataTime && dataTime > 0 ? Math.max(0, Math.round((Date.now() / 1000 - dataTime) / 60)) : null;

  return {
    price,
    change,
    changePercent,
    changeLabel: "Daily",
    changeBasis: "Previous close",
    previousClose,
    open,
    high,
    low,
    dataTime,
    quoteTime: dataTime ? new Date(dataTime * 1000).toISOString() : null,
    dataAgeMinutes: ageMinutes,
    dataSource: "Market data",
    dataStatus: "ok",
    dataTone: ageMinutes !== null && ageMinutes <= 30 ? "green" : "amber",
    changeTone: changeTone(change),
    exchangeName: meta.exchangeName || null,
    yahooTimezone: meta.timezone || null,
  };
}

async function loadAsset(asset: AssetConfig) {
  try {
    const chart = await yahooChart(asset.symbol);
    const parsed = parseYahoo(chart);

    return {
      key: asset.key,
      name: asset.name,
      symbol: asset.symbol,
      group: asset.group,
      sourceLabel: asset.sourceLabel,
      ...parsed,
    };
  } catch (err) {
    return {
      key: asset.key,
      name: asset.name,
      symbol: asset.symbol,
      group: asset.group,
      sourceLabel: asset.sourceLabel,
      price: null,
      change: null,
      changePercent: null,
      changeLabel: "Daily",
      changeBasis: "Previous close",
      previousClose: null,
      open: null,
      high: null,
      low: null,
      dataTime: null,
      quoteTime: null,
      dataAgeMinutes: null,
      dataSource: "Market data",
      dataStatus: "error",
      dataTone: "red",
      changeTone: "neutral",
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function GET() {
  const now = Date.now();

  if (cachedPayload && now - cachedAt < CACHE_MS) {
    return NextResponse.json(cachedPayload, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  const assets = await Promise.all(ASSETS.map(loadAsset));

  const payload = {
    ok: true,
    updatedAt: new Date().toISOString(),
    source: "Market data",
    marketStatus: usMarketStatus(new Date()),
    assets,
  };

  cachedPayload = payload;
  cachedAt = now;

  return NextResponse.json(payload, {
    headers: { "Cache-Control": "no-store" },
  });
}
