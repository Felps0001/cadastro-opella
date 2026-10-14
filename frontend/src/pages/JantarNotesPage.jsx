import { useEffect, useMemo, useState } from "react";
import { getCongressJantarNotes } from "../api.js";

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("pt-BR");
}

export default function JantarNotesPage() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await getCongressJantarNotes();
        setNotes(Array.isArray(data) ? data : []);
      } catch (requestError) {
        setError(requestError.message || "Não foi possível carregar as notas.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const average = useMemo(() => {
    if (notes.length === 0) return null;
    const values = notes.flatMap((note) => [note.relevancia, note.didatica, note.evento]);
    return (values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length).toFixed(1);
  }, [notes]);

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f0", padding: "32px 20px 48px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <h1 style={{ margin: "0 0 8px", color: "#173b2a", fontSize: "2rem" }}>Notas do congresso-jantar</h1>
        <p style={{ margin: "0 0 24px", color: "#4a5d53" }}>
          {notes.length} envio(s) registrado(s)
          {average ? ` • média geral: ${average}` : ""}
        </p>

        {error && (
          <div style={{ background: "#fff1f1", border: "1px solid #f0c4c4", color: "#8a2b2b", borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>
            {error}
          </div>
        )}

        {loading ? (
          <p style={{ color: "#476154" }}>Carregando notas...</p>
        ) : notes.length === 0 ? (
          <p style={{ color: "#476154" }}>Nenhuma nota registrada ainda.</p>
        ) : (
          <div style={{ overflowX: "auto", background: "#fff", borderRadius: 16, boxShadow: "0 10px 28px rgba(0,0,0,0.08)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#173b2a", color: "#fff" }}>
                  <th style={thStyle}>Data</th>
                  <th style={thStyle}>Relevância</th>
                  <th style={thStyle}>Didática</th>
                  <th style={thStyle}>Evento</th>
                  <th style={thStyle}>Média</th>
                </tr>
              </thead>
              <tbody>
                {notes.map((note) => {
                  const media = ((Number(note.relevancia) + Number(note.didatica) + Number(note.evento)) / 3).toFixed(1);
                  return (
                    <tr key={note._id || `${note.createdAt}-${Math.random()}`} style={{ borderBottom: "1px solid #e9efe9" }}>
                      <td style={tdStyle}>{formatDate(note.createdAt)}</td>
                      <td style={tdStyle}>{note.relevancia}</td>
                      <td style={tdStyle}>{note.didatica}</td>
                      <td style={tdStyle}>{note.evento}</td>
                      <td style={tdStyle}>{media}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const thStyle = {
  padding: "14px 16px",
  textAlign: "left",
  fontSize: "0.9rem",
  fontWeight: 700,
};

const tdStyle = {
  padding: "14px 16px",
  textAlign: "left",
  color: "#20382d",
  fontSize: "0.95rem",
};
