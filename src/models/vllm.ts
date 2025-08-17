
import fetch from 'node-fetch';
import { GenRequest, GenResult, ChatRequest, ChatResult, ChatMessage } from '../types';
import { LLMProvider } from './types';

type VLLMOpts = { baseUrl: string; model: string };

export class VLLMProvider implements LLMProvider {
  id = 'vllm';
  capabilities = { chat: true, tools: false, json: false, embed: false };

  constructor(private opts: VLLMOpts) {}

  async generateText(req: GenRequest): Promise<GenResult> {
    const messages: ChatMessage[] = [];
    if (req.system) messages.push({ role: 'system', content: req.system });
    messages.push({ role: 'user', content: req.prompt });

    const { text } = await this.chat({ messages, maxTokens: req.maxTokens, temperature: req.temperature });
    return { text };
  }

  async chat(req: ChatRequest): Promise<ChatResult> {
    const url = `${this.opts.baseUrl}/v1/chat/completions`;
    const body = {
      model: this.opts.model,
      messages: req.messages,
      temperature: req.temperature,
      max_tokens: req.maxTokens,
      stream: false
    };
    const res = await fetch(url, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' }});
    if (!res.ok) throw new Error(`vLLM error: ${res.status} ${res.statusText}`);
    const data = await res.json() as any;
    const text = data.choices?.[0]?.message?.content ?? '';
    return { text };
  }
}
