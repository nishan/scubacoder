
import * as vscode from 'vscode';

export class Indexer {
  async reindexWorkspace(): Promise<void> {
    // Scaffold: walk files, build a tiny inverted index, or hook into embeddings later.
    const folders = vscode.workspace.workspaceFolders ?? [];
    if (folders.length === 0) return;
    // No-op placeholder
  }
}
