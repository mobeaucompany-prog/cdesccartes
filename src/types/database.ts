export interface Restaurant {
  id: string;
  nom: string;
  statut_ouvert_ferme: boolean;
  photo: string | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  adresse: string | null;
  telephone: string | null;
  horaires: Record<string, string> | null;
  created_at: string;
  updated_at: string;
}

export interface SizeVariant {
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  nom: string;
  prix: number;
  categorie: string;
  en_stock_bool: boolean;
  image: string | null;
  variants: SizeVariant[] | null;
  created_at: string;
  updated_at: string;
}

// Helper to parse variants from JSON
export function parseMenuItemVariants(data: unknown): MenuItem[] {
  if (!Array.isArray(data)) return [];
  return data.map((item: Record<string, unknown>) => ({
    ...item,
    variants: item.variants ? (item.variants as SizeVariant[]) : null,
  })) as MenuItem[];
}

export interface Order {
  id: string;
  client_name: string;
  items_list: CartItem[];
  total_price: number;
  status: 'pending' | 'accepted' | 'rejected' | 'ready';
  pickup_time: string;
  restaurant_id: string;
  created_at: string;
}

export interface CartItem {
  id: string;
  nom: string;
  prix: number;
  quantity: number;
  image?: string;
  selectedSize?: string;
}
