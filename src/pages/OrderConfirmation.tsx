import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Order, CartItem } from '@/types/database';
import Header from '@/components/layout/Header';
import OrderProgressBar from '@/components/order/OrderProgressBar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock3, Home, PackageCheck, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCart } from '@/context/CartContext';

const statusMessages = {
  pending: 'Votre paiement est confirmé. La commande attend maintenant la confirmation du restaurant.',
  accepted: 'Le restaurant a accepté votre commande et la prépare maintenant.',
  rejected: "Le restaurant n'a pas pu accepter votre commande.",
  ready: 'Votre commande est prête. Vous pouvez venir la récupérer.',
};

const statusTitles = {
  pending: 'Commande reçue',
  accepted: 'En préparation',
  rejected: 'Commande refusée',
  ready: 'Prête à récupérer',
};

const OrderConfirmation = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const trackingToken = searchParams.get('token');
  const paidReturn = searchParams.get('paid') === '1';
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (paidReturn) clearCart();
  }, [paidReturn, clearCart]);

  const { isLoading, refetch, isFetching } = useQuery({
    queryKey: ['order', id, trackingToken],
    queryFn: async () => {
      if (!id || !trackingToken) throw new Error('Missing order ID or tracking token');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-order-by-token?id=${id}&token=${trackingToken}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch order');
      }

      const result = await response.json();
      setOrder(result.order as Order);
      return result.order;
    },
    enabled: !!id && !!trackingToken,
  });

  useEffect(() => {
    if (!id || !order) return;

    const channel = supabase
      .channel(`order-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${id}`,
        },
        async () => {
          if (!trackingToken) return;

          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-order-by-token?id=${id}&token=${trackingToken}`,
            {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (response.ok) {
            const result = await response.json();
            setOrder(result.order as Order);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, order, trackingToken]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fbfaf8]">
        <Header />
        <div className="container px-4 py-12">
          <Skeleton className="h-72 w-full max-w-xl mx-auto rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#fbfaf8]">
        <Header />
        <div className="container px-4 py-16 text-center">
          <p className="text-muted-foreground mb-4">Commande non trouvée</p>
          <Button onClick={() => navigate('/')}>Retour à l'accueil</Button>
        </div>
      </div>
    );
  }

  const items = order.items_list as CartItem[];
  const message = statusMessages[order.status];
  const title = statusTitles[order.status];

  return (
    <div className="min-h-screen bg-[#fbfaf8]">
      <Header />

      <main className="container px-4 py-7 sm:py-10">
        <div className="max-w-2xl mx-auto space-y-5">
          <div className="text-center pb-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-2">Suivi de commande</p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground mt-2 max-w-lg mx-auto">{message}</p>
          </div>

          <OrderProgressBar status={order.status} />

          <section className={`rounded-3xl border p-5 sm:p-6 ${order.status === 'ready' ? 'bg-success/10 border-success/20' : 'bg-card border-border/70'}`}>
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${order.status === 'ready' ? 'bg-success text-success-foreground' : 'bg-primary/10 text-primary'}`}>
                {order.status === 'ready' ? <PackageCheck className="w-6 h-6" /> : <Clock3 className="w-6 h-6" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-lg">
                  {order.status === 'ready' ? 'Vous pouvez partir récupérer votre commande' : `Retrait prévu à ${order.pickup_time}`}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Commande au nom de <span className="font-semibold text-foreground">{order.client_name}</span></p>
                {order.status === 'ready' && (
                  <p className="text-sm text-success font-semibold mt-2">Présentez simplement votre nom au restaurant.</p>
                )}
              </div>
            </div>
          </section>

          <section className="bg-card rounded-3xl border border-border/70 p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="font-bold text-xl">Récapitulatif</h2>
                <p className="text-sm text-muted-foreground mt-1">Détail de votre commande</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-2">
                <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Actualiser</span>
              </Button>
            </div>

            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between gap-4 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{item.quantity} × {item.nom}</p>
                    {item.selectedSize && <p className="text-xs text-muted-foreground mt-0.5">{item.selectedSize}</p>}
                  </div>
                  <span className="text-foreground font-semibold shrink-0">{(item.prix * item.quantity).toFixed(2)} €</span>
                </div>
              ))}
            </div>

            <div className="border-t border-border mt-5 pt-4 flex justify-between items-end">
              <span className="font-bold">Total</span>
              <span className="text-2xl font-extrabold">{order.total_price.toFixed(2)} €</span>
            </div>
          </section>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <Button variant="outline" size="lg" onClick={() => navigate('/')} className="rounded-2xl">
              <Home className="w-4 h-4 mr-2" />
              Accueil
            </Button>
            <Button variant="hero" size="lg" onClick={() => navigate('/')} className="rounded-2xl">
              Nouvelle commande
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrderConfirmation;
