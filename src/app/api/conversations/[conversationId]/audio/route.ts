import { NextRequest, NextResponse } from "next/server";

type ConversationDetails = {
  status?: string;
  has_audio?: boolean;
  has_user_audio?: boolean;
  has_response_audio?: boolean;
};

async function fetchConversationDetails(conversationId: string) {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`,
    {
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY!,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch conversation details");
  }

  return (await response.json()) as ConversationDetails;
}

async function waitForAudio(conversationId: string) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const details = await fetchConversationDetails(conversationId);

    if (details.has_audio || details.has_user_audio || details.has_response_audio) {
      return details;
    }

    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  return null;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ conversationId: string }> }
) {
  if (!process.env.ELEVENLABS_API_KEY) {
    return NextResponse.json({ error: "ElevenLabs API key is not configured" }, { status: 500 });
  }

  const { conversationId } = await context.params;

  if (!conversationId) {
    return NextResponse.json({ error: "Conversation ID is required" }, { status: 400 });
  }

  try {
    const details = await waitForAudio(conversationId);

    if (!details) {
      return NextResponse.json(
        { error: "Conversation audio is not ready yet" },
        { status: 409 }
      );
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}/audio`,
      {
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch conversation audio" },
        { status: response.status }
      );
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") ?? "audio/mpeg";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
      },
    });
  } catch {
    return NextResponse.json({ error: "Conversation audio fetch failed" }, { status: 500 });
  }
}
