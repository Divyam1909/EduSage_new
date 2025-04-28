//@ts-nocheck
import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import { ToastProvider } from "./components/ToastContainer.tsx";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

// Create the root without StrictMode first to avoid unnecessary double rendering
const rootElement = document.getElementById("root")!;
const root = createRoot(rootElement);

// Render with Suspense for better loading experience
root.render(
  <Suspense fallback={<div className="loading-app">Loading application...</div>}>
    <BrowserRouter>
      <ToastProvider>
        <App />
        <Analytics />
        <SpeedInsights />
      </ToastProvider>
    </BrowserRouter>
  </Suspense>
);
