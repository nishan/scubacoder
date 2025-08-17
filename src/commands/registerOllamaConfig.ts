import * as vscode from 'vscode';
import { OllamaProvider } from '../models/ollama';

export function registerOllamaConfig(context: vscode.ExtensionContext, cfg: vscode.WorkspaceConfiguration) {
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

      // Store all selected provider/model combos for chatPanel (without baseUrl)
      const combosKey = 'availableProviderModels';
      const prevCombos = cfg.get<any[]>(combosKey, []);
      // Remove any previous ollama combos with the same model
      const filtered = prevCombos.filter(c => !(c.provider === 'ollama' && selected.includes(c.model)));
      const newCombos = [
        ...filtered,
        ...selected.map(model => ({ provider: 'ollama', model }))
      ];
      await cfg.update(combosKey, newCombos, vscode.ConfigurationTarget.Global);

      vscode.window.showInformationMessage(`Ollama model(s) updated: ${selected.join(', ')}`);
    } catch (err: any) {
      vscode.window.showErrorMessage(`Failed to fetch Ollama models: ${err?.message || err}`);
    }
  }));
}
