# PodAgent

PodAgent is a voice-first podcast playground built for **Hack #1: Firecrawl x ElevenAgents**.

The idea is simple: you are the host, an ElevenLabs voice agent is your guest, and Firecrawl gives that guest live web context during the conversation. Instead of a chatbot or search box, the product feels like recording a short podcast with an AI co-host that can look things up in real time and then turn the session into something playable and exportable.


https://github.com/user-attachments/assets/85ab50c1-8798-4a9d-aee9-9ee5f754a0f1


## What it does

PodAgent is a 3-step flow:

1. Start with a topic
2. Talk to an ElevenLabs voice agent live
3. End the session and review/export the conversation

During the live session:

- the user speaks first
- the ElevenLabs agent responds in voice
- Firecrawl powers live search through a webhook tool
- the transcript updates in real time

On the export screen:

- the full conversation audio is fetched back from ElevenLabs
- the session can be played back immediately
- a vertical cover video is shown as the visual layer
- the final MP4 is rendered by combining the cover video with the conversation audio

## Why we built it

Most voice agents are built like assistants. We wanted to explore a different interface: a **podcast format**.

That makes the interaction feel more natural for:

- interviews
- debates
- commentary
- explainers
- creator workflows

The key product idea is that the AI guest should not just sound good. It should also be able to **research before it speaks**.

That is where the Firecrawl + ElevenLabs combination becomes interesting.

## How it works

### Live conversation

The app uses the ElevenLabs React SDK to start a live voice session with an existing ElevenLabs agent.

We use:

- `useConversation` for the real-time conversation loop
- client tools for lightweight actions like clip bookmarks and sound effects
- contextual updates so the topic can shape the session without relying on unsupported prompt overrides

### Live web search

The ElevenLabs agent is configured with a `search_web` tool that points to our backend webhook.

That webhook:

- receives the search query from the agent
- calls Firecrawl Search
- returns structured live web results back to the agent

This gives the conversation a clear rhythm:

- host asks
- agent searches
- agent answers

### Export flow

When the conversation ends, the app stores the ElevenLabs conversation ID.

From there:

- the export screen fetches the full conversation audio from ElevenLabs
- playback works directly inside the app
- an MP4 export route uses FFmpeg to merge:
  - the uploaded thumbnail/cover video
  - the ElevenLabs conversation audio
  - the title overlay rendered into the video

## Tech stack

- **Next.js 15**
- **React 19**
- **TypeScript**
- **ElevenLabs React SDK / ElevenAgents**
- **Firecrawl Search API**
- **FFmpeg** via `ffmpeg-static`

## Design direction

The UI is intentionally minimal and tool-like.

We pushed it toward a clean white workspace aesthetic:

- flat surfaces
- low chrome
- grayscale UI
- red only for live/recording actions

The goal was to make the conversation and export flow feel like a working product, not a marketing landing page.

## What we shipped

- topic-based session start
- live ElevenLabs voice conversation
- Firecrawl search integration through an agent tool webhook
- real-time transcript updates
- export screen with interactive playback
- custom vertical cover video support
- MP4 generation from cover video + conversation audio

## Why this is interesting

PodAgent treats voice AI as a **media format**, not just an assistant.

Instead of asking a question and getting an answer, the user gets a conversation they can listen back to, package, and eventually share.

That is the core experiment behind the project:

**What happens when live web research and conversational voice agents become a podcast workflow?**
