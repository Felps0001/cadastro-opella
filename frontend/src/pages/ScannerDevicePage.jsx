import { useEffect, useRef, useState, useCallback } from "react";
import Logo from "../components/Logo.jsx";
import { staffRedeem } from "../api.js";

// Extrai o codigo (OPL-XXXXXXXX) do conteudo lido, seja URL ou texto puro.
function extractCode(text) {
  if (!text) return "";
  const match = String(text).match(/OPL-[A-Z0-9]{8}/i);
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

  // Mantem o campo invisivel sempre com foco para o scanner "digitar" nele.
  const focusInput = useCallback(() => {
    const el = inputRef.current;
    if (el) el.focus();
  }, []);

  const process = useCallback(
    async (raw) => {
      const code = extractCode(raw);
      if (!code || busy) return;

      setBusy(true);
      try {
        // Da baixa direto; o backend avisa se ja foi retirado.
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
    focusInput();
  }, [focusInput, result]);

  function reset() {
    setResult(null);
    setValue("");
    // Devolve o foco ao campo apos limpar o resultado.
    setTimeout(focusInput, 0);
  }

  return (
    <div className="scanner-page" onClick={focusInput}>
      <div className="scanner-head">
        <Logo variant="light" />
        <h1>Leitor de brindes (scanner)</h1>
      </div>

      {/* Campo invisivel que recebe a "digitacao" do scanner de dispositivo. */}
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(focusInput, 0)}
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
          {result.type === "ok" && (
            <>
              <div className="big-icon">✅</div>
              <h2>Brinde liberado!</h2>
              <div className="spacer-8" />
              <div className="result-row">
                <span>Nome</span>
                <span>{result.data.nome || "-"}</span>
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
              <h2>Brinde ja retirado</h2>
              <div className="spacer-8" />
              <div className="result-row">
                <span>Nome</span>
                <span>{result.data?.nome || "-"}</span>
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
