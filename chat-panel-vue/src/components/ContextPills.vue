<template>
  <div class="context-pills">
    <div class="pills-header">
      <span class="pills-title">Context Files</span>
      <span v-if="selectedCount > 0" class="selected-count">{{ selectedCount }} selected</span>
    </div>
    
    <div class="pills-container">
      <button
        v-for="file in availableFiles"
        :key="file.uri"
        class="context-pill"
        :class="{ active: file.isSelected }"
        @click="toggleFile(file.uri)"
        :title="file.label"
      >
        {{ file.label }}
        <span v-if="file.isSelected" class="checkmark">✓</span>
      </button>
      
      <button 
        v-if="availableFiles.length === 0" 
        class="no-files"
        disabled
      >
        No context files available
      </button>
    </div>
    
    <div class="pills-actions">
      <button 
        @click="addContext" 
        class="add-context-btn"
        title="Add more context files"
      >
        ➕ Add Context
      </button>
      <button 
        v-if="selectedCount > 0"
        @click="clearSelection" 
        class="clear-btn"
        title="Clear all selections"
      >
        🗑️ Clear
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ContextFile } from '../types';

interface Props {
  availableFiles: ContextFile[];
  selectedUris: string[];
}

interface Emits {
  (e: 'toggle-file', uri: string): void;
  (e: 'add-context'): void;
  (e: 'clear-selection'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const selectedCount = computed(() => props.selectedUris.length);

const toggleFile = (uri: string) => {
  emit('toggle-file', uri);
};

const addContext = () => {
  emit('add-context');
};

const clearSelection = () => {
  emit('clear-selection');
};
</script>

<style scoped>
.context-pills {
  border-top: 1px solid var(--vscode-panel-border, #e1e4e8);
  padding: 16px;
  background: var(--vscode-editor-background, #ffffff);
}

.pills-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.pills-title {
  font-weight: 600;
  color: var(--vscode-foreground, #24292e);
  font-size: 14px;
}

.selected-count {
  font-size: 12px;
  color: var(--vscode-badge-foreground, #ffffff);
  background: var(--vscode-badge-background, #0366d6);
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 500;
}

.pills-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
  min-height: 32px;
}

.context-pill {
  border: 1px solid var(--vscode-panel-border, #e1e4e8);
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 12px;
  background: transparent;
  color: var(--vscode-foreground, #24292e);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.context-pill:hover {
  background: var(--vscode-badge-background, #0366d6);
  color: var(--vscode-badge-foreground, #ffffff);
  border-color: var(--vscode-badge-background, #0366d6);
  transform: translateY(-1px);
}

.context-pill.active {
  background: var(--vscode-list-activeSelectionBackground, #0366d6);
  color: var(--vscode-list-activeSelectionForeground, #ffffff);
  border-color: var(--vscode-list-activeSelectionBackground, #0366d6);
}

.checkmark {
  font-weight: bold;
  font-size: 14px;
}

.no-files {
  color: var(--vscode-descriptionForeground, #586069);
  font-style: italic;
  cursor: not-allowed;
  border: 1px dashed var(--vscode-panel-border, #e1e4e8);
  background: transparent;
  padding: 6px 12px;
  border-radius: 6px;
}

.pills-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-start;
}

.add-context-btn,
.clear-btn {
  background: var(--vscode-button-secondaryBackground, #f6f8fa);
  color: var(--vscode-button-secondaryForeground, #24292e);
  border: 1px solid var(--vscode-button-secondaryBorder, #e1e4e8);
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.add-context-btn:hover {
  background: var(--vscode-button-secondaryHoverBackground, #e1e4e8);
  border-color: var(--vscode-button-secondaryHoverBorder, #d0d7de);
}

.clear-btn {
  background: var(--vscode-errorForeground, #cb2431);
  color: var(--vscode-errorBackground, #ffffff);
  border-color: var(--vscode-errorForeground, #cb2431);
}

.clear-btn:hover {
  background: var(--vscode-errorForeground, #a0111f);
  border-color: var(--vscode-errorForeground, #a0111f);
}
</style>
