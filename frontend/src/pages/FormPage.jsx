import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo.jsx";
import { createRegistration } from "../api.js";

// Mascara simples de telefone: (00) 00000-0000
function maskPhone(value) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.replace(/(\d{0,2})/, "($1");
  if (d.length <= 6) return d.replace(/(\d{2})(\d{0,4})/, "($1) $2");
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}

const ATRIBUICOES = ["Farmacêutico", "Balconista", "Gerente de Loja", "Operador"];
const CANAIS = ["E-mail", "Whatsapp", "SMS"];
const TOTAL_STEPS = 3;

const initialForm = {
  // Etapa 1 - Dados gerais
  nome: "",
  email: "",
  telefone: "",
  // Etapa 2 - Local de trabalho
  localTrabalho: "", // "Ponto de Venda" | "Escritório"
  codigoLoja: "",
  atribuicao: "",
  farmaceuticoFormado: "", // "sim" | "nao"
  crf: "",
  crfUf: "",
  // Etapa 3 - Declaracao de aceite
  aceiteComunicacao: "", // "sim" | "nao"
  canaisContato: [],
  nps: "", // 0..10
};

export default function FormPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleCanal(canal) {
    setForm((f) => {
      const has = f.canaisContato.includes(canal);
      return {
        ...f,
        canaisContato: has
          ? f.canaisContato.filter((c) => c !== canal)
          : [...f.canaisContato, canal],
      };
    });
  }

  const isFarmaceutico = form.farmaceuticoFormado === "sim";

  function validateStep(current) {
    if (current === 1) {
      if (!form.email.trim()) return "Informe o seu e-mail.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        return "E-mail inválido.";
      if (form.telefone.replace(/\D/g, "").length < 10)
        return "Informe um telefone válido com DDD.";
    }
    if (current === 2) {
      if (!form.localTrabalho) return "Selecione onde você trabalha.";
      if (!form.codigoLoja.trim()) return "Informe o código/nº da loja/filial.";
      if (!form.atribuicao) return "Selecione a sua atribuição.";
      if (!form.farmaceuticoFormado)
        return "Informe se você é farmacêutico(a) formado(a).";
      if (isFarmaceutico && !form.crf.trim()) return "Informe o seu CRF.";
      if (isFarmaceutico && !form.crfUf.trim())
        return "Informe o Estado/UF do seu CRF.";
    }
    if (current === 3) {
      if (!form.aceiteComunicacao) return "Selecione a declaração de aceite.";
      if (form.canaisContato.length === 0)
        return "Selecione ao menos um canal de contato.";
      if (form.nps === "") return "Selecione uma nota de 0 a 10.";
    }
    return "";
  }

  function next() {
    const err = validateStep(step);
    if (err) return setError(err);
    setError("");
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    setError("");
    setStep((s) => Math.max(1, s - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const err = validateStep(3);
    if (err) return setError(err);
    setError("");

    const payload = {
      nome: form.nome,
      email: form.email,
      telefone: form.telefone,
      localTrabalho: form.localTrabalho,
      codigoLoja: form.codigoLoja,
      atribuicao: form.atribuicao,
      farmaceuticoFormado: isFarmaceutico,
      crf: isFarmaceutico ? form.crf : "",
      crfUf: isFarmaceutico ? form.crfUf : "",
      aceiteComunicacao: form.aceiteComunicacao === "sim",
      canaisContato: form.canaisContato,
      nps: form.nps === "" ? null : Number(form.nps),
    };

    setLoading(true);
    try {
      const data = await createRegistration(payload);
      navigate(`/sucesso/${data.code}`);
    } catch (err2) {
      setError(err2.message || "Não foi possível enviar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const stepTitles = {
    1: "Dados gerais",
    2: "Local de trabalho",
    3: "Declaração de aceite",
  };

  return (
    <div className="page">
      <header className="hero">
        <div className="container">
          <Logo variant="light" />
          <h1 className="hero__tagline">Cadastro Opella</h1>
          <p className="hero__sub">
            Abrafarma RJ — preencha seus dados e receba seu QR Code para retirar
            o brinde.
          </p>
        </div>
      </header>

      <main className="container">
        <form className="card" onSubmit={handleSubmit} noValidate>
          {/* Indicador de etapas */}
          <div className="steps">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`steps__dot ${s === step ? "is-active" : ""} ${
                  s < step ? "is-done" : ""
                }`}
              />
            ))}
          </div>
          <p className="step-label">
            Etapa {step} de {TOTAL_STEPS} — {stepTitles[step]}
          </p>

          {error && <div className="error-msg">{error}</div>}

          {/* ---------- ETAPA 1 ---------- */}
          {step === 1 && (
            <>
              <div className="field">
                <label htmlFor="nome">Nome completo</label>
                <input
                  id="nome"
                  type="text"
                  autoComplete="name"
                  placeholder="Seu nome"
                  value={form.nome}
                  onChange={(e) => update("nome", e.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="email">
                  Informe o seu e-mail <span className="req">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="voce@email.com"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="telefone">
                  Telefone celular com DDD <span className="req">*</span>
                </label>
                <input
                  id="telefone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="(21) 90000-0000"
                  value={form.telefone}
                  onChange={(e) => update("telefone", maskPhone(e.target.value))}
                  required
                />
              </div>
            </>
          )}

          {/* ---------- ETAPA 2 ---------- */}
          {step === 2 && (
            <>
              <div className="field">
                <label>
                  Você trabalha no Ponto de Venda ou no Escritório?{" "}
                  <span className="req">*</span>
                </label>
                <div className="options">
                  {["Ponto de Venda", "Escritório"].map((op) => (
                    <button
                      type="button"
                      key={op}
                      className={`option ${
                        form.localTrabalho === op ? "is-selected" : ""
                      }`}
                      onClick={() => update("localTrabalho", op)}
                    >
                      {op}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <label htmlFor="codigoLoja">
                  Qual é o Código/Nº da Loja/Filial que você trabalha?{" "}
                  <span className="req">*</span>
                </label>
                <input
                  id="codigoLoja"
                  type="text"
                  inputMode="numeric"
                  placeholder="Ex: 1234"
                  value={form.codigoLoja}
                  onChange={(e) => update("codigoLoja", e.target.value)}
                />
              </div>

              <div className="field">
                <label>
                  Qual é a sua atribuição no Ponto de Venda?{" "}
                  <span className="req">*</span>
                </label>
                <div className="options options--col">
                  {ATRIBUICOES.map((op) => (
                    <button
                      type="button"
                      key={op}
                      className={`option ${
                        form.atribuicao === op ? "is-selected" : ""
                      }`}
                      onClick={() => update("atribuicao", op)}
                    >
                      {op}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <label>
                  Você é um(a) farmacêutico(a) formado(a)?{" "}
                  <span className="req">*</span>
                </label>
                <div className="options">
                  {[
                    { v: "sim", l: "Sim" },
                    { v: "nao", l: "Não" },
                  ].map((op) => (
                    <button
                      type="button"
                      key={op.v}
                      className={`option ${
                        form.farmaceuticoFormado === op.v ? "is-selected" : ""
                      }`}
                      onClick={() => update("farmaceuticoFormado", op.v)}
                    >
                      {op.l}
                    </button>
                  ))}
                </div>
              </div>

              {isFarmaceutico && (
                <>
                  <div className="field">
                    <label htmlFor="crf">
                      Informe o seu CRF (apenas números){" "}
                      <span className="req">*</span>
                    </label>
                    <input
                      id="crf"
                      type="text"
                      inputMode="numeric"
                      placeholder="Somente números"
                      value={form.crf}
                      onChange={(e) =>
                        update("crf", e.target.value.replace(/\D/g, ""))
                      }
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="crfUf">
                      Qual é o Estado/UF de emissão do seu CRF?{" "}
                      <span className="req">*</span>
                    </label>
                    <input
                      id="crfUf"
                      type="text"
                      maxLength={2}
                      placeholder="Ex: RJ"
                      value={form.crfUf}
                      onChange={(e) =>
                        update(
                          "crfUf",
                          e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase()
                        )
                      }
                    />
                  </div>
                </>
              )}
            </>
          )}

          {/* ---------- ETAPA 3 ---------- */}
          {step === 3 && (
            <>
              <div className="field">
                <label>
                  Autorizo receber comunicações de marketing da Opella
                  Healthcare Brasil por e-mail, SMS e Whatsapp, podendo revogar a
                  qualquer momento. <span className="req">*</span>
                </label>
                <div className="options options--col">
                  {[
                    { v: "sim", l: "Aceito receber comunicações da Opella" },
                    { v: "nao", l: "Não aceito receber comunicações da Opella" },
                  ].map((op) => (
                    <button
                      type="button"
                      key={op.v}
                      className={`option ${
                        form.aceiteComunicacao === op.v ? "is-selected" : ""
                      }`}
                      onClick={() => update("aceiteComunicacao", op.v)}
                    >
                      {op.l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <label>
                  Quais são os seus canais de contato de preferência? (marque
                  mais de uma se quiser) <span className="req">*</span>
                </label>
                <div className="options">
                  {CANAIS.map((op) => (
                    <button
                      type="button"
                      key={op}
                      className={`option ${
                        form.canaisContato.includes(op) ? "is-selected" : ""
                      }`}
                      onClick={() => toggleCanal(op)}
                    >
                      {op}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <label>
                  De 0 a 10, o quanto a presença da Opella neste evento foi
                  relevante para a sua prática profissional?{" "}
                  <span className="req">*</span>
                </label>
                <div className="nps">
                  {Array.from({ length: 11 }, (_, i) => i).map((n) => (
                    <button
                      type="button"
                      key={n}
                      className={`nps__item ${
                        String(form.nps) === String(n) ? "is-selected" : ""
                      }`}
                      onClick={() => update("nps", n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className="nps__legend">
                  <span>Nada relevante</span>
                  <span>Extremamente relevante</span>
                </div>
              </div>
            </>
          )}

          {/* ---------- NAVEGACAO ---------- */}
          <div className="form-nav">
            {step > 1 && (
              <button
                type="button"
                className="btn btn--ghost"
                onClick={back}
                disabled={loading}
              >
                Voltar
              </button>
            )}
            {step < TOTAL_STEPS && (
              <button type="button" className="btn btn--primary" onClick={next}>
                Avançar
              </button>
            )}
            {step === TOTAL_STEPS && (
              <button
                type="submit"
                className="btn btn--primary"
                disabled={loading}
              >
                {loading ? "Enviando..." : "Gerar meu QR Code"}
              </button>
            )}
          </div>
        </form>

        <p className="footer-note">
          Ao enviar, seus dados serão utilizados exclusivamente para a ação da
          Opella na Abrafarma RJ.
        </p>
      </main>
    </div>
  );
}
