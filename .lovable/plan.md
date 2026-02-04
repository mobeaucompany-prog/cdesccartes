
# Plan : Intégration des informations complémentaires pour Good and Tasty

## Ce qui sera fait

### 1. Modification de la base de données
Ajout de nouvelles colonnes à la table `restaurants` :
- `adresse` (texte) - pour stocker l'adresse complète
- `telephone` (texte) - pour le numéro de téléphone
- `horaires` (JSON) - pour stocker les horaires d'ouverture par jour

### 2. Mise à jour des données pour Good and Tasty
- **Adresse** : 23/25 Av. André-Marie Ampère, 77420 Champs-sur-Marne
- **Téléphone** : 01 64 68 68 68
- **Horaires** :
  - Lundi - Jeudi : 11:00 - 23:00
  - Vendredi - Samedi : 11:00 - 23:30
  - Dimanche : 11:00 - 23:00
- **Coordonnées GPS** : latitude 48.8441, longitude 2.5859 (corrigées selon l'adresse)

### 3. Mise à jour du code
- Mise à jour du type `Restaurant` dans `src/types/database.ts`
- Modification de `RestaurantCard.tsx` pour afficher l'adresse
- Modification de `RestaurantMenu.tsx` pour afficher les horaires, téléphone et adresse

---

## Partie technique

### Migration SQL
```sql
ALTER TABLE restaurants
ADD COLUMN adresse text,
ADD COLUMN telephone text,
ADD COLUMN horaires jsonb DEFAULT '{}'::jsonb;
```

### Structure des horaires (format JSON)
```json
{
  "lundi": "11:00-23:00",
  "mardi": "11:00-23:00",
  "mercredi": "11:00-23:00",
  "jeudi": "11:00-23:00",
  "vendredi": "11:00-23:30",
  "samedi": "11:00-23:30",
  "dimanche": "11:00-23:00"
}
```

### Fichiers à modifier
1. `src/types/database.ts` - Ajouter les nouveaux champs au type Restaurant
2. `src/components/restaurant/RestaurantCard.tsx` - Afficher l'adresse au lieu de "0.5 km"
3. `src/pages/RestaurantMenu.tsx` - Ajouter une section avec horaires, téléphone et adresse
4. `src/components/map/MapContentLeaflet.tsx` - Afficher l'adresse dans le popup de la carte
