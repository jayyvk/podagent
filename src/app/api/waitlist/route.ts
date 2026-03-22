import { NextRequest, NextResponse } from "next/server";

type WaitlistPayload = {
  email?: string;
  source?: string;
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as WaitlistPayload;
  const email = body.email?.trim().toLowerCase() ?? "";
  const source = body.source?.trim() || "unknown";

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

  if (!webhookUrl) {
    return NextResponse.json({ error: "Waitlist webhook is not configured" }, { status: 500 });
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        source,
        createdAt: new Date().toISOString()
      }),
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Webhook request failed");
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to save email" }, { status: 500 });
  }
}
