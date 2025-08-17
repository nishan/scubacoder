
import * as vscode from 'vscode';
import { ExtensionName } from '../extension';
import { LLMProvider } from '../models/types';
import { PolicyEngine } from '../policy/engine';
import { AuditLogger } from '../audit/logger';
import * as fs from 'fs';
import * as path from 'path';
import mustache from 'mustache';

/**
 * ChatPanel: A richer chat UX with message cards, code blocks, copy/feedback buttons,
 * context chips, and a bottom composer similar to VS Code's chat.
 */
export class ChatPanel {
  public static current: ChatPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private readonly provider: LLMProvider;
  private readonly policy: PolicyEngine;
  private readonly audit: AuditLogger;

  public static createOrShow(extUri: vscode.Uri, provider: LLMProvider, policy: PolicyEngine, audit: AuditLogger) {
    const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
    if (ChatPanel.current) {
      ChatPanel.current.panel.reveal(column);
      return;
    }
    const panel = vscode.window.createWebviewPanel('scubacoder.chat', `${ExtensionName} — Chat`, column ?? vscode.ViewColumn.Two, {
      enableScripts: true,
      retainContextWhenHidden: true
    });
    ChatPanel.current = new ChatPanel(panel, extUri, provider, policy, audit);
  }

  private constructor(panel: vscode.WebviewPanel, _extUri: vscode.Uri, provider: LLMProvider, policy: PolicyEngine, audit: AuditLogger) {
    this.panel = panel;
    this.provider = provider;
    this.policy = policy;
    this.audit = audit;


    const cfg = vscode.workspace.getConfiguration('scubacoder');
    const model = cfg.get<string>('ollama.model', 'qwen2.5-coder:7b');
    const providerId = cfg.get<string>('provider', 'ollama');
    const availableProviderModels = cfg.get<any[]>('availableProviderModels', []);

    // Build initial candidate context list from visible editors
    const editors = vscode.window.visibleTextEditors ?? [];
    const candidates = editors
      .filter(e => e.document.uri.scheme === 'file' && !this.policy.isDenied(e.document.uri))
      .map(e => ({ label: vscode.workspace.asRelativePath(e.document.uri), uri: e.document.uri.toString() }));

    const nonce = String(Math.random());
    // Mark the current selection
    const markedModels = availableProviderModels.map((item: any) => ({
      ...item,
      isSelected: item.provider === providerId && item.model === model
    }));
    this.panel.webview.html = this.getHtml(nonce, { providerId, model, candidates, availableProviderModels: markedModels });

    this.panel.onDidDispose(() => (ChatPanel.current = undefined));

    this.panel.webview.onDidReceiveMessage(async (msg) => {
      try {
        switch (msg.type) {
          case 'chat': {
            const text: string = msg.text ?? '';
            const maxTokens = 512;
            const temperature = 0.3;
            const contextUris: string[] = Array.isArray(msg.contextUris) ? msg.contextUris : [];

            const system = 'You are a careful coding assistant. Prefer short, accurate answers. Return code in triple backticks.';
            const res = await this.provider.chat({
              messages: [{ role: 'system', content: system }, { role: 'user', content: text }],
              maxTokens,
              temperature
            });

            this.audit.record({ kind: 'chat', model: this.provider.id, promptPreview: text.slice(0, 200), files: contextUris, timestamp: new Date().toISOString() });

            this.panel.webview.postMessage({ type: 'reply', text: res.text });
            break;
          }
          case 'insert': {
            const code: string = msg.code ?? '';
            const editor = vscode.window.activeTextEditor;
            if (editor) {
              await editor.edit(editBuilder => editBuilder.insert(editor.selection.active, code));
            }
            break;
          }
          case 'searchWorkspace': {
            const q: string = (msg.query ?? '').toString();
            if (!q) { this.panel.webview.postMessage({ type: 'searchResults', results: [] }); break; }
            const uris = await vscode.workspace.findFiles('**/*', '**/node_modules/**', 200);
            const results: { file: string; line: number; preview: string }[] = [];
            for (const uri of uris) {
              try {
                const doc = await vscode.workspace.openTextDocument(uri);
                const text = doc.getText();
                const idx = text.toLowerCase().indexOf(q.toLowerCase());
                if (idx >= 0) {
                  const pos = doc.positionAt(idx);
                  const lineText = doc.lineAt(pos.line).text.trim();
                  results.push({ file: vscode.workspace.asRelativePath(uri), line: pos.line + 1, preview: lineText });
                  if (results.length >= 16) break;
                }
              } catch {}
            }
            this.panel.webview.postMessage({ type: 'searchResults', results });
            break;
          }
          default:
            break;
        }
      } catch (e) {
        vscode.window.showErrorMessage(`${ExtensionName} chat error: ${String(e)}`);
      }
    });
  }

  private getHtml(
    nonce: string,
    init: {
      providerId: string;
      model: string;
      candidates: Array<{ label: string; uri: string }>;
      availableProviderModels?: Array<{ provider: string; baseUrl: string; model: string }>;
    }
  ): string {
    const templatePath = path.join(__dirname, 'chatPanel.html.mustache');
    const template = fs.readFileSync(templatePath, 'utf8');
    const { providerId, model, candidates, availableProviderModels = [] } = init;
    const initJson = JSON.stringify({ providerId, model, candidates, availableProviderModels });
    return mustache.render(template, { nonce, providerId, model, candidates, availableProviderModels, initJson });
  }
}
