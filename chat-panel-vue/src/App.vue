<template>
  <div class="chat-panel">
    <!-- Header -->
    <ChatHeader />
    
    <!-- Messages Container -->
    <div class="messages-container">
      <div v-if="messages.length === 0" class="empty-state">
        <div class="empty-icon">
          <i class="codicon codicon-comment"></i>
        </div>
        <h3>Start a conversation</h3>
        <p>Ask me anything about your code or get help with development tasks.</p>
      </div>
      
      <MessageCard 
        v-for="message in messages" 
        :key="message.id" 
        :message="message"
      />
      
      <!-- Loading indicator -->
      <div v-if="isLoading" class="loading-message">
        <div class="loading-indicator">
          <div class="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span class="loading-text">AI is thinking...</span>
        </div>
      </div>
    </div>
    
    <!-- Input Area -->
    <ChatInput 
      :context-files="contextFiles"
      :current-file="currentFile"
      :available-agents="availableAgents"
      :selected-agent-id="selectedAgentId"
      @send="handleSendMessage"
      @new-chat="handleNewChat"
      @add-context="handleAddContext"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import ChatHeader from './components/ChatHeader.vue';
import MessageCard from './components/MessageCard.vue';
import ChatInput from './components/ChatInput.vue';
import { useVSCode } from './composables/useVSCode';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'error';
  text: string;
  timestamp: Date;
  fileReference?: string;
  contextFiles?: any[];
  reason?: string;
  canRetry?: boolean;
}

interface ContextFile {
  path: string;
  type: string;
  name: string;
}

interface Agent {
  id: string;
  name: string;
  version: string;
  provider: string;
}

const { postMessage, onMessage } = useVSCode();

// State
const messages = ref<Message[]>([]);
const isLoading = ref(false);
const contextFiles = ref<ContextFile[]>([]);
const currentFile = ref<string>('');
const availableAgents = ref<Agent[]>([]);
const selectedAgentId = ref<string>('');

// Initialize with VS Code data
onMounted(() => {
  console.log('App.vue - onMounted called');
  
  // Function to initialize the app with data
  const initializeApp = (initData: any) => {
    console.log('App.vue - initializing with data:', initData);
    
    // Convert available models to agents format
    if (initData.availableProviderModels && initData.availableProviderModels.length > 0) {
      availableAgents.value = initData.availableProviderModels.map((model: any) => ({
        id: `${model.provider}:${model.model}`, // Create unique ID combining provider and model
        name: model.provider === 'ollama' ? 'Ollama' : 'vLLM',
        version: model.model,
        provider: model.provider
      }));
      
      // Set the selected agent ID to the current provider:model combination
      selectedAgentId.value = `${initData.providerId}:${initData.model}`;
      console.log('App.vue - Using configured agents:', availableAgents.value);
    } else {
      // Fallback agents if none are configured
      availableAgents.value = [
        {
          id: 'ollama:qwen2.5-coder:7b',
          name: 'Ollama',
          version: 'qwen2.5-coder:7b',
          provider: 'ollama'
        },
        {
          id: 'vllm:qwen2.5-coder:7b',
          name: 'vLLM',
          version: 'qwen2.5-coder:7b',
          provider: 'vllm'
        }
      ];
      
      // Set default selected agent
      selectedAgentId.value = 'ollama:qwen2.5-coder:7b';
      console.log('App.vue - Using fallback agents:', availableAgents.value);
    }
    
    // Set context files from candidates
    if (initData.candidates) {
      contextFiles.value = initData.candidates.map((candidate: any) => ({
        path: candidate.label,
        type: candidate.label.split('.').pop() || 'file',
        name: candidate.label.split('/').pop() || candidate.label
      }));
    }
    
    console.log('App.vue - Final state - availableAgents:', availableAgents.value);
    console.log('App.vue - Final state - selectedAgentId:', selectedAgentId.value);
  };
  
  // Check if data is immediately available
  if (window.vscodeInitData) {
    console.log('App.vue - vscodeInitData immediately available:', window.vscodeInitData);
    initializeApp(window.vscodeInitData);
  } else {
    console.log('App.vue - vscodeInitData not immediately available, waiting...');
    
    // Wait for the data to become available (with timeout)
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max wait
    
    const waitForData = () => {
      attempts++;
      if (window.vscodeInitData) {
        console.log('App.vue - vscodeInitData received after waiting:', window.vscodeInitData);
        initializeApp(window.vscodeInitData);
      } else if (attempts < maxAttempts) {
        console.log(`App.vue - Waiting for vscodeInitData... attempt ${attempts}/${maxAttempts}`);
        setTimeout(waitForData, 100);
      } else {
        console.error('App.vue - vscodeInitData never received, using fallback');
        // Use fallback data
        initializeApp({
          providerId: 'ollama',
          model: 'qwen2.5-coder:7b',
          availableProviderModels: [],
          candidates: []
        });
      }
    };
    
    waitForData();
  }
  
  // Listen for messages from VS Code
  onMessage((message) => {
    handleVSCodeMessage(message);
  });
});

// Message handling
const handleSendMessage = (text: string) => {
  if (!text.trim()) return;
  
  // Add user message
  const userMessage: Message = {
    id: Date.now().toString(),
    role: 'user',
    text: text.trim(),
    timestamp: new Date(),
    fileReference: currentFile.value || undefined
  };
  
  messages.value.push(userMessage);
  
  // Show loading
  isLoading.value = true;
  
  // Send to VS Code
  postMessage({
    type: 'chat',
    text: text.trim(),
    contextUris: contextFiles.value.map(f => f.path)
  });
};

const handleNewChat = () => {
  messages.value = [];
  contextFiles.value = [];
  postMessage({ type: 'newChat' });
};

const handleAddContext = () => {
  postMessage({ type: 'addContext' });
};

const handleVSCodeMessage = (message: any) => {
  switch (message.type) {
    case 'reply':
      isLoading.value = false;
      const aiMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        text: message.text,
        timestamp: new Date()
      };
      
      // If this is a retry or regenerate, replace the existing message
      if (message.retryFor || message.regenerateFor) {
        const targetId = message.retryFor || message.regenerateFor;
        const existingIndex = messages.value.findIndex(m => m.id === targetId);
        if (existingIndex !== -1) {
          messages.value[existingIndex] = aiMessage;
        } else {
          messages.value.push(aiMessage);
        }
      } else {
        messages.value.push(aiMessage);
      }
      break;
      
    case 'error':
      isLoading.value = false;
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'error',
        text: message.text || 'An error occurred',
        timestamp: new Date(),
        reason: message.reason || 'Unknown error',
        canRetry: message.canRetry !== false
      };
      messages.value.push(errorMessage);
      break;
      
    case 'loading':
      isLoading.value = true;
      break;
      
    case 'updateProviderModel':
      console.log('App.vue - updateProviderModel received:', message);
      console.log('App.vue - Previous selectedAgentId:', selectedAgentId.value);
      selectedAgentId.value = `${message.provider}:${message.model}`;
      console.log('App.vue - New selectedAgentId:', selectedAgentId.value);
      
      // Show notification of model change
      postMessage({ 
        type: 'log', 
        level: 'info', 
        message: `Switched to ${message.provider} model: ${message.model}` 
      });
      break;
      
    case 'contextFiles':
      contextFiles.value = message.files || [];
      break;
      
    case 'currentFile':
      currentFile.value = message.file || '';
      break;
  }
};

// Auto-scroll to bottom when new messages arrive
import { watch, nextTick } from 'vue';
watch(messages, () => {
  nextTick(() => {
    const container = document.querySelector('.messages-container');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  });
});
</script>

<style scoped>
.chat-panel {
  background: var(--vscode-panel-background, #252526);
  color: var(--vscode-foreground, #CCCCCC);
  font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif);
  font-size: var(--vscode-font-size, 13px);
  line-height: var(--vscode-line-height, 1.4);
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
  scroll-behavior: smooth;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--vscode-descriptionForeground, #8C8C8C);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--vscode-foreground, #CCCCCC);
}

.empty-state p {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
}

/* Loading Message */
.loading-message {
  padding: 20px 16px;
  display: flex;
  justify-content: center;
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--vscode-descriptionForeground, #8C8C8C);
}

.typing-dots {
  display: flex;
  gap: 4px;
}

.typing-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--vscode-descriptionForeground, #8C8C8C);
  animation: typing 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(1) { animation-delay: -0.32s; }
.typing-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes typing {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.loading-text {
  font-size: 14px;
}

/* Scrollbar Styling */
.messages-container::-webkit-scrollbar {
  width: 8px;
}

.messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.messages-container::-webkit-scrollbar-thumb {
  background: var(--vscode-scrollbarSlider-background, #3C3C3C);
  border-radius: 4px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: var(--vscode-scrollbarSlider-hoverBackground, #4A4A4A);
}

/* Responsive Design */
@media (max-width: 768px) {
  .chat-panel {
    font-size: 14px;
  }
  
  .messages-container {
    padding: 12px 0;
  }
  
  .empty-state {
    padding: 40px 16px;
  }
}
</style>
