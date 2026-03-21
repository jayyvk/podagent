"use client";

import { useEffect, useRef, useState } from "react";
import { useConversation } from "@elevenlabs/react";
import type { ClipBookmark, TranscriptMessage } from "@/lib/types";

type LiveSessionProps = {
  topic: string;
  transcript: TranscriptMessage[];
  clips: ClipBookmark[];
  duration: number;
  isMuted: boolean;
  isPaused: boolean;
  onToggleMute: () => void;
  onTogglePause: () => void;
  onStop: (conversationId: string | null) => void;
  onTranscriptMessage: (message: TranscriptMessage) => void;
  onClipCreated: (label: string) => void;
  onSearchEvent: () => void;
};

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");

  return `${minutes}:${remainingSeconds}`;
}

export function LiveSession({
  topic,
  transcript,
  clips,
  duration,
  isMuted,
  isPaused,
  onToggleMute,
  onTogglePause,
  onStop,
  onTranscriptMessage,
  onClipCreated,
  onSearchEvent
}: LiveSessionProps) {
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isStopping, setIsStopping] = useState(false);
  const [searchNotice, setSearchNotice] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const hasStartedSessionRef = useRef(false);
  const hasEndedSessionRef = useRef(false);
  const seenSearchToolCallsRef = useRef(new Set<string>());

  const conversation = useConversation({
    micMuted: isMuted,
    clientTools: {
      sound_effect: async ({ description }: { description: string }) => {
        const response = await fetch("/api/sfx", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description })
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audio.play().catch(() => undefined);
          audio.addEventListener("ended", () => URL.revokeObjectURL(url), { once: true });
        }

        return "Sound effect played";
      },
      create_clip: async ({ label }: { label: string }) => {
        onClipCreated(label);
        return `Clip "${label}" bookmarked`;
      }
    },
    onMessage: ({ message, source, role }) => {
      const trimmedMessage = message.trim();

      if (!trimmedMessage) {
        return;
      }

      setSearchNotice(null);

      onTranscriptMessage({
        id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        role: (role ?? (source === "user" ? "user" : "agent")) === "user" ? "host" : "agent",
        label: source === "user" ? "You (host)" : "AI guest",
        text: trimmedMessage
      });
    },
    onAgentToolRequest: ({ tool_name, tool_call_id }) => {
      if (tool_name !== "search_web") {
        return;
      }

      if (tool_call_id && seenSearchToolCallsRef.current.has(tool_call_id)) {
        return;
      }

      if (tool_call_id) {
        seenSearchToolCallsRef.current.add(tool_call_id);
      }

      onSearchEvent();
      setSearchNotice("AI guest is searching the live web...");
    },
    onAgentToolResponse: ({ tool_name, is_called, is_error, tool_call_id }) => {
      if (tool_name !== "search_web" || is_error || !is_called) {
        return;
      }

      if (tool_call_id && seenSearchToolCallsRef.current.has(tool_call_id)) {
        return;
      }

      if (tool_call_id) {
        seenSearchToolCallsRef.current.add(tool_call_id);
      }

      onSearchEvent();
      setSearchNotice("AI guest searched the live web.");
    },
    onError: (message) => {
      setConnectionError(message);
    },
    onConnect: () => {
      setConnectionError(null);
      conversation.sendContextualUpdate(
        `Podcast topic: "${topic}". Use the search_web tool before answering host questions. Keep answers conversational, concise, and naturally source-backed.`
      );
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript, searchNotice]);

  useEffect(() => {
    let isMounted = true;

    const startConversation = async () => {
      if (hasStartedSessionRef.current) {
        return;
      }

      const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

      if (!agentId) {
        setConnectionError("Missing NEXT_PUBLIC_ELEVENLABS_AGENT_ID.");
        return;
      }

      try {
        hasStartedSessionRef.current = true;
        hasEndedSessionRef.current = false;

        await conversation.startSession({
          agentId,
          connectionType: "websocket"
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setConnectionError(error instanceof Error ? error.message : "Failed to connect to the agent.");
      }
    };

    void startConversation();

    return () => {
      isMounted = false;

      if (!hasStartedSessionRef.current || hasEndedSessionRef.current) {
        return;
      }

      hasEndedSessionRef.current = true;
      void conversation.endSession();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic]);

  const handleStop = async () => {
    if (hasEndedSessionRef.current) {
      onStop(conversation.getId() ?? null);
      return;
    }

    setIsStopping(true);
    hasEndedSessionRef.current = true;

    try {
      const endedConversationId = conversation.getId() ?? null;
      await conversation.endSession();
      onStop(endedConversationId);
    } finally {
      setIsStopping(false);
    }
  };

  const statusLabel = isPaused ? "paused" : conversation.status;

  return (
    <section className="screen-card live-card">
      <div className="card-topline">
        <div className="live-heading-row">
          <p className="live-topic">{topic}</p>
          <p className="session-timer">Recording {formatTime(duration)}</p>
        </div>
        <div className={`live-status ${statusLabel !== "connected" ? "paused" : ""}`}>
          <span className="live-dot" />
          {statusLabel === "connected" ? "LIVE" : statusLabel}
        </div>
      </div>

      {connectionError ? <div className="status-banner error">{connectionError}</div> : null}
      {!connectionError && conversation.status === "connecting" ? (
        <div className="status-banner">Connecting to ElevenLabs agent...</div>
      ) : null}
      {searchNotice ? <div className="status-banner info">{searchNotice}</div> : null}

      <div className="transcript-panel">
        {transcript.length === 0 ? (
          <div className="empty-state">
            <p>The host speaks first.</p>
            <p>Ask your first question and the AI guest will answer after searching the web.</p>
          </div>
        ) : null}

        {transcript.map((message) => (
          <article className="transcript-row" key={message.id}>
            <div className="transcript-copy">
              <p className="speaker-label">{message.role === "host" ? "You" : "Guest"}</p>
              <p>{message.text}</p>
            </div>
          </article>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="waveform-row" aria-hidden="true">
        {Array.from({ length: 42 }, (_, index) => {
          const active = !isPaused && conversation.isSpeaking && index > 8 && index < 30;
          const height = active ? 16 + ((index * 7) % 26) : 6 + ((index * 5) % 8);

          return (
            <span
              className={active ? "active" : ""}
              key={index}
              style={{ height: `${height}px` }}
            />
          );
        })}
      </div>

      <div className="session-meta-row">
        <span>{conversation.isSpeaking ? "Agent speaking" : "Agent listening"}</span>
        <span>{searchNotice ? "Search active" : "Listening..."}</span>
      </div>

      <div className="control-row">
        <button
          aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
          className={`icon-button ${isMuted ? "danger-outline" : ""}`}
          onClick={onToggleMute}
          title={isMuted ? "Unmute microphone" : "Mute microphone"}
          type="button"
        >
          {isMuted ? (
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M4 4L20 20" />
              <path d="M9 9V5a3 3 0 1 1 6 0v7" />
              <path d="M5 11v1a7 7 0 0 0 11.2 5.6" />
              <path d="M19 11v1a6.97 6.97 0 0 1-1.11 3.78" />
              <path d="M12 19v3" />
            </svg>
          ) : (
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <rect x="9" y="2" width="6" height="11" rx="3" />
              <path d="M5 10v2a7 7 0 0 0 14 0v-2" />
              <path d="M12 19v3" />
            </svg>
          )}
        </button>
        <button
          aria-label={isPaused ? "Resume session" : "Pause session"}
          className="icon-button"
          onClick={onTogglePause}
          title={isPaused ? "Resume session" : "Pause session"}
          type="button"
        >
          {isPaused ? (
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M8 5L19 12L8 19Z" fill="currentColor" stroke="none" />
            </svg>
          ) : (
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <rect x="7" y="5" width="3.5" height="14" rx="1" fill="currentColor" stroke="none" />
              <rect x="13.5" y="5" width="3.5" height="14" rx="1" fill="currentColor" stroke="none" />
            </svg>
          )}
        </button>
        <button
          aria-label="Stop session"
          className="record-stop-button"
          disabled={isStopping}
          onClick={() => void handleStop()}
          title="Stop session"
          type="button"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" stroke="none" />
          </svg>
        </button>
      </div>
    </section>
  );
}
