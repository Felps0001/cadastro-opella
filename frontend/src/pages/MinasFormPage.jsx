import { useEffect, useRef, useState } from "react";
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

const initialForm = {
  nome: "",
  crm: "",
  estudante: false,
  especialidade: "",
  segundaEspecialidade: "Não se aplica",
  email: "",
  whatsapp: "",
  signatureDataUrl: "",
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

function SignaturePad({ onChange }) {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef(null);
  const hasDrawingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const resizeCanvas = () => {
      const context = canvas.getContext("2d");
      const ratio = window.devicePixelRatio || 1;
      const width = canvas.clientWidth || 420;
      const height = 180;

      canvas.width = Math.max(240, Math.round(width * ratio));
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.lineCap = "round";
      context.lineJoin = "round";
      context.lineWidth = 2.5;
      context.strokeStyle = "#10261a";
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  function getPoint(event) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function beginDrawing(event) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    event.preventDefault();
    const point = getPoint(event);
    const context = canvas.getContext("2d");

    isDrawingRef.current = true;
    hasDrawingRef.current = true;
    lastPointRef.current = point;

    context.beginPath();
    context.moveTo(point.x, point.y);
    context.lineTo(point.x, point.y);
    context.stroke();
  }

  function draw(event) {
    if (!isDrawingRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const point = getPoint(event);

    context.beginPath();
    context.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    context.lineTo(point.x, point.y);
    context.stroke();

    lastPointRef.current = point;
  }

  function finishDrawing() {
    if (!isDrawingRef.current) return;

    isDrawingRef.current = false;
    lastPointRef.current = null;
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (hasDrawingRef.current) {
      onChange(canvas.toDataURL("image/png"));
      return;
    }

    onChange("");
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    const width = canvas.clientWidth || 420;
    const height = 180;

    context.clearRect(0, 0, width, height);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    hasDrawingRef.current = false;
    onChange("");
  }

  return (
    <div className="signature-wrap">
      <canvas
        className="signature-pad"
        ref={canvasRef}
        onPointerDown={beginDrawing}
        onPointerMove={draw}
        onPointerUp={finishDrawing}
        onPointerLeave={finishDrawing}
        onPointerCancel={finishDrawing}
      />
      <button type="button" className="btn btn--ghost signature-clear" onClick={clearSignature}>
        Limpar assinatura
      </button>
    </div>
  );
}

export default function MinasFormPage() {
  const navigate = useNavigate();
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
    }));
  }

  function validate() {
    if (!form.nome.trim()) return "Informe seu nome completo.";
    if (!form.estudante && !form.crm.trim()) return "Informe seu CRM.";
    if (!form.especialidade) return "Selecione sua especialidade.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      return "Informe um e-mail profissional válido.";
    }
    if (form.whatsapp.replace(/\D/g, "").length < 10) {
      return "Informe um WhatsApp válido com DDD.";
    }
    if (!form.signatureDataUrl || !form.signatureDataUrl.startsWith("data:image/png;base64,")) {
      return "Assine abaixo antes de receber o QR Code.";
    }
    if (!form.aceiteComunicacao) {
      return "Autorize o recebimento de comunicações para continuar.";
    }
    if (!form.aceiteTermos) {
      return "Aceite os Termos e Condições e o Aviso de Privacidade.";
    }
    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await createMinasRegistration(form);
      navigate(`/form-minas/sucesso/${data.id}`);
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
          <p className="hero__sub">Leva menos de 1 minuto.</p>
        </div>
      </header>

      <main className="container">
        <form className="card minas-form" onSubmit={handleSubmit} noValidate>
          <h2 className="minas-form__title">Preencha seus dados</h2>

          <div className="field">
            <label htmlFor="minas-nome">Nome completo <span className="req">*</span></label>
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
            <label htmlFor="minas-crm">CRM <span className="req">*</span></label>
            <input
              id="minas-crm"
              type="text"
              placeholder="SP0123456"
              value={form.crm}
              disabled={form.estudante}
              onChange={(event) => update("crm", event.target.value)}
              required={!form.estudante}
            />
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
            <label htmlFor="minas-especialidade">Especialidade <span className="req">*</span></label>
            <select
              id="minas-especialidade"
              value={form.especialidade}
              onChange={(event) => update("especialidade", event.target.value)}
              required
            >
              <option value="">Selecione uma opção</option>
              <option value="Pediatria">Pediatria</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="minas-segunda-especialidade">Segunda especialidade (opcional)</label>
            <select
              id="minas-segunda-especialidade"
              value={form.segundaEspecialidade}
              onChange={(event) => update("segundaEspecialidade", event.target.value)}
            >
              {SECONDARY_SPECIALTIES.map((specialty) => (
                <option key={specialty} value={specialty}>{specialty}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="minas-email">E-mail profissional <span className="req">*</span></label>
            <input
              id="minas-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) => update("email", event.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="minas-whatsapp">WhatsApp <span className="req">*</span></label>
            <input
              id="minas-whatsapp"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="(11) 91234-5678"
              value={form.whatsapp}
              onChange={(event) => update("whatsapp", maskPhone(event.target.value))}
              required
            />
          </div>

          <div className="field signature-field">
            <label htmlFor="minas-assinatura">Assinatura <span className="req">*</span></label>
            <SignaturePad onChange={(dataUrl) => update("signatureDataUrl", dataUrl)} />
            <p className="signature-hint">Desenhe sua assinatura abaixo para liberar o QR Code.</p>
          </div>

          <label className="consent" htmlFor="minas-comunicacao">
            <input
              id="minas-comunicacao"
              type="checkbox"
              checked={form.aceiteComunicacao}
              onChange={(event) => update("aceiteComunicacao", event.target.checked)}
              required
            />
            <span>
              Aceito receber comunicações da Opella por e-mail e WhatsApp. <span className="req">*</span>
            </span>
          </label>

          <label className="consent" htmlFor="minas-termos">
            <input
              id="minas-termos"
              type="checkbox"
              checked={form.aceiteTermos}
              onChange={(event) => update("aceiteTermos", event.target.checked)}
              required
            />
            <span>
              Ao registrar-me, confirmo que li, compreendi e aceitei os{" "}
              <a
                href="https://plus.opella.com/pt-br/s/terms-and-conditions?language=pt_BR"
                target="_blank"
                rel="noreferrer"
              >
                Termos e Condições
              </a>{" "}
              da Opella e que li o respectivo{" "}
              <a
                href="https://plus.opella.com/pt-br/s/privacy-policy?language=pt_BR"
                target="_blank"
                rel="noreferrer"
              >
                Aviso de Privacidade
              </a>
              . <span className="req">*</span>
            </span>
          </label>

          {error && <div className="error-msg">{error}</div>}
          <button type="submit" className="btn btn--primary" disabled={loading}>
            {loading ? "Gerando seus QR Codes..." : "Confirmar cadastro"}
          </button>
        </form>
      </main>
    </div>
  );
}