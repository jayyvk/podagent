export type AppScreen = "start" | "live" | "export";

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
