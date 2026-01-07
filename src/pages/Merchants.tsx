import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MenuItem, Order, Restaurant, CartItem } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  ChefHat, 
  Clock, 
  CheckCircle2, 
  PlayCircle, 
  Bell, 
  Package,
  Utensils,
  Store,
  Menu,
  LogOut
} from 'lucide-react';

const Merchants = () => {
  const { signOut, user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'orders' | 'menu'>('orders');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  // Fetch restaurants
  const { data: restaurants } = useQuery({
    queryKey: ['restaurants'],
    queryFn: async () => {
      const { data, error } = await supabase.from('restaurants').select('*');
      if (error) throw error;
      return data as Restaurant[];
    },
  });

  // Set default restaurant
  useEffect(() => {
    if (restaurants && restaurants.length > 0 && !selectedRestaurant) {
      setSelectedRestaurant(restaurants[0].id);
    }
  }, [restaurants, selectedRestaurant]);

  // Fetch menu items
  const { data: menuItems } = useQuery({
    queryKey: ['menu', selectedRestaurant],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', selectedRestaurant)
        .order('categorie');
      if (error) throw error;
      return data as MenuItem[];
    },
    enabled: !!selectedRestaurant,
  });

  // Fetch pending orders
  const { data: orders } = useQuery({
    queryKey: ['merchant-orders', selectedRestaurant],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', selectedRestaurant)
        .in('status', ['pending', 'accepted'])
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as unknown as Order[];
    },
    enabled: !!selectedRestaurant,
  });

  // Real-time subscription for new orders
  useEffect(() => {
    if (!selectedRestaurant) return;

    const channel = supabase
      .channel('merchant-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${selectedRestaurant}`,
        },
        (payload) => {
          // Play notification sound
          if (audioRef.current) {
            audioRef.current.play().catch(() => {});
          }
          
          // Vibrate if supported
          if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
          }

          // Mark as new order for animation
          const newOrder = payload.new as unknown as Order;
          setNewOrderIds(prev => new Set(prev).add(newOrder.id));
          setTimeout(() => {
            setNewOrderIds(prev => {
              const next = new Set(prev);
              next.delete(newOrder.id);
              return next;
            });
          }, 5000);

          queryClient.invalidateQueries({ queryKey: ['merchant-orders'] });
          toast({
            title: "🔔 Nouvelle commande !",
            description: `${newOrder.client_name} - Récupération à ${newOrder.pickup_time}`,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${selectedRestaurant}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['merchant-orders'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedRestaurant, queryClient]);

  // Toggle stock mutation
  const toggleStockMutation = useMutation({
    mutationFn: async ({ id, en_stock_bool }: { id: string; en_stock_bool: boolean }) => {
      const { error } = await supabase
        .from('menu_items')
        .update({ en_stock_bool })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] });
      toast({ title: "Stock mis à jour" });
    },
  });

  // Update order status mutation
  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['merchant-orders'] });
      const message = status === 'accepted' ? 'Préparation lancée !' : 'Commande marquée comme prête !';
      toast({ title: message });
    },
  });

  const pendingOrders = orders?.filter(o => o.status === 'pending') || [];
  const preparingOrders = orders?.filter(o => o.status === 'accepted') || [];

  const currentRestaurant = restaurants?.find(r => r.id === selectedRestaurant);

  return (
    <div className="min-h-screen bg-background">
      {/* Hidden audio element for notification */}
      <audio ref={audioRef} preload="auto">
        <source src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" type="audio/mpeg" />
      </audio>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-foreground text-background">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Click&Descartes</h1>
                <p className="text-sm opacity-80">Interface Restaurateur</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {currentRestaurant && (
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4" />
                  <span className="font-medium">{currentRestaurant.nom}</span>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className="text-background hover:bg-background/10"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="sticky top-[72px] z-40 bg-card border-b border-border">
        <div className="container">
          <div className="flex">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 py-4 flex items-center justify-center gap-2 font-medium transition-colors relative ${
                activeTab === 'orders' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Package className="w-5 h-5" />
              Commandes
              {pendingOrders.length > 0 && (
                <Badge className="bg-primary text-primary-foreground animate-pulse">
                  {pendingOrders.length}
                </Badge>
              )}
              {activeTab === 'orders' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('menu')}
              className={`flex-1 py-4 flex items-center justify-center gap-2 font-medium transition-colors relative ${
                activeTab === 'menu' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Menu className="w-5 h-5" />
              Menu
              {activeTab === 'menu' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-6">
        {activeTab === 'orders' ? (
          <div className="space-y-6">
            {/* Pending Orders */}
            <section>
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-warning" />
                En attente ({pendingOrders.length})
              </h2>
              
              {pendingOrders.length === 0 ? (
                <div className="bg-card rounded-2xl p-8 text-center shadow-card">
                  <div className="w-16 h-16 bg-secondary rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Utensils className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">Aucune commande en attente</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingOrders.map((order) => {
                    const items = order.items_list as CartItem[];
                    const isNew = newOrderIds.has(order.id);
                    
                    return (
                      <div 
                        key={order.id}
                        className={`bg-card rounded-2xl p-5 shadow-card border-2 transition-all ${
                          isNew ? 'border-warning animate-pulse shadow-warning/20' : 'border-transparent'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-bold text-lg text-foreground">{order.client_name}</h3>
                            <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                              <Clock className="w-4 h-4" />
                              Récupération à {order.pickup_time}
                            </div>
                          </div>
                          <span className="font-bold text-xl text-primary">{order.total_price.toFixed(2)} €</span>
                        </div>
                        
                        <div className="bg-secondary rounded-xl p-4 mb-4">
                          {items.map((item, idx) => (
                            <div key={idx} className="flex justify-between py-1">
                              <span className="text-foreground">{item.quantity}x {item.nom}</span>
                              <span className="text-muted-foreground">{(item.prix * item.quantity).toFixed(2)} €</span>
                            </div>
                          ))}
                        </div>
                        
                        <Button
                          className="w-full"
                          variant="hero"
                          size="lg"
                          onClick={() => updateOrderMutation.mutate({ id: order.id, status: 'accepted' })}
                        >
                          <PlayCircle className="w-5 h-5 mr-2" />
                          Lancer la préparation
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Preparing Orders */}
            <section>
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-success" />
                En préparation ({preparingOrders.length})
              </h2>
              
              {preparingOrders.length === 0 ? (
                <div className="bg-card rounded-2xl p-8 text-center shadow-card">
                  <p className="text-muted-foreground">Aucune commande en préparation</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {preparingOrders.map((order) => {
                    const items = order.items_list as CartItem[];
                    
                    return (
                      <div 
                        key={order.id}
                        className="bg-card rounded-2xl p-5 shadow-card border-2 border-success/30"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-lg text-foreground">{order.client_name}</h3>
                              <Badge className="bg-success text-success-foreground">En préparation</Badge>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                              <Clock className="w-4 h-4" />
                              Récupération à {order.pickup_time}
                            </div>
                          </div>
                          <span className="font-bold text-xl text-primary">{order.total_price.toFixed(2)} €</span>
                        </div>
                        
                        <div className="bg-secondary rounded-xl p-4 mb-4">
                          {items.map((item, idx) => (
                            <div key={idx} className="flex justify-between py-1">
                              <span className="text-foreground">{item.quantity}x {item.nom}</span>
                            </div>
                          ))}
                        </div>
                        
                        <Button
                          className="w-full"
                          variant="success"
                          size="lg"
                          onClick={() => updateOrderMutation.mutate({ id: order.id, status: 'ready' })}
                        >
                          <CheckCircle2 className="w-5 h-5 mr-2" />
                          Commande Prête
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        ) : (
          /* Menu Management */
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Utensils className="w-5 h-5 text-primary" />
              Gestion des stocks
            </h2>
            
            {menuItems && menuItems.length > 0 ? (
              menuItems.map((item) => (
                <div 
                  key={item.id}
                  className="bg-card rounded-2xl p-4 shadow-card flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'}
                      alt={item.nom}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                    <div>
                      <h3 className="font-semibold text-foreground">{item.nom}</h3>
                      <p className="text-sm text-muted-foreground">{item.prix.toFixed(2)} €</p>
                      <Badge variant="secondary" className="mt-1">{item.categorie}</Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium ${item.en_stock_bool ? 'text-success' : 'text-destructive'}`}>
                      {item.en_stock_bool ? 'Disponible' : 'Rupture'}
                    </span>
                    <Switch
                      checked={item.en_stock_bool}
                      onCheckedChange={(checked) => 
                        toggleStockMutation.mutate({ id: item.id, en_stock_bool: checked })
                      }
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-card rounded-2xl p-8 text-center shadow-card">
                <p className="text-muted-foreground">Aucun article dans le menu</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Merchants;
