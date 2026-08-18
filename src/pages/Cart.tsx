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
import { ArrowLeft, Clock3, CreditCard, ShieldCheck, ShoppingBag, Store } from 'lucide-react';

const Cart = () => {
  const navigate = useNavigate();
  const { items, getTotalPrice, clearCart, restaurantId } = useCart();
  const [clientName, setClientName] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const totalPrice = getTotalPrice();

  const getPickupTimes = () => {
    const times: string[] = [];
    const now = new Date();
    const start = new Date(now.getTime() + 15 * 60000);

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
      navigate(`/order/${data.id}?token=${data.tracking_token}`);
      toast({
        title: 'Commande envoyée !',
        description: 'Le restaurant va recevoir votre commande.',
      });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la commande. Réessayez.',
        variant: 'destructive',
      });
      setIsProcessing(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName.trim()) {
      toast({
        title: 'Nom requis',
        description: 'Veuillez entrer votre nom.',
        variant: 'destructive',
      });
      return;
    }

    if (!pickupTime) {
      toast({
        title: 'Heure requise',
        description: 'Veuillez choisir une heure de récupération.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    // Temporary flow until the real Stripe checkout is connected.
    setTimeout(() => {
      createOrderMutation.mutate();
    }, 1200);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#fbfaf8]">
        <Header />
        <div className="container px-4 py-16 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-primary/10 flex items-center justify-center">
            <ShoppingBag className="w-9 h-9 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Votre panier est vide</h1>
          <p className="text-muted-foreground mb-7">Choisissez un restaurant et ajoutez votre repas.</p>
          <Button onClick={() => navigate('/')} variant="hero" size="lg">
            Voir les restaurants
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfaf8] pb-8">
      <Header />

      <main className="container px-4 py-5 sm:py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 -ml-2">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour au menu
        </Button>

        <div className="mb-6 sm:mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-1">Click & Collect</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Finalisez votre commande</h1>
          <p className="text-muted-foreground mt-2">Choisissez votre heure de retrait puis confirmez votre panier.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.75fr)] gap-5 lg:gap-8 items-start">
          <section className="space-y-4">
            <div className="bg-card rounded-3xl border border-border/70 shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-xl font-bold">Votre panier</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {items.reduce((sum, item) => sum + item.quantity, 0)} {items.reduce((sum, item) => sum + item.quantity, 0) > 1 ? 'articles' : 'article'}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
              </div>

              <div className="divide-y divide-border">
                {items.map((item) => <CartItemRow key={item.id} item={item} />)}
              </div>
            </div>

            <div className="bg-card rounded-3xl border border-border/70 p-5 sm:p-6">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center shrink-0">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold">Retrait au restaurant</p>
                  <p className="text-sm text-muted-foreground mt-1">Pas de livraison : vous récupérez directement votre commande au créneau choisi.</p>
                </div>
              </div>
            </div>
          </section>

          <aside className="lg:sticky lg:top-24">
            <form onSubmit={handleSubmit} className="bg-card rounded-3xl border border-border/70 shadow-card p-5 sm:p-6 space-y-5">
              <div>
                <h2 className="text-xl font-bold">Retrait et paiement</h2>
                <p className="text-sm text-muted-foreground mt-1">Ces informations permettent au restaurant d'identifier votre commande.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nom pour la commande</Label>
                <Input
                  id="name"
                  placeholder="Ex : Jean Dupont"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="h-12 bg-background rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time" className="flex items-center gap-2">
                  <Clock3 className="w-4 h-4 text-primary" />
                  Heure de retrait
                </Label>
                <Select value={pickupTime} onValueChange={setPickupTime}>
                  <SelectTrigger className="h-12 bg-background rounded-xl">
                    <SelectValue placeholder="Choisir un créneau" />
                  </SelectTrigger>
                  <SelectContent>
                    {getPickupTimes().map((time) => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Créneaux proposés toutes les 15 minutes.</p>
              </div>

              <div className="rounded-2xl bg-secondary/70 p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span className="font-medium">{totalPrice.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Frais de service</span>
                  <span className="font-medium">0,00 €</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between items-end">
                  <span className="font-bold">Total</span>
                  <span className="text-2xl font-extrabold text-foreground">{totalPrice.toFixed(2)} €</span>
                </div>
              </div>

              <Button type="submit" variant="hero" size="xl" className="w-full rounded-2xl" disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                    Validation...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Continuer · {totalPrice.toFixed(2)} €
                  </>
                )}
              </Button>

              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-success shrink-0 mt-0.5" />
                <span>Le paiement Stripe réel sera branché lors de la phase paiement. Le parcours actuel conserve le fonctionnement de test existant.</span>
              </div>
            </form>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Cart;
