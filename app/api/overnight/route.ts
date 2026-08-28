import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type MarketConfig = {
  key: string;
  name: string;
  symbol: string;
  region: string;
  flag: string;
  exchangeTimeZone: string;
  sessions: [number, number][];
};

const MARKETS: MarketConfig[] = [
  {
    key: "nikkei",
    name: "Nikkei 225",
    symbol: "^N225",
    region: "Japan",
    flag: "JP",
    exchangeTimeZone: "Asia/Tokyo",
    sessions: [[9 * 60, 11 * 60 + 30], [12 * 60 + 30, 15 * 60 + 30]],
  },
  {
    key: "hangseng",
    name: "Hang Seng",
    symbol: "^HSI",
    region: "Hong Kong",
    flag: "HK",
    exchangeTimeZone: "Asia/Hong_Kong",
    sessions: [[9 * 60 + 30, 12 * 60], [13 * 60, 16 * 60]],
  },
  {
    key: "kospi",
    name: "KOSPI",
    symbol: "^KS11",
    region: "South Korea",
    flag: "KR",
    exchangeTimeZone: "Asia/Seoul",
    sessions: [[9 * 60, 15 * 60 + 30]],
  },
  {
    key: "taiex",
    name: "TAIEX",
    symbol: "^TWII",
    region: "Taiwan",
    flag: "TW",
    exchangeTimeZone: "Asia/Taipei",
    sessions: [[9 * 60, 13 * 60 + 30]],
  },
  {
    key: "sti",
    name: "Straits Times Index",
    symbol: "^STI",
    region: "Singapore",
    flag: "SG",
    exchangeTimeZone: "Asia/Singapore",
    sessions: [[9 * 60, 12 * 60], [13 * 60, 17 * 60]],
  },
  {
    key: "nifty50",
    name: "Nifty 50",
    symbol: "^NSEI",
    region: "India",
    flag: "IN",
    exchangeTimeZone: "Asia/Kolkata",
    sessions: [[9 * 60 + 15, 15 * 60 + 30]],
  },
  {
    key: "asx200",
    name: "ASX 200",
    symbol: "^AXJO",
    region: "Australia",
    flag: "AU",
    exchangeTimeZone: "Australia/Sydney",
    sessions: [[10 * 60, 16 * 60]],
  },
  {
    key: "ftse",
    name: "FTSE 100",
    symbol: "^FTSE",
    region: "United Kingdom",
    flag: "UK",
    exchangeTimeZone: "Europe/London",
    sessions: [[8 * 60, 16 * 60 + 30]],
  },
  {
    key: "dax",
    name: "DAX",
    symbol: "^GDAXI",
    region: "Germany",
    flag: "DE",
    exchangeTimeZone: "Europe/Berlin",
    sessions: [[9 * 60, 17 * 60 + 30]],
  },
  {
    key: "cac40",
    name: "CAC 40",
    symbol: "^FCHI",
    region: "France",
    flag: "FR",
    exchangeTimeZone: "Europe/Paris",
    sessions: [[9 * 60, 17 * 60 + 30]],
  },
  {
    key: "eurostoxx50",
    name: "Euro Stoxx 50",
    symbol: "^STOXX50E",
    region: "Europe",
    flag: "EU",
    exchangeTimeZone: "Europe/Zurich",
    sessions: [[9 * 60, 17 * 60 + 30]],
  },
  {
    key: "ftsemib",
    name: "FTSE MIB",
    symbol: "FTSEMIB.MI",
    region: "Italy",
    flag: "IT",
    exchangeTimeZone: "Europe/Rome",
    sessions: [[9 * 60, 17 * 60 + 30]],
  },
  {
    key: "ibex35",
    name: "IBEX 35",
    symbol: "^IBEX",
    region: "Spain",
    flag: "ES",
    exchangeTimeZone: "Europe/Madrid",
    sessions: [[9 * 60, 17 * 60 + 30]],
  },
  {
    key: "smi",
    name: "SMI",
    symbol: "^SSMI",
    region: "Switzerland",
    flag: "CH",
    exchangeTimeZone: "Europe/Zurich",
    sessions: [[9 * 60, 17 * 60 + 30]],
  },
  {
    key: "aex",
    name: "AEX",
    symbol: "^AEX",
    region: "Netherlands",
    flag: "NL",
    exchangeTimeZone: "Europe/Amsterdam",
    sessions: [[9 * 60, 17 * 60 + 30]],
  },
];

const CACHE_MS = 20_000;

let cachedAt = 0;
let cachedPayload: unknown = null;

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toneFor(value: number | null) {
  if (value === null) return "neutral";
  if (value > 0) return "green";
  if (value < 0) return "red";
  return "neutral";
}

function partsInZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
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

function localClock(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function marketStatus(market: MarketConfig) {
  const now = new Date();
  const p = partsInZone(now, market.exchangeTimeZone);
  const minute = p.hour * 60 + p.minute;

  if (p.weekday === "Sat" || p.weekday === "Sun") {
    return {
      isMarketOpen: false,
      marketStatusLabel: "Closed",
      marketTone: "red",
      holidayName: p.weekday === "Sat" || p.weekday === "Sun" ? "Weekend" : null,
      localClock: localClock(now, market.exchangeTimeZone),
    };
  }

  if (market.key === "nikkei" && minute >= 11 * 60 + 30 && minute < 12 * 60 + 30) {
    return {
      isMarketOpen: false,
      marketStatusLabel: "Lunch Break",
      marketTone: "amber",
      holidayName: null,
      localClock: localClock(now, market.exchangeTimeZone),
    };
  }

  const isOpen = market.sessions.some(([start, end]) => minute >= start && minute <= end);

  return {
    isMarketOpen: isOpen,
    marketStatusLabel: isOpen ? "Open" : "Closed",
    marketTone: isOpen ? "green" : "red",
    holidayName: null,
    localClock: localClock(now, market.exchangeTimeZone),
  };
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

  if (!result) {
    throw new Error("Yahoo returned no chart result");
  }

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

  if (!validIndexes.length) {
    throw new Error("Yahoo returned no valid closes");
  }

  const last = validIndexes[validIndexes.length - 1];
  const first = validIndexes[0];

  const validOpens = opens.filter((v): v is number => v !== null && v > 0);
  const validHighs = highs.filter((v): v is number => v !== null && v > 0);
  const validLows = lows.filter((v): v is number => v !== null && v > 0);

  const price = last.value;
  const previousClose = numberOrNull(meta.chartPreviousClose);
  const open = validOpens.length ? validOpens[0] : first.value;
  const high = validHighs.length ? Math.max(...validHighs) : null;
  const low = validLows.length ? Math.min(...validLows) : null;

  const change = previousClose && previousClose !== 0 ? price - previousClose : price - open;
  const changePercent =
    previousClose && previousClose !== 0 ? (change / previousClose) * 100 : open ? (change / open) * 100 : null;

  const dataTime = numberOrNull(timestamps[last.index]) || numberOrNull(meta.regularMarketTime);
  const ageMinutes =
    dataTime && dataTime > 0 ? Math.max(0, Math.round((Date.now() / 1000 - dataTime) / 60)) : null;

  return {
    price,
    change,
    changePercent,
    previousClose,
    high,
    low,
    open,
    dataTime,
    quoteTime: dataTime ? new Date(dataTime * 1000).toISOString() : null,
    quoteAgeMinutes: ageMinutes,
    exchangeName: meta.exchangeName || null,
    yahooTimezone: meta.timezone || null,
  };
}

async function loadMarket(market: MarketConfig) {
  try {
    const chart = await yahooChart(market.symbol);
    const parsed = parseYahoo(chart);
    const status = marketStatus(market);

    return {
      key: market.key,
      name: market.name,
      symbol: market.symbol,
      region: market.region,
      flag: market.flag,
      exchangeTimeZone: market.exchangeTimeZone,
      ok: true,
      error: null,
      ...status,
      price: parsed.price,
      change: parsed.change,
      changePercent: parsed.changePercent,
      previousClose: parsed.previousClose,
      high: parsed.high,
      low: parsed.low,
      open: parsed.open,
      quoteTime: parsed.quoteTime,
      exchangeTime: parsed.quoteTime
        ? new Intl.DateTimeFormat("en-US", {
            timeZone: market.exchangeTimeZone,
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          }).format(new Date(parsed.quoteTime))
        : null,
      quoteAgeMinutes: parsed.quoteAgeMinutes,
      dataSource: "Market data",
      dataStatus: "ok",
      dataStatusLabel: parsed.quoteAgeMinutes !== null && parsed.quoteAgeMinutes <= 30 ? "Fresh" : "Delayed / Closed",
      dataTone: parsed.quoteAgeMinutes !== null && parsed.quoteAgeMinutes <= 30 ? "green" : "amber",
      dataVendorExchange: parsed.exchangeName,
      dataVendorTimezone: parsed.yahooTimezone,
      dataToneDirection: toneFor(parsed.change),
    };
  } catch (err) {
    const status = marketStatus(market);

    return {
      key: market.key,
      name: market.name,
      symbol: market.symbol,
      region: market.region,
      flag: market.flag,
      exchangeTimeZone: market.exchangeTimeZone,
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
      ...status,
      price: null,
      change: null,
      changePercent: null,
      previousClose: null,
      high: null,
      low: null,
      open: null,
      quoteTime: null,
      exchangeTime: null,
      quoteAgeMinutes: null,
      dataSource: "Market data",
      dataStatus: "error",
      dataStatusLabel: "Unavailable",
      dataTone: "red",
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

  const markets = await Promise.all(MARKETS.map(loadMarket));

  const payload = {
    ok: true,
    updatedAt: new Date().toISOString(),
    source: "Market data",
    markets,
  };

  cachedPayload = payload;
  cachedAt = now;

  return NextResponse.json(payload, {
    headers: { "Cache-Control": "no-store" },
  });
}
