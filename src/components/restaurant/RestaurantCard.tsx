import { Link } from 'react-router-dom';
import { Clock, MapPin } from 'lucide-react';
import { Restaurant } from '@/types/database';
import { Badge } from '@/components/ui/badge';

interface RestaurantCardProps {
  restaurant: Restaurant;
  index: number;
}

const RestaurantCard = ({ restaurant, index }: RestaurantCardProps) => {
  const isOpen = restaurant.statut_ouvert_ferme;

  return (
    <Link 
      to={isOpen ? `/restaurant/${restaurant.id}` : '#'}
      className={`block opacity-0 animate-fade-in stagger-${index + 1}`}
      style={{ animationFillMode: 'forwards' }}
    >
      <article 
        className={`group relative bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-elevated transition-all duration-300 ${
          isOpen ? 'cursor-pointer hover:scale-[1.02]' : 'opacity-70 cursor-not-allowed'
        }`}
      >
        {/* Image */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={restaurant.photo || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'}
            alt={restaurant.nom}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
          
          {/* Status Badge */}
          <Badge 
            className={`absolute top-3 right-3 ${
              isOpen 
                ? 'bg-success text-success-foreground' 
                : 'bg-destructive text-destructive-foreground'
            } border-0 shadow-md`}
          >
            <span className={`w-2 h-2 rounded-full mr-2 ${isOpen ? 'bg-success-foreground' : 'bg-destructive-foreground'} animate-pulse`} />
            {isOpen ? 'Ouvert' : 'Fermé'}
          </Badge>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="font-bold text-xl text-foreground mb-2 group-hover:text-primary transition-colors">
            {restaurant.nom}
          </h3>
          
          {restaurant.description && (
            <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
              {restaurant.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              15-25 min
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              0.5 km
            </span>
          </div>
        </div>

        {/* Overlay for closed restaurants */}
        {!isOpen && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
            <span className="text-foreground font-semibold text-lg bg-card px-4 py-2 rounded-lg shadow-md">
              Actuellement fermé
            </span>
          </div>
        )}
      </article>
    </Link>
  );
};

export default RestaurantCard;
