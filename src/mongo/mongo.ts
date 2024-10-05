// src/mongo/mongo.ts

import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://myAtlasDBUser:Mazo2001@cluster0.macmdp1.mongodb.net/edw-redbox?retryWrites=true&w=majority&appName=Cluster0";

const connectToDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Conectado a la base de datos MongoDB");
  } catch (error) {
    console.error("Error al conectar a la base de datos:", error);
  }
};

export default connectToDatabase;
