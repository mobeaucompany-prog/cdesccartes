import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Restaurant, MenuItem, parseMenuItemVariants } from '@/types/database';
import Header from '@/components/layout/Header';
import MenuItemCard from '@/components/menu/MenuItemCard';
import FloatingCart from '@/components/cart/FloatingCart';
import { useCart } from '@/context/CartContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock3, MapPin, Phone, ShoppingBag } from 'lucide-react';
import { useEffect, useMemo } from 'react';

const RestaurantMenu = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setRestaurantId } = useCart();

  const { data: restaurant, isLoading: loadingRestaurant } = useQuery({
    queryKey: ['restaurant', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Restaurant | null;
    },
  });

  const { data: menuItems, isLoading: loadingMenu } = useQuery({
    queryKey: ['menu', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', id)
        .order('categorie');

      if (error) throw error;
      return parseMenuItemVariants(data);
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (id) setRestaurantId(id);
  }, [id, setRestaurantId]);

  const categoryOrder = ['Menu midi', 'Pizza', 'Bowl', 'Burger', 'Sandwich', 'Tacos', 'Tex Mex', 'Salades', 'Dessert', 'Boissons'];

  const groupedItems = useMemo(() => {
    if (!menuItems) return {};

    return menuItems.reduce((acc, item) => {
      const category = item.categorie;
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {} as Record<string, MenuItem[]>);
  }, [menuItems]);

  const categories = Object.keys(groupedItems).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  const scrollToCategory = (category: string) => {
    document.getElementById(`category-${category}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loadingRestaurant) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-6 px-4">
          <Skeleton className="h-56 w-full rounded-3xl mb-6" />
          <Skeleton className="h-8 w-1/3 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-12 text-center px-4">
          <p className="text-muted-foreground mb-4">Restaurant non trouvé</p>
          <Button onClick={() => navigate('/')}>Retour à l'accueil</Button>
        </div>
      </div>
    );
  }

  const isOpen = restaurant.statut_ouvert_ferme;

  return (
    <div className="min-h-screen bg-[#fbfaf8] pb-28">
      <Header />

      <section className="relative bg-card">
        <div className="relative h-56 sm:h-72 lg:h-80 overflow-hidden">
          <img
            src={restaurant.photo || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200'}
            alt={restaurant.nom}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-black/10" />

          <Button
            variant="secondary"
            size="icon"
            aria-label="Retour"
            className="absolute top-4 left-4 rounded-full bg-white/95 hover:bg-white shadow-lg"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>

        <div className="container px-4 relative -mt-14 sm:-mt-16 pb-5">
          <div className="bg-card rounded-3xl p-5 sm:p-7 shadow-elevated border border-border/60">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${isOpen ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                    <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-success' : 'bg-muted-foreground'}`} />
                    {isOpen ? 'Ouvert maintenant' : 'Actuellement fermé'}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{restaurant.nom}</h1>
                {restaurant.description && (
                  <p className="text-muted-foreground mt-2 text-sm sm:text-base max-w-2xl">{restaurant.description}</p>
                )}
              </div>
              <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-primary/10 text-primary items-center justify-center shrink-0">
                <ShoppingBag className="w-6 h-6" />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-3 mt-5 pt-5 border-t border-border/70 text-sm">
              <span className="flex items-center gap-2 text-foreground font-medium">
                <Clock3 className="w-4 h-4 text-primary" />
                Préparation estimée 15–25 min
              </span>
              {restaurant.adresse && (
                <span className="flex items-center gap-2 text-muted-foreground min-w-0">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <span className="truncate">{restaurant.adresse}</span>
                </span>
              )}
              {restaurant.telephone && (
                <a href={`tel:${restaurant.telephone}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                  <Phone className="w-4 h-4 text-primary" />
                  {restaurant.telephone}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <div className="sticky top-16 z-40 bg-[#fbfaf8]/95 backdrop-blur-xl border-y border-border/70">
          <div className="container px-4 py-3 overflow-x-auto scrollbar-none">
            <div className="flex gap-2 min-w-max">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => scrollToCategory(category)}
                  className="px-4 py-2 rounded-full bg-card border border-border text-sm font-semibold text-foreground hover:border-primary hover:text-primary active:scale-95 transition-all"
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="container px-4 py-7 sm:py-9">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-1">À emporter</p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Choisissez votre repas</h2>
          <p className="text-muted-foreground text-sm mt-1">Les produits et prix affichés sont ceux du restaurant.</p>
        </div>

        {loadingMenu ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-36 w-full rounded-2xl" />)}
          </div>
        ) : categories.length > 0 ? (
          <div className="space-y-10">
            {categories.map((category) => (
              <section key={category} id={`category-${category}`} className="scroll-mt-36">
                <div className="flex items-end justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-foreground">{category}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {groupedItems[category].length} {groupedItems[category].length > 1 ? 'produits' : 'produit'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {groupedItems[category].map((item, index) => (
                    <MenuItemCard key={item.id} item={item} index={index} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-card rounded-3xl border border-border">
            <p className="text-muted-foreground">Aucun article disponible.</p>
          </div>
        )}
      </main>

      <FloatingCart />
    </div>
  );
};

export default RestaurantMenu;
