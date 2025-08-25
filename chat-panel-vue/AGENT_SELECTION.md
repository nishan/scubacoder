# Agent Selection Persistence

This document describes how agent selection persistence works in the ScubaCoder chat panel.

## Overview

The agent selection system automatically persists the user's choice of AI model and provider, ensuring that when they return to the chat panel, they see the same model they last selected.

## How It Works

### 1. Persistence Layers

The system uses two layers of persistence for maximum reliability:

- **localStorage**: Browser-based persistence that survives page refreshes
- **VS Code State**: Extension state that persists across VS Code sessions

### 2. Data Structure

Each persisted selection includes:

```typescript
{
  agentId: "ollama##qwen2.5-coder:7b",
  timestamp: 1703123456789,
  availableAgents: ["ollama##qwen2.5-coder:7b", "vllm##qwen2.5-coder:7b"]
}
```

### 3. Selection Priority

When loading a persisted selection, the system follows this priority:

1. **localStorage** (highest priority)
2. **VS Code State**
3. **Initialization Data** (from extension)
4. **Default Selection** (first available agent)

### 4. Validation

The system validates persisted selections by:

- Checking if the agent ID is valid
- Verifying the agent is still available in the current configuration
- Cleaning up invalid or corrupted persistence data
- Falling back to available alternatives when needed

## Usage

### Basic Agent Selection

```typescript
import { useAgentSelection } from './composables/useAgentSelection';

const { selectAgent, selectedAgentId, availableAgents } = useAgentSelection();

// Select an agent
selectAgent(agentObject);

// Check current selection
console.log('Selected agent:', selectedAgentId.value);
```

### Advanced Features

```typescript
const {
  getNextAgent,
  getPreviousAgent,
  isAgentSelected,
  clearSelection,
  refreshAgents
} = useAgentSelection();

// Cycle through agents
const nextAgent = getNextAgent();
if (nextAgent) selectAgent(nextAgent);

// Check if specific agent is selected
const isSelected = isAgentSelected('ollama:qwen2.5-coder:7b');

// Clear current selection
clearSelection();

// Refresh agent list
refreshAgents(newAgentList);
```

## Persistence Keys

- **localStorage Key**: `scubacoder-selected-agent`
- **VS Code State**: Stored in extension's global state

## Error Handling

The system gracefully handles various error scenarios:

- **Corrupted localStorage**: Automatically cleans up and falls back
- **Invalid agent IDs**: Validates before persisting
- **Unavailable agents**: Automatically selects next available agent
- **VS Code state errors**: Falls back to localStorage or defaults

## Benefits

1. **User Experience**: Users don't lose their model preferences
2. **Reliability**: Dual persistence ensures data survival
3. **Validation**: Automatic cleanup of invalid data
4. **Fallbacks**: Graceful degradation when issues occur
5. **Performance**: Minimal overhead with efficient state management

## Technical Details

### Composables Used

- `useAgentSelection`: Main agent selection logic
- `useVSCode`: VS Code communication and state management

### State Management

- Reactive Vue 3 composition API
- Automatic persistence on selection changes
- Efficient change detection and updates

### Browser Compatibility

- Uses standard localStorage API
- Graceful fallbacks for unsupported features
- Cross-browser compatibility maintained
