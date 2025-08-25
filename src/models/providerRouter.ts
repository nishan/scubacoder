
import * as vscode from 'vscode';
import { LLMProvider } from './types';
import { OllamaProvider } from './ollama';
import { VLLMProvider } from './vllm';

export interface ProviderConfig {
  provider: string;
  model: string;
  baseUrl?: string;
}

export function getProvider(cfg: vscode.WorkspaceConfiguration): LLMProvider {
  const provider = cfg.get<string>('provider', 'ollama');
  const model = cfg.get<string>('ollama.model', 'qwen2.5-coder:7b');
  const baseUrl = cfg.get<string>('ollama.baseUrl', 'http://127.0.0.1:11434');

  return createProvider({ provider, model, baseUrl });
}

export function createProvider(config: ProviderConfig): LLMProvider {
  const { provider, model, baseUrl } = config;

  if (provider === 'vllm') {
    const vllmBaseUrl = baseUrl || 'http://127.0.0.1:8000';
    return new VLLMProvider({ baseUrl: vllmBaseUrl, model });
  } else {
    const ollamaBaseUrl = baseUrl || 'http://127.0.0.1:11434';
    return new OllamaProvider({ baseUrl: ollamaBaseUrl, model });
  }
}

export function getProviderConfig(cfg: vscode.WorkspaceConfiguration): ProviderConfig {
  const provider = cfg.get<string>('provider', 'ollama');
  const model = cfg.get<string>('ollama.model', 'qwen2.5-coder:7b');
  
  let baseUrl: string | undefined;
  if (provider === 'vllm') {
    baseUrl = cfg.get<string>('vllm.baseUrl', 'http://127.0.0.1:8000');
  } else {
    baseUrl = cfg.get<string>('ollama.baseUrl', 'http://127.0.0.1:11434');
  }
  
  return { provider, model, baseUrl };
}

export function updateProviderConfig(cfg: vscode.WorkspaceConfiguration, newConfig: ProviderConfig): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const config = vscode.workspace.getConfiguration('scubacoder');
      
      // Update provider
      await config.update('provider', newConfig.provider, vscode.ConfigurationTarget.Global);
      
      // Update model based on provider
      if (newConfig.provider === 'vllm') {
        await config.update('vllm.model', newConfig.model, vscode.ConfigurationTarget.Global);
        if (newConfig.baseUrl) {
          await config.update('vllm.baseUrl', newConfig.baseUrl, vscode.ConfigurationTarget.Global);
        }
      } else {
        await config.update('ollama.model', newConfig.model, vscode.ConfigurationTarget.Global);
        if (newConfig.baseUrl) {
          await config.update('ollama.baseUrl', newConfig.baseUrl, vscode.ConfigurationTarget.Global);
        }
      }
      
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}
