# ScubaCoder Chat Panel

A modern Vue.js-based chat interface for the ScubaCoder VS Code extension, designed to provide a rich, responsive chat experience with AI coding assistance.

## Features

- **Modern Vue 3 Composition API** - Built with the latest Vue.js features
- **TypeScript Support** - Full type safety and IntelliSense
- **VS Code Integration** - Seamless communication with the VS Code extension
- **Responsive Design** - Works on various screen sizes
- **Context File Selection** - Visual file context management
- **Provider/Model Selection** - Easy switching between AI providers
- **Code Block Support** - Syntax highlighting and copy/insert functionality
- **Real-time Updates** - Live chat with loading indicators

## Project Structure

```
src/
├── components/          # Vue components
│   ├── MessageCard.vue      # Individual chat message display
│   ├── ContextPills.vue     # Context file selection pills
│   ├── ProviderSelector.vue # AI provider/model selector
│   └── ChatComposer.vue     # Chat input composer
├── composables/        # Vue composables
│   ├── useVSCode.ts         # VS Code communication
│   └── useChat.ts           # Chat state management
├── types.ts            # TypeScript type definitions
├── App.vue             # Main application component
└── main.ts             # Application entry point
```

## Communication Protocol

The Vue app communicates with the VS Code extension using a well-defined eventing protocol:

### Outgoing Messages (Vue → VS Code)
- `chat` - Send a chat message
- `insert` - Insert code into active editor
- `searchWorkspace` - Search workspace files
- `changeProviderModel` - Change AI provider/model
- `log` - Log messages to VS Code

### Incoming Messages (VS Code → Vue)
- `userMessage` - Confirm user message received
- `loading` - Show loading indicator
- `reply` - Display AI response
- `updateProviderModel` - Update provider/model state
- `searchResults` - Display search results

## Development

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development Server
The development server runs on `http://localhost:5173` and provides:
- Hot module replacement (HMR)
- TypeScript compilation
- Vue single-file component support
- CSS preprocessing

## Building for VS Code

### Production Build
```bash
npm run build:prod
```

This creates a library build in the `dist/` directory that can be loaded into the VS Code WebView.

### Integration with VS Code
The built Vue app is designed to be loaded into a VS Code WebView. The extension should:

1. Copy the built files from `dist/` to the extension's resources
2. Load the Vue app in the WebView HTML
3. Initialize communication using the `vscode.postMessage` API

## Styling

The app uses VS Code's built-in CSS variables for consistent theming:
- `--vscode-foreground` - Primary text color
- `--vscode-background` - Background color
- `--vscode-button-background` - Button colors
- `--vscode-input-background` - Input field colors

## Browser Support

- Modern browsers with ES2020 support
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Contributing

1. Follow Vue.js style guide
2. Use TypeScript for all new code
3. Maintain component composition patterns
4. Test VS Code integration thoroughly

## License

MIT License - see LICENSE file for details
