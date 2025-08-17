
# ScubaCoder

A privacy-first, local-only coding assistant for VS Code. It can talk to a local model via **Ollama** or **vLLM**. No code leaves your machine by default.

## Features (scaffold)
- Inline code completions (skeleton)
- Chat webview (skeleton)
- Consent panel to pick context (skeleton)
- Policy engine with deny-globs and basic redaction hooks
- Local-only network guard

## Install
Install from VS Code Marketplace <link>

## Developer Quick Start
1. Ensure Node 18+ and VS Code 1.88+.
2. Ensure **Ollama** (`http://127.0.0.1:11434`) or **vLLM** (`http://127.0.0.1:8000`) is running locally.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Build and debug:
   ```bash
   npm run watch
   ```
   In VS Code, press **F5** (Launch Extension).
5. In the Extension Host:
   - Run **ScubaCoder: Open Chat** to open the chat panel.
   - Run **ScubaCoder: Open Consent Panel** to select context files.

## Configuration
See **Settings > ScubaCoder** for provider, model id, deny globs, and network guard.

## Notes
This is a scaffold. The provider clients (Ollama/vLLM) implement basic non-streaming generation as examples. Add streaming and richer prompts as you develop.
