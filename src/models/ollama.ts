import fetch from 'node-fetch';
import { GenRequest, GenResult, ChatRequest, ChatResult, ChatMessage } from '../types';
import { LLMProvider } from './types';
import { Readable } from 'stream';

type OllamaOpts = { baseUrl: string; model: string };

export class OllamaProvider implements LLMProvider {
  id = 'ollama';
  capabilities = { chat: true, tools: false, json: false, embed: false };

  constructor(private opts: OllamaOpts) {}

  async listModels(): Promise<string[]> {
    const url = `${this.opts.baseUrl.replace(/\/$/, '')}/api/tags`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Ollama listModels error: ${res.status} ${res.statusText}`);
    const data = await res.json() as any;
    return (data.models || []).map((m: any) => m.name || m.model || '').filter(Boolean);
  }

  async generateText(req: GenRequest): Promise<GenResult> {
    const url = `${this.opts.baseUrl}/api/generate`;
    const body = {
      model: this.opts.model,
      prompt: [req.system ? `System: ${req.system}\n\n` : '', req.prompt].join(''),
      stream: false,
      options: { temperature: req.temperature, num_predict: req.maxTokens }
    };
    const res = await fetch(url, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' }});
    if (!res.ok) throw new Error(`Ollama error: ${res.status} ${res.statusText}`);
    const data = await res.json() as any;
    return { text: data.response ?? '' };
  }

  async *generateTextStream(req: GenRequest): AsyncIterable<string> {
    const url = `${this.opts.baseUrl}/api/generate`;
    const body = {
      model: this.opts.model,
      prompt: [req.system ? `System: ${req.system}\n\n` : '', req.prompt].join(''),
      stream: true,
      options: { temperature: req.temperature, num_predict: req.maxTokens }
    };
    const res = await fetch(url, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' }});
    if (!res.ok || !res.body) throw new Error(`Ollama stream error: ${res.status} ${res.statusText}`);

    const reader = res.body as unknown as Readable;
    let buffer = '';
    for await (const chunk of reader) {
      buffer += chunk.toString('utf8');
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const obj = JSON.parse(line);
          if (typeof obj.response === 'string') yield obj.response;
          if (obj.done) return;
        } catch {}
      }
    }
    if (buffer.trim()) {
      try {
        const obj = JSON.parse(buffer);
        if (typeof obj.response === 'string') yield obj.response;
      } catch {}
    }
  }

  async chat(req: ChatRequest): Promise<ChatResult> {
    const url = `${this.opts.baseUrl}/api/chat`;
    const body = { model: this.opts.model, stream: false, messages: req.messages };
    const res = await fetch(url, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' }});
    if (!res.ok) throw new Error(`Ollama chat error: ${res.status} ${res.statusText}`);
    const data = await res.json() as any;
    const text: string = data.message?.content ?? (Array.isArray(data.messages) ? data.messages.map((m: any) => m.content).join('') : '');
    return { text };
  }

  async *chatStream(req: ChatRequest): AsyncIterable<string> {
    const url = `${this.opts.baseUrl}/api/chat`;
    const body = { model: this.opts.model, stream: true, messages: req.messages };
    const res = await fetch(url, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' }});
    if (!res.ok || !res.body) throw new Error(`Ollama chat stream error: ${res.status} ${res.statusText}`);

    const reader = res.body as unknown as Readable;
    let buffer = '';
    let last = '';

    for await (const chunk of reader) {
      buffer += chunk.toString('utf8');
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const obj = JSON.parse(line);
          if (typeof obj.response === 'string') {
            yield obj.response;
            last += obj.response;
          } else if (obj.message && typeof obj.message.content === 'string') {
            const cur: string = obj.message.content;
            const delta = cur.slice(last.length);
            if (delta) yield delta;
            last = cur;
          }
          if (obj.done) return;
        } catch {}
      }
    }
    if (buffer.trim()) {
      try {
        const obj = JSON.parse(buffer);
        if (typeof obj.response === 'string') yield obj.response;
        else if (obj.message && typeof obj.message.content === 'string') {
          const cur: string = obj.message.content;
          const delta = cur.slice(last.length);
          if (delta) yield delta;
        }
      } catch {}
    }
  }
}
