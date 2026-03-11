import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { supabase } from "./lib/supabase";
import {
  Search,
  BookOpen,
  X,
  SlidersHorizontal,
  ChevronDown,
  Calendar,
  Globe,
  Tag,
  User,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUp,
  LayoutGrid,
  List,
  Sun,
  Moon,
  Download,
  AlertTriangle,
  ChevronUp,
} from "lucide-react";

const PAGE_SIZE = 24;

/* ─── Helpers statut ────────────────────────────────────────────── */

function getStatut(livre) {
  if (livre.statut === "reserve") return "reserve";
  if (livre.statut === "emprunte") return "emprunte";
  if (livre.statut === "disponible") return "disponible";
  if (livre.disponible === false) return "emprunte";
  return "disponible";
}

const STATUT_CONFIG = {
  disponible: {
    label: "Disponible",
    dot: "bg-green-400",
    badge: "bg-green-500/20 text-green-400 border border-green-500/30",
    pill: "bg-green-500/10 border-green-500/20 text-green-400",
    Icon: CheckCircle,
  },
  emprunte: {
    label: "Emprunté",
    dot: "bg-red-400",
    badge: "bg-red-500/20 text-red-400 border border-red-500/30",
    pill: "bg-red-500/10 border-red-500/20 text-red-400",
    Icon: XCircle,
  },
  reserve: {
    label: "Réservé",
    dot: "bg-yellow-400",
    badge: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
    pill: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400",
    Icon: Clock,
  },
};

/* ─── Badge statut ──────────────────────────────────────────────── */

function StatutBadge({ livre }) {
  const statut = getStatut(livre);
  const c = STATUT_CONFIG[statut] ?? STATUT_CONFIG.disponible;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${c.badge}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

/* ─── Skeleton carte ────────────────────────────────────────────── */

function BookCardSkeleton() {
  return (
    <div className="bg-biblio-card rounded-xl border border-white/10 overflow-hidden flex flex-col animate-pulse">
      <div className="aspect-[2/3] bg-white/10" />
      <div className="p-3 flex flex-col gap-2">
        <div className="h-2.5 bg-white/10 rounded-full w-4/5" />
        <div className="h-2.5 bg-white/10 rounded-full w-3/5" />
        <div className="h-2 bg-white/10 rounded-full w-2/5 mt-1" />
      </div>
    </div>
  );
}

/* ─── Skeleton ligne liste ───────────────────────────────────────── */

function BookListRowSkeleton() {
  return (
    <div className="flex items-center gap-3 bg-biblio-card border border-white/10 rounded-xl px-3 py-2.5 animate-pulse">
      <div className="w-9 h-12 flex-shrink-0 rounded-lg bg-white/10" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-2.5 bg-white/10 rounded-full w-2/3" />
        <div className="h-2 bg-white/10 rounded-full w-1/2" />
      </div>
      <div className="w-16 h-5 bg-white/10 rounded-full" />
    </div>
  );
}

/* ─── Ligne liste ───────────────────────────────────────────────── */

function BookListRow({ livre, onClick }) {
  return (
    <div
      onClick={() => onClick(livre)}
      className="flex items-center gap-3 bg-biblio-card border border-white/10 rounded-xl px-3 py-2.5 cursor-pointer hover:border-biblio-accent/50 hover:bg-white/5 transition-all"
    >
      <div className="w-9 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-white/5 flex items-center justify-center">
        {livre.couverture_url ? (
          <img
            src={livre.couverture_url}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <BookOpen className="w-4 h-4 text-biblio-muted/30" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-biblio-text line-clamp-1 leading-tight">
          {livre.titre}
        </p>
        <p className="text-xs text-biblio-muted line-clamp-1 mt-0.5">
          {livre.auteur || "Auteur inconnu"}
          {livre.annee ? ` · ${livre.annee}` : ""}
        </p>
      </div>
      {livre.categorie && (
        <span className="hidden sm:inline text-[10px] text-biblio-accent/70 flex-shrink-0 max-w-[100px] truncate">
          {livre.categorie}
        </span>
      )}
      <div className="flex-shrink-0">
        <StatutBadge livre={livre} />
      </div>
    </div>
  );
}

/* ─── Carte livre ───────────────────────────────────────────────── */

function BookCard({ livre, onClick }) {
  return (
    <div
      onClick={() => onClick(livre)}
      className="bg-biblio-card rounded-xl border border-white/10 overflow-hidden flex flex-col cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:border-biblio-accent/50 hover:shadow-xl hover:shadow-biblio-accent/10 group"
    >
      {/* Couverture */}
      <div className="relative aspect-[2/3] bg-white/5 flex items-center justify-center overflow-hidden">
        {livre.couverture_url ? (
          <img
            src={livre.couverture_url}
            alt={livre.titre}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <BookOpen className="w-10 h-10 text-biblio-muted/30" />
        )}
        {/* Statut overlay */}
        <div className="absolute top-2 left-2">
          <StatutBadge livre={livre} />
        </div>
      </div>

      {/* Infos */}
      <div className="p-3 flex-1 flex flex-col gap-1">
        <h3 className="font-semibold text-sm text-biblio-text line-clamp-2 leading-tight">
          {livre.titre}
        </h3>
        <p className="text-xs text-biblio-muted line-clamp-1">
          {livre.auteur || "Auteur inconnu"}
        </p>
        {livre.categorie && (
          <p className="text-[10px] text-biblio-accent/70 mt-auto pt-1 line-clamp-1">
            {livre.categorie}
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── Modal détail livre ────────────────────────────────────────── */

function BookModal({ livre, onClose }) {
  const statut = getStatut(livre);
  const c = STATUT_CONFIG[statut] ?? STATUT_CONFIG.disponible;
  const Icon = c.Icon;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  const tags = livre.tags
    ? Array.isArray(livre.tags)
      ? livre.tags
      : String(livre.tags)
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
    : [];

  const pctDispo =
    livre.exemplaires_total > 0
      ? Math.round(
          ((livre.exemplaires_disponibles ?? 0) / livre.exemplaires_total) *
            100,
        )
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-biblio-card border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl">
        {/* Bouton fermer */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors z-10"
          aria-label="Fermer"
        >
          <X className="w-5 h-5 text-biblio-muted" />
        </button>

        <div className="flex flex-col sm:flex-row gap-6 p-6">
          {/* Couverture */}
          <div className="flex-shrink-0 mx-auto sm:mx-0">
            <div className="w-36 h-52 sm:w-44 sm:h-64 bg-white/5 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center">
              {livre.couverture_url ? (
                <img
                  src={livre.couverture_url}
                  alt={livre.titre}
                  className="h-full w-full object-cover"
                />
              ) : (
                <BookOpen className="w-16 h-16 text-biblio-muted/20" />
              )}
            </div>
          </div>

          {/* Détails */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            {/* Statut pill */}
            <div
              className={`inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-lg border text-sm font-medium ${c.pill}`}
            >
              <Icon className="w-4 h-4" />
              {c.label}
            </div>

            {/* Titre */}
            <div>
              <h2 className="text-xl font-bold text-biblio-text leading-tight">
                {livre.titre}
              </h2>
              {livre.sous_titre && (
                <p className="text-biblio-muted mt-1 text-sm">
                  {livre.sous_titre}
                </p>
              )}
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-3">
              {livre.auteur && (
                <div className="flex items-start gap-2">
                  <User className="w-4 h-4 text-biblio-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-biblio-muted">Auteur</p>
                    <p className="text-sm text-biblio-text">{livre.auteur}</p>
                  </div>
                </div>
              )}
              {livre.annee && (
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-biblio-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-biblio-muted">Année</p>
                    <p className="text-sm text-biblio-text">{livre.annee}</p>
                  </div>
                </div>
              )}
              {livre.categorie && (
                <div className="flex items-start gap-2">
                  <Tag className="w-4 h-4 text-biblio-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-biblio-muted">Catégorie</p>
                    <p className="text-sm text-biblio-text">
                      {livre.categorie}
                    </p>
                  </div>
                </div>
              )}
              {livre.langue && (
                <div className="flex items-start gap-2">
                  <Globe className="w-4 h-4 text-biblio-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-biblio-muted">Langue</p>
                    <p className="text-sm text-biblio-text">{livre.langue}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Exemplaires */}
            {(livre.exemplaires_total != null ||
              livre.exemplaires_disponibles != null) && (
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-xs text-biblio-muted mb-1">Exemplaires</p>
                <p className="text-sm text-biblio-text font-medium">
                  {livre.exemplaires_disponibles ?? "?"} /{" "}
                  {livre.exemplaires_total ?? "?"} disponible
                  {livre.exemplaires_disponibles !== 1 ? "s" : ""}
                </p>
                {livre.exemplaires_total > 0 && (
                  <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-400 rounded-full transition-all duration-500"
                      style={{ width: `${pctDispo}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* ISBN */}
            {livre.isbn && (
              <p className="text-xs text-biblio-muted">ISBN : {livre.isbn}</p>
            )}
          </div>
        </div>

        {/* Résumé */}
        {livre.resume && (
          <div className="px-6 pb-5 border-t border-white/5 pt-4">
            <h4 className="text-sm font-semibold text-biblio-text mb-2">
              Résumé
            </h4>
            <p className="text-sm text-biblio-muted leading-relaxed">
              {livre.resume}
            </p>
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="px-6 pb-6 flex flex-wrap gap-2">
            {tags.map((tag, i) => (
              <span
                key={i}
                className="text-xs px-2.5 py-1 bg-biblio-accent/10 text-biblio-accent rounded-full border border-biblio-accent/20"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Horaires helpers ───────────────────────────────────────────── */
/*
  Lit depuis la table "settings" (key/value) :
    library_hours        → JSON {"lundi":{"ouvert":true,"debut":"08:00","fin":"17:00"}, ...}
    library_is_closed    → "true" | "false"
    library_closed_message → texte libre (ou "EMPTY")
*/

// Correspondance JS getDay() → clé JSON
const JOURS_FR = [
  "dimanche",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
];
const JOURS_LONG = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];
const JOURS_COURT = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const JOURS_ORDRE = [1, 2, 3, 4, 5, 6, 0]; // lundi → dimanche

function parseHeure(str) {
  if (!str) return null;
  const [h, m] = String(str).split(":").map(Number);
  return h * 60 + (m ?? 0);
}

function formatHeure(str) {
  if (!str) return "";
  const parts = String(str).split(":");
  const h = parseInt(parts[0], 10);
  const m = parts[1] ?? "00";
  return m === "00" ? `${h}h00` : `${h}h${m}`;
}

/* ─── Composant Horaires ─────────────────────────────────────────── */

function HorairesSection() {
  const [hoursMap, setHoursMap] = useState(null); // { lundi: {ouvert,debut,fin}, ... }
  const [isClosed, setIsClosed] = useState(false);
  const [closedMsg, setClosedMsg] = useState("");
  const [now, setNow] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  /* Tick toutes les minutes */
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  /* Chargement + temps réel depuis settings */
  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      try {
        const { data } = await supabase
          .from("settings")
          .select("key,value")
          .in("key", [
            "library_hours",
            "library_is_closed",
            "library_closed_message",
          ]);

        if (!cancelled && data) {
          const row = Object.fromEntries(data.map((r) => [r.key, r.value]));

          // Horaires JSON
          try {
            const parsed = JSON.parse(row.library_hours ?? "{}");
            setHoursMap(parsed);
          } catch (_) {
            setHoursMap({});
          }

          // Fermeture exceptionnelle
          setIsClosed(row.library_is_closed === "true");

          // Message
          const msg = row.library_closed_message ?? "";
          setClosedMsg(msg === "EMPTY" ? "" : msg);
        }
      } catch (_) {
        /* silencieux */
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAll();

    const ch = supabase
      .channel("settings-horaires-rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "settings" },
        fetchAll,
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, []);

  const todayIdx = now.getDay();
  const todayKey = JOURS_FR[todayIdx];
  const todayData = hoursMap?.[todayKey];

  const isOpen = useMemo(() => {
    if (isClosed) return false;
    if (!todayData?.ouvert) return false;
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const open = parseHeure(todayData.debut);
    const close = parseHeure(todayData.fin);
    if (open == null || close == null) return false;
    return nowMin >= open && nowMin < close;
  }, [todayData, isClosed, now]);

  const prochainEvenement = useMemo(() => {
    if (isClosed || !todayData?.ouvert) return null;
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const open = parseHeure(todayData.debut);
    const close = parseHeure(todayData.fin);
    if (open == null || close == null) return null;
    if (nowMin < open)
      return { type: "ouvre", heure: formatHeure(todayData.debut) };
    if (nowMin < close)
      return { type: "ferme", heure: formatHeure(todayData.fin) };
    return null;
  }, [todayData, isClosed, now]);

  if (loading) return null;
  if (!hoursMap || Object.keys(hoursMap).length === 0) return null;

  const fermetureExcep = isClosed;

  return (
    <section className="mb-8">
      <div className="bg-biblio-card border border-white/10 rounded-2xl overflow-hidden">
        {/* En-tête cliquable */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors text-left"
          aria-expanded={!collapsed}
        >
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-biblio-accent/10 flex-shrink-0">
              <Clock className="w-4 h-4 text-biblio-accent" />
            </div>
            <span className="font-semibold text-biblio-text text-sm sm:text-base">
              Horaires d&apos;ouverture
            </span>

            {/* Badge ouvert / fermé */}
            {!fermetureExcep && (
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
                  isOpen
                    ? "bg-green-500/15 text-green-400 border border-green-500/25"
                    : "bg-red-500/15 text-red-400 border border-red-500/25"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    isOpen ? "bg-green-400 animate-pulse" : "bg-red-400"
                  }`}
                />
                {isOpen ? "Ouvert" : "Fermé"}
                {prochainEvenement && (
                  <span className="font-normal opacity-75 hidden sm:inline">
                    &nbsp;·&nbsp;
                    {prochainEvenement.type === "ferme"
                      ? `jusqu'à ${prochainEvenement.heure}`
                      : `ouvre à ${prochainEvenement.heure}`}
                  </span>
                )}
              </span>
            )}

            {/* Badge fermeture exceptionnelle */}
            {fermetureExcep && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/25 flex-shrink-0">
                <AlertTriangle className="w-3 h-3" />
                Fermé exceptionnellement
              </span>
            )}
          </div>

          {collapsed ? (
            <ChevronDown className="w-4 h-4 text-biblio-muted flex-shrink-0 ml-2" />
          ) : (
            <ChevronUp className="w-4 h-4 text-biblio-muted flex-shrink-0 ml-2" />
          )}
        </button>

        {/* Corps */}
        {!collapsed && (
          <div className="border-t border-white/10">
            {/* Bandeau fermeture exceptionnelle */}
            {fermetureExcep && (
              <div className="flex items-start gap-3 bg-red-500/10 border-b border-red-500/20 px-5 py-4">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-400 text-sm">
                    Fermeture exceptionnelle
                  </p>
                  {closedMsg && (
                    <p className="text-sm text-red-300/80 mt-0.5 leading-relaxed">
                      {closedMsg}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Grille 7 jours */}
            <div className="grid grid-cols-7 divide-x divide-white/5">
              {JOURS_ORDRE.map((jourIdx) => {
                const key = JOURS_FR[jourIdx];
                const d = hoursMap?.[key];
                const isToday = jourIdx === todayIdx;
                const ferme = !d || !d.ouvert;

                return (
                  <div
                    key={jourIdx}
                    className={`flex flex-col items-center py-4 px-0.5 sm:px-2 gap-1.5 ${
                      isToday ? "bg-biblio-accent/10" : ""
                    }`}
                  >
                    {/* Nom du jour */}
                    <span
                      className={`text-[9px] sm:text-[11px] font-bold uppercase tracking-wider ${
                        isToday ? "text-biblio-accent" : "text-biblio-muted"
                      }`}
                    >
                      <span className="sm:hidden">
                        {JOURS_COURT[jourIdx].slice(0, 2)}
                      </span>
                      <span className="hidden sm:inline">
                        {JOURS_LONG[jourIdx]}
                      </span>
                    </span>

                    {/* Point indicateur du jour actuel */}
                    {isToday && (
                      <span className="w-1 h-1 rounded-full bg-biblio-accent" />
                    )}

                    {/* Plage horaire ou Fermé */}
                    {ferme ? (
                      <span className="text-[9px] sm:text-[11px] text-biblio-muted/40 font-medium text-center">
                        Fermé
                      </span>
                    ) : (
                      <div className="flex flex-col items-center gap-0.5">
                        <span
                          className={`text-[9px] sm:text-xs font-semibold ${
                            isToday ? "text-biblio-text" : "text-biblio-muted"
                          }`}
                        >
                          {formatHeure(d.debut)}
                        </span>
                        <span className="w-3 h-px bg-biblio-muted/25" />
                        <span
                          className={`text-[9px] sm:text-xs font-semibold ${
                            isToday ? "text-biblio-text" : "text-biblio-muted"
                          }`}
                        >
                          {formatHeure(d.fin)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── App principale ────────────────────────────────────────────── */

function App() {
  const [livres, setLivres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filtres, setFiltres] = useState({
    disponibilite: "all",
    categorie: "",
    langue: "",
    annee: "",
  });
  const [tri, setTri] = useState("titre");
  const [showFilters, setShowFilters] = useState(false);
  const [livreSelectionne, setLivreSelectionne] = useState(null);
  const [scrollY, setScrollY] = useState(0);
  const [vue, setVue] = useState(() => localStorage.getItem("vue") || "grille");
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "dark",
  );
  const [page, setPage] = useState(1);
  const [installPrompt, setInstallPrompt] = useState(null);
  const searchRef = useRef(null);
  const sentinelRef = useRef(null);

  /* ── Thème ── */
  useEffect(() => {
    if (theme === "light") {
      document.documentElement.classList.add("theme-light");
    } else {
      document.documentElement.classList.remove("theme-light");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  /* ── Vue ── */
  useEffect(() => {
    localStorage.setItem("vue", vue);
  }, [vue]);

  /* ── PWA install prompt ── */
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstallPrompt(null));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  /* ── Infinite scroll ── */
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setPage((p) => p + 1);
      },
      { rootMargin: "300px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loading]);

  /* ── Reset pagination quand les filtres changent ── */
  useEffect(() => {
    setPage(1);
  }, [recherche, filtres, tri]);

  /* ── Scroll tracker ── */
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── Chargement Supabase ── */
  useEffect(() => {
    const fetchLivres = async () => {
      try {
        const { data, error } = await supabase
          .from("livres")
          .select("*")
          .order("titre", { ascending: true });
        if (error) throw error;
        setLivres(data || []);
      } catch (err) {
        console.error("Erreur chargement livres:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLivres();

    // Temps réel
    const channel = supabase
      .channel("livres-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "livres" },
        () => fetchLivres(),
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  /* ── Suggestions de recherche ── */
  useEffect(() => {
    if (recherche.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const q = recherche.toLowerCase();
    const matches = livres
      .filter((l) => {
        const tagsStr = Array.isArray(l.tags)
          ? l.tags.join(" ")
          : (l.tags ?? "");
        return (
          l.titre?.toLowerCase().includes(q) ||
          l.auteur?.toLowerCase().includes(q) ||
          l.isbn?.toLowerCase().includes(q) ||
          tagsStr.toLowerCase().includes(q)
        );
      })
      .slice(0, 6)
      .map((l) => ({ id: l.id, titre: l.titre, auteur: l.auteur }));
    setSuggestions(matches);
    setShowSuggestions(matches.length > 0);
  }, [recherche, livres]);

  /* ── Valeurs uniques pour les selects de filtres ── */
  const categories = useMemo(
    () => [...new Set(livres.map((l) => l.categorie).filter(Boolean))].sort(),
    [livres],
  );
  const langues = useMemo(
    () => [...new Set(livres.map((l) => l.langue).filter(Boolean))].sort(),
    [livres],
  );
  const annees = useMemo(
    () =>
      [...new Set(livres.map((l) => l.annee).filter(Boolean))].sort(
        (a, b) => b - a,
      ),
    [livres],
  );

  /* ── Filtrage + tri ── */
  const livresFiltres = useMemo(() => {
    const q = recherche.toLowerCase().trim();

    let result = livres.filter((l) => {
      const tagsStr = Array.isArray(l.tags) ? l.tags.join(" ") : (l.tags ?? "");
      const matchRecherche =
        !q ||
        l.titre?.toLowerCase().includes(q) ||
        l.auteur?.toLowerCase().includes(q) ||
        l.isbn?.toLowerCase().includes(q) ||
        tagsStr.toLowerCase().includes(q);

      const statut = getStatut(l);
      const matchDispo =
        filtres.disponibilite === "all" || statut === filtres.disponibilite;
      const matchCat = !filtres.categorie || l.categorie === filtres.categorie;
      const matchLang = !filtres.langue || l.langue === filtres.langue;
      const matchAnnee =
        !filtres.annee || String(l.annee) === String(filtres.annee);

      return (
        matchRecherche && matchDispo && matchCat && matchLang && matchAnnee
      );
    });

    switch (tri) {
      case "titre":
        result = [...result].sort((a, b) =>
          (a.titre ?? "").localeCompare(b.titre ?? ""),
        );
        break;
      case "auteur":
        result = [...result].sort((a, b) =>
          (a.auteur ?? "").localeCompare(b.auteur ?? ""),
        );
        break;
      case "annee":
        result = [...result].sort((a, b) => (b.annee ?? 0) - (a.annee ?? 0));
        break;
      case "popularite":
        result = [...result].sort(
          (a, b) => (b.emprunts_total ?? 0) - (a.emprunts_total ?? 0),
        );
        break;
    }
    return result;
  }, [livres, recherche, filtres, tri]);

  const hasActiveFilters =
    filtres.disponibilite !== "all" ||
    filtres.categorie ||
    filtres.langue ||
    filtres.annee;

  const livresDisponibles = livresFiltres.filter(
    (l) => getStatut(l) === "disponible",
  ).length;

  const livresAffiches = useMemo(
    () => livresFiltres.slice(0, page * PAGE_SIZE),
    [livresFiltres, page],
  );
  const hasMore = livresAffiches.length < livresFiltres.length;

  const handleInstall = useCallback(async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setInstallPrompt(null);
  }, [installPrompt]);

  const resetFilters = () =>
    setFiltres({ disponibilite: "all", categorie: "", langue: "", annee: "" });

  /* ── Render ── */
  return (
    <div className="min-h-screen">
      {/* ── Header ── */}
      <header className="bg-biblio-card border-b border-white/10 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          {/* Logo mobile */}
          <div className="flex items-center gap-2 mb-3 sm:hidden">
            <img src="/logo.png" alt="Bibl'ESI" className="h-9 w-auto" />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Logo desktop */}
            <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
              <img src="/logo.png" alt="Bibl'ESI" className="h-11 w-auto" />
              <div className="w-px h-6 bg-white/10" />
              <h1 className="text-lg font-semibold text-biblio-muted whitespace-nowrap">
                Catalogue de la bibliothèque
              </h1>
            </div>

            {/* Barre de recherche + actions */}
            <div className="flex gap-2 w-full sm:ml-auto sm:max-w-xl">
              {/* Recherche avec autocomplete */}
              <div className="relative flex-1" ref={searchRef}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-biblio-muted pointer-events-none" />
                <input
                  type="text"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                  onFocus={() =>
                    suggestions.length > 0 && setShowSuggestions(true)
                  }
                  onBlur={() =>
                    setTimeout(() => setShowSuggestions(false), 150)
                  }
                  placeholder="Titre, auteur, ISBN…"
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-9 py-2.5 text-biblio-text placeholder-biblio-muted focus:outline-none focus:ring-2 focus:ring-biblio-accent text-sm"
                />
                {recherche && (
                  <button
                    onClick={() => setRecherche("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-biblio-muted hover:text-biblio-text transition-colors"
                    aria-label="Effacer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {/* Dropdown suggestions */}
                {showSuggestions && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-biblio-card border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                    {suggestions.map((s) => (
                      <button
                        key={s.id}
                        onMouseDown={() => {
                          setRecherche(s.titre);
                          setShowSuggestions(false);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                      >
                        <p className="text-sm text-biblio-text leading-tight">
                          {s.titre}
                        </p>
                        {s.auteur && (
                          <p className="text-xs text-biblio-muted">
                            {s.auteur}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Bouton filtres */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors flex-shrink-0 ${
                  showFilters || hasActiveFilters
                    ? "bg-biblio-accent border-biblio-accent text-white"
                    : "bg-white/5 border-white/10 text-biblio-muted hover:text-biblio-text hover:bg-white/10"
                }`}
                aria-label="Filtres"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Filtres</span>
                {hasActiveFilters && (
                  <span className="w-2 h-2 bg-white rounded-full" />
                )}
              </button>

              {/* Tri */}
              <div className="relative flex-shrink-0">
                <select
                  value={tri}
                  onChange={(e) => setTri(e.target.value)}
                  className="appearance-none bg-white/5 border border-white/10 rounded-lg pl-3 pr-8 py-2.5 text-biblio-text text-sm focus:outline-none focus:ring-2 focus:ring-biblio-accent cursor-pointer"
                >
                  <option value="titre">A → Z</option>
                  <option value="auteur">Auteur</option>
                  <option value="annee">Nouveautés</option>
                  <option value="popularite">Popularité</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-biblio-muted pointer-events-none" />
              </div>

              {/* Thème clair / sombre */}
              <button
                onClick={() =>
                  setTheme((t) => (t === "dark" ? "light" : "dark"))
                }
                className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-biblio-muted hover:text-biblio-text hover:bg-white/10 transition-colors flex-shrink-0"
                aria-label="Basculer le thème"
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>

              {/* Installer l'appli (PWA) */}
              {installPrompt && (
                <button
                  onClick={handleInstall}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-biblio-accent hover:bg-biblio-accent-hover text-white text-sm font-medium transition-colors flex-shrink-0"
                  aria-label="Installer l'application"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Installer</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Panneau filtres ── */}
        {showFilters && (
          <div className="border-t border-white/10 bg-biblio-bg/60 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
              <div className="flex flex-wrap gap-4 items-end">
                {/* Disponibilité */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-biblio-muted font-semibold uppercase tracking-wider">
                    Disponibilité
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { val: "all", label: "Tous" },
                      { val: "disponible", label: "🟢 Disponible" },
                      { val: "emprunte", label: "🔴 Emprunté" },
                      { val: "reserve", label: "🟡 Réservé" },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        onClick={() =>
                          setFiltres((f) => ({
                            ...f,
                            disponibilite: opt.val,
                          }))
                        }
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors font-medium ${
                          filtres.disponibilite === opt.val
                            ? "bg-biblio-accent border-biblio-accent text-white"
                            : "bg-white/5 border-white/10 text-biblio-muted hover:text-biblio-text hover:border-white/20"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Catégorie */}
                {categories.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-biblio-muted font-semibold uppercase tracking-wider">
                      Catégorie
                    </label>
                    <select
                      value={filtres.categorie}
                      onChange={(e) =>
                        setFiltres((f) => ({
                          ...f,
                          categorie: e.target.value,
                        }))
                      }
                      className="biblio-select"
                    >
                      <option value="">Toutes</option>
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Langue */}
                {langues.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-biblio-muted font-semibold uppercase tracking-wider">
                      Langue
                    </label>
                    <select
                      value={filtres.langue}
                      onChange={(e) =>
                        setFiltres((f) => ({ ...f, langue: e.target.value }))
                      }
                      className="biblio-select"
                    >
                      <option value="">Toutes</option>
                      {langues.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Année */}
                {annees.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-biblio-muted font-semibold uppercase tracking-wider">
                      Année
                    </label>
                    <select
                      value={filtres.annee}
                      onChange={(e) =>
                        setFiltres((f) => ({ ...f, annee: e.target.value }))
                      }
                      className="biblio-select"
                    >
                      <option value="">Toutes</option>
                      {annees.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Reset */}
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors font-medium"
                  >
                    <X className="w-3 h-3" />
                    Réinitialiser
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ── Contenu principal ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Compteur + toggle grille/liste */}
        <div className="flex items-center justify-between gap-2 mb-6">
          <div className="flex items-center gap-2 text-biblio-muted text-sm min-w-0">
            <BookOpen className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">
              <span className="text-biblio-text font-medium">
                {livresFiltres.length}
              </span>{" "}
              livre{livresFiltres.length !== 1 ? "s" : ""}
              {recherche && ` pour "${recherche}"`}
              {livresFiltres.length > 0 && (
                <span className="ml-2 text-biblio-muted/60">
                  ·{" "}
                  <span className="text-green-400 font-medium">
                    {livresDisponibles}
                  </span>{" "}
                  disponible{livresDisponibles !== 1 ? "s" : ""}
                </span>
              )}
            </span>
          </div>
          {/* Toggle vue */}
          <div className="flex gap-1 bg-white/5 border border-white/10 rounded-lg p-1 flex-shrink-0">
            <button
              onClick={() => setVue("grille")}
              className={`p-1.5 rounded-md transition-colors ${
                vue === "grille"
                  ? "bg-biblio-accent text-white"
                  : "text-biblio-muted hover:text-biblio-text"
              }`}
              aria-label="Vue grille"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setVue("liste")}
              className={`p-1.5 rounded-md transition-colors ${
                vue === "liste"
                  ? "bg-biblio-accent text-white"
                  : "text-biblio-muted hover:text-biblio-text"
              }`}
              aria-label="Vue liste"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chargement — skeletons adaptés à la vue */}
        {loading ? (
          vue === "grille" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <BookCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <BookListRowSkeleton key={i} />
              ))}
            </div>
          )
        ) : livresFiltres.length === 0 ? (
          <div className="text-center py-24 flex flex-col items-center gap-4">
            <BookOpen className="w-14 h-14 text-biblio-muted/20" />
            <div>
              <p className="font-medium text-biblio-text mb-1">
                Aucun livre trouvé
              </p>
              <p className="text-sm text-biblio-muted">
                {recherche || hasActiveFilters
                  ? "Essayez de modifier vos filtres ou votre recherche."
                  : "Le catalogue est vide pour le moment."}
              </p>
            </div>
            {(recherche || hasActiveFilters) && (
              <button
                onClick={() => {
                  setRecherche("");
                  resetFilters();
                }}
                className="text-sm text-biblio-accent hover:underline"
              >
                Effacer les filtres
              </button>
            )}
          </div>
        ) : vue === "grille" ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4">
              {livresAffiches.map((livre) => (
                <BookCard
                  key={livre.id}
                  livre={livre}
                  onClick={setLivreSelectionne}
                />
              ))}
            </div>
            {hasMore && <div ref={sentinelRef} className="h-4 mt-4" />}
          </>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              {livresAffiches.map((livre) => (
                <BookListRow
                  key={livre.id}
                  livre={livre}
                  onClick={setLivreSelectionne}
                />
              ))}
            </div>
            {hasMore && <div ref={sentinelRef} className="h-4 mt-4" />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 mt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <HorairesSection />
          <p className="text-center text-xs text-biblio-muted">
            Bibl’ESI — Bibliothèque étudiante de l’ESI
          </p>
        </div>
      </footer>

      {/* Scroll to top */}
      {scrollY > 300 && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-biblio-accent hover:bg-biblio-accent-hover text-white shadow-lg transition-all duration-200 hover:scale-110"
          aria-label="Remonter en haut"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* Modal détail */}
      {livreSelectionne && (
        <BookModal
          livre={livreSelectionne}
          onClose={() => setLivreSelectionne(null)}
        />
      )}
    </div>
  );
}

export default App;
