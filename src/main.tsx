import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import App from "./App.tsx";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { appTheme } from "@/theme";
import "./index.css";
import "katex/dist/katex.min.css";
import "@fontsource/outfit/300.css";
import "@fontsource/outfit/400.css";
import "@fontsource/outfit/500.css";
import "@fontsource/outfit/600.css";
import "@fontsource/outfit/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider theme={appTheme}>
    <CssBaseline />
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </ThemeProvider>,
);
