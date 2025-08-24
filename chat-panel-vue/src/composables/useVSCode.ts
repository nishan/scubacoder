import { ref, onMounted, onUnmounted } from 'vue';
import type { OutgoingMessage, IncomingMessage } from '../types';

// Safe serialization function for postMessage
function safeSerialize(obj: any): any {
  try {
    // Handle primitive types
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') return obj;
    
    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => safeSerialize(item));
    }
    
    // Handle objects
    if (typeof obj === 'object') {
      const result: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          try {
            result[key] = safeSerialize(obj[key]);
          } catch (e) {
            result[key] = '[Non-serializable value]';
          }
        }
      }
      return result;
    }
    
    // Handle functions and other non-serializable types
    return '[Non-serializable value]';
  } catch (e) {
    return '[Serialization error]';
  }
}

export function useVSCode() {
  const isVSCode = ref(false);
  const messageHandlers = ref<((message: IncomingMessage) => void)[]>([]);

  onMounted(() => {
    isVSCode.value = typeof window !== 'undefined' && typeof window.vscode !== 'undefined';
  });

  const postMessage = (message: OutgoingMessage) => {
    if (isVSCode.value && window.vscode) {
      try {
        // Safely serialize the message before sending
        const safeMessage = safeSerialize(message);
        window.vscode.postMessage(safeMessage);
      } catch (error) {
        console.error('Failed to send message to VS Code:', error);
        // Fallback: try to send a simplified message
        try {
          const fallbackMessage = {
            type: message.type,
            error: 'Original message failed to serialize'
          };
          window.vscode.postMessage(fallbackMessage);
        } catch (fallbackError) {
          console.error('Fallback message also failed:', fallbackError);
        }
      }
    } else {
      // Development mode fallback
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

  return {
    isVSCode,
    postMessage,
    onMessage,
    getState,
    setState
  };
}
