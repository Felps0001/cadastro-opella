import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME;

  if (!uri) {
    throw new Error("MONGODB_URI nao definido no .env");
  }

  mongoose.connection.on("connected", () => {
    console.log(`[db] Conectado ao MongoDB (${dbName || "default"})`);
  });
  mongoose.connection.on("error", (err) => {
    console.error("[db] Erro de conexao:", err.message);
  });

  await mongoose.connect(uri, {
    dbName: dbName || undefined,
  });
}
