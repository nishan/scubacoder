import * as vscode from 'vscode';

export async function registerVllmConfig(context: vscode.ExtensionContext, cfg: vscode.WorkspaceConfiguration) {
  context.subscriptions.push(vscode.commands.registerCommand('scubacoder.config.vllm', async () => {
    const { VLLMProvider } = await import('../models/vllm');
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
      const combosKeyVllm = 'availableProviderModels';
      const prevCombosVllm = cfg.get<any[]>(combosKeyVllm, []);
      const preselected = prevCombosVllm
        .filter(c => c.provider === 'vllm' && c.baseUrl === url)
        .map(c => c.model);
      const selected = await vscode.window.showQuickPick(models, {
        canPickMany: true,
        placeHolder: 'Select one or more models to use with vLLM',
        ignoreFocusOut: true
      });
      if (!selected || !selected.length) {
        vscode.window.showInformationMessage('No models selected.');
        return;
      }
      await cfg.update('vllm.baseUrl', url, vscode.ConfigurationTarget.Global);
      await cfg.update('vllm.model', selected[0], vscode.ConfigurationTarget.Global);
      // Store all selected provider/model combos for chatPanel (without baseUrl)
      const newCombos = [
        ...prevCombosVllm.filter(c => !(c.provider === 'vllm' && selected.includes(c.model))),
        ...selected.map(model => ({ provider: 'vllm', model }))
      ];
      // Remove duplicates (same provider, model)
      const dedupedCombos = newCombos.filter((combo, idx, arr) =>
        arr.findIndex(c => c.provider === combo.provider && c.model === combo.model) === idx
      );
      await cfg.update(combosKeyVllm, dedupedCombos, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage(`vLLM model(s) updated: ${selected.join(', ')}`);
    } catch (err: any) {
      vscode.window.showErrorMessage(`Failed to fetch vLLM models: ${err?.message || err}`);
    }
  }));
}
