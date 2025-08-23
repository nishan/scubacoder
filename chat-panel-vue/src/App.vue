<template>
  <div id="app" class="chat-panel-app">
    <div class="app-header">
      <h1 class="app-title">ScubaCoder — Chat</h1>
      <div class="app-subtitle">AI-powered coding assistant</div>
    </div>
    
    <div class="messages-container" ref="messagesContainer">
      <MessageCard
        v-for="message in messages"
        :key="message.id"
        :message="message"
        :is-loading="false"
        @insert-code="insertCode"
      />
      
      <!-- Loading indicator -->
      <div v-if="isLoading" class="loading-message">
        <MessageCard
          :message="{
            id: 'loading',
            role: 'assistant',
            content: 'Thinking...',
            timestamp: new Date()
          }"
          :is-loading="true"
        />
      </div>
    </div>
    
    <ContextPills
      :available-files="availableContextFiles"
      :selected-uris="selectedContextUris"
      @toggle-file="toggleContextFile"
      @add-context="addContext"
      @clear-selection="clearContextSelection"
    />
    
    <ProviderSelector
      :available-models="availableProviderModels"
      :current-provider="currentProvider"
      :current-model="currentModel"
      @change-provider-model="changeProviderModel"
    />
    
    <ChatComposer
      :is-loading="isLoading"
      :has-context="hasSelectedContext"
      :context-count="contextSelectionCount"
      @send-message="sendMessage"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import MessageCard from './components/MessageCard.vue';
import ContextPills from './components/ContextPills.vue';
import ProviderSelector from './components/ProviderSelector.vue';
import ChatComposer from './components/ChatComposer.vue';
import { useChat } from './composables/useChat';
import type { ContextFile, ProviderModel } from './types';

// Initialize chat functionality
const {
  messages,
  selectedContextUris,
  availableContextFiles,
  availableProviderModels,
  currentProvider,
  currentModel,
  isLoading,
  initializeChat,
  sendMessage: sendChatMessage,
  toggleContextFile,
  changeProviderModel,
  insertCode,
  logMessage,
  unsubscribe
} = useChat();

// Refs
const messagesContainer = ref<HTMLElement>();

// Computed
const hasSelectedContext = computed(() => selectedContextUris.value.length > 0);
const contextSelectionCount = computed(() => selectedContextUris.value.length);

// Methods
const sendMessage = (text: string) => {
  sendChatMessage();
};

const addContext = () => {
  logMessage('info', 'Add context functionality would be implemented here');
};

const clearContextSelection = () => {
  selectedContextUris.value.length = 0;
};

// Auto-scroll to bottom when new messages arrive
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

// Watch for new messages and scroll to bottom
watch(messages, () => {
  scrollToBottom();
}, { deep: true });

// Initialize the chat
onMounted(() => {
  initializeChat();
  
  // Initialize context files from props if available
  if (window.vscode) {
    try {
      const state = window.vscode.getState();
      if (state && state.candidates) {
        availableContextFiles.value = state.candidates.map((candidate: any) => ({
          label: candidate.label,
          uri: candidate.uri,
          isSelected: false
        }));
      }
      if (state && state.availableProviderModels) {
        availableProviderModels.value = state.availableProviderModels;
      }
      if (state && state.providerId) {
        currentProvider.value = state.providerId;
      }
      if (state && state.model) {
        currentModel.value = state.model;
      }
    } catch (error) {
      console.warn('Failed to initialize from VSCode state:', error);
    }
  }
  
  // Update context file selection state
  watch(selectedContextUris, (newUris) => {
    availableContextFiles.value.forEach(file => {
      file.isSelected = newUris.includes(file.uri);
    });
  });
});

// Cleanup
onUnmounted(() => {
  unsubscribe();
});
</script>

<style>
/* Global styles */
* {
  box-sizing: border-box;
}

html, body {
  height: 100%;
  margin: 0;
  padding: 0;
  font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
  font-size: var(--vscode-font-size, 13px);
  line-height: 1.4;
}

#app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--vscode-editor-background, #ffffff);
  color: var(--vscode-foreground, #24292e);
}

.chat-panel-app {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.app-header {
  padding: 16px;
  border-bottom: 1px solid var(--vscode-panel-border, #e1e4e8);
  background: var(--vscode-editor-background, #ffffff);
  flex-shrink: 0;
}

.app-title {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--vscode-foreground, #24292e);
}

.app-subtitle {
  margin: 0;
  font-size: 13px;
  color: var(--vscode-descriptionForeground, #586069);
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: var(--vscode-editor-background, #ffffff);
}

.loading-message {
  opacity: 0.7;
}

/* Scrollbar styling */
.messages-container::-webkit-scrollbar {
  width: 8px;
}

.messages-container::-webkit-scrollbar-track {
  background: var(--vscode-scrollbarSlider-background, #f1f1f1);
  border-radius: 4px;
}

.messages-container::-webkit-scrollbar-thumb {
  background: var(--vscode-scrollbarSlider-foreground, #c1c1c1);
  border-radius: 4px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: var(--vscode-scrollbarSlider-hoverBackground, #a8a8a8);
}

/* Responsive design */
@media (max-width: 768px) {
  .app-header {
    padding: 12px;
  }
  
  .app-title {
    font-size: 16px;
  }
  
  .messages-container {
    padding: 12px;
    gap: 12px;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  :root {
    --vscode-editor-background: #1e1e1e;
    --vscode-foreground: #d4d4d4;
    --vscode-panel-border: #3c3c3c;
    --vscode-input-background: #3c3c3c;
    --vscode-input-foreground: #cccccc;
    --vscode-button-background: #0e639c;
    --vscode-button-foreground: #ffffff;
    --vscode-badge-background: #0e639c;
    --vscode-badge-foreground: #ffffff;
  }
}
</style>
