import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import Logo from "../components/Logo.jsx";
import { getRegistration } from "../api.js";

// Pagina publica exibida quando alguem escaneia o link do QR com a camera do celular.
export default function ValidatePage() {
  const { code } = useParams();
  const [reg, setReg] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getRegistration(code)
      .then((data) => active && setReg(data))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [code]);

  return (
    <div className="page">
      <header className="hero">
        <div className="container">
          <Logo variant="light" />
          <h1 className="hero__tagline">Seu QR Code</h1>
          <p className="hero__sub">Apresente esta tela no estande da Opella.</p>
        </div>
      </header>

      <main className="container">
        <div className="card center-col">
          {loading ? (
            <div className="loading">Carregando...</div>
          ) : error ? (
            <div className="error-msg">{error}</div>
          ) : (
            <>
              <div className="qr-box">
                <QRCodeCanvas
                  value={`${window.location.origin}/validar/${code}`}
                  size={200}
                  level="M"
                  fgColor="#0a3320"
                  bgColor="#FFFFFF"
                />
              </div>
              <div>
                <span className="code-pill">{code}</span>
              </div>
              {reg?.nome && <p className="title">{reg.nome}</p>}
              {reg?.redeemed ? (
                <span className="badge badge--warn">Brinde ja retirado</span>
              ) : (
                <span className="badge badge--ok">Valido para retirada</span>
              )}
            </>
          )}
          <div className="spacer-14" />
          <Link to="/" className="link-btn">
            Fazer novo cadastro
          </Link>
        </div>
      </main>
    </div>
  );
}
