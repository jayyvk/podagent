import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PodAgent",
  description: "Host a real-time podcast with an AI guest that searches the web before it speaks."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
