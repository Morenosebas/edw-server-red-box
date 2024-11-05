import "module-alias/register";
import express, { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import db from "@mongo/mongo";
import cors from "cors";
import "@controllers/moment";
// import chalk from "chalk";
const chalk = require("chalk");
db();
dotenv.config();

declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
morgan.token("body", (req: Request, res) => JSON.stringify(req.body));
morgan.token("id", function getId(req: Request) {
  return req.id;
});
app.use(
  morgan(
    chalk.blue(":method") +
      " " +
      chalk.green(":url") +
      " " +
      chalk.yellow(":status") +
      " " +
      chalk.magenta(":body") +
      " - " +
      chalk.cyan(":response-time ms"),
    {
      skip: (req, res) => req.url.includes("/redbox/api/imagen/"),
    }
  )
);

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

import uuid from "uuid";
function assignId(req: Request, res: Response, next: NextFunction) {
  req.id = uuid.v4();
  next();
}
