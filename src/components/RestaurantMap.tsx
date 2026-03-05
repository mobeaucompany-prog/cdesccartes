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

    // passive: false is required to allow preventDefault on touch events
    container.addEventListener("touchmove", preventScroll, { passive: false });
    container.addEventListener("touchstart", preventScroll, { passive: false });

    return () => {
      container.removeEventListener("touchmove", preventScroll);
      container.removeEventListener("touchstart", preventScroll);
    };
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
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY };
    translateStart.current = { ...translate };
    containerRef.current?.setPointerCapture(e.pointerId);
  }, [translate]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanning || scale <= 1) return;
    setTranslate({
      x: translateStart.current.x + (e.clientX - panStart.current.x),
      y: translateStart.current.y + (e.clientY - panStart.current.y),
    });
  }, [isPanning, scale]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isPanning) return;
    const dx = Math.abs(e.clientX - panStart.current.x);
    const dy = Math.abs(e.clientY - panStart.current.y);
    
    // If it was a tap (not a drag), forward click to SVG elements
    if (dx < 5 && dy < 5) {
      const svgDoc = objectRef.current?.contentDocument;
      const objEl = objectRef.current;
      if (svgDoc && objEl) {
        const containerRect = containerRef.current!.getBoundingClientRect();
        
        // Position relative to the container (which is not transformed)
        const relX = e.clientX - containerRect.left;
        const relY = e.clientY - containerRect.top;
        
        // Undo the CSS transform: scale(s) translate(tx/s, ty/s)
        // transformOrigin is center, so we need to account for that
        const cx = containerRect.width / 2;
        const cy = containerRect.height / 2;
        
        // Reverse: point_in_svg = (point_in_container - center) / scale - translate/scale + center
        const svgX = (relX - cx) / scale - translate.x / scale + cx;
        const svgY = (relY - cy) / scale - translate.y / scale + cy;
        
        const el = svgDoc.elementFromPoint(svgX, svgY);
        if (el) {
          // Walk up to find a clickable restaurant element
          let current: Element | null = el;
          while (current) {
            if (current.id && (current as HTMLElement).style?.cursor === "pointer") {
              current.dispatchEvent(new MouseEvent("click", { bubbles: true }));
              break;
            }
            current = current.parentElement;
          }
        }
      }
    }
    setIsPanning(false);
  }, [isPanning, scale, translate]);

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

      // Block touch events inside SVG from scrolling page
      svgDoc.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false } as any);
      svgDoc.addEventListener("touchstart", (e) => e.preventDefault(), { passive: false } as any);
    };

    object.addEventListener("load", onLoad);
    // Re-run in case already loaded
    if (object.contentDocument?.readyState === "complete") onLoad();
  }, [navigate]);

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="relative rounded-xl shadow-lg overflow-hidden">
        {/* Zoom controls overlaid on map */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
          <Button variant="secondary" size="icon" onClick={handleZoomIn} className="h-9 w-9 shadow-md bg-background/80 backdrop-blur-sm hover:bg-background">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="icon" onClick={handleZoomOut} className="h-9 w-9 shadow-md bg-background/80 backdrop-blur-sm hover:bg-background">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="icon" onClick={handleReset} className="h-9 w-9 shadow-md bg-background/80 backdrop-blur-sm hover:bg-background">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
        <div
          ref={containerRef}
          className="overflow-hidden select-none"
          style={{ cursor: scale > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default', touchAction: 'none' }}
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
            className="w-full pointer-events-none"
            style={{
              transform: `scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)`,
              transformOrigin: "center center",
              willChange: 'transform',
            }}
          />
        </div>
      </div>
    </div>
  );
}
