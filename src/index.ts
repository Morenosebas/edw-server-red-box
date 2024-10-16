import "module-alias/register";
import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import db from "@mongo/mongo";
import cors from "cors";
import "@controllers/moment";
db();
dotenv.config();

db();

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(morgan("dev"));

app.use(express.json());

import imagesRoutes from "@routes/images.routes";
app.use("/redbox/api", imagesRoutes);
import userRoutes from "@routes/user.routes";
app.use("/redbox/api", userRoutes);
import sitiosRoutes from "@routes/sitios.routes";
app.use("/redbox/api", sitiosRoutes);
import reportesRoutes from "@routes/reportes.routes";
app.use("/redbox/api", reportesRoutes);

app.get("/redbox/api", (req, res) => {
  res.send("Hello World");
});

app.listen(PORT, () => {
  console.log("Server is running on PORT: " + PORT);
});
