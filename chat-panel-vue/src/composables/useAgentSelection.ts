import { ref, computed, watch } from 'vue';
import type { Agent } from '../types';
import { useVSCode } from './useVSCode';

const STORAGE_KEY = 'scubacoder-selected-agent';
const MODEL_DELIMITER = '##';

export function useAgentSelection() {
  const { postMessage, getState, setState } = useVSCode();
  
  // State
  const availableAgents = ref<Agent[]>([]);
  const selectedAgentId = ref<string>('');
  
  // Computed
  const selectedAgent = computed(() => {
    return availableAgents.value.find(agent => agent.id === selectedAgentId.value);
  });
  
  const hasAgents = computed(() => availableAgents.value.length > 0);
  
  const selectedAgentDisplayName = computed(() => {
    const agent = selectedAgent.value;
    if (!agent) return 'Select Agent';
    
    // Show a shorter, more readable version
    const shortName = agent.provider === 'ollama' ? 'Ollama' : 'vLLM';
    const shortModel = agent.version.length > 20 ? agent.version.substring(0, 20) + '...' : agent.version;
    return `${shortName}: ${shortModel}`;
  });
  
  // Initialize agents from VS Code data
  const initializeAgents = (initData: any) => {
    if (initData.availableProviderModels && initData.availableProviderModels.length > 0) {
      availableAgents.value = initData.availableProviderModels.map((model: any) => ({
        id: `${model.provider}${MODEL_DELIMITER}${model.model}`,
        name: model.provider === 'ollama' ? 'Ollama' : 'vLLM',
        version: model.model,
        provider: model.provider
      }));
    } else {
      // Fallback agents if none are configured
      availableAgents.value = [
        {
          id: 'ollama##qwen2.5-coder:7b',
          name: 'Ollama',
          version: 'qwen2.5-coder:7b',
          provider: 'ollama'
        },
        {
          id: 'vllm##qwen2.5-coder:7b',
          name: 'vLLM',
          version: 'qwen2.5-coder:7b',
          provider: 'vllm'
        }
      ];
    }
    
    // Load persisted selection or use default
    loadPersistedSelection(initData);
  };
  
  // Load persisted agent selection
  const loadPersistedSelection = (initData: any) => {
    let agentToSelect = '';
    
    // First, try to load from localStorage
    try {
      const persisted = localStorage.getItem(STORAGE_KEY);
      if (persisted) {
        const parsed = JSON.parse(persisted);
        
        // Validate the persisted data
        if (parsed.agentId && parsed.timestamp && parsed.availableAgents) {
          // Check if the persisted agent is still available
          if (availableAgents.value.find(agent => agent.id === parsed.agentId)) {
            agentToSelect = parsed.agentId;
            console.log('useAgentSelection - Loaded persisted agent from localStorage:', agentToSelect);
          } else {
            console.log('useAgentSelection - Persisted agent no longer available:', parsed.agentId);
            // Clean up invalid localStorage entry
            localStorage.removeItem(STORAGE_KEY);
          }
        } else {
          console.log('useAgentSelection - Invalid persisted data format, cleaning up');
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.warn('useAgentSelection - Failed to load from localStorage:', error);
      // Clean up corrupted localStorage entry
      localStorage.removeItem(STORAGE_KEY);
    }
    
    // If no persisted selection, try VS Code state
    if (!agentToSelect) {
      try {
        const vscodeState = getState();
        if (vscodeState && vscodeState.agentId && vscodeState.timestamp && vscodeState.availableAgents) {
          if (availableAgents.value.find(agent => agent.id === vscodeState.agentId)) {
            agentToSelect = vscodeState.agentId;
            console.log('useAgentSelection - Loaded agent from VS Code state:', agentToSelect);
          } else {
            console.log('useAgentSelection - VS Code state agent no longer available:', vscodeState.agentId);
            // Clean up invalid VS Code state
            setState({ agentId: null, timestamp: null, availableAgents: [] });
          }
        }
      } catch (error) {
        console.warn('useAgentSelection - Failed to load from VS Code state:', error);
      }
    }
    
    // If still no selection, use the one from initData or default
    if (!agentToSelect) {
      if (initData.providerId && initData.model) {
        agentToSelect = `${initData.providerId}:${initData.model}`;
        console.log('useAgentSelection - Using agent from initData:', agentToSelect);
      } else {
        // Use first available agent as default
        agentToSelect = availableAgents.value[0]?.id || '';
        console.log('useAgentSelection - Using default agent:', agentToSelect);
      }
    }
    
    // Set the selected agent
    if (agentToSelect && agentToSelect !== selectedAgentId.value) {
      selectAgentById(agentToSelect);
    }
  };
  
  // Select agent by ID
  const selectAgentById = (agentId: string) => {
    if (!agentId || typeof agentId !== 'string') {
      console.warn('useAgentSelection - Invalid agent ID:', agentId);
      return;
    }
    
    const agent = availableAgents.value.find(a => a.id === agentId);
    if (!agent) {
      console.warn('useAgentSelection - Agent not found:', agentId);
      return;
    }
    
    selectedAgentId.value = agentId;
    
    // Persist the selection
    persistSelection(agentId);
    
    // Notify VS Code of the change
    const [provider, model] = agentId.split(MODEL_DELIMITER);
    if (provider && model) {
      postMessage({
        type: 'changeProviderModel',
        provider,
        model
      });
      console.log('useAgentSelection - Selected agent:', agentId);
    } else {
      console.error('useAgentSelection - Failed to parse agent ID:', agentId);
    }
  };
  
  // Select agent by Agent object
  const selectAgent = (agent: Agent) => {
    if (!agent || !agent.id) {
      console.warn('useAgentSelection - Invalid agent object:', agent);
      return;
    }
    selectAgentById(agent.id);
  };
  
  // Get agent information by ID
  const getAgentById = (agentId: string): Agent | undefined => {
    return availableAgents.value.find(agent => agent.id === agentId);
  };
  
  // Get agent information by provider and model
  const getAgentByProviderModel = (provider: string, model: string): Agent | undefined => {
    return availableAgents.value.find(agent => 
      agent.provider === provider && agent.version === model
    );
  };
  
  // Check if an agent is currently selected
  const isAgentSelected = (agentId: string): boolean => {
    return selectedAgentId.value === agentId;
  };
  
  // Clear persisted selection
  const clearSelection = () => {
    selectedAgentId.value = '';
    
    // Clear localStorage
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('useAgentSelection - Cleared localStorage selection');
    } catch (error) {
      console.warn('useAgentSelection - Failed to clear localStorage:', error);
    }
    
    // Clear VS Code state
    try {
      setState({ agentId: null, timestamp: null, availableAgents: [] });
      console.log('useAgentSelection - Cleared VS Code state selection');
    } catch (error) {
      console.warn('useAgentSelection - Failed to clear VS Code state:', error);
    }
  };
  
  // Persist agent selection
  const persistSelection = (agentId: string) => {
    if (!agentId || typeof agentId !== 'string') {
      console.warn('useAgentSelection - Cannot persist invalid agent ID:', agentId);
      return;
    }
    
    // Validate that the agent exists before persisting
    if (!availableAgents.value.find(agent => agent.id === agentId)) {
      console.warn('useAgentSelection - Cannot persist non-existent agent:', agentId);
      return;
    }
    
    const persistData = {
      agentId,
      timestamp: Date.now(),
      availableAgents: availableAgents.value.map(agent => agent.id) // Store available agents for validation
    };
    
    // Save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistData));
      console.log('useAgentSelection - Persisted to localStorage:', agentId);
    } catch (error) {
      console.warn('useAgentSelection - Failed to persist to localStorage:', error);
    }
    
    // Save to VS Code state
    try {
      setState(persistData);
      console.log('useAgentSelection - Persisted to VS Code state:', agentId);
    } catch (error) {
      console.warn('useAgentSelection - Failed to persist to VS Code state:', error);
    }
  };
  
  // Handle agent update from VS Code
  const handleAgentUpdate = (message: any) => {
    if (message.type === 'updateProviderModel' && message.provider && message.model) {
      const newAgentId = `${message.provider}${MODEL_DELIMITER}${message.model}`;
      if (newAgentId !== selectedAgentId.value) {
        selectedAgentId.value = newAgentId;
        persistSelection(newAgentId);
        console.log('useAgentSelection - Updated agent from VS Code:', newAgentId);
      }
    }
  };
  
  // Refresh available agents (useful when agent list changes)
  const refreshAgents = (newAgents: Agent[]) => {
    const oldAgents = [...availableAgents.value];
    availableAgents.value = newAgents;
    
    // Check if current selection is still valid
    if (selectedAgentId.value && !newAgents.find(agent => agent.id === selectedAgentId.value)) {
      console.log('useAgentSelection - Current selection no longer available, selecting first available agent');
      // Select first available agent
      if (newAgents.length > 0) {
        selectAgentById(newAgents[0].id);
      } else {
        selectedAgentId.value = '';
      }
    }
    
    console.log('useAgentSelection - Refreshed agents:', { old: oldAgents, new: newAgents });
  };
  
  // Get next available agent (useful for cycling through agents)
  const getNextAgent = (): Agent | undefined => {
    if (availableAgents.value.length === 0) return undefined;
    
    if (!selectedAgentId.value) {
      return availableAgents.value[0];
    }
    
    const currentIndex = availableAgents.value.findIndex(agent => agent.id === selectedAgentId.value);
    if (currentIndex === -1) {
      return availableAgents.value[0];
    }
    
    const nextIndex = (currentIndex + 1) % availableAgents.value.length;
    return availableAgents.value[nextIndex];
  };
  
  // Get previous available agent
  const getPreviousAgent = (): Agent | undefined => {
    if (availableAgents.value.length === 0) return undefined;
    
    if (!selectedAgentId.value) {
      return availableAgents.value[0];
    }
    
    const currentIndex = availableAgents.value.findIndex(agent => agent.id === selectedAgentId.value);
    if (currentIndex === -1) {
      return availableAgents.value[0];
    }
    
    const prevIndex = currentIndex === 0 ? availableAgents.value.length - 1 : currentIndex - 1;
    return availableAgents.value[prevIndex];
  };
  
  // Watch for changes in selectedAgentId and persist them
  watch(selectedAgentId, (newId, oldId) => {
    if (newId && newId !== oldId) {
      persistSelection(newId);
    }
  });
  
  return {
    // State
    availableAgents,
    selectedAgentId,
    
    // Computed
    selectedAgent,
    hasAgents,
    selectedAgentDisplayName,
    
    // Methods
    initializeAgents,
    selectAgent,
    selectAgentById,
    getAgentById,
    getAgentByProviderModel,
    isAgentSelected,
    clearSelection,
    handleAgentUpdate,
    persistSelection,
    refreshAgents,
    getNextAgent,
    getPreviousAgent
  };
}
