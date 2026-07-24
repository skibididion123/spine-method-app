# Spine Method

Session coach for the Spine Method protocol: cyclic full-body hanging with timed hang/rest phases and a 5-second metronome.

## Run

```bash
npm install
npm run dev
```

Open the local URL Vite prints (usually `http://localhost:5173`).

## Features

- **Progression presets** from the protocol (weeks 1–2 through 7–8)
- **Custom** hang / rest / cycle counts
- **Guided session**: 5s prep → hang → rest, auto-advancing
- **Metronome**: beep every 5s during hang and rest
- **Phase cues**: distinct sounds for hang, rest, and session end
- **History**: last sessions stored on this device (`localStorage`)

## Stack

Vite + React + TypeScript. No backend. Audio via Web Audio API.
