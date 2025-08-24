// Message types for the chat system
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'error';
  text: string;
  timestamp: Date;
  fileReference?: string;
  contextFiles?: ContextFile[];
  reason?: string;
  canRetry?: boolean;
}

// Context file information
export interface ContextFile {
  path: string;
  type: string;
  name: string;
  isSelected?: boolean;
}

// Agent/Model information
export interface Agent {
  id: string;
  name: string;
  version: string;
  provider: string;
  isSelected?: boolean;
}

// VS Code message types
export interface OutgoingMessage {
  type: string;
  [key: string]: any;
}

export interface IncomingMessage {
  type: string;
  [key: string]: any;
}

// Chat-specific message types
export interface ChatMessage extends OutgoingMessage {
  type: 'chat';
  text: string;
  contextUris?: string[];
}

export interface InsertCodeMessage extends OutgoingMessage {
  type: 'insert-code';
  code: string;
}

export interface ChangeProviderModelMessage extends OutgoingMessage {
  type: 'changeProviderModel';
  provider: string;
  model: string;
}

export interface RetryMessage extends OutgoingMessage {
  type: 'retry';
  messageId: string;
}

export interface RegenerateMessage extends OutgoingMessage {
  type: 'regenerate';
  messageId: string;
}

export interface FeedbackMessage extends OutgoingMessage {
  type: 'feedback';
  messageId: string;
  feedback: 'positive' | 'negative';
}

// VS Code response message types
export interface ReplyMessage extends IncomingMessage {
  type: 'reply';
  text: string;
}

export interface ErrorMessage extends IncomingMessage {
  type: 'error';
  text: string;
  reason?: string;
  canRetry?: boolean;
}

export interface LoadingMessage extends IncomingMessage {
  type: 'loading';
}

export interface UpdateProviderModelMessage extends IncomingMessage {
  type: 'updateProviderModel';
  provider: string;
  model: string;
}

export interface ContextFilesMessage extends IncomingMessage {
  type: 'contextFiles';
  files: ContextFile[];
}

export interface CurrentFileMessage extends IncomingMessage {
  type: 'currentFile';
  file: string;
}

// VS Code initialization data
export interface VSCodeInitData {
  providerId: string;
  model: string;
  candidates: Array<{ label: string; uri: string; isSelected: boolean }>;
  availableProviderModels: Array<{ provider: string; baseUrl: string; model: string; isSelected: boolean }>;
}
