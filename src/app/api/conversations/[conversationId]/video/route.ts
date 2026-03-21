import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { NextRequest, NextResponse } from "next/server";

type ConversationDetails = {
  has_audio?: boolean;
  has_user_audio?: boolean;
  has_response_audio?: boolean;
};

const TITLE_FONT_PATH = "/System/Library/Fonts/Supplemental/Arial Bold.ttf";

function escapeDrawtext(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/,/g, "\\,");
}

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
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  return false;
}

async function fetchConversationAudio(conversationId: string) {
  const ready = await waitForAudio(conversationId);

  if (!ready) {
    throw new Error("Conversation audio is not ready yet");
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}/audio`,
    {
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY!,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch conversation audio");
  }

  return Buffer.from(await response.arrayBuffer());
}

function runFfmpeg(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const binaryName = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
    const localFfmpegPath = path.join(process.cwd(), "node_modules", "ffmpeg-static", binaryName);

    if (!localFfmpegPath) {
      reject(new Error("FFmpeg binary is unavailable"));
      return;
    }

    const ffmpeg = spawn(localFfmpegPath, args);
    let stderr = "";

    ffmpeg.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(stderr || `FFmpeg exited with code ${code}`));
    });
  });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ conversationId: string }> }
) {
  if (!process.env.ELEVENLABS_API_KEY) {
    return NextResponse.json({ error: "ElevenLabs API key is not configured" }, { status: 500 });
  }

  const { conversationId } = await context.params;

  if (!conversationId) {
    return NextResponse.json({ error: "Conversation ID is required" }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as { title?: string };
  const title = (body.title || "episode").trim() || "episode";
  const safeSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "episode";

  const renderId = randomUUID();
  const tempDir = path.join("/tmp", `podagent-${renderId}`);
  const thumbnailPath = path.join(process.cwd(), "public", "thumbnails", "podcast-cover.mp4");
  const audioPath = path.join(tempDir, "audio.mp3");
  const outputPath = path.join(tempDir, "output.mp4");

  try {
    await fs.mkdir(tempDir, { recursive: true });
    const audioBuffer = await fetchConversationAudio(conversationId);
    await fs.writeFile(audioPath, audioBuffer);

    const drawtextFilter = [
      `drawtext=fontfile='${TITLE_FONT_PATH}':text='${escapeDrawtext(title)}'`,
      "fontcolor=white",
      "fontsize=68",
      "line_spacing=8",
      "x=(w-text_w)/2",
      "y=140",
      "shadowcolor=black@0.45",
      "shadowx=0",
      "shadowy=4",
    ].join(":");

    await runFfmpeg([
      "-y",
      "-stream_loop",
      "-1",
      "-i",
      thumbnailPath,
      "-i",
      audioPath,
      "-map",
      "0:v:0",
      "-map",
      "1:a:0",
      "-vf",
      drawtextFilter,
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-shortest",
      outputPath,
    ]);

    const videoBuffer = await fs.readFile(outputPath);

    return new NextResponse(videoBuffer, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="${safeSlug}.mp4"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Video render failed";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
  }
}
