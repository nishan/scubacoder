
export interface GenRequest {
  prompt: string;
  maxTokens: number;
  temperature: number;
  system?: string;
}

export interface GenResult {
  text: string;
  tokens?: { prompt?: number; completion?: number };
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  maxTokens: number;
  temperature: number;
}

export interface ChatResult {
  text: string;
}

export interface ContextItem {
  uri: string;            // vscode.Uri.toString()
  label: string;          // file name or symbol
  preview?: string;       // optional snippet for consent preview
}
