# Falcon AI

Falcon AI is a responsive React demo for real-time scam-call detection. It analyzes scripted call content rather than caller identity and demonstrates low-latency warnings, manipulation-tactic detection, false-positive handling, and privacy controls.

## Run locally

```bash
pnpm install
pnpm dev
```

In Figma Make, the development server is already running and source changes hot reload automatically.

## Authentication

Authentication uses the connected Supabase project through `src/lib/supabase.ts` and the typed functions in `src/lib/auth.ts`. Protected routes require a current Supabase session. Email/password sign-up, login, logout, session restoration, and password reset are wired.

## Backend

The Supabase Edge Function in `supabase/functions/server/index.tsx` provides authenticated endpoints for profiles, trusted contacts, consent-based analysis summaries, family-alert records, and privacy deletion. Every account request validates the caller's JWT and scopes its KV record to the authenticated Supabase user ID.

After backend changes, deploy the `server` Edge Function again from the **Make settings page**. The frontend expects the route prefix `/make-server-409a16ab`.

## Call analysis

Uploaded audio uses the authenticated Supabase Edge Function and the `GROQ_API_KEY` secret. Groq Whisper transcribes the call and a Groq-hosted language model performs semantic risk classification. Raw audio is forwarded for transcription and is not written to Supabase storage. Live microphone mode uses the browser Speech Recognition API and an immediate local combination-based risk engine so warnings can appear while the user is still speaking.

The “Play demo” control remains a clearly labelled simulation for demonstrations. Its scripted data lives in `src/data/demoCall.ts`.

Family alerts are currently securely queued as backend records. Connect an SMS, WhatsApp, or push provider inside the family-alert Edge Function route to deliver them externally; keep provider credentials in Supabase secrets.

## Production notes

- Audio should be processed in short 2–3 second chunks, on-device by default.
- Family alerts must never include audio.
- Persist risk labels or redacted snippets only after explicit opt-in.
