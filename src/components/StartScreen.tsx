"use client";

import type { GuestPersona } from "@/lib/types";

type StartScreenProps = {
  topic: string;
  onTopicChange: (value: string) => void;
  guests: GuestPersona[];
  selectedGuestId: string;
  onSelectGuest: (guestId: string) => void;
  onStart: () => void;
};

const trendingTopics = [
  "AI agents replacing SaaS",
  "The AI bubble debate",
  "Tariffs and startup margins",
  "Why podcasts are becoming interactive"
];

export function StartScreen({
  topic,
  onTopicChange,
  guests,
  selectedGuestId,
  onSelectGuest,
  onStart
}: StartScreenProps) {
  return (
    <section className="start-card">
      <h1>What do you want to podcast about?</h1>
      <p className="section-copy">
        You host. AI guest researches the web live.
      </p>

      <div className="hero-input-row">
        <input
          aria-label="Episode topic"
          onChange={(event) => onTopicChange(event.target.value)}
          placeholder="e.g. AI bubble, tariffs, SpaceX, TikTok ban..."
          type="text"
          value={topic}
        />
        <button className="primary-button" onClick={onStart} type="button">
          Start recording
        </button>
      </div>

      <div className="chip-row">
        {trendingTopics.map((suggestion) => (
          <button
            className="chip-button"
            key={suggestion}
            onClick={() => onTopicChange(suggestion)}
            type="button"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <div className="guest-picker">
        <p className="minor-label">Choose your guest</p>
        <div className="guest-grid">
          {guests.map((guest) => {
            const isSelected = guest.id === selectedGuestId;

            return (
              <button
                className={`guest-card ${isSelected ? "selected" : ""}`}
                key={guest.id}
                onClick={() => onSelectGuest(guest.id)}
                type="button"
              >
                <img alt={guest.name} className="guest-photo" src={guest.photoUrl} />
                <div className="guest-copy">
                  <p className="guest-name">{guest.name}</p>
                  <p className="guest-title">{guest.description}</p>
                  <p className="guest-voice">{guest.voiceLabel}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
