
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { warn } from '../modules/log';

export class AuditLogger {
  private logPath: string | undefined;
  constructor(storageUri: vscode.Uri, private enabled: boolean) {
    try {
      const p = path.join(storageUri.fsPath, 'audit');
      fs.mkdirSync(p, { recursive: true });
      this.logPath = path.join(p, 'events.jsonl');
    } catch {}
  }

  record(entry: any) {
    if (!this.enabled || !this.logPath) return;
    try {
      fs.appendFileSync(this.logPath, JSON.stringify(entry) + '\n');
    } catch (e) {
      warn('Audit log write failed', e);
    }
  }
}
