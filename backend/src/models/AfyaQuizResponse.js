import mongoose from "mongoose";

const afyaQuizResponseSchema = new mongoose.Schema(
  {
    origem: {
      type: String,
      enum: ["afya", "congresso-pediatria"],
      required: true,
      default: "afya",
      index: true,
    },
    quizVersion: {
      type: String,
      enum: ["legacy", "afya-2026-10-28"],
      default: "legacy",
    },
    momento: {
      type: String,
      enum: ["pre", "pos"],
      required: true,
    },
    nome: {
      type: String,
      required() { return this.origem === "afya"; },
      trim: true,
      default: "",
    },
    crm: {
      type: String,
      required() { return this.origem === "afya"; },
      trim: true,
      default: "",
    },
    email: {
      type: String,
      required() { return this.origem === "afya"; },
      trim: true,
      lowercase: true,
      default: "",
    },
    campus: {
      type: String,
      required() { return this.origem === "afya"; },
      trim: true,
      default: "",
    },
    lgpdConsent: {
      type: Boolean,
      required: true,
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