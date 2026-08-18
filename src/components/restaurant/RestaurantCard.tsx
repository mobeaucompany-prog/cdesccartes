import { Link } from 'react-router-dom';
import { Clock3, MapPin } from 'lucide-react';
import { Restaurant } from '@/types/database';
import { Badge } from '@/components/ui/badge';

interface RestaurantCardProps {
  restaurant: Restaurant;
  index: number;
  userPosition?: [number, number] | null;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const RestaurantCard = ({ restaurant, index, userPosition }: RestaurantCardProps) => {
  const isOpen = restaurant.statut_ouvert_ferme;
  const distance = userPosition && restaurant.latitude && restaurant.longitude
    ? calculateDistance(userPosition[0], userPosition[1], restaurant.latitude, restaurant.longitude)
    : null;

  const distanceLabel = distance !== null
    ? distance < 1
      ? `${Math.round(distance * 1000)} m`
      : `${distance.toFixed(1)} km`
    : null;

  const content = (
    <article
      className={`group overflow-hidden rounded-3xl border border-border/70 bg-card shadow-card transition-all duration-300 ${
        isOpen ? 'hover:-translate-y-1 hover:shadow-elevated' : 'opacity-75'
      }`}
    >
      <div className="relative h-44 overflow-hidden sm:h-48">
        <img
          src={restaurant.photo || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'}
          alt={restaurant.nom}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />

        <Badge
          className={`absolute left-3 top-3 border-0 px-3 py-1 text-xs shadow-md ${
            isOpen
              ? 'bg-success text-success-foreground'
              : 'bg-background/95 text-foreground'
          }`}
        >
          <span className={`mr-2 h-2 w-2 rounded-full ${isOpen ? 'bg-success-foreground' : 'bg-muted-foreground'}`} />
          {isOpen ? 'Ouvert' : 'Fermé actuellement'}
        </Badge>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-foreground transition-colors group-hover:text-primary sm:text-xl">
              {restaurant.nom}
            </h3>
            {restaurant.description && (
              <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">
                {restaurant.description}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground sm:text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1.5">
            <Clock3 className="h-3.5 w-3.5 text-primary" />
            15–25 min
          </span>
          {distanceLabel && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              {distanceLabel}
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-4">
          <span className={`text-sm font-semibold ${isOpen ? 'text-primary' : 'text-muted-foreground'}`}>
            {isOpen ? 'Voir le menu' : 'Commande indisponible'}
          </span>
          {isOpen && <span className="text-primary">→</span>}
        </div>
      </div>
    </article>
  );

  if (!isOpen) {
    return (
      <div
        className={`block opacity-0 animate-fade-in stagger-${Math.min(index + 1, 5)}`}
        style={{ animationFillMode: 'forwards' }}
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      to={`/restaurant/${restaurant.id}`}
      className={`block opacity-0 animate-fade-in stagger-${Math.min(index + 1, 5)}`}
      style={{ animationFillMode: 'forwards' }}
    >
      {content}
    </Link>
  );
};

export default RestaurantCard;
