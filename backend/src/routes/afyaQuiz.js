import { Router } from "express";
import { AfyaQuizResponse } from "../models/AfyaQuizResponse.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const {
      origem = "afya",
      momento,
      nome = "",
      crm = "",
      email = "",
      campus = "",
      lgpdConsent = false,
      respostas,
      notaClareza = null,
      notaRelevancia = null,
      notaDidatica = null,
      notaEvento = null,
    } = req.body || {};

    if (!["afya", "congresso-pediatria"].includes(origem)) {
      return res.status(400).json({ error: "Origem de formulario invalida." });
    }
    if (!['pre', 'pos'].includes(momento)) {
      return res.status(400).json({ error: "Selecione Pre-aula ou Pos-aula." });
    }

    if (origem === "afya") {
      if (![nome, crm, email, campus].every((value) => String(value).trim())) {
        return res.status(400).json({ error: "Preencha todos os dados de identificacao." });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
        return res.status(400).json({ error: "E-mail invalido." });
      }
      if (lgpdConsent !== true) {
        return res.status(400).json({ error: "O aceite LGPD e obrigatorio." });
      }
    }

    if (
      !Array.isArray(respostas) ||
      respostas.length !== 3 ||
      !respostas.every((answer) => /^[A-D]$/.test(answer))
    ) {
      return res.status(400).json({ error: "Responda as tres perguntas do quiz." });
    }

    const parseRating = (value) =>
      value === null || value === "" ? null : Number(value);
    const clarity = parseRating(notaClareza);
    const relevance = parseRating(notaRelevancia);
    const didactics = parseRating(notaDidatica);
    const eventRating = parseRating(notaEvento);
    const ratings =
      origem === "afya"
        ? [clarity, relevance, didactics, eventRating]
        : [relevance, didactics, eventRating];

    if (
      momento === "pos" &&
      ratings.some(
        (rating) =>
          !Number.isInteger(rating) || rating < 0 || rating > 10,
      )
    ) {
      const requiredCount = origem === "afya" ? 4 : 3;
      return res.status(400).json({
        error: `Selecione as ${requiredCount} notas de 0 a 10.`,
      });
    }

    await AfyaQuizResponse.create({
      origem,
      momento,
      nome: String(nome).trim(),
      crm: String(crm).trim(),
      email: String(email).trim().toLowerCase(),
      campus: String(campus).trim(),
      lgpdConsent: origem === "afya",
      respostas,
      notaClareza: momento === "pos" ? clarity : null,
      notaRelevancia: momento === "pos" ? relevance : null,
      notaDidatica: momento === "pos" ? didactics : null,
      notaEvento: momento === "pos" ? eventRating : null,
    });

    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error("[afya-quiz] erro ao salvar:", err);
    return res.status(500).json({ error: "Erro ao enviar o quiz." });
  }
});

export default router;