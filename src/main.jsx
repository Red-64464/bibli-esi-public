import { Component, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App.jsx";

class AppErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("Erreur Bibl'ESI", error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center", background: "#0f172a", color: "white" }}>
        <section>
          <h1>Une erreur est survenue</h1>
          <p>Le catalogue est protégé. Réessayez sans fermer l’application.</p>
          <button type="button" onClick={() => window.location.reload()} style={{ marginTop: 16, padding: "12px 18px", borderRadius: 10, border: 0, background: "#6366f1", color: "white", fontWeight: 700 }}>
            Réessayer
          </button>
        </section>
      </main>
    );
  }
}

// Enregistrement du Service Worker (PWA)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.warn("SW registration failed:", err);
    });
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 30 * 60_000,
      retry: 2,
      refetchOnWindowFocus: true,
    },
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
);
