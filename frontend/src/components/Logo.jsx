// Wordmark estilizado inspirado na identidade da Opella ("Health. In your hands.")
// Usa tipografia + gota/coracao como simbolo. Substitua pelo SVG oficial se tiver.
export default function Logo({ variant = "light" }) {
  const isLight = variant === "light";
  const textColor = isLight ? "#f4f1e4" : "#0a3320";

  return (
    <div className="brand" aria-label="Opella">
      <svg
        className="brand__mark"
        width="34"
        height="34"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M20 3C11 12 6 18 6 25a14 14 0 0 0 28 0c0-7-5-13-14-22Z"
          fill="url(#opella_g)"
        />
        <circle cx="20" cy="24" r="5.5" fill="#f4f1e4" opacity="0.95" />
        <defs>
          <linearGradient id="opella_g" x1="6" y1="3" x2="34" y2="39">
            <stop stopColor="#2e9e5f" />
            <stop offset="0.55" stopColor="#15683d" />
            <stop offset="1" stopColor="#0a3320" />
          </linearGradient>
        </defs>
      </svg>
      <span className="brand__name" style={{ color: textColor }}>
        opella
      </span>
    </div>
  );
}
