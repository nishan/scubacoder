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
        </button>
        <div v-if="currentFile" class="current-file">
          <i class="codicon codicon-eye"></i>
          {{ currentFile }}
        </div>
      </div>
      
      <div class="input-container">
        <!-- Top input elements -->
        <div class="input-top-elements">
          <button class="mention-btn" title="Mentions/Commands">
            <span>@</span>
          </button>
          <div class="tab-indicator" v-if="contextFiles.length > 0">
            <i class="codicon codicon-symbol-file"></i>
            <span>{{ contextFiles.length }} Tab{{ contextFiles.length > 1 ? 's' : '' }}</span>
          </div>
        </div>
        
        <!-- Main textarea -->
        <textarea 
          v-model="inputText"
          class="chat-textarea"
          placeholder="Plan, search, build anything... privately."
          @keydown.enter.exact="sendMessage"
          @keydown.enter.shift.exact="newLine"
          ref="textareaRef"
        ></textarea>
        
        <!-- Bottom controls -->
        <div class="input-bottom-controls">
          <div class="left-controls">
            <button class="agent-btn" @click="toggleAgentSelector">
              <i class="codicon codicon-infinity"></i>
              <span>{{ selectedAgentDisplayName }}</span>
            </button>
            
            <!-- Agent Selector Dropdown -->
            <div v-if="showAgentSelector" class="agent-dropdown">
              <div 
                v-for="agent in availableAgents" 
                :key="agent.id"
                class="agent-option"
                @click="selectAgent(agent)"
                @keydown="handleAgentKeydown($event, agent)"
                tabindex="0"
                role="button"
                :aria-label="`Select ${agent.provider} model ${agent.version}`"
              >
                <div class="selection-indicator">
                  <i v-if="agent.id === selectedAgentId" class="codicon codicon-check selection-check"></i>
                </div>
                <span class="model-name">{{ agent.version }}</span>
                <span class="provider-name">{{ agent.provider === 'ollama' ? 'Ollama' : 'vLLM' }}</span>
              </div>
            </div>
          </div>
          
          <div class="right-controls">
            <!-- Floating send button -->
            <button 
              class="floating-send-btn" 
              @click="sendMessage" 
              :disabled="!inputText.trim()" 
              title="Send Message"
            >
              <i class="codicon codicon-arrow-up"></i>
            </button>
          </div>
        </div>
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
  selectedAgentDisplayName?: string;
}

const props = withDefaults(defineProps<Props>(), {
  contextFiles: () => [],
  availableAgents: () => [],
  selectedAgentId: '',
  selectedAgentDisplayName: 'Select Agent'
});

const emit = defineEmits<{
  send: [text: string, streaming: boolean];
  newChat: [];
  addContext: [];
  selectAgent: [agent: Agent];
}>();

const { postMessage } = useVSCode();

const inputText = ref('');
const showAgentSelector = ref(false);
const textareaRef = ref<HTMLTextAreaElement>();



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
    emit('send', inputText.value.trim(), true); // Always enable streaming
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
  console.log('ChatInput - toggleAgentSelector - availableAgents:', props.availableAgents);
  console.log('ChatInput - toggleAgentSelector - showAgentSelector before:', showAgentSelector.value);
  
  if (!showAgentSelector.value) {
    // Opening the dropdown
    showAgentSelector.value = true;
    // Position the dropdown after it's rendered
    nextTick(() => {
      console.log('ChatInput - toggleAgentSelector - positionDropdown called');
      positionDropdown();
    });
  } else {
    // Closing the dropdown
    showAgentSelector.value = false;
  }
  
  console.log('ChatInput - toggleAgentSelector - showAgentSelector after:', showAgentSelector.value);
};

const selectAgent = (agent: Agent) => {
  console.log('ChatInput - selectAgent called with:', agent);
  
  // Emit the selection to parent component
  emit('selectAgent', agent);
  
  // Close the dropdown
  showAgentSelector.value = false;
  
  // Add visual feedback
  const agentBtn = document.querySelector('.agent-btn');
  if (agentBtn) {
    agentBtn.classList.add('agent-changed');
    setTimeout(() => {
      agentBtn.classList.remove('agent-changed');
    }, 1000);
  }
};

// Handle keyboard navigation in agent selector
const handleAgentKeydown = (event: KeyboardEvent, agent: Agent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    selectAgent(agent);
  }
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

// Watch for changes in availableAgents prop
watch(() => props.availableAgents, (newAgents, oldAgents) => {
  console.log('ChatInput - availableAgents prop changed:', { old: oldAgents, new: newAgents });
  console.log('ChatInput - availableAgents length:', newAgents?.length);
  console.log('ChatInput - availableAgents content:', newAgents);
}, { immediate: true });

// Watch for changes in selectedAgentId prop
watch(() => props.selectedAgentId, (newId, oldId) => {
  console.log('ChatInput - selectedAgentId prop changed:', { old: oldId, new: newId });
  console.log('ChatInput - Current availableAgents:', props.availableAgents);
  console.log('ChatInput - Found agent for new ID:', props.availableAgents.find(a => a.id === newId));
}, { immediate: true });

// Debug when component mounts
import { onMounted } from 'vue';
onMounted(() => {
  console.log('ChatInput - Component mounted');
  console.log('ChatInput - Initial props - availableAgents:', props.availableAgents);
  console.log('ChatInput - Initial props - selectedAgentId:', props.selectedAgentId);
  console.log('ChatInput - Initial selectedAgent computed:', selectedAgent.value);
  
  // Add window resize listener for dropdown positioning
  window.addEventListener('resize', handleWindowResize);
  
  // Add scroll listener for dropdown positioning
  window.addEventListener('scroll', handleScroll, true);
  document.addEventListener('scroll', handleScroll, true);
  
  // Setup mutation observer for dropdown content changes
  //setupDropdownObserver();
});



// Handle window resize to reposition dropdown if needed
const handleWindowResize = () => {
  if (showAgentSelector.value) {
    nextTick(() => {
      positionDropdown();
    });
  }
};

// Handle scroll to reposition dropdown if needed
const handleScroll = () => {
  if (showAgentSelector.value) {
    nextTick(() => {
      positionDropdown();
    });
  }
};

// Cleanup on unmount
import { onUnmounted } from 'vue';
onUnmounted(() => {
  window.removeEventListener('resize', handleWindowResize);
  window.removeEventListener('scroll', handleScroll, true);
  document.removeEventListener('scroll', handleScroll, true);
  document.removeEventListener('click', handleClickOutside);
  
  // Cleanup mutation observer
  if ((window as any).dropdownObserver) {
    (window as any).dropdownObserver.disconnect();
  }
});

// Handle clicks outside dropdown to close it
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.agent-btn') && !target.closest('.agent-dropdown')) {
    showAgentSelector.value = false;
  }
};

// Add click outside listener when dropdown opens
watch(showAgentSelector, (isOpen) => {
  if (isOpen) {
    // Use nextTick to ensure the dropdown is rendered before adding the listener
    nextTick(() => {
      document.addEventListener('click', handleClickOutside);
    });
  } else {
    document.removeEventListener('click', handleClickOutside);
  }
});

// Position dropdown to stay within viewport
const positionDropdown = () => {
  const dropdown = document.querySelector('.agent-dropdown') as HTMLElement;
  const button = document.querySelector('.agent-btn') as HTMLElement;
  
  if (!dropdown || !button) {
    console.warn('Positioning failed: dropdown or button not found');
    return;
  }
  
  console.log('Starting dropdown positioning...');
  
  // Get button position relative to viewport
  const buttonRect = button.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  
  // Reset all positioning styles
  dropdown.style.top = '';
  dropdown.style.bottom = '';
  dropdown.style.left = '';
  dropdown.style.right = '';
  dropdown.style.transform = '';
  
  // First, position the dropdown to get its dimensions
  dropdown.style.top = 'calc(100% + 8px)';
  dropdown.style.left = '0';
  
  // Force a reflow to get accurate dimensions
  dropdown.offsetHeight;
  
  // Get dropdown dimensions
  const dropdownHeight = dropdown.offsetHeight;
  const dropdownWidth = dropdown.offsetWidth;
  
  console.log('Dropdown dimensions:', { dropdownHeight, dropdownWidth });
  console.log('Button position:', buttonRect);
  console.log('Viewport:', { viewportHeight, viewportWidth });
  
  // Calculate available space
  const spaceBelow = viewportHeight - buttonRect.bottom;
  const spaceAbove = buttonRect.top;
  
  console.log('Available space:', { spaceBelow, spaceAbove });
  
  // Determine vertical position
  let verticalPosition: 'above' | 'below' = 'below';
  
  if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
    // Position above the button
    verticalPosition = 'above';
    dropdown.style.bottom = 'calc(100% + 8px)';
    dropdown.style.top = 'auto';
    console.log('Positioning dropdown ABOVE button');
  } else {
    // Position below the button (default)
    verticalPosition = 'below';
    dropdown.style.top = 'calc(100% + 8px)';
    dropdown.style.bottom = 'auto';
    console.log('Positioning dropdown BELOW button');
  }
  
  // Determine horizontal position
  let horizontalPosition: 'left' | 'center' | 'right' = 'center';
  
  // Calculate button center
  const buttonCenter = buttonRect.left + (buttonRect.width / 2);
  const dropdownCenter = dropdownWidth / 2;
  
  // Check if dropdown would go off-screen
  if (buttonCenter - dropdownCenter < 0) {
    // Align to left edge
    horizontalPosition = 'left';
    dropdown.style.left = '0';
    dropdown.style.right = 'auto';
    console.log('Aligning dropdown to LEFT edge');
  } else if (buttonCenter + dropdownCenter > viewportWidth) {
    // Align to right edge
    horizontalPosition = 'right';
    dropdown.style.right = '0';
    dropdown.style.left = 'auto';
    console.log('Aligning dropdown to RIGHT edge');
  } else {
    // Center on button
    horizontalPosition = 'center';
    dropdown.style.left = '70%';
    dropdown.style.right = 'auto';
    dropdown.style.transform = 'translateX(-50%)';
    console.log('Centering dropdown on button');
  }
  
  // Make dropdown visible
  dropdown.style.opacity = '1';
  dropdown.style.pointerEvents = 'auto';
  
  
  // Final safety check
  nextTick(() => {
    const finalRect = dropdown.getBoundingClientRect();
    
    console.log('Final dropdown position:', {
      verticalPosition,
      horizontalPosition,
      finalRect,
      appliedStyles: {
        top: dropdown.style.top,
        bottom: dropdown.style.bottom,
        left: dropdown.style.left,
        right: dropdown.style.right,
        transform: dropdown.style.transform
      }
    });
    
    // Additional safety adjustments if needed
    if (finalRect.left < 0) {
      dropdown.style.left = '0';
      dropdown.style.transform = '';
      console.log('Adjusted: moved to left edge');
    } else if (finalRect.right > viewportWidth) {
      dropdown.style.right = '0';
      dropdown.style.left = 'auto';
      dropdown.style.transform = '';
      console.log('Adjusted: moved to right edge');
    }
    
    if (finalRect.top < 0) {
      dropdown.style.top = 'calc(100% + 8px)';
      dropdown.style.bottom = 'auto';
      console.log('Adjusted: moved below button');
    } else if (finalRect.bottom > viewportHeight) {
      dropdown.style.bottom = 'calc(100% + 8px)';
      dropdown.style.top = 'auto';
      console.log('Adjusted: moved above button');
    }
  });
};
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
  background: var(--vscode-input-background, #3C3C3C);
  border: 1px solid var(--vscode-input-border, #3C3C3C);
  border-radius: 5px;
  padding: 8px;
  transition: border-color 0.1s ease;
}

.input-container:focus-within {
  border-color: var(--vscode-focusBorder, #007ACC);
}

.input-top-elements {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.mention-btn {
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

.mention-btn:hover {
  background: var(--vscode-button-secondaryHoverBackground, #4A4A4A);
  border-color: var(--vscode-focusBorder, #007ACC);
}

.tab-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--vscode-badge-background, #4A4A4A);
  color: var(--vscode-badge-foreground, #FFFFFF);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
}

.tab-indicator .codicon {
  font-size: 12px;
}

.chat-textarea {
  background: transparent;
  color: var(--vscode-input-foreground, #CCCCCC);
  border: none;
  border-radius: 0;
  padding: 8px 0;
  font-family: inherit;
  font-size: 14px;
  resize: none;
  min-height: 60px;
  max-height: 200px;
  width: 100%;
  box-sizing: border-box;
  transition: none;
}

.chat-textarea:focus {
  outline: none;
  border: none;
}

.chat-textarea::placeholder {
  color: var(--vscode-input-placeholderForeground, #8C8C8C);
}

/* Input Controls */
.input-bottom-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--vscode-panel-border, #3C3C3C);
}

.left-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
}

.agent-btn {
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
  position: relative;
}

.agent-btn:hover {
  background: var(--vscode-button-secondaryHoverBackground, #4A4A4A);
  border-color: var(--vscode-focusBorder, #007ACC);
}

.agent-btn:focus {
  outline: 2px solid var(--vscode-focusBorder, #007ACC);
  outline-offset: 2px;
}

.agent-btn.agent-changed {
  background: var(--vscode-button-background, #0E639C);
  color: var(--vscode-button-foreground, #FFFFFF);
  border-color: var(--vscode-button-background, #0E639C);
  animation: agentChangePulse 1s ease-in-out;
}

@keyframes agentChangePulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.right-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}



.floating-send-btn {
  background: var(--vscode-button-background, #0E639C);
  color: var(--vscode-button-foreground, #FFFFFF);
  border: 1px solid var(--vscode-button-background, #0E639C);
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.1s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  z-index: 10;
}

.floating-send-btn:hover {
  background: var(--vscode-button-hoverBackground, #1177BB);
  border-color: var(--vscode-button-hoverBackground, #1177BB);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.5);
}

.floating-send-btn:disabled {
  background: var(--vscode-button-secondaryBackground, #3C3C3C);
  color: var(--vscode-button-secondaryForeground, #8C8C8C);
  border-color: var(--vscode-button-secondaryBorder, #3C3C3C);
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.floating-send-btn .codicon {
  font-size: 18px;
}

/* Agent Dropdown */
.agent-dropdown {
  position: absolute;
  /* Remove default positioning - will be set by JavaScript */
  background: var(--vscode-dropdown-background, #3C3C3C);
  border: 1px solid var(--vscode-dropdown-border, #3C3C3C);
  border-radius: 4px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  max-height: 200px;
  overflow-y: auto;
  min-width: 200px;
  white-space: nowrap;
  /* Support for dynamic positioning */
  transition: none;
  /* Start hidden but ready for positioning */
  opacity: 0;
  pointer-events: none;
  /* Ensure consistent spacing */
  padding: 4px 0;
}

/* Ensure dropdown stays on screen */
@media (max-width: 768px) {
  .agent-dropdown {
    left: auto;
    right: 0;
  }
}

.agent-option {
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.1s ease;
  border-radius: 4px;
  margin: 2px 4px;
  outline: none;
  min-height: 36px; /* Ensure consistent height */
  box-sizing: border-box;
}

.agent-option:hover {
  background: var(--vscode-list-hoverBackground, rgba(255, 255, 255, 0.1));
}

.agent-option:focus {
  background: var(--vscode-list-focusBackground, rgba(255, 255, 255, 0.15));
  outline: 2px solid var(--vscode-focusBorder, #007ACC);
  outline-offset: -2px;
}

.agent-option:active {
  background: var(--vscode-list-activeSelectionBackground, rgba(255, 255, 255, 0.2));
}

.selection-indicator {
  width: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  /* Ensure consistent spacing even when empty */
  min-height: 16px;
}

.selection-check {
  color: var(--vscode-foreground, #CCCCCC);
  font-size: 14px;
}

.model-name {
  font-size: 13px;
  color: var(--vscode-foreground, #CCCCCC);
  flex: 1;
  min-width: 0; /* Allow text to shrink */
}

.provider-name {
  font-size: 11px;
  color: var(--vscode-descriptionForeground, #8C8C8C);
  margin-left: auto;
  flex-shrink: 0; /* Prevent provider name from shrinking */
}

.codicon {
  font-size: 14px;
}
</style>
