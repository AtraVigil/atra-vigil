import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type FinnhubQuote = {
  c?: number;
  d?: number;
  dp?: number;
  h?: number;
  l?: number;
  o?: number;
  pc?: number;
  t?: number;
};

type FinnhubCandle = {
  c?: number[];
  h?: number[];
  l?: number[];
  o?: number[];
  t?: number[];
  v?: number[];
  s?: string;
};

type MarketSession = {
  start: number;
  end: number;
  open: boolean;
};

const MARKETS = [
  {
    key: "nikkei",
    name: "Nikkei 225",
    symbol: "^N225",
    region: "Japan",
    flag: "🇯🇵",
    exchangeTimeZone: "Asia/Tokyo",
    sessions: [
      { start: 9 * 60, end: 11 * 60 + 30, open: true },
      { start: 11 * 60 + 30, end: 12 * 60 + 30, open: false },
      { start: 12 * 60 + 30, end: 15 * 60 + 30, open: true },
    ],
  },
  {
    key: "ftse",
    name: "FTSE 100",
    symbol: "^FTSE",
    region: "United Kingdom",
    flag: "🇬🇧",
    exchangeTimeZone: "Europe/London",
    sessions: [{ start: 8 * 60, end: 16 * 60 + 30, open: true }],
  },
  {
    key: "dax",
    name: "DAX",
    symbol: "^GDAXI",
    region: "Germany",
    flag: "🇩🇪",
    exchangeTimeZone: "Europe/Berlin",
    sessions: [{ start: 9 * 60, end: 17 * 60 + 30, open: true }],
  },
];

function getExchangeClock(timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const rawHour = Number(part("hour"));
  const hour = rawHour === 24 ? 0 : rawHour;
  const minute = Number(part("minute"));

  return {
    weekday: part("weekday"),
    minutes: hour * 60 + minute,
  };
}

function formatLocalClock(timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date());
}

function formatQuoteExchangeTime(timestampSeconds?: number, timeZone?: string) {
  if (!timestampSeconds || !timeZone) return null;

  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(timestampSeconds * 1000));
}

function isWeekend(weekday: string) {
  return weekday === "Sat" || weekday === "Sun";
}

function isMarketOpen(timeZone: string, sessions: MarketSession[]) {
  const clock = getExchangeClock(timeZone);
  if (isWeekend(clock.weekday)) return false;

  const current = sessions.find(
    (s) => clock.minutes >= s.start && clock.minutes < s.end
  );

  return Boolean(current?.open);
}

function isUsableQuote(q: FinnhubQuote) {
  return typeof q.pc === "number" && q.pc > 0;
}

function getQuoteAgeMinutes(timestampSeconds?: number | null) {
  if (!timestampSeconds) return null;
  return Math.max(0, Math.round((Date.now() - timestampSeconds * 1000) / 60000));
}

function getDataStatus(
  usable: boolean,
  marketOpen: boolean,
  ageMinutes: number | null
): {
  dataStatus: "open" | "closed" | "stale";
  dataStatusLabel: "Open" | "Closed" | "Stale";
  dataTone: "green" | "red" | "amber";
} {
  if (!usable) {
    return { dataStatus: "stale", dataStatusLabel: "Stale", dataTone: "amber" };
  }

  if (!marketOpen) {
    return { dataStatus: "closed", dataStatusLabel: "Closed", dataTone: "red" };
  }

  if (ageMinutes !== null && ageMinutes <= 20) {
    return { dataStatus: "open", dataStatusLabel: "Open", dataTone: "green" };
  }

  return { dataStatus: "stale", dataStatusLabel: "Stale", dataTone: "amber" };
}

async function fetchQuote(symbol: string, token: string): Promise<FinnhubQuote> {
  const url = new URL("https://finnhub.io/api/v1/quote");
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("token", token);

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Finnhub quote HTTP ${res.status}`);

  return res.json();
}

async function fetchCandles(symbol: string, token: string): Promise<FinnhubCandle> {
  const now = Math.floor(Date.now() / 1000);
  const from = now - 60 * 60 * 12;

  const url = new URL("https://finnhub.io/api/v1/stock/candle");
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("resolution", "1");
  url.searchParams.set("from", String(from));
  url.searchParams.set("to", String(now));
  url.searchParams.set("token", token);

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Finnhub candle HTTP ${res.status}`);

  return res.json();
}

function latestCandle(candle: FinnhubCandle) {
  if (candle.s !== "ok") return null;
  if (!candle.t?.length || !candle.c?.length) return null;

  const lastIndex = candle.t.length - 1;
  const timestamp = candle.t[lastIndex];
  const close = candle.c[lastIndex];

  if (typeof timestamp !== "number" || typeof close !== "number" || close <= 0) {
    return null;
  }

  return {
    close,
    timestamp,
    open: candle.o?.[0] ?? null,
    high: candle.h?.length ? Math.max(...candle.h) : null,
    low: candle.l?.length ? Math.min(...candle.l) : null,
  };
}

export async function GET() {
  const token = process.env.FINNHUB_API_KEY;

  if (!token) {
    return NextResponse.json(
      {
        ok: false,
        error: "FINNHUB_API_KEY is not configured.",
        updatedAt: new Date().toISOString(),
        markets: [],
      },
      { status: 500 }
    );
  }

  const markets = await Promise.all(
    MARKETS.map(async (market) => {
      const marketOpen = isMarketOpen(market.exchangeTimeZone, market.sessions);

      try {
        const [quoteResult, candleResult] = await Promise.allSettled([
          fetchQuote(market.symbol, token),
          fetchCandles(market.symbol, token),
        ]);

        const quote = quoteResult.status === "fulfilled" ? quoteResult.value : {};
        const candle =
          candleResult.status === "fulfilled" ? latestCandle(candleResult.value) : null;

        const quoteUsable = isUsableQuote(quote);
        const candleUsable = candle !== null;

        const previousClose = quoteUsable ? quote.pc ?? null : null;

        const selectedPrice = candleUsable
          ? candle.close
          : typeof quote.c === "number" && quote.c > 0
          ? quote.c
          : null;

        const selectedTimestamp = candleUsable ? candle.timestamp : quote.t ?? null;
        const quoteAgeMinutes = getQuoteAgeMinutes(selectedTimestamp);

        const usable =
          selectedPrice !== null &&
          selectedPrice > 0 &&
          previousClose !== null &&
          previousClose > 0;

        const change = usable ? selectedPrice - previousClose : null;
        const changePercent = usable && previousClose
          ? ((selectedPrice - previousClose) / previousClose) * 100
          : null;

        const dataStatus = getDataStatus(usable, marketOpen, quoteAgeMinutes);

        return {
          ...market,
          ok: usable,
          error: usable ? null : "No usable market data returned.",
          isMarketOpen: marketOpen,
          marketStatusLabel: marketOpen ? "Open" : "Closed",
          localClock: formatLocalClock(market.exchangeTimeZone),
          price: selectedPrice,
          change,
          changePercent,
          previousClose,
          high: candleUsable ? candle.high : quote.h ?? null,
          low: candleUsable ? candle.low : quote.l ?? null,
          open: candleUsable ? candle.open : quote.o ?? null,
          quoteTime: selectedTimestamp
            ? new Date(selectedTimestamp * 1000).toISOString()
            : null,
          exchangeTime: selectedTimestamp
            ? formatQuoteExchangeTime(selectedTimestamp, market.exchangeTimeZone)
            : null,
          quoteAgeMinutes,
          dataSource: candleUsable ? "candle" : "quote",
          ...dataStatus,
        };
      } catch (err) {
        return {
          ...market,
          ok: false,
          error: err instanceof Error ? err.message : "Unknown fetch error.",
          isMarketOpen: marketOpen,
          marketStatusLabel: marketOpen ? "Open" : "Closed",
          localClock: formatLocalClock(market.exchangeTimeZone),
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
          dataSource: "none",
          dataStatus: "stale",
          dataStatusLabel: "Stale",
          dataTone: "amber",
        };
      }
    })
  );

  return NextResponse.json({
    ok: markets.some((m) => m.ok),
    updatedAt: new Date().toISOString(),
    markets,
  });
}
