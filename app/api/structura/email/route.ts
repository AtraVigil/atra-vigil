import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

import {
  evaluateDeliveryPreflight,
  idempotencyKey,
  parseRecipientList,
  renderEmail,
  validateStructuraPayload,
  verifyHmac,
} from "@/lib/structuraEmail";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function json(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const timestamp = request.headers.get("x-structura-timestamp") ?? "";
  const suppliedSignature = request.headers.get("x-structura-signature") ?? "";
  const suppliedSource = request.headers.get("x-structura-source") ?? "";
  const suppliedIdempotencyKey =
    request.headers.get("x-structura-idempotency-key") ?? "";

  const secret = process.env.STRUCTURA_EMAIL_AUTH_SECRET ?? "";
  const maxClockSkewSeconds = Number(
    process.env.STRUCTURA_EMAIL_MAX_CLOCK_SKEW_SECONDS ?? "300",
  );

  const authenticated =
    suppliedSource === "AtraVigilV3" &&
    Number.isFinite(maxClockSkewSeconds) &&
    verifyHmac({
      secret,
      timestamp,
      rawBody,
      suppliedSignature,
      maxClockSkewSeconds,
    });

  if (!authenticated) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json(
      {
        ok: false,
        error: "invalid_request",
        validation_errors: ["request body must contain valid JSON"],
      },
      400,
    );
  }

  const preflight = evaluateDeliveryPreflight({
    payloadMode: payload?.mode,
    configuredMode: process.env.STRUCTURA_EMAIL_MODE,
    enabled: process.env.STRUCTURA_EMAIL_ENABLED,
    suppliedIdempotencyKey,
    snapshotId: payload?.snapshot_id,
  });

  if (preflight) {
    return json(preflight.body, preflight.status);
  }

  const validationErrors = validateStructuraPayload(payload);
  if (validationErrors.length > 0) {
    return json(
      {
        ok: false,
        error: "invalid_request",
        validation_errors: validationErrors,
      },
      400,
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.STRUCTURA_EMAIL_FROM;
  const to = process.env.STRUCTURA_EMAIL_TO;
  const replyTo = process.env.STRUCTURA_EMAIL_REPLY_TO;
  const recipients = parseRecipientList(to);

  if (!apiKey || !from || recipients.length === 0 || !replyTo) {
    return json(
      {
        ok: false,
        error: "server_configuration_error",
      },
      500,
    );
  }

  const { text, html } = renderEmail(payload);
  const resend = new Resend(apiKey);

  try {
    const { data, error } = await resend.emails.send(
      {
        from,
        to: recipients,
        replyTo,
        subject: payload.subject,
        text,
        html,
      },
      {
        idempotencyKey: idempotencyKey(payload.snapshot_id),
      },
    );

    if (error || !data?.id) {
      return json(
        {
          ok: false,
          error: "provider_failure",
          snapshot_id: payload.snapshot_id,
          retryable: true,
        },
        502,
      );
    }

    return json(
      {
        ok: true,
        accepted: true,
        duplicate: false,
        delivery_status: "sent",
        snapshot_id: payload.snapshot_id,
        provider_message_id: data.id,
        accepted_at: new Date().toISOString(),
      },
      202,
    );
  } catch {
    return json(
      {
        ok: false,
        error: "provider_failure",
        snapshot_id: payload.snapshot_id,
        retryable: true,
      },
      502,
    );
  }
}

export function GET() {
  return json({ ok: false, error: "method_not_allowed" }, 405);
}

export function PUT() {
  return json({ ok: false, error: "method_not_allowed" }, 405);
}

export function PATCH() {
  return json({ ok: false, error: "method_not_allowed" }, 405);
}

export function DELETE() {
  return json({ ok: false, error: "method_not_allowed" }, 405);
}
