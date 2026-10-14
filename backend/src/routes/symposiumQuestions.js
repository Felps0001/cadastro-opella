import { Router } from "express";
import { SymposiumQuestion } from "../models/SymposiumQuestion.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim();
    const question = String(req.body?.question || "").trim();

    if (!email && !question) {
      return res.status(400).json({ error: "Informe um e-mail ou uma pergunta." });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Informe um e-mail válido." });
    }
    if (question.length > 3000) {
      return res.status(400).json({ error: "A pergunta deve ter no máximo 3000 caracteres." });
    }

    const savedQuestion = await SymposiumQuestion.create({ email, question });
    return res.status(201).json({ ok: true, id: String(savedQuestion._id) });
  } catch (err) {
    console.error("[symposium-questions] erro ao salvar:", err);
    return res.status(500).json({ error: "Erro ao salvar a pergunta." });
  }
});

export default router;
