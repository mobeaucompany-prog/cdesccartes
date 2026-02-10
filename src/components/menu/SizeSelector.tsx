import { SizeVariant } from '@/types/database';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SizeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (variant: SizeVariant) => void;
  variants: SizeVariant[];
  itemName: string;
  title?: string;
}

const SizeSelector = ({ isOpen, onClose, onSelect, variants, itemName }: SizeSelectorProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Choisissez la taille</DialogTitle>
          <p className="text-center text-muted-foreground text-sm">{itemName}</p>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          {variants.map((variant) => (
            <Button
              key={variant.name}
              variant="outline"
              className="w-full h-auto py-4 flex justify-between items-center hover:bg-primary hover:text-primary-foreground transition-all"
              onClick={() => {
                onSelect(variant);
                onClose();
              }}
            >
              <span className="font-semibold text-lg">{variant.name}</span>
              <span className="font-bold text-lg">{variant.price.toFixed(2)} €</span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SizeSelector;
