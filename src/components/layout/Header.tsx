import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Store, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { Badge } from '@/components/ui/badge';

const Header = () => {
  const location = useLocation();
  const { getTotalItems } = useCart();
  const totalItems = getTotalItems();
  const isDashboard = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/merchants');

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-card/90 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link to="/" className="group flex min-w-0 items-center gap-2.5">
          <div className="gradient-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-md transition-transform duration-300 group-hover:scale-105">
            <UtensilsCrossed className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <span className="block truncate text-lg font-extrabold tracking-tight text-foreground sm:text-xl">
              Click<span className="text-gradient">&</span>Descartes
            </span>
            <span className="hidden text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground sm:block">
              Campus Descartes
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          {!isDashboard ? (
            <>
              <Link to="/dashboard" className="hidden sm:block">
                <Button variant="ghost" size="sm" className="gap-2 rounded-xl text-muted-foreground">
                  <Store className="h-4 w-4" />
                  Espace restaurant
                </Button>
              </Link>
              <Link to="/cart">
                <Button variant="outline" size="sm" className="relative h-10 gap-2 rounded-xl bg-background px-3">
                  <ShoppingBag className="h-4 w-4" />
                  <span className="hidden sm:inline">Panier</span>
                  {totalItems > 0 && (
                    <Badge className="gradient-primary absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center border-0 p-0 text-xs">
                      {totalItems}
                    </Badge>
                  )}
                </Button>
              </Link>
            </>
          ) : (
            <Link to="/">
              <Button variant="outline" size="sm" className="gap-2 rounded-xl">
                <UtensilsCrossed className="h-4 w-4" />
                <span className="hidden sm:inline">Voir l'application</span>
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
