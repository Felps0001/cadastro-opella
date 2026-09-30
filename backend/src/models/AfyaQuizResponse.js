import mongoose from "mongoose";

const afyaQuizResponseSchema = new mongoose.Schema(
  {
    momento: {
      type: String,
      enum: ["pre", "pos"],
      required: true,
    },
    nome: {
      type: String,
      required: true,
      trim: true,
    },
    crm: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    campus: {
      type: String,
      required: true,
      trim: true,
    },
    respostas: {
      type: [String],
      required: true,
      validate: {
        validator(value) {
          return value.length === 3 && value.every((answer) => /^[A-D]$/.test(answer));
        },
        message: "As tres respostas do quiz sao obrigatorias.",
      },
    },
    notaClareza: {
      type: Number,
      min: 0,
      max: 10,
      default: null,
    },
    notaRelevancia: {
      type: Number,
      min: 0,
      max: 10,
      default: null,
    },
    notaDidatica: {
      type: Number,
      min: 0,
      max: 10,
      default: null,
    },
    notaEvento: {
      type: Number,
      min: 0,
      max: 10,
      default: null,
    },
  },
  { timestamps: true },
);

export const AfyaQuizResponse = mongoose.model(
  "AfyaQuizResponse",
  afyaQuizResponseSchema,
);