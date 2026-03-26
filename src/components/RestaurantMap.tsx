import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Navigation } from "lucide-react";

const RESTAURANTS = [
  {
    id: "45af1a7b-368e-4fb2-85fa-db23a11c23d6",
    name: "G La Dalle",
    lat: 48.84095,
    lng: 2.58698,
  },
  {
    id: "7ff1f514-1bb0-4a67-a5e3-661ece50dbd3",
    name: "Good and Tasty",
    lat: 48.84112,
    lng: 2.58721,
  },
  {
    id: "977c4d48-3161-4845-94a3-6a7ef05c9f0e",
    name: "Au Petit Creux",
    lat: 48.84073,
    lng: 2.58810,
  },
];

const restaurantIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const userIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const DEFAULT_CENTER: [number, number] = [48.8408, 2.5872];

export default function RestaurantMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const navigate = useNavigate();
  const [isLocating, setIsLocating] = useState(false);

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: DEFAULT_CENTER,
      zoom: 17,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Add restaurant markers
    RESTAURANTS.forEach((r) => {
      const marker = L.marker([r.lat, r.lng], { icon: restaurantIcon }).addTo(map);
      marker.bindPopup(
        `<div style="text-align:center;min-width:120px;">
          <div style="font-weight:700;font-size:14px;margin-bottom:6px;">${r.name}</div>
          <a href="/restaurant/${r.id}" style="font-size:12px;font-weight:600;color:hsl(24,95%,53%);text-decoration:underline;">Voir le menu →</a>
        </div>`
      );
      marker.on("click", () => {
        marker.openPopup();
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLocate = useCallback(() => {
    if (isLocating || !navigator.geolocation) return;
    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latlng: [number, number] = [pos.coords.latitude, pos.coords.longitude];

        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng(latlng);
        } else if (mapRef.current) {
          userMarkerRef.current = L.marker(latlng, { icon: userIcon })
            .addTo(mapRef.current)
            .bindPopup('<div style="text-align:center;font-weight:600;">📍 Vous êtes ici</div>');
        }

        mapRef.current?.setView(latlng, 17);
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [isLocating]);

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="relative rounded-2xl overflow-hidden shadow-card border border-border">
        {/* Locate button */}
        <div className="absolute top-3 right-3 z-[1000]">
          <Button
            variant="secondary"
            size="icon"
            onClick={handleLocate}
            className="h-9 w-9 shadow-md bg-background/80 backdrop-blur-sm hover:bg-background"
          >
            <Navigation className={`h-4 w-4 ${isLocating ? "animate-pulse text-primary" : ""}`} />
          </Button>
        </div>

        <div
          ref={containerRef}
          className="w-full"
          style={{ height: "400px" }}
        />
      </div>
    </div>
  );
}
