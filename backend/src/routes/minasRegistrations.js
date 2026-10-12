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
      crmUf = "",
      estudante = false,
      especialidade = "",
      segundaEspecialidade = "Não se aplica",
      email = "",
      whatsapp = "",
      cep = "",
      logradouro = "",
      numero = "",
      complemento = "",
      bairro = "",
      cidade = "",
      ufEndereco = "",
      declaracaoSolicitacao = false,
      cienciaAvisoPrivacidade = false,
      aceiteComunicacao = false,
      aceiteTermos = false,
    } = req.body || {};

    if (!String(nome).trim()) {
      return res.status(400).json({ error: "Informe o nome completo." });
    }
    if (!estudante && !String(crm).trim()) {
      return res.status(400).json({ error: "Informe o CRM." });
    }
    if (!estudante && !/^\d+$/.test(String(crm).trim())) {
      return res.status(400).json({ error: "O CRM deve conter somente numeros." });
    }
    if (!estudante && !String(crmUf).trim()) {
      return res.status(400).json({ error: "Informe a UF do CRM." });
    }
    if (String(especialidade).trim() !== "Pediatria") {
      return res.status(400).json({ error: "Selecione a especialidade." });
    }
    if (String(email).trim() && !isValidEmail(String(email).trim())) {
      return res.status(400).json({ error: "E-mail profissional invalido." });
    }
    if (String(whatsapp).trim() && String(whatsapp).replace(/\D/g, "").length < 10) {
      return res.status(400).json({ error: "WhatsApp invalido." });
    }
    if (String(cep).replace(/\D/g, "").length !== 8) {
      return res.status(400).json({ error: "CEP profissional invalido." });
    }
    if (![logradouro, numero, bairro, cidade, ufEndereco].every((value) => String(value).trim())) {
      return res.status(400).json({ error: "Preencha os campos obrigatorios do endereco profissional." });
    }
    if (declaracaoSolicitacao !== true || cienciaAvisoPrivacidade !== true) {
      return res.status(400).json({ error: "A declaracao de solicitacao e a ciencia de privacidade sao obrigatorias." });
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
      crmUf: estudante ? "" : String(crmUf).trim().toUpperCase(),
      estudante: Boolean(estudante),
      especialidade: "Pediatria",
      segundaEspecialidade: String(segundaEspecialidade).trim() || "Não se aplica",
      email: String(email).trim().toLowerCase(),
      whatsapp: String(whatsapp).trim(),
      cep: String(cep).trim(),
      logradouro: String(logradouro).trim(),
      numero: String(numero).trim(),
      complemento: String(complemento).trim(),
      bairro: String(bairro).trim(),
      cidade: String(cidade).trim(),
      ufEndereco: String(ufEndereco).trim().toUpperCase(),
      pais: "Brasil",
      evento: "Congresso Brasileiro de Pediatria",
      produtosSolicitados: [
        { nome: "Allegra 120 mg", lote: "FRA0378", quantidade: "10" },
        { nome: "Allegra 180 mg", lote: "FRA0555", quantidade: "10" },
      ],
      representanteSistemico: "Rodrigo Loder",
      declaracaoSolicitacao: true,
      cienciaAvisoPrivacidade: true,
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
      crm: registration.crm,
      crmUf: registration.crmUf,
      estudante: Boolean(registration.estudante),
      especialidade: registration.especialidade,
      segundaEspecialidade: registration.segundaEspecialidade,
      email: registration.email,
      whatsapp: registration.whatsapp,
      cep: registration.cep,
      logradouro: registration.logradouro,
      numero: registration.numero,
      complemento: registration.complemento,
      bairro: registration.bairro,
      cidade: registration.cidade,
      ufEndereco: registration.ufEndereco,
      pais: registration.pais || "Brasil",
      evento: registration.evento || "",
      produtosSolicitados: registration.produtosSolicitados || [],
      representanteSistemico: registration.representanteSistemico || "",
      signatureDataUrl: registration.signatureDataUrl || "",
      giftSignatureDataUrl: registration.giftSignatureDataUrl || "",
      photoSignatureDataUrl: registration.photoSignatureDataUrl || "",
      declaracaoSolicitacao: Boolean(registration.declaracaoSolicitacao),
      cienciaAvisoPrivacidade: Boolean(registration.cienciaAvisoPrivacidade),
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