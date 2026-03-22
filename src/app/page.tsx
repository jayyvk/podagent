"use client";

import { useEffect, useState } from "react";
import { ExportScreen } from "@/components/ExportScreen";
import { LiveSession } from "@/components/LiveSession";
import { StartScreen } from "@/components/StartScreen";
import type { AppScreen, ClipBookmark, GuestPersona, TranscriptMessage } from "@/lib/types";

const guestPersonas: GuestPersona[] = [
  {
    id: "roger",
    name: "Roger",
    description: "Laid-back, casual",
    voiceLabel: "Default",
    agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID_ROGER ?? "",
    photoUrl: "/guests/maya-cross.svg",
  },
  {
    id: "brianna",
    name: "Brielle",
    description: "Gen Z guest",
    voiceLabel: "Youthful, bright",
    agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID_BRIELLE ?? "",
    photoUrl: "/guests/jules-hart.svg",
  },
  {
    id: "third-guest",
    name: "James",
    description: "British professional",
    voiceLabel: "Composed, polished",
    agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID_JAMES ?? "",
    photoUrl: "/guests/ava-cole.svg",
  },
];

export default function HomePage() {
  const [screen, setScreen] = useState<AppScreen>("start");
  const [topic, setTopic] = useState("The AI bubble debate");
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [clips, setClips] = useState<ClipBookmark[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedGuestId, setSelectedGuestId] = useState(guestPersonas[0]?.id ?? "");

  const selectedGuest =
    guestPersonas.find((guest) => guest.id === selectedGuestId) ?? guestPersonas[0];

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
          <StartScreen
            guests={guestPersonas}
            onSelectGuest={setSelectedGuestId}
            onStart={handleStart}
            onTopicChange={setTopic}
            selectedGuestId={selectedGuestId}
            topic={topic}
          />
        ) : null}

        {screen === "live" ? (
          <LiveSession
            clips={clips}
            duration={duration}
            guest={selectedGuest}
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
            onSearchEvent={() => undefined}
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
            guestName={selectedGuest.name}
            onRestart={handleRestart}
            topic={topic}
            transcript={transcript}
          />
        ) : null}
      </div>
    </main>
  );
}
