import { useEffect, useMemo, useState } from "react";
import Logo from "../components/Logo.jsx";
import { staffListAfyaQuizResponses } from "../api.js";

const PRE_ANSWERS = [
  {
    A: "Reduz inicialmente a temperatura, sem maior manutenção do efeito, apenas em febre baixa.",
    B: "Tem eficácia semelhante aos demais, sendo escolhida sobretudo para febre moderada ou alta e dores leves.",
    C: "Oferece maior controle da febre, efeito mais duradouro e alta eficácia em todos os níveis de febre e dor.",
    D: "Seu diferencial é a dose de uma gota por quilo para febre alta e dores intensas.",
  },
  {
    A: "Maior sedação, favorecendo o repouso sem comprometer a atenção diurna.",
    B: "Maior penetração cerebral, ampliando o controle dos sintomas sem efeitos cognitivos.",
    C: "Controle dos sintomas com preservação da cognição e da atenção, devido à mínima penetração cerebral e ao perfil não sedativo.",
    D: "Maior efeito anticolinérgico, reduzindo a rinorreia com menos eventos adversos.",
  },
  {
    A: "Escolher qualquer espécie do mesmo gênero das cepas estudadas.",
    B: "Priorizar apenas a maior concentração de UFC, independentemente das cepas.",
    C: "Escolher cepas com eficácia demonstrada, como B. clausii O/C, SIN, N/R e T.",
    D: "Preferir formulações multicepas, pois mais cepas garantem superioridade clínica.",
  },
];

const COLUMNS = [
  { key: "nome", label: "Nome" },
  { key: "crm", label: "CRM" },
  { key: "email", label: "E-mail" },
  { key: "campus", label: "Campus" },
  { key: "lgpdConsent", label: "Aceite LGPD" },
  { key: "momento", label: "Questionário" },
  { key: "answer0", label: "Resposta 1", answerIndex: 0 },
  { key: "answer1", label: "Resposta 2", answerIndex: 1 },
  { key: "answer2", label: "Resposta 3", answerIndex: 2 },
  { key: "score", label: "Acertos" },
  { key: "notaClareza", label: "Clareza" },
  { key: "notaRelevancia", label: "Relevância" },
  { key: "notaDidatica", label: "Didática" },
  { key: "notaEvento", label: "Evento" },
  { key: "createdAt", label: "Enviado em" },
];

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("pt-BR");
}

function answerText(row, index) {
  const answer = row.respostas?.[index];
  return PRE_ANSWERS[index]?.[answer] || "";
}

function cellValue(row, column, congresso = false) {
  if (column.answerIndex !== undefined) {
    return answerText(row, column.answerIndex);
  }
  if (column.key === "momento") {
    const phase = row.momento === "pos" ? "pós" : "pré";
    return `${phase}-${congresso ? "simpósio" : "aula"}`;
  }
  if (column.key === "lgpdConsent") return row.lgpdConsent ? "Sim" : "Não";
  if (column.key === "score") {
    const correctAnswers = ["C", "C", "C"];
    const score = (row.respostas || []).filter(
      (answer, index) => answer === correctAnswers[index],
    ).length;
    return `${score}/3`;
  }
  if (column.key === "createdAt") return formatDate(row.createdAt);
  const value = row[column.key];
  return value === null || value === undefined ? "" : String(value);
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function columnsFor(congresso) {
  if (!congresso) return COLUMNS;

  return COLUMNS
    .filter((column) => column.key !== "notaClareza")
    .map((column) => ({
      ...column,
      label: {
        notaRelevancia: "Recomendação do conteúdo",
        notaDidatica: "Recomendação do palestrante",
        notaEvento: "Recomendação do evento",
      }[column.key] || column.label,
    }));
}

function buildCsv(rows, columns, congresso = false) {
  const header = columns.map((column) => csvEscape(column.label)).join(";");
  const lines = rows.map((row) =>
    columns.map((column) => csvEscape(cellValue(row, column, congresso))).join(";"),
  );
  return "\uFEFF" + [header, ...lines].join("\r\n");
}

function formatPercent(count, total) {
  if (!total) return "—";
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format((count / total) * 100)}%`;
}

function formatPercentagePoint(value) {
  const formatted = new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }).format(value);
  return `${value > 0 ? "+" : ""}${formatted} p.p.`;
}

function participantKey(row) {
  const crm = String(row.crm || "").replace(/[^a-z0-9]/gi, "").toLowerCase();
  if (crm) return `crm:${crm}`;
  const email = String(row.email || "").trim().toLowerCase();
  return email ? `email:${email}` : "";
}

function latestResponse(current, candidate) {
  if (!current) return candidate;
  return new Date(candidate.createdAt || 0) > new Date(current.createdAt || 0)
    ? candidate
    : current;
}

function matchedResponses(rows) {
  const byParticipant = new Map();
  rows.forEach((row) => {
    const key = participantKey(row);
    if (!key) return;
    const participant = byParticipant.get(key) || {};
    participant[row.momento] = latestResponse(participant[row.momento], row);
    byParticipant.set(key, participant);
  });
  return Array.from(byParticipant.values()).filter(({ pre, pos }) => pre && pos);
}

function correctAnswerCount(row) {
  return (row.respostas || []).filter((answer) => answer === "C").length;
}

export default function AfyaRegistrationsPage({ congresso = false }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [momentFilter, setMomentFilter] = useState("all");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await staffListAfyaQuizResponses(
        congresso ? "congresso-pediatria" : "afya",
      );
      setRows(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setError(
        requestError.status === 401
          ? "Token inválido. Verifique o VITE_STAFF_TOKEN no .env."
          : requestError.message || "Não foi possível carregar os cadastros Afya.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const searchFiltered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesQuery = !normalizedQuery ||
        [row.nome, row.crm, row.email, row.campus, row.momento]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery));
      return matchesQuery;
    });
  }, [query, rows]);

  const filtered = useMemo(
    () => searchFiltered.filter((row) => momentFilter === "all" || row.momento === momentFilter),
    [momentFilter, searchFiltered],
  );
  const analysisPreRows = searchFiltered.filter((row) => row.momento === "pre");
  const analysisPostRows = searchFiltered.filter((row) => row.momento === "pos");
  const analysisRows = momentFilter === "all"
    ? null
    : momentFilter === "pre"
      ? analysisPreRows
      : analysisPostRows;
  const paired = useMemo(() => matchedResponses(searchFiltered), [searchFiltered]);
  const changedPairs = paired.filter(({ pre, pos }) =>
    (pre.respostas || []).some((answer, index) => answer !== pos.respostas?.[index]),
  ).length;
  const improvedPairs = paired.filter(({ pre, pos }) =>
    correctAnswerCount(pos) > correctAnswerCount(pre),
  ).length;
  const unchangedPairs = paired.filter(({ pre, pos }) =>
    correctAnswerCount(pos) === correctAnswerCount(pre),
  ).length;
  const declinedPairs = paired.filter(({ pre, pos }) =>
    correctAnswerCount(pos) < correctAnswerCount(pre),
  ).length;

  function downloadCsv() {
    const blob = new Blob([buildCsv(filtered, columns, congresso)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${congresso ? "cadastros-congresso-pediatria" : "cadastros-afya"}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const preCount = rows.filter((row) => row.momento === "pre").length;
  const postCount = rows.filter((row) => row.momento === "pos").length;
  const columns = columnsFor(congresso);

  return (
    <div className="admin-page">
      <div className="admin-head container">
        <Logo variant="light" />
        <h1 className="admin-title">{congresso ? "Cadastros do Simpósio Super El Niño" : "Cadastros Afya"}</h1>
        <p className="admin-sub">
          {loading
            ? "Carregando..."
            : momentFilter === "all"
              ? `${rows.length} resposta(s) • ${preCount} pré • ${postCount} pós`
              : `${filtered.length} resposta(s) de ${momentFilter === "pre" ? "pré" : "pós"}-${congresso ? "simpósio" : "aula"} • ${rows.length} no total`}
        </p>

        <div className="admin-toolbar">
          <select
            className="admin-search admin-form-filter"
            aria-label="Filtrar por momento"
            value={momentFilter}
            onChange={(event) => setMomentFilter(event.target.value)}
          >
            <option value="all">Pré e pós (comparar)</option>
            <option value="pre">{congresso ? "Pré-simpósio" : "Pré-aula"}</option>
            <option value="pos">{congresso ? "Pós-simpósio" : "Pós-aula"}</option>
          </select>
          <input
            className="admin-search"
            type="search"
            placeholder="Buscar por nome, CRM, e-mail ou campus..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button className="btn btn--ghost admin-btn" onClick={load} disabled={loading}>
            Atualizar
          </button>
          <button
            className="btn btn--primary admin-btn"
            onClick={downloadCsv}
            disabled={loading || filtered.length === 0}
          >
            Baixar CSV
          </button>
        </div>
      </div>

      <div className="admin-body container">
        {error && <div className="error-msg">{error}</div>}
        {!error && !loading && searchFiltered.length > 0 && (
          <section className="afya-analysis" aria-labelledby="afya-analysis-title">
            <h2 className="afya-analysis__title" id="afya-analysis-title">Distribuição das respostas</h2>
            <p className="afya-analysis__description">
              Percentual sobre as respostas de cada fase. A busca aplicada também filtra esta análise.
            </p>
            {momentFilter === "all" && (
              <div className="afya-analysis__paired">
                {congresso ? (
                  <>
                    <strong>Comparação individual indisponível:</strong>{" "}
                    as respostas do simpósio são anônimas. A tabela compara a distribuição agregada entre pré e pós.
                  </>
                ) : (
                  <>
                    <strong>Comparação individual:</strong>{" "}
                    {paired.length
                      ? `${paired.length} pares identificados por CRM/e-mail; ${changedPairs} (${formatPercent(changedPairs, paired.length)}) mudaram ao menos uma alternativa. Acertos: ${improvedPairs} (${formatPercent(improvedPairs, paired.length)}) melhoraram, ${unchangedPairs} (${formatPercent(unchangedPairs, paired.length)}) mantiveram e ${declinedPairs} (${formatPercent(declinedPairs, paired.length)}) reduziram.`
                      : "nenhum participante foi identificado nas duas fases pelo CRM ou e-mail."}
                  </>
                )}
              </div>
            )}
            <div className="table-wrap">
              <table className="admin-table afya-analysis__table">
                <thead>
                  <tr>
                    <th>Questão</th>
                    <th>Alternativa</th>
                    {momentFilter === "all" ? (
                      <>
                        <th>Pré ({analysisPreRows.length})</th>
                        <th>Pós ({analysisPostRows.length})</th>
                        <th>Variação</th>
                      </>
                    ) : (
                      <th>{momentFilter === "pre" ? "Pré" : "Pós"} ({analysisRows.length})</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {PRE_ANSWERS.map((answers, questionIndex) => (
                    ["A", "B", "C", "D"].map((option) => {
                      const preCountForOption = analysisPreRows.filter(
                        (row) => row.respostas?.[questionIndex] === option,
                      ).length;
                      const postCountForOption = analysisPostRows.filter(
                        (row) => row.respostas?.[questionIndex] === option,
                      ).length;
                      const selectedCount = analysisRows?.filter(
                        (row) => row.respostas?.[questionIndex] === option,
                      ).length;
                      const variation = analysisPreRows.length && analysisPostRows.length
                        ? (postCountForOption / analysisPostRows.length - preCountForOption / analysisPreRows.length) * 100
                        : null;
                      return (
                        <tr key={`${questionIndex}-${option}`}>
                          <td>Pergunta {questionIndex + 1}</td>
                          <td className="afya-analysis__answer">
                            <strong>{option}{option === "C" ? " (correta)" : ""}.</strong> {answers[option]}
                          </td>
                          {momentFilter === "all" ? (
                            <>
                              <td>{preCountForOption} ({formatPercent(preCountForOption, analysisPreRows.length)})</td>
                              <td>{postCountForOption} ({formatPercent(postCountForOption, analysisPostRows.length)})</td>
                              <td>{variation === null ? "—" : formatPercentagePoint(variation)}</td>
                            </>
                          ) : (
                            <td>{selectedCount} ({formatPercent(selectedCount, analysisRows.length)})</td>
                          )}
                        </tr>
                      );
                    })
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
        {!error && !loading && filtered.length === 0 && (
          <p className="admin-empty">
            {momentFilter === "all"
              ? "Nenhum cadastro do Congresso de Pediatria encontrado."
              : `Nenhum cadastro de ${momentFilter === "pre" ? "pré" : "pós"}-${congresso ? "simpósio" : "aula"} encontrado.`}
          </p>
        )}
        {!error && filtered.length > 0 && (
          <div className="table-wrap">
            <table className="admin-table admin-table--afya">
              <thead>
                <tr>
                  {columns.map((column) => <th key={column.key}>{column.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id}>
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={column.answerIndex !== undefined ? "admin-answer" : ""}
                      >
                        {cellValue(row, column, congresso)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}