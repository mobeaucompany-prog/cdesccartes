import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';

const FloatingCart = () => {
  const { getTotalItems, getTotalPrice } = useCart();
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] max-w-lg animate-slide-up">
      <Link
        to="/cart"
        className="flex items-center justify-between gap-4 rounded-2xl bg-foreground text-background px-4 sm:px-5 py-3.5 shadow-elevated border border-white/10 active:scale-[0.99] transition-transform"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-10 h-10 rounded-xl bg-background/10 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5" />
            <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-foreground">
              {totalItems}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-bold leading-tight">Voir mon panier</p>
            <p className="text-xs text-background/65 truncate">
              {totalItems} {totalItems > 1 ? 'articles' : 'article'} prêt à commander
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="font-extrabold text-lg">{totalPrice.toFixed(2)} €</span>
          <ArrowRight className="w-4 h-4 opacity-70" />
        </div>
      </Link>
    </div>
  );
};

export default FloatingCart;
