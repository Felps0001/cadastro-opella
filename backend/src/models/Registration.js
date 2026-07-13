import mongoose from "mongoose";

const registrationSchema = new mongoose.Schema(
  {
    // Codigo unico usado no QR Code
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    nome: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    // Opt-in de comunicacoes digitais
    consent: {
      type: Boolean,
      default: false,
    },
    telefone: {
      type: String,
      required: true,
      trim: true,
    },
    // --- Secao 2: Local de trabalho ---
    // "Ponto de Venda" | "Escritorio"
    localTrabalho: {
      type: String,
      trim: true,
      default: "",
    },
    // Codigo/N da Loja/Filial
    codigoLoja: {
      type: String,
      trim: true,
      default: "",
    },
    // "Farmaceutico" | "Balconista" | "Gerente de Loja" | "Operador"
    atribuicao: {
      type: String,
      trim: true,
      default: "",
    },
    // E farmaceutico formado?
    farmaceuticoFormado: {
      type: Boolean,
      default: false,
    },
    crf: {
      type: String,
      trim: true,
      default: "",
    },
    crfUf: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },
    // --- Secao 3: Declaracao de aceite ---
    // Autoriza receber comunicacoes de marketing (Q10)
    aceiteComunicacao: {
      type: Boolean,
      default: false,
    },
    // Canais de contato de preferencia (E-mail, Whatsapp, SMS)
    canaisContato: {
      type: [String],
      default: [],
    },
    // NPS 0 a 10
    nps: {
      type: Number,
      min: 0,
      max: 10,
      default: null,
    },
    // Controle de retirada do brinde
    redeemed: {
      type: Boolean,
      default: false,
    },
    redeemedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export const Registration = mongoose.model("Registration", registrationSchema);
