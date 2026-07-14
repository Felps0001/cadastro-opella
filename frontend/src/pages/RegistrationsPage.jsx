import { useEffect, useMemo, useState } from "react";
import Logo from "../components/Logo.jsx";
import { staffListRegistrations } from "../api.js";

// Colunas exportadas no CSV (ordem e cabecalho)
const COLUMNS = [
  { key: "code", label: "Codigo" },
  { key: "nome", label: "Nome" },
  { key: "email", label: "E-mail" },
  { key: "telefone", label: "Telefone" },
  { key: "localTrabalho", label: "Local de trabalho" },
  { key: "codigoLoja", label: "Codigo/Loja" },
  { key: "atribuicao", label: "Atribuicao" },
  { key: "farmaceuticoFormado", label: "Farmaceutico formado" },
  { key: "crf", label: "CRF" },
  { key: "crfUf", label: "UF do CRF" },
  { key: "aceiteComunicacao", label: "Aceite comunicacao" },
  { key: "canaisContato", label: "Canais de contato" },
  { key: "nps", label: "NPS" },
  { key: "redeemed", label: "Brinde retirado" },
  { key: "redeemedAt", label: "Retirado em" },
  { key: "createdAt", label: "Cadastrado em" },
];

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("pt-BR");
}

// Formata o valor de uma celula para exibicao/exportacao
function cellValue(row, key) {
  const v = row[key];
  if (key === "canaisContato") return Array.isArray(v) ? v.join(", ") : "";
  if (key === "farmaceuticoFormado" || key === "aceiteComunicacao")
    return v ? "Sim" : "Nao";
  if (key === "redeemed") return v ? "Sim" : "Nao";
  if (key === "redeemedAt" || key === "createdAt") return formatDate(v);
  if (v === null || v === undefined) return "";
  return String(v);
}

// Escapa um campo para CSV (aspas + delimitador + quebras de linha)
function csvEscape(value) {
  const s = String(value ?? "");
  if (/[";\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function buildCsv(rows) {
  const header = COLUMNS.map((c) => csvEscape(c.label)).join(";");
  const lines = rows.map((row) =>
    COLUMNS.map((c) => csvEscape(cellValue(row, c.key))).join(";")
  );
  // BOM para acentuacao correta no Excel
  return "\uFEFF" + [header, ...lines].join("\r\n");
}

export default function RegistrationsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await staffListRegistrations();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.status === 401) {
        setError("Token invalido. Verifique o VITE_STAFF_TOKEN no .env.");
      } else {
        setError(err.message || "Nao foi possivel carregar os cadastros.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.code, r.nome, r.email, r.telefone, r.codigoLoja, r.atribuicao]
        .filter(Boolean)
        .some((f) => String(f).toLowerCase().includes(q))
    );
  }, [rows, query]);

  function downloadCsv() {
    const csv = buildCsv(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const stamp = new Date().toISOString().slice(0, 10);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cadastros-opella-${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const total = rows.length;
  const retirados = rows.filter((r) => r.redeemed).length;

  return (
    <div className="admin-page">
      <div className="admin-head container">
        <Logo variant="light" />
        <h1 className="admin-title">Cadastros realizados</h1>
        <p className="admin-sub">
          {loading
            ? "Carregando..."
            : `${total} cadastro(s) • ${retirados} brinde(s) retirado(s)`}
        </p>

        <div className="admin-toolbar">
          <input
            className="admin-search"
            type="search"
            placeholder="Buscar por nome, e-mail, codigo..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            className="btn btn--ghost admin-btn"
            onClick={load}
            disabled={loading}
          >
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
          <p className="admin-empty">Nenhum cadastro encontrado.</p>
        )}

        {!error && filtered.length > 0 && (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  {COLUMNS.map((c) => (
                    <th key={c.key}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.code}>
                    {COLUMNS.map((c) => (
                      <td key={c.key}>{cellValue(row, c.key)}</td>
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
