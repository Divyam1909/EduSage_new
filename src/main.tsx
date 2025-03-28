import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import "./index.css";

// Create the root without StrictMode first to avoid unnecessary double rendering
const rootElement = document.getElementById("root")!;
const root = createRoot(rootElement);

// Render with Suspense for better loading experience
root.render(
  <Suspense fallback={<div className="loading-app">Loading application...</div>}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Suspense>
);
