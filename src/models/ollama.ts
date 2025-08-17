
import fetch from 'node-fetch';
import { GenRequest, GenResult, ChatRequest, ChatResult } from '../types';
import { LLMProvider } from './types';

type OllamaOpts = { baseUrl: string; model: string };

export class OllamaProvider implements LLMProvider {
  id = 'ollama';
  capabilities = { chat: true, tools: false, json: false, embed: false };

  constructor(private opts: OllamaOpts) {}

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

  async chat(req: ChatRequest): Promise<ChatResult> {
    // Map to a single prompt for simplicity (scaffold)
    const system = req.messages.find(m => m.role === 'system')?.content ?? '';
    const user = req.messages.filter(m => m.role !== 'system').map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
    const gen = await this.generateText({ prompt: user, system, maxTokens: req.maxTokens, temperature: req.temperature });
    return { text: gen.text };
  }
}
