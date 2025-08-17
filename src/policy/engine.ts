
import * as vscode from 'vscode';
import * as path from 'path';
import { minimatch } from 'minimatch';

export class PolicyEngine {
  constructor(private denyGlobs: string[]) {}

  updateDenyGlobs(globs: string[]) { this.denyGlobs = globs; }

  isDenied(uri: vscode.Uri): boolean {
    if (uri.scheme !== 'file') return false;
    const rel = vscode.workspace.asRelativePath(uri);
    return this.denyGlobs.some(g => minimatch(rel, g));
  }

  redact(text: string): string {
    // Scaffold: add richer redaction rules as needed
    // Simple examples:
    text = text.replace(/(api[_-]?key|secret|token)\s*[:=]\s*[^\n]+/gi, '$1=***');
    text = text.replace(/-----BEGIN [\s\S]*?PRIVATE KEY-----[\s\S]*?-----END [\s\S]*?PRIVATE KEY-----/g, '***REDACTED KEY***');
    return text;
  }
}
