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
  state: "open" | "break";
  label?: "Open" | "Lunch Break";
};

type MarketHoliday = {
  label: string;
  status: "closed" | "early_close";
  closeMinutes?: number;
};

type MarketConfig = {
  key: string;
  name: string;
  symbol: string;
  region: string;
  flag: string;
  exchangeTimeZone: string;
  sessions: MarketSession[];
  holidays2026: Record<string, MarketHoliday>;
};

const CLOSED = (label: string): MarketHoliday => ({ label, status: "closed" });
const EARLY_CLOSE = (label: string, closeMinutes: number): MarketHoliday => ({
  label,
  status: "early_close",
  closeMinutes,
});

const MARKETS: MarketConfig[] = [
  {
    key: "nikkei",
    name: "Nikkei 225",
    symbol: "^N225",
    region: "Japan",
    flag: "🇯🇵",
    exchangeTimeZone: "Asia/Tokyo",
    sessions: [
      { start: 9 * 60, end: 11 * 60 + 30, state: "open", label: "Open" },
      { start: 11 * 60 + 30, end: 12 * 60 + 30, state: "break", label: "Lunch Break" },
      { start: 12 * 60 + 30, end: 15 * 60 + 30, state: "open", label: "Open" },
    ],
    holidays2026: {
      "2026-01-01": CLOSED("New Year's Day"),
      "2026-01-02": CLOSED("Market Holiday"),
      "2026-01-03": CLOSED("Market Holiday"),
      "2026-01-12": CLOSED("Coming of Age Day"),
      "2026-02-11": CLOSED("National Foundation Day"),
      "2026-02-23": CLOSED("Emperor's Birthday"),
      "2026-03-20": CLOSED("Vernal Equinox"),
      "2026-04-29": CLOSED("Showa Day"),
      "2026-05-03": CLOSED("Constitution Memorial Day"),
      "2026-05-04": CLOSED("Greenery Day"),
      "2026-05-05": CLOSED("Children's Day"),
      "2026-05-06": CLOSED("Constitution Memorial Day observed"),
      "2026-07-20": CLOSED("Marine Day"),
      "2026-08-11": CLOSED("Mountain Day"),
      "2026-09-21": CLOSED("Respect for the Aged Day"),
      "2026-09-22": CLOSED("National Holiday"),
      "2026-09-23": CLOSED("Autumnal Equinox"),
      "2026-10-12": CLOSED("Sports Day"),
      "2026-11-03": CLOSED("Culture Day"),
      "2026-11-23": CLOSED("Labor Thanksgiving Day"),
      "2026-12-31": CLOSED("Market Holiday"),
    },
  },
  {
    key: "ftse",
    name: "FTSE 100",
    symbol: "^FTSE",
    region: "United Kingdom",
    flag: "🇬🇧",
    exchangeTimeZone: "Europe/London",
    sessions: [{ start: 8 * 60, end: 16 * 60 + 30, state: "open", label: "Open" }],
    holidays2026: {
      "2026-01-01": CLOSED("New Year's Day"),
      "2026-04-03": CLOSED("Good Friday"),
      "2026-04-06": CLOSED("Easter Monday"),
      "2026-05-04": CLOSED("Early May Bank Holiday"),
      "2026-05-25": CLOSED("Spring Bank Holiday"),
      "2026-08-31": CLOSED("Summer Bank Holiday"),
      "2026-12-24": EARLY_CLOSE("Christmas Eve", 12 * 60 + 30),
      "2026-12-25": CLOSED("Christmas Day"),
      "2026-12-28": CLOSED("Boxing Day observed"),
      "2026-12-31": EARLY_CLOSE("New Year's Eve", 12 * 60 + 30),
    },
  },
  {
    key: "dax",
    name: "DAX",
    symbol: "^GDAXI",
    region: "Germany",
    flag: "🇩🇪",
    exchangeTimeZone: "Europe/Berlin",
    sessions: [{ start: 9 * 60, end: 17 * 60 + 30, state: "open", label: "Open" }],
    holidays2026: {
      "2026-01-01": CLOSED("New Year's Day"),
      "2026-04-03": CLOSED("Good Friday"),
      "2026-04-06": CLOSED("Easter Monday"),
      "2026-05-01": CLOSED("Labor Day"),
      "2026-12-24": CLOSED("Christmas Eve"),
      "2026-12-25": CLOSED("Christmas Day"),
      "2026-12-26": CLOSED("Boxing Day"),
      "2026-12-31": CLOSED("New Year's Eve"),
    },
  },
];

function getExchangeClock(timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
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
    dateKey: `${part("year")}-${part("month")}-${part("day")}`,
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

function applyEarlyClose(sessions: MarketSession[], closeMinutes?: number) {
  if (!closeMinutes) return sessions;

  return sessions
    .map((session) => {
      if (session.start >= closeMinutes) return null;
      if (session.end > closeMinutes) return { ...session, end: closeMinutes };
      return session;
    })
    .filter(Boolean) as MarketSession[];
}

function getMarketSessionState(market: MarketConfig): {
  isMarketOpen: boolean;
  marketStatusLabel: "Open" | "Closed" | "Holiday" | "Lunch Break";
  marketTone: "green" | "red" | "amber";
  holidayName: string | null;
} {
  const clock = getExchangeClock(market.exchangeTimeZone);
  const holiday = market.holidays2026[clock.dateKey];

  if (holiday?.status === "closed") {
    return {
      isMarketOpen: false,
      marketStatusLabel: "Holiday",
      marketTone: "red",
      holidayName: holiday.label,
    };
  }

  if (isWeekend(clock.weekday)) {
    return {
      isMarketOpen: false,
      marketStatusLabel: "Closed",
      marketTone: "red",
      holidayName: null,
    };
  }

  const sessions = applyEarlyClose(market.sessions, holiday?.closeMinutes);
  const current = sessions.find(
    (s) => clock.minutes >= s.start && clock.minutes < s.end
  );

  if (current?.state === "open") {
    return {
      isMarketOpen: true,
      marketStatusLabel: "Open",
      marketTone: "green",
      holidayName: holiday?.label ?? null,
    };
  }

  if (current?.state === "break") {
    return {
      isMarketOpen: false,
      marketStatusLabel: "Lunch Break",
      marketTone: "amber",
      holidayName: null,
    };
  }

  return {
    isMarketOpen: false,
    marketStatusLabel: "Closed",
    marketTone: "red",
    holidayName: holiday?.label ?? null,
  };
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
      const sessionState = getMarketSessionState(market);

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
        const changePercent =
          usable && previousClose ? ((selectedPrice - previousClose) / previousClose) * 100 : null;

        const dataStatus = getDataStatus(
          usable,
          sessionState.isMarketOpen,
          quoteAgeMinutes
        );

        return {
          ...market,
          ok: usable,
          error: usable ? null : "No usable market data returned.",
          ...sessionState,
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
          ...sessionState,
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
