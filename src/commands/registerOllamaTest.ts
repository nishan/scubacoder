import * as vscode from 'vscode';
import { createProvider } from '../models/providerRouter';
import { info, warn } from '../modules/log';

export function registerOllamaTest(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('scubacoder.ollama.test', async () => {
      try {
        const cfg = vscode.workspace.getConfiguration('scubacoder');
        const provider = cfg.get<string>('provider', 'ollama');
        const model = cfg.get<string>('ollama.model', 'qwen2.5-coder:7b');
        
        if (provider !== 'ollama') {
          vscode.window.showWarningMessage('Current provider is not Ollama. Please switch to Ollama first.');
          return;
        }
        
        info('Testing Ollama connection...');
        vscode.window.showInformationMessage('Testing Ollama connection...');
        
        const ollamaProvider = createProvider({ provider, model });
        
        // Test connection
        const connectionTest = await (ollamaProvider as any).testConnection();
        if (!connectionTest) {
          vscode.window.showErrorMessage('Failed to connect to Ollama server. Please check if Ollama is running.');
          return;
        }
        
        vscode.window.showInformationMessage('Successfully connected to Ollama server!');
        
        // List available models
        try {
          const models = await (ollamaProvider as any).listModels();
          if (models.length > 0) {
            const modelList = models.join(', ');
            vscode.window.showInformationMessage(`Available models: ${modelList}`);
            info(`Available Ollama models: ${modelList}`);
          } else {
            vscode.window.showWarningMessage('No models found in Ollama. Please pull a model first.');
          }
        } catch (error) {
          warn('Failed to list models:', error);
          vscode.window.showWarningMessage('Failed to list models. Please check Ollama configuration.');
        }
        
        // Test if current model is available
        try {
          const isModelAvailable = await (ollamaProvider as any).isModelAvailable(model);
          if (isModelAvailable) {
            vscode.window.showInformationMessage(`Model ${model} is available and ready to use.`);
          } else {
            vscode.window.showWarningMessage(`Model ${model} is not available. Please pull it first with: ollama pull ${model}`);
          }
        } catch (error) {
          warn('Failed to check model availability:', error);
          vscode.window.showWarningMessage('Failed to check model availability.');
        }
        
      } catch (error) {
        warn('Ollama test failed:', error);
        vscode.window.showErrorMessage(`Ollama test failed: ${error}`);
      }
    })
  );
}
