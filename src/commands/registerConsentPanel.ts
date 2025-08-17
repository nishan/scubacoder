import * as vscode from 'vscode';
import { ConsentPanel } from '../views/consentPanel';

export function registerConsentPanel(context: vscode.ExtensionContext, policy: any) {
  context.subscriptions.push(vscode.commands.registerCommand('scubacoder.consent.open', () => {
    ConsentPanel.createOrShow(context.extensionUri, policy);
  }));
}
