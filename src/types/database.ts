import { CustomizationConfig, SelectedOption } from './customization';

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
  stripe_account_id?: string | null;
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
  customization_options: CustomizationConfig | null;
  created_at: string;
  updated_at: string;
}

export function parseMenuItemVariants(data: unknown): MenuItem[] {
  if (!Array.isArray(data)) return [];
  return data.map((item: Record<string, unknown>) => ({
    ...item,
    variants: item.variants ? (item.variants as SizeVariant[]) : null,
    customization_options: item.customization_options ? (item.customization_options as CustomizationConfig) : null,
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
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
  stripe_checkout_session_id?: string | null;
  stripe_payment_intent_id?: string | null;
  paid_at?: string | null;
  created_at: string;
}

export interface CartItem {
  id: string;
  nom: string;
  prix: number;
  quantity: number;
  image?: string;
  selectedSize?: string;
  customizations?: SelectedOption[];
}
