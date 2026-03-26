import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ZoomIn, ZoomOut, RotateCcw, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

// GPS bounds of the SVG map (corners)
// Bottom-left: 48.84328N, 2.58171E
// Bottom-right: 48.83669N, 2.58406E  
// Top-right: 48.83592N, 2.59691E
// Top-left (inferred): 48.84251N, 2.59456E
const MAP_BOUNDS = {
  topLeft: { lat: 48.84251, lng: 2.59456 },
  topRight: { lat: 48.83592, lng: 2.59691 },
  bottomLeft: { lat: 48.84328, lng: 2.58171 },
  bottomRight: { lat: 48.83669, lng: 2.58406 },
};

function gpsToMapPercent(lat: number, lng: number) {
  // Bilinear interpolation using the 4 corners
  const { topLeft, topRight, bottomLeft, bottomRight } = MAP_BOUNDS;
  
  // Approximate: use inverse bilinear mapping
  // For a roughly rectangular map, linear interpolation works well
  const avgTop = { lat: (topLeft.lat + topRight.lat) / 2, lng: (topLeft.lng + topRight.lng) / 2 };
  const avgBottom = { lat: (bottomLeft.lat + bottomRight.lat) / 2, lng: (bottomLeft.lng + bottomRight.lng) / 2 };
  const avgLeft = { lat: (topLeft.lat + bottomLeft.lat) / 2, lng: (topLeft.lng + bottomLeft.lng) / 2 };
  const avgRight = { lat: (topRight.lat + bottomRight.lat) / 2, lng: (topRight.lng + bottomRight.lng) / 2 };

  // Y: top=0%, bottom=100% (lat decreases going down on this map, but bottom-left has highest lat)
  // Actually bottom-left lat (48.84328) > top-right lat (48.83592), so higher lat = bottom of map
  const latRange = avgBottom.lat - avgTop.lat; // positive
  const yPct = ((lat - avgTop.lat) / latRange) * 100;

  // X: left=0%, right=100%
  const lngRange = avgRight.lng - avgLeft.lng; // positive
  const xPct = ((lng - avgLeft.lng) / lngRange) * 100;

  return { x: xPct, y: yPct };
}

// Restaurant clickable zones as percentages of SVG dimensions (viewBox 1536x1024)
const RESTAURANT_ZONES = [
  {
    id: "GLaDalle",
    path: "/restaurant/45af1a7b-368e-4fb2-85fa-db23a11c23d6",
    label: "G La Dalle",
    xMin: 1,
    xMax: 10,
    yMin: 55,
    yMax: 67,
  },
  {
    id: "GoodAndTasty",
    path: "/restaurant/7ff1f514-1bb0-4a67-a5e3-661ece50dbd3",
    label: "Good and Tasty",
    xMin: 27,
    xMax: 38,
    yMin: 55,
    yMax: 70,
  },
  {
    id: "AuPtiCreux",
    path: "/restaurant/977c4d48-3161-4845-94a3-6a7ef05c9f0e",
    label: "Au Petit Creux",
    xMin: 75,
    xMax: 90,
    yMin: 70,
    yMax: 83,
  },
];

export default function RestaurantMap() {
  const objectRef = useRef<HTMLObjectElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [userPosition, setUserPosition] = useState<{ x: number; y: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const translateStart = useRef({ x: 0, y: 0 });

  const MIN_SCALE = 1;
  const MAX_SCALE = 4;

  const handleZoomIn = useCallback(() => {
    setScale((s) => Math.min(s + 0.5, MAX_SCALE));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((s) => {
      const newScale = Math.max(s - 0.5, MIN_SCALE);
      if (newScale === MIN_SCALE) setTranslate({ x: 0, y: 0 });
      return newScale;
    });
  }, []);

  const handleReset = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  // Prevent page scroll when touching the map container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const preventScroll = (e: TouchEvent) => {
      e.preventDefault();
    };
    container.addEventListener("touchmove", preventScroll, { passive: false });
    container.addEventListener("touchstart", preventScroll, { passive: false });
    return () => {
      container.removeEventListener("touchmove", preventScroll);
      container.removeEventListener("touchstart", preventScroll);
    };
  }, []);

  // Darken SVG background (works only same-origin)
  useEffect(() => {
    const object = objectRef.current;
    if (!object) return;
    const onLoad = () => {
      try {
        const svgDoc = object.contentDocument;
        if (!svgDoc) return;
        const bg = svgDoc.getElementById("carteCartoon");
        if (bg) bg.style.filter = "brightness(75%)";
      } catch {
        /* cross-origin — ignore */
      }
    };
    object.addEventListener("load", onLoad);
    try {
      if (object.contentDocument?.readyState === "complete") onLoad();
    } catch {}
    return () => object.removeEventListener("load", onLoad);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.3 : 0.3;
    setScale((s) => {
      const newScale = Math.min(Math.max(s + delta, MIN_SCALE), MAX_SCALE);
      if (newScale === MIN_SCALE) setTranslate({ x: 0, y: 0 });
      return newScale;
    });
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY };
      translateStart.current = { ...translate };
      containerRef.current?.setPointerCapture(e.pointerId);
    },
    [translate],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isPanning || scale <= 1) return;
      setTranslate({
        x: translateStart.current.x + (e.clientX - panStart.current.x),
        y: translateStart.current.y + (e.clientY - panStart.current.y),
      });
    },
    [isPanning, scale],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isPanning) return;
      const dx = Math.abs(e.clientX - panStart.current.x);
      const dy = Math.abs(e.clientY - panStart.current.y);

      // Tap detection (not a drag)
      if (dx < 8 && dy < 8) {
        const container = containerRef.current;
        if (!container) {
          setIsPanning(false);
          return;
        }

        const rect = container.getBoundingClientRect();
        const cx = rect.width / 2;
        const cy = rect.height / 2;

        // Reverse the CSS transform to get position in original SVG space
        const relX = e.clientX - rect.left;
        const relY = e.clientY - rect.top;
        const svgX = (relX - cx) / scale - translate.x / scale + cx;
        const svgY = (relY - cy) / scale - translate.y / scale + cy;

        // Convert to percentage of container
        const pctX = (svgX / rect.width) * 100;
        const pctY = (svgY / rect.height) * 100;

        // Check if tap is inside any restaurant zone
        for (const zone of RESTAURANT_ZONES) {
          if (pctX >= zone.xMin && pctX <= zone.xMax && pctY >= zone.yMin && pctY <= zone.yMax) {
            navigate(zone.path);
            setIsPanning(false);
            return;
          }
        }
      }
      setIsPanning(false);
    },
    [isPanning, scale, translate, navigate],
  );

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="relative rounded-xl shadow-lg overflow-hidden">
        {/* Zoom controls */}
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5">
          <Button
            variant="secondary"
            size="icon"
            onClick={handleZoomIn}
            className="h-9 w-9 shadow-md bg-background/80 backdrop-blur-sm hover:bg-background"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={handleZoomOut}
            className="h-9 w-9 shadow-md bg-background/80 backdrop-blur-sm hover:bg-background"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={handleReset}
            className="h-9 w-9 shadow-md bg-background/80 backdrop-blur-sm hover:bg-background"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={() => {
              if (isLocating) return;
              setIsLocating(true);
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  const mapped = gpsToMapPercent(pos.coords.latitude, pos.coords.longitude);
                  if (mapped.x >= 0 && mapped.x <= 100 && mapped.y >= 0 && mapped.y <= 100) {
                    setUserPosition(mapped);
                  } else {
                    setUserPosition(null);
                  }
                  setIsLocating(false);
                },
                () => setIsLocating(false),
                { enableHighAccuracy: true, timeout: 10000 }
              );
            }}
            className="h-9 w-9 shadow-md bg-background/80 backdrop-blur-sm hover:bg-background"
          >
            <Navigation className={`h-4 w-4 ${isLocating ? 'animate-pulse text-primary' : ''}`} />
          </Button>
        </div>

        <div
          ref={containerRef}
          className="overflow-hidden select-none"
          style={{ cursor: scale > 1 ? (isPanning ? "grabbing" : "grab") : "pointer", touchAction: "none" }}
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => setIsPanning(false)}
        >
          <object
            ref={objectRef}
            type="image/svg+xml"
            data="/images/map_citeDescartes.svg"
            className="w-full pointer-events-none block"
            style={{
              transform: `scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)`,
              transformOrigin: "center center",
              willChange: "transform",
            }}
          />
          {userPosition && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: `${userPosition.x}%`,
                top: `${userPosition.y}%`,
                transform: `scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)`,
                transformOrigin: "center center",
                zIndex: 10,
              }}
            >
              <div className="relative -translate-x-1/2 -translate-y-1/2">
                <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg" />
                <div className="absolute inset-0 w-4 h-4 rounded-full bg-blue-500/40 animate-ping" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
