import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Unregister any existing service workers to prevent caching issues
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister();
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
