import { useState, useMemo } from 'react';
import { MenuItem } from '@/types/database';
import { CustomizationConfig, SelectedOption, OptionGroup } from '@/types/customization';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BowlCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selections: SelectedOption[], totalSupplement: number) => void;
  item: MenuItem;
  config: CustomizationConfig;
}

const BowlCustomizer = ({ isOpen, onClose, onConfirm, item, config }: BowlCustomizerProps) => {
  const [selections, setSelections] = useState<Record<string, SelectedOption[]>>({});

  const toggleOption = (group: OptionGroup, optionName: string, priceSupplement: number) => {
    setSelections(prev => {
      const groupSelections = prev[group.id] || [];
      const existingIndex = groupSelections.findIndex(s => s.option_name === optionName);
      
      if (existingIndex >= 0) {
        // Remove selection
        return {
          ...prev,
          [group.id]: groupSelections.filter((_, i) => i !== existingIndex)
        };
      } else {
        // Add selection if under max
        if (groupSelections.length >= group.max_selections) {
          // Replace oldest selection if at max
          const newSelections = [...groupSelections.slice(1), {
            group_id: group.id,
            option_name: optionName,
            price_supplement: priceSupplement
          }];
          return { ...prev, [group.id]: newSelections };
        }
        return {
          ...prev,
          [group.id]: [...groupSelections, {
            group_id: group.id,
            option_name: optionName,
            price_supplement: priceSupplement
          }]
        };
      }
    });
  };

  const isSelected = (groupId: string, optionName: string) => {
    return (selections[groupId] || []).some(s => s.option_name === optionName);
  };

  const totalSupplement = useMemo(() => {
    return Object.values(selections).flat().reduce((sum, s) => sum + s.price_supplement, 0);
  }, [selections]);

  const allSelectionsFlat = useMemo(() => {
    return Object.values(selections).flat();
  }, [selections]);

  const canConfirm = useMemo(() => {
    return config.option_groups.every(group => {
      if (!group.required) return true;
      const groupSelections = selections[group.id] || [];
      return groupSelections.length > 0;
    });
  }, [config.option_groups, selections]);

  const handleConfirm = () => {
    if (canConfirm) {
      onConfirm(allSelectionsFlat, totalSupplement);
      setSelections({});
      onClose();
    }
  };

  const handleClose = () => {
    setSelections({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            {item.nom}
          </DialogTitle>
          <p className="text-center text-muted-foreground">
            Prix de base: {item.prix.toFixed(2)} €
            {totalSupplement > 0 && (
              <span className="text-primary font-semibold"> + {totalSupplement.toFixed(2)} €</span>
            )}
          </p>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {config.option_groups.map((group) => {
            const groupSelections = selections[group.id] || [];
            
            return (
              <div key={group.id} className="space-y-3">
                <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg">
                  <h3 className="font-semibold text-center uppercase">
                    {group.name} 
                    <span className="font-normal text-sm ml-2">
                      ({groupSelections.length}/{group.max_selections} choix
                      {group.max_selections > 1 ? ' max' : ''})
                    </span>
                  </h3>
                </div>
                
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {group.options.map((option) => {
                    const selected = isSelected(group.id, option.name);
                    
                    return (
                      <button
                        key={option.name}
                        onClick={() => toggleOption(group, option.name, option.price_supplement)}
                        className={cn(
                          "relative flex flex-col items-center p-2 rounded-lg border-2 transition-all",
                          selected 
                            ? "border-primary bg-primary/10" 
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        {selected && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-primary-foreground" />
                          </div>
                        )}
                        
                        <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center text-2xl mb-1 overflow-hidden">
                          {option.image ? (
                            <img src={option.image} alt={option.name} className="w-full h-full object-contain" />
                          ) : (
                            <>
                              {group.id === 'viande' && '🍖'}
                              {group.id === 'viande_sup' && '🥩'}
                              {group.id === 'sauces' && '🥣'}
                              {group.id === 'boisson' && '🥤'}
                            </>
                          )}
                        </div>
                        
                        <span className="text-xs text-center font-medium line-clamp-2">
                          {option.name}
                        </span>
                        
                        {option.price_supplement > 0 && (
                          <span className="text-xs text-primary font-bold">
                            +{option.price_supplement.toFixed(2)} €
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={handleClose} className="flex-1">
            <X className="w-4 h-4 mr-2" />
            Annuler
          </Button>
          <Button 
            variant="hero" 
            onClick={handleConfirm} 
            disabled={!canConfirm}
            className="flex-1"
          >
            <Check className="w-4 h-4 mr-2" />
            Valider ({(item.prix + totalSupplement).toFixed(2)} €)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BowlCustomizer;
