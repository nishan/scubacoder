
import * as vscode from 'vscode';
import { LLMProvider } from './types';
import { OllamaProvider } from './ollama';
import { VLLMProvider } from './vllm';

export function getProvider(cfg: vscode.WorkspaceConfiguration): LLMProvider {
  const provider = cfg.get<string>('provider', 'ollama');

  if (provider === 'vllm') {
    const baseUrl = cfg.get<string>('vllm.baseUrl', 'http://127.0.0.1:8000');
    const model = cfg.get<string>('vllm.model', 'qwen2.5-coder:7b');
    return new VLLMProvider({ baseUrl, model });
  } else {
    const baseUrl = cfg.get<string>('ollama.baseUrl', 'http://127.0.0.1:11434');
    const model = cfg.get<string>('ollama.model', 'qwen2.5-coder:7b');
    return new OllamaProvider({ baseUrl, model });
  }
}
