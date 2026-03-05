import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RestaurantMap() {
  const objectRef = useRef<HTMLObjectElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [translateStart, setTranslateStart] = useState({ x: 0, y: 0 });

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

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.3 : 0.3;
    setScale((s) => {
      const newScale = Math.min(Math.max(s + delta, MIN_SCALE), MAX_SCALE);
      if (newScale === MIN_SCALE) setTranslate({ x: 0, y: 0 });
      return newScale;
    });
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (scale <= 1) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
    setTranslateStart(translate);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [scale, translate]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanning) return;
    setTranslate({
      x: translateStart.x + (e.clientX - panStart.x),
      y: translateStart.y + (e.clientY - panStart.y),
    });
  }, [isPanning, panStart, translateStart]);

  const handlePointerUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  useEffect(() => {
    const object = objectRef.current;
    if (!object) return;

    const onLoad = () => {
      const svgDoc = object.contentDocument;
      if (!svgDoc) return;

      const restaurants: Record<string, string> = {
        AuPtiCreux: "/restaurant/977c4d48-3161-4845-94a3-6a7ef05c9f0e",
        GLaDalle: "/restaurant/45af1a7b-368e-4fb2-85fa-db23a11c23d6",
        GoodAndTasty: "/restaurant/7ff1f514-1bb0-4a67-a5e3-661ece50dbd3",
      };

      Object.entries(restaurants).forEach(([id, path]) => {
        const el = svgDoc.getElementById(id);
        if (el) {
          el.style.cursor = "pointer";
          el.addEventListener("click", () => navigate(path));
        }
      });

      const bg = svgDoc.getElementById("carteCartoon");
      if (bg) {
        bg.style.filter = "brightness(75%)";
      }
    };

    object.addEventListener("load", onLoad);
  }, [navigate]);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-3">
      <div className="flex items-center gap-2 justify-end">
        <Button variant="outline" size="icon" onClick={handleZoomIn} className="h-8 w-8">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleZoomOut} className="h-8 w-8">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleReset} className="h-8 w-8">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
      <div
        ref={containerRef}
        className="overflow-hidden rounded-xl shadow-lg cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <object
          ref={objectRef}
          type="image/svg+xml"
          data="/images/map_citeDescartes.svg"
          className="w-full pointer-events-auto transition-transform duration-150"
          style={{
            transform: `scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)`,
            transformOrigin: "center center",
          }}
        />
      </div>
    </div>
  );
}
