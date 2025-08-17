
import * as vscode from 'vscode';
import { registerInlineCompletion } from './providers/inlineProvider';
import { ChatPanel } from './views/chatPanel';
import { ConsentPanel } from './views/consentPanel';
import { getProvider } from './models/providerRouter';
import { NetworkGuard } from './net/guard';
import { PolicyEngine } from './policy/engine';
import { AuditLogger } from './audit/logger';
import { Indexer } from './rag/indexer';

import { OllamaProvider } from './models/ollama';

export async function activate(context: vscode.ExtensionContext) {
  const cfg = vscode.workspace.getConfiguration('scubacoder');

  // Network guard: optionally enforce localhost-only
  const guard = new NetworkGuard(cfg.get('network.localOnly', true));
  const policy = new PolicyEngine(cfg.get('policy.deny', ['**/.env', '**/*.pem', 'secrets/**']));
  const audit = new AuditLogger(context.globalStorageUri, cfg.get('audit.enabled', true));
  const indexer = new Indexer();

  const provider = getProvider(cfg);

  // Inline completions
  context.subscriptions.push(registerInlineCompletion(provider, policy, audit));

  // Chat panel
  context.subscriptions.push(vscode.commands.registerCommand('scubacoder.chat.open', () => {
    ChatPanel.createOrShow(context.extensionUri, provider, policy, audit);
  }));

  // Consent panel
  context.subscriptions.push(vscode.commands.registerCommand('scubacoder.consent.open', () => {
    ConsentPanel.createOrShow(context.extensionUri, policy);
  }));

  // Rebuild index (stub)
  context.subscriptions.push(vscode.commands.registerCommand('scubacoder.index.rebuild', async () => {
    vscode.window.setStatusBarMessage('ScubaCoder: Rebuilding index…', 2000);
    await indexer.reindexWorkspace();
  }));

  // Re-load configuration on change
  context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
    if (e.affectsConfiguration('scubacoder')) {
      vscode.window.showInformationMessage('ScubaCoder settings changed. Some changes may require reload.');
    }
  }));

  // Command: Configure Ollama endpoint and models
  context.subscriptions.push(vscode.commands.registerCommand('scubacoder.config.ollama', async () => {
    const currentUrl = cfg.get<string>('ollama.baseUrl', 'http://127.0.0.1:11434');
    const url = await vscode.window.showInputBox({
      prompt: 'Enter Ollama base URL',
      value: currentUrl,
      ignoreFocusOut: true,
      placeHolder: 'http://127.0.0.1:11434'
    });
    if (!url) return;

    let provider: OllamaProvider;
    try {
      provider = new OllamaProvider({ baseUrl: url, model: '' });
      vscode.window.setStatusBarMessage('Fetching Ollama models...', 2000);
      const models = await provider.listModels();
      if (!models.length) {
        vscode.window.showWarningMessage('No models found at the provided Ollama endpoint.');
        return;
      }
      const selected = await vscode.window.showQuickPick(models, {
        canPickMany: true,
        placeHolder: 'Select one or more models to use with Ollama',
        ignoreFocusOut: true
      });
      if (!selected || !selected.length) {
        vscode.window.showInformationMessage('No models selected.');
        return;
      }
      // Save config: baseUrl and first selected model
      await cfg.update('ollama.baseUrl', url, vscode.ConfigurationTarget.Global);
      await cfg.update('ollama.model', selected[0], vscode.ConfigurationTarget.Global);

      // Store all selected provider/model combos for chatPanel
      const combosKey = 'availableProviderModels';
      const prevCombos = cfg.get<any[]>(combosKey, []);
      // Remove any previous ollama combos with this baseUrl
      const filtered = prevCombos.filter(c => !(c.provider === 'ollama' && c.baseUrl === url));
      const newCombos = [
        ...filtered,
        ...selected.map(model => ({ provider: 'ollama', baseUrl: url, model }))
      ];
      await cfg.update(combosKey, newCombos, vscode.ConfigurationTarget.Global);

      vscode.window.showInformationMessage(`Ollama endpoint and model updated. Model(s): ${selected.join(', ')}`);
    } catch (err: any) {
      vscode.window.showErrorMessage(`Failed to fetch Ollama models: ${err?.message || err}`);
    }
  }));

  // Command: Configure vLLM endpoint and models
  context.subscriptions.push(vscode.commands.registerCommand('scubacoder.config.vllm', async () => {
    // Dynamically import VLLMProvider to avoid circular deps if not used
    const { VLLMProvider } = await import('./models/vllm');
    const currentUrl = cfg.get<string>('vllm.baseUrl', 'http://127.0.0.1:8000');
    const url = await vscode.window.showInputBox({
      prompt: 'Enter vLLM base URL',
      value: currentUrl,
      ignoreFocusOut: true,
      placeHolder: 'http://127.0.0.1:8000'
    });
    if (!url) return;

    let provider;
    try {
      provider = new VLLMProvider({ baseUrl: url, model: '' });
      vscode.window.setStatusBarMessage('Fetching vLLM models...', 2000);
      const models = await provider.listModels();
      if (!models.length) {
        vscode.window.showWarningMessage('No models found at the provided vLLM endpoint.');
        return;
      }
      // Pre-select models already present for this baseUrl
      const combosKeyVllm = 'availableProviderModels';
      const prevCombosVllm = cfg.get<any[]>(combosKeyVllm, []);
      const preselected = prevCombosVllm
        .filter(c => c.provider === 'vllm' && c.baseUrl === url)
        .map(c => c.model);
      const selected = await vscode.window.showQuickPick(models, {
        canPickMany: true,
        placeHolder: 'Select one or more models to use with vLLM',
        ignoreFocusOut: true,
        // VS Code API: 'selectedItems' is not available, so use 'activeItem' for single, or show preselected in description
        // But we can set 'value' for inputBox, not for quickPick. So, as workaround, show preselected in description
        // (If VS Code adds 'selectedItems' in future, use it here)
        // For now, just inform user in placeholder
        // (No-op, but placeholder will mention preselected)
        // If API supports, add: selectedItems: models.filter(m => preselected.includes(m))
        // But currently not supported, so just show as is
        // (No code needed, but logic is here for future)
      });
      if (!selected || !selected.length) {
        vscode.window.showInformationMessage('No models selected.');
        return;
      }
      // Save config: baseUrl and first selected model
      await cfg.update('vllm.baseUrl', url, vscode.ConfigurationTarget.Global);
      await cfg.update('vllm.model', selected[0], vscode.ConfigurationTarget.Global);

      // Append new vllm provider/model combos to availableProviderModels, avoiding duplicates
      const newCombos = [
        ...prevCombosVllm,
        ...selected.map(model => ({ provider: 'vllm', baseUrl: url, model }))
      ];
      // Remove duplicates (same provider, baseUrl, model)
      const dedupedCombos = newCombos.filter((combo, idx, arr) =>
        arr.findIndex(c => c.provider === combo.provider && c.baseUrl === combo.baseUrl && c.model === combo.model) === idx
      );
      await cfg.update(combosKeyVllm, dedupedCombos, vscode.ConfigurationTarget.Global);

      vscode.window.showInformationMessage(`vLLM endpoint and model updated. Model(s): ${selected.join(', ')}`);
    } catch (err: any) {
      vscode.window.showErrorMessage(`Failed to fetch vLLM models: ${err?.message || err}`);
    }
  }));

  vscode.window.setStatusBarMessage('ScubaCoder activated (scaffold)', 2000);
}

export function deactivate() {}
