import { NextRequest, NextResponse } from "next/server";
import { getConversationSearchCount } from "@/lib/conversation-store";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await context.params;

  if (!conversationId) {
    return NextResponse.json({ error: "Conversation ID is required" }, { status: 400 });
  }

  return NextResponse.json({
    conversationId,
    searchCount: getConversationSearchCount(conversationId),
  });
}
