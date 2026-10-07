import mongoose from "mongoose";

const minasRegistrationSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true, trim: true },
    crm: { type: String, trim: true, default: "" },
    estudante: { type: Boolean, default: false },
    especialidade: { type: String, required: true, trim: true },
    segundaEspecialidade: { type: String, trim: true, default: "Não se aplica" },
    email: { type: String, required: true, trim: true, lowercase: true },
    whatsapp: { type: String, required: true, trim: true },
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