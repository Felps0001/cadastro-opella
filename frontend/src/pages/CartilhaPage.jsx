import { useEffect, useState } from "react";
import pagina1Esquerda from "../components/Pagina_1_Esquerda.jpg";
import pagina1Direita from "../components/Pagina_1_Direita.jpg";
import pagina2Esquerda from "../components/Pagina_2_Esquerda.jpg";
import pagina2Direita from "../components/Pagina_2_Direita.jpg";

const SPREADS = [
  { left: pagina1Esquerda, right: pagina1Direita },
  { left: pagina2Esquerda, right: pagina2Direita },
];

export default function CartilhaPage() {
  const [pageIndex, setPageIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" ? window.innerWidth < 768 : false);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const spread = SPREADS[pageIndex];
  const activeImage = isMobile ? spread.right : null;

  const canGoBack = pageIndex > 0;
  const canGoNext = pageIndex < SPREADS.length - 1;

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#000",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "stretch",
          justifyContent: "center",
          gap: 0,
          padding: 0,
          boxSizing: "border-box",
        }}
      >
        {isMobile ? (
          <img
            src={activeImage}
            alt="Cartilha página"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              display: "block",
              background: "#111",
            }}
          />
        ) : (
          <>
            <img
              src={spread.left}
              alt="Cartilha página esquerda"
              style={{
                flex: 1,
                width: "50%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                background: "#111",
              }}
            />
            <img
              src={spread.right}
              alt="Cartilha página direita"
              style={{
                flex: 1,
                width: "50%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                background: "#111",
              }}
            />
          </>
        )}
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: "1rem 1.25rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0))",
        }}
      >
        <button
          type="button"
          onClick={() => setPageIndex((current) => Math.max(current - 1, 0))}
          disabled={!canGoBack}
          style={{
            opacity: canGoBack ? 1 : 0.4,
            padding: "0.8rem 1.2rem",
            borderRadius: 999,
            border: "none",
            background: "rgba(255,255,255,0.9)",
            color: "#111",
            fontWeight: 700,
            cursor: canGoBack ? "pointer" : "not-allowed",
          }}
        >
          Anterior
        </button>

        <span
          style={{
            color: "#fff",
            fontSize: "0.9rem",
            fontWeight: 600,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {pageIndex + 1} / {SPREADS.length}
        </span>

        <button
          type="button"
          onClick={() => setPageIndex((current) => Math.min(current + 1, SPREADS.length - 1))}
          disabled={!canGoNext}
          style={{
            opacity: canGoNext ? 1 : 0.4,
            padding: "0.8rem 1.2rem",
            borderRadius: 999,
            border: "none",
            background: "rgba(255,255,255,0.9)",
            color: "#111",
            fontWeight: 700,
            cursor: canGoNext ? "pointer" : "not-allowed",
          }}
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
