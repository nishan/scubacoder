
import * as vscode from 'vscode';
import { ExtensionName } from '../extension';
import { LLMProvider } from '../models/types';
import { PolicyEngine } from '../policy/engine';
import { AuditLogger } from '../audit/logger';
import { info, warn } from '../modules/log';
import { createProvider, updateProviderConfig, getProviderConfig, ProviderConfig } from '../models/providerRouter';

/**
 * ChatPanel: A richer chat UX with message cards, code blocks, copy/feedback buttons,
 * context chips, and a bottom composer similar to VS Code's chat.
 */
export class ChatPanel {
  public static current: ChatPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private readonly extUri: vscode.Uri;
  private readonly provider: LLMProvider;
  private readonly policy: PolicyEngine;
  private readonly audit: AuditLogger;
  private readonly candidates: Array<{ label: string; uri: string }> = [];

  public static createOrShow(extUri: vscode.Uri, provider: LLMProvider, policy: PolicyEngine, audit: AuditLogger) {
    const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
    if (ChatPanel.current) {
      ChatPanel.current.panel.reveal(column);
      return;
    }
    const panel = vscode.window.createWebviewPanel('scubacoder.chat', `${ExtensionName} — Chat`, column ?? vscode.ViewColumn.Two, {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [
        vscode.Uri.joinPath(extUri, 'out', 'views', 'chat-panel-vue')
      ],
      enableCommandUris: false,
      enableFindWidget: true,
      enableForms: false
    });
    ChatPanel.current = new ChatPanel(panel, extUri, provider, policy, audit);
  }

  private constructor(panel: vscode.WebviewPanel, _extUri: vscode.Uri, provider: LLMProvider, policy: PolicyEngine, audit: AuditLogger) {
    this.panel = panel;
    this.extUri = _extUri;
    this.provider = provider;
    this.policy = policy;
    this.audit = audit;

    // Initialize configuration
    const cfg = vscode.workspace.getConfiguration('scubacoder');
    const currentConfig = getProviderConfig(cfg);
    const availableProviderModels = cfg.get<any[]>('availableProviderModels', []);

    info ("VSCode URI:", this.extUri);

    // Build initial candidate context list from visible editors
    const editors = vscode.window.visibleTextEditors ?? [];
    this.candidates = editors
      .filter(e => e.document.uri.scheme === 'file' && !this.policy.isDenied(e.document.uri))
      .map(e => ({ label: vscode.workspace.asRelativePath(e.document.uri), uri: e.document.uri.toString() }));

    const nonce = this.getNonce();
    // Mark the current selection
    const markedModels = availableProviderModels.map((item: any) => ({
      ...item,
      isSelected: item.provider === currentConfig.provider && item.model === currentConfig.model
    }));
    this.panel.webview.html = this.getHtml(nonce, { 
      providerId: currentConfig.provider, 
      model: currentConfig.model, 
      candidates: this.candidates, 
      availableProviderModels: markedModels 
    });

    info('Chat panel initialized with html:', this.panel.webview.html);

    this.panel.onDidDispose(() => (ChatPanel.current = undefined));

    // Test initial connection
    this.testInitialConnection();

    this.panel.webview.onDidReceiveMessage(async (msg) => {
      try {
        info('TypeScript received message:', msg);
        switch (msg.type) {
          case 'chat': {
            info('Processing chat case');
            const text: string = msg.text ?? '';
            const maxTokens = 2048; // Increased for better responses
            const temperature = 0.3;
            const contextUris: string[] = Array.isArray(msg.contextUris) ? msg.contextUris : [];
            const useStreaming = msg.streaming ?? false; // Check if streaming is requested

            info('Sending loading to webview');
            // Show loading indicator
            this.panel.webview.postMessage({ type: 'loading' });

            try {
              info('Calling provider.chat');
              
              // Test connection before sending message
              if (this.provider.id === 'ollama') {
                const connectionTest = await (this.provider as any).testConnection();
                if (!connectionTest) {
                  throw new Error('Failed to connect to Ollama server. Please check if Ollama is running.');
                }
              }
              
              // Build context from files if available
              let contextContent = '';
              if (contextUris.length > 0) {
                contextContent = await this.buildContextFromFiles(contextUris);
              }
              
              // Enhanced system prompt with context
              const systemPrompt = contextContent 
                ? `You are a careful coding assistant. You have access to the following files:\n\n${contextContent}\n\nPrefer short, accurate answers. Return code in triple backticks. Use the file context to provide more relevant responses.`
                : 'You are a careful coding assistant. Prefer short, accurate answers. Return code in triple backticks.';
              
              info(`Streaming requested: ${useStreaming}, Provider: ${this.provider.id}`);
              if (useStreaming && this.provider.id === 'ollama') {
                info('Using streaming chat path');
                // Use streaming chat
                await this.handleStreamingChat(text, contextUris, systemPrompt, maxTokens, temperature);
              } else {
                info('Using regular chat path');
                // Use regular chat
                const res = await this.provider.chat({
                  messages: [
                    { role: 'system', content: systemPrompt }, 
                    { role: 'user', content: text }
                  ],
                  maxTokens,
                  temperature
                });

                info('Got response from provider:', res);
                this.audit.record({ 
                  kind: 'chat', 
                  model: this.provider.id, 
                  promptPreview: text.slice(0, 200), 
                  files: contextUris, 
                  timestamp: new Date().toISOString() 
                });

                info('Sending reply to webview');
                this.panel.webview.postMessage({ type: 'reply', text: res.text });
              }
            } catch (error) {
              warn('Error in provider.chat:', error);
              this.panel.webview.postMessage({ 
                type: 'error', 
                text: `Sorry, your request failed. Please try again. Request id: ${this.generateRequestId()}`,
                reason: String(error),
                canRetry: true
              });
            }
            break;
          }
          case 'insert': {
            const code: string = msg.code ?? '';
            const editor = vscode.window.activeTextEditor;
            if (editor) {
              await editor.edit(editBuilder => editBuilder.insert(editor.selection.active, code));
            }
            break;
          }
          case 'insert-code': {
            const code: string = msg.code ?? '';
            const editor = vscode.window.activeTextEditor;
            if (editor) {
              await editor.edit(editBuilder => editBuilder.insert(editor.selection.active, code));
            }
            break;
          }
          case 'searchWorkspace': {
            const q: string = (msg.query ?? '').toString();
            if (!q) { this.panel.webview.postMessage({ type: 'searchResults', results: [] }); break; }
            const uris = await vscode.workspace.findFiles('**/*', '**/node_modules/**', 200);
            const results: { file: string; line: number; preview: string }[] = [];
            for (const uri of uris) {
              try {
                const doc = await vscode.workspace.openTextDocument(uri);
                const text = doc.getText();
                const idx = text.toLowerCase().indexOf(q.toLowerCase());
                if (idx >= 0) {
                  const pos = doc.positionAt(idx);
                  const lineText = doc.lineAt(pos.line).text.trim();
                  results.push({ file: vscode.workspace.asRelativePath(uri), line: pos.line + 1, preview: lineText });
                  if (results.length >= 16) break;
                }
              } catch {}
            }
            this.panel.webview.postMessage({ type: 'searchResults', results });
            break;
          }
          case 'changeProviderModel': {
            const provider = msg.provider as string;
            const model = msg.model as string;
            
            try {
              // Update configuration
              await updateProviderConfig(vscode.workspace.getConfiguration('scubacoder'), { provider, model });
              
              // Create new provider instance and update the reference
              const newProvider = createProvider({ provider, model });
              (this as any).provider = newProvider;
              
              // Test connection to new provider
              if (newProvider.id === 'ollama') {
                const connectionTest = await (newProvider as any).testConnection();
                if (!connectionTest) {
                  warn(`Failed to connect to Ollama at ${(newProvider as any).opts?.baseUrl || 'unknown URL'}`);
                  this.panel.webview.postMessage({ 
                    type: 'error', 
                    text: `Warning: Failed to connect to Ollama server. Please check if Ollama is running.`,
                    reason: 'Connection failed',
                    canRetry: false
                  });
                } else {
                  info(`Successfully connected to Ollama with model: ${model}`);
                }
              }
              
              // Update the webview with new state
              const config = vscode.workspace.getConfiguration('scubacoder');
              const availableProviderModels = config.get<any[]>('availableProviderModels', []);
              const markedModels = availableProviderModels.map(item => ({
                ...item,
                isSelected: item.provider === provider && item.model === model
              }));
              
              // Send state update to webview
              this.panel.webview.postMessage({ 
                type: 'updateProviderModel',
                provider,
                model,
              });
              
              info(`Provider changed to ${provider} with model ${model}`);
            } catch (error) {
              warn('Failed to change provider/model:', error);
              this.panel.webview.postMessage({ 
                type: 'error', 
                text: `Failed to change provider: ${error}`,
                reason: String(error),
                canRetry: true
              });
            }
            
            break;
          }
          case 'retry': {
            // Handle retry logic for failed messages
            info('Retrying message:', msg.messageId);
            const messageId = msg.messageId;
            const message = msg.message;
            
            if (message && message.text) {
              // Retry the failed message
              this.panel.webview.postMessage({ type: 'loading' });
              
              try {
                const res = await this.provider.chat({
                  messages: [
                    { role: 'system', content: 'You are a careful coding assistant. Prefer short, accurate answers. Return code in triple backticks.' },
                    { role: 'user', content: message.text }
                  ],
                  maxTokens: 2048,
                  temperature: 0.3
                });
                
                this.panel.webview.postMessage({ 
                  type: 'reply', 
                  text: res.text,
                  retryFor: messageId 
                });
              } catch (error) {
                warn('Error in retry:', error);
                this.panel.webview.postMessage({ 
                  type: 'error', 
                  text: `Retry failed. Please try again. Request id: ${this.generateRequestId()}`,
                  reason: String(error),
                  canRetry: true
                });
              }
            }
            break;
          }
          case 'regenerate': {
            // Handle regenerate logic for AI responses
            info('Regenerating response for message:', msg.messageId);
            const messageId = msg.messageId;
            const userMessage = msg.userMessage;
            
            if (userMessage && userMessage.text) {
              // Regenerate the AI response
              this.panel.webview.postMessage({ type: 'loading' });
              
              try {
                const res = await this.provider.chat({
                  messages: [
                    { role: 'system', content: 'You are a careful coding assistant. Prefer short, accurate answers. Return code in triple backticks.' },
                    { role: 'user', content: userMessage.text }
                  ],
                  maxTokens: 2048,
                  temperature: 0.3
                });
                
                this.panel.webview.postMessage({ 
                  type: 'reply', 
                  text: res.text,
                  regenerateFor: messageId 
                });
              } catch (error) {
                warn('Error in regenerate:', error);
                this.panel.webview.postMessage({ 
                  type: 'error', 
                  text: `Regeneration failed. Please try again. Request id: ${this.generateRequestId()}`,
                  reason: String(error),
                  canRetry: true
                });
              }
            }
            break;
          }
          case 'feedback': {
            // Handle user feedback on messages
            info('User feedback:', msg.feedback, 'for message:', msg.messageId);
            // You could implement feedback logging here
            break;
          }
          case 'newChat': {
            // Handle new chat request
            info('Starting new chat');
            // Clear any existing state if needed
            break;
          }
          case 'addContext': {
            // Handle add context request
            info('Adding context');
            
            // Show file picker to add more context files
            const uris = await vscode.window.showOpenDialog({
              canSelectFiles: true,
              canSelectFolders: false,
              canSelectMany: true,
              openLabel: 'Add Context Files'
            });
            
            if (uris && uris.length > 0) {
              // Add new files to candidates
              for (const uri of uris) {
                if (uri.scheme === 'file' && !this.policy.isDenied(uri)) {
                  const relativePath = vscode.workspace.asRelativePath(uri);
                  this.candidates.push({ 
                    label: relativePath, 
                    uri: uri.toString() 
                  });
                }
              }
              
              // Update webview with new context files
              this.panel.webview.postMessage({ 
                type: 'contextFiles',
                files: this.candidates.map(c => ({
                  path: c.label,
                  type: c.label.split('.').pop() || 'file',
                  name: c.label.split('/').pop() || c.label
                }))
              });
            }
            break;
          }
          case 'openTools': {
            // Handle tools request
            info('Opening tools');
            // You could implement tools panel logic here
            break;
          }
          case 'toggleVoice': {
            // Handle voice input toggle
            info('Toggling voice input');
            // You could implement voice input logic here
            break;
          }
          case 'refresh': {
            // Handle refresh request
            info('Refreshing chat');
            // You could implement refresh logic here
            break;
          }
          case 'undo': {
            // Handle undo request
            info('Undoing last action');
            // You could implement undo logic here
            break;
          }
          case 'openSettings': {
            // Handle settings request
            info('Opening settings');
            vscode.commands.executeCommand('workbench.action.openSettings', 'scubacoder');
            break;
          }
          case 'addPanel': {
            // Handle add panel request
            info('Adding new panel');
            // You could implement panel creation logic here
            break;
          }
          case 'maximize': {
            // Handle maximize request
            info('Maximizing panel');
            // You could implement maximize logic here
            break;
          }
          case 'close': {
            // Handle close request
            info('Closing panel');
            this.panel.dispose();
            break;
          }
          case 'log': {
            const level = msg.level as string;
            const message = msg.message as string;
            const data = msg.data;
            
            if (level === 'info') {
              info(message, data);
            } else if (level === 'warn') {
              warn(message, data);
            } else if (level === 'error') {
              warn(message, data);
            }
            break;
          }

          default:
            info('Unknown message type:', msg.type);
            break;
        }
      } catch (e) {
        vscode.window.showErrorMessage(`${ExtensionName} chat error: ${String(e)}`);
      }
    });


  }

  private getJavaScriptCode(): string {
    // This is now handled by the Vue.js app
    return '';
  }

  private getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private async testInitialConnection() {
    try {
      if (this.provider.id === 'ollama') {
        const connectionTest = await (this.provider as any).testConnection();
        if (!connectionTest) {
          warn('Initial Ollama connection test failed');
          this.panel.webview.postMessage({ 
            type: 'error', 
            text: 'Warning: Cannot connect to Ollama server. Please check if Ollama is running.',
            reason: 'Initial connection failed',
            canRetry: false
          });
        } else {
          info('Initial Ollama connection test successful');
        }
      }
    } catch (error) {
      warn('Initial connection test failed:', error);
    }
  }

  /**
   * Handle streaming chat responses from Ollama
   */
  private async handleStreamingChat(
    userText: string, 
    contextUris: string[], 
    systemPrompt: string, 
    maxTokens: number, 
    temperature: number
  ) {
    try {
      info('Starting streaming chat');
      info('Provider object:', this.provider);
      info('Provider ID:', this.provider.id);
      info('Provider methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(this.provider)));
      
      // Generate messageId first
      const messageId = Date.now().toString();
      
      // Send streaming start message with messageId
      this.panel.webview.postMessage({ 
        type: 'streamingStart',
        messageId: messageId
      });
      
      // Create chat request
      const chatRequest = {
        messages: [
          { role: 'system', content: systemPrompt }, 
          { role: 'user', content: userText }
        ],
        maxTokens,
        temperature
      };
      
      // Get streaming response from Ollama
      let fullResponse = '';
      let chunkCount = 0;
      
      info('Starting to iterate over chatStream');
      
      // Test if chatStream method exists
      if (!(this.provider as any).chatStream) {
        throw new Error('chatStream method not found on provider');
      }
      
      info('chatStream method found, starting iteration');
      
      try {
        info('About to call chatStream method');
        const stream = (this.provider as any).chatStream(chatRequest);
        info('chatStream method called, got stream object:', stream);
        
        for await (const chunk of stream) {
          chunkCount++;
          fullResponse += chunk;
          info(`Received chunk ${chunkCount}: "${chunk}"`);
          
          // Send streaming chunk to frontend
          this.panel.webview.postMessage({ 
            type: 'streamingChunk', 
            chunk, 
            messageId 
          });
          info(`Sent streamingChunk to webview: ${chunk}`);
        }
      } catch (iterationError) {
        info('Error during iteration:', iterationError);
        throw iterationError;
      }
      info(`Streaming completed. Total chunks: ${chunkCount}, Full response length: ${fullResponse.length}`);
      
      // Send streaming complete message
      this.panel.webview.postMessage({ 
        type: 'streamingComplete', 
        messageId,
        fullText: fullResponse 
      });
      
      // Record in audit log
      this.audit.record({ 
        kind: 'chat', 
        model: this.provider.id, 
        promptPreview: userText.slice(0, 200), 
        files: contextUris, 
        timestamp: new Date().toISOString() 
      });
      
      info('Streaming chat completed');
      
    } catch (error) {
      warn('Error in streaming chat:', error);
      this.panel.webview.postMessage({ 
        type: 'error', 
        text: `Streaming chat failed: ${error}`,
        reason: String(error),
        canRetry: true
      });
    }
  }

  private async buildContextFromFiles(uris: string[]): Promise<string> {
    const contextContent: string[] = [];
    
    for (const uri of uris) {
      try {
        const doc = await vscode.workspace.openTextDocument(uri);
        const text = doc.getText();
        const fileName = vscode.workspace.asRelativePath(uri);
        const fileExtension = fileName.split('.').pop()?.toLowerCase();
        
        // Determine file type and provide appropriate context
        let fileType = 'Unknown';
        let contentPreview = '';
        
        if (fileExtension) {
          switch (fileExtension) {
            case 'ts':
            case 'js':
            case 'tsx':
            case 'jsx':
              fileType = 'TypeScript/JavaScript';
              // Look for imports, exports, and class/function definitions
              const lines = text.split('\n');
              const relevantLines = lines.filter(line => 
                line.includes('import ') || 
                line.includes('export ') || 
                line.includes('class ') || 
                line.includes('function ') ||
                line.includes('const ') ||
                line.includes('let ') ||
                line.includes('var ')
              ).slice(0, 10); // Limit to first 10 relevant lines
              contentPreview = relevantLines.join('\n');
              break;
              
            case 'vue':
              fileType = 'Vue Component';
              // Extract template, script, and style sections
              const templateMatch = text.match(/<template>([\s\S]*?)<\/template>/);
              const scriptMatch = text.match(/<script>([\s\S]*?)<\/script>/);
              if (templateMatch) contentPreview += `Template: ${templateMatch[1].slice(0, 100)}...\n`;
              if (scriptMatch) contentPreview += `Script: ${scriptMatch[1].slice(0, 100)}...\n`;
              break;
              
            case 'md':
              fileType = 'Markdown';
              contentPreview = text.split('\n').slice(0, 5).join('\n'); // First 5 lines
              break;
              
            case 'json':
              fileType = 'JSON Configuration';
              contentPreview = text.slice(0, 200);
              break;
              
            case 'yaml':
            case 'yml':
              fileType = 'YAML Configuration';
              contentPreview = text.split('\n').slice(0, 10).join('\n');
              break;
              
            default:
              fileType = 'Text File';
              contentPreview = text.split('\n').slice(0, 5).join('\n');
          }
        }
        
        contextContent.push(`File: ${fileName} (${fileType})`);
        if (contentPreview.trim()) {
          contextContent.push(`Content Preview:\n${contentPreview}`);
        }
        contextContent.push(`---`);
        
      } catch (error) {
        warn(`Failed to read file for context: ${uri}`, error);
        contextContent.push(`Failed to read file: ${uri}`);
      }
    }
    
    return contextContent.join('\n\n');
  }

  private getHtml(
    nonce: string,
    init: {
      providerId: string;
      model: string;
      candidates: Array<{ label: string; uri: string }>;
      availableProviderModels?: Array<{ provider: string; baseUrl: string; model: string }>;
    }
  ): string {
    const { providerId, model, candidates, availableProviderModels = [] } = init;
    
    // Get URIs for static assets
    const cssUri = this.panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this.extUri, 'out', 'views', 'chat-panel-vue', 'style.css')
    );
    const jsUri = this.panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this.extUri, 'out', 'views', 'chat-panel-vue', 'index.umd.js')
    );
    const codiconCssUri = this.panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this.extUri, 'out', 'views', 'chat-panel-vue', 'codicon.css')
    );
    
    // Create initialization data for Vue app
    const initData = {
      providerId,
      model,
      candidates: candidates.map(c => ({ ...c, isSelected: false })),
      availableProviderModels: availableProviderModels.map((item: any) => ({
        ...item,
        isSelected: item.provider === providerId && item.model === model
      }))
    };
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src ${this.panel.webview.cspSource}; script-src 'nonce-${nonce}' ${jsUri}; connect-src 'none'; font-src ${this.panel.webview.cspSource}; object-src 'none'; media-src 'none'; frame-src 'none'; worker-src 'none'; manifest-src 'none'; base-uri 'none';" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>ScubaCoder — Chat</title>
        <link rel="stylesheet" href="${cssUri}" />
        <link rel="stylesheet" href="${codiconCssUri}" />
      </head>
      <body>
        <div id="app">
          <!-- Vue app will mount here -->
          <div style="padding: 20px; text-align: center; color: #666;">
            Loading chat interface...<br>
            <small>Initialization data: ${JSON.stringify(initData).substring(0, 200)}...</small>
          </div>
        </div>
        
        <script nonce="${nonce}">
          const vscode = acquireVsCodeApi();
          window.vscode = vscode;
          
          // Safe serialization function for postMessage
          function safeSerialize(obj) {
            try {
              // Handle primitive types
              if (obj === null || obj === undefined) return obj;
              if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') return obj;
              
              // Handle arrays
              if (Array.isArray(obj)) {
                return obj.map(item => safeSerialize(item));
              }
              
              // Handle objects
              if (typeof obj === 'object') {
                const result = {};
                for (const key in obj) {
                  if (obj.hasOwnProperty(key)) {
                    try {
                      result[key] = safeSerialize(obj[key]);
                    } catch (e) {
                      result[key] = '[Non-serializable value]';
                    }
                  }
                }
                return result;
              }
              
              // Handle functions and other non-serializable types
              return '[Non-serializable value]';
            } catch (e) {
              return '[Serialization error]';
            }
          }
          
          // Override console methods to send logs to VS Code
          ['log','warn','error'].forEach(level => {
            const original = console[level].bind(console);
            console[level] = (...args) => {
              try {
                // Safely serialize the args before sending
                const safeData = safeSerialize(args);
                vscode.postMessage({ 
                  type: 'log', 
                  level, 
                  message: args.map(arg => String(arg)).join(' '), 
                  data: safeData 
                });
              } catch (e) {
                // Fallback if serialization fails
                vscode.postMessage({ 
                  type: 'log', 
                  level, 
                  message: 'Console message (serialization failed)', 
                  data: null 
                });
              }
              original(...args);
            };
          });
          
          // Initialize the Vue app with extension data
          console.log('Chat panel initialization started');
          console.log('Init data:', ${JSON.stringify(initData)});
          
          // Set the initialization data BEFORE loading the Vue app
          window.vscodeInitData = ${JSON.stringify(initData)};
          console.log('vscodeInitData set:', window.vscodeInitData);
        </script>
        
        <script nonce="${nonce}" src="${jsUri}"></script>
        <script nonce="${nonce}">
          // Verify the Vue app loaded and can access the data
          if (typeof ScubaCoderChatPanel !== 'undefined') {
            console.log('Vue app found, checking initialization data...');
            console.log('Available vscodeInitData:', window.vscodeInitData);
            
            if (window.vscodeInitData) {
              console.log('Vue app initialized with data successfully');
            } else {
              console.error('vscodeInitData is missing when Vue app loads');
            }
          } else {
            console.error('Vue app failed to load');
            document.getElementById('app').innerHTML = '<div style="padding: 20px; text-align: center; color: #f44336;">Failed to load chat interface - Vue app not found</div>';
          }
        </script>
      </body>
      </html>
    `;
  }
}
