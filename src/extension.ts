
import * as vscode from 'vscode';
import { registerInlineCompletion } from './providers/inlineProvider';
import { ChatPanel } from './views/chatPanel';
import { ConsentPanel } from './views/consentPanel';
import { getProvider } from './models/providerRouter';
import { NetworkGuard } from './net/guard';
import { PolicyEngine } from './policy/engine';
import { AuditLogger } from './audit/logger';
import { Indexer } from './rag/indexer';

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

  vscode.window.setStatusBarMessage('ScubaCoder activated (scaffold)', 2000);
}

export function deactivate() {}
