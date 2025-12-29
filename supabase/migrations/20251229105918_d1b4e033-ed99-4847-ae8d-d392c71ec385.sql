-- Create restaurants table
CREATE TABLE public.restaurants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  statut_ouvert_ferme BOOLEAN NOT NULL DEFAULT true,
  photo TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create menu_items table
CREATE TABLE public.menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  nom TEXT NOT NULL,
  prix DECIMAL(10,2) NOT NULL,
  categorie TEXT NOT NULL,
  en_stock_bool BOOLEAN NOT NULL DEFAULT true,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  items_list JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_price DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'ready')),
  pickup_time TEXT NOT NULL,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Restaurants are publicly readable
CREATE POLICY "Restaurants are viewable by everyone" 
ON public.restaurants 
FOR SELECT 
USING (true);

-- Menu items are publicly readable
CREATE POLICY "Menu items are viewable by everyone" 
ON public.menu_items 
FOR SELECT 
USING (true);

-- Orders are publicly insertable and readable (for demo purposes)
CREATE POLICY "Anyone can create orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view orders" 
ON public.orders 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can update orders" 
ON public.orders 
FOR UPDATE 
USING (true);

-- Allow public insert/update/delete on restaurants and menu_items (for dashboard)
CREATE POLICY "Anyone can manage restaurants" 
ON public.restaurants 
FOR ALL 
USING (true);

CREATE POLICY "Anyone can manage menu items" 
ON public.menu_items 
FOR ALL 
USING (true);

-- Enable realtime for orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_restaurants_updated_at
BEFORE UPDATE ON public.restaurants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at
BEFORE UPDATE ON public.menu_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample restaurant data
INSERT INTO public.restaurants (nom, statut_ouvert_ferme, photo, description) VALUES
('Bistro Descartes', true, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800', 'Cuisine française traditionnelle revisitée'),
('Pizza Roma', true, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800', 'Pizzas artisanales au feu de bois'),
('Sushi Zen', false, 'https://images.unsplash.com/photo-1579027989536-b7b1f875659b?w=800', 'Sushi frais et authentique');

-- Insert sample menu items
INSERT INTO public.menu_items (restaurant_id, nom, prix, categorie, en_stock_bool, image) 
SELECT 
  r.id,
  item.nom,
  item.prix,
  item.categorie,
  item.en_stock,
  item.image
FROM public.restaurants r
CROSS JOIN (
  VALUES 
    ('Burger Classique', 12.50, 'Plats', true, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400'),
    ('Salade César', 9.90, 'Entrées', true, 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400'),
    ('Frites Maison', 4.50, 'Accompagnements', true, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400'),
    ('Tiramisu', 6.90, 'Desserts', true, 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400'),
    ('Coca-Cola', 3.50, 'Boissons', true, 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400')
) AS item(nom, prix, categorie, en_stock, image)
WHERE r.nom = 'Bistro Descartes';