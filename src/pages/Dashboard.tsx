import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MenuItem, Order, Restaurant, CartItem } from '@/types/database';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Package, Plus, BarChart3, Clock, Euro, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

const Dashboard = () => {
  const queryClient = useQueryClient();
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('');
  const [newItem, setNewItem] = useState({ nom: '', prix: '', image: '' });
  const [selectedPeriod, setSelectedPeriod] = useState('day');

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
  if (restaurants && restaurants.length > 0 && !selectedRestaurant) {
    setSelectedRestaurant(restaurants[0].id);
  }

  // Fetch menu items for selected restaurant
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

  // Fetch orders for selected restaurant
  const { data: orders } = useQuery({
    queryKey: ['orders', selectedRestaurant, selectedPeriod],
    queryFn: async () => {
      let fromDate = new Date();
      
      switch (selectedPeriod) {
        case '5min':
          fromDate.setMinutes(fromDate.getMinutes() - 5);
          break;
        case '1hour':
          fromDate.setHours(fromDate.getHours() - 1);
          break;
        case 'day':
          fromDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          fromDate.setDate(fromDate.getDate() - 7);
          break;
      }

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', selectedRestaurant)
        .gte('created_at', fromDate.toISOString())
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as Order[];
    },
    enabled: !!selectedRestaurant,
  });

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

  // Add item mutation
  const addItemMutation = useMutation({
    mutationFn: async (item: { nom: string; prix: number; image: string }) => {
      const { error } = await supabase
        .from('menu_items')
        .insert({
          ...item,
          restaurant_id: selectedRestaurant,
          categorie: 'Nouveau',
          en_stock_bool: true,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] });
      setNewItem({ nom: '', prix: '', image: '' });
      toast({ title: "Article ajouté !" });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({ title: "Commande mise à jour" });
    },
  });

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.nom || !newItem.prix) return;
    addItemMutation.mutate({
      nom: newItem.nom,
      prix: parseFloat(newItem.prix),
      image: newItem.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
    });
  };

  // Calculate stats
  const totalOrders = orders?.length || 0;
  const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_price), 0) || 0;
  const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard Restaurateur</h1>
            <p className="text-muted-foreground">Gérez votre menu et vos commandes</p>
          </div>
          
          {restaurants && restaurants.length > 1 && (
            <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Choisir un restaurant" />
              </SelectTrigger>
              <SelectContent>
                {restaurants.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <Tabs defaultValue="stock" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="stock" className="gap-2">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Stock</span>
            </TabsTrigger>
            <TabsTrigger value="add" className="gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Ajouter</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Rapports</span>
            </TabsTrigger>
          </TabsList>

          {/* Stock Tab */}
          <TabsContent value="stock" className="space-y-4">
            <div className="bg-card rounded-2xl p-6 shadow-card">
              <h2 className="text-xl font-bold text-foreground mb-4">Gestion du stock</h2>
              
              {menuItems && menuItems.length > 0 ? (
                <div className="space-y-3">
                  {menuItems.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex items-center justify-between p-4 bg-secondary rounded-xl"
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'}
                          alt={item.nom}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-medium text-foreground">{item.nom}</p>
                          <p className="text-sm text-muted-foreground">{item.prix.toFixed(2)} €</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-medium ${item.en_stock_bool ? 'text-success' : 'text-destructive'}`}>
                          {item.en_stock_bool ? 'En stock' : 'Rupture'}
                        </span>
                        <Switch
                          checked={item.en_stock_bool}
                          onCheckedChange={(checked) => 
                            toggleStockMutation.mutate({ id: item.id, en_stock_bool: checked })
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">Aucun article</p>
              )}
            </div>
          </TabsContent>

          {/* Add Item Tab */}
          <TabsContent value="add">
            <div className="bg-card rounded-2xl p-6 shadow-card max-w-md">
              <h2 className="text-xl font-bold text-foreground mb-4">Ajouter un article</h2>
              
              <form onSubmit={handleAddItem} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="itemName">Nom de l'article</Label>
                  <Input
                    id="itemName"
                    placeholder="Ex: Pizza Margherita"
                    value={newItem.nom}
                    onChange={(e) => setNewItem({ ...newItem, nom: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="itemPrice">Prix (€)</Label>
                  <Input
                    id="itemPrice"
                    type="number"
                    step="0.01"
                    placeholder="Ex: 12.50"
                    value={newItem.prix}
                    onChange={(e) => setNewItem({ ...newItem, prix: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="itemImage">URL de l'image (optionnel)</Label>
                  <Input
                    id="itemImage"
                    placeholder="https://..."
                    value={newItem.image}
                    onChange={(e) => setNewItem({ ...newItem, image: e.target.value })}
                  />
                </div>
                
                <Button type="submit" variant="hero" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter l'article
                </Button>
              </form>
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            {/* Period Filter */}
            <div className="flex gap-2 flex-wrap">
              {[
                { value: '5min', label: '5 min' },
                { value: '1hour', label: '1 heure' },
                { value: 'day', label: 'Aujourd\'hui' },
                { value: 'week', label: 'Semaine' },
              ].map((period) => (
                <Button
                  key={period.value}
                  variant={selectedPeriod === period.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPeriod(period.value)}
                >
                  {period.label}
                </Button>
              ))}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-card rounded-2xl p-6 shadow-card">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-muted-foreground">Commandes</span>
                </div>
                <p className="text-3xl font-bold text-foreground">{totalOrders}</p>
              </div>
              
              <div className="bg-card rounded-2xl p-6 shadow-card">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                    <Euro className="w-5 h-5 text-success" />
                  </div>
                  <span className="text-muted-foreground">Chiffre d'affaires</span>
                </div>
                <p className="text-3xl font-bold text-foreground">{totalRevenue.toFixed(2)} €</p>
              </div>
              
              <div className="bg-card rounded-2xl p-6 shadow-card">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-warning" />
                  </div>
                  <span className="text-muted-foreground">En attente</span>
                </div>
                <p className="text-3xl font-bold text-foreground">{pendingOrders}</p>
              </div>
            </div>

            {/* Orders List */}
            <div className="bg-card rounded-2xl p-6 shadow-card">
              <h2 className="text-xl font-bold text-foreground mb-4">Commandes récentes</h2>
              
              {orders && orders.length > 0 ? (
                <div className="space-y-3">
                  {orders.map((order) => {
                    const items = order.items_list as CartItem[];
                    return (
                      <div key={order.id} className="p-4 bg-secondary rounded-xl">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-foreground">{order.client_name}</span>
                              <Badge variant={
                                order.status === 'accepted' ? 'default' :
                                order.status === 'rejected' ? 'destructive' :
                                order.status === 'ready' ? 'default' : 'secondary'
                              } className={
                                order.status === 'accepted' ? 'bg-success' :
                                order.status === 'ready' ? 'bg-primary' : ''
                              }>
                                {order.status === 'pending' ? 'En attente' :
                                 order.status === 'accepted' ? 'Acceptée' :
                                 order.status === 'rejected' ? 'Refusée' : 'Prête'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {items.map(i => `${i.quantity}x ${i.nom}`).join(', ')}
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" />
                              Récupération: {order.pickup_time}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-primary">{order.total_price.toFixed(2)} €</span>
                            
                            {order.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="success"
                                  onClick={() => updateOrderMutation.mutate({ id: order.id, status: 'accepted' })}
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => updateOrderMutation.mutate({ id: order.id, status: 'rejected' })}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                            
                            {order.status === 'accepted' && (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => updateOrderMutation.mutate({ id: order.id, status: 'ready' })}
                              >
                                <AlertCircle className="w-4 h-4 mr-1" />
                                Prête
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">Aucune commande pour cette période</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
