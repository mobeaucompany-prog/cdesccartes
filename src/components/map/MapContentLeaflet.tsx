import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { Restaurant } from "@/types/database";

// Calculate distance between two points in km
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

// Remote marker icons to avoid bundler asset quirks
const restaurantIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const userIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapContentLeafletProps {
  restaurants: Restaurant[];
  userPosition: [number, number] | null;
}

const MapContentLeaflet = ({ restaurants, userPosition }: MapContentLeafletProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const restaurantsLayerRef = useRef<L.LayerGroup | null>(null);
  const userLayerRef = useRef<L.LayerGroup | null>(null);

  // Default center: Campus Descartes
  const defaultCenter: [number, number] = [48.841, 2.588];

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialCenter = userPosition ?? defaultCenter;
    const map = L.map(containerRef.current, {
      center: initialCenter,
      zoom: 15,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const restaurantsLayer = L.layerGroup().addTo(map);
    const userLayer = L.layerGroup().addTo(map);

    mapRef.current = map;
    restaurantsLayerRef.current = restaurantsLayer;
    userLayerRef.current = userLayer;

    return () => {
      map.remove();
      mapRef.current = null;
      restaurantsLayerRef.current = null;
      userLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recenter when user position changes
  useEffect(() => {
    if (!mapRef.current) return;
    const center = userPosition ?? defaultCenter;
    mapRef.current.setView(center, 15);
  }, [userPosition]);

  // Update user marker
  useEffect(() => {
    const map = mapRef.current;
    const userLayer = userLayerRef.current;
    if (!map || !userLayer) return;

    userLayer.clearLayers();

    if (!userPosition) return;

    L.marker(userPosition, { icon: userIcon })
      .addTo(userLayer)
      .bindPopup('<div style="text-align:center;font-weight:600;">📍 Vous êtes ici</div>');

    L.circle(userPosition, {
      radius: 500,
      color: "hsl(var(--primary))",
      fillColor: "hsl(var(--primary))",
      fillOpacity: 0.1,
    }).addTo(userLayer);
  }, [userPosition]);

  // Update restaurant markers
  useEffect(() => {
    const layer = restaurantsLayerRef.current;
    if (!layer) return;

    layer.clearLayers();

    restaurants.forEach((restaurant) => {
      if (restaurant.latitude == null || restaurant.longitude == null) return;

      const position: L.LatLngExpression = [restaurant.latitude, restaurant.longitude];
      const distance = userPosition
        ? calculateDistance(userPosition[0], userPosition[1], restaurant.latitude, restaurant.longitude)
        : null;

      const statusLabel = restaurant.statut_ouvert_ferme ? "Ouvert" : "Fermé";
      const distanceLabel =
        distance === null
          ? ""
          : distance < 1
            ? `${Math.round(distance * 1000)} m`
            : `${distance.toFixed(1)} km`;

      const popupHtml = `
        <div style="min-width:200px;">
          <div style="display:flex;justify-content:space-between;gap:8px;align-items:center;">
            <div style="font-weight:700;">${restaurant.nom}</div>
            <div style="font-size:12px;font-weight:700;">${statusLabel}</div>
          </div>
          ${restaurant.description ? `<div style="margin-top:6px;font-size:12px;opacity:.75;">${restaurant.description}</div>` : ""}
          ${distanceLabel ? `<div style="margin-top:8px;font-size:12px;font-weight:600;">📍 ${distanceLabel}</div>` : ""}
          <div style="margin-top:10px;">
            <a href="/restaurant/${restaurant.id}" style="font-size:12px;font-weight:700;text-decoration:underline;">Voir le menu →</a>
          </div>
        </div>
      `;

      L.marker(position, { icon: restaurantIcon }).addTo(layer).bindPopup(popupHtml);
    });
  }, [restaurants, userPosition]);

  return <div ref={containerRef} style={{ height: "100%", width: "100%" }} />;
};

export default MapContentLeaflet;
