import { useState } from "react";
import Logo from "../components/Logo.jsx";
import { createAfyaQuizResponse } from "../api.js";

const QUESTIONS = [
  {
    key: "relevance",
    label: "O conteúdo apresentado foi relevante para sua prática clínica?",
  },
  {
    key: "didactics",
    label: "O que você achou da didática dos palestrantes?",
  },
  {
    key: "event",
    label: "Como você avalia o evento no geral?",
  },
];

function Rating({ label, value, onChange }) {
  return (
    <div className="quiz-rating">
      <p className="quiz-question__title">{label}</p>
      <div className="nps" role="group" aria-label={label}>
        {Array.from({ length: 11 }, (_, number) => number).map((number) => (
          <button
            type="button"
            key={number}
            className={`nps__item ${value === number ? "is-selected" : ""}`}
            aria-pressed={value === number}
            onClick={() => onChange(number)}
          >
            {number}
          </button>
        ))}
      </div>
      <div className="nps__legend">
        <span>0 — Nada provável</span>
        <span>10 — Extremamente provável</span>
      </div>
    </div>
  );
}

export default function CongressJantarPage() {
  const [ratings, setRatings] = useState({
    relevance: null,
    didactics: null,
    event: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function setRating(key, value) {
    setRatings((current) => ({ ...current, [key]: value }));
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (Object.values(ratings).some((value) => value === null)) {
      setError("Selecione uma nota de 0 a 10 em todas as avaliações.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await createAfyaQuizResponse({
        origem: "congresso-pediatria",
        momento: "pos",
        nome: "",
        crm: "",
        email: "",
        campus: "",
        lgpdConsent: false,
        respostas: ["C", "C", "C"],
        notaClareza: null,
        notaRelevancia: ratings.relevance,
        notaDidatica: ratings.didactics,
        notaEvento: ratings.event,
      });

      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (requestError) {
      setError(requestError.message || "Não foi possível enviar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page afya-page">
      <header className="hero afya-hero">
        <div className="container">
          <Logo variant="light" />
          <h1 className="hero__tagline">Congresso</h1>
          <p className="hero__sub">Avalie sua experiência no evento.</p>
        </div>
      </header>

      <main className="container">
        {submitted ? (
          <div className="card center-col quiz-success" role="status">
            <span className="quiz-success__mark">✓</span>
            <h2>Resposta enviada</h2>
            <p>Obrigado por participar do evento.</p>
          </div>
        ) : (
          <form className="card afya-quiz" onSubmit={handleSubmit} noValidate>
            <section className="quiz-evaluation" aria-label="Avaliação final do congresso">
              {QUESTIONS.map((question, index) => (
                <div key={question.key}>
                  <Rating
                    label={question.label}
                    value={ratings[question.key]}
                    onChange={(value) => setRating(question.key, value)}
                  />
                  {index < QUESTIONS.length - 1 && <hr style={{ margin: "1.5rem 0" }} />}
                </div>
              ))}
            </section>

            {error && <div className="error-msg">{error}</div>}
            <div className="form-nav quiz-nav">
              <button type="submit" className="btn btn--primary" disabled={loading}>
                {loading ? "Enviando..." : "Enviar respostas"}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
