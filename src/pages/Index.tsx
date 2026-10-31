import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Restaurant } from "@/types/database";
import RestaurantCard from "@/components/restaurant/RestaurantCard";
import RestaurantMap from "@/components/RestaurantMap";
import Header from "@/components/layout/Header";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock3, MapPin, Search, Sparkles, Store } from "lucide-react";

type Filter = "all" | "open";

const Index = () => {
  const [userPosition, setUserPosition] = React.useState<[number, number] | null>(null);
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<Filter>("all");

  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserPosition([position.coords.latitude, position.coords.longitude]);
        },
        () => undefined,
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      );
    }
  }, []);

  const { data: restaurants, isLoading } = useQuery({
    queryKey: ["restaurants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .order("statut_ouvert_ferme", { ascending: false });

      if (error) throw error;
      return data as Restaurant[];
    },
  });

  const filteredRestaurants = React.useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return (restaurants ?? []).filter((restaurant) => {
      const matchesSearch =
        !normalizedSearch ||
        restaurant.nom.toLowerCase().includes(normalizedSearch) ||
        restaurant.description?.toLowerCase().includes(normalizedSearch) ||
        restaurant.adresse?.toLowerCase().includes(normalizedSearch);

      const matchesFilter = filter === "all" || restaurant.statut_ouvert_ferme;
      return matchesSearch && matchesFilter;
    });
  }, [restaurants, search, filter]);

  const openCount = restaurants?.filter((restaurant) => restaurant.statut_ouvert_ferme).length ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        <section className="relative overflow-hidden border-b border-border/60 bg-card">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.12),transparent_38%)]" />
          <div className="container relative px-4 py-9 sm:py-12 lg:py-14">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary sm:text-sm">
                <MapPin className="h-4 w-4" />
                Campus Descartes
              </div>

              <h1 className="max-w-2xl text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                Ton déjeuner est prêt quand <span className="text-gradient">tu l'es.</span>
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                Commande auprès des restaurants du campus, choisis ton heure et récupère sans attendre.
              </p>

              <div className="relative mt-6 max-w-2xl">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Rechercher un restaurant..."
                  className="h-14 rounded-2xl border-border bg-background pl-12 pr-4 text-base shadow-card focus-visible:ring-primary"
                />
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={filter === "all" ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => setFilter("all")}
                >
                  <Store className="mr-2 h-4 w-4" />
                  Tous
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={filter === "open" ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => setFilter("open")}
                >
                  <Clock3 className="mr-2 h-4 w-4" />
                  Ouverts maintenant
                </Button>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground sm:text-sm">
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Click & Collect pensé pour le campus
                </span>
                {!isLoading && (
                  <span className="font-medium text-foreground">
                    {openCount} restaurant{openCount > 1 ? "s" : ""} ouvert{openCount > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-7 sm:py-8">
          <div className="container">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Autour de toi</p>
                <h2 className="mt-1 text-2xl font-bold text-foreground">Restaurants du campus</h2>
              </div>
              {!isLoading && (
                <span className="hidden text-sm text-muted-foreground sm:block">
                  {filteredRestaurants.length} résultat{filteredRestaurants.length > 1 ? "s" : ""}
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="overflow-hidden rounded-3xl bg-card shadow-card">
                    <Skeleton className="h-48 w-full" />
                    <div className="space-y-3 p-5">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredRestaurants.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredRestaurants.map((restaurant, index) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    index={index}
                    userPosition={userPosition}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-12 text-center">
                <Search className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <h3 className="font-semibold text-foreground">Aucun restaurant trouvé</h3>
                <p className="mt-1 text-sm text-muted-foreground">Essaie une autre recherche ou affiche tous les restaurants.</p>
              </div>
            )}
          </div>
        </section>

        <section className="px-4 pb-10">
          <div className="container">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Repère</p>
              <h2 className="mt-1 text-xl font-bold text-foreground">Où récupérer ta commande ?</h2>
            </div>
            <RestaurantMap />
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
