# Click & Descartes

Application Click & Collect du Campus Descartes, développée avec React, Vite, Supabase et Stripe Connect.

## Développement local

```sh
npm install
npm run dev
```

## Paiement Stripe Connect

Le paiement utilise Stripe Checkout avec des **destination charges** : le client paie sur Stripe, le solde est transféré au compte Stripe connecté du restaurant et une commission plateforme peut être prélevée.

### Secrets Supabase Edge Functions

Configurer dans Supabase :

- `STRIPE_SECRET_KEY` : clé secrète Stripe de la plateforme
- `STRIPE_WEBHOOK_SECRET` : secret de signature du webhook Stripe
- `APP_URL` : URL publique de l'application, par exemple `https://app.example.com`
- `MOBEAU_PLATFORM_FEE_PERCENT` : commission Mobeau en pourcentage, par exemple `5`

`SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont fournis par l'environnement Supabase.

### Compte Stripe du restaurant

Chaque restaurant doit avoir son identifiant de compte Connect dans `restaurants.stripe_account_id`, par exemple `acct_...`.

### Webhook Stripe

Pour le projet Supabase actuel (`ugqerugkvwijqvgtmozq`), configurer Stripe pour envoyer les événements vers :

`https://ugqerugkvwijqvgtmozq.supabase.co/functions/v1/stripe-webhook`

Événements :

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`

Le restaurateur ne voit pas la commande tant que le webhook n'a pas confirmé le paiement.

## Sécurité des prix

Le frontend n'est pas la source de vérité des montants. La fonction Edge `create-checkout-session` réutilise la fonction SQL existante `create_order_secure` afin que les prix de la commande soient validés côté serveur avant la création de la session Stripe.

## Déploiement

Avant le premier test réel, appliquer la migration Supabase ajoutant `stripe_account_id` et les champs de paiement, puis déployer les fonctions Edge `create-checkout-session` et `stripe-webhook`.
