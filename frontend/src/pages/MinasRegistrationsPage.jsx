import { useEffect, useMemo, useState } from "react";
import Logo from "../components/Logo.jsx";
import { staffListMinasRegistrations } from "../api.js";

const COLUMNS = [
  { key: "nome", label: "Nome" },
  { key: "crm", label: "CRM" },
  { key: "estudante", label: "Estudante" },
  { key: "especialidade", label: "Especialidade" },
  { key: "segundaEspecialidade", label: "2ª especialidade" },
  { key: "email", label: "E-mail" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "aceiteComunicacao", label: "Aceite comunicação" },
  { key: "aceiteTermos", label: "Aceite termos" },
  { key: "giftCode", label: "Código brinde" },
  { key: "giftRedeemed", label: "Status brinde" },
  { key: "giftRedeemedAt", label: "Brinde utilizado em" },
  { key: "photoCode", label: "Código foto" },
  { key: "photoRedeemed", label: "Status foto" },
  { key: "photoRedeemedAt", label: "Foto utilizada em" },
  { key: "createdAt", label: "Cadastrado em" },
];

const DATE_FIELDS = new Set([
  "giftRedeemedAt",
  "photoRedeemedAt",
  "createdAt",
]);
const BOOLEAN_FIELDS = new Set([
  "estudante",
  "aceiteComunicacao",
  "aceiteTermos",
]);
const STATUS_FIELDS = new Set(["giftRedeemed", "photoRedeemed"]);

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("pt-BR");
}

function cellValue(row, key) {
  if (DATE_FIELDS.has(key)) return formatDate(row[key]);
  if (BOOLEAN_FIELDS.has(key)) return row[key] ? "Sim" : "Não";
  if (STATUS_FIELDS.has(key)) return row[key] ? "Utilizado" : "Disponível";
  if (key === "crm" && row.estudante && !row.crm) return "Estudante";
  const value = row[key];
  return value === null || value === undefined ? "" : String(value);
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function buildCsv(rows) {
  const header = COLUMNS.map((column) => csvEscape(column.label)).join(";");
  const lines = rows.map((row) =>
    COLUMNS.map((column) => csvEscape(cellValue(row, column.key))).join(";"),
  );
  return "\uFEFF" + [header, ...lines].join("\r\n");
}

export default function MinasRegistrationsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await staffListMinasRegistrations();
      setRows(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setError(
        requestError.status === 401
          ? "Token inválido. Verifique o VITE_STAFF_TOKEN no .env."
          : requestError.message || "Não foi possível carregar os cadastros SBP.",
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
      [
        row.nome,
        row.crm,
        row.email,
        row.whatsapp,
        row.giftCode,
        row.photoCode,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery)),
    );
  }, [query, rows]);

  function downloadCsv() {
    const blob = new Blob([buildCsv(filtered)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cadastros-sbp-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const giftCount = rows.filter((row) => row.giftRedeemed).length;
  const photoCount = rows.filter((row) => row.photoRedeemed).length;

  return (
    <div className="admin-page">
      <div className="admin-head container">
        <Logo variant="light" />
        <h1 className="admin-title">Cadastros SBP</h1>
        <p className="admin-sub">
          {loading
            ? "Carregando..."
            : `${rows.length} cadastro(s) • ${giftCount} brinde(s) • ${photoCount} foto(s)`}
        </p>

        <div className="admin-toolbar">
          <input
            className="admin-search"
            type="search"
            placeholder="Buscar por nome, CRM, contato ou código..."
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
          <p className="admin-empty">Nenhum cadastro SBP encontrado.</p>
        )}
        {!error && filtered.length > 0 && (
          <div className="table-wrap">
            <table className="admin-table admin-table--minas">
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
                        className={
                          STATUS_FIELDS.has(column.key)
                            ? row[column.key]
                              ? "admin-status admin-status--used"
                              : "admin-status admin-status--available"
                            : column.key === "giftCode" || column.key === "photoCode"
                              ? "admin-code"
                              : ""
                        }
                      >
                        {cellValue(row, column.key)}
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