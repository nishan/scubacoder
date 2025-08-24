<template>
  <div class="chat-input-container">
    <!-- Context Files Section -->
    <div v-if="contextFiles.length > 0" class="context-files">
      <div class="context-header">
        <span class="files-count">{{ contextFiles.length }} file{{ contextFiles.length > 1 ? 's' : '' }} changed</span>
      </div>
      <div class="file-list">
        <div v-for="file in contextFiles" :key="file.path" class="file-item">
          <i :class="getFileIcon(file.type)"></i>
          <span class="file-path">{{ file.path }}</span>
        </div>
      </div>
    </div>
    
    <!-- Input Area -->
    <div class="input-area">
      <div class="input-actions">
        <button class="context-btn" @click="addContext">
          <i class="codicon codicon-add"></i>
          Add Context...
        </button>
        <div v-if="currentFile" class="current-file">
          <i class="codicon codicon-eye"></i>
          {{ currentFile }}
        </div>
      </div>
      
      <div class="input-container">
        <textarea 
          v-model="inputText"
          class="chat-textarea"
          placeholder="Ask me anything..."
          @keydown.enter.exact="sendMessage"
          @keydown.enter.shift.exact="newLine"
          ref="textareaRef"
        ></textarea>
        
        <div class="input-controls">
          <div class="agent-selector" @click="toggleAgentSelector">
            <span class="agent-label">Agent</span>
            <span class="agent-model">{{ selectedAgent }}</span>
            <i class="codicon codicon-chevron-down"></i>
          </div>
          
          <div class="action-buttons">
            <button class="tool-btn" @click="openTools" title="Tools">
              <i class="codicon codicon-tools"></i>
            </button>
            <button class="voice-btn" @click="toggleVoice" title="Voice Input">
              <i class="codicon codicon-mic"></i>
            </button>
            <button class="send-btn" @click="sendMessage" :disabled="!inputText.trim()" title="Send Message">
              <i class="codicon codicon-play"></i>
            </button>
            <button class="new-chat-btn" @click="newChat" title="New Chat">
              <i class="codicon codicon-plus"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Agent Selector Dropdown -->
    <div v-if="showAgentSelector" class="agent-dropdown">
      <div 
        v-for="agent in availableAgents" 
        :key="agent.id"
        class="agent-option"
        @click="selectAgent(agent)"
      >
        <span class="agent-name">{{ agent.name }}</span>
        <span class="agent-version">{{ agent.version }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { useVSCode } from '../composables/useVSCode';

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

interface Props {
  contextFiles?: ContextFile[];
  currentFile?: string;
  availableAgents?: Agent[];
  selectedAgentId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  contextFiles: () => [],
  availableAgents: () => [],
  selectedAgentId: ''
});

const emit = defineEmits<{
  send: [text: string];
  newChat: [];
  addContext: [];
}>();

const { postMessage } = useVSCode();

const inputText = ref('');
const showAgentSelector = ref(false);
const textareaRef = ref<HTMLTextAreaElement>();

const selectedAgent = computed(() => {
  const agent = props.availableAgents.find(a => a.id === props.selectedAgentId);
  return agent ? `${agent.name} (${agent.version})` : 'Select Agent';
});

const getFileIcon = (type: string) => {
  switch (type) {
    case 'ts':
    case 'js':
      return 'codicon codicon-symbol-class';
    case 'vue':
      return 'codicon codicon-symbol-class';
    case 'md':
      return 'codicon codicon-markdown';
    default:
      return 'codicon codicon-symbol-file';
  }
};

const sendMessage = () => {
  if (inputText.value.trim()) {
    emit('send', inputText.value.trim());
    inputText.value = '';
    nextTick(() => {
      textareaRef.value?.focus();
    });
  }
};

const newLine = (event: KeyboardEvent) => {
  event.preventDefault();
  inputText.value += '\n';
};

const addContext = () => {
  emit('addContext');
};

const newChat = () => {
  emit('newChat');
};

const toggleAgentSelector = () => {
  showAgentSelector.value = !showAgentSelector.value;
};

const selectAgent = (agent: Agent) => {
  postMessage({ type: 'changeProviderModel', provider: agent.provider, model: agent.id });
  showAgentSelector.value = false;
};

const openTools = () => {
  postMessage({ type: 'openTools' });
};

const toggleVoice = () => {
  postMessage({ type: 'toggleVoice' });
};

// Auto-resize textarea
const resizeTextarea = () => {
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto';
    textareaRef.value.style.height = Math.min(textareaRef.value.scrollHeight, 200) + 'px';
  }
};

// Watch for input changes to resize
import { watch } from 'vue';
watch(inputText, resizeTextarea);
</script>

<style scoped>
.chat-input-container {
  border-top: 1px solid var(--vscode-panel-border, #3C3C3C);
  background: var(--vscode-panel-background, #252526);
  position: relative;
}

/* Context Files Section */
.context-files {
  padding: 12px 16px;
  border-bottom: 1px solid var(--vscode-panel-border, #3C3C3C);
  background: var(--vscode-list-hoverBackground, rgba(255, 255, 255, 0.05));
}

.context-header {
  margin-bottom: 8px;
}

.files-count {
  font-size: 12px;
  color: var(--vscode-descriptionForeground, #8C8C8C);
  font-weight: 500;
}

.file-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: var(--vscode-badge-background, #4A4A4A);
  color: var(--vscode-badge-foreground, #FFFFFF);
  border-radius: 4px;
  font-size: 12px;
  max-width: 200px;
}

.file-item .codicon {
  font-size: 12px;
  flex-shrink: 0;
}

.file-path {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Input Area */
.input-area {
  padding: 16px;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.context-btn {
  background: var(--vscode-button-secondaryBackground, #3C3C3C);
  color: var(--vscode-button-secondaryForeground, #CCCCCC);
  border: 1px solid var(--vscode-button-secondaryBorder, #3C3C3C);
  border-radius: 4px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.1s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.context-btn:hover {
  background: var(--vscode-button-secondaryHoverBackground, #4A4A4A);
  border-color: var(--vscode-focusBorder, #007ACC);
}

.current-file {
  color: var(--vscode-descriptionForeground, #8C8C8C);
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Input Container */
.input-container {
  position: relative;
}

.chat-textarea {
  background: var(--vscode-input-background, #3C3C3C);
  color: var(--vscode-input-foreground, #CCCCCC);
  border: 1px solid var(--vscode-input-border, #3C3C3C);
  border-radius: 6px;
  padding: 12px;
  font-family: inherit;
  font-size: 14px;
  resize: none;
  min-height: 60px;
  max-height: 200px;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.1s ease;
}

.chat-textarea:focus {
  outline: none;
  border-color: var(--vscode-focusBorder, #007ACC);
}

.chat-textarea::placeholder {
  color: var(--vscode-input-placeholderForeground, #8C8C8C);
}

/* Input Controls */
.input-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.agent-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--vscode-dropdown-background, #3C3C3C);
  border: 1px solid var(--vscode-dropdown-border, #3C3C3C);
  border-radius: 4px;
  cursor: pointer;
  transition: border-color 0.1s ease;
  min-width: 200px;
}

.agent-selector:hover {
  border-color: var(--vscode-focusBorder, #007ACC);
}

.agent-label {
  font-size: 12px;
  color: var(--vscode-descriptionForeground, #8C8C8C);
}

.agent-model {
  font-size: 12px;
  color: var(--vscode-foreground, #CCCCCC);
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.tool-btn, .voice-btn, .send-btn, .new-chat-btn {
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
  min-width: 32px;
  min-height: 32px;
}

.tool-btn:hover, .voice-btn:hover, .new-chat-btn:hover {
  background: var(--vscode-toolbar-hoverBackground, rgba(255, 255, 255, 0.1));
  border-color: var(--vscode-focusBorder, #007ACC);
}

.send-btn {
  background: var(--vscode-button-background, #0E639C);
  color: var(--vscode-button-foreground, #FFFFFF);
  border-color: var(--vscode-button-background, #0E639C);
}

.send-btn:hover {
  background: var(--vscode-button-hoverBackground, #1177BB);
  border-color: var(--vscode-button-hoverBackground, #1177BB);
}

.send-btn:disabled {
  background: var(--vscode-button-secondaryBackground, #3C3C3C);
  color: var(--vscode-button-secondaryForeground, #8C8C8C);
  border-color: var(--vscode-button-secondaryBorder, #3C3C3C);
  cursor: not-allowed;
}

/* Agent Dropdown */
.agent-dropdown {
  position: absolute;
  bottom: 100%;
  left: 16px;
  right: 16px;
  background: var(--vscode-dropdown-background, #3C3C3C);
  border: 1px solid var(--vscode-dropdown-border, #3C3C3C);
  border-radius: 4px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  max-height: 200px;
  overflow-y: auto;
}

.agent-option {
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background-color 0.1s ease;
}

.agent-option:hover {
  background: var(--vscode-list-hoverBackground, rgba(255, 255, 255, 0.1));
}

.agent-name {
  font-size: 13px;
  color: var(--vscode-foreground, #CCCCCC);
}

.agent-version {
  font-size: 11px;
  color: var(--vscode-descriptionForeground, #8C8C8C);
}

.codicon {
  font-size: 14px;
}
</style>
