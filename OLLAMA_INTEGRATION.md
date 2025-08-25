# Ollama Integration & Message Relay System

This document describes how the ScubaCoder extension integrates with Ollama to relay user messages and bring back results to the chat panel.

## Overview

The system provides a complete integration with Ollama, allowing users to:
- Select Ollama as their AI provider
- Choose from available models
- Send chat messages that are relayed to Ollama
- Receive responses back in the chat panel
- Automatically test connections and validate models

## Architecture

### 1. Provider Management

The system uses a provider router pattern to manage different AI providers:

```typescript
// src/models/providerRouter.ts
export function createProvider(config: ProviderConfig): LLMProvider {
  const { provider, model, baseUrl } = config;
  
  if (provider === 'ollama') {
    const ollamaBaseUrl = baseUrl || 'http://127.0.0.1:11434';
    return new OllamaProvider({ baseUrl: ollamaBaseUrl, model });
  }
  // ... other providers
}
```

### 2. Ollama Provider Implementation

The `OllamaProvider` class (`src/models/ollama.ts`) implements the `LLMProvider` interface:

```typescript
export class OllamaProvider implements LLMProvider {
  id = 'ollama';
  capabilities = { chat: true, tools: false, json: false, embed: false };
  
  // Connection testing
  async testConnection(): Promise<boolean>
  
  // Model management
  async listModels(): Promise<string[]>
  async isModelAvailable(modelName: string): Promise<boolean>
  
  // Chat functionality
  async chat(req: ChatRequest): Promise<ChatResult>
  async *chatStream(req: ChatRequest): AsyncIterable<string>
}
```

### 3. Message Flow

```
User Input → Vue Frontend → VS Code Extension → Ollama Provider → Ollama Server → Response → Chat Panel
```

## Features

### Connection Testing

The system automatically tests connections to Ollama:

- **Initial Connection Test**: When the chat panel opens
- **Provider Switch Test**: When changing providers/models
- **Pre-message Test**: Before sending each message

```typescript
// Test connection before sending message
if (this.provider.id === 'ollama') {
  const connectionTest = await (this.provider as any).testConnection();
  if (!connectionTest) {
    throw new Error('Failed to connect to Ollama server. Please check if Ollama is running.');
  }
}
```

### Model Validation

The system validates that selected models are available:

```typescript
// Check if current model is available
const isModelAvailable = await (ollamaProvider as any).isModelAvailable(model);
if (isModelAvailable) {
  console.log(`Model ${model} is available and ready to use.`);
} else {
  console.warn(`Model ${model} is not available. Please pull it first.`);
}
```

### Enhanced Chat with Context

Messages are enhanced with file context when available:

```typescript
// Enhanced system prompt with context
const systemPrompt = contextContent 
  ? `You are a careful coding assistant. You have access to the following files:\n\n${contextContent}\n\nPrefer short, accurate answers. Return code in triple backticks. Use the file context to provide more relevant responses.`
  : 'You are a careful coding assistant. Prefer short, accurate answers. Return code in triple backticks.';
```

## Configuration

### VS Code Settings

The extension uses these configuration keys:

```json
{
  "scubacoder.provider": "ollama",
  "scubacoder.ollama.model": "qwen2.5-coder:7b",
  "scubacoder.ollama.baseUrl": "http://127.0.0.1:11434"
}
```

### Dynamic Provider Switching

Users can switch providers and models through the UI:

```typescript
case 'changeProviderModel': {
  const provider = msg.provider as string;
  const model = msg.model as string;
  
  // Update configuration
  await updateProviderConfig(cfg, { provider, model });
  
  // Create new provider instance
  const newProvider = createProvider({ provider, model });
  
  // Test connection
  if (newProvider.id === 'ollama') {
    const connectionTest = await (newProvider as any).testConnection();
    // ... handle result
  }
}
```

## Error Handling

### Connection Failures

- **Graceful Degradation**: Shows warnings but doesn't crash
- **User Feedback**: Clear error messages with actionable advice
- **Retry Logic**: Allows users to retry failed operations

### Model Issues

- **Availability Checking**: Validates models before use
- **Helpful Messages**: Suggests commands like `ollama pull <model>`
- **Fallback Options**: Uses default models when needed

## Commands

### Test Ollama Connection

```bash
# Command palette: "ScubaCoder: Test Ollama Connection"
scubacoder.ollama.test
```

This command:
- Tests connection to Ollama server
- Lists available models
- Validates current model availability
- Provides helpful feedback

## Usage Examples

### Basic Chat

1. Open the chat panel (`scubacoder.chat.open`)
2. Select Ollama as provider
3. Choose a model (e.g., `qwen2.5-coder:7b`)
4. Type your message and press Enter
5. Message is sent to Ollama and response appears

### With File Context

1. Add context files using the context button
2. Type a question about your code
3. The system includes file content in the prompt
4. Ollama receives enhanced context for better responses

### Switching Models

1. Click the agent selector button
2. Choose a different Ollama model
3. System automatically tests connection
4. New model is ready for use

## Technical Details

### API Endpoints

The Ollama provider uses these endpoints:

- **Connection Test**: `GET /api/tags`
- **List Models**: `GET /api/tags`
- **Chat**: `POST /api/chat`
- **Generate**: `POST /api/generate`

### Streaming Support

Both chat and text generation support streaming:

```typescript
// Stream chat responses
async *chatStream(req: ChatRequest): AsyncIterable<string> {
  // ... implementation
}

// Stream text generation
async *generateTextStream(req: GenRequest): AsyncIterable<string> {
  // ... implementation
}
```

### Token Tracking

The system tracks token usage when available:

```typescript
return { 
  text,
  tokens: {
    prompt: data.prompt_eval_count,
    completion: data.eval_count
  }
};
```

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check if Ollama is running: `ollama serve`
   - Verify URL: `http://127.0.0.1:11434`

2. **Model Not Found**
   - Pull the model: `ollama pull qwen2.5-coder:7b`
   - Check available models: `ollama list`

3. **Slow Responses**
   - Check Ollama server resources
   - Consider using smaller models

### Debug Information

Enable debug logging in VS Code:

```json
{
  "scubacoder.logging.level": "debug"
}
```

## Future Enhancements

- **Model Management**: Pull/remove models through UI
- **Performance Metrics**: Response time tracking
- **Advanced Context**: RAG integration for better file understanding
- **Multi-model Chat**: Support for multiple models in one conversation
- **Custom Prompts**: User-defined system prompts

## Conclusion

The Ollama integration provides a robust, user-friendly way to interact with local AI models. The system handles connection management, model validation, and error recovery automatically, while providing clear feedback to users about the status of their AI interactions.
