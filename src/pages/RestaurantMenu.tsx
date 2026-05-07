import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Restaurant, MenuItem, parseMenuItemVariants } from '@/types/database';
import Header from '@/components/layout/Header';
import MenuItemCard from '@/components/menu/MenuItemCard';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';
import FloatingCart from '@/components/cart/FloatingCart';
import { useCart } from '@/context/CartContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, MapPin, Phone } from 'lucide-react';
import { useEffect, useMemo } from 'react';

const RestaurantMenu = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setRestaurantId } = useCart();

  // Fetch restaurant details
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

  // Fetch menu items
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

  // Set restaurant ID in cart context
  useEffect(() => {
    if (id) {
      setRestaurantId(id);
    }
  }, [id, setRestaurantId]);

  // Category display order (Dessert and Boissons last)
  const categoryOrder = ['Menu midi', 'Pizza', 'Bowl', 'Burger', 'Sandwich', 'Tacos', 'Tex Mex', 'Salades', 'Dessert', 'Boissons'];

  // Group items by category
  const groupedItems = useMemo(() => {
    if (!menuItems) return {};
    
    return menuItems.reduce((acc, item) => {
      const category = item.categorie;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {} as Record<string, MenuItem[]>);
  }, [menuItems]);

  // Sort categories: known order first, then alphabetically for any others
  const categories = Object.keys(groupedItems).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  if (loadingRestaurant) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-6">
          <Skeleton className="h-48 w-full rounded-2xl mb-6" />
          <Skeleton className="h-8 w-1/3 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-12 text-center">
          <p className="text-muted-foreground mb-4">Restaurant non trouvé</p>
          <Button onClick={() => navigate('/')}>Retour à l'accueil</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      
      {/* Restaurant Header */}
      <section className="relative">
        <div className="relative h-48 sm:h-64 overflow-hidden">
          <img
            src={restaurant.photo || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'}
            alt={restaurant.nom}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          
          {/* Back Button */}
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-4 left-4 rounded-full shadow-elevated"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </div>

        <div className="container relative -mt-16">
          <div className="bg-card rounded-2xl p-6 shadow-elevated">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              {restaurant.nom}
            </h1>
            
            {restaurant.description && (
              <p className="text-muted-foreground mb-4">{restaurant.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {restaurant.horaires && Object.keys(restaurant.horaires).length > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-primary" />
                  {(() => {
                    const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
                    const today = days[new Date().getDay()];
                    return restaurant.horaires[today] || 'Horaires non disponibles';
                  })()}
                </span>
              )}
              {restaurant.telephone && (
                <a href={`tel:${restaurant.telephone}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                  <Phone className="w-4 h-4 text-primary" />
                  {restaurant.telephone}
                </a>
              )}
            </div>
            {restaurant.adresse && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                <span>{restaurant.adresse}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Menu */}
      <section className="container py-8">
        {loadingMenu ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : categories.length > 0 ? (
          <div className="space-y-8">
            {categories.map((category) => (
              <div key={category}>
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 gradient-primary rounded-full" />
                  {category}
                </h2>
                <Carousel opts={{ align: 'start', dragFree: true }} className="w-full">
                  <CarouselContent className="-ml-3">
                    {groupedItems[category].map((item, index) => (
                      <CarouselItem key={item.id} className="pl-3 basis-[75%] sm:basis-[45%] md:basis-[35%] lg:basis-[28%]">
                        <MenuItemCard item={item} index={index} />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="hidden sm:flex -left-4" />
                  <CarouselNext className="hidden sm:flex -right-4" />
                </Carousel>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Aucun article disponible.</p>
          </div>
        )}
      </section>

      <FloatingCart />
    </div>
  );
};

export default RestaurantMenu;
