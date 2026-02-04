import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { Icon, LatLngTuple } from 'leaflet';
import { MapPin, Navigation } from 'lucide-react';
import { Restaurant } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in react-leaflet
const restaurantIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const userIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface RestaurantMapProps {
  restaurants: Restaurant[];
}

// Component to recenter map when user location changes
function RecenterMap({ position }: { position: LatLngTuple }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position, 15);
  }, [position, map]);
  return null;
}

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

const RestaurantMap = ({ restaurants }: RestaurantMapProps) => {
  const [userPosition, setUserPosition] = useState<LatLngTuple | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Default center: Campus Descartes
  const defaultCenter: LatLngTuple = [48.8410, 2.5880];

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

  const mapCenter = userPosition || defaultCenter;

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
        <MapContainer
          center={mapCenter}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {userPosition && (
            <>
              <RecenterMap position={userPosition} />
              <Marker position={userPosition} icon={userIcon}>
                <Popup>
                  <div className="text-center font-medium">📍 Vous êtes ici</div>
                </Popup>
              </Marker>
              <Circle
                center={userPosition}
                radius={500}
                pathOptions={{ 
                  color: 'hsl(var(--primary))', 
                  fillColor: 'hsl(var(--primary))', 
                  fillOpacity: 0.1 
                }}
              />
            </>
          )}

          {restaurantsWithCoords.map((restaurant) => {
            const position: LatLngTuple = [restaurant.latitude!, restaurant.longitude!];
            const distance = userPosition 
              ? calculateDistance(userPosition[0], userPosition[1], restaurant.latitude!, restaurant.longitude!)
              : null;

            return (
              <Marker key={restaurant.id} position={position} icon={restaurantIcon}>
                <Popup>
                  <div className="min-w-[200px] space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-foreground">{restaurant.nom}</h3>
                      <Badge 
                        className={`text-xs ${
                          restaurant.statut_ouvert_ferme 
                            ? 'bg-success text-success-foreground' 
                            : 'bg-destructive text-destructive-foreground'
                        }`}
                      >
                        {restaurant.statut_ouvert_ferme ? 'Ouvert' : 'Fermé'}
                      </Badge>
                    </div>
                    
                    {restaurant.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {restaurant.description}
                      </p>
                    )}
                    
                    {distance !== null && (
                      <div className="text-sm text-primary font-medium">
                        📍 {distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`}
                      </div>
                    )}
                    
                    {restaurant.statut_ouvert_ferme && (
                      <Link 
                        to={`/restaurant/${restaurant.id}`}
                        className="block mt-2 text-center text-sm font-medium text-primary hover:underline"
                      >
                        Voir le menu →
                      </Link>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
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
