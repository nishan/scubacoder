import fetch from 'node-fetch';
import { GenRequest, GenResult, ChatRequest, ChatResult, ChatMessage } from '../types';
import { LLMProvider } from './types';
import { Readable } from 'stream';

type OllamaOpts = { baseUrl: string; model: string };

export class OllamaProvider implements LLMProvider {
  id = 'ollama';
  capabilities = { chat: true, tools: false, json: false, embed: false };

  constructor(private opts: OllamaOpts) {}

  /**
   * Build consistent API URLs by properly handling baseUrl formatting
   */
  private buildApiUrl(endpoint: string): string {
    const baseUrl = this.opts.baseUrl.trim();
    // Remove trailing slash if present, then add endpoint
    const url = `${baseUrl.replace(/\/$/, '')}${endpoint}`;
    console.log(`Ollama API URL constructed: ${url}`);
    return url;
  }

  /**
   * Test connection to Ollama server
   */
  async testConnection(): Promise<boolean> {
    try {
      const url = this.buildApiUrl('/api/tags');
      console.log(`Testing Ollama connection to: ${url}`);
      const res = await fetch(url, { 
        method: 'GET'
      });
      console.log(`Ollama connection test response: ${res.status} ${res.statusText}`);
      return res.ok;
    } catch (error) {
      console.warn('Ollama connection test failed:', error);
      return false;
    }
  }

  /**
   * Get available models from Ollama
   */
  async listModels(): Promise<string[]> {
    try {
      const url = this.buildApiUrl('/api/tags');
      const res = await fetch(url, { 
        method: 'GET'
      });
      
      if (!res.ok) {
        throw new Error(`Ollama listModels error: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json() as any;
      return (data.models || []).map((m: any) => m.name || m.model || '').filter(Boolean);
    } catch (error) {
      console.error('Failed to list Ollama models:', error);
      throw new Error(`Failed to connect to Ollama at ${this.opts.baseUrl}: ${error}`);
    }
  }

  /**
   * Check if a specific model is available
   */
  async isModelAvailable(modelName: string): Promise<boolean> {
    try {
      const models = await this.listModels();
      return models.includes(modelName);
    } catch (error) {
      console.warn('Failed to check model availability:', error);
      return false;
    }
  }

  /**
   * Generate text using Ollama
   */
  async generateText(req: GenRequest): Promise<GenResult> {
    try {
      const url = this.buildApiUrl('/api/generate');
      const body = {
        model: this.opts.model,
        prompt: [req.system ? `System: ${req.system}\n\n` : '', req.prompt].join(''),
        stream: false,
        options: { 
          temperature: req.temperature, 
          num_predict: req.maxTokens,
          top_k: 40,
          top_p: 0.9,
          repeat_penalty: 1.1
        }
      };
      
      const res = await fetch(url, { 
        method: 'POST', 
        body: JSON.stringify(body), 
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!res.ok) {
        throw new Error(`Ollama error: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json() as any;
      return { 
        text: data.response ?? '',
        tokens: {
          prompt: data.prompt_eval_count,
          completion: data.eval_count
        }
      };
    } catch (error) {
      console.error('Ollama generateText failed:', error);
      throw new Error(`Failed to generate text with Ollama: ${error}`);
    }
  }

  /**
   * Stream text generation using Ollama
   */
  async *generateTextStream(req: GenRequest): AsyncIterable<string> {
    try {
      const url = this.buildApiUrl('/api/generate');
      const body = {
        model: this.opts.model,
        prompt: [req.system ? `System: ${req.system}\n\n` : '', req.prompt].join(''),
        stream: true,
        options: { 
          temperature: req.temperature, 
          num_predict: req.maxTokens,
          top_k: 40,
          top_p: 0.9,
          repeat_penalty: 1.1
        }
      };
      
      const res = await fetch(url, { 
        method: 'POST', 
        body: JSON.stringify(body), 
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!res.ok || !res.body) {
        throw new Error(`Ollama stream error: ${res.status} ${res.statusText}`);
      }

      const reader = res.body as unknown as Readable;
      let buffer = '';
      
      console.log('Response body type:', typeof res.body);
      console.log('Response body constructor:', res.body?.constructor?.name);
      console.log('Response body readable:', res.body?.readable);
      
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
            }
            if (obj.done) return;
          } catch (parseError) {
            console.warn('Failed to parse Ollama stream line:', line, parseError);
          }
        }
      }
      
      // Handle any remaining buffer
      if (buffer.trim()) {
        try {
          const obj = JSON.parse(buffer);
          if (typeof obj.response === 'string') {
            yield obj.response;
          }
        } catch (parseError) {
          console.warn('Failed to parse final buffer:', buffer, parseError);
        }
      }
    } catch (error) {
      console.error('Ollama generateTextStream failed:', error);
      throw new Error(`Failed to stream text with Ollama: ${error}`);
    }
  }

  /**
   * Chat with Ollama using conversation history
   */
  async chat(req: ChatRequest): Promise<ChatResult> {
    const url = this.buildApiUrl('/api/chat');
    try {      
      const body = { 
        model: this.opts.model, 
        stream: false, 
        messages: req.messages,
        options: {
          temperature: req.temperature,
          num_predict: req.maxTokens,
          top_k: 40,
          top_p: 0.9,
          repeat_penalty: 1.1
        }
      };
      
      console.log(`Ollama chat body: ${JSON.stringify(body)}`);

      const res = await fetch(url, { 
        method: 'POST', 
        body: JSON.stringify(body), 
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!res.ok) {
        throw new Error(`Ollama chat error: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json() as any;
      const text: string = data.message?.content ?? (Array.isArray(data.messages) ? data.messages.map((m: any) => m.content).join('') : '');
      
      return { 
        text,
        tokens: {
          prompt: data.prompt_eval_count,
          completion: data.eval_count
        }
      };
    } catch (error) {
      console.error('Ollama chat failed:', error);
      throw new Error(`Failed to chat with Ollama: ${error} in ${url}`);
    }
  }

  /**
   * Stream chat responses from Ollama
   */
  async *chatStream(req: ChatRequest): AsyncIterable<string> {
    try {
      const url = this.buildApiUrl('/api/chat');
      const body = { 
        model: this.opts.model, 
        stream: true, 
        messages: req.messages,
        options: {
          temperature: req.temperature,
          num_predict: req.maxTokens,
          top_k: 40,
          top_p: 0.9
        }
      };
      
      console.log('Ollama streaming request body:', JSON.stringify(body, null, 2));
      
      const res = await fetch(url, { 
        method: 'POST', 
        body: JSON.stringify(body), 
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('Ollama streaming response status:', res.status, res.statusText);
      console.log('Ollama streaming response headers:', Object.fromEntries(res.headers.entries()));
      
      if (!res.ok || !res.body) {
        throw new Error(`Ollama chat stream error: ${res.status} ${res.statusText}`);
      }

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
            console.log('Ollama streaming chunk:', obj); // Debug logging
            
            // Handle streaming chat response format
            if (typeof obj.message.content === 'string') {
              console.log('Yielding response chunk:', obj.message.content); // Debug logging
              yield obj.message.content;
            }
            
            // Check if stream is done
            if (obj.done) {
              console.log('Stream done, returning'); // Debug logging
              return;
            }
          } catch (parseError) {
            console.warn('Failed to parse Ollama chat stream line:', line, parseError);
          }
        }
      }
      
      // Handle any remaining buffer
      if (buffer.trim()) {
        try {
          const obj = JSON.parse(buffer);
          if (typeof obj.response === 'string') {
            yield obj.response;
          }
        } catch (parseError) {
          console.warn('Failed to parse final chat buffer:', buffer, parseError);
        }
      }
    } catch (error) {
      console.error('Ollama chatStream failed:', error);
      throw new Error(`Failed to stream chat with Ollama: ${error}`);
    }
  }

  /**
   * Get provider information
   */
  getInfo() {
    return {
      id: this.id,
      name: 'Ollama',
      model: this.opts.model,
      baseUrl: this.opts.baseUrl,
      capabilities: this.capabilities
    };
  }
}
