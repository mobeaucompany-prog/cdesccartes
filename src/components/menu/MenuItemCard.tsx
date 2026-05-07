import { Plus, Check } from 'lucide-react';
import { MenuItem, SizeVariant } from '@/types/database';
import { SelectedOption } from '@/types/customization';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useState } from 'react';
import SizeSelector from './SizeSelector';
import BowlCustomizer from './BowlCustomizer';

interface MenuItemCardProps {
  item: MenuItem;
  index: number;
}

const MenuItemCard = ({ item, index }: MenuItemCardProps) => {
  const { addItem, items } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [showSizeSelector, setShowSizeSelector] = useState(false);
  const [showBowlCustomizer, setShowBowlCustomizer] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<SizeVariant | undefined>(undefined);
  
  const cartItem = items.find(i => i.id === item.id || i.id.startsWith(`${item.id}-`));
  const isInCart = !!cartItem;
  const totalQuantity = items
    .filter(i => i.id === item.id || i.id.startsWith(`${item.id}-`))
    .reduce((sum, i) => sum + i.quantity, 0);

  const hasVariants = item.variants && item.variants.length > 0;
  const hasCustomization = item.customization_options?.option_groups && item.customization_options.option_groups.length > 0;

  const handleAddToCart = () => {
    if (!item.en_stock_bool) return;
    
    // If has variants, always show size selector first
    if (hasVariants) {
      setShowSizeSelector(true);
    } else if (hasCustomization) {
      setSelectedVariant(undefined);
      setShowBowlCustomizer(true);
    } else {
      setIsAdding(true);
      addItem(item);
      setTimeout(() => setIsAdding(false), 500);
    }
  };

  const handleSizeSelect = (variant: SizeVariant) => {
    // Skip customization when "Seul" variant is chosen (menu options only apply to "Menu")
    if (hasCustomization && variant.name !== 'Seul') {
      setSelectedVariant(variant);
      setShowSizeSelector(false);
      setShowBowlCustomizer(true);
    } else {
      setIsAdding(true);
      addItem(item, variant);
      setTimeout(() => setIsAdding(false), 500);
    }
  };

  const handleCustomizationConfirm = (selections: SelectedOption[], totalSupplement: number) => {
    setIsAdding(true);
    addItem(item, selectedVariant, selections, totalSupplement);
    setSelectedVariant(undefined);
    setTimeout(() => setIsAdding(false), 500);
  };

  // Display price range if variants exist
  const priceDisplay = hasVariants 
    ? `${Math.min(...item.variants!.map(v => v.price)).toFixed(2)} €`
    : `${item.prix.toFixed(2)} €`;

  return (
    <>
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
              src={item.image || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400'}
              alt={item.nom}
              className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
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
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                  {item.categorie}
                </span>
                {hasVariants && (
                  <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {item.variants!.some(v => v.name === 'Menu' || v.name === 'Seul') ? '2 choix' : '2 tailles'}
                  </span>
                )}
                {hasCustomization && (
                  <span className="text-xs text-success bg-success/10 px-2 py-0.5 rounded-full">
                    Personnalisable
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-2">
              <div className="flex flex-col">
                <span className="font-bold text-lg text-primary">
                  {priceDisplay}
                </span>
                {hasVariants && (
                  <span className="text-xs text-muted-foreground">à partir de</span>
                )}
              </div>
              
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
                    {totalQuantity > 1 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                        {totalQuantity}
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

      {hasVariants && (
        <SizeSelector
          isOpen={showSizeSelector}
          onClose={() => setShowSizeSelector(false)}
          onSelect={handleSizeSelect}
          variants={item.variants!}
          itemName={item.nom}
        />
      )}

      {hasCustomization && (
        <BowlCustomizer
          isOpen={showBowlCustomizer}
          onClose={() => setShowBowlCustomizer(false)}
          onConfirm={handleCustomizationConfirm}
          item={item}
          config={item.customization_options!}
        />
      )}
    </>
  );
};

export default MenuItemCard;
