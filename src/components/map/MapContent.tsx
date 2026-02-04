import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Restaurant } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in react-leaflet
const restaurantIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

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

// Component to recenter map when user location changes
function RecenterMap({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position, 15);
  }, [position, map]);
  return null;
}

interface MapContentProps {
  restaurants: Restaurant[];
  userPosition: [number, number] | null;
}

const MapContent = ({ restaurants, userPosition }: MapContentProps) => {
  // Default center: Campus Descartes
  const defaultCenter: [number, number] = [48.8410, 2.5880];
  const mapCenter = userPosition || defaultCenter;

  return (
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
              color: '#f97316', 
              fillColor: '#f97316', 
              fillOpacity: 0.1 
            }}
          />
        </>
      )}

      {restaurants.map((restaurant) => {
        const position: [number, number] = [restaurant.latitude!, restaurant.longitude!];
        const distance = userPosition 
          ? calculateDistance(userPosition[0], userPosition[1], restaurant.latitude!, restaurant.longitude!)
          : null;

        return (
          <Marker key={restaurant.id} position={position} icon={restaurantIcon}>
            <Popup>
              <div className="min-w-[200px] space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-gray-900">{restaurant.nom}</h3>
                  <Badge 
                    className={`text-xs ${
                      restaurant.statut_ouvert_ferme 
                        ? 'bg-green-500 text-white' 
                        : 'bg-red-500 text-white'
                    }`}
                  >
                    {restaurant.statut_ouvert_ferme ? 'Ouvert' : 'Fermé'}
                  </Badge>
                </div>
                
                {restaurant.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {restaurant.description}
                  </p>
                )}
                
                {distance !== null && (
                  <div className="text-sm text-orange-500 font-medium">
                    📍 {distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`}
                  </div>
                )}
                
                {restaurant.statut_ouvert_ferme && (
                  <Link 
                    to={`/restaurant/${restaurant.id}`}
                    className="block mt-2 text-center text-sm font-medium text-orange-500 hover:underline"
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
  );
};

export default MapContent;
