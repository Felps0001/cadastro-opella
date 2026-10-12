import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo.jsx";
import { createMinasRegistration } from "../api.js";

const SECONDARY_SPECIALTIES = [
  "Não se aplica",
  "Alergia e Imunologia",
  "Clínica Médica",
  "Cirurgia Geral",
  "Cardiologia",
  "Gastroenterologia",
  "Ortopedia",
  "Dermatologia",
  "Endocrinologia",
  "Medicina de Família e Comunidade",
  "Outra especialidade",
];
const BRAZIL_STATES = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];
const EVENT_NAME = "Congresso Brasileiro de Pediatria";
const PRODUCTS = [
  { nome: "Allegra 120 mg", lote: "FRA0378", quantidade: "10" },
  { nome: "Allegra 180 mg", lote: "FRA0555", quantidade: "10" },
];
const REPRESENTATIVE_NAME = "Rodrigo Loder";

const initialForm = {
  nome: "",
  crm: "",
  crmUf: "",
  estudante: false,
  especialidade: "",
  segundaEspecialidade: "Não se aplica",
  email: "",
  whatsapp: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  ufEndereco: "",
  declaracaoSolicitacao: false,
  cienciaAvisoPrivacidade: false,
  aceiteComunicacao: false,
  aceiteTermos: false,
};

function maskPhone(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.replace(/(\d{0,2})/, "($1");
  if (digits.length <= 6) return digits.replace(/(\d{2})(\d{0,4})/, "($1) $2");
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  }
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}

function maskCep(value) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.length > 5
    ? `${digits.slice(0, 5)}-${digits.slice(5)}`
    : digits;
}

export default function MinasFormPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleStudent(checked) {
    setForm((current) => ({
      ...current,
      estudante: checked,
      crm: checked ? "" : current.crm,
      crmUf: checked ? "" : current.crmUf,
    }));
  }

  function validateStep(currentStep) {
    if (!form.nome.trim()) return "Informe seu nome completo.";
    if (!form.estudante && !form.crm.trim()) return "Informe seu CRM.";
    if (!form.estudante && !form.crmUf) return "Selecione a UF do seu CRM.";
    if (!form.especialidade) return "Selecione sua especialidade.";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      return "Informe um e-mail profissional válido.";
    }
    if (form.whatsapp && form.whatsapp.replace(/\D/g, "").length < 10) {
      return "Informe um telefone válido com DDD.";
    }
    if (form.cep.replace(/\D/g, "").length !== 8)
      return "Informe um CEP válido.";
    if (!form.logradouro.trim()) return "Informe o logradouro profissional.";
    if (!form.numero.trim()) return "Informe o número do endereço.";
    if (!form.bairro.trim()) return "Informe o bairro.";
    if (!form.cidade.trim()) return "Informe a cidade.";
    if (!form.ufEndereco) return "Selecione a UF do endereço.";
    if (currentStep === 1) return "";
    if (!form.declaracaoSolicitacao) {
      return "Confirme a declaração de solicitação dos produtos.";
    }
    if (!form.cienciaAvisoPrivacidade) {
      return "Confirme a leitura do Aviso de Privacidade.";
    }
    if (!form.aceiteComunicacao) {
      return "Autorize o recebimento de comunicações para continuar.";
    }
    if (!form.aceiteTermos) {
      return "Aceite os Termos e Condições e o Aviso de Privacidade.";
    }
    return "";
  }

  function nextStep() {
    const validationError = validateStep(1);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function previousStep() {
    setError("");
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationError = validateStep(2);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await createMinasRegistration({ ...form, pais: "Brasil" });
      navigate(`/congresso-pediatria/sucesso/${data.id}`);
    } catch (requestError) {
      setError(requestError.message || "Não foi possível concluir o cadastro.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page minas-page">
      <header className="hero minas-hero">
        <div className="container">
          <Logo variant="light" />
          <p className="minas-event">42º Congresso de Pediatria (SBP)</p>
          <h1 className="hero__tagline">Cadastre-se para participar</h1>
          <p className="hero__sub">
            Preencha os dados para solicitar os produtos.
          </p>
        </div>
      </header>

      <main className="container">
        <form className="card minas-form" onSubmit={handleSubmit} noValidate>
          <div className="steps">
            {[1, 2].map((currentStep) => (
              <div
                key={currentStep}
                className={`steps__dot ${currentStep === step ? "is-active" : ""} ${currentStep < step ? "is-done" : ""}`}
              />
            ))}
          </div>
          <p className="step-label">
            Etapa {step} de 2 —{" "}
            {step === 1 ? "Dados profissionais" : "Solicitação e assinatura"}
          </p>
          <h2 className="minas-form__title">
            {step === 1 ? "Dados profissionais" : "Solicitação dos produtos"}
          </h2>

          {step === 1 && (
            <>
              <div className="field">
                <label htmlFor="minas-nome">
                  Nome completo <span className="req">*</span>
                </label>
                <input
                  id="minas-nome"
                  type="text"
                  autoComplete="name"
                  value={form.nome}
                  onChange={(event) => update("nome", event.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="minas-crm">
                  CRM <span className="req">*</span>
                </label>
                <input
                  id="minas-crm"
                  type="text"
                  inputMode="numeric"
                  placeholder="Somente números"
                  value={form.crm}
                  disabled={form.estudante}
                  onChange={(event) =>
                    update("crm", event.target.value.replace(/\D/g, ""))
                  }
                  required={!form.estudante}
                />
              </div>

              <div className="field">
                <label htmlFor="minas-crm-uf">
                  UF do CRM <span className="req">*</span>
                </label>
                <select
                  id="minas-crm-uf"
                  value={form.crmUf}
                  disabled={form.estudante}
                  onChange={(event) => update("crmUf", event.target.value)}
                  required={!form.estudante}
                >
                  <option value="">Selecione a UF</option>
                  {BRAZIL_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>

              <label className="check-row" htmlFor="minas-estudante">
                <input
                  id="minas-estudante"
                  type="checkbox"
                  checked={form.estudante}
                  onChange={(event) => toggleStudent(event.target.checked)}
                />
                <span>Sou estudante de Medicina (ainda não possuo CRM).</span>
              </label>

              <div className="field">
                <label htmlFor="minas-especialidade">
                  Especialidade <span className="req">*</span>
                </label>
                <select
                  id="minas-especialidade"
                  value={form.especialidade}
                  onChange={(event) =>
                    update("especialidade", event.target.value)
                  }
                  required
                >
                  <option value="">Selecione uma opção</option>
                  <option value="Pediatria">Pediatria</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="minas-segunda-especialidade">
                  Segunda especialidade (opcional)
                </label>
                <select
                  id="minas-segunda-especialidade"
                  value={form.segundaEspecialidade}
                  onChange={(event) =>
                    update("segundaEspecialidade", event.target.value)
                  }
                >
                  {SECONDARY_SPECIALTIES.map((specialty) => (
                    <option key={specialty} value={specialty}>
                      {specialty}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="minas-email">E-mail profissional</label>
                <input
                  id="minas-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => update("email", event.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="minas-whatsapp">Telefone profissional</label>
                <input
                  id="minas-whatsapp"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="(11) 91234-5678"
                  value={form.whatsapp}
                  onChange={(event) =>
                    update("whatsapp", maskPhone(event.target.value))
                  }
                />
              </div>

              <div className="field">
                <label htmlFor="minas-cep">
                  CEP profissional <span className="req">*</span>
                </label>
                <input
                  id="minas-cep"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  placeholder="00000-000"
                  value={form.cep}
                  onChange={(event) =>
                    update("cep", maskCep(event.target.value))
                  }
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="minas-logradouro">
                  Logradouro profissional <span className="req">*</span>
                </label>
                <input
                  id="minas-logradouro"
                  autoComplete="address-line1"
                  value={form.logradouro}
                  onChange={(event) => update("logradouro", event.target.value)}
                  required
                />
              </div>

              <div className="minas-form__address-row">
                <div className="field">
                  <label htmlFor="minas-numero">
                    Número <span className="req">*</span>
                  </label>
                  <input
                    id="minas-numero"
                    value={form.numero}
                    onChange={(event) => update("numero", event.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="minas-complemento">Complemento</label>
                  <input
                    id="minas-complemento"
                    value={form.complemento}
                    onChange={(event) =>
                      update("complemento", event.target.value)
                    }
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="minas-bairro">
                  Bairro <span className="req">*</span>
                </label>
                <input
                  id="minas-bairro"
                  autoComplete="address-level3"
                  value={form.bairro}
                  onChange={(event) => update("bairro", event.target.value)}
                  required
                />
              </div>

              <div className="minas-form__address-row">
                <div className="field">
                  <label htmlFor="minas-cidade">
                    Cidade <span className="req">*</span>
                  </label>
                  <input
                    id="minas-cidade"
                    autoComplete="address-level2"
                    value={form.cidade}
                    onChange={(event) => update("cidade", event.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="minas-uf-endereco">
                    UF do endereço <span className="req">*</span>
                  </label>
                  <select
                    id="minas-uf-endereco"
                    autoComplete="address-level1"
                    value={form.ufEndereco}
                    onChange={(event) =>
                      update("ufEndereco", event.target.value)
                    }
                    required
                  >
                    <option value="">UF</option>
                    {BRAZIL_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="button"
                className="btn btn--primary"
                onClick={nextStep}
              >
                Avançar
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="minas-product-info">
                <div className="field">
                  <label htmlFor="minas-evento">Evento</label>
                  <input id="minas-evento" value={EVENT_NAME} readOnly />
                </div>
                {PRODUCTS.map((product, index) => (
                  <div className="minas-product-info__row" key={product.nome}>
                    <div className="field">
                      <label htmlFor={`minas-produto-${index}`}>
                        Produto {index + 1}
                      </label>
                      <input
                        id={`minas-produto-${index}`}
                        value={product.nome}
                        readOnly
                      />
                    </div>
                    <div className="field">
                      <label htmlFor={`minas-lote-${index}`}>Lote</label>
                      <input
                        id={`minas-lote-${index}`}
                        value={product.lote}
                        readOnly
                      />
                    </div>
                    <div className="field">
                      <label htmlFor={`minas-quantidade-${index}`}>
                        Quantidade
                      </label>
                      <input
                        id={`minas-quantidade-${index}`}
                        value={product.quantidade}
                        readOnly
                      />
                    </div>
                  </div>
                ))}
                <div className="field">
                  <label htmlFor="minas-representante">
                    Representante sistêmico
                  </label>
                  <input
                    id="minas-representante"
                    value={REPRESENTATIVE_NAME}
                    readOnly
                  />
                </div>
              </div>

              <label className="consent" htmlFor="minas-declaracao">
                <input
                  id="minas-declaracao"
                  type="checkbox"
                  checked={form.declaracaoSolicitacao}
                  onChange={(event) =>
                    update("declaracaoSolicitacao", event.target.checked)
                  }
                  required
                />
                <span>
                  Declaro que solicito os produtos informados para uso
                  profissional. <span className="req">*</span>
                </span>
              </label>

              <div className="info-msg">
                <a
                  href="https://www.opella.com/en/privacy-center"
                  target="_blank"
                  rel="noreferrer"
                >
                  Aviso de Privacidade para profissionais de saúde
                </a>
              </div>

              <label className="consent" htmlFor="minas-privacidade">
                <input
                  id="minas-privacidade"
                  type="checkbox"
                  checked={form.cienciaAvisoPrivacidade}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      cienciaAvisoPrivacidade: event.target.checked,
                      aceiteTermos: event.target.checked,
                    }))
                  }
                  required
                />
                <span>
                  Confirmo que li e estou ciente do Aviso de Privacidade.{" "}
                  <span className="req">*</span>
                </span>
              </label>

              <label className="consent" htmlFor="minas-comunicacao">
                <input
                  id="minas-comunicacao"
                  type="checkbox"
                  checked={form.aceiteComunicacao}
                  onChange={(event) =>
                    update("aceiteComunicacao", event.target.checked)
                  }
                  required
                />
                <span>
                  Aceito receber comunicações da Opella por e-mail e WhatsApp.{" "}
                  <span className="req">*</span>
                </span>
              </label>

              {error && <div className="error-msg">{error}</div>}
              <div className="form-nav">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={previousStep}
                  disabled={loading}
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={loading}
                >
                  {loading ? "Gerando seus QR Codes..." : "Confirmar cadastro"}
                </button>
              </div>
            </>
          )}

          {step === 1 && error && <div className="error-msg">{error}</div>}
        </form>
      </main>
    </div>
  );
}
