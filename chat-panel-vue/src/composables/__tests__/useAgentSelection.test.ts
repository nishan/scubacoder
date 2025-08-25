/**
 * Test file for useAgentSelection composable
 * This demonstrates the agent selection functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAgentSelection } from '../useAgentSelection';

// Mock useVSCode
vi.mock('../useVSCode', () => ({
  useVSCode: () => ({
    postMessage: vi.fn(),
    getState: vi.fn(() => null),
    setState: vi.fn()
  })
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('useAgentSelection', () => {
  let agentSelection: ReturnType<typeof useAgentSelection>;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
    
    // Reset localStorage mock
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockReturnValue(undefined);
    localStorageMock.removeItem.mockReturnValue(undefined);
    
    // Create fresh instance
    agentSelection = useAgentSelection();
  });

  describe('Initialization', () => {
    it('should initialize with empty state', () => {
      expect(agentSelection.availableAgents.value).toEqual([]);
      expect(agentSelection.selectedAgentId.value).toBe('');
      expect(agentSelection.hasAgents.value).toBe(false);
    });

    it('should initialize agents from init data', () => {
      const initData = {
        availableProviderModels: [
          { provider: 'ollama', model: 'qwen2.5-coder:7b' },
          { provider: 'vllm', model: 'qwen2.5-coder:7b' }
        ]
      };

      agentSelection.initializeAgents(initData);

      expect(agentSelection.availableAgents.value).toHaveLength(2);
      expect(agentSelection.availableAgents.value[0].id).toBe('ollama:qwen2.5-coder:7b');
      expect(agentSelection.availableAgents.value[1].id).toBe('vllm:qwen2.5-coder:7b');
    });

    it('should use fallback agents when none configured', () => {
      const initData = { availableProviderModels: [] };
      
      agentSelection.initializeAgents(initData);
      
      expect(agentSelection.availableAgents.value).toHaveLength(2);
      expect(agentSelection.hasAgents.value).toBe(true);
    });
  });

  describe('Agent Selection', () => {
    beforeEach(() => {
      // Initialize with test agents
      agentSelection.initializeAgents({
        availableProviderModels: [
          { provider: 'ollama', model: 'qwen2.5-coder:7b' },
          { provider: 'vllm', model: 'qwen2.5-coder:7b' }
        ]
      });
    });

    it('should select agent by ID', () => {
      agentSelection.selectAgentById('ollama:qwen2.5-coder:7b');
      
      expect(agentSelection.selectedAgentId.value).toBe('ollama:qwen2.5-coder:7b');
      expect(agentSelection.selectedAgent.value?.provider).toBe('ollama');
    });

    it('should select agent by Agent object', () => {
      const agent = agentSelection.availableAgents.value[0];
      agentSelection.selectAgent(agent);
      
      expect(agentSelection.selectedAgentId.value).toBe(agent.id);
    });

    it('should not select invalid agent ID', () => {
      agentSelection.selectAgentById('invalid:id');
      
      expect(agentSelection.selectedAgentId.value).toBe('');
    });

    it('should not select non-existent agent', () => {
      agentSelection.selectAgentById('ollama:non-existent');
      
      expect(agentSelection.selectedAgentId.value).toBe('');
    });
  });

  describe('Persistence', () => {
    beforeEach(() => {
      agentSelection.initializeAgents({
        availableProviderModels: [
          { provider: 'ollama', model: 'qwen2.5-coder:7b' }
        ]
      });
    });

    it('should persist selection to localStorage', () => {
      agentSelection.selectAgentById('ollama:qwen2.5-coder:7b');
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'scubacoder-selected-agent',
        expect.stringContaining('ollama:qwen2.5-coder:7b')
      );
    });

    it('should load persisted selection from localStorage', () => {
      const persistedData = {
        agentId: 'ollama:qwen2.5-coder:7b',
        timestamp: Date.now(),
        availableAgents: ['ollama:qwen2.5-coder:7b']
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(persistedData));
      
      agentSelection.initializeAgents({
        availableProviderModels: [
          { provider: 'ollama', model: 'qwen2.5-coder:7b' }
        ]
      });
      
      expect(agentSelection.selectedAgentId.value).toBe('ollama:qwen2.5-coder:7b');
    });

    it('should clean up invalid persisted data', () => {
      const invalidData = { agentId: 'invalid:id' };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(invalidData));
      
      agentSelection.initializeAgents({
        availableProviderModels: [
          { provider: 'ollama', model: 'qwen2.5-coder:7b' }
        ]
      });
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('scubacoder-selected-agent');
    });
  });

  describe('Utility Methods', () => {
    beforeEach(() => {
      agentSelection.initializeAgents({
        availableProviderModels: [
          { provider: 'ollama', model: 'qwen2.5-coder:7b' },
          { provider: 'vllm', model: 'qwen2.5-coder:7b' }
        ]
      });
    });

    it('should check if agent is selected', () => {
      agentSelection.selectAgentById('ollama:qwen2.5-coder:7b');
      
      expect(agentSelection.isAgentSelected('ollama:qwen2.5-coder:7b')).toBe(true);
      expect(agentSelection.isAgentSelected('vllm:qwen2.5-coder:7b')).toBe(false);
    });

    it('should get agent by ID', () => {
      const agent = agentSelection.getAgentById('ollama:qwen2.5-coder:7b');
      
      expect(agent).toBeDefined();
      expect(agent?.provider).toBe('ollama');
    });

    it('should get agent by provider and model', () => {
      const agent = agentSelection.getAgentByProviderModel('ollama', 'qwen2.5-coder:7b');
      
      expect(agent).toBeDefined();
      expect(agent?.id).toBe('ollama:qwen2.5-coder:7b');
    });

    it('should get next agent', () => {
      agentSelection.selectAgentById('ollama:qwen2.5-coder:7b');
      
      const nextAgent = agentSelection.getNextAgent();
      expect(nextAgent?.id).toBe('vllm:qwen2.5-coder:7b');
    });

    it('should get previous agent', () => {
      agentSelection.selectAgentById('vllm:qwen2.5-coder:7b');
      
      const prevAgent = agentSelection.getPreviousAgent();
      expect(prevAgent?.id).toBe('ollama:qwen2.5-coder:7b');
    });

    it('should clear selection', () => {
      agentSelection.selectAgentById('ollama:qwen2.5-coder:7b');
      agentSelection.clearSelection();
      
      expect(agentSelection.selectedAgentId.value).toBe('');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('scubacoder-selected-agent');
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      agentSelection.initializeAgents({
        availableProviderModels: [
          { provider: 'ollama', model: 'qwen2.5-coder:7b' }
        ]
      });
      
      agentSelection.selectAgentById('ollama:qwen2.5-coder:7b');
      
      // Should not crash, just log warning
      expect(agentSelection.selectedAgentId.value).toBe('ollama:qwen2.5-coder:7b');
    });

    it('should handle corrupted localStorage data', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');
      
      agentSelection.initializeAgents({
        availableProviderModels: [
          { provider: 'ollama', model: 'qwen2.5-coder:7b' }
        ]
      });
      
      // Should clean up corrupted data and use default
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('scubacoder-selected-agent');
    });
  });
});
