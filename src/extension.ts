// Global extension name for UX
export const ExtensionName = 'ScubaCoder';

import * as vscode from 'vscode';
import { registerInlineCompletionCommand } from './commands/registerInlineCompletion';
import { registerChatPanel } from './commands/registerChatPanel';
import { registerConsentPanel } from './commands/registerConsentPanel';
import { registerRebuildIndex } from './commands/registerRebuildIndex';
import { registerOllamaConfig } from './commands/registerOllamaConfig';
import { registerVllmConfig } from './commands/registerVllmConfig';
import { getProvider } from './models/providerRouter';
import { NetworkGuard } from './net/guard';
import { PolicyEngine } from './policy/engine';
import { AuditLogger } from './audit/logger';
import { Indexer } from './rag/indexer';
import { info, registerLogger } from './modules/log';

import { OllamaProvider } from './models/ollama';

export async function activate(context: vscode.ExtensionContext) {

  	// Create logger
	registerLogger(vscode.window.createOutputChannel('Scuba Coder', { log: true }));
	info('Scuba Coder is activated.');

  const cfg = vscode.workspace.getConfiguration('scubacoder');

  // Network guard: optionally enforce localhost-only
  const guard = new NetworkGuard(cfg.get('network.localOnly', true));
  const policy = new PolicyEngine(cfg.get('policy.deny', ['**/.env', '**/*.pem', 'secrets/**']));
  const audit = new AuditLogger(context.globalStorageUri, cfg.get('audit.enabled', true));
  const indexer = new Indexer();

  const provider = getProvider(cfg);


  // Register commands using new modules
  registerInlineCompletionCommand(context, provider, policy, audit);
  registerChatPanel(context, provider, policy, audit);
  registerConsentPanel(context, policy);
  registerRebuildIndex(context, indexer);
  registerOllamaConfig(context, cfg);
  registerVllmConfig(context, cfg);

  info ("Commands registered");
  // Re-load configuration on change
  context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
    if (e.affectsConfiguration('scubacoder')) {
      vscode.window.showInformationMessage(`${ExtensionName} settings changed. Some changes may require reload.`);
    }
  }));

  vscode.window.setStatusBarMessage(`${ExtensionName} activated`, 2000);
}

export function deactivate() {}
