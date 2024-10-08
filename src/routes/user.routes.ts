import type { UserIModel } from "@models/user";
import type { Request, Response } from "express";
import { Router } from "express";
import USERMODEL from "@models/user";
import brcypt from "bcrypt";
import jsonwebtoken from "jsonwebtoken";
import jwt from "jsonwebtoken";
const router = Router();

const comparePassword = async (password: string, hash: string) => {
  return await brcypt.compare(password, hash);
};
const hashPassword = async (password: string) => {
  return await brcypt.hash(password, 10);
};

router.get("/insert_users", async (req: Request, res: Response) => {
  const users = [
    { name: "Yackey", lastName: "Delgado", password: "1234" },
    { name: "Reinel", lastName: "Patino", password: "5678" },
    { name: "Omar", lastName: "Romero", password: "9101" },
    { name: "Alexander", lastName: "Bastidas", password: "2345" },
    { name: "Jhon", lastName: "Araujo", password: "6789" },
    { name: "Jose", lastName: "Valero", password: "3456" },
    { name: "Jesus", lastName: "Jurado", password: "7890" },
    { name: "Jairo", lastName: "Ramirez", password: "4567" },
    { name: "Edwin", lastName: "Romero", password: "8901" },
    { name: "Pedro", lastName: "Jurado", password: "5678" },
  ];

  try {
    const createdUsers = await Promise.all(
      users.map(async (user) => {
        const username = `${user.name}${user.lastName.charAt(0)}`;
        const hashedPassword = await hashPassword(user.password);

        return await USERMODEL.create({
          name: user.name,
          username: username,
          password: hashedPassword,
          role: "USER", // Asegurando que no sean admins
        });
      })
    );

    res
      .status(201)
      .json({ message: "Users created successfully", users: createdUsers });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    }
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const user = (await USERMODEL.findOne({
      username: req.body.username,
    })) as UserIModel | null;
    if (!user) {
      throw new Error("User not found");
    }
    const isMatch = await comparePassword(req.body.password, user.password);
    if (!isMatch) {
      throw new Error("Invalid password");
    }
    const token = await jsonwebtoken.sign(
      { id: user._id, name: user.name, username: user.username },
      "mysecret"
    );
    res.status(200).json({ token, username: user.username });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    }
  }
});

router.post("/register", async (req: Request, res: Response) => {
  try {
    const user = await USERMODEL.create({
      name: req.body.name,
      username: req.body.username,
      password: await hashPassword(req.body.password),
    });
    res.status(201).json({ user });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    }
  }
});

router.get("/tecnicos", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      res.status(401).json({ error: "No autorizado" });
      return;
    }
    const decode = jwt.decode(token) as {
      username: string;
      name: string;
    };
    if (!decode) {
      res.status(401).json({ error: "No autorizado" });
      return;
    }
    const query =
      decode.username === "EdwinR" ? {} : { username: decode.username };
    const users = await USERMODEL.find(query, { name: 1 });
    res.status(200).json({ users: users.map((user) => user.name) });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    }
  }
});

export default router;
