import mongoose from "mongoose";

const minasRegistrationSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true, trim: true },
    crm: { type: String, trim: true, default: "" },
    crmUf: { type: String, trim: true, uppercase: true, default: "" },
    estudante: { type: Boolean, default: false },
    especialidade: { type: String, required: true, trim: true },
    segundaEspecialidade: { type: String, trim: true, default: "Não se aplica" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    whatsapp: { type: String, trim: true, default: "" },
    cep: { type: String, required: true, trim: true },
    logradouro: { type: String, required: true, trim: true },
    numero: { type: String, required: true, trim: true },
    complemento: { type: String, trim: true, default: "" },
    bairro: { type: String, required: true, trim: true },
    cidade: { type: String, required: true, trim: true },
    ufEndereco: { type: String, required: true, trim: true, uppercase: true },
    pais: { type: String, default: "Brasil" },
    evento: { type: String, default: "Congresso Brasileiro de Pediatria" },
    produtosSolicitados: {
      type: [{ nome: String, lote: String, quantidade: String }],
      default: [],
    },
    representanteSistemico: { type: String, default: "Rodrigo Loder" },
    signatureDataUrl: { type: String, default: "" },
    giftSignatureDataUrl: { type: String, default: "" },
    photoSignatureDataUrl: { type: String, default: "" },
    declaracaoSolicitacao: { type: Boolean, required: true },
    cienciaAvisoPrivacidade: { type: Boolean, required: true },
    aceiteComunicacao: { type: Boolean, required: true },
    aceiteTermos: { type: Boolean, required: true },
    giftCode: { type: String, required: true, unique: true, index: true },
    photoCode: { type: String, required: true, unique: true, index: true },
    giftRedeemed: { type: Boolean, default: false },
    giftRedeemedAt: { type: Date, default: null },
    photoRedeemed: { type: Boolean, default: false },
    photoRedeemedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const MinasRegistration = mongoose.model(
  "MinasRegistration",
  minasRegistrationSchema,
);