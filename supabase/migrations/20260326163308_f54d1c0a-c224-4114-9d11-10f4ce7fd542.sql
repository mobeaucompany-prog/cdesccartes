UPDATE public.menu_items 
SET customization_options = '{
  "option_groups": [
    {
      "id": "sans",
      "name": "Sans",
      "max_selections": 5,
      "required": false,
      "options": [
        {"name": "Sans Tomate", "price_supplement": 0},
        {"name": "Sans Mozza", "price_supplement": 0},
        {"name": "Sans Chèvre", "price_supplement": 0},
        {"name": "Sans Bleu", "price_supplement": 0},
        {"name": "Sans Reblochon", "price_supplement": 0}
      ]
    },
    {
      "id": "base",
      "name": "Choisissez votre base",
      "max_selections": 1,
      "required": false,
      "options": [
        {"name": "Crème Fraîche", "price_supplement": 0},
        {"name": "Sauce Barbecue", "price_supplement": 0},
        {"name": "Sauce Tomate", "price_supplement": 0}
      ]
    },
    {
      "id": "legumes",
      "name": "Légumes",
      "max_selections": 10,
      "required": false,
      "options": [
        {"name": "Ananas", "price_supplement": 1.50},
        {"name": "Artichaut", "price_supplement": 1.50},
        {"name": "Champignon", "price_supplement": 1.50},
        {"name": "Oignon", "price_supplement": 1.50},
        {"name": "Maïs", "price_supplement": 1.50},
        {"name": "Maïs", "price_supplement": 1.50},
        {"name": "Miel", "price_supplement": 1.50},
        {"name": "Oignon", "price_supplement": 1.50},
        {"name": "Olive", "price_supplement": 1.50},
        {"name": "Origan", "price_supplement": 1.50},
        {"name": "Poivron", "price_supplement": 1.50},
        {"name": "Pomme de Terre", "price_supplement": 1.50},
        {"name": "Tomate Fraîche", "price_supplement": 1.50}
      ]
    },
    {
      "id": "viandes",
      "name": "Viandes",
      "max_selections": 10,
      "required": false,
      "options": [
        {"name": "Bœuf Épicé", "price_supplement": 1.50},
        {"name": "Émincé de Poulet", "price_supplement": 1.50},
        {"name": "Jambon", "price_supplement": 1.50},
        {"name": "Lardon", "price_supplement": 1.50},
        {"name": "Merguez", "price_supplement": 1.50},
        {"name": "Crisp", "price_supplement": 1.50},
        {"name": "Pepperoni", "price_supplement": 1.50},
        {"name": "Poulet Curry", "price_supplement": 1.50},
        {"name": "Saumon Fumé", "price_supplement": 1.50},
        {"name": "Thon", "price_supplement": 1.50},
        {"name": "Viande Hachée", "price_supplement": 1.50}
      ]
    },
    {
      "id": "fromages",
      "name": "Fromages",
      "max_selections": 10,
      "required": false,
      "options": [
        {"name": "Bleu", "price_supplement": 1.50},
        {"name": "Boursin", "price_supplement": 1.50},
        {"name": "Chèvre", "price_supplement": 1.50},
        {"name": "Chèvre Fraîche", "price_supplement": 1.50},
        {"name": "Double Mozza", "price_supplement": 1.50},
        {"name": "Harissa", "price_supplement": 1.50},
        {"name": "Miel", "price_supplement": 1.50},
        {"name": "Mozza", "price_supplement": 1.50},
        {"name": "Raclette", "price_supplement": 1.50},
        {"name": "Reblochon", "price_supplement": 1.50},
        {"name": "Sauce Barbecue", "price_supplement": 1.50},
        {"name": "Sauce Curry", "price_supplement": 1.50},
        {"name": "Sauce Tomate", "price_supplement": 1.50}
      ]
    }
  ]
}'::jsonb
WHERE categorie = 'Pizza';