"use client";

type StartScreenProps = {
  topic: string;
  onTopicChange: (value: string) => void;
  onStart: () => void;
};

const trendingTopics = [
  "AI agents replacing SaaS",
  "The AI bubble debate",
  "Tariffs and startup margins",
  "Why podcasts are becoming interactive"
];

export function StartScreen({ topic, onTopicChange, onStart }: StartScreenProps) {
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
    </section>
  );
}
