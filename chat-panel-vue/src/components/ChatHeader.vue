<template>
  <div class="chat-header">
    <h1 class="chat-title">CHAT</h1>
    <div class="header-actions">
      <button class="action-btn" @click="refresh" title="Refresh">
        <i class="codicon codicon-refresh"></i>
      </button>
      <button class="action-btn" @click="undo" title="Undo">
        <i class="codicon codicon-undo"></i>
      </button>
      <button class="action-btn" @click="newChat" title="New Chat">
        <i class="codicon codicon-plus"></i>
      </button>
      <button class="action-btn" @click="openSettings" title="Settings">
        <i class="codicon codicon-gear"></i>
      </button>
      <button class="action-btn" @click="addPanel" title="Add Panel">
        <i class="codicon codicon-add"></i>
      </button>
      <button class="action-btn" @click="maximize" title="Maximize">
        <i class="codicon codicon-screen-full"></i>
      </button>
      <button class="action-btn" @click="close" title="Close">
        <i class="codicon codicon-close"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVSCode } from '../composables/useVSCode';

const { postMessage } = useVSCode();

const refresh = () => {
  postMessage({ type: 'refresh' });
};

const undo = () => {
  postMessage({ type: 'undo' });
};

const newChat = () => {
  postMessage({ type: 'newChat' });
};

const openSettings = () => {
  postMessage({ type: 'openSettings' });
};

const addPanel = () => {
  postMessage({ type: 'addPanel' });
};

const maximize = () => {
  postMessage({ type: 'maximize' });
};

const close = () => {
  postMessage({ type: 'close' });
};
</script>

<style scoped>
.chat-header {
  background: var(--vscode-titleBar-activeBackground, #3C3C3C);
  border-bottom: 1px solid var(--vscode-panel-border, #3C3C3C);
  padding: 8px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 48px;
}

.chat-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: var(--vscode-titleBar-activeForeground, #FFFFFF);
  font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif);
}

.header-actions {
  display: flex;
  gap: 4px;
  align-items: center;
}

.action-btn {
  background: transparent;
  color: var(--vscode-titleBar-activeForeground, #FFFFFF);
  border: none;
  border-radius: 4px;
  padding: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.1s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  min-height: 28px;
}

.action-btn:hover {
  background: var(--vscode-toolbar-hoverBackground, rgba(255, 255, 255, 0.1));
}

.action-btn:active {
  background: var(--vscode-toolbar-activeBackground, rgba(255, 255, 255, 0.2));
}

.codicon {
  font-size: 16px;
}
</style>
