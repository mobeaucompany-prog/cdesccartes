import React, { useEffect, useState, lazy, Suspense } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { Restaurant } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

// Calculate distance between two points in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Lazy load the 3D map component
const LazyMapContent = lazy(() => import('./MapContent3D'));

interface RestaurantMapProps {
  restaurants: Restaurant[];
}

const RestaurantMap = ({ restaurants }: RestaurantMapProps) => {
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const handleLocateMe = () => {
    setIsLocating(true);
    setLocationError(null);
    
    if (!navigator.geolocation) {
      setLocationError("La géolocalisation n'est pas supportée par votre navigateur");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserPosition([position.coords.latitude, position.coords.longitude]);
        setIsLocating(false);
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Vous avez refusé la géolocalisation");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Position non disponible");
            break;
          case error.TIMEOUT:
            setLocationError("Délai d'attente dépassé");
            break;
          default:
            setLocationError("Erreur de géolocalisation");
        }
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const restaurantsWithCoords = restaurants.filter(
    r => r.latitude != null && r.longitude != null
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <MapPin className="w-6 h-6 text-primary" />
          Carte des restaurants
        </h2>
        <Button
          onClick={handleLocateMe}
          disabled={isLocating}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Navigation className={`w-4 h-4 ${isLocating ? 'animate-pulse' : ''}`} />
          {isLocating ? 'Localisation...' : 'Me localiser'}
        </Button>
      </div>

      {locationError && (
        <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
          {locationError}
        </div>
      )}

      <div className="rounded-2xl overflow-hidden shadow-card border border-border h-[400px]">
        <Suspense fallback={<Skeleton className="h-full w-full" />}>
          <LazyMapContent
            restaurants={restaurantsWithCoords}
            userPosition={userPosition}
          />
        </Suspense>
      </div>

      {userPosition && restaurantsWithCoords.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {restaurantsWithCoords
            .map(r => ({
              ...r,
              distance: calculateDistance(userPosition[0], userPosition[1], r.latitude!, r.longitude!)
            }))
            .sort((a, b) => a.distance - b.distance)
            .map(r => (
              <Badge 
                key={r.id} 
                variant="secondary"
                className={`${r.statut_ouvert_ferme ? '' : 'opacity-50'}`}
              >
                {r.nom} • {r.distance < 1 ? `${Math.round(r.distance * 1000)}m` : `${r.distance.toFixed(1)}km`}
              </Badge>
            ))
          }
        </div>
      )}
    </div>
  );
};

export default RestaurantMap;
