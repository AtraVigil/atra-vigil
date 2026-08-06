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
          { name: "ASX 200", region: "Asia", change_percent: "+0.34%" },
          { name: "Nikkei 225", region: "Asia", change_percent: "-0.18%" },
          { name: "FTSE 100", region: "Europe", change_percent: "+0.21%" },
          { name: "DAX", region: "Europe", change_percent: "+0.46%" },
          { name: "CAC 40", region: "Europe", change_percent: "+0.29%" },
          { name: "EURO STOXX 50", region: "Europe", change_percent: "+0.38%" },
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

test("PRODUCTION contract is rejected", () => {
  const value = payload();
  value.mode = "PRODUCTION";
  assert.match(validateStructuraPayload(value).join("\n"), /PARALLEL/);
});

test("missing overseas index is rejected", () => {
  const value = payload();
  value.brief.overseas.indexes.pop();
  assert.match(validateStructuraPayload(value).join("\n"), /EURO STOXX 50/);
});

test("Asia and Europe states are enforced", () => {
  const value = payload();
  value.brief.overseas.asia_status = "LIVE";
  value.brief.overseas.europe_status = "CLOSED";
  const errors = validateStructuraPayload(value).join("\n");
  assert.match(errors, /asia_status/);
  assert.match(errors, /europe_status/);
});

test("X-ready post over 280 characters is rejected", () => {
  const value = payload();
  value.brief.x_ready_post = "x".repeat(281);
  value.brief.x_character_count = 281;
  assert.match(validateStructuraPayload(value).join("\n"), /exceeds 280/);
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
