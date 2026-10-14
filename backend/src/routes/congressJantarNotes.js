import { Router } from "express";
import { CongressJantarNote } from "../models/CongressJantarNote.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const notes = await CongressJantarNote.find({ origem: "congresso-jantar" })
      .sort({ createdAt: -1 })
      .lean();

    return res.json(notes);
  } catch (err) {
    console.error("[congresso-jantar-notas] erro ao listar:", err);
    return res.status(500).json({ error: "Erro ao listar as notas do jantar." });
  }
});

router.post("/", async (req, res) => {
  try {
    const { origem = "congresso-jantar", momento = "pos", relevancia, didatica, evento } = req.body || {};

    const isIntBetween0And10 = (value) =>
      Number.isInteger(value) && value >= 0 && value <= 10;

    if (![relevancia, didatica, evento].every((value) => isIntBetween0And10(Number(value)))) {
      return res.status(400).json({ error: "Selecione as 3 notas de 0 a 10." });
    }

    await CongressJantarNote.create({
      origem,
      momento,
      relevancia: Number(relevancia),
      didatica: Number(didatica),
      evento: Number(evento),
    });

    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error("[congresso-jantar-notas] erro ao salvar:", err);
    return res.status(500).json({ error: "Erro ao salvar as notas do jantar." });
  }
});

export default router;
