import { Router } from "express";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { MinasRegistration } from "../models/MinasRegistration.js";

const router = Router();

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function generateUniqueCode(prefix) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const value = `${prefix}-${uuidv4().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
    const exists = await MinasRegistration.exists({
      $or: [{ giftCode: value }, { photoCode: value }],
    });
    if (!exists) return value;
  }
  throw new Error("Nao foi possivel gerar um codigo unico.");
}

router.post("/", async (req, res) => {
  try {
    const {
      nome = "",
      crm = "",
      estudante = false,
      especialidade = "",
      segundaEspecialidade = "Não se aplica",
      email = "",
      whatsapp = "",
      signatureDataUrl = "",
      aceiteComunicacao = false,
      aceiteTermos = false,
    } = req.body || {};

    if (!String(nome).trim()) {
      return res.status(400).json({ error: "Informe o nome completo." });
    }
    if (!estudante && !String(crm).trim()) {
      return res.status(400).json({ error: "Informe o CRM." });
    }
    if (String(especialidade).trim() !== "Pediatria") {
      return res.status(400).json({ error: "Selecione a especialidade." });
    }
    if (!isValidEmail(String(email).trim())) {
      return res.status(400).json({ error: "E-mail profissional invalido." });
    }
    if (String(whatsapp).replace(/\D/g, "").length < 10) {
      return res.status(400).json({ error: "WhatsApp invalido." });
    }
    if (!String(signatureDataUrl).startsWith("data:image/png;base64,")) {
      return res.status(400).json({ error: "Assinatura obrigatoria antes de receber o QR Code." });
    }
    if (aceiteComunicacao !== true || aceiteTermos !== true) {
      return res.status(400).json({ error: "Os aceites sao obrigatorios." });
    }

    const [giftCode, photoCode] = await Promise.all([
      generateUniqueCode("BRT"),
      generateUniqueCode("FOT"),
    ]);

    const registration = await MinasRegistration.create({
      nome: String(nome).trim(),
      crm: estudante ? "" : String(crm).trim().toUpperCase(),
      estudante: Boolean(estudante),
      especialidade: "Pediatria",
      segundaEspecialidade: String(segundaEspecialidade).trim() || "Não se aplica",
      email: String(email).trim().toLowerCase(),
      whatsapp: String(whatsapp).trim(),
      signatureDataUrl: String(signatureDataUrl),
      aceiteComunicacao: true,
      aceiteTermos: true,
      giftCode,
      photoCode,
    });

    return res.status(201).json({ id: registration.id });
  } catch (err) {
    console.error("[minas-registrations] erro ao criar:", err);
    return res.status(500).json({ error: "Erro ao processar cadastro." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: "Cadastro nao encontrado." });
    }
    const registration = await MinasRegistration.findById(req.params.id).lean();
    if (!registration) {
      return res.status(404).json({ error: "Cadastro nao encontrado." });
    }

    return res.json({
      id: String(registration._id),
      nome: registration.nome,
      signatureDataUrl: registration.signatureDataUrl || "",
      giftCode: registration.giftCode,
      photoCode: registration.photoCode,
      giftRedeemed: Boolean(registration.giftRedeemed),
      giftRedeemedAt: registration.giftRedeemedAt || null,
      photoRedeemed: Boolean(registration.photoRedeemed),
      photoRedeemedAt: registration.photoRedeemedAt || null,
    });
  } catch (err) {
    console.error("[minas-registrations] erro ao consultar:", err);
    return res.status(500).json({ error: "Erro ao consultar cadastro." });
  }
});

export default router;