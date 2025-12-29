import { Plus, Check } from 'lucide-react';
import { MenuItem } from '@/types/database';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useState } from 'react';

interface MenuItemCardProps {
  item: MenuItem;
  index: number;
}

const MenuItemCard = ({ item, index }: MenuItemCardProps) => {
  const { addItem, items } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const cartItem = items.find(i => i.id === item.id);
  const isInCart = !!cartItem;

  const handleAddToCart = () => {
    if (!item.en_stock_bool) return;
    
    setIsAdding(true);
    addItem(item);
    
    setTimeout(() => setIsAdding(false), 500);
  };

  return (
    <article 
      className={`group bg-card rounded-xl overflow-hidden shadow-card hover:shadow-elevated transition-all duration-300 opacity-0 animate-fade-in ${
        !item.en_stock_bool ? 'opacity-60' : 'hover:scale-[1.02]'
      }`}
      style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'forwards' }}
    >
      <div className="flex gap-4 p-4">
        {/* Image */}
        <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
          <img
            src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'}
            alt={item.nom}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
          {!item.en_stock_bool && (
            <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
              <span className="text-xs font-medium text-destructive bg-destructive/10 px-2 py-1 rounded">
                Rupture
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            <h4 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {item.nom}
            </h4>
            <span className="inline-block mt-1 text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
              {item.categorie}
            </span>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <span className="font-bold text-lg text-primary">
              {item.prix.toFixed(2)} €
            </span>
            
            <Button
              size="icon"
              variant={isInCart ? "success" : "default"}
              className={`rounded-full transition-all duration-300 ${
                isAdding ? 'scale-110' : ''
              } ${!item.en_stock_bool ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleAddToCart}
              disabled={!item.en_stock_bool}
            >
              {isInCart ? (
                <>
                  <Check className="w-4 h-4" />
                  {cartItem && cartItem.quantity > 1 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                      {cartItem.quantity}
                    </span>
                  )}
                </>
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default MenuItemCard;
