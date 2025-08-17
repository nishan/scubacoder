
import * as vscode from 'vscode';
import { ContextItem } from '../types';

export async function buildInlinePrompt(doc: vscode.TextDocument, pos: vscode.Position, ctx: ContextItem[]): Promise<string> {
  const prefixRange = new vscode.Range(Math.max(0, pos.line - 50), 0, pos.line, pos.character);
  const suffixRange = new vscode.Range(pos, new vscode.Position(Math.min(doc.lineCount - 1, pos.line + 20), 0));
  const prefix = doc.getText(prefixRange);
  const suffix = doc.getText(suffixRange);

  const ctxParts: string[] = [];
  for (const c of ctx.slice(0, 3)) {
    ctxParts.push(`FILE: ${c.label}\n${c.preview ?? ''}`);
  }

  return [
    'Complete the code at the cursor.',
    'Use the same language and style. Return only code.',
    '--- CURRENT FILE (prefix) ---',
    prefix,
    '--- CONTEXT ---',
    ctxParts.join('\n\n'),
    '--- CURRENT FILE (suffix) ---',
    suffix,
    '--- COMPLETION ---'
  ].join('\n');
}
