import { ref, onMounted, onUnmounted } from 'vue';
import type { OutgoingMessage, IncomingMessage } from '../types';

export function useVSCode() {
  const isVSCode = ref(false);

  // Check if we're running in VS Code
  const checkVSCode = () => {
    isVSCode.value = typeof window !== 'undefined' && 'vscode' in window;
  };

  // Send message to VS Code extension
  const postMessage = (message: OutgoingMessage) => {
    if (isVSCode.value && window.vscode) {
      window.vscode.postMessage(message);
    } else {
      console.log('VSCode message (dev mode):', message);
    }
  };

  // Listen for messages from VS Code extension
  const onMessage = (callback: (message: IncomingMessage) => void) => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && typeof event.data === 'object') {
        callback(event.data);
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  };

  // Get VS Code state
  const getState = () => {
    if (isVSCode.value && window.vscode) {
      return window.vscode.getState();
    }
    return null;
  };

  // Set VS Code state
  const setState = (state: any) => {
    if (isVSCode.value && window.vscode) {
      window.vscode.setState(state);
    }
  };

  onMounted(() => {
    checkVSCode();
  });

  return {
    isVSCode,
    postMessage,
    onMessage,
    getState,
    setState
  };
}
