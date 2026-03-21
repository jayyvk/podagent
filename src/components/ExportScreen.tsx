"use client";

import { useEffect, useRef, useState } from "react";
import type { TranscriptMessage } from "@/lib/types";

type ExportScreenProps = {
  topic: string;
  transcript: TranscriptMessage[];
  duration: number;
  conversationId: string | null;
  onRestart: () => void;
};

const socialPlatforms = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/",
  },
  {
    name: "TikTok",
    href: "https://www.tiktok.com/",
  },
  {
    name: "X",
    href: "https://x.com/",
  },
  {
    name: "YouTube",
    href: "https://www.youtube.com/",
  },
];

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");

  return `${minutes}:${remainingSeconds}`;
}

export function ExportScreen({
  topic,
  transcript,
  duration,
  conversationId,
  onRestart
}: ExportScreenProps) {
  const [editableTitle, setEditableTitle] = useState(topic);
  const [audioUrl, setAudioUrl] = useState("");
  const [audioLoadingState, setAudioLoadingState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [isRenderingVideo, setIsRenderingVideo] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setEditableTitle(topic);
  }, [topic]);

  useEffect(() => {
    if (!conversationId) {
      setAudioUrl("");
      setAudioLoadingState("idle");
      return;
    }

    let isCancelled = false;
    let currentUrl = "";

    const loadAudio = async () => {
      setAudioLoadingState("loading");

      try {
        const response = await fetch(`/api/conversations/${conversationId}/audio`);

        if (!response.ok) {
          throw new Error("Audio fetch failed");
        }

        const blob = await response.blob();
        if (isCancelled || blob.size === 0) {
          return;
        }

        currentUrl = URL.createObjectURL(blob);
        setAudioUrl(currentUrl);
        setAudioLoadingState("ready");
      } catch {
        if (!isCancelled) {
          setAudioUrl("");
          setAudioLoadingState("error");
        }
      }
    };

    void loadAudio();

    return () => {
      isCancelled = true;
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [conversationId]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioUrl]);

  const handleDownloadVideo = async () => {
    if (!conversationId) {
      return;
    }

    setIsRenderingVideo(true);

    try {
      const response = await fetch(`/api/conversations/${conversationId}/video`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: editableTitle }),
      });

      if (!response.ok) {
        throw new Error("Video render failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${editableTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "episode"}.mp4`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsRenderingVideo(false);
    }
  };

  const handleTogglePlayback = () => {
    const audio = audioRef.current;

    if (!audio || !audioUrl) {
      return;
    }

    if (audio.paused) {
      void audio.play();
    } else {
      audio.pause();
    }
  };

  const handleSeek = (deltaSeconds: number) => {
    const audio = audioRef.current;

    if (!audio || !audioUrl) {
      return;
    }

    audio.currentTime = Math.max(0, Math.min(audio.duration || 0, audio.currentTime + deltaSeconds));
  };

  const statusText =
    audioLoadingState === "loading"
      ? "Preparing full conversation audio..."
      : audioLoadingState === "error"
        ? "Audio could not be loaded for this session."
        : audioUrl
          ? "Full conversation audio ready"
          : "Waiting for audio";

  return (
    <section className="screen-card export-card clean-export-card">
      <div className="card-topline">
        <p className="section-label">Export</p>
        <div />
      </div>

      <div className="clean-export-layout">
        <div className="clean-thumbnail">
          <video
            aria-hidden="true"
            autoPlay
            className="clean-thumbnail-video"
            loop
            muted
            playsInline
            src="/thumbnails/podcast-cover.mp4"
          />
          <div className="clean-thumbnail-overlay" />
          <button
            aria-label="Back 15 seconds"
            className="thumbnail-zone thumbnail-zone-left"
            disabled={!audioUrl}
            onClick={() => handleSeek(-15)}
            type="button"
          >
            15
          </button>
          <button
            aria-label={isPlaying ? "Pause playback" : "Play playback"}
            className="thumbnail-zone thumbnail-zone-center"
            disabled={!audioUrl}
            onClick={handleTogglePlayback}
            type="button"
          >
            <div className="clean-thumbnail-mark">{isPlaying ? "II" : "▶"}</div>
          </button>
          <button
            aria-label="Forward 15 seconds"
            className="thumbnail-zone thumbnail-zone-right"
            disabled={!audioUrl}
            onClick={() => handleSeek(15)}
            type="button"
          >
            15
          </button>
          <div className="clean-thumbnail-copy">
            <p className="clean-thumbnail-title">{editableTitle}</p>
            <p className="clean-thumbnail-brand">PodAgent</p>
          </div>
        </div>

        <div className="clean-export-content">
          <div>
            <label className="minor-label" htmlFor="export-title">
              Episode title
            </label>
            <input
              className="title-input"
              id="export-title"
              onChange={(event) => setEditableTitle(event.target.value)}
              type="text"
              value={editableTitle}
            />
            <p className="section-copy">
              {formatTime(duration)} • 2 speakers
            </p>
          </div>

          <div className="audio-shell">
            <p className="minor-label">Playback</p>
            <p className="audio-status">{statusText}</p>
            {audioUrl ? <audio className="sr-only-audio" ref={audioRef} src={audioUrl} /> : null}
          </div>

          <div className="clean-action-row">
            <button
              className="primary-button"
              disabled={!audioUrl || isRenderingVideo}
              onClick={() => void handleDownloadVideo()}
              type="button"
            >
              {isRenderingVideo ? "Rendering MP4..." : "Download MP4"}
            </button>
          </div>

          <div className="clean-share-block">
            <p className="minor-label">Share</p>
            <div className="chip-row clean-share-row">
              {socialPlatforms.map((platform) => (
                <a
                  className="secondary-chip share-link"
                  href={platform.href}
                  key={platform.name}
                  rel="noreferrer"
                  target="_blank"
                >
                  {platform.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="transcript-preview">
        <p className="minor-label">Transcript preview</p>
        <div className="transcript-preview-list">
          {transcript.map((message) => (
            <p key={message.id}>
              <strong>{message.role === "host" ? "Host" : "Guest"}:</strong> {message.text}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
