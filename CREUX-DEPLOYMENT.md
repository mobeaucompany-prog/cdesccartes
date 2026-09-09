# Au P'tit Creux

## Boissons vérifiées sur les photos

Coca-Cola original, zéro, cherry et vanille; Oasis tropical et cassis framboise; Perrier; Schweppes Agrumes; 7UP et 7UP mojito; Orangina; Lipton Peach. Heineken reste vendu séparément. La seconde bouteille de bière n'est pas ajoutée faute de référence suffisamment certaine. Les photos confirment les références, pas le stock actuel.

Appliquer également `20260910100000_creux_drink_labels.sql` après la migration de prix pour préciser le libellé Oasis en préservant son stock. Le configurateur récupère automatiquement les boissons en stock depuis la base.

## Activation

1. Appliquer les migrations de la branche existante, notamment celle Stripe du 18 août, puis `20260909160000_creux_pricing.sql`. La migration exige un restaurant existant unique et les sept plats du seed déjà exécuté.
2. Déployer `create-checkout-session`. Cette fonction utilise désormais `create_creux_order_secure` uniquement pour Au P'tit Creux.
3. Dans l'espace restaurateur, activer le stock des boissons réellement présentes. Les nouvelles boissons sont indisponibles par défaut; les formules Menu et Box exigent une boisson soft en stock. Heineken est uniquement vendu séparément.
4. Vider les anciens paniers de test et vérifier le parcours avec Stripe en mode test.

La migration ne remplace pas `create_order_secure`, utilisée par les autres restaurants. Le SQL fourni précédemment dans la conversation pour remplacer cette fonction n'est pas sûr (suppléments client acceptés, validations supprimées). S'il a été exécuté en base, il reste à auditer/restaurer séparément avant la mise en production. La nouvelle fonction dédiée est réservée au rôle serveur et crée les commandes avec paiement pending.

## Vérification

Node 22 : `node --test tests/creux.test.mjs`, puis `npm run build`.

Les tarifs n'attribuent aucun supplément non confirmé aux pains ou bases. Les suppléments bacon et fromage sont limités à une unité de chaque. La boisson soft séparée coûte 1,50 EUR; eau 1 EUR; Heineken 2,50 EUR; frites 3,50 EUR. Aucune autre bière n'est nommée.
