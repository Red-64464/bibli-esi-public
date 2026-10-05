import { useCallback, useEffect, useRef, useState } from "react";
import { Check, RefreshCw, X } from "lucide-react";
import { registerSW } from "virtual:pwa-register";

export default function UpdatePrompt() {
  const [updateReady, setUpdateReady] = useState(false);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [updating, setUpdating] = useState(false);
  const [updated, setUpdated] = useState(false);
  const updateServiceWorker = useRef(null);
  const demoMode = import.meta.env.DEV && new URLSearchParams(window.location.search).has("demo-update");

  useEffect(() => {
    const syncOnline = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", syncOnline);
    window.addEventListener("offline", syncOnline);

    if (demoMode) {
      setUpdateReady(true);
    } else if (import.meta.env.PROD && "serviceWorker" in navigator) {
      updateServiceWorker.current = registerSW({
        immediate: true,
        onNeedRefresh() {
          setUpdateReady(true);
        },
        onRegisterError(error) {
          console.warn("La vérification de mise à jour a échoué :", error);
        },
      });
    }

    return () => {
      window.removeEventListener("online", syncOnline);
      window.removeEventListener("offline", syncOnline);
    };
  }, [demoMode]);

  const applyUpdate = useCallback(async () => {
    if (!isOnline || updating) return;
    setUpdating(true);

    if (demoMode) {
      setUpdateReady(false);
      setUpdated(true);
      setUpdating(false);
      return;
    }

    try {
      if (!updateServiceWorker.current) return;
      await updateServiceWorker.current(true);
    } catch (error) {
      console.error("Impossible d'appliquer la mise à jour :", error);
      setUpdating(false);
    }
  }, [demoMode, isOnline, updating]);

  if (updated) {
    return (
      <div className="pwa-update-toast pwa-update-toast--success" role="status">
        <Check size={18} aria-hidden="true" />
        <span>Version locale à jour</span>
        <button type="button" onClick={() => setUpdated(false)} aria-label="Fermer le message">
          <X size={17} aria-hidden="true" />
        </button>
      </div>
    );
  }

  if (!updateReady || !isOnline) return null;

  return (
    <aside className="pwa-update-toast" role="status" aria-live="polite">
      <span className="pwa-update-icon" aria-hidden="true"><RefreshCw size={18} /></span>
      <span className="pwa-update-copy">
        <strong>Une nouvelle version est prête</strong>
        <small>Actualisez pour profiter des dernières améliorations.</small>
      </span>
      <button className="pwa-update-action" type="button" onClick={applyUpdate} disabled={updating}>
        <RefreshCw size={15} className={updating ? "pwa-update-spinning" : ""} aria-hidden="true" />
        {updating ? "Mise à jour…" : "Mettre à jour"}
      </button>
    </aside>
  );
}
