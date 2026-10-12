import { useEffect, useRef, useState, useCallback } from "react";
import Logo from "../components/Logo.jsx";
import { staffLookup, staffRedeem } from "../api.js";
import SignaturePad from "../components/SignaturePad.jsx";

// Extrai os codigos suportados do conteudo lido, seja URL ou texto puro.
function extractCode(text) {
  if (!text) return "";
  const match = String(text).match(/(?:OPL|BRT|FOT)-[A-Z0-9]{8}/i);
  if (match) return match[0].toUpperCase();
  // Se veio uma URL /validar/CODE
  const parts = String(text).split("/").filter(Boolean);
  return (parts[parts.length - 1] || "").trim().toUpperCase();
}

export default function ScannerDevicePage() {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // { type, data, message }
  const [value, setValue] = useState("");
  const [signatureDataUrl, setSignatureDataUrl] = useState("");
  const [signatureError, setSignatureError] = useState("");
  const signaturePendingRef = useRef(false);

  // Mantem o campo invisivel sempre com foco para o scanner "digitar" nele.
  const focusInput = useCallback(() => {
    const el = inputRef.current;
    if (el) el.focus();
  }, []);

  const process = useCallback(
    async (raw) => {
      const code = extractCode(raw);
      if (!code || busy || signaturePendingRef.current) return;

      setBusy(true);
      try {
        const lookup = await staffLookup(code);
        if (lookup.signatureRequired && lookup.redeemed) {
          setResult({ type: "warn", data: lookup });
          return;
        }
        if (lookup.signatureRequired) {
          signaturePendingRef.current = true;
          setSignatureDataUrl("");
          setSignatureError("");
          setResult({ type: "signature", data: lookup });
          return;
        }
        const data = await staffRedeem(code);
        setResult({ type: "ok", data });
      } catch (err) {
        if (err.status === 409) {
          setResult({ type: "warn", data: err.data });
        } else if (err.status === 404) {
          setResult({ type: "err", message: "QR Code nao encontrado." });
        } else if (err.status === 401) {
          setResult({
            type: "err",
            message: "Token invalido. Verifique o .env.",
          });
        } else {
          setResult({
            type: "err",
            message: err.message || "Erro na leitura.",
          });
        }
      } finally {
        setBusy(false);
      }
    },
    [busy],
  );

  async function confirmSignature(event) {
    event.preventDefault();
    if (!result?.data?.code || !signatureDataUrl || busy) return;
    setBusy(true);
    setSignatureError("");
    try {
      const data = await staffRedeem(result.data.code, signatureDataUrl);
      signaturePendingRef.current = false;
      setResult({ type: "ok", data });
    } catch (err) {
      if (err.status === 409) {
        signaturePendingRef.current = false;
        setResult({ type: "warn", data: err.data });
      } else {
        setSignatureError(
          err.message || "Não foi possível confirmar a retirada.",
        );
      }
    } finally {
      setBusy(false);
    }
  }

  // O scanner de dispositivo envia o conteudo terminado por Enter.
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const raw = value.trim();
        setValue("");
        if (raw) process(raw);
      }
    },
    [value, process],
  );

  useEffect(() => {
    if (result?.type !== "signature") focusInput();
  }, [focusInput, result]);

  function reset() {
    signaturePendingRef.current = false;
    setSignatureDataUrl("");
    setSignatureError("");
    setResult(null);
    setValue("");
    // Devolve o foco ao campo apos limpar o resultado.
    setTimeout(focusInput, 0);
  }

  return (
    <div
      className="scanner-page"
      onClick={() => result?.type !== "signature" && focusInput()}
    >
      <div className="scanner-head">
        <Logo variant="light" />
        <h1>Leitor de benefícios (scanner)</h1>
      </div>

      {/* Campo invisivel que recebe a "digitacao" do scanner de dispositivo. */}
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (result?.type !== "signature") setTimeout(focusInput, 0);
        }}
        autoFocus
        aria-hidden="true"
        style={{
          position: "absolute",
          opacity: 0,
          width: 1,
          height: 1,
          pointerEvents: "none",
        }}
      />

      {!result && (
        <>
          <div className="spacer-14" />
          <p style={{ opacity: 0.85 }}>
            {busy
              ? "Processando leitura..."
              : "Aponte o scanner para o QR Code e dispare a leitura."}
          </p>
          <p style={{ opacity: 0.6, fontSize: 14 }}>
            Mantenha esta tela aberta. Nenhuma camera e necessaria.
          </p>
        </>
      )}

      {result && (
        <div className={`result-card result--${result.type}`}>
          {result.type === "signature" && (
            <form onSubmit={confirmSignature}>
              <h2>Assinatura para {result.data.purposeLabel.toLowerCase()}</h2>
              <div className="result-row">
                <span>Nome</span>
                <span>{result.data.nome || "-"}</span>
              </div>
              <div className="result-row">
                <span>Código</span>
                <span>{result.data.code}</span>
              </div>
              <p className="subtitle">
                Peça à pessoa para assinar e confirme a entrega.
              </p>
              <SignaturePad onChange={setSignatureDataUrl} />
              {signatureError && (
                <div className="error-msg">{signatureError}</div>
              )}
              <button
                className="btn btn--primary"
                type="submit"
                disabled={!signatureDataUrl || busy}
              >
                {busy ? "Confirmando..." : "Confirmar retirada"}
              </button>
              <button
                className="btn btn--ghost"
                type="button"
                onClick={reset}
                disabled={busy}
              >
                Cancelar leitura
              </button>
            </form>
          )}

          {result.type === "ok" && (
            <>
              <div className="big-icon">✅</div>
              <h2>
                {result.data.purpose === "photo"
                  ? "Foto liberada!"
                  : "Brinde liberado!"}
              </h2>
              <div className="spacer-8" />
              <div className="result-row">
                <span>Nome</span>
                <span>{result.data.nome || "-"}</span>
              </div>
              <div className="result-row">
                <span>Tipo</span>
                <span>{result.data.purposeLabel || "Brinde"}</span>
              </div>
              <div className="result-row">
                <span>Codigo</span>
                <span>{result.data.code}</span>
              </div>
              <div className="result-row">
                <span>Baixa em</span>
                <span>
                  {new Date(result.data.redeemedAt).toLocaleString("pt-BR")}
                </span>
              </div>
            </>
          )}

          {result.type === "warn" && (
            <>
              <div className="big-icon">⚠️</div>
              <h2>
                {result.data?.purpose === "photo"
                  ? "Foto já utilizada"
                  : "Brinde já retirado"}
              </h2>
              <div className="spacer-8" />
              <div className="result-row">
                <span>Nome</span>
                <span>{result.data?.nome || "-"}</span>
              </div>
              <div className="result-row">
                <span>Tipo</span>
                <span>{result.data?.purposeLabel || "Brinde"}</span>
              </div>
              <div className="result-row">
                <span>Codigo</span>
                <span>{result.data?.code}</span>
              </div>
              {result.data?.redeemedAt && (
                <div className="result-row">
                  <span>Retirado em</span>
                  <span>
                    {new Date(result.data.redeemedAt).toLocaleString("pt-BR")}
                  </span>
                </div>
              )}
            </>
          )}

          {result.type === "err" && (
            <>
              <div className="big-icon">❌</div>
              <h2>Ops!</h2>
              <p className="subtitle">{result.message}</p>
            </>
          )}

          <div className="spacer-14" />
          <button className="btn btn--primary" onClick={reset}>
            Ler proximo
          </button>
        </div>
      )}
    </div>
  );
}
