import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Order, CartItem } from '@/types/database';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, Clock, XCircle, Loader2, Home, Package } from 'lucide-react';
import { useEffect, useState } from 'react';

const statusConfig = {
  pending: {
    label: 'En attente',
    icon: Loader2,
    color: 'bg-warning text-warning-foreground',
    description: 'Votre commande est en attente de confirmation par le restaurant.',
    animate: true,
  },
  accepted: {
    label: 'Acceptée',
    icon: CheckCircle2,
    color: 'bg-success text-success-foreground',
    description: 'Le restaurant prépare votre commande !',
    animate: false,
  },
  rejected: {
    label: 'Refusée',
    icon: XCircle,
    color: 'bg-destructive text-destructive-foreground',
    description: 'Désolé, le restaurant n\'a pas pu accepter votre commande.',
    animate: false,
  },
  ready: {
    label: 'Prête',
    icon: Package,
    color: 'bg-primary text-primary-foreground',
    description: 'Votre commande est prête ! Venez la récupérer.',
    animate: false,
  },
};

const OrderConfirmation = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);

  // Initial fetch
  const { isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      setOrder(data as Order);
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
          setOrder(payload.new as Order);
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

  const status = statusConfig[order.status];
  const StatusIcon = status.icon;
  const items = order.items_list as CartItem[];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-8">
        <div className="max-w-lg mx-auto">
          {/* Status Card */}
          <div className="bg-card rounded-2xl p-8 shadow-elevated text-center mb-6 animate-scale-in">
            <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${status.color}`}>
              <StatusIcon className={`w-10 h-10 ${status.animate ? 'animate-spin' : ''}`} />
            </div>
            
            <Badge className={`${status.color} border-0 mb-4`}>
              {status.label}
            </Badge>
            
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {order.status === 'ready' ? 'Commande prête !' : 'Merci pour votre commande !'}
            </h1>
            
            <p className="text-muted-foreground mb-6">
              {status.description}
            </p>

            {/* Pickup Info */}
            <div className="bg-secondary rounded-xl p-4 mb-6">
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
