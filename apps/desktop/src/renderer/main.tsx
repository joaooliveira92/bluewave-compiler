import { createRoot } from "react-dom/client";

import { App } from "./shell/App.js";
import { Toaster } from "./components/ui/toast.js";
import { installAppFlushListener } from "./lib/app-flush.js";
import { BackgroundProvider } from "./shell/BackgroundContext.js";
import { DensityProvider } from "./shell/DensityContext.js";
import { FontProvider } from "./shell/FontContext.js";
import { ThemeProvider } from "./shell/ThemeContext.js";
import "./styles/globals.css";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element #root not found");
}

// Answer the shell's bounded-quit flush request (ADR-0121) before first paint.
installAppFlushListener();

createRoot(container).render(
  <ThemeProvider>
    <BackgroundProvider>
      <FontProvider>
        <DensityProvider>
          <App />
          <Toaster />
        </DensityProvider>
      </FontProvider>
    </BackgroundProvider>
  </ThemeProvider>,
);
