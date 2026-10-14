import { useState } from "react";
import Logo from "../components/Logo.jsx";
import { createAfyaQuizResponse, createSymposiumQuestion } from "../api.js";

const PRE_QUESTIONS = [
  {
    question:
      "Em casos que exigem antitérmico, qual diferencial favorece a dipirona (Novalgina®) frente a outros antitérmicos?",
    options: [
      {
        id: "A",
        text: "Reduz inicialmente a temperatura, sem maior manutenção do efeito, apenas em febre baixa.",
      },
      {
        id: "B",
        text: "Tem eficácia semelhante aos demais, sendo escolhida sobretudo para febre moderada ou alta e dores leves.",
      },
      {
        id: "C",
        text: "Oferece maior controle da febre, efeito mais duradouro e alta eficácia em todos os níveis de febre e dor.",
      },
      {
        id: "D",
        text: "Seu diferencial é a dose de uma gota por quilo para febre alta e dores intensas.",
      },
    ],
  },
  {
    question:
      "Em crianças com rinite alérgica ou urticária, qual característica favorece a fexofenadina (Allegra®) frente aos anti-histamínicos de 1ª geração?",
    options: [
      {
        id: "A",
        text: "Maior sedação, favorecendo o repouso sem comprometer a atenção diurna.",
      },
      {
        id: "B",
        text: "Maior penetração cerebral, ampliando o controle dos sintomas sem efeitos cognitivos.",
      },
      {
        id: "C",
        text: "Controle dos sintomas com preservação da cognição e da atenção, devido à mínima penetração cerebral e ao perfil não sedativo.",
      },
      {
        id: "D",
        text: "Maior efeito anticolinérgico, reduzindo a rinorreia com menos eventos adversos.",
      },
    ],
  },
  {
    question:
      "Para prevenir diarreia associada a antibióticos, qual critério é mais consistente com as evidências?",
    options: [
      {
        id: "A",
        text: "Escolher qualquer espécie do mesmo gênero das cepas estudadas.",
      },
      {
        id: "B",
        text: "Priorizar apenas a maior concentração de UFC, independentemente das cepas.",
      },
      {
        id: "C",
        text: "Escolher cepas com eficácia demonstrada, como B. clausii O/C, SIN, N/R e T.",
      },
      {
        id: "D",
        text: "Preferir formulações multicepas, pois mais cepas garantem superioridade clínica.",
      },
    ],
  },
];

const POST_QUESTIONS = PRE_QUESTIONS;
const POST_RATINGS = [
  {
    key: "clarity",
    label: "4. Como você avalia a clareza e objetividade da apresentação?",
    minLabel: "Muito ruim",
    maxLabel: "Excelente",
  },
  {
    key: "relevance",
    label: "5. O conteúdo apresentado foi relevante para sua prática clínica?",
    minLabel: "Nada relevante",
    maxLabel: "Extremamente relevante",
  },
  {
    key: "didactics",
    label: "6. O que você achou da didática dos palestrantes?",
    minLabel: "Muito ruim",
    maxLabel: "Excelente",
  },
  {
    key: "event",
    label: "7. Como você avalia a OPELLA no geral do evento?",
    minLabel: "Muito ruim",
    maxLabel: "Excelente",
  },
];
const CONGRESS_POST_RATINGS = [
  {
    key: "contentRecommendation",
    label: "De 0 a 10, qual a probabilidade de você recomendar este conteúdo a um colega para a prática clínica?",
  },
  {
    key: "speakerRecommendation",
    label: "De 0 a 10, qual a probabilidade de você recomendar uma aula deste palestrante a um colega?",
  },
  {
    key: "eventRecommendation",
    label: "De 0 a 10, qual a probabilidade de você recomendar este evento a um colega?",
  },
].map((question) => ({
  ...question,
  minLabel: "Não recomendaria de forma alguma",
  maxLabel: "Recomendaria com certeza",
}));

function shuffleOptions(questions) {
  return questions.map(({ options }) => {
    const correctOption = options.find((option) => option.id === "C");
    const shuffled = options.filter((option) => option.id !== "C");
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[randomIndex]] = [
        shuffled[randomIndex],
        shuffled[index],
      ];
    }
    return correctOption
      ? [...shuffled.slice(0, 2), correctOption, shuffled[2]]
      : shuffled;
  });
}

function Rating({ label, minLabel, maxLabel, value, onChange }) {
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
        <span>0 — {minLabel}</span>
        <span>10 — {maxLabel}</span>
      </div>
    </div>
  );
}

export default function AfyaQuizPage({ momentoInicial = "" }) {
  const isDedicatedPage = Boolean(momentoInicial);
  const [momento, setMomento] = useState(momentoInicial);
  const [participant, setParticipant] = useState({
    nome: "",
    crm: "",
    email: "",
    campus: "",
  });
  const [lgpdConsent, setLgpdConsent] = useState(false);
  const [identificationComplete, setIdentificationComplete] = useState(isDedicatedPage);
  const [answers, setAnswers] = useState(["", "", ""]);
  const [shuffledOptions, setShuffledOptions] = useState(() =>
    momentoInicial
      ? shuffleOptions(momentoInicial === "pre" ? PRE_QUESTIONS : POST_QUESTIONS)
      : [],
  );
  const [clarity, setClarity] = useState(null);
  const [relevance, setRelevance] = useState(null);
  const [didactics, setDidactics] = useState(null);
  const [eventRating, setEventRating] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [questionEmail, setQuestionEmail] = useState("");
  const [question, setQuestion] = useState("");
  const [questionComplete, setQuestionComplete] = useState(false);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [questionError, setQuestionError] = useState("");
  const questions = momento === "pre" ? PRE_QUESTIONS : POST_QUESTIONS;

  function selectMoment(value) {
    setMomento(value);
    setParticipant({ nome: "", crm: "", email: "", campus: "" });
    setLgpdConsent(false);
    setIdentificationComplete(false);
    setAnswers(["", "", ""]);
    setShuffledOptions(
      shuffleOptions(value === "pre" ? PRE_QUESTIONS : POST_QUESTIONS),
    );
    setClarity(null);
    setRelevance(null);
    setDidactics(null);
    setEventRating(null);
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
    if (!lgpdConsent) {
      setError("Você precisa autorizar o recebimento de comunicações para continuar.");
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
    const ratingsByStep = isDedicatedPage
      ? [relevance, didactics, eventRating]
      : [clarity, relevance, didactics, eventRating];
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
    const requiredRatings = isDedicatedPage
      ? [relevance, didactics, eventRating]
      : [clarity, relevance, didactics, eventRating];
    if (momento === "pos" && requiredRatings.some((rating) => rating === null)) {
      setError("Selecione uma nota de 0 a 10 em todas as avaliações.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await createAfyaQuizResponse({
        origem: isDedicatedPage ? "congresso-pediatria" : "afya",
        momento,
        nome: isDedicatedPage ? "" : participant.nome.trim(),
        crm: isDedicatedPage ? "" : participant.crm.trim(),
        email: isDedicatedPage ? "" : participant.email.trim(),
        campus: isDedicatedPage ? "" : participant.campus.trim(),
        lgpdConsent: isDedicatedPage ? false : lgpdConsent,
        respostas: answers,
        notaClareza: momento === "pos" && !isDedicatedPage ? clarity : null,
        notaRelevancia: momento === "pos" ? relevance : null,
        notaDidatica: momento === "pos" ? didactics : null,
        notaEvento: momento === "pos" ? eventRating : null,
      });
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (requestError) {
      setError(requestError.message || "Não foi possível enviar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleQuestionSubmit(event) {
    event.preventDefault();
    const email = questionEmail.trim();
    const text = question.trim();

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setQuestionError("Informe um e-mail válido.");
      return;
    }
    if (!email && !text) {
      setQuestionComplete(true);
      return;
    }

    setQuestionLoading(true);
    setQuestionError("");
    try {
      await createSymposiumQuestion({ email, question: text });
      setQuestionComplete(true);
    } catch (requestError) {
      setQuestionError(requestError.message || "Não foi possível enviar. Tente novamente.");
    } finally {
      setQuestionLoading(false);
    }
  }

  function skipQuestion() {
    setQuestionError("");
    setQuestionComplete(true);
  }

  const postRatings = isDedicatedPage ? CONGRESS_POST_RATINGS : POST_RATINGS;
  const ratingValues = isDedicatedPage
    ? [relevance, didactics, eventRating]
    : [clarity, relevance, didactics, eventRating];
  const ratingSetters = isDedicatedPage
    ? [setRelevance, setDidactics, setEventRating]
    : [setClarity, setRelevance, setDidactics, setEventRating];
  const activeRatingIndex = currentStep - questions.length;
  const activeRating = postRatings[activeRatingIndex];
  const totalSteps = momento === "pos" ? questions.length + postRatings.length : questions.length;
  const isLastStep = currentStep === totalSteps - 1;
  const progress = momento ? ((currentStep + 1) / totalSteps) * 100 : 0;
  const currentQuestion = questions[currentStep];

  return (
    <div className="page afya-page">
      <header className="hero afya-hero">
        <div className="container">
          <Logo variant="light" />
          {!isDedicatedPage && <p className="afya-kicker">AFYA</p>}
          <h1 className="hero__tagline">
            {isDedicatedPage
              ? "Super El Niño: Você está preparando para os impactos na saúde infantil?"
              : "Quiz Pré e Pós-Aula"}
          </h1>
          <p className="hero__sub">
            {isDedicatedPage
              ? `Questionário ${momento === "pre" ? "pré" : "pós"}-simpósio.`
              : "Selecione o momento e registre suas respostas."}
          </p>
        </div>
      </header>

      <main className="container">
        {submitted ? (
          <div className="card center-col quiz-success" role="status">
            <span className="quiz-success__mark">✓</span>
            <h2>Resposta enviada</h2>
            <p>Obrigado por participar do {isDedicatedPage ? "simpósio" : "aula"}.</p>
            {isDedicatedPage && momento === "pos" && (
              questionComplete ? (
                <div className="center-col" style={{ gap: "1rem", marginTop: "1.5rem" }}>
                  <p>Sua participação foi registrada.</p>
                  <a
                    className="btn btn--primary"
                    href="https://we.tl/t-pxHpHTjYqyJGihQe"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Baixar apresentação
                  </a>
                </div>
              ) : (
                <form className="afya-quiz" onSubmit={handleQuestionSubmit} noValidate style={{ width: "100%", marginTop: "1.5rem" }}>
                  <h3 className="quiz-section-title">Tem alguma pergunta?</h3>
                  <p className="quiz-identification__intro">Os dois campos são opcionais. Depois, você poderá baixar a apresentação.</p>
                  <div className="field">
                    <label htmlFor="symposium-question-email">E-mail (opcional)</label>
                    <input
                      id="symposium-question-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={questionEmail}
                      onChange={(event) => setQuestionEmail(event.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="symposium-question">Sua pergunta (opcional)</label>
                    <textarea
                      id="symposium-question"
                      rows="4"
                      maxLength={3000}
                      value={question}
                      onChange={(event) => setQuestion(event.target.value)}
                    />
                  </div>
                  {questionError && <div className="error-msg">{questionError}</div>}
                  <div className="form-nav quiz-nav">
                    <button type="submit" className="btn btn--primary" disabled={questionLoading}>
                      {questionLoading ? "Enviando..." : "Enviar e continuar"}
                    </button>
                    <button type="button" className="btn btn--ghost" onClick={skipQuestion} disabled={questionLoading}>
                      Pular
                    </button>
                  </div>
                </form>
              )
            )}
          </div>
        ) : (
          <form className="card afya-quiz" onSubmit={handleFormSubmit} noValidate>
            {!isDedicatedPage && <section aria-labelledby="moment-title">
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
                  Pré-aula
                </button>
                <button
                  type="button"
                  className={`quiz-moment__button ${momento === "pos" ? "is-selected" : ""}`}
                  aria-pressed={momento === "pos"}
                  onClick={() => selectMoment("pos")}
                >
                  Pós-aula
                </button>
              </div>
            </section>}

            {momento && !identificationComplete && (
              <section className="quiz-identification" aria-labelledby="identification-title">
                <h2 id="identification-title" className="quiz-section-title">
                  Identificação
                </h2>
                <p className="quiz-identification__intro">
                  Preencha seus dados para acessar o questionário {momento === "pre" ? "pré" : "pós"}-{isDedicatedPage ? "simpósio" : "aula"}.
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

                <label className="consent" htmlFor="afya-lgpd-consent">
                  <input
                    id="afya-lgpd-consent"
                    type="checkbox"
                    checked={lgpdConsent}
                    onChange={(event) => setLgpdConsent(event.target.checked)}
                    required
                  />
                  <span>
                    Autorizo expressamente receber comunicações de marketing da
                    Opella Healthcare Brasil por e-mail, SMS e Whatsapp e estou
                    ciente que poderei revogar essa autorização a qualquer momento
                    selecionando &quot;unsubscribe&quot; nas referidas
                    comunicações. Para mais detalhes sobre como Opella Healthcare
                    Brasil trata seus dados pessoais, você pode acessar o{" "}
                    <a
                      href="https://www.opella.com/en/privacy-center"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Aviso de Privacidade Opella para profissionais de saúde
                    </a>
                    . <span className="req">*</span>
                  </span>
                </label>

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
                    <span>Questionário {momento === "pre" ? "pré" : "pós"}-{isDedicatedPage ? "simpósio" : "aula"}</span>
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
                  <section
                    className="quiz-evaluation"
                    aria-label={`Avaliação do ${isDedicatedPage ? "simpósio" : "aula"}`}
                  >
                    {activeRating && (
                      <Rating
                        label={activeRating.label}
                        minLabel={activeRating.minLabel}
                        maxLabel={activeRating.maxLabel}
                        value={ratingValues[activeRatingIndex]}
                        onChange={ratingSetters[activeRatingIndex]}
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