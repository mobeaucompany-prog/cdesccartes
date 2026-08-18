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

  const priceDisplay = hasVariants
    ? `${Math.min(...item.variants!.map(v => v.price)).toFixed(2)} €`
    : `${item.prix.toFixed(2)} €`;

  return (
    <>
      <article
        className={`group relative flex min-h-[138px] overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all duration-300 opacity-0 animate-fade-in ${
          !item.en_stock_bool ? 'opacity-60' : 'hover:-translate-y-0.5 hover:shadow-card'
        }`}
        style={{ animationDelay: `${index * 0.04}s`, animationFillMode: 'forwards' }}
      >
        <div className="flex-1 min-w-0 p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-start gap-2 justify-between">
              <h4 className="font-bold text-base sm:text-lg leading-snug text-foreground pr-1">
                {item.nom}
              </h4>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {hasVariants && (
                <span className="text-[11px] font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                  Plusieurs choix
                </span>
              )}
              {hasCustomization && (
                <span className="text-[11px] font-medium text-success bg-success/10 px-2 py-1 rounded-full">
                  Personnalisable
                </span>
              )}
              {!item.en_stock_bool && (
                <span className="text-[11px] font-semibold text-destructive bg-destructive/10 px-2 py-1 rounded-full">
                  Indisponible
                </span>
              )}
            </div>
          </div>

          <div className="flex items-end justify-between gap-3 mt-4">
            <div className="min-w-0">
              {hasVariants && <p className="text-[11px] text-muted-foreground mb-0.5">À partir de</p>}
              <p className="font-extrabold text-lg text-foreground">{priceDisplay}</p>
            </div>

            <Button
              size="icon"
              variant={isInCart ? 'success' : 'default'}
              aria-label={`Ajouter ${item.nom} au panier`}
              className={`relative h-10 w-10 sm:h-11 sm:w-11 rounded-full shrink-0 shadow-md transition-all duration-300 ${
                isAdding ? 'scale-110' : ''
              } ${!item.en_stock_bool ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleAddToCart}
              disabled={!item.en_stock_bool}
            >
              {isInCart ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {totalQuantity > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 bg-foreground text-background text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-card">
                  {totalQuantity}
                </span>
              )}
            </Button>
          </div>
        </div>

        <div className="relative w-28 sm:w-36 shrink-0 bg-muted/40 overflow-hidden">
          <img
            src={item.image || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500'}
            alt={item.nom}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {!item.en_stock_bool && <div className="absolute inset-0 bg-background/45 backdrop-blur-[1px]" />}
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
