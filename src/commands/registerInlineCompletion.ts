import * as vscode from 'vscode';
import { registerInlineCompletion } from '../providers/inlineProvider';

export function registerInlineCompletionCommand(context: vscode.ExtensionContext, provider: any, policy: any, audit: any) {
  context.subscriptions.push(registerInlineCompletion(provider, policy, audit));
}
