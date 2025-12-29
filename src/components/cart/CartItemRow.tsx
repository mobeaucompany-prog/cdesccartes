import { Minus, Plus, Trash2 } from 'lucide-react';
import { CartItem } from '@/types/database';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';

interface CartItemRowProps {
  item: CartItem;
}

const CartItemRow = ({ item }: CartItemRowProps) => {
  const { updateQuantity, removeItem } = useCart();

  return (
    <div className="flex items-center gap-4 py-4 border-b border-border last:border-0">
      {/* Image */}
      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
        <img
          src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'}
          alt={item.nom}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-foreground truncate">{item.nom}</h4>
        <p className="text-primary font-semibold">{item.prix.toFixed(2)} €</p>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => updateQuantity(item.id, item.quantity - 1)}
        >
          <Minus className="w-3 h-3" />
        </Button>
        
        <span className="w-8 text-center font-semibold text-foreground">
          {item.quantity}
        </span>
        
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => updateQuantity(item.id, item.quantity + 1)}
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      {/* Total & Delete */}
      <div className="flex items-center gap-3">
        <span className="font-bold text-foreground min-w-[60px] text-right">
          {(item.prix * item.quantity).toFixed(2)} €
        </span>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => removeItem(item.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default CartItemRow;
