import { ref, computed } from 'vue';
import type { Message, ContextFile, ProviderModel } from '../types';
import { useVSCode } from './useVSCode';

export function useChat() {
  const { postMessage, onMessage } = useVSCode();
  
  // State
  const messages = ref<Message[]>([]);
  const selectedContextUris = ref<string[]>([]);
  const availableContextFiles = ref<ContextFile[]>([]);
  const availableProviderModels = ref<ProviderModel[]>([]);
  const currentProvider = ref('');
  const currentModel = ref('');
  const isLoading = ref(false);
  const inputText = ref('');

  // Computed
  const hasSelectedContext = computed(() => selectedContextUris.value.length > 0);
  const contextSelectionCount = computed(() => selectedContextUris.value.length);

  // Initialize with welcome message
  const initializeChat = () => {
    messages.value = [{
      id: 'welcome',
      role: 'assistant',
      content: 'Ask a question about your codebase. Use the context pills below to include files. For example: `How do I open the chat panel?`',
      timestamp: new Date()
    }];
  };

  // Send a chat message
  const sendMessage = () => {
    const text = inputText.value.trim();
    if (!text) return;

    // Add user message to UI
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
      contextUris: selectedContextUris.value
    };
    
    messages.value.push(userMessage);
    inputText.value = '';

    // Send to VS Code extension
    postMessage({
      type: 'chat',
      text,
      contextUris: selectedContextUris.value
    });
  };

  // Handle incoming messages from VS Code
  const handleIncomingMessage = (message: any) => {
    switch (message.type) {
      case 'userMessage':
        // User message already added by sendMessage
        break;
        
      case 'loading':
        isLoading.value = true;
        break;
        
      case 'reply':
        isLoading.value = false;
        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: message.text,
          timestamp: new Date()
        };
        messages.value.push(assistantMessage);
        break;
        
      case 'updateProviderModel':
        if (message.provider) currentProvider.value = message.provider;
        if (message.model) currentModel.value = message.model;
        break;
        
      case 'searchResults':
        // Handle search results if needed
        break;
    }
  };

  // Toggle context file selection
  const toggleContextFile = (uri: string) => {
    const index = selectedContextUris.value.indexOf(uri);
    if (index > -1) {
      selectedContextUris.value.splice(index, 1);
    } else {
      selectedContextUris.value.push(uri);
    }
  };

  // Change provider/model
  const changeProviderModel = (provider: string, model: string) => {
    postMessage({
      type: 'changeProviderModel',
      provider,
      model
    });
  };

  // Insert code into active editor
  const insertCode = (code: string) => {
    postMessage({
      type: 'insert',
      code
    });
  };

  // Search workspace
  const searchWorkspace = (query: string) => {
    postMessage({
      type: 'searchWorkspace',
      query
    });
  };

  // Log message
  const logMessage = (level: 'info' | 'warn' | 'error', message: string, data?: any) => {
    postMessage({
      type: 'log',
      level,
      message,
      data
    });
  };

  // Initialize message listener
  const unsubscribe = onMessage(handleIncomingMessage);

  return {
    // State
    messages,
    selectedContextUris,
    availableContextFiles,
    availableProviderModels,
    currentProvider,
    currentModel,
    isLoading,
    inputText,
    
    // Computed
    hasSelectedContext,
    contextSelectionCount,
    
    // Methods
    initializeChat,
    sendMessage,
    toggleContextFile,
    changeProviderModel,
    insertCode,
    searchWorkspace,
    logMessage,
    
    // Cleanup
    unsubscribe
  };
}
