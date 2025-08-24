
import * as vscode from 'vscode';
import { ExtensionName } from '../extension';
import { LLMProvider } from '../models/types';
import { PolicyEngine } from '../policy/engine';
import { AuditLogger } from '../audit/logger';
import { info, warn } from '../modules/log';

/**
 * ChatPanel: A richer chat UX with message cards, code blocks, copy/feedback buttons,
 * context chips, and a bottom composer similar to VS Code's chat.
 */
export class ChatPanel {
  public static current: ChatPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private readonly extUri: vscode.Uri;
  private readonly provider: LLMProvider;
  private readonly policy: PolicyEngine;
  private readonly audit: AuditLogger;
  private readonly candidates: Array<{ label: string; uri: string }> = [];

  public static createOrShow(extUri: vscode.Uri, provider: LLMProvider, policy: PolicyEngine, audit: AuditLogger) {
    const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
    if (ChatPanel.current) {
      ChatPanel.current.panel.reveal(column);
      return;
    }
    const panel = vscode.window.createWebviewPanel('scubacoder.chat', `${ExtensionName} — Chat`, column ?? vscode.ViewColumn.Two, {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [
        vscode.Uri.joinPath(extUri, 'out', 'views', 'chat-panel-vue')
      ],
      enableCommandUris: false,
      enableFindWidget: true,
      enableForms: false
    });
    ChatPanel.current = new ChatPanel(panel, extUri, provider, policy, audit);
  }

  private constructor(panel: vscode.WebviewPanel, _extUri: vscode.Uri, provider: LLMProvider, policy: PolicyEngine, audit: AuditLogger) {
    this.panel = panel;
    this.extUri = _extUri;
    this.provider = provider;
    this.policy = policy;
    this.audit = audit;

    // Initialize configuration
    const cfg = vscode.workspace.getConfiguration('scubacoder');
    const model = cfg.get<string>('ollama.model', 'qwen2.5-coder:7b');
    const providerId = cfg.get<string>('provider', 'ollama');
    const availableProviderModels = cfg.get<any[]>('availableProviderModels', []);

    info ("VSCode URI:", this.extUri);

    // Build initial candidate context list from visible editors
    const editors = vscode.window.visibleTextEditors ?? [];
    this.candidates = editors
      .filter(e => e.document.uri.scheme === 'file' && !this.policy.isDenied(e.document.uri))
      .map(e => ({ label: vscode.workspace.asRelativePath(e.document.uri), uri: e.document.uri.toString() }));

    const nonce = this.getNonce();
    // Mark the current selection
    const markedModels = availableProviderModels.map((item: any) => ({
      ...item,
      isSelected: item.provider === providerId && item.model === model
    }));
    this.panel.webview.html = this.getHtml(nonce, { 
      providerId, 
      model, 
      candidates: this.candidates, 
      availableProviderModels: markedModels 
    });

    info('Chat panel initialized with html:', this.panel.webview.html);

    this.panel.onDidDispose(() => (ChatPanel.current = undefined));

    this.panel.webview.onDidReceiveMessage(async (msg) => {
      try {
        info('TypeScript received message:', msg);
        switch (msg.type) {
          case 'chat': {
            info('Processing chat case');
            const text: string = msg.text ?? '';
            const maxTokens = 512;
            const temperature = 0.3;
            const contextUris: string[] = Array.isArray(msg.contextUris) ? msg.contextUris : [];

            info('Sending loading to webview');
            // Show loading indicator
            this.panel.webview.postMessage({ type: 'loading' });

            try {
              info('Calling provider.chat');
              const system = 'You are a careful coding assistant. Prefer short, accurate answers. Return code in triple backticks.';
              const res = await this.provider.chat({
                messages: [{ role: 'system', content: system }, { role: 'user', content: text }],
                maxTokens,
                temperature
              });

              info('Got response from provider:', res);
              this.audit.record({ kind: 'chat', model: this.provider.id, promptPreview: text.slice(0, 200), files: contextUris, timestamp: new Date().toISOString() });

              info('Sending reply to webview');
              this.panel.webview.postMessage({ type: 'reply', text: res.text });
            } catch (error) {
              warn('Error in provider.chat:', error);
              this.panel.webview.postMessage({ type: 'reply', text: `Error: ${String(error)}` });
            }
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
          case 'changeProviderModel': {
            const provider = msg.provider as string;
            const model = msg.model as string;
            
            // Update configuration
            const config = vscode.workspace.getConfiguration('scubacoder');
            await config.update('provider', provider, vscode.ConfigurationTarget.Global);
            await config.update('ollama.model', model, vscode.ConfigurationTarget.Global);
            
            // Update the webview with new state
            const availableProviderModels = config.get<any[]>('availableProviderModels', []);
            const markedModels = availableProviderModels.map(item => ({
              ...item,
              isSelected: item.provider === provider && item.model === model
            }));
            
            // Send state update to webview
            this.panel.webview.postMessage({ 
              type: 'updateProviderModel',
              provider,
              model,
            });
            
            break;
          }
          case 'log': {
            const level = msg.level as string;
            const message = msg.message as string;
            const data = msg.data;
            
            if (level === 'info') {
              info(message, data);
            } else if (level === 'warn') {
              warn(message, data);
            } else if (level === 'error') {
              warn(message, data);
            }
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

  private getJavaScriptCode(): string {
    // This is now handled by the Vue.js app
    return '';
  }

  private getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
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
    const { providerId, model, candidates, availableProviderModels = [] } = init;
    
    // Get URIs for static assets
    const cssUri = this.panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this.extUri, 'out', 'views', 'chat-panel-vue', 'style.css')
    );
    const jsUri = this.panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this.extUri, 'out', 'views', 'chat-panel-vue', 'index.umd.js')
    );
    
    // Create initialization data for Vue app
    const initData = {
      providerId,
      model,
      candidates: candidates.map(c => ({ ...c, isSelected: false })),
      availableProviderModels: availableProviderModels.map((item: any) => ({
        ...item,
        isSelected: item.provider === providerId && item.model === model
      }))
    };
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="Content-Security-Policy" 
          content="default-src * vscode-resource: https: 'unsafe-inline' 'unsafe-eval';
          script-src vscode-resource: blob: data: https: 'unsafe-inline' 'unsafe-eval';
          style-src vscode-resource: https: 'unsafe-inline';
          img-src vscode-resource: data: https:;
          connect-src vscode-resource: blob: data: https: http:;">
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>ScubaCoder — Chat</title>
        <link rel="stylesheet" href="${cssUri}" rel="preload" as="style" />
        <link href="${jsUri}" rel="preload" as="script" />
      </head>
      <body>
        <div id="app">
          <!-- Vue app will mount here -->
          <div style="padding: 20px; text-align: center; color: #666;">
            Loading chat interface...<br>
            <small>Initialization data: ${JSON.stringify(initData).substring(0, 200)}...</small>
          </div>
        </div>
        <script>
          const vscode = acquireVsCodeApi();
          ['log','warn','error'].forEach(level => {
            const original = console[level].bind(console);
            console[level] = (...args) => {
              vscode.postMessage({ type: 'log', level, args });
              original(...args);
            };
          });
          </script>
                          
        <script src="${jsUri}"></script>                
          <script>
          console.log("Chat panel initialization started");
          
          if (typeof ScubaCoderChatPanel !== 'undefined') {            
            console.log("Vue app found, initializing...");
            
            console.log("Vue app initialized with data");
          } else {
            console.log("Vue app failed to load");
            document.getElementById('app').innerHTML = '<div style="padding: 20px; text-align: center; color: #f44336;">Failed to load chat interface - Vue app not found</div>';
          }        

        </script>
      </body>
      </html>
    `;
  }
}
