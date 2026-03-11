import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import { Search, Library, BookOpen, Loader2 } from "lucide-react";

function App() {
  const [livres, setLivres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState("");

  // Charger les livres depuis Supabase
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

    // Écouter les changements en temps réel
    const channel = supabase
      .channel("livres-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "livres" },
        () => {
          fetchLivres();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filtrer par titre ou auteur
  const livresFiltres = livres.filter((l) => {
    const q = recherche.toLowerCase();
    return (
      l.titre?.toLowerCase().includes(q) || l.auteur?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-biblio-card border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-3">
              <Library className="w-7 h-7 text-biblio-accent" />
              <h1 className="text-xl font-bold text-biblio-text">
                Catalogue de la bibliothèque
              </h1>
            </div>

            {/* Barre de recherche */}
            <div className="relative flex-1 w-full sm:max-w-md sm:ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-biblio-muted" />
              <input
                type="text"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher un titre ou auteur..."
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-biblio-text placeholder-biblio-muted focus:outline-none focus:ring-2 focus:ring-biblio-accent text-sm"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Compteur */}
        <div className="flex items-center gap-2 mb-6 text-biblio-muted text-sm">
          <BookOpen className="w-4 h-4" />
          {livresFiltres.length} livre{livresFiltres.length !== 1 ? "s" : ""}
          {recherche &&
            ` trouvé${livresFiltres.length !== 1 ? "s" : ""} pour "${recherche}"`}
        </div>

        {/* Chargement */}
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-10 h-10 animate-spin text-biblio-accent" />
          </div>
        ) : livresFiltres.length === 0 ? (
          <div className="text-center py-24 text-biblio-muted">
            {recherche
              ? "Aucun livre ne correspond à votre recherche."
              : "Le catalogue est vide pour le moment."}
          </div>
        ) : (
          /* Grille de livres */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {livresFiltres.map((livre) => (
              <div
                key={livre.id}
                className="bg-biblio-card rounded-xl border border-white/10 overflow-hidden flex flex-col transition-transform hover:scale-[1.03]"
              >
                {/* Couverture */}
                <div className="aspect-[2/3] bg-white/5 flex items-center justify-center overflow-hidden">
                  {livre.couverture_url ? (
                    <img
                      src={livre.couverture_url}
                      alt={livre.titre}
                      className="h-full w-full object-contain p-1"
                    />
                  ) : (
                    <BookOpen className="w-10 h-10 text-biblio-muted/30" />
                  )}
                </div>

                {/* Infos */}
                <div className="p-3 flex-1 flex flex-col gap-1">
                  <h3 className="font-semibold text-sm text-biblio-text line-clamp-2 leading-tight">
                    {livre.titre}
                  </h3>
                  <p className="text-xs text-biblio-muted line-clamp-1">
                    {livre.auteur || "Auteur inconnu"}
                  </p>

                  {/* Badge */}
                  <div className="mt-auto pt-2">
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        livre.disponible
                          ? "bg-biblio-success/20 text-biblio-success"
                          : "bg-biblio-danger/20 text-biblio-danger"
                      }`}
                    >
                      {livre.disponible ? "Disponible" : "Emprunté"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 mt-12">
        <p className="text-center text-xs text-biblio-muted">
          Bibliothèque étudiante — Catalogue en ligne
        </p>
      </footer>
    </div>
  );
}

export default App;
