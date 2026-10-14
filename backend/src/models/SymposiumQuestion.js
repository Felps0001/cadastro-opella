import mongoose from "mongoose";

const symposiumQuestionSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    question: {
      type: String,
      trim: true,
      default: "",
      maxlength: 3000,
    },
  },
  { timestamps: true },
);

export const SymposiumQuestion = mongoose.model(
  "SymposiumQuestion",
  symposiumQuestionSchema,
);
