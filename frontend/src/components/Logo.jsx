import logoOpella from "./logo-opella.png";

// Logo oficial da Opella (imagem em components/logo-opella.png)
export default function Logo({ variant = "light" }) {
  return (
    <div className={`brand brand--${variant}`} aria-label="Opella">
      <img
        className="brand__logo"
        src={logoOpella}
        alt="Opella"
        draggable="false"
      />
    </div>
  );
}
