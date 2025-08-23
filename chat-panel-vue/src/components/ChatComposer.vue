<template>
  <div class="chat-composer">
    <div class="composer-header">
      <span class="composer-title">Ask ScubaCoder</span>
      <span v-if="hasContext" class="context-indicator">
        {{ contextCount }} context file{{ contextCount !== 1 ? 's' : '' }} selected
      </span>
    </div>
    
    <div class="input-container">
      <textarea
        v-model="inputText"
        @keydown="handleKeydown"
        @input="handleInput"
        placeholder="Ask a question about your codebase... (Shift+Enter = newline)"
        class="chat-input"
        :disabled="isLoading"
        ref="inputRef"
      ></textarea>
      
      <div class="input-actions">
        <button
          @click="sendMessage"
          :disabled="!canSend || isLoading"
          class="send-button"
          :class="{ loading: isLoading }"
        >
          <span v-if="!isLoading">Send</span>
          <span v-else class="loading-spinner">⏳</span>
        </button>
        
        <div class="input-tips">
          <span class="tip">Shift+Enter for new line</span>
          <span v-if="hasContext" class="tip context-tip">
            Context files will be included
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue';

interface Props {
  isLoading: boolean;
  hasContext: boolean;
  contextCount: number;
}

interface Emits {
  (e: 'send-message', text: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const inputText = ref('');
const inputRef = ref<HTMLTextAreaElement>();

const canSend = computed(() => {
  return inputText.value.trim().length > 0 && !props.isLoading;
});

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
};

const handleInput = () => {
  // Auto-resize textarea
  if (inputRef.value) {
    inputRef.value.style.height = 'auto';
    inputRef.value.style.height = Math.min(inputRef.value.scrollHeight, 200) + 'px';
  }
};

const sendMessage = () => {
  const text = inputText.value.trim();
  if (!text || !canSend.value) return;
  
  emit('send-message', text);
  inputText.value = '';
  
  // Reset textarea height
  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.style.height = 'auto';
    }
  });
};

// Focus input when component mounts
const focusInput = () => {
  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.focus();
    }
  });
};

// Auto-focus when loading state changes
watch(() => props.isLoading, (newLoading, oldLoading) => {
  if (oldLoading && !newLoading) {
    // Focus input after response is received
    focusInput();
  }
});

// Focus on mount
focusInput();
</script>

<style scoped>
.chat-composer {
  border-top: 1px solid var(--vscode-panel-border, #e1e4e8);
  padding: 16px;
  background: var(--vscode-editor-background, #ffffff);
}

.composer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.composer-title {
  font-weight: 600;
  color: var(--vscode-foreground, #24292e);
  font-size: 14px;
}

.context-indicator {
  font-size: 12px;
  color: var(--vscode-badge-foreground, #ffffff);
  background: var(--vscode-badge-background, #0366d6);
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.input-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-input {
  width: 100%;
  min-height: 80px;
  max-height: 200px;
  resize: vertical;
  background: var(--vscode-input-background, #ffffff);
  color: var(--vscode-input-foreground, #24292e);
  border: 1px solid var(--vscode-input-border, #e1e4e8);
  border-radius: 8px;
  padding: 12px;
  font-family: var(--vscode-editor-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
  font-size: 14px;
  line-height: 1.5;
  transition: all 0.2s;
  outline: none;
}

.chat-input:focus {
  border-color: var(--vscode-focusBorder, #0366d6);
  box-shadow: 0 0 0 2px var(--vscode-focusBorder, #0366d6);
}

.chat-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.chat-input::placeholder {
  color: var(--vscode-input-placeholderForeground, #586069);
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.send-button {
  background: var(--vscode-button-background, #0366d6);
  color: var(--vscode-button-foreground, #ffffff);
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-button:hover:not(:disabled) {
  background: var(--vscode-button-hoverBackground, #0256b3);
  transform: translateY(-1px);
}

.send-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.send-button.loading {
  background: var(--vscode-descriptionForeground, #586069);
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.input-tips {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
}

.tip {
  font-size: 11px;
  color: var(--vscode-descriptionForeground, #586069);
}

.context-tip {
  color: var(--vscode-badge-foreground, #ffffff);
  background: var(--vscode-badge-background, #0366d6);
  padding: 2px 6px;
  border-radius: 8px;
  font-weight: 500;
}

@media (max-width: 600px) {
  .input-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .input-tips {
    align-items: center;
  }
}
</style>
