import { useEffect, useMemo, useState } from "react";
import Logo from "../components/Logo.jsx";
import { staffListAfyaQuizResponses } from "../api.js";

const ANSWERS = [
  {
    A: "Atua promovendo redução inicial da temperatura, sem diferenças na manutenção do efeito, apenas para febre baixa ao longo do tempo.",
    B: "Apresenta eficácia semelhante aos demais antitérmicos, sendo escolhida principalmente para casos de febre moderada e febre alta e em casos de dores leves.",
    C: "Proporciona maior controle da febre, manutenção da temperatura normalizada por mais tempo e elevada eficácia, sendo recomendada para todos os níveis de febre e dor.",
    D: "Seu principal diferencial é a posologia de uma gota por quilo para potencializar o controle da febre alta e dores intensas.",
  },
  {
    A: "Promove sedação para melhorar o descanso e o controle dos sintomas.",
    B: "Apresenta maior penetração no sistema nervoso central, aumentando a eficácia clínica.",
    C: "Controla os sintomas alérgicos preservando cognição, atenção e desempenho diário por ser verdadeiramente não sedativa e ter mínima penetração cerebral.",
    D: "Possui efeito anticolinérgico mais intenso, contribuindo para o controle da rinorreia.",
  },
  {
    A: "Qualquer probiótico pode ser utilizado, pois os efeitos são semelhantes entre as diferentes cepas.",
    B: "O resultado clínico depende exclusivamente da concentração de UFC.",
    C: "As evidências de eficácia são específicas para determinadas cepas, como B. clausii O/C, SIN, N/R e T, presentes em Enterogermina®.",
    D: "Combinações com maior número de cepas são sempre superiores às formulações com menos cepas.",
  },
];

const COLUMNS = [
  { key: "nome", label: "Nome" },
  { key: "crm", label: "CRM" },
  { key: "email", label: "E-mail" },
  { key: "campus", label: "Campus" },
  { key: "momento", label: "Questionário" },
  { key: "answer0", label: "Resposta 1", answerIndex: 0 },
  { key: "answer1", label: "Resposta 2", answerIndex: 1 },
  { key: "answer2", label: "Resposta 3", answerIndex: 2 },
  { key: "score", label: "Acertos" },
  { key: "notaClareza", label: "Clareza" },
  { key: "notaRelevancia", label: "Relevância" },
  { key: "notaDidatica", label: "Didática" },
  { key: "notaEvento", label: "Evento geral" },
  { key: "createdAt", label: "Enviado em" },
];

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("pt-BR");
}

function answerText(row, index) {
  const answer = row.respostas?.[index];
  return ANSWERS[index]?.[answer] || "";
}

function cellValue(row, column) {
  if (column.answerIndex !== undefined) {
    return answerText(row, column.answerIndex);
  }
  if (column.key === "momento") {
    return row.momento === "pos" ? "Pós-simpósio" : "Pré-simpósio";
  }
  if (column.key === "score") {
    const score = (row.respostas || []).filter((answer) => answer === "C").length;
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

function buildCsv(rows) {
  const header = COLUMNS.map((column) => csvEscape(column.label)).join(";");
  const lines = rows.map((row) =>
    COLUMNS.map((column) => csvEscape(cellValue(row, column))).join(";"),
  );
  return "\uFEFF" + [header, ...lines].join("\r\n");
}

export default function AfyaRegistrationsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await staffListAfyaQuizResponses();
      setRows(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setError(
        requestError.status === 401
          ? "Token inválido. Verifique o VITE_STAFF_TOKEN no .env."
          : requestError.message || "Não foi possível carregar os cadastros Afya Summit.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return rows;
    return rows.filter((row) =>
      [row.nome, row.crm, row.email, row.campus, row.momento]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery)),
    );
  }, [query, rows]);

  function downloadCsv() {
    const blob = new Blob([buildCsv(filtered)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cadastros-afya-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const preCount = rows.filter((row) => row.momento === "pre").length;
  const postCount = rows.filter((row) => row.momento === "pos").length;

  return (
    <div className="admin-page">
      <div className="admin-head container">
        <Logo variant="light" />
        <h1 className="admin-title">Cadastros Afya Summit</h1>
        <p className="admin-sub">
          {loading
            ? "Carregando..."
            : `${rows.length} resposta(s) • ${preCount} pré • ${postCount} pós`}
        </p>

        <div className="admin-toolbar">
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
        {!error && !loading && filtered.length === 0 && (
          <p className="admin-empty">Nenhum cadastro Afya Summit encontrado.</p>
        )}
        {!error && filtered.length > 0 && (
          <div className="table-wrap">
            <table className="admin-table admin-table--afya">
              <thead>
                <tr>
                  {COLUMNS.map((column) => <th key={column.key}>{column.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id}>
                    {COLUMNS.map((column) => (
                      <td
                        key={column.key}
                        className={column.answerIndex !== undefined ? "admin-answer" : ""}
                      >
                        {cellValue(row, column)}
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