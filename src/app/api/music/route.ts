import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { prompt } = (await request.json()) as { prompt?: string };

  if (!prompt?.trim()) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  if (!process.env.ELEVENLABS_API_KEY) {
    return NextResponse.json({ error: "ElevenLabs API key is not configured" }, { status: 500 });
  }

  const response = await fetch("https://api.elevenlabs.io/v1/music", {
    method: "POST",
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt,
      duration_seconds: 15
    })
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Music generation failed" }, { status: 500 });
  }

  const buffer = await response.arrayBuffer();

  return new NextResponse(buffer, {
    headers: { "Content-Type": "audio/mpeg" }
  });
}
