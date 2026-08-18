# Click & Descart

"Agis comme un expert Full Stack. Crée une application web de Click & Collect nommée 'Click&Descartes'. L'application doit gérer deux interfaces et une base de données Supabase.




1. Structure de la base de données (Supabase) :




Une table restaurants (id, nom, statut_ouvert_ferme, photo, description).




Une table menu_items (id, restaurant_id, nom, prix, categorie, en_stock_bool, image).




Une table orders (id, client_name, items_list, total_price, status (pending, accepted, rejected, ready), pickup_time, created_at).




2. Interface Client (Web App Mobile-First) :




Page d'accueil : Liste des restaurants avec leur statut (Ouvert/Fermé).




Page Menu : Affichage des plats par catégorie. Bouton 'Ajouter au panier'.




Tunnel de commande : Panier, choix de l'heure de récupération, et simulation de paiement Stripe.




Page de confirmation : Récapitulatif et statut de la commande en temps réel.




3. Interface Restaurateur (Dashboard Web) :




Gestion du stock : Liste des articles avec un toggle switch pour 'En rupture de stock'.




Ajout d'article : Formulaire simple (nom, prix, image).




Rapports de ventes : Résumé des commandes filtrable par période (5min, 1h, journée, semaine).




4. Intégration Bot Telegram (Logique Edge Functions) :




Configure des webhooks pour qu'à chaque nouvelle commande : a) Le bot envoie un message au restaurateur : 'Nouvelle commande de [Nom] ! [Détails]. Récupération à [Heure].' b) Propose deux boutons interactifs : '✅ Accepter' et '❌ Refuser'. c) Si 'Accepter' est cliqué, mettre à jour la table orders sur 'accepted' et notifier le client sur le site.




Design : Utilise une charte graphique moderne : Orange (#FF4500) en couleur dominante et Anthracite (#2F2F2F) pour les textes et menus. Style épuré, boutons arrondis, photos de nourriture appétissantes."

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://cdesccartes.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/96faa33b-b37a-4ae7-b828-66a3a0d32b1e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
