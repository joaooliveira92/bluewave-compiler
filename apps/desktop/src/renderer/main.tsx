import { createRoot } from "react-dom/client";

import { App } from "./shell/App.js";
import { BackgroundProvider } from "./shell/BackgroundContext.js";
import { DensityProvider } from "./shell/DensityContext.js";
import { ThemeProvider } from "./shell/ThemeContext.js";
import "./styles/globals.css";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element #root not found");
}

createRoot(container).render(
  <ThemeProvider>
    <BackgroundProvider>
      <DensityProvider>
        <App />
      </DensityProvider>
    </BackgroundProvider>
  </ThemeProvider>,
);
