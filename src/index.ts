import 'module-alias/register'; 
import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import db from "@mongo/mongo";
import cors from "cors";
import momentz from "moment-timezone";
db();
dotenv.config();

momentz.tz.setDefault("America/New_York");
db();

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(morgan("dev"));

app.use(express.json());

import imagesRoutes from "@routes/images.routes";
app.use("/api", imagesRoutes);
import userRoutes from "@routes/user.routes";
app.use("/api", userRoutes);
import sitiosRoutes from "@routes/sitios.routes";
app.use("/api", sitiosRoutes);
import reportesRoutes from "@routes/reportes.routes";
app.use("/api", reportesRoutes);

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(PORT, () => {
  console.log("Server is running on PORT: " + PORT);
});
