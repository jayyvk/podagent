import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { description } = (await request.json()) as { description?: string };

  if (!description?.trim()) {
    return NextResponse.json({ error: "Description is required" }, { status: 400 });
  }

  if (!process.env.ELEVENLABS_API_KEY) {
    return NextResponse.json({ error: "ElevenLabs API key is not configured" }, { status: 500 });
  }

  const response = await fetch("https://api.elevenlabs.io/v1/sound-generation", {
    method: "POST",
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      text: description,
      duration_seconds: 3
    })
  });

  if (!response.ok) {
    return NextResponse.json({ error: "SFX generation failed" }, { status: 500 });
  }

  const buffer = await response.arrayBuffer();

  return new NextResponse(buffer, {
    headers: { "Content-Type": "audio/mpeg" }
  });
}
