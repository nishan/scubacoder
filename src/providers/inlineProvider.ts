
import * as vscode from 'vscode';
import { ExtensionName } from '../extension';
import { LLMProvider } from '../models/types';
import { PolicyEngine } from '../policy/engine';
import { AuditLogger } from '../audit/logger';
import { buildInlinePrompt } from '../util/prompt';
import { selectContext } from '../context/selector';

export function registerInlineCompletion(provider: LLMProvider, policy: PolicyEngine, audit: AuditLogger) {
  const selector: vscode.DocumentSelector = [{ pattern: '**' }];

  const inlineProvider: vscode.InlineCompletionItemProvider = {
    async provideInlineCompletionItems(document, position, context, token) {
      try {
        const cfg = vscode.workspace.getConfiguration('scubacoder');
        const maxTokens = cfg.get('inline.maxTokens', 128);
        const temperature = cfg.get('inline.temperature', 0.2);

        const ctxItems = await selectContext(document, position, policy);
        const prompt = await buildInlinePrompt(document, position, ctxItems);

        const result = await provider.generateText({
          prompt,
          maxTokens,
          temperature,
          system: 'You are a careful coding assistant. Provide minimal, correct code to complete the current line or block. Do not add explanations.'
        });

        // Audit
        audit.record({
          kind: 'inline',
          model: provider.id,
          promptPreview: prompt.slice(0, 200),
          files: ctxItems.map(c => c.uri),
          timestamp: new Date().toISOString()
        });

        if (!result.text) return;

        const item = new vscode.InlineCompletionItem(result.text, new vscode.Range(position, position));
        return { items: [item] };
      } catch (err: any) {
        console.error(`${ExtensionName} inline error`, err);
        return;
      }
    }
  };

  return vscode.languages.registerInlineCompletionItemProvider(selector, inlineProvider);
}
