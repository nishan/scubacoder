
import * as vscode from 'vscode';
import { PolicyEngine } from '../policy/engine';
import { ContextItem } from '../types';
import * as path from 'path';

export async function selectContext(document: vscode.TextDocument, position: vscode.Position, policy: PolicyEngine): Promise<ContextItem[]> {
  const open = vscode.window.visibleTextEditors.map(e => e.document).filter(d => d.uri.scheme === 'file');
  const items: ContextItem[] = [];

  for (const doc of open) {
    if (policy.isDenied(doc.uri)) continue;
    const label = path.basename(doc.uri.fsPath);
    const preview = doc.getText(new vscode.Range(0, 0, Math.min(100, doc.lineCount - 1), 0));
    items.push({ uri: doc.uri.toString(), label, preview });
  }

  // Always include current doc first
  items.sort((a, b) => (a.uri === document.uri.toString() ? -1 : b.uri === document.uri.toString() ? 1 : 0));

  return items.slice(0, 5);
}
