import { Router } from "express";
import { Registration } from "../models/Registration.js";

const router = Router();

// Middleware simples de autenticacao para a equipe do tablet
function requireStaff(req, res, next) {
  const expected = process.env.STAFF_TOKEN;
  const provided = req.header("x-staff-token");

  if (!expected) {
    return res.status(500).json({ error: "STAFF_TOKEN nao configurado no servidor." });
  }
  if (!provided || provided !== expected) {
    return res.status(401).json({ error: "Token invalido." });
  }
  next();
}

/**
 * GET /api/staff/lookup/:code
 * Consulta o cadastro para a tela do tablet (mostra dados + status)
 */
router.get("/lookup/:code", requireStaff, async (req, res) => {
  try {
    const code = String(req.params.code).trim().toUpperCase();
    const registration = await Registration.findOne({ code });

    if (!registration) {
      return res.status(404).json({ error: "QR Code nao encontrado." });
    }

    return res.json({
      code: registration.code,
      nome: registration.nome,
      email: registration.email,
      telefone: registration.telefone,
      redeemed: registration.redeemed,
      redeemedAt: registration.redeemedAt,
      createdAt: registration.createdAt,
    });
  } catch (err) {
    console.error("[staff] erro no lookup:", err);
    return res.status(500).json({ error: "Erro ao consultar QR Code." });
  }
});

/**
 * POST /api/staff/redeem/:code
 * Da baixa no brinde. Se ja foi retirado, avisa.
 */
router.post("/redeem/:code", requireStaff, async (req, res) => {
  try {
    const code = String(req.params.code).trim().toUpperCase();
    const registration = await Registration.findOne({ code });

    if (!registration) {
      return res.status(404).json({ error: "QR Code nao encontrado." });
    }

    if (registration.redeemed) {
      return res.status(409).json({
        error: "Brinde ja retirado.",
        code: registration.code,
        nome: registration.nome,
        redeemedAt: registration.redeemedAt,
        redeemed: true,
      });
    }

    registration.redeemed = true;
    registration.redeemedAt = new Date();
    await registration.save();

    return res.json({
      ok: true,
      code: registration.code,
      nome: registration.nome,
      redeemedAt: registration.redeemedAt,
      redeemed: true,
    });
  } catch (err) {
    console.error("[staff] erro no redeem:", err);
    return res.status(500).json({ error: "Erro ao dar baixa no brinde." });
  }
});

export default router;
