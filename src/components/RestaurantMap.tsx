import { useEffect, useRef } from "react";

export default function RestaurantMap() {
  const objectRef = useRef<HTMLObjectElement>(null);

  useEffect(() => {
    const object = objectRef.current;
    if (!object) return;

    const onLoad = () => {
      const svgDoc = object.contentDocument;
      if (!svgDoc) return;

      const AuPtitCreux = svgDoc.getElementById("AuPtiCreux");
      const GLaDalle = svgDoc.getElementById("GLaDalle");
      const GoodAndTasty = svgDoc.getElementById("GoodAndTasty");

      if (AuPtitCreux) {
        AuPtitCreux.style.cursor = "pointer";
        AuPtitCreux.addEventListener("click", () => {
          window.open(
            "https://cdesccartes.lovable.app/restaurant/977c4d48-3161-4845-94a3-6a7ef05c9f0e",
            "_blank"
          );
        });
      }

      if (GLaDalle) {
        GLaDalle.style.cursor = "pointer";
        GLaDalle.addEventListener("click", () => {
          window.open(
            "https://cdesccartes.lovable.app/restaurant/45af1a7b-368e-4fb2-85fa-db23a11c23d6",
            "_blank"
          );
        });
      }

      if (GoodAndTasty) {
        GoodAndTasty.style.cursor = "pointer";
        GoodAndTasty.addEventListener("click", () => {
          window.open(
            "https://cdesccartes.lovable.app/restaurant/7ff1f514-1bb0-4a67-a5e3-661ece50dbd3",
            "_blank"
          );
        });
      }

      const bg = svgDoc.getElementById("carteCartoon");
      if (bg) {
        bg.style.filter = "brightness(45%)";
      }
    };

    object.addEventListener("load", onLoad);
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto">
      <object
        ref={objectRef}
        type="image/svg+xml"
        data="/src/assets/map_citeDescartes.svg"
        className="w-full rounded-xl shadow-lg"
      />
    </div>
  );
}
