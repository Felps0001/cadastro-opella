import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";
import { Registration } from "../models/Registration.js";

const router = Router();

// Gera um codigo curto e legivel para o QR (ex: OPL-3F9A2B7C)
function generateCode() {
  const raw = uuidv4().replace(/-/g, "").slice(0, 8).toUpperCase();
  return `OPL-${raw}`;
}

// Validacao simples de e-mail
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * POST /api/registrations
 * Cria o cadastro e devolve o codigo + imagem do QR Code (dataURL)
 */
router.post("/", async (req, res) => {
  try {
    const {
      nome = "",
      email = "",
      telefone = "",
      consent = false,
      localTrabalho = "",
      codigoLoja = "",
      atribuicao = "",
      farmaceuticoFormado = false,
      crf = "",
      crfUf = "",
      aceiteComunicacao = false,
      canaisContato = [],
      nps = null,
    } = req.body || {};

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: "E-mail invalido." });
    }
    if (!telefone || telefone.replace(/\D/g, "").length < 10) {
      return res.status(400).json({ error: "Telefone invalido. Informe DDD + numero." });
    }

    // Normaliza NPS
    let npsValue = null;
    if (nps !== null && nps !== "" && nps !== undefined) {
      const n = Number(nps);
      if (!Number.isNaN(n) && n >= 0 && n <= 10) npsValue = n;
    }

    // Garante codigo unico
    let code = generateCode();
    // Loop de seguranca contra colisao (praticamente impossivel, mas garante)
    for (let i = 0; i < 5; i++) {
      const exists = await Registration.exists({ code });
      if (!exists) break;
      code = generateCode();
    }

    const registration = await Registration.create({
      code,
      nome: String(nome).trim(),
      email: String(email).trim().toLowerCase(),
      telefone: String(telefone).trim(),
      consent: Boolean(consent) || Boolean(aceiteComunicacao),
      localTrabalho: String(localTrabalho).trim(),
      codigoLoja: String(codigoLoja).trim(),
      atribuicao: String(atribuicao).trim(),
      farmaceuticoFormado: Boolean(farmaceuticoFormado),
      crf: String(crf).trim(),
      crfUf: String(crfUf).trim().toUpperCase(),
      aceiteComunicacao: Boolean(aceiteComunicacao),
      canaisContato: Array.isArray(canaisContato)
        ? canaisContato.map((c) => String(c).trim()).filter(Boolean)
        : [],
      nps: npsValue,
    });

    // Conteudo do QR: link para a pagina de validacao (funciona com qualquer leitor)
    const frontendUrl = process.env.FRONTEND_URL || "";
    const qrContent = frontendUrl
      ? `${frontendUrl.replace(/\/$/, "")}/validar/${code}`
      : code;

    const qrDataUrl = await QRCode.toDataURL(qrContent, {
      width: 512,
      margin: 1,
      color: { dark: "#0a3320", light: "#FFFFFF" },
    });

    return res.status(201).json({
      code: registration.code,
      qrContent,
      qrDataUrl,
    });
  } catch (err) {
    console.error("[registrations] erro ao criar:", err);
    return res.status(500).json({ error: "Erro ao processar cadastro." });
  }
});

/**
 * GET /api/registrations/:code
 * Consulta publica dos dados de um cadastro (usado na pagina de sucesso/validacao)
 */
router.get("/:code", async (req, res) => {
  try {
    const code = String(req.params.code).trim().toUpperCase();
    const registration = await Registration.findOne({ code });

    if (!registration) {
      return res.status(404).json({ error: "Cadastro nao encontrado." });
    }

    return res.json({
      code: registration.code,
      nome: registration.nome,
      email: registration.email,
      redeemed: registration.redeemed,
      redeemedAt: registration.redeemedAt,
      createdAt: registration.createdAt,
    });
  } catch (err) {
    console.error("[registrations] erro ao consultar:", err);
    return res.status(500).json({ error: "Erro ao consultar cadastro." });
  }
});

export default router;
