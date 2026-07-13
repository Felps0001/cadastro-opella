import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { connectDB } from "./config/db.js";
import registrationsRouter from "./routes/registrations.js";
import staffRouter from "./routes/staff.js";

const app = express();
const PORT = process.env.PORT || 4000;

// CORS
// Normaliza uma origem removendo barra(s) final(is) para comparar sem falhas
const normalizeOrigin = (o) => String(o).trim().replace(/\/+$/, "");

const corsOrigin = process.env.CORS_ORIGIN || "*";
const allowAll = corsOrigin.trim() === "*";
const allowedOrigins = allowAll
  ? []
  : corsOrigin.split(",").map(normalizeOrigin).filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Requisicoes sem origem (curl, apps nativos, health checks) sao liberadas
      if (!origin || allowAll) return callback(null, true);
      if (allowedOrigins.includes(normalizeOrigin(origin))) {
        return callback(null, true);
      }
      return callback(new Error(`Origem nao permitida pelo CORS: ${origin}`));
    },
  })
);

app.use(express.json({ limit: "100kb" }));

// Rate limit basico para evitar abuso do cadastro
const registerLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas. Aguarde um instante." },
});

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/registrations", registerLimiter, registrationsRouter);
app.use("/api/staff", staffRouter);

// 404
app.use((_req, res) => res.status(404).json({ error: "Rota nao encontrada." }));

async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`[server] API rodando em http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("[server] Falha ao iniciar:", err.message);
    process.exit(1);
  }
}

start();
