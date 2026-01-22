import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Debug logging for mobile
console.log('[Eatio] App starting...');
console.log('[Eatio] Environment:', {
  API_URL: import.meta.env.VITE_API_URL,
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  HAS_ANON_KEY: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
});

// Global error handler
window.addEventListener('error', (event) => {
  console.error('[Eatio] Global error:', event.error);
  alert(`Error: ${event.error?.message || 'Unknown error'}`);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Eatio] Unhandled rejection:', event.reason);
  alert(`Promise rejection: ${event.reason?.message || event.reason}`);
});

// Unregister any existing service workers to prevent caching issues
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister();
    });
  });
}

try {
  console.log('[Eatio] Creating React root...');
  createRoot(document.getElementById("root")!).render(<App />);
  console.log('[Eatio] React root created successfully');
} catch (error) {
  console.error('[Eatio] Failed to create root:', error);
  alert(`Failed to start app: ${error}`);
}
