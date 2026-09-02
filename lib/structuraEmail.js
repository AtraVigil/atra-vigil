import crypto from "node:crypto";

export const REQUIRED_INDEXES = [
  "Nikkei 225",
  "Hang Seng",
  "KOSPI",
  "TAIEX",
  "Straits Times Index",
  "Nifty 50",
  "ASX 200",
  "FTSE 100",
  "DAX",
  "CAC 40",
  "EURO STOXX 50",
  "FTSE MIB",
  "IBEX 35",
  "SMI",
  "AEX",
];


export const FULL_SECTOR_NAMES = new Set([
  "Communication Services",
  "Consumer Discretionary",
  "Consumer Staples",
  "Energy",
  "Financials",
  "Health Care",
  "Industrials",
  "Information Technology",
  "Materials",
  "Real Estate",
  "Utilities",
]);

const PROVIDER_TERMS = /\b(?:resend|yahoo|finnhub|massive|polygon|twelve data|google sheets)\b/i;
const INTERNAL_STATUS_TERMS = /\b(?:internal operational status|operational status section|provider status|delivery status|scheduler status)\b/i;

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function checkPublicContent(value, path, errors) {
  if (!nonEmptyString(value)) return;
  if (PROVIDER_TERMS.test(value)) {
    errors.push(`${path} must not contain provider names`);
  }
  if (INTERNAL_STATUS_TERMS.test(value)) {
    errors.push(`${path} must not contain an internal operational-status section`);
  }
}

export function validateStructuraPayload(payload) {
  const errors = [];

  if (!isObject(payload)) return ["request body must be a JSON object"];

  const requiredTop = [
    "schema_version",
    "source",
    "product",
    "mode",
    "delivery_type",
    "snapshot_id",
    "morning_date",
    "subject",
    "brief",
  ];

  for (const key of requiredTop) {
    if (!(key in payload)) errors.push(`${key} is required`);
  }

  if (payload.schema_version !== "1.0") errors.push('schema_version must equal "1.0"');
  if (payload.source !== "AtraVigilV3") errors.push('source must equal "AtraVigilV3"');
  if (payload.product !== "Atra Structura") errors.push('product must equal "Atra Structura"');
  if (payload.mode !== "PARALLEL") errors.push('mode must equal "PARALLEL"');
  if (payload.delivery_type !== "morning_brief") {
    errors.push('delivery_type must equal "morning_brief"');
  }
  if (!nonEmptyString(payload.snapshot_id)) errors.push("snapshot_id must be non-empty");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.morning_date ?? "")) {
    errors.push("morning_date must use YYYY-MM-DD");
  }
  if (!nonEmptyString(payload.subject)) errors.push("subject must be non-empty");
  if (nonEmptyString(payload.subject) && !payload.subject.startsWith("Atra Structura Morning Brief — ")) {
    errors.push("subject must use the approved Atra Structura morning-brief prefix");
  }

  checkPublicContent(payload.subject, "subject", errors);

  if (!isObject(payload.brief)) {
    errors.push("brief must be an object");
    return errors;
  }

  const brief = payload.brief;
  const requiredBrief = [
    "full_text",
    "spy",
    "confirmation",
    "overseas",
    "x_ready_post",
    "x_character_count",
    "disclosure",
  ];
  for (const key of requiredBrief) {
    if (!(key in brief)) errors.push(`brief.${key} is required`);
  }

  if (!nonEmptyString(brief.full_text)) errors.push("brief.full_text must be non-empty");
  if (!nonEmptyString(brief.x_ready_post)) errors.push("brief.x_ready_post must be non-empty");
  if (!nonEmptyString(brief.disclosure)) errors.push("brief.disclosure must be non-empty");

  checkPublicContent(brief.full_text, "brief.full_text", errors);
  checkPublicContent(brief.x_ready_post, "brief.x_ready_post", errors);
  checkPublicContent(brief.disclosure, "brief.disclosure", errors);

  if (typeof brief.x_ready_post === "string") {
    const actualCount = [...brief.x_ready_post].length;
    if (brief.x_character_count !== actualCount) {
      errors.push("brief.x_character_count does not match the X-ready post");
    }
  }
  if (!Number.isInteger(brief.x_character_count) || brief.x_character_count < 0) {
    errors.push("brief.x_character_count must be a non-negative integer");
  }

  if (!isObject(brief.spy) || brief.spy.label !== "S&P 500" || !nonEmptyString(brief.spy.change)) {
    errors.push('brief.spy must contain label "S&P 500" and a non-empty change');
  }

  if (!isObject(brief.confirmation)) {
    errors.push("brief.confirmation must be an object");
  } else {
    if (!nonEmptyString(brief.confirmation.label)) {
      errors.push("brief.confirmation.label must be non-empty");
    }
    for (const field of ["confirming_sectors", "diverging_sectors"]) {
      const sectors = brief.confirmation[field];
      if (!Array.isArray(sectors)) {
        errors.push(`brief.confirmation.${field} must be an array`);
        continue;
      }
      for (const sector of sectors) {
        if (!FULL_SECTOR_NAMES.has(sector)) {
          errors.push(`brief.confirmation.${field} contains a non-canonical sector name: ${String(sector)}`);
        }
      }
    }
  }

  if ("fx_reference" in brief) {
    const fx = brief.fx_reference;
    if (!isObject(fx)) {
      errors.push("brief.fx_reference must be an object when present");
    } else {
      if (fx.label !== "Prior-Day Reference Rates") {
        errors.push('brief.fx_reference.label must equal "Prior-Day Reference Rates"');
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(fx.observation_date ?? "")) {
        errors.push("brief.fx_reference.observation_date must use YYYY-MM-DD");
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(fx.prior_observation_date ?? "")) {
        errors.push("brief.fx_reference.prior_observation_date must use YYYY-MM-DD");
      }
      const expectedFxPairs = ["EUR/USD","GBP/USD","USD/JPY","USD/CNY","AUD/USD","USD/KRW","USD/INR"];
      if (!Array.isArray(fx.pairs) || fx.pairs.length !== expectedFxPairs.length) {
        errors.push("brief.fx_reference.pairs must contain exactly seven pairs");
      } else {
        const names = fx.pairs.map((row) => row?.pair);
        for (const pair of expectedFxPairs) {
          if (names.filter((item) => item === pair).length !== 1) {
            errors.push(`brief.fx_reference.pairs must contain ${pair} exactly once`);
          }
        }
        for (const row of fx.pairs) {
          if (!isObject(row) || !nonEmptyString(row.pair) || !nonEmptyString(row.rate) || !nonEmptyString(row.prior_rate) || !nonEmptyString(row.change_percent)) {
            errors.push("each FX row must contain pair, rate, prior_rate, and change_percent");
          }
        }
      }
    }
  }

  if (!isObject(brief.overseas)) {
    errors.push("brief.overseas must be an object");
  } else {
    if (brief.overseas.asia_status !== "CLOSED") {
      errors.push('brief.overseas.asia_status must equal "CLOSED"');
    }
    if (brief.overseas.europe_status !== "LIVE") {
      errors.push('brief.overseas.europe_status must equal "LIVE"');
    }
    if (!Array.isArray(brief.overseas.indexes)) {
      errors.push("brief.overseas.indexes must be an array");
    } else {
      const names = brief.overseas.indexes.map((row) => row?.name);
      for (const name of REQUIRED_INDEXES) {
        if (names.filter((item) => item === name).length !== 1) {
          errors.push(`brief.overseas.indexes must contain ${name} exactly once`);
        }
      }
      if (names.length !== REQUIRED_INDEXES.length) {
        errors.push("brief.overseas.indexes must contain exactly 15 indexes");
      }
      for (const row of brief.overseas.indexes) {
        if (!isObject(row) || !nonEmptyString(row.name) || !nonEmptyString(row.change_percent)) {
          errors.push("each overseas index must contain name and change_percent");
        }
      }
    }
  }

  return errors;
}

export function computeSignature(secret, timestamp, rawBody) {
  return crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`, "utf8")
    .digest("hex");
}

export function verifyHmac({
  secret,
  timestamp,
  rawBody,
  suppliedSignature,
  nowSeconds = Math.floor(Date.now() / 1000),
  maxClockSkewSeconds = 300,
}) {
  if (!nonEmptyString(secret) || !nonEmptyString(timestamp) || !nonEmptyString(suppliedSignature)) {
    return false;
  }

  const parsedTimestamp = Number(timestamp);
  if (!Number.isInteger(parsedTimestamp)) return false;
  if (Math.abs(nowSeconds - parsedTimestamp) > maxClockSkewSeconds) return false;

  const suppliedHex = suppliedSignature.startsWith("sha256=")
    ? suppliedSignature.slice("sha256=".length)
    : suppliedSignature;

  if (!/^[a-f0-9]{64}$/i.test(suppliedHex)) return false;

  const expected = computeSignature(secret, timestamp, rawBody);
  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(suppliedHex, "hex"),
  );
}

export function evaluateDeliveryPreflight({
  payloadMode,
  configuredMode,
  enabled,
  suppliedIdempotencyKey,
  snapshotId,
}) {
  if (payloadMode === "PRODUCTION") {
    return {
      status: 403,
      body: {
        ok: false,
        error: "mode_not_allowed",
        allowed_mode: "PARALLEL",
      },
    };
  }

  if (payloadMode !== "PARALLEL" || configuredMode !== "PARALLEL") {
    return {
      status: 403,
      body: {
        ok: false,
        error: "mode_not_allowed",
        allowed_mode: "PARALLEL",
      },
    };
  }

  if (suppliedIdempotencyKey !== snapshotId) {
    return {
      status: 409,
      body: {
        ok: false,
        error: "idempotency_conflict",
        snapshot_id: snapshotId,
      },
    };
  }

  if (enabled !== "true") {
    return {
      status: 503,
      body: {
        ok: false,
        error: "email_delivery_disabled",
        message: "Atra Structura email delivery is disabled.",
      },
    };
  }

  return null;
}

export function parseRecipientList(value) {
  if (typeof value !== "string") return [];

  const recipients = value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  const uniqueRecipients = [...new Set(recipients)];

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (uniqueRecipients.some((email) => !emailPattern.test(email))) {
    return [];
  }

  return uniqueRecipients;
}

export function idempotencyKey(snapshotId) {
  const normalized = String(snapshotId ?? "").trim();
  if (!normalized) throw new Error("snapshot_id is required");
  const key = `structura-morning/${normalized}`;
  if (key.length <= 256) return key;
  const digest = crypto.createHash("sha256").update(normalized).digest("hex");
  return `structura-morning/${digest}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function fxInterpretation(row) {
  const pair = String(row?.pair ?? "");
  const change = Number.parseFloat(String(row?.change_percent ?? "").replace("%", ""));
  if (!Number.isFinite(change)) return "Directional interpretation unavailable";

  const flat = Math.abs(change) < 0.005;
  const terms = {
    "EUR/USD": ["U.S. dollar weakened versus the euro", "U.S. dollar strengthened versus the euro", "Little change between the U.S. dollar and euro"],
    "GBP/USD": ["U.S. dollar weakened versus the pound", "U.S. dollar strengthened versus the pound", "Little change between the U.S. dollar and pound"],
    "USD/JPY": ["U.S. dollar strengthened versus the yen", "U.S. dollar weakened versus the yen", "Little change between the U.S. dollar and yen"],
    "USD/CNY": ["U.S. dollar strengthened versus the yuan", "U.S. dollar weakened versus the yuan", "Little change between the U.S. dollar and yuan"],
    "AUD/USD": ["U.S. dollar weakened versus the Australian dollar", "U.S. dollar strengthened versus the Australian dollar", "Little change between the U.S. dollar and Australian dollar"],
    "USD/KRW": ["U.S. dollar strengthened versus the won", "U.S. dollar weakened versus the won", "Little change between the U.S. dollar and won"],
    "USD/INR": ["U.S. dollar strengthened versus the rupee", "U.S. dollar weakened versus the rupee", "Little change between the U.S. dollar and rupee"],
  };

  const wording = terms[pair];
  if (!wording) return "Directional interpretation unavailable";
  if (flat) return wording[2];

  const usdIsBase = pair.startsWith("USD/");
  const usdStrengthened = usdIsBase ? change > 0 : change < 0;
  return usdStrengthened ? wording[usdIsBase ? 0 : 1] : wording[usdIsBase ? 1 : 0];
}

export function renderEmail(payload) {
  const { brief, morning_date: morningDate } = payload;
  const confirming = brief.confirmation.confirming_sectors.join(", ") || "None";
  const diverging = brief.confirmation.diverging_sectors.join(", ") || "None";
  const asia = brief.overseas.indexes
    .filter((row) => ["Nikkei 225", "Hang Seng", "KOSPI", "TAIEX", "Straits Times Index", "Nifty 50", "ASX 200"].includes(row.name))
    .map((row) => `${row.name} ${row.change_percent}`)
    .join(", ");
  const europe = brief.overseas.indexes
    .filter((row) => ["FTSE 100", "DAX", "CAC 40", "EURO STOXX 50", "FTSE MIB", "IBEX 35", "SMI", "AEX"].includes(row.name))
    .map((row) => `${row.name} ${row.change_percent}`)
    .join(", ");

  const fx = brief.fx_reference;
  const fxText = fx
    ? [
        `Foreign Exchange — ${fx.label}`,
        `Observation date: ${fx.observation_date}`,
        ...fx.pairs.flatMap((row) => [
          `${row.pair}: ${row.rate} (${row.change_percent})`,
          `  ${fxInterpretation(row)}`,
        ]),
      ]
    : [];
  const fxHtml = fx
    ? `<hr><h2>Foreign Exchange — ${escapeHtml(fx.label)}</h2>
    <p><strong>Observation date:</strong> ${escapeHtml(fx.observation_date)}</p>
    ${fx.pairs.map((row) => `<p><strong>${escapeHtml(row.pair)}:</strong> ${escapeHtml(row.rate)} (${escapeHtml(row.change_percent)})<br><span>${escapeHtml(fxInterpretation(row))}</span></p>`).join("\n")}`
    : "";

  const text = [
    "Atra Structura Morning Brief",
    morningDate,
    "",
    brief.full_text,
    "",
    `S&P 500: ${brief.spy.change}`,
    `Confirmation: ${brief.confirmation.label}`,
    "",
    `Confirming: ${confirming}`,
    `Diverging: ${diverging}`,
    "",
    `Asia (CLOSED): ${asia}`,
    `Europe (LIVE): ${europe}`,
    ...(fxText.length ? ["", ...fxText] : []),
    "",
    "Final X-ready post",
    brief.x_ready_post,
    "",
    brief.disclosure,
  ].join("\n");

  const html = `<!doctype html>
<html>
  <body style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#111827">
    <h1>Atra Structura Morning Brief</h1>
    <p><strong>${escapeHtml(morningDate)}</strong></p>
    <div style="white-space:pre-wrap">${escapeHtml(brief.full_text)}</div>
    <hr>
    <p><strong>S&amp;P 500:</strong> ${escapeHtml(brief.spy.change)}</p>
    <p><strong>Confirmation:</strong> ${escapeHtml(brief.confirmation.label)}</p>
    <p><strong>Confirming:</strong> ${escapeHtml(confirming)}</p>
    <p><strong>Diverging:</strong> ${escapeHtml(diverging)}</p>
    <p><strong>Asia (CLOSED):</strong> ${escapeHtml(asia)}</p>
    <p><strong>Europe (LIVE):</strong> ${escapeHtml(europe)}</p>
    ${fxHtml}
    <hr>
    <h2>Final X-ready post</h2>
    <div style="white-space:pre-wrap">${escapeHtml(brief.x_ready_post)}</div>
    <hr>
    <p><em>${escapeHtml(brief.disclosure)}</em></p>
  </body>
</html>`;

  return { text, html };
}
