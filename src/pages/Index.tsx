import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Restaurant } from '@/types/database';
import RestaurantCard from '@/components/restaurant/RestaurantCard';
import Header from '@/components/layout/Header';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Sparkles } from 'lucide-react';

const Index = () => {
  const { data: restaurants, isLoading } = useQuery({
    queryKey: ['restaurants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('statut_ouvert_ferme', { ascending: false });
      
      if (error) throw error;
      return data as Restaurant[];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="gradient-hero py-12 px-4">
        <div className="container">
          <div className="flex items-center gap-2 text-primary mb-3 animate-fade-in">
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-medium">Campus Descartes</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 animate-fade-in stagger-1">
            Commandez, <span className="text-gradient">Récupérez</span>,<br />
            Savourez !
          </h1>
          
          <p className="text-muted-foreground text-lg max-w-md animate-fade-in stagger-2">
            Découvrez les meilleurs restaurants du campus et récupérez votre commande en quelques minutes.
          </p>
          
          <div className="flex items-center gap-2 mt-6 text-sm text-muted-foreground animate-fade-in stagger-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Click & Collect rapide et sans contact</span>
          </div>
        </div>
      </section>

      {/* Restaurants Grid */}
      <section className="py-8 px-4">
        <div className="container">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Restaurants disponibles
          </h2>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card rounded-2xl overflow-hidden shadow-card">
                  <Skeleton className="h-48 w-full" />
                  <div className="p-5 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : restaurants && restaurants.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {restaurants.map((restaurant, index) => (
                <RestaurantCard 
                  key={restaurant.id} 
                  restaurant={restaurant} 
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Aucun restaurant disponible pour le moment.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Index;
