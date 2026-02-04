import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Restaurant } from "@/types/database";
import { supabase } from "@/integrations/supabase/client";

// Calculate distance between two points in km
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
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

interface MapContent3DProps {
  restaurants: Restaurant[];
  userPosition: [number, number] | null;
}

const MapContent3D = ({ restaurants, userPosition }: MapContent3DProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [tokenLoaded, setTokenLoaded] = useState(false);

  // Default center: Campus Descartes
  const defaultCenter: [number, number] = [2.588, 48.841]; // Mapbox uses [lng, lat]

  // Fetch Mapbox token and initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initMap = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-mapbox-token");
        
        if (error || !data?.token) {
          console.error("Failed to get Mapbox token:", error);
          return;
        }

        mapboxgl.accessToken = data.token;
        setTokenLoaded(true);

        const initialCenter = userPosition
          ? [userPosition[1], userPosition[0]] as [number, number]
          : defaultCenter;

        const map = new mapboxgl.Map({
          container: containerRef.current!,
          style: "mapbox://styles/mapbox/light-v11",
          center: initialCenter,
          zoom: 16,
          pitch: 45,
          bearing: -17.6,
          antialias: true,
        });

        map.addControl(new mapboxgl.NavigationControl(), "top-right");

        map.on("load", () => {
          // Add 3D building layer
          const layers = map.getStyle().layers;
          const labelLayerId = layers?.find(
            (layer) =>
              layer.type === "symbol" && layer.layout?.["text-field"]
          )?.id;

          map.addLayer(
            {
              id: "3d-buildings",
              source: "composite",
              "source-layer": "building",
              filter: ["==", "extrude", "true"],
              type: "fill-extrusion",
              minzoom: 15,
              paint: {
                "fill-extrusion-color": "#aaa",
                "fill-extrusion-height": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  15,
                  0,
                  15.05,
                  ["get", "height"],
                ],
                "fill-extrusion-base": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  15,
                  0,
                  15.05,
                  ["get", "min_height"],
                ],
                "fill-extrusion-opacity": 0.6,
              },
            },
            labelLayerId
          );
        });

        mapRef.current = map;
      } catch (err) {
        console.error("Error initializing map:", err);
      }
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update center when user position changes
  useEffect(() => {
    if (!mapRef.current || !userPosition) return;
    mapRef.current.flyTo({
      center: [userPosition[1], userPosition[0]],
      zoom: 16,
      pitch: 45,
    });
  }, [userPosition]);

  // Update user marker
  useEffect(() => {
    if (!mapRef.current || !tokenLoaded) return;

    // Remove existing user marker
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (!userPosition) return;

    // Create custom user marker element
    const el = document.createElement("div");
    el.className = "user-location-marker";
    el.innerHTML = `
      <div style="
        width: 24px;
        height: 24px;
        background: linear-gradient(135deg, hsl(221.2, 83.2%, 53.3%), hsl(221.2, 83.2%, 63.3%));
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        animation: pulse 2s infinite;
      "></div>
      <style>
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5); }
          70% { box-shadow: 0 0 0 15px rgba(59, 130, 246, 0); }
          100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
      </style>
    `;

    userMarkerRef.current = new mapboxgl.Marker({ element: el })
      .setLngLat([userPosition[1], userPosition[0]])
      .setPopup(
        new mapboxgl.Popup({ offset: 25 }).setHTML(
          '<div style="font-weight:600;text-align:center;">📍 Vous êtes ici</div>'
        )
      )
      .addTo(mapRef.current);
  }, [userPosition, tokenLoaded]);

  // Update restaurant markers
  useEffect(() => {
    if (!mapRef.current || !tokenLoaded) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    restaurants.forEach((restaurant) => {
      if (restaurant.latitude == null || restaurant.longitude == null) return;

      const distance = userPosition
        ? calculateDistance(
            userPosition[0],
            userPosition[1],
            restaurant.latitude,
            restaurant.longitude
          )
        : null;

      const distanceLabel =
        distance === null
          ? ""
          : distance < 1
            ? `${Math.round(distance * 1000)} m`
            : `${distance.toFixed(1)} km`;

      // Create custom marker element
      const el = document.createElement("div");
      el.innerHTML = `
        <div style="
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, hsl(24.6, 95%, 53.1%), hsl(24.6, 95%, 63.1%));
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 3px 10px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="transform: rotate(45deg); font-size: 16px;">🍽️</span>
        </div>
      `;
      el.style.cursor = "pointer";

      const popupHtml = `
        <div style="min-width:200px;font-family:system-ui,-apple-system,sans-serif;">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
            <div style="font-weight:700;font-size:14px;">${restaurant.nom}</div>
            <div style="
              font-size:11px;
              font-weight:600;
              padding:2px 8px;
              border-radius:12px;
              background:${restaurant.statut_ouvert_ferme ? "#22c55e" : "#ef4444"};
              color:white;
            ">${restaurant.statut_ouvert_ferme ? "Ouvert" : "Fermé"}</div>
          </div>
          ${restaurant.description ? `<div style="margin-top:8px;font-size:12px;color:#666;line-height:1.4;">${restaurant.description}</div>` : ""}
          ${distanceLabel ? `<div style="margin-top:8px;font-size:12px;font-weight:600;color:hsl(24.6, 95%, 53.1%);">📍 ${distanceLabel}</div>` : ""}
          <div style="margin-top:12px;">
            <a href="/restaurant/${restaurant.id}" style="
              display:inline-block;
              font-size:12px;
              font-weight:600;
              color:hsl(24.6, 95%, 53.1%);
              text-decoration:none;
            ">Voir le menu →</a>
          </div>
        </div>
      `;

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([restaurant.longitude, restaurant.latitude])
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(popupHtml))
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });
  }, [restaurants, userPosition, tokenLoaded]);

  return (
    <div
      ref={containerRef}
      style={{ height: "100%", width: "100%", borderRadius: "16px" }}
    />
  );
};

export default MapContent3D;
