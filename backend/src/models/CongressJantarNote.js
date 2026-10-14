import mongoose from "mongoose";

const congressJantarNoteSchema = new mongoose.Schema(
  {
    origem: {
      type: String,
      enum: ["congresso-jantar", "congresso-pediatria"],
      default: "congresso-jantar",
      required: true,
      index: true,
    },
    momento: {
      type: String,
      enum: ["pos"],
      default: "pos",
      required: true,
    },
    relevancia: {
      type: Number,
      min: 0,
      max: 10,
      required: true,
    },
    didatica: {
      type: Number,
      min: 0,
      max: 10,
      required: true,
    },
    evento: {
      type: Number,
      min: 0,
      max: 10,
      required: true,
    },
  },
  { timestamps: true },
);

export const CongressJantarNote = mongoose.model(
  "CongressJantarNote",
  congressJantarNoteSchema,
);
