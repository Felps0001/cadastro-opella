import { useEffect, useState } from "react";
import Logo from "../components/Logo.jsx";

const STORAGE_KEY = "congresso-perguntas";

export default function QuestionReadPage() {
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const ordered = [...saved].sort(
      (left, right) => new Date(right.createdAt) - new Date(left.createdAt),
    );
    setQuestions(ordered);
  }, []);

  return (
    <div className="page afya-page">
      <header className="hero afya-hero">
        <div className="container">
          <Logo variant="light" />
          <h1 className="hero__tagline">Perguntas recebidas</h1>
          <p className="hero__sub">Veja as dúvidas enviadas pelos participantes.</p>
        </div>
      </header>

      <main className="container">
        <section className="card afya-quiz">
          {questions.length === 0 ? (
            <div className="admin-empty">Ainda não há perguntas enviadas.</div>
          ) : (
            <div style={{ display: "grid", gap: "1rem" }}>
              {questions.map((item) => (
                <article
                  key={item.id}
                  style={{
                    border: "1px solid rgba(0,0,0,0.08)",
                    borderRadius: 12,
                    padding: "1rem 1.25rem",
                    background: "#fff",
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 700, marginBottom: 8 }}>
                    {item.nome}
                  </p>
                  <p style={{ margin: 0, lineHeight: 1.6 }}>{item.pergunta}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
