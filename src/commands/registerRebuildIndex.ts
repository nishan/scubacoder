import * as vscode from 'vscode';
import { Indexer } from '../rag/indexer';

export function registerRebuildIndex(context: vscode.ExtensionContext, indexer: Indexer) {
  context.subscriptions.push(vscode.commands.registerCommand('scubacoder.index.rebuild', async () => {
    vscode.window.setStatusBarMessage('ScubaCoder: Rebuilding index…', 2000);
    await indexer.reindexWorkspace();
  }));
}
