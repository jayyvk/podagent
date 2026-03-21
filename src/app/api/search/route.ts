import { NextRequest, NextResponse } from "next/server";
import { incrementConversationSearchCount } from "@/lib/conversation-store";

type FirecrawlItem = {
  title?: string;
  url?: string;
  markdown?: string;
  description?: string;
};

type FirecrawlResponse =
  | {
      data?: {
        web?: FirecrawlItem[];
      };
    }
  | {
      data?: FirecrawlItem[];
    };

function findConversationId(value: unknown): string | null {
  if (typeof value === "string" && value.startsWith("conv_")) {
    return value;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findConversationId(item);
      if (found) {
        return found;
      }
    }
    return null;
  }

  if (value && typeof value === "object") {
    for (const item of Object.values(value)) {
      const found = findConversationId(item);
      if (found) {
        return found;
      }
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const query = typeof body.query === "string" ? body.query.trim() : "";
  const conversationId = findConversationId(body);

  if (!query) {
    return NextResponse.json({ result: "No query provided" });
  }

  if (!process.env.FIRECRAWL_API_KEY) {
    return NextResponse.json({ result: "Search is not configured on the server." }, { status: 500 });
  }

  try {
    const response = await fetch("https://api.firecrawl.dev/v2/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query,
        limit: 5,
        scrapeOptions: { formats: ["markdown"] }
      })
    });

    if (!response.ok) {
      return NextResponse.json({
        result: "Search failed. Answering from existing knowledge."
      });
    }

    const data = (await response.json()) as FirecrawlResponse;
    const rawResults = Array.isArray(data.data) ? data.data : (data.data?.web ?? []);
    const results = rawResults.slice(0, 3).map((item) => ({
      title: item.title || "Untitled",
      url: item.url || "",
      content: (item.markdown || item.description || "").slice(0, 1500)
    }));

    if (conversationId) {
      incrementConversationSearchCount(conversationId);
    }

    return NextResponse.json({
      result: JSON.stringify({
        query,
        sources_found: results.length,
        results
      })
    });
  } catch {
    return NextResponse.json({
      result: "Search error. Answering from existing knowledge."
    });
  }
}
