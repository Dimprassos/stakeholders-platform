import type { NextRequest } from "next/server";
import { ingestInboundEmail, type InboundEmailInput } from "@/lib/communication";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function value(...values: unknown[]): string | null {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

async function parsePayload(req: NextRequest): Promise<InboundEmailInput | null> {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await req.json()) as Record<string, unknown>;
    return {
      from: value(body.from, body.sender, body.email, body.From) ?? "",
      to: value(body.to, body.recipient, body.To),
      subject: value(body.subject, body.Subject),
      text: value(
        body.text,
        body["body-plain"],
        body["stripped-text"],
        body.plain,
        body.body,
      ),
      html: value(body.html, body["body-html"]),
      receivedAt: value(body.receivedAt, body.timestamp, body.date),
      eventSlug: value(body.eventSlug, body.event, body.event_slug),
      sponsorId: value(body.sponsorId, body.sponsor_id),
    };
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const form = await req.formData();
    return {
      from: value(form.get("from"), form.get("sender"), form.get("email")) ?? "",
      to: value(form.get("to"), form.get("recipient")),
      subject: value(form.get("subject")),
      text: value(
        form.get("text"),
        form.get("body-plain"),
        form.get("stripped-text"),
        form.get("plain"),
        form.get("body"),
      ),
      html: value(form.get("html"), form.get("body-html")),
      receivedAt: value(form.get("receivedAt"), form.get("timestamp"), form.get("date")),
      eventSlug: value(form.get("eventSlug"), form.get("event"), form.get("event_slug")),
      sponsorId: value(form.get("sponsorId"), form.get("sponsor_id")),
    };
  }

  return null;
}

function authorized(req: NextRequest): boolean {
  const configured = process.env.INBOUND_EMAIL_WEBHOOK_SECRET;
  if (!configured) return process.env.NODE_ENV !== "production";
  const provided =
    req.headers.get("x-inbound-secret") ??
    req.headers.get("x-webhook-secret") ??
    req.nextUrl.searchParams.get("secret");
  return provided === configured;
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const payload = await parsePayload(req);
  if (!payload) {
    return Response.json(
      { ok: false, error: "Unsupported content type." },
      { status: 415 },
    );
  }

  const result = await ingestInboundEmail(payload);
  if (!result.ok) {
    return Response.json(result, { status: result.status });
  }

  return Response.json(result);
}
