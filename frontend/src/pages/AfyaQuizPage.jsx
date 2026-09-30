import { useState } from "react";
import Logo from "../components/Logo.jsx";
import { createAfyaQuizResponse } from "../api.js";

const PRE_QUESTIONS = [
  {
    question:
      "Durante os primeiros anos após a menopausa, a perda óssea acelerada ocorre principalmente em decorrência de qual mecanismo fisiopatológico?",
    options: [
      {
        id: "A",
        text: "Aumento da produção de osteoprotegerina (OPG), reduzindo a atividade osteoclástica.",
      },
      {
        id: "B",
        text: "Redução do estradiol, com aumento da atividade de RANKL e da reabsorção óssea.",
      },
      {
        id: "C",
        text: "Diminuição da atividade osteoclástica por ação compensatória do PTH.",
      },
      {
        id: "D",
        text: "Aumento da absorção intestinal de cálcio independente da vitamina D.",
      },
    ],
  },
  {
    question:
      "Uma mulher de 48 anos, sem queixas gastrointestinais e sem uso de inibidores da bomba de prótons, necessita suplementação de cálcio para complementar sua ingestão alimentar. Qual característica torna o carbonato de cálcio uma opção adequada para essa paciente?",
    options: [
      {
        id: "A",
        text: "Pode ser utilizado preferencialmente em jejum por não depender da acidez gástrica.",
      },
      {
        id: "B",
        text: "Apresenta menor teor de cálcio elementar que o citrato de cálcio.",
      },
      {
        id: "C",
        text: "Possui elevado teor de cálcio elementar (40%) e boa eficácia quando administrado junto às refeições.",
      },
      {
        id: "D",
        text: "É o sal de escolha para pacientes bariátricas e usuárias crônicas de IBPs.",
      },
    ],
  },
  {
    question:
      "Considerando os dados de consumo de cálcio da população brasileira, qual afirmação é a mais adequada para a prática ginecológica?",
    options: [
      {
        id: "A",
        text: "A maioria das mulheres brasileiras atinge a recomendação diária de cálcio apenas pela alimentação.",
      },
      {
        id: "B",
        text: "O consumo médio de cálcio no Brasil é suficiente para prevenir a perda óssea associada ao envelhecimento.",
      },
      {
        id: "C",
        text: "Como a calcemia geralmente permanece normal, não há necessidade de avaliar a ingestão alimentar de cálcio.",
      },
      {
        id: "D",
        text: "A ingestão média de cálcio no Brasil é inferior às recomendações, tornando fundamental investigar a dieta, pois o organismo pode mobilizar cálcio do esqueleto para manter a calcemia.",
      },
    ],
  },
];

const POST_QUESTIONS = PRE_QUESTIONS;

function shuffleOptions(questions) {
  return questions.map(({ options }) => {
    const shuffled = [...options];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[randomIndex]] = [
        shuffled[randomIndex],
        shuffled[index],
      ];
    }
    return shuffled;
  });
}

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

export default function AfyaQuizPage() {
  const [momento, setMomento] = useState("");
  const [participant, setParticipant] = useState({
    nome: "",
    crm: "",
    email: "",
    campus: "",
  });
  const [identificationComplete, setIdentificationComplete] = useState(false);
  const [answers, setAnswers] = useState(["", "", ""]);
  const [shuffledOptions, setShuffledOptions] = useState([]);
  const [clarity, setClarity] = useState(null);
  const [relevance, setRelevance] = useState(null);
  const [didactics, setDidactics] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const questions = momento === "pre" ? PRE_QUESTIONS : POST_QUESTIONS;

  function selectMoment(value) {
    setMomento(value);
    setParticipant({ nome: "", crm: "", email: "", campus: "" });
    setIdentificationComplete(false);
    setAnswers(["", "", ""]);
    setShuffledOptions(
      shuffleOptions(value === "pre" ? PRE_QUESTIONS : POST_QUESTIONS),
    );
    setClarity(null);
    setRelevance(null);
    setDidactics(null);
    setCurrentStep(0);
    setError("");
  }

  function updateParticipant(field, value) {
    setParticipant((current) => ({ ...current, [field]: value }));
  }

  function continueToQuiz() {
    if (Object.values(participant).some((value) => !value.trim())) {
      setError("Preencha todos os campos para acessar o quiz.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(participant.email)) {
      setError("Informe um e-mail válido.");
      return;
    }
    setError("");
    setIdentificationComplete(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleFormSubmit(event) {
    if (identificationComplete) {
      handleSubmit(event);
      return;
    }
    event.preventDefault();
    continueToQuiz();
  }

  function selectAnswer(questionIndex, answerId) {
    setAnswers((current) =>
      current.map((answer, index) =>
        index === questionIndex ? answerId : answer,
      ),
    );
  }

  function goToStep(step) {
    setCurrentStep(step);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function nextStep(event) {
    event.preventDefault();
    if (currentStep < questions.length && !answers[currentStep]) {
      setError("Selecione uma alternativa para continuar.");
      return;
    }
    const ratingsByStep = [clarity, relevance, didactics];
    if (
      currentStep >= questions.length &&
      ratingsByStep[currentStep - questions.length] === null
    ) {
      setError("Selecione uma nota de 0 a 10 para continuar.");
      return;
    }
    goToStep(currentStep + 1);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (answers.some((answer) => !answer)) {
      setError("Responda as três perguntas do quiz.");
      return;
    }
    if (
      momento === "pos" &&
      [clarity, relevance, didactics].some((rating) => rating === null)
    ) {
      setError("Selecione uma nota de 0 a 10 em todas as avaliações.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await createAfyaQuizResponse({
        momento,
        nome: participant.nome.trim(),
        crm: participant.crm.trim(),
        email: participant.email.trim(),
        campus: participant.campus.trim(),
        respostas: answers,
        notaClareza: momento === "pos" ? clarity : null,
        notaRelevancia: momento === "pos" ? relevance : null,
        notaDidatica: momento === "pos" ? didactics : null,
      });
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (requestError) {
      setError(requestError.message || "Não foi possível enviar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const totalSteps = momento === "pos" ? 6 : 3;
  const isLastStep = currentStep === totalSteps - 1;
  const progress = momento ? ((currentStep + 1) / totalSteps) * 100 : 0;
  const currentQuestion = questions[currentStep];

  return (
    <div className="page afya-page">
      <header className="hero afya-hero">
        <div className="container">
          <Logo variant="light" />
          <p className="afya-kicker">AFYA SUMMIT</p>
          <h1 className="hero__tagline">Quiz Pré e Pós-Simpósio</h1>
          <p className="hero__sub">Selecione o momento e registre suas respostas.</p>
        </div>
      </header>

      <main className="container">
        {submitted ? (
          <div className="card center-col quiz-success" role="status">
            <span className="quiz-success__mark">✓</span>
            <h2>Resposta enviada</h2>
            <p>Obrigado por participar do simpósio.</p>
          </div>
        ) : (
          <form className="card afya-quiz" onSubmit={handleFormSubmit} noValidate>
            <section aria-labelledby="moment-title">
              <h2 id="moment-title" className="quiz-section-title">
                Qual questionário deseja responder?
              </h2>
              <div className="quiz-moment">
                <button
                  type="button"
                  className={`quiz-moment__button ${momento === "pre" ? "is-selected" : ""}`}
                  aria-pressed={momento === "pre"}
                  onClick={() => selectMoment("pre")}
                >
                  Pré-simpósio
                </button>
                <button
                  type="button"
                  className={`quiz-moment__button ${momento === "pos" ? "is-selected" : ""}`}
                  aria-pressed={momento === "pos"}
                  onClick={() => selectMoment("pos")}
                >
                  Pós-simpósio
                </button>
              </div>
            </section>

            {momento && !identificationComplete && (
              <section className="quiz-identification" aria-labelledby="identification-title">
                <h2 id="identification-title" className="quiz-section-title">
                  Identificação
                </h2>
                <p className="quiz-identification__intro">
                  Preencha seus dados para acessar o questionário {momento === "pre" ? "pré" : "pós"}-simpósio.
                </p>

                <div className="field">
                  <label htmlFor="afya-nome">Nome completo <span className="req">*</span></label>
                  <input
                    id="afya-nome"
                    type="text"
                    autoComplete="name"
                    value={participant.nome}
                    onChange={(event) => updateParticipant("nome", event.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="afya-crm">CRM <span className="req">*</span></label>
                  <input
                    id="afya-crm"
                    type="text"
                    value={participant.crm}
                    onChange={(event) => updateParticipant("crm", event.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="afya-email">E-mail <span className="req">*</span></label>
                  <input
                    id="afya-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={participant.email}
                    onChange={(event) => updateParticipant("email", event.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="afya-campus">Campus <span className="req">*</span></label>
                  <input
                    id="afya-campus"
                    type="text"
                    value={participant.campus}
                    onChange={(event) => updateParticipant("campus", event.target.value)}
                    required
                  />
                </div>

                {error && <div className="error-msg">{error}</div>}
                <button type="submit" className="btn btn--primary">
                  Acessar quiz
                </button>
              </section>
            )}

            {momento && identificationComplete && (
              <>
                <div className="quiz-progress" aria-label={`Etapa ${currentStep + 1} de ${totalSteps}`}>
                  <div className="quiz-progress__meta">
                    <span>Questionário {momento === "pre" ? "pré" : "pós"}-simpósio</span>
                    <span>{currentStep + 1} de {totalSteps}</span>
                  </div>
                  <div className="quiz-progress__track">
                    <div
                      className="quiz-progress__fill"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {currentStep < questions.length && (
                  <fieldset className="quiz-question" key={currentQuestion.question}>
                    <legend className="quiz-question__title">
                      <span>{currentStep + 1}</span>
                      {currentQuestion.question}
                    </legend>
                    <div className="quiz-options">
                      {shuffledOptions[currentStep].map((option, optionIndex) => (
                        <button
                          type="button"
                          key={option.id}
                          className={`quiz-option ${answers[currentStep] === option.id ? "is-selected" : ""}`}
                          aria-pressed={answers[currentStep] === option.id}
                          onClick={() => selectAnswer(currentStep, option.id)}
                        >
                          <span className="quiz-option__letter">
                            {String.fromCharCode(65 + optionIndex)}
                          </span>
                          <span>{option.text}</span>
                        </button>
                      ))}
                    </div>
                  </fieldset>
                )}

                {momento === "pos" && currentStep >= questions.length && (
                  <section className="quiz-evaluation" aria-label="Avaliação do simpósio">
                    {currentStep === 3 && (
                    <Rating
                      label="4. Como você avalia a clareza e objetividade da apresentação?"
                      value={clarity}
                      onChange={setClarity}
                    />
                    )}
                    {currentStep === 4 && (
                    <Rating
                      label="5. O conteúdo apresentado foi relevante para sua prática clínica?"
                      value={relevance}
                      onChange={setRelevance}
                    />
                    )}
                    {currentStep === 5 && (
                    <Rating
                      label="6. Como você avalia a aula no geral?"
                      value={didactics}
                      onChange={setDidactics}
                    />
                    )}
                  </section>
                )}

                {error && <div className="error-msg">{error}</div>}
                <div className="form-nav quiz-nav">
                  {currentStep > 0 && (
                    <button
                      type="button"
                      className="btn btn--ghost"
                      disabled={loading}
                      onClick={() => goToStep(currentStep - 1)}
                    >
                      Voltar
                    </button>
                  )}
                  {isLastStep ? (
                    <button type="submit" className="btn btn--primary" disabled={loading}>
                      {loading ? "Enviando..." : "Enviar respostas"}
                    </button>
                  ) : (
                    <button type="button" className="btn btn--primary" onClick={nextStep}>
                      Avançar
                    </button>
                  )}
                </div>
              </>
            )}
          </form>
        )}
      </main>
    </div>
  );
}