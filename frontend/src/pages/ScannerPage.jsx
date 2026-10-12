import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
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

export default function ScannerPage() {
  const scannerRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // { type, data, message }
  const [signatureDataUrl, setSignatureDataUrl] = useState("");
  const [signatureError, setSignatureError] = useState("");
  const lastCodeRef = useRef("");
  const signaturePendingRef = useRef(false);
  const cooldownRef = useRef(null);

  const stopScanner = useCallback(async () => {
    const inst = scannerRef.current;
    if (inst) {
      try {
        await inst.stop();
        await inst.clear();
      } catch {
        /* ignore */
      }
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  const handleDecoded = useCallback(
    async (decodedText) => {
      const code = extractCode(decodedText);
      if (!code || busy || signaturePendingRef.current) return;
      // Evita reprocessar o mesmo codigo em leituras seguidas.
      if (code === lastCodeRef.current) return;
      lastCodeRef.current = code;

      setBusy(true);
      // A camera continua ligada: assim que outro QR Code aparecer, ja le.
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
        // Libera o mesmo codigo apos um intervalo, caso precise reler.
        if (cooldownRef.current) clearTimeout(cooldownRef.current);
        cooldownRef.current = setTimeout(() => {
          lastCodeRef.current = "";
        }, 3000);
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

  const startScanner = useCallback(async () => {
    setResult(null);
    lastCodeRef.current = "";
    try {
      const html5 = new Html5Qrcode("reader");
      scannerRef.current = html5;
      setScanning(true);
      await html5.start(
        { facingMode: "environment" },
        {
          fps: 10,
          // Quadro de leitura responsivo (70% do menor lado do video)
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const min = Math.min(viewfinderWidth, viewfinderHeight);
            const size = Math.max(150, Math.floor(min * 0.7));
            return { width: size, height: size };
          },
          aspectRatio: 1.0,
        },
        handleDecoded,
        () => {},
      );
    } catch (err) {
      setScanning(false);
      const msg =
        err?.name === "NotAllowedError"
          ? "Permissao da camera negada. Toque no cadeado do navegador, permita a camera e tente de novo."
          : err?.name === "NotFoundError"
            ? "Nenhuma camera encontrada neste dispositivo."
            : "Nao foi possivel acessar a camera. Use HTTPS e permita o acesso a camera.";
      setResult({ type: "err", message: msg });
    }
  }, [handleDecoded]);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearTimeout(cooldownRef.current);
      stopScanner();
    };
  }, [stopScanner]);

  // Some com o resultado automaticamente para liberar a proxima leitura,
  // mantendo a camera sempre ligada.
  useEffect(() => {
    if (!result || result.type === "signature") return;
    const t = setTimeout(() => setResult(null), 4000);
    return () => clearTimeout(t);
  }, [result]);

  function reset() {
    signaturePendingRef.current = false;
    setSignatureDataUrl("");
    setSignatureError("");
    setResult(null);
    lastCodeRef.current = "";
  }

  return (
    <div className="scanner-page">
      <div className="scanner-head">
        <Logo variant="light" />
        <h1>Leitor de benefícios</h1>
      </div>

      {/* A camera fica SEMPRE montada e visivel para leitura continua.
          O resultado aparece como um cartao sobreposto. */}
      <div id="reader" />

      {!scanning && !result && (
        <>
          <div className="spacer-14" />
          <button
            className="btn btn--primary"
            style={{ maxWidth: 460 }}
            onClick={startScanner}
          >
            Iniciar leitura
          </button>
        </>
      )}

      {scanning && (
        <>
          <div className="spacer-14" />
          <p style={{ opacity: 0.85 }}>
            {busy
              ? "Processando leitura..."
              : "Aponte a camera para o QR Code..."}
          </p>
          <button
            className="link-btn"
            style={{ color: "#fff" }}
            onClick={stopScanner}
          >
            Cancelar
          </button>
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
          <p style={{ opacity: 0.7, fontSize: 14 }}>
            Pode escanear o proximo QR Code direto, sem clicar em nada.
          </p>
          <button className="btn btn--primary" onClick={reset}>
            Fechar
          </button>
        </div>
      )}
    </div>
  );
}
