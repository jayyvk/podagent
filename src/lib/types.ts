export type AppScreen = "start" | "live" | "export";

export type GuestPersona = {
  id: string;
  name: string;
  description: string;
  voiceLabel: string;
  agentId: string;
  photoUrl: string;
};

export type TranscriptMessage = {
  id: string;
  role: "host" | "agent";
  label: string;
  text: string;
};

export type ClipBookmark = {
  id: string;
  label: string;
};
