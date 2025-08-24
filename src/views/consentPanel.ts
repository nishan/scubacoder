
import * as vscode from 'vscode';
import { ExtensionName } from '../extension';

export class ConsentPanel {
  public static current: ConsentPanel | undefined;
  private readonly panel: vscode.WebviewPanel;

  public static createOrShow(extUri: vscode.Uri, policy: any) {
    const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
    if (ConsentPanel.current) {
      ConsentPanel.current.panel.reveal(column);
      return;
    }
    const panel = vscode.window.createWebviewPanel('scubacoder.consent', `${ExtensionName} Consent`, column ?? vscode.ViewColumn.Three, {
      enableScripts: true,
      localResourceRoots: [extUri],
      enableCommandUris: false,
      enableFindWidget: false,
      enableForms: false
    });
    ConsentPanel.current = new ConsentPanel(panel, extUri, policy);
  }

  private constructor(panel: vscode.WebviewPanel, extUri: vscode.Uri, policy: any) {
    this.panel = panel;
    this.panel.onDidDispose(() => ConsentPanel.current = undefined);

    this.refresh();

    this.panel.webview.onDidReceiveMessage(async (msg) => {
      if (msg.type === 'save') {
        const selected = msg.uris as string[];
        await vscode.workspace.getConfiguration('scubacoder').update('consent.selected', selected, vscode.ConfigurationTarget.Workspace);
        vscode.window.showInformationMessage(`${ExtensionName}: Saved ${selected.length} consented files for context.`);
      }
    });
  }

  private async refresh() {
    const editors = vscode.window.visibleTextEditors;
    const items = editors.map(e => ({ label: e.document.fileName, uri: e.document.uri.toString() }));
    const list = items.map(i => `<li><label><input type=\"checkbox\" data-uri=\"${i.uri}\"> ${i.label}</label></li>`).join('');
    const nonce = String(Math.random());
    this.panel.webview.html = `<!DOCTYPE html>
<html><head>
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'; " />
</head>
<body style="font-family: var(--vscode-font-family); padding: 1rem">
  <h3>Select files to allow as context</h3>
  <ul>${list}</ul>
  <button id="save">Save</button>
<script nonce="${nonce}">
  const vscode = acquireVsCodeApi();
  document.getElementById('save').addEventListener('click', () => {
    const boxes = Array.from(document.querySelectorAll('input[type=checkbox]'));
    const uris = boxes.filter(b => b.checked).map(b => b.getAttribute('data-uri'));
    vscode.postMessage({ type: 'save', uris });
  });
</script>
</body></html>`;
  }
}
