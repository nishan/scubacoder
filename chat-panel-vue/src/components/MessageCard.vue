<template>
  <div class="message-card" :class="[`role-${message.role}`, { loading: isLoading }]">
    <div class="message-header">
      <div class="role-badge">{{ message.role === 'user' ? 'User' : 'Assistant' }}</div>
      <div class="timestamp">{{ formatTimestamp(message.timestamp) }}</div>
    </div>
    
    <div class="message-content">
      <div v-if="message.role === 'assistant' && isLoading" class="loading-indicator">
        <div class="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
      
      <div v-else class="content-text" v-html="formatContent(message.content)"></div>
    </div>
    
    <div v-if="message.role === 'assistant' && !isLoading" class="message-actions">
      <button 
        v-if="hasCodeBlocks" 
        @click="copyCode" 
        class="action-btn"
        title="Copy code"
      >
        📋 Copy
      </button>
      <button 
        v-if="hasCodeBlocks" 
        @click="insertCode" 
        class="action-btn"
        title="Insert into editor"
      >
        ➕ Insert
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Message } from '../types';

interface Props {
  message: Message;
  isLoading?: boolean;
}

interface Emits {
  (e: 'insert-code', code: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const hasCodeBlocks = computed(() => {
  return props.message.content.includes('```');
});

const formatTimestamp = (timestamp: Date) => {
  return timestamp.toLocaleTimeString();
};

const formatContent = (content: string) => {
  // Convert markdown code blocks to HTML
  return content
    .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      const language = lang || 'text';
      return `<div class="code-block">
        <div class="code-header">${language}</div>
        <pre class="code-content" data-code="${encodeURIComponent(code.trim())}">${code.trim()}</pre>
      </div>`;
    })
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
};

const copyCode = () => {
  const codeBlocks = document.querySelectorAll('.code-content');
  if (codeBlocks.length > 0) {
    const code = Array.from(codeBlocks)
      .map(block => (block as HTMLElement).textContent)
      .join('\n\n');
    
    navigator.clipboard.writeText(code).then(() => {
      // Show feedback
      console.log('Code copied to clipboard');
    });
  }
};

const insertCode = () => {
  const codeBlocks = document.querySelectorAll('.code-content');
  if (codeBlocks.length > 0) {
    const code = Array.from(codeBlocks)
      .map(block => (block as HTMLElement).textContent)
      .join('\n\n');
    
    emit('insert-code', code);
  }
};
</script>

<style scoped>
.message-card {
  border: 1px solid var(--vscode-panel-border, #e1e4e8);
  border-radius: 8px;
  padding: 16px;
  background: var(--vscode-editor-background, #ffffff);
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin: 4px 2px;
}

.message-card:hover {
  border-color: var(--vscode-input-foreground, #0366d6);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.role-badge {
  font-size: 12px;
  color: var(--vscode-badge-foreground, #ffffff);
  background: var(--vscode-badge-background, #0366d6);
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 500;
}

.timestamp {
  font-size: 12px;
  color: var(--vscode-descriptionForeground, #586069);
}

.message-content {
  margin-bottom: 12px;
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.typing-dots {
  display: flex;
  gap: 4px;
}

.typing-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--vscode-descriptionForeground, #586069);
  animation: typing 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(1) { animation-delay: -0.32s; }
.typing-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes typing {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.content-text {
  white-space: pre-wrap;
  color: var(--vscode-foreground, #24292e);
  line-height: 1.5;
}

.code-block {
  margin: 12px 0;
  border: 1px solid var(--vscode-textCodeBlock-border, #e1e4e8);
  border-radius: 6px;
  overflow: hidden;
}

.code-header {
  background: var(--vscode-textCodeBlock-headerBackground, #f6f8fa);
  color: var(--vscode-textCodeBlock-headerForeground, #586069);
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 500;
  border-bottom: 1px solid var(--vscode-textCodeBlock-border, #e1e4e8);
}

.code-content {
  background: var(--vscode-textCodeBlock-background, #f6f8fa);
  color: var(--vscode-textCodeBlock-foreground, #24292e);
  padding: 12px;
  margin: 0;
  font-family: var(--vscode-editor-font-family, 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace);
  font-size: var(--vscode-editor-font-size, 13px);
  line-height: 1.4;
  overflow-x: auto;
  white-space: pre;
}

.inline-code {
  background: var(--vscode-textCodeBlock-background, #f6f8fa);
  color: var(--vscode-textCodeBlock-foreground, #24292e);
  padding: 2px 4px;
  border-radius: 3px;
  font-family: var(--vscode-editor-font-family, 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace);
  font-size: 0.9em;
}

.message-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.action-btn {
  background: var(--vscode-button-secondaryBackground, #f6f8fa);
  color: var(--vscode-button-secondaryForeground, #24292e);
  border: 1px solid var(--vscode-button-secondaryBorder, #e1e4e8);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--vscode-button-secondaryHoverBackground, #e1e4e8);
  border-color: var(--vscode-button-secondaryHoverBorder, #d0d7de);
}

.role-user {
  border-left: 4px solid var(--vscode-button-background, #0366d6);
}

.role-assistant {
  border-left: 4px solid var(--vscode-badge-background, #28a745);
}

.loading {
  opacity: 0.7;
}
</style>
