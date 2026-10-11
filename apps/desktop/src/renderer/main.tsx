// Must be first: disables Zod's eval probe before any schema is parsed, so the
// strict production CSP never logs a blocked `new Function` (see the module).
import "./zodJitless.js";

import { createRoot } from "react-dom/client";

import { App } from "./shell/App.js";
import { Toaster } from "./components/ui/toast.js";
import { BackgroundProvider } from "./shell/BackgroundContext.js";
import { DensityProvider } from "./shell/DensityContext.js";
import { FontProvider } from "./shell/FontContext.js";
import { ThemeProvider } from "./shell/ThemeContext.js";
import "./styles/globals.css";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element #root not found");
}

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
