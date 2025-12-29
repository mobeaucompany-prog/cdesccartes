import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, UtensilsCrossed, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { Badge } from '@/components/ui/badge';

const Header = () => {
  const location = useLocation();
  const { getTotalItems } = useCart();
  const totalItems = getTotalItems();
  const isDashboard = location.pathname.startsWith('/dashboard');

  return (
    <header className="sticky top-0 z-50 w-full bg-card/95 backdrop-blur-md border-b border-border shadow-card">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-md group-hover:shadow-glow transition-shadow duration-300">
            <UtensilsCrossed className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl text-foreground">
            Click<span className="text-gradient">&</span>Descartes
          </span>
        </Link>

        <nav className="flex items-center gap-3">
          {!isDashboard ? (
            <>
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
              </Link>
              <Link to="/cart">
                <Button variant="outline" size="sm" className="relative gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  <span className="hidden sm:inline">Panier</span>
                  {totalItems > 0 && (
                    <Badge 
                      className="absolute -top-2 -right-2 h-5 min-w-5 flex items-center justify-center p-0 text-xs gradient-primary border-0"
                    >
                      {totalItems}
                    </Badge>
                  )}
                </Button>
              </Link>
            </>
          ) : (
            <Link to="/">
              <Button variant="outline" size="sm" className="gap-2">
                <UtensilsCrossed className="w-4 h-4" />
                <span className="hidden sm:inline">Voir le menu</span>
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
