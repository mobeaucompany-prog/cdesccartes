import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/layout/Header';
import CartItemRow from '@/components/cart/CartItemRow';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Clock, CreditCard, ShoppingBag } from 'lucide-react';

const Cart = () => {
  const navigate = useNavigate();
  const { items, getTotalPrice, clearCart, restaurantId } = useCart();
  const [clientName, setClientName] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const totalPrice = getTotalPrice();

  // Generate pickup time options (every 15 min for next 2 hours)
  const getPickupTimes = () => {
    const times: string[] = [];
    const now = new Date();
    const start = new Date(now.getTime() + 15 * 60000); // Start 15 min from now
    
    for (let i = 0; i < 8; i++) {
      const time = new Date(start.getTime() + i * 15 * 60000);
      const hours = time.getHours().toString().padStart(2, '0');
      const minutes = time.getMinutes().toString().padStart(2, '0');
      times.push(`${hours}:${minutes}`);
    }
    
    return times;
  };

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (!restaurantId) throw new Error('Restaurant non sélectionné');
      
      // Use secure server-side function that validates prices
      const { data, error } = await supabase
        .rpc('create_order_secure', {
          p_client_name: clientName.trim(),
          p_items: JSON.parse(JSON.stringify(items)),
          p_pickup_time: pickupTime,
          p_restaurant_id: restaurantId,
        });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      clearCart();
      // Navigate with tracking token for customer access
      navigate(`/order/${data.id}?token=${data.tracking_token}`);
      toast({
        title: "Commande envoyée !",
        description: "Vous recevrez une confirmation bientôt.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de créer la commande. Réessayez.",
        variant: "destructive",
      });
      setIsProcessing(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientName.trim()) {
      toast({
        title: "Nom requis",
        description: "Veuillez entrer votre nom.",
        variant: "destructive",
      });
      return;
    }
    
    if (!pickupTime) {
      toast({
        title: "Heure requise",
        description: "Veuillez choisir une heure de récupération.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate Stripe payment (2 second delay)
    setTimeout(() => {
      createOrderMutation.mutate();
    }, 2000);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
            <ShoppingBag className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Panier vide</h1>
          <p className="text-muted-foreground mb-6">Ajoutez des articles pour commencer</p>
          <Button onClick={() => navigate('/')} variant="hero">
            Voir les restaurants
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-2xl p-6 shadow-card">
              <h1 className="text-2xl font-bold text-foreground mb-6">
                Votre panier
              </h1>
              
              <div className="divide-y divide-border">
                {items.map((item) => (
                  <CartItemRow key={item.id} item={item} />
                ))}
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-2xl p-6 shadow-card sticky top-24">
              <h2 className="text-xl font-bold text-foreground mb-6">
                Finaliser la commande
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Client Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Votre nom</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Jean Dupont"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="bg-background"
                  />
                </div>

                {/* Pickup Time */}
                <div className="space-y-2">
                  <Label htmlFor="time" className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Heure de récupération
                  </Label>
                  <Select value={pickupTime} onValueChange={setPickupTime}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Choisir une heure" />
                    </SelectTrigger>
                    <SelectContent>
                      {getPickupTimes().map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Order Summary */}
                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sous-total</span>
                    <span className="text-foreground">{totalPrice.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Frais de service</span>
                    <span className="text-foreground">0.00 €</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                    <span className="text-foreground">Total</span>
                    <span className="text-primary">{totalPrice.toFixed(2)} €</span>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="hero"
                  size="xl"
                  className="w-full"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                      Paiement en cours...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 mr-2" />
                      Payer {totalPrice.toFixed(2)} €
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Paiement sécurisé simulé (Stripe)
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
