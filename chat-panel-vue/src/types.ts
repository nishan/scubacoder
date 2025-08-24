// Communication protocol types between VS Code extension and Vue app

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  contextUris?: string[];
}

export interface ContextFile {
  label: string;
  uri: string;
  isSelected: boolean;
}

export interface ProviderModel {
  provider: string;
  baseUrl: string;
  model: string;
  isSelected: boolean;
}

export interface ChatState {
  messages: Message[];
  selectedContextUris: string[];
  availableContextFiles: ContextFile[];
  availableProviderModels: ProviderModel[];
  currentProvider: string;
  currentModel: string;
  isLoading: boolean;
}

// Outgoing messages from Vue to VS Code
export interface OutgoingMessage {
  type: 'chat' | 'insert' | 'searchWorkspace' | 'changeProviderModel' | 'log';
  text?: string;
  code?: string;
  query?: string;
  provider?: string;
  model?: string;
  contextUris?: string[];
  level?: 'info' | 'warn' | 'error';
  message?: string;
  data?: any;
}

// Incoming messages from VS Code to Vue
export interface IncomingMessage {
  type: 'userMessage' | 'loading' | 'reply' | 'updateProviderModel' | 'searchResults';
  text?: string;
  provider?: string;
  model?: string;
  results?: any[];
}

// VS Code API interface
export interface VSCodeAPI {
  postMessage(message: OutgoingMessage): void;
  getState(): any;
  setState(state: any): void;
}

// Global VS Code API declaration
declare global {
  interface Window {
    vscode: VSCodeAPI;
    vscodeInitData?: {
      providerId: string;
      model: string;
      candidates: Array<{ label: string; uri: string; isSelected: boolean }>;
      availableProviderModels: Array<{ provider: string; baseUrl: string; model: string; isSelected: boolean }>;
    };
  }
}
