import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Order, CartItem } from '@/types/database';
import Header from '@/components/layout/Header';
import OrderProgressBar from '@/components/order/OrderProgressBar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Home } from 'lucide-react';
import { useEffect, useState } from 'react';

const statusMessages = {
  pending: 'Votre commande est en attente de confirmation par le restaurant.',
  accepted: 'Le restaurant prépare votre commande !',
  rejected: 'Désolé, le restaurant n\'a pas pu accepter votre commande.',
  ready: 'Votre commande est prête ! Venez la récupérer.',
};

const OrderConfirmation = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const trackingToken = searchParams.get('token');
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);

  // Initial fetch with tracking token header for customer access
  const { isLoading } = useQuery({
    queryKey: ['order', id, trackingToken],
    queryFn: async () => {
      // Pass tracking token via custom header for RLS policy
      const headers: Record<string, string> = {};
      if (trackingToken) {
        headers['x-tracking-token'] = trackingToken;
      }
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      setOrder(data as unknown as Order);
      return data;
    },
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!id) return;

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
        (payload) => {
          setOrder(payload.new as unknown as Order);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-12">
          <Skeleton className="h-64 w-full max-w-lg mx-auto rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-12 text-center">
          <p className="text-muted-foreground mb-4">Commande non trouvée</p>
          <Button onClick={() => navigate('/')}>Retour à l'accueil</Button>
        </div>
      </div>
    );
  }

  const items = order.items_list as CartItem[];
  const message = statusMessages[order.status];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-8">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Progress Bar */}
          <OrderProgressBar status={order.status} />
          
          {/* Status Message */}
          <div className="bg-card rounded-2xl p-6 shadow-card text-center animate-scale-in">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {order.status === 'ready' ? '🎉 Commande prête !' : 'Merci pour votre commande !'}
            </h1>
            
            <p className="text-muted-foreground mb-6">
              {message}
            </p>

            {/* Pickup Info */}
            <div className="bg-secondary rounded-xl p-4">
              <div className="flex items-center justify-center gap-2 text-foreground">
                <Clock className="w-5 h-5 text-primary" />
                <span className="font-semibold">Récupération à {order.pickup_time}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {order.client_name}
              </p>
            </div>
          </div>

          {/* Order Details */}
          <div className="bg-card rounded-2xl p-6 shadow-card">
            <h2 className="font-bold text-lg text-foreground mb-4">Récapitulatif</h2>
            
            <div className="space-y-3 mb-6">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.quantity}x {item.nom}
                  </span>
                  <span className="text-foreground font-medium">
                    {(item.prix * item.quantity).toFixed(2)} €
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 flex justify-between font-bold">
              <span className="text-foreground">Total</span>
              <span className="text-primary">{order.total_price.toFixed(2)} €</span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate('/')}
            >
              <Home className="w-4 h-4 mr-2" />
              Accueil
            </Button>
            <Button
              variant="hero"
              className="flex-1"
              onClick={() => navigate('/')}
            >
              Nouvelle commande
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
