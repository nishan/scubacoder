import { createApp } from 'vue';
import App from './App.vue';

// Create and mount the Vue application
const app = createApp(App);

// Global error handler for development
if (process.env.NODE_ENV === 'development') {
  app.config.errorHandler = (err, instance, info) => {
    console.error('Vue Error:', err);
    console.error('Component:', instance);
    console.error('Info:', info);
  };
}

// Mount the app
app.mount('#app');

// Export for potential external use
export default app;

// Make the app available globally for VS Code integration
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
