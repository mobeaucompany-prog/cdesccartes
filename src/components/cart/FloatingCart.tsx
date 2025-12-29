import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';

const FloatingCart = () => {
  const { getTotalItems, getTotalPrice } = useCart();
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md animate-slide-up">
      <Link to="/cart">
        <Button 
          variant="cart" 
          size="lg" 
          className="w-full justify-between px-6 py-4 h-auto"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary-foreground text-primary text-xs font-bold rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            </div>
            <span className="font-semibold">Voir le panier</span>
          </div>
          <span className="font-bold text-lg">{totalPrice.toFixed(2)} €</span>
        </Button>
      </Link>
    </div>
  );
};

export default FloatingCart;
