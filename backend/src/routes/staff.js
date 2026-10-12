import { Router } from "express";
import { Registration } from "../models/Registration.js";
import { AfyaQuizResponse } from "../models/AfyaQuizResponse.js";
import { MinasRegistration } from "../models/MinasRegistration.js";

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
 * GET /api/staff/registrations
 * Lista todos os cadastros (para a pagina de gestao / exportacao CSV)
 */
router.get("/registrations", requireStaff, async (req, res) => {
  try {
    const registrations = await Registration.find({})
      .sort({ createdAt: -1 })
      .lean();

    return res.json(
      registrations.map((r) => ({
        code: r.code,
        nome: r.nome || "",
        email: r.email || "",
        telefone: r.telefone || "",
        tipoFormulario: r.tipoFormulario || "farmaceutico",
        redeTrabalho: r.redeTrabalho || "",
        localTrabalho: r.localTrabalho || "",
        codigoLoja: r.codigoLoja || "",
        atribuicao: r.atribuicao || "",
        farmaceuticoFormado: Boolean(r.farmaceuticoFormado),
        crf: r.crf || "",
        crfUf: r.crfUf || "",
        crm: r.crm || "",
        aceiteComunicacao: Boolean(r.aceiteComunicacao),
        lgpdConsent: Boolean(r.lgpdConsent),
        canaisContato: Array.isArray(r.canaisContato) ? r.canaisContato : [],
        nps: r.nps ?? null,
        redeemed: Boolean(r.redeemed),
        redeemedAt: r.redeemedAt || null,
        createdAt: r.createdAt || null,
      }))
    );
  } catch (err) {
    console.error("[staff] erro ao listar cadastros:", err);
    return res.status(500).json({ error: "Erro ao listar cadastros." });
  }
});

/**
 * GET /api/staff/afya-quiz
 * Lista os cadastros e respostas dos questionarios Afya.
 */
router.get("/afya-quiz", requireStaff, async (req, res) => {
  try {
    const origem = req.query.origem || "afya";
    if (!["afya", "congresso-pediatria"].includes(origem)) {
      return res.status(400).json({ error: "Origem de formulario invalida." });
    }
    const origemFilter = origem === "afya"
      ? { $or: [{ origem: "afya" }, { origem: { $exists: false } }] }
      : { origem };
    const responses = await AfyaQuizResponse.find(origemFilter)
      .sort({ createdAt: -1 })
      .lean();

    return res.json(
      responses.map((response) => ({
        id: String(response._id),
        origem: response.origem || "afya",
        momento: response.momento,
        nome: response.nome || "",
        crm: response.crm || "",
        email: response.email || "",
        campus: response.campus || "",
        lgpdConsent: Boolean(response.lgpdConsent),
        respostas: Array.isArray(response.respostas) ? response.respostas : [],
        notaClareza: response.notaClareza ?? null,
        notaRelevancia: response.notaRelevancia ?? null,
        notaDidatica: response.notaDidatica ?? null,
        notaEvento: response.notaEvento ?? null,
        createdAt: response.createdAt || null,
      })),
    );
  } catch (err) {
    console.error("[staff] erro ao listar respostas Afya:", err);
    return res.status(500).json({ error: "Erro ao listar respostas Afya." });
  }
});

/**
 * GET /api/staff/minas-registrations
 * Lista os cadastros do formulario SBP e o uso dos dois QR Codes.
 */
router.get("/minas-registrations", requireStaff, async (_req, res) => {
  try {
    const registrations = await MinasRegistration.find({})
      .sort({ createdAt: -1 })
      .lean();

    return res.json(
      registrations.map((registration) => ({
        id: String(registration._id),
        nome: registration.nome || "",
        crm: registration.crm || "",
        crmUf: registration.crmUf || "",
        estudante: Boolean(registration.estudante),
        especialidade: registration.especialidade || "",
        segundaEspecialidade: registration.segundaEspecialidade || "",
        email: registration.email || "",
        whatsapp: registration.whatsapp || "",
        cep: registration.cep || "",
        logradouro: registration.logradouro || "",
        numero: registration.numero || "",
        complemento: registration.complemento || "",
        bairro: registration.bairro || "",
        cidade: registration.cidade || "",
        ufEndereco: registration.ufEndereco || "",
        pais: registration.pais || "Brasil",
        evento: registration.evento || "",
        produtosSolicitados: registration.produtosSolicitados || [],
        representanteSistemico: registration.representanteSistemico || "",
        signatureDataUrl: registration.signatureDataUrl || "",
        giftSignatureDataUrl: registration.giftSignatureDataUrl || "",
        photoSignatureDataUrl: registration.photoSignatureDataUrl || "",
        declaracaoSolicitacao: Boolean(registration.declaracaoSolicitacao),
        cienciaAvisoPrivacidade: Boolean(registration.cienciaAvisoPrivacidade),
        aceiteComunicacao: Boolean(registration.aceiteComunicacao),
        aceiteTermos: Boolean(registration.aceiteTermos),
        giftCode: registration.giftCode || "",
        giftRedeemed: Boolean(registration.giftRedeemed),
        giftRedeemedAt: registration.giftRedeemedAt || null,
        photoCode: registration.photoCode || "",
        photoRedeemed: Boolean(registration.photoRedeemed),
        photoRedeemedAt: registration.photoRedeemedAt || null,
        createdAt: registration.createdAt || null,
      })),
    );
  } catch (err) {
    console.error("[staff] erro ao listar cadastros SBP:", err);
    return res.status(500).json({ error: "Erro ao listar cadastros SBP." });
  }
});

/**
 * GET /api/staff/lookup/:code
 * Consulta o cadastro para a tela do tablet (mostra dados + status)
 */
router.get("/lookup/:code", requireStaff, async (req, res) => {
  try {
    const code = String(req.params.code).trim().toUpperCase();
    const registration = await Registration.findOne({ code });

    if (registration) {
      return res.json({
        code: registration.code,
        nome: registration.nome,
        email: registration.email,
        telefone: registration.telefone,
        purpose: "gift",
        purposeLabel: "Brinde",
        redeemed: registration.redeemed,
        redeemedAt: registration.redeemedAt,
        createdAt: registration.createdAt,
      });
    }

    const minasRegistration = await MinasRegistration.findOne({
      $or: [{ giftCode: code }, { photoCode: code }],
    });
    if (!minasRegistration) {
      return res.status(404).json({ error: "QR Code nao encontrado." });
    }

    const isPhoto = minasRegistration.photoCode === code;
    return res.json({
      code,
      nome: minasRegistration.nome,
      email: minasRegistration.email,
      telefone: minasRegistration.whatsapp,
      purpose: isPhoto ? "photo" : "gift",
      purposeLabel: isPhoto ? "Foto" : "Brinde",
      signatureRequired: !isPhoto,
      redeemed: isPhoto
        ? minasRegistration.photoRedeemed
        : minasRegistration.giftRedeemed,
      redeemedAt: isPhoto
        ? minasRegistration.photoRedeemedAt
        : minasRegistration.giftRedeemedAt,
      createdAt: minasRegistration.createdAt,
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
    const { signatureDataUrl = "" } = req.body || {};
    const registration = await Registration.findOne({ code });

    if (registration) {
      if (registration.redeemed) {
        return res.status(409).json({
          error: "Brinde ja retirado.",
          code: registration.code,
          nome: registration.nome,
          purpose: "gift",
          purposeLabel: "Brinde",
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
        purpose: "gift",
        purposeLabel: "Brinde",
        redeemedAt: registration.redeemedAt,
        redeemed: true,
      });
    }

    const minasRegistration = await MinasRegistration.findOne({
      $or: [{ giftCode: code }, { photoCode: code }],
    }).lean();
    if (!minasRegistration) {
      return res.status(404).json({ error: "QR Code nao encontrado." });
    }

    const isPhoto = minasRegistration.photoCode === code;
    const redeemedField = isPhoto ? "photoRedeemed" : "giftRedeemed";
    const redeemedAtField = isPhoto ? "photoRedeemedAt" : "giftRedeemedAt";
    const purpose = isPhoto ? "photo" : "gift";
    const purposeLabel = isPhoto ? "Foto" : "Brinde";
    if (!isPhoto && (
      !/^data:image\/png;base64,[A-Za-z0-9+/]+=*$/.test(signatureDataUrl) ||
      signatureDataUrl.length > 500_000
    )) {
      return res.status(400).json({ error: "A assinatura e obrigatoria para confirmar a retirada." });
    }

    const redeemedAt = new Date();
    const updateFields = {
      [redeemedField]: true,
      [redeemedAtField]: redeemedAt,
    };
    if (!isPhoto) updateFields.giftSignatureDataUrl = signatureDataUrl;

    const updated = await MinasRegistration.findOneAndUpdate(
      { _id: minasRegistration._id, [redeemedField]: false },
      { $set: updateFields },
      { new: true },
    );

    if (!updated) {
      const current = await MinasRegistration.findById(minasRegistration._id).lean();
      return res.status(409).json({
        error: `${purposeLabel} ja utilizado.`,
        code,
        nome: minasRegistration.nome,
        purpose,
        purposeLabel,
        redeemedAt: current?.[redeemedAtField] || null,
        redeemed: true,
      });
    }

    return res.json({
      ok: true,
      code,
      nome: updated.nome,
      purpose,
      purposeLabel,
      redeemedAt: updated[redeemedAtField],
      redeemed: true,
    });
  } catch (err) {
    console.error("[staff] erro no redeem:", err);
    return res.status(500).json({ error: "Erro ao dar baixa no brinde." });
  }
});

export default router;
