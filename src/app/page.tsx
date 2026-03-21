"use client";

import { useEffect, useState } from "react";
import { ExportScreen } from "@/components/ExportScreen";
import { LiveSession } from "@/components/LiveSession";
import { StartScreen } from "@/components/StartScreen";
import type { AppScreen, ClipBookmark, TranscriptMessage } from "@/lib/types";

export default function HomePage() {
  const [screen, setScreen] = useState<AppScreen>("start");
  const [topic, setTopic] = useState("The AI bubble debate");
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [clips, setClips] = useState<ClipBookmark[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [searchCount, setSearchCount] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (screen !== "live" || isPaused) {
      return;
    }

    const interval = window.setInterval(() => {
      setDuration((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [screen, isPaused]);

  const handleStart = () => {
    const trimmedTopic = topic.trim();

    if (!trimmedTopic) {
      return;
    }

    setTopic(trimmedTopic);
    setTranscript([]);
    setClips([]);
    setConversationId(null);
    setSearchCount(0);
    setDuration(0);
    setIsMuted(false);
    setIsPaused(false);
    setScreen("live");
  };

  const handleRestart = () => {
    setScreen("start");
    setTopic("");
    setTranscript([]);
    setClips([]);
    setConversationId(null);
    setSearchCount(0);
    setDuration(0);
    setIsMuted(false);
    setIsPaused(false);
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">●</div>
          <div>
            <p className="brand-name">PodAgent</p>
            <p className="brand-subtitle">AI podcast guest</p>
          </div>
        </div>

        <button className="secondary-button" onClick={handleRestart} type="button">
          New episode
        </button>
      </header>

      <div className="main-stage">
        {screen === "start" ? (
          <StartScreen onStart={handleStart} onTopicChange={setTopic} topic={topic} />
        ) : null}

        {screen === "live" ? (
          <LiveSession
            clips={clips}
            duration={duration}
            isMuted={isMuted}
            isPaused={isPaused}
            onClipCreated={(label) =>
              setClips((current) => [
                ...current,
                {
                  id: `clip-${current.length + 1}`,
                  label
                }
              ])
            }
            onSearchEvent={() => setSearchCount((current) => current + 1)}
            onStop={(endedConversationId) => {
              setConversationId(endedConversationId);
              setScreen("export");
            }}
            onToggleMute={() => setIsMuted((current) => !current)}
            onTogglePause={() => setIsPaused((current) => !current)}
            onTranscriptMessage={(message) =>
              setTranscript((current) => [...current, message])
            }
            topic={topic}
            transcript={transcript}
          />
        ) : null}

        {screen === "export" ? (
          <ExportScreen
            conversationId={conversationId}
            duration={duration}
            onRestart={handleRestart}
            topic={topic}
            transcript={transcript}
          />
        ) : null}
      </div>
    </main>
  );
}
