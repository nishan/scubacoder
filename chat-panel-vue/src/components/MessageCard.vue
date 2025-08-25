<template>
  <div class="message-card" :class="messageType">
    <!-- Error Message -->
    <div v-if="isError" class="error-message">
      <div class="error-icon">
        <i class="codicon codicon-error"></i>
      </div>
      <div class="error-content">
        <div class="error-text">{{ message.text }}</div>
        <div class="error-reason">Reason: {{ message.reason || 'Unknown error' }}</div>
        <button v-if="message.canRetry" class="try-again-btn" @click="retry">
          Try Again
        </button>
      </div>
    </div>
    
    <!-- User Message -->
    <div v-else-if="isUser" class="user-message">
      <div class="message-bubble">{{ message.text }}</div>
      <div v-if="message.fileReference" class="file-reference">
        <i class="codicon codicon-symbol-file"></i>
        {{ message.fileReference }}
      </div>
      <div v-if="message.contextFiles && message.contextFiles.length > 0" class="context-indicator">
        <i class="codicon codicon-arrow-right"></i>
        Used {{ message.contextFiles.length }} reference{{ message.contextFiles.length > 1 ? 's' : '' }}
      </div>
    </div>
    
    <!-- AI Response -->
    <div v-else class="ai-message">
      <div class="message-content" v-html="formattedContent"></div>
      <div class="message-actions">
        <button class="action-btn" @click="refresh" title="Regenerate">
          <i class="codicon codicon-refresh"></i>
        </button>
        <button class="action-btn" @click="thumbsUp" title="Thumbs Up">
          <i class="codicon codicon-thumbsup"></i>
        </button>
        <button class="action-btn" @click="thumbsDown" title="Thumbs Down">
          <i class="codicon codicon-thumbsdown"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useVSCode } from '../composables/useVSCode';

interface FileReference {
  path: string;
  type: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'error';
  text: string;
  timestamp: Date;
  fileReference?: string;
  contextFiles?: FileReference[];
  reason?: string;
  canRetry?: boolean;
}

interface Props {
  message: Message;
}

const props = defineProps<Props>();
const { postMessage } = useVSCode();

const messageType = computed(() => `message-${props.message.role}`);
const isError = computed(() => props.message.role === 'error');
const isUser = computed(() => props.message.role === 'user');

const formattedContent = computed(() => {
  if (props.message.role === 'assistant') {
    // Convert markdown-like content to HTML
    return props.message.text
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="code-block"><code>$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
      .replace(/\n/g, '<br>');
  }
  return props.message.text;
});

const retry = () => {
  postMessage({ 
    type: 'retry', 
    messageId: props.message.id,
    message: { text: props.message.text }
  });
};

const refresh = () => {
  // Send regenerate request - the extension will handle finding the user message
  postMessage({ 
    type: 'regenerate', 
    messageId: props.message.id
  });
};

const thumbsDown = () => {
  postMessage({ 
    type: 'feedback', 
    messageId: props.message.id, 
    feedback: 'negative' 
  });
};

const thumbsUp = () => {
  postMessage({ 
    type: 'feedback', 
    messageId: props.message.id, 
    feedback: 'positive' 
  });
};

const copyCode = (code: string) => {
  navigator.clipboard.writeText(code).then(() => {
    postMessage({ 
      type: 'log', 
      level: 'info', 
      message: 'Code copied to clipboard' 
    });
  });
};

const insertCode = (code: string) => {
  postMessage({ 
    type: 'insert-code', 
    code: code 
  });
};
</script>

<style scoped>
.message-card {
  margin: 8px 16px;
  padding: 12px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.message-card:hover {
  background: var(--vscode-list-hoverBackground, rgba(255, 255, 255, 0.05));
}

/* Align user messages to the right */
.user-message {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

/* Align AI messages to the left */
.ai-message {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

/* User Message Styles */
.user-message .message-bubble {
  background: #2D3748; /* Dark blue-grey background */
  color: #FFFFFF; /* White text */
  padding: 12px 16px;
  border-radius: 12px;
  max-width: 80%;
  word-wrap: break-word;
  font-size: 14px;
  line-height: 1.4;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.file-reference {
  margin-top: 8px;
  padding: 4px 8px;
  background: var(--vscode-badge-background, #4A4A4A);
  color: var(--vscode-badge-foreground, #FFFFFF);
  border-radius: 4px;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.context-indicator {
  margin-top: 8px;
  color: var(--vscode-descriptionForeground, #8C8C8C);
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.context-indicator:hover {
  color: var(--vscode-foreground, #CCCCCC);
}

/* Error Message Styles */
.error-message {
  background: var(--vscode-inputValidation-errorBackground, #5A1D1D);
  border: 1px solid var(--vscode-inputValidation-errorBorder, #BE1100);
  color: var(--vscode-errorForeground, #F48771);
  padding: 16px;
  border-radius: 8px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.error-icon {
  color: var(--vscode-errorForeground, #F48771);
  font-size: 20px;
  flex-shrink: 0;
}

.error-content {
  flex: 1;
}

.error-text {
  margin-bottom: 8px;
  font-size: 14px;
}

.error-reason {
  font-size: 12px;
  opacity: 0.8;
  margin-bottom: 12px;
}

.try-again-btn {
  background: var(--vscode-button-background, #0E639C);
  color: var(--vscode-button-foreground, #FFFFFF);
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 13px;
  transition: background-color 0.1s ease;
}

.try-again-btn:hover {
  background: var(--vscode-button-hoverBackground, #1177BB);
}

/* AI Message Styles */
.ai-message {
  background: #374151; /* Slightly lighter grey for AI messages */
  border: none;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.message-content {
  color: #FFFFFF; /* White text for better contrast on dark background */
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 12px;
}

.message-content :deep(.code-block) {
  background: var(--vscode-textCodeBlock-background, #2D2D30);
  border: 1px solid var(--vscode-textCodeBlock-border, #3C3C3C);
  border-radius: 4px;
  padding: 12px;
  margin: 8px 0;
  overflow-x: auto;
  font-family: var(--vscode-editor-font-family, 'Consolas', 'Monaco', 'Courier New', monospace);
}

.message-content :deep(.inline-code) {
  background: var(--vscode-textCodeBlock-background, #2D2D30);
  padding: 2px 4px;
  border-radius: 3px;
  font-family: var(--vscode-editor-font-family, 'Consolas', 'Monaco', 'Courier New', monospace);
}

.message-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.action-btn {
  background: transparent;
  color: var(--vscode-foreground, #CCCCCC);
  border: 1px solid var(--vscode-panel-border, #3C3C3C);
  border-radius: 4px;
  padding: 6px 8px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.1s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: var(--vscode-toolbar-hoverBackground, rgba(255, 255, 255, 0.1));
  border-color: var(--vscode-focusBorder, #007ACC);
}

.codicon {
  font-size: 14px;
}
</style>
