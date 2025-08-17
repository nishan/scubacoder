
import { GenRequest, GenResult, ChatRequest, ChatResult } from '../types';

/**
 * LLMProvider: unified interface for local providers.
 * - generateText/chat return full results.
 * - generateTextStream/chatStream yield text deltas progressively.
 */
export interface LLMProvider {
  id: string;
  capabilities: { chat: boolean; tools: boolean; json: boolean; embed: boolean };
  generateText(req: GenRequest): Promise<GenResult>;
  chat(req: ChatRequest): Promise<ChatResult>;

  // Streaming APIs
  generateTextStream(req: GenRequest): AsyncIterable<string>;
  chatStream(req: ChatRequest): AsyncIterable<string>;
}
