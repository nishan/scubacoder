
import * as vscode from 'vscode';
import { LLMProvider } from '../models/types';
import { PolicyEngine } from '../policy/engine';
import { AuditLogger } from '../audit/logger';

export class ChatPanel {
  public static current: ChatPanel | undefined;
  private readonly panel: vscode.WebviewPanel;

  public static createOrShow(extUri: vscode.Uri, provider: LLMProvider, policy: PolicyEngine, audit: AuditLogger) {
    const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
    if (ChatPanel.current) {
      ChatPanel.current.panel.reveal(column);
      return;
    }
    const panel = vscode.window.createWebviewPanel('scubacoder.chat', 'ScubaCoder Chat', column ?? vscode.ViewColumn.Two, {
      enableScripts: true
    });
    ChatPanel.current = new ChatPanel(panel, extUri, provider, policy, audit);
  }

  private constructor(panel: vscode.WebviewPanel, extUri: vscode.Uri, provider: LLMProvider, policy: PolicyEngine, audit: AuditLogger) {
    this.panel = panel;
    this.panel.onDidDispose(() => ChatPanel.current = undefined);

    this.panel.webview.html = this.getHtml();

    this.panel.webview.onDidReceiveMessage(async (msg) => {
      if (msg.type === 'chat') {
        const text: string = msg.text ?? '';
        const res = await provider.chat({
          messages: [{ role: 'system', content: 'You are a helpful coding assistant.' }, { role: 'user', content: text }],
          maxTokens: 256,
          temperature: 0.3
        });
        audit.record({ kind: 'chat', promptPreview: text.slice(0, 200), model: provider.id, timestamp: new Date().toISOString() });
        this.panel.webview.postMessage({ type: 'reply', text: res.text });
      }
    });
  }

  private getHtml(): string {
    const nonce = String(Math.random());
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'; " />
<meta name="viewport" content="width=device-width,initial-scale=1.0" />
<title>ScubaCoder Chat</title>
<style>
  body { font-family: var(--vscode-font-family); padding: 1rem; }
  #log { white-space: pre-wrap; border: 1px solid var(--vscode-editorWidget-border); padding: .5rem; height: 300px; overflow: auto; }
  #input { width: 100%; }
  button { margin-top: .5rem; }
</style>
</head>
<body>
  <div id="log"></div>
  <textarea id="input" rows="4" placeholder="Ask ScubaCoder…"></textarea>
  <button id="send">Send</button>
<script nonce="${nonce}">
  const vscode = acquireVsCodeApi();
  const log = document.getElementById('log');
  const input = document.getElementById('input');
  document.getElementById('send').addEventListener('click', () => {
    const text = input.value.trim();
    if (!text) return;
    append('You: ' + text);
    vscode.postMessage({ type: 'chat', text });
    input.value='';
  });
  window.addEventListener('message', (event) => {
    const msg = event.data;
    if (msg.type === 'reply') {
      append('ScubaCoder: ' + msg.text);
    }
  });
  function append(s) {
    log.textContent += s + '\n\n';
    log.scrollTop = log.scrollHeight;
  }
</script>
</body>
</html>`;
  }
}
