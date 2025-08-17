import * as vscode from 'vscode';
import { ChatPanel } from '../views/chatPanel';

export function registerChatPanel(context: vscode.ExtensionContext, provider: any, policy: any, audit: any) {
  context.subscriptions.push(vscode.commands.registerCommand('scubacoder.chat.open', () => {
    ChatPanel.createOrShow(context.extensionUri, provider, policy, audit);
  }));
}
