import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import Logo from "../components/Logo.jsx";
import { getMinasRegistration } from "../api.js";

function QrTicket({ type, title, description, code, redeemed, redeemedAt }) {
  const qrRef = useRef(null);

  function download() {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `qrcode-${type}-${code}.png`;
    link.click();
  }

  return (
    <section
      id={`minas-panel-${type}`}
      className={`minas-qr-ticket minas-qr-ticket--${type}`}
      role="tabpanel"
      aria-labelledby={`minas-tab-${type}`}
    >
      <div className="minas-qr-ticket__head">
        <span className="minas-qr-ticket__type">{title}</span>
        <span className={`badge ${redeemed ? "badge--warn" : "badge--ok"}`}>
          {redeemed ? "Utilizado" : "Disponível"}
        </span>
      </div>
      <p>{description}</p>
      <div className={`minas-qr-code ${redeemed ? "is-used" : ""}`} ref={qrRef}>
        <QRCodeCanvas
          value={code}
          size={190}
          level="M"
          fgColor="#0a3320"
          bgColor="#ffffff"
          includeMargin={false}
        />
      </div>
      <span className="code-pill">{code}</span>
      {redeemed && redeemedAt && (
        <p className="minas-qr-ticket__used">
          Utilizado em {new Date(redeemedAt).toLocaleString("pt-BR")}
        </p>
      )}
      <button type="button" className="btn btn--ghost" onClick={download}>
        Baixar QR Code
      </button>
    </section>
  );
}

export default function MinasSuccessPage() {
  const { id } = useParams();
  const [registration, setRegistration] = useState(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("gift");

  useEffect(() => {
    let active = true;
    getMinasRegistration(id)
      .then((data) => active && setRegistration(data))
      .catch((requestError) => active && setError(requestError.message));
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <div className="page minas-page">
      <header className="hero minas-hero">
        <div className="container">
          <Logo variant="light" />
          <p className="minas-event">42º Congresso de Pediatria (SBP)</p>
          <h1 className="hero__tagline">Cadastro confirmado</h1>
          <p className="hero__sub">Seus dois acessos estão prontos.</p>
        </div>
      </header>

      <main className="container minas-success">
        <div className="card minas-success__card">
          {error ? (
            <div className="error-msg">{error}</div>
          ) : !registration ? (
            <div className="loading">Carregando QR Codes...</div>
          ) : (
            <>
              <div className="minas-success__intro">
                <h2>{registration.nome}</h2>
                <p>
                  Apresente o código correspondente em cada atividade. Cada QR Code
                  é válido para uma única utilização.
                </p>
              </div>

              <div className="minas-qr-tabs" role="tablist" aria-label="Seus QR Codes">
                <button
                  id="minas-tab-gift"
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "gift"}
                  aria-controls="minas-panel-gift"
                  className={`minas-qr-tab ${activeTab === "gift" ? "is-active" : ""}`}
                  onClick={() => setActiveTab("gift")}
                >
                  Brinde
                </button>
                <button
                  id="minas-tab-photo"
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "photo"}
                  aria-controls="minas-panel-photo"
                  className={`minas-qr-tab ${activeTab === "photo" ? "is-active" : ""}`}
                  onClick={() => setActiveTab("photo")}
                >
                  Foto
                </button>
              </div>

              <div className="minas-qr-panel">
                {activeTab === "gift" ? (
                  <QrTicket
                    type="gift"
                    title="Retirada de brinde"
                    description="Use este QR Code exclusivamente para retirar o seu brinde."
                    code={registration.giftCode}
                    redeemed={registration.giftRedeemed}
                    redeemedAt={registration.giftRedeemedAt}
                  />
                ) : (
                  <QrTicket
                    type="photo"
                    title="Experiência de foto"
                    description="Use este QR Code exclusivamente para realizar a sua foto."
                    code={registration.photoCode}
                    redeemed={registration.photoRedeemed}
                    redeemedAt={registration.photoRedeemedAt}
                  />
                )}
              </div>
            </>
          )}
        </div>
        <p className="footer-note">
          Guarde esta tela. Após a leitura pela equipe, o QR Code utilizado será
          invalidado automaticamente.
        </p>
      </main>
    </div>
  );
}