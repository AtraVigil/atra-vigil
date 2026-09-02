import assert from "node:assert/strict";
import test from "node:test";

import {
  computeSignature,
  evaluateDeliveryPreflight,
  idempotencyKey,
  renderEmail,
  validateStructuraPayload,
  verifyHmac,
} from "../lib/structuraEmail.js";

function payload() {
  const x = [
    "8/7/2026",
    "",
    "S&P 500: -0.42%",
    "Confirmation: Mixed",
    "",
    "Confirming: Communication Services, Consumer Staples",
    "",
    "Asia (CLOSED): ASX 200 +0.34%, Nikkei 225 -0.18%",
    "Europe (LIVE): FTSE 100 +0.21%, DAX +0.46%, CAC 40 +0.29%, EURO STOXX 50 +0.38%",
  ].join("\n");

  return {
    schema_version: "1.0",
    source: "AtraVigilV3",
    product: "Atra Structura",
    mode: "PARALLEL",
    delivery_type: "morning_brief",
    snapshot_id: "AV3-PARALLEL-MORNING-20260807-001",
    morning_date: "2026-08-07",
    subject: "Atra Structura Morning Brief — August 7, 2026",
    brief: {
      full_text: "Descriptive morning market brief.",
      spy: { label: "S&P 500", change: "-0.42%" },
      confirmation: {
        label: "Mixed",
        confirming_sectors: [
          "Communication Services",
          "Consumer Staples",
        ],
        diverging_sectors: [
          "Energy",
          "Financials",
          "Industrials",
          "Information Technology",
          "Materials",
          "Real Estate",
          "Consumer Discretionary",
          "Health Care",
          "Utilities",
        ],
      },
      overseas: {
        asia_status: "CLOSED",
        europe_status: "LIVE",
        indexes: [
          { name: "Nikkei 225", region: "Asia", change_percent: "-0.18%" },
          { name: "Hang Seng", region: "Asia", change_percent: "+0.11%" },
          { name: "KOSPI", region: "Asia", change_percent: "-0.22%" },
          { name: "TAIEX", region: "Asia", change_percent: "+0.33%" },
          { name: "Straits Times Index", region: "Asia", change_percent: "+0.12%" },
          { name: "Nifty 50", region: "Asia", change_percent: "-0.14%" },
          { name: "ASX 200", region: "Asia", change_percent: "+0.34%" },
          { name: "FTSE 100", region: "Europe", change_percent: "+0.21%" },
          { name: "DAX", region: "Europe", change_percent: "+0.46%" },
          { name: "CAC 40", region: "Europe", change_percent: "+0.29%" },
          { name: "EURO STOXX 50", region: "Europe", change_percent: "+0.38%" },
          { name: "FTSE MIB", region: "Europe", change_percent: "+0.17%" },
          { name: "IBEX 35", region: "Europe", change_percent: "+0.09%" },
          { name: "SMI", region: "Europe", change_percent: "-0.08%" },
          { name: "AEX", region: "Europe", change_percent: "+0.15%" },
        ],
      },
      x_ready_post: x,
      x_character_count: [...x].length,
      disclosure:
        "Descriptive market information only. Not investment advice, a trading signal, or a forecast.",
    },
  };
}

test("valid PARALLEL contract passes", () => {
  assert.deepEqual(validateStructuraPayload(payload()), []);
});

test("15-index morning contract renders every regional index", () => {
  const value = payload();
  const rendered = renderEmail(value);
  for (const name of ["Nikkei 225","Hang Seng","KOSPI","TAIEX","Straits Times Index","Nifty 50","ASX 200","FTSE 100","DAX","CAC 40","EURO STOXX 50","FTSE MIB","IBEX 35","SMI","AEX"]) {
    assert.ok(rendered.text.includes(name), `rendered text missing ${name}`);
    assert.ok(rendered.html.includes(name), `rendered html missing ${name}`);
  }
});

test("15-index contract requires Singapore STI", () => {
  const value = payload();
  value.brief.overseas.indexes = value.brief.overseas.indexes.filter(
    (row) => row.name !== "Straits Times Index"
  );
  const errors = validateStructuraPayload(value).join("\n");
  assert.match(errors, /Straits Times Index exactly once/);
  assert.match(errors, /exactly 15 indexes/);
});

test("unexpected sixteenth overseas index is rejected", () => {
  const value = payload();
  value.brief.overseas.indexes.push({
    name: "Unexpected Index",
    region: "Europe",
    change_percent: "+0.01%",
  });
  const errors = validateStructuraPayload(value).join("\n");
  assert.match(errors, /exactly 15 indexes/);
});

test("PRODUCTION contract is rejected", () => {
  const value = payload();
  value.mode = "PRODUCTION";
  assert.match(validateStructuraPayload(value).join("\n"), /PARALLEL/);
});

test("missing required overseas index is rejected", () => {
  const value = payload();
  value.brief.overseas.indexes = value.brief.overseas.indexes.filter(
    (row) => row.name !== "FTSE MIB"
  );
  const errors = validateStructuraPayload(value).join("\n");
  assert.match(errors, /FTSE MIB exactly once/);
  assert.match(errors, /exactly 15 indexes/);
});

test("Asia and Europe states are enforced", () => {
  const value = payload();
  value.brief.overseas.asia_status = "LIVE";
  value.brief.overseas.europe_status = "CLOSED";
  const errors = validateStructuraPayload(value).join("\n");
  assert.match(errors, /asia_status/);
  assert.match(errors, /europe_status/);
});

test("X-ready post over 280 characters is accepted when count matches", () => {
  const value = payload();
  value.brief.x_ready_post = "x".repeat(337);
  value.brief.x_character_count = 337;
  assert.deepEqual(validateStructuraPayload(value), []);
});

test("non-canonical sector name is rejected", () => {
  const value = payload();
  value.brief.confirmation.confirming_sectors = ["Tech"];
  assert.match(validateStructuraPayload(value).join("\n"), /non-canonical sector/);
});

test("provider names in public content are rejected", () => {
  const value = payload();
  value.brief.full_text = "Source: Resend";
  assert.match(validateStructuraPayload(value).join("\n"), /provider names/);
});

test("HMAC succeeds only for exact body timestamp and secret", () => {
  const secret = "test-secret";
  const timestamp = "1786118400";
  const rawBody = JSON.stringify(payload());
  const signature = `sha256=${computeSignature(secret, timestamp, rawBody)}`;

  assert.equal(
    verifyHmac({
      secret,
      timestamp,
      rawBody,
      suppliedSignature: signature,
      nowSeconds: Number(timestamp),
      maxClockSkewSeconds: 300,
    }),
    true,
  );

  assert.equal(
    verifyHmac({
      secret,
      timestamp,
      rawBody: `${rawBody} `,
      suppliedSignature: signature,
      nowSeconds: Number(timestamp),
      maxClockSkewSeconds: 300,
    }),
    false,
  );
});

test("expired HMAC timestamp is rejected", () => {
  const secret = "test-secret";
  const timestamp = "1786118400";
  const rawBody = JSON.stringify(payload());
  const signature = `sha256=${computeSignature(secret, timestamp, rawBody)}`;

  assert.equal(
    verifyHmac({
      secret,
      timestamp,
      rawBody,
      suppliedSignature: signature,
      nowSeconds: Number(timestamp) + 301,
      maxClockSkewSeconds: 300,
    }),
    false,
  );
});

test("snapshot id creates deterministic duplicate-prevention key", () => {
  const snapshot = payload().snapshot_id;
  assert.equal(idempotencyKey(snapshot), idempotencyKey(snapshot));
  assert.notEqual(idempotencyKey(snapshot), idempotencyKey(`${snapshot}-other`));
});

test("multipart content includes full brief and X-ready post", () => {
  const value = payload();
  const rendered = renderEmail(value);
  assert.match(rendered.text, /Descriptive morning market brief/);
  assert.match(rendered.text, /Final X-ready post/);
  assert.match(rendered.html, /Descriptive morning market brief/);
  assert.match(rendered.html, /Final X-ready post/);
});

test("PRODUCTION preflight returns 403", () => {
  const result = evaluateDeliveryPreflight({
    payloadMode: "PRODUCTION",
    configuredMode: "PARALLEL",
    enabled: "false",
    suppliedIdempotencyKey: "snapshot-1",
    snapshotId: "snapshot-1",
  });
  assert.equal(result.status, 403);
  assert.equal(result.body.error, "mode_not_allowed");
});

test("disabled send preflight returns 503", () => {
  const result = evaluateDeliveryPreflight({
    payloadMode: "PARALLEL",
    configuredMode: "PARALLEL",
    enabled: "false",
    suppliedIdempotencyKey: "snapshot-1",
    snapshotId: "snapshot-1",
  });
  assert.equal(result.status, 503);
  assert.equal(result.body.error, "email_delivery_disabled");
});

test("idempotency mismatch returns 409", () => {
  const result = evaluateDeliveryPreflight({
    payloadMode: "PARALLEL",
    configuredMode: "PARALLEL",
    enabled: "true",
    suppliedIdempotencyKey: "snapshot-2",
    snapshotId: "snapshot-1",
  });
  assert.equal(result.status, 409);
  assert.equal(result.body.error, "idempotency_conflict");
});

test("valid enabled PARALLEL preflight passes", () => {
  const result = evaluateDeliveryPreflight({
    payloadMode: "PARALLEL",
    configuredMode: "PARALLEL",
    enabled: "true",
    suppliedIdempotencyKey: "snapshot-1",
    snapshotId: "snapshot-1",
  });
  assert.equal(result, null);
});

test("legacy payload without FX remains valid", () => {
  const value = payload();
  delete value.brief.fx_reference;
  assert.deepEqual(validateStructuraPayload(value), []);
});

test("valid seven-pair FX reference section passes and renders", () => {
  const value = payload();
  value.brief.fx_reference = {
    label: "Prior-Day Reference Rates",
    observation_date: "2026-09-01",
    prior_observation_date: "2026-08-31",
    pairs: [
      { pair: "EUR/USD", rate: "1.1607", prior_rate: "1.1617", change_percent: "-0.09%" },
      { pair: "GBP/USD", rate: "1.3547", prior_rate: "1.3551", change_percent: "-0.03%" },
      { pair: "USD/JPY", rate: "159.93", prior_rate: "159.81", change_percent: "+0.08%" },
      { pair: "USD/CNY", rate: "6.7188", prior_rate: "6.7188", change_percent: "+0.00%" },
      { pair: "AUD/USD", rate: "0.71571", prior_rate: "0.71675", change_percent: "-0.15%" },
      { pair: "USD/KRW", rate: "1371.32", prior_rate: "1372.87", change_percent: "-0.11%" },
      { pair: "USD/INR", rate: "95.1", prior_rate: "95.35", change_percent: "-0.26%" }
    ]
  };
  assert.deepEqual(validateStructuraPayload(value), []);
  const rendered = renderEmail(value);
  assert.match(rendered.text, /Foreign Exchange — Prior-Day Reference Rates/);
  assert.match(rendered.text, /EUR\/USD/);
  assert.match(rendered.text, /USD\/INR/);
  assert.match(rendered.html, /Foreign Exchange/);
});

test("FX reference fails closed when one pair is missing", () => {
  const value = payload();
  value.brief.fx_reference = {
    label: "Prior-Day Reference Rates",
    observation_date: "2026-09-01",
    prior_observation_date: "2026-08-31",
    pairs: [
      { pair: "EUR/USD", rate: "1.1607", prior_rate: "1.1617", change_percent: "-0.09%" }
    ]
  };
  assert.match(validateStructuraPayload(value).join("\n"), /exactly seven pairs/);
});

test("FX interpretation reflects USD direction for quote and base pairs", () => {
  const value = payload();
  value.brief.fx_reference = {
    label: "Prior-Day Reference Rates",
    observation_date: "2026-09-01",
    prior_observation_date: "2026-08-31",
    pairs: [
      { pair: "EUR/USD", rate: "1.1607", prior_rate: "1.1617", change_percent: "-0.09%" },
      { pair: "GBP/USD", rate: "1.3547", prior_rate: "1.3551", change_percent: "-0.03%" },
      { pair: "USD/JPY", rate: "159.93", prior_rate: "159.81", change_percent: "+0.08%" },
      { pair: "USD/CNY", rate: "6.7188", prior_rate: "6.7188", change_percent: "+0.00%" },
      { pair: "AUD/USD", rate: "0.71571", prior_rate: "0.71675", change_percent: "-0.15%" },
      { pair: "USD/KRW", rate: "1371.32", prior_rate: "1372.87", change_percent: "-0.11%" },
      { pair: "USD/INR", rate: "95.1", prior_rate: "95.35", change_percent: "-0.26%" }
    ]
  };

  const rendered = renderEmail(value);
  assert.match(rendered.text, /U\.S\. dollar strengthened versus the euro/);
  assert.match(rendered.text, /U\.S\. dollar strengthened versus the pound/);
  assert.match(rendered.text, /U\.S\. dollar strengthened versus the yen/);
  assert.match(rendered.text, /Little change between the U\.S\. dollar and yuan/);
  assert.match(rendered.text, /U\.S\. dollar strengthened versus the Australian dollar/);
  assert.match(rendered.text, /U\.S\. dollar weakened versus the won/);
  assert.match(rendered.text, /U\.S\. dollar weakened versus the rupee/);
});
