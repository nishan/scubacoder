import { createApp } from 'vue';
import App from './App.vue';

// Create the Vue application
const app = createApp(App);

// Global error handler for development
if (process.env.NODE_ENV === 'development') {
  app.config.errorHandler = (err, instance, info) => {
    console.error('Vue Error:', err);
    console.error('Component:', instance);
    console.error('Info:', info);
  };
}

// Make the app available globally for VS Code integration BEFORE mounting
declare global {
  interface Window {
    ScubaCoderChatPanel: {
      createApp: (config: any) => any;
    };
  }
}

window.ScubaCoderChatPanel = {
  createApp: (config: any) => {
    console.log('Vue app initialized with config:', config);
    return app;
  }
};

// Now mount the app
app.mount('#app');

// Export for potential external use
export default app;
