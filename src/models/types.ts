
import { GenRequest, GenResult, ChatRequest, ChatResult } from '../types';

export interface LLMProvider {
  id: string;
  capabilities: { chat: boolean; tools: boolean; json: boolean; embed: boolean };
  generateText(req: GenRequest): Promise<GenResult>;
  chat(req: ChatRequest): Promise<ChatResult>;
}
