import { useState } from "react";
import Logo from "../components/Logo.jsx";

const STORAGE_KEY = "congresso-perguntas";

export default function QuestionSubmitPage() {
  const [nome, setNome] = useState("");
  const [pergunta, setPergunta] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    const texto = pergunta.trim();
    if (!texto) {
      setError("Escreva sua pergunta antes de enviar.");
      return;
    }

    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const next = [
      ...existing,
      {
        id: Date.now(),
        nome: nome.trim() || "Anônimo",
        pergunta: texto,
        createdAt: new Date().toISOString(),
      },
    ];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setNome("");
    setPergunta("");
    setSubmitted(true);
    setError("");
  }

  return (
    <div className="page afya-page">
      <header className="hero afya-hero">
        <div className="container">
          <Logo variant="light" />
          <h1 className="hero__tagline">Perguntas do evento</h1>
          <p className="hero__sub">Envie sua dúvida para o painel do congresso.</p>
        </div>
      </header>

      <main className="container">
        <form className="card afya-quiz" onSubmit={handleSubmit} noValidate>
          {submitted ? (
            <div className="quiz-success" role="status" style={{ textAlign: "center" }}>
              <span className="quiz-success__mark">✓</span>
              <h2>Pergunta enviada</h2>
              <p>Obrigado! Sua dúvida foi registrada e pode ser vista na página de perguntas.</p>
            </div>
          ) : (
            <>
              <div className="field">
                <label htmlFor="nome">Nome (opcional)</label>
                <input
                  id="nome"
                  type="text"
                  value={nome}
                  onChange={(event) => setNome(event.target.value)}
                  placeholder="Seu nome ou instituição"
                />
              </div>

              <div className="field">
                <label htmlFor="pergunta">Sua pergunta <span className="req">*</span></label>
                <textarea
                  id="pergunta"
                  rows="6"
                  value={pergunta}
                  onChange={(event) => setPergunta(event.target.value)}
                  placeholder="Escreva sua pergunta para a mesa ou palestrantes..."
                  required
                />
              </div>

              {error && <div className="error-msg">{error}</div>}

              <div className="form-nav quiz-nav">
                <button type="submit" className="btn btn--primary">
                  Enviar pergunta
                </button>
              </div>
            </>
          )}
        </form>
      </main>
    </div>
  );
}
