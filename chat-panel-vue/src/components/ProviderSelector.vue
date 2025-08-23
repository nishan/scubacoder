<template>
  <div class="provider-selector">
    <div class="selector-header">
      <span class="selector-title">AI Provider</span>
      <span class="current-provider">{{ currentProvider }} • {{ currentModel }}</span>
    </div>
    
    <div class="selector-dropdown" :class="{ open: isDropdownOpen }">
      <button 
        @click="toggleDropdown" 
        class="selector-button"
        :title="`Current: ${currentProvider} • ${currentModel}`"
      >
        <span class="provider-info">
          <span class="provider-name">{{ currentProvider }}</span>
          <span class="model-name">{{ currentModel }}</span>
        </span>
        <span class="dropdown-arrow">▼</span>
      </button>
      
      <div v-if="isDropdownOpen" class="dropdown-content">
        <div class="dropdown-header">
          <span>Select Provider & Model</span>
          <button @click="closeDropdown" class="close-btn">×</button>
        </div>
        
        <div class="provider-groups">
          <div 
            v-for="group in providerGroups" 
            :key="group.provider" 
            class="provider-group"
          >
            <div class="group-header">{{ group.provider }}</div>
            <div class="group-models">
              <button
                v-for="model in group.models"
                :key="`${group.provider}-${model.model}`"
                class="model-option"
                :class="{ active: isSelected(group.provider, model.model) }"
                @click="selectProviderModel(group.provider, model.model)"
              >
                <span class="model-name">{{ model.model }}</span>
                <span v-if="isSelected(group.provider, model.model)" class="checkmark">✓</span>
              </button>
            </div>
          </div>
        </div>
        
        <div v-if="availableModels.length === 0" class="no-models">
          No provider models available
        </div>
      </div>
    </div>
    
    <div class="provider-info">
      <span class="info-text">No code leaves your machine</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { ProviderModel } from '../types';

interface Props {
  availableModels: ProviderModel[];
  currentProvider: string;
  currentModel: string;
}

interface Emits {
  (e: 'change-provider-model', provider: string, model: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isDropdownOpen = ref(false);

const providerGroups = computed(() => {
  const groups: { [key: string]: ProviderModel[] } = {};
  
  props.availableModels.forEach(model => {
    if (!groups[model.provider]) {
      groups[model.provider] = [];
    }
    groups[model.provider].push(model);
  });
  
  return Object.entries(groups).map(([provider, models]) => ({
    provider,
    models: models.sort((a, b) => a.model.localeCompare(b.model))
  }));
});

const isSelected = (provider: string, model: string) => {
  return provider === props.currentProvider && model === props.currentModel;
};

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

const closeDropdown = () => {
  isDropdownOpen.value = false;
};

const selectProviderModel = (provider: string, model: string) => {
  emit('change-provider-model', provider, model);
  closeDropdown();
};

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.provider-selector')) {
    closeDropdown();
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.provider-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--vscode-panel-border, #e1e4e8);
  background: var(--vscode-editor-background, #ffffff);
}

.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.selector-title {
  font-weight: 600;
  color: var(--vscode-foreground, #24292e);
  font-size: 14px;
}

.current-provider {
  font-size: 12px;
  color: var(--vscode-descriptionForeground, #586069);
}

.selector-dropdown {
  position: relative;
}

.selector-button {
  width: 100%;
  background: var(--vscode-button-background, #0366d6);
  color: var(--vscode-button-foreground, #ffffff);
  border: none;
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.selector-button:hover {
  background: var(--vscode-button-hoverBackground, #0256b3);
}

.provider-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.provider-name {
  font-weight: 500;
  font-size: 14px;
}

.model-name {
  font-size: 12px;
  opacity: 0.9;
}

.dropdown-arrow {
  font-size: 12px;
  transition: transform 0.2s;
}

.selector-dropdown.open .dropdown-arrow {
  transform: rotate(180deg);
}

.dropdown-content {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--vscode-dropdown-background, #ffffff);
  border: 1px solid var(--vscode-dropdown-border, #e1e4e8);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  max-height: 300px;
  overflow-y: auto;
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid var(--vscode-dropdown-border, #e1e4e8);
  background: var(--vscode-dropdown-listBackground, #f6f8fa);
}

.dropdown-header span {
  font-weight: 600;
  color: var(--vscode-foreground, #24292e);
}

.close-btn {
  background: none;
  border: none;
  color: var(--vscode-descriptionForeground, #586069);
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.close-btn:hover {
  background: var(--vscode-dropdown-listHoverBackground, #e1e4e8);
  color: var(--vscode-foreground, #24292e);
}

.provider-groups {
  padding: 8px;
}

.provider-group {
  margin-bottom: 16px;
}

.provider-group:last-child {
  margin-bottom: 0;
}

.group-header {
  font-weight: 600;
  color: var(--vscode-foreground, #24292e);
  margin-bottom: 8px;
  padding: 0 4px;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.group-models {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.model-option {
  background: none;
  border: none;
  padding: 8px 12px;
  text-align: left;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--vscode-foreground, #24292e);
}

.model-option:hover {
  background: var(--vscode-dropdown-listHoverBackground, #e1e4e8);
}

.model-option.active {
  background: var(--vscode-list-activeSelectionBackground, #0366d6);
  color: var(--vscode-list-activeSelectionForeground, #ffffff);
}

.checkmark {
  font-weight: bold;
  color: inherit;
}

.no-models {
  padding: 16px;
  text-align: center;
  color: var(--vscode-descriptionForeground, #586069);
  font-style: italic;
}

.provider-info {
  display: flex;
  justify-content: center;
}

.info-text {
  font-size: 12px;
  color: var(--vscode-descriptionForeground, #586069);
}
</style>
