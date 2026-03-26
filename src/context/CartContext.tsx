import React, { createContext, useContext, useState, useCallback } from 'react';
import { CartItem, MenuItem, SizeVariant } from '@/types/database';
import { SelectedOption } from '@/types/customization';

interface CartContextType {
  items: CartItem[];
  restaurantId: string | null;
  addItem: (item: MenuItem, variant?: SizeVariant, customizations?: SelectedOption[], customizationSupplement?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  setRestaurantId: (id: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  const addItem = useCallback((menuItem: MenuItem, variant?: SizeVariant, customizations?: SelectedOption[], customizationSupplement?: number) => {
    setItems((currentItems) => {
      // Generate unique ID based on variant or customizations
      let itemId = menuItem.id;
      let itemPrice = menuItem.prix;
      let itemName = menuItem.nom;
      
      if (variant) {
        itemId = `${menuItem.id}-${variant.name}`;
        itemPrice = variant.price;
        itemName = `${menuItem.nom} (${variant.name})`;
      }
      
      if (customizations && customizations.length > 0) {
        // Create unique ID based on customization selections
        const customKey = customizations.map(c => c.option_name).sort().join('-');
        itemId = `${itemId || menuItem.id}-custom-${Date.now()}`;
        itemPrice = (variant ? variant.price : menuItem.prix) + (customizationSupplement || 0);
        const optionNames = customizations.map(c => c.option_name).slice(0, 3).join(', ');
        const sizeLabel = variant ? `${variant.name} - ` : '';
        itemName = `${menuItem.nom} (${sizeLabel}${optionNames}${customizations.length > 3 ? '...' : ''})`;
      }
      
      // For customized items, always add as new (don't merge)
      if (customizations && customizations.length > 0) {
        return [
          ...currentItems,
          {
            id: itemId,
            nom: itemName,
            prix: itemPrice,
            quantity: 1,
            image: menuItem.image || undefined,
            selectedSize: variant?.name,
            customizations,
          },
        ];
      }
      
      const existingItem = currentItems.find((item) => item.id === itemId);
      
      if (existingItem) {
        return currentItems.map((item) =>
          item.id === itemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      
      return [
        ...currentItems,
        {
          id: itemId,
          nom: itemName,
          prix: itemPrice,
          quantity: 1,
          image: menuItem.image || undefined,
          selectedSize: variant?.name,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
    setRestaurantId(null);
  }, []);

  const getTotalPrice = useCallback(() => {
    return items.reduce((total, item) => total + item.prix * item.quantity, 0);
  }, [items]);

  const getTotalItems = useCallback(() => {
    return items.reduce((total, item) => total + item.quantity, 0);
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        restaurantId,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotalPrice,
        getTotalItems,
        setRestaurantId,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
