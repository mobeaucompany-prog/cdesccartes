import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function RestaurantMap() {
  const objectRef = useRef<HTMLObjectElement>(null);
  const navigate = useNavigate();

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
    <div className="w-full max-w-6xl mx-auto">
      <object
        ref={objectRef}
        type="image/svg+xml"
        data="/images/map_citeDescartes.svg"
        className="w-full rounded-xl shadow-lg"
      />
    </div>
  );
}
