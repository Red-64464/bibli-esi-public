import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "./lib/supabase";
import {
  Search,
  BookOpen,
  Loader2,
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
} from "lucide-react";

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
  const searchRef = useRef(null);

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
                  placeholder="Titre, auteur, ISBN, tags…"
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
        {/* Compteur */}
        <div className="flex items-center gap-2 mb-6 text-biblio-muted text-sm">
          <BookOpen className="w-4 h-4" />
          <span>
            <span className="text-biblio-text font-medium">
              {livresFiltres.length}
            </span>{" "}
            livre{livresFiltres.length !== 1 ? "s" : ""}
            {recherche && ` pour "${recherche}"`}
          </span>
        </div>

        {/* Chargement */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-biblio-accent" />
            <p className="text-biblio-muted text-sm">
              Chargement du catalogue…
            </p>
          </div>
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
        ) : (
          /* Grille responsive */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {livresFiltres.map((livre) => (
              <BookCard
                key={livre.id}
                livre={livre}
                onClick={setLivreSelectionne}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 mt-12">
        <p className="text-center text-xs text-biblio-muted">
          Bibl'ESI — Bibliothèque étudiante de l'ESI
        </p>
      </footer>

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
