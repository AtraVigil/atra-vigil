import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type MarketAssetConfig = {
  key: string;
  name: string;
  symbol: string;
  group: "Major Tape" | "Volatility";
  sourceLabel: string;
  mode: "candle" | "quote";
};

const CACHE_MS = 20_000;

let cachedAt = 0;
let cachedPayload: unknown = null;

const ASSETS: MarketAssetConfig[] = [
  {
    key: "sp500",
    name: "S&P 500",
    symbol: "^GSPC",
    group: "Major Tape",
    sourceLabel: "True index",
    mode: "candle",
  },
  {
    key: "nasdaq100",
    name: "NASDAQ 100",
    symbol: "^NDX",
    group: "Major Tape",
    sourceLabel: "True index",
    mode: "candle",
  },
  {
    key: "dow",
    name: "Dow Jones",
    symbol: "^DJI",
    group: "Major Tape",
    sourceLabel: "True index",
    mode: "candle",
  },
  {
    key: "russell",
    name: "Russell 2000",
    symbol: "^RUT",
    group: "Major Tape",
    sourceLabel: "True index",
    mode: "candle",
  },
  {
    key: "vix",
    name: "VIX",
    symbol: "^VIX",
    group: "Volatility",
    sourceLabel: "True index · quote only",
    mode: "quote",
  },
];

function finnhubUrl(path: string, params: Record<string, string | number>) {
  const token = process.env.FINNHUB_API_KEY;
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    search.set(key, String(value));
  }

  if (token) {
    search.set("token", token);
  }

  return `https://finnhub.io/api/v1/${path}?${search.toString()}`;
}

async function fetchJson(path: string, params: Record<string, string | number>) {
  const res = await fetch(finnhubUrl(path, params), {
    cache: "no-store",
  });

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      data: null,
      error: `HTTP ${res.status}`,
    };
  }

  return {
    ok: true,
    status: res.status,
    data: await res.json(),
    error: null,
  };
}

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
  const ymd = `${et.year}-${String(et.month).padStart(2, "0")}-${String(et.day).padStart(2, "0")}`;
  const minutes = et.hour * 60 + et.minute;

  const holidays2026: Record<string, string> = {
    "2026-01-01": "New Year's Day",
    "2026-01-19": "Martin Luther King Jr. Day",
    "2026-02-16": "Washington's Birthday",
    "2026-04-03": "Good Friday",
    "2026-05-25": "Memorial Day",
    "2026-06-19": "Juneteenth National Independence Day",
    "2026-07-03": "Independence Day Observed",
    "2026-09-07": "Labor Day",
    "2026-11-26": "Thanksgiving Day",
    "2026-12-25": "Christmas Day",
  };

  const earlyClose2026: Record<string, string> = {
    "2026-11-27": "Day After Thanksgiving Early Close",
    "2026-12-24": "Christmas Eve Early Close",
  };

  const weekday = et.weekday;
  if (weekday === "Sat" || weekday === "Sun") {
    return {
      isOpen: false,
      label: "Closed",
      tone: "red",
      detail: "Weekend",
      exchangeTimeZone: "America/New_York",
    };
  }

  if (holidays2026[ymd]) {
    return {
      isOpen: false,
      label: "Closed",
      tone: "red",
      detail: holidays2026[ymd],
      exchangeTimeZone: "America/New_York",
    };
  }

  const open = 9 * 60 + 30;
  const close = earlyClose2026[ymd] ? 13 * 60 : 16 * 60;

  if (minutes < 4 * 60) {
    return {
      isOpen: false,
      label: "Closed",
      tone: "red",
      detail: "Before pre-market",
      exchangeTimeZone: "America/New_York",
    };
  }

  if (minutes < open) {
    return {
      isOpen: false,
      label: "Pre-market",
      tone: "amber",
      detail: "Regular session not open",
      exchangeTimeZone: "America/New_York",
    };
  }

  if (minutes <= close) {
    return {
      isOpen: true,
      label: earlyClose2026[ymd] ? "Open — Early Close" : "Open",
      tone: "green",
      detail: earlyClose2026[ymd] || "Regular session",
      exchangeTimeZone: "America/New_York",
    };
  }

  if (minutes < 20 * 60) {
    return {
      isOpen: false,
      label: "After-hours",
      tone: "amber",
      detail: "Regular session closed",
      exchangeTimeZone: "America/New_York",
    };
  }

  return {
    isOpen: false,
    label: "Closed",
    tone: "red",
    detail: "After extended session",
    exchangeTimeZone: "America/New_York",
  };
}

async function loadAsset(asset: MarketAssetConfig) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const from = nowSeconds - 60 * 60 * 8;

  const [quoteResult, candleResult] = await Promise.all([
    fetchJson("quote", { symbol: asset.symbol }),
    asset.mode === "candle"
      ? fetchJson("stock/candle", {
          symbol: asset.symbol,
          resolution: "1",
          from,
          to: nowSeconds,
        })
      : Promise.resolve({ ok: false, status: 0, data: null, error: "quote-only asset" }),
  ]);

  const quote = quoteResult.data as Record<string, unknown> | null;
  const candle = candleResult.data as Record<string, unknown> | null;

  const quoteCurrent = numberOrNull(quote?.c);
  const previousClose = numberOrNull(quote?.pc);

  let price = quoteCurrent;
  let open: number | null = numberOrNull(quote?.o);
  let high: number | null = numberOrNull(quote?.h);
  let low: number | null = numberOrNull(quote?.l);
  let lastTimestamp = numberOrNull(quote?.t);
  let dataSource = "quote";
  let dataStatus = quoteCurrent && quoteCurrent > 0 ? "ok" : "no_data";

  const candleStatus = typeof candle?.s === "string" ? candle.s : null;
  const closes = Array.isArray(candle?.c) ? (candle.c as unknown[]).map(numberOrNull).filter((v): v is number => v !== null) : [];
  const opens = Array.isArray(candle?.o) ? (candle.o as unknown[]).map(numberOrNull).filter((v): v is number => v !== null) : [];
  const highs = Array.isArray(candle?.h) ? (candle.h as unknown[]).map(numberOrNull).filter((v): v is number => v !== null) : [];
  const lows = Array.isArray(candle?.l) ? (candle.l as unknown[]).map(numberOrNull).filter((v): v is number => v !== null) : [];
  const times = Array.isArray(candle?.t) ? (candle.t as unknown[]).map(numberOrNull).filter((v): v is number => v !== null) : [];

  if (asset.mode === "candle" && candleStatus === "ok" && closes.length && times.length) {
    price = closes[closes.length - 1];
    open = opens.length ? opens[0] : open;
    high = highs.length ? Math.max(...highs) : high;
    low = lows.length ? Math.min(...lows) : low;
    lastTimestamp = times[times.length - 1];
    dataSource = "1m candle";
    dataStatus = "ok";
  }

  const change = price !== null && previousClose !== null && previousClose !== 0 ? price - previousClose : null;
  const changePercent = change !== null && previousClose !== null && previousClose !== 0 ? (change / previousClose) * 100 : null;

  const ageMinutes =
    lastTimestamp && lastTimestamp > 0 ? Math.max(0, Math.round((Date.now() / 1000 - lastTimestamp) / 60)) : null;

  return {
    key: asset.key,
    name: asset.name,
    symbol: asset.symbol,
    group: asset.group,
    sourceLabel: asset.sourceLabel,
    price,
    change,
    changePercent,
    previousClose,
    open,
    high,
    low,
    quoteTime: numberOrNull(quote?.t),
    dataTime: lastTimestamp,
    dataAgeMinutes: ageMinutes,
    dataSource,
    dataStatus,
    dataTone: dataStatus === "ok" && ageMinutes !== null && ageMinutes <= 10 ? "green" : dataStatus === "ok" ? "amber" : "red",
    changeTone: changeTone(change),
    quoteOk: quoteResult.ok,
    candleOk: candleResult.ok,
    candleStatus,
  };
}

export async function GET() {
  const token = process.env.FINNHUB_API_KEY;

  if (!token) {
    return NextResponse.json(
      {
        ok: false,
        error: "FINNHUB_API_KEY is not configured",
        updatedAt: new Date().toISOString(),
        marketStatus: usMarketStatus(new Date()),
        assets: [],
      },
      { status: 500 },
    );
  }

  const now = Date.now();

  if (cachedPayload && now - cachedAt < CACHE_MS) {
    return NextResponse.json(cachedPayload, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }

  const assets = await Promise.all(ASSETS.map(loadAsset));

  const payload = {
    ok: true,
    updatedAt: new Date().toISOString(),
    marketStatus: usMarketStatus(new Date()),
    assets,
  };

  cachedPayload = payload;
  cachedAt = now;

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
