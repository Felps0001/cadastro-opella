import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import Logo from "../components/Logo.jsx";
import { getRegistration, API_URL } from "../api.js";

export default function SuccessPage() {
  const { code } = useParams();
  const [reg, setReg] = useState(null);
  const [error, setError] = useState("");
  const qrRef = useRef(null);

  // Conteudo do QR: mesmo link publico de validacao
  const qrValue = `${window.location.origin}/validar/${code}`;

  useEffect(() => {
    let active = true;
    getRegistration(code)
      .then((data) => active && setReg(data))
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [code]);

  function downloadQR() {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `qrcode-opella-${code}.png`;
    a.click();
  }

  return (
    <div className="page">
      <header className="hero">
        <div className="container">
          <Logo variant="light" />
          <h1 className="hero__tagline">Tudo certo! 🎉</h1>
          <p className="hero__sub">
            Apresente o QR Code abaixo no estande para retirar o seu brinde.
          </p>
        </div>
      </header>

      <main className="container">
        <div className="card center-col">
          {error ? (
            <div className="error-msg">{error}</div>
          ) : (
            <>
              <div className="qr-box" ref={qrRef}>
                <QRCodeCanvas
                  value={qrValue}
                  size={230}
                  level="M"
                  fgColor="#0a3320"
                  bgColor="#FFFFFF"
                  includeMargin={false}
                />
              </div>
              <div>
                <span className="code-pill">{code}</span>
              </div>
              {reg?.nome && (
                <p className="subtitle" style={{ marginTop: 10 }}>
                  {reg.nome}
                </p>
              )}
              {reg?.redeemed ? (
                <p className="subtitle" style={{ color: "#a97a00" }}>
                  Este brinde ja foi retirado.
                </p>
              ) : (
                <p className="subtitle">
                  Guarde esta tela ou baixe a imagem do QR Code.
                </p>
              )}

              <div className="spacer-8" />
              <button className="btn btn--ghost" onClick={downloadQR}>
                Baixar QR Code
              </button>
              <div className="spacer-8" />
              <Link to="/" className="link-btn">
                Fazer novo cadastro
              </Link>
            </>
          )}
        </div>

        <p className="footer-note">
          Problemas com o QR Code? Mostre o codigo <strong>{code}</strong> para
          a equipe do estande.
        </p>
      </main>
    </div>
  );
}
