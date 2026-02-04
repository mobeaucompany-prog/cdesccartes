export interface Restaurant {
  id: string;
  nom: string;
  statut_ouvert_ferme: boolean;
  photo: string | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  nom: string;
  prix: number;
  categorie: string;
  en_stock_bool: boolean;
  image: string | null;
  created_at: string;
  updated_at: string;
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
}
