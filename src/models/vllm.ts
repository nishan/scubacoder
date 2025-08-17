import fetch from 'node-fetch';
import { GenRequest, GenResult, ChatRequest, ChatResult, ChatMessage } from '../types';
import { LLMProvider } from './types';

type VLLMOpts = { baseUrl: string; model: string };

export class VLLMProvider implements LLMProvider {
  id = 'vllm';
  capabilities = { chat: true, tools: false, json: false, embed: false };

  constructor(private opts: VLLMOpts) {}

  async listModels(): Promise<string[]> {
    // Replace with actual vLLM model listing if available
    return [this.opts.model];
  }

  async generateText(req: GenRequest): Promise<GenResult> {
    const messages: ChatMessage[] = [];
    if (req.system) messages.push({ role: 'system', content: req.system });
    messages.push({ role: 'user', content: req.prompt });

    const { text } = await this.chat({ messages, maxTokens: req.maxTokens, temperature: req.temperature });
    return { text };
  }

  async *generateTextStream(req: GenRequest): AsyncIterable<string> {
    const messages: ChatMessage[] = [];
    if (req.system) messages.push({ role: 'system', content: req.system });
    messages.push({ role: 'user', content: req.prompt });
    for await (const chunk of this.chatStream({ messages, maxTokens: req.maxTokens, temperature: req.temperature })) {
      yield chunk;
    }
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

  async *chatStream(req: ChatRequest): AsyncIterable<string> {
    const url = `${this.opts.baseUrl}/v1/chat/completions`;
    const body = {
      model: this.opts.model,
      messages: req.messages,
      temperature: req.temperature,
      max_tokens: req.maxTokens,
      stream: true
    };
    const res = await fetch(url, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' }});
    if (!res.ok || !res.body) throw new Error(`vLLM stream error: ${res.status} ${res.statusText}`);

    // vLLM streams data as lines of JSON (SSE-like)
    const reader = res.body as any;
    let buffer = '';
    for await (const chunk of reader) {
      buffer += chunk.toString('utf8');
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.trim()) continue;
        // vLLM streams as: 'data: { ... }'
        const jsonLine = line.startsWith('data:') ? line.slice(5).trim() : line.trim();
        if (!jsonLine || jsonLine === '[DONE]') continue;
        try {
          const obj = JSON.parse(jsonLine);
          const content = obj.choices?.[0]?.delta?.content ?? obj.choices?.[0]?.message?.content;
          if (typeof content === 'string') yield content;
          if (obj.choices?.[0]?.finish_reason) return;
        } catch {}
      }
    }
    if (buffer.trim()) {
      try {
        const obj = JSON.parse(buffer.trim());
        const content = obj.choices?.[0]?.delta?.content ?? obj.choices?.[0]?.message?.content;
        if (typeof content === 'string') yield content;
      } catch {}
    }
  }
}
