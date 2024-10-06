import type { UserIModel } from "@models/user";
import type { Request, Response } from "express";
import { Router } from "express";
import USERMODEL from "@models/user";
import brcypt from "bcrypt";
import jsonwebtoken from "jsonwebtoken";
const router = Router();

const comparePassword = async (password: string, hash: string) => {
  return await brcypt.compare(password, hash);
};
const hashPassword = async (password: string) => {
  return await brcypt.hash(password, 10);
};

router.post("/insert_users", async (req: Request, res: Response) => {
  const names = req.body.names as {
    name: string;
  }[];
  try {
    const users = names.map(async (name) => {
      const username = name.name.split(" ")[0] + name.name.split(" ")[1][0];
      if (!name.name.includes("Edwin")) {
        return await USERMODEL.create({
          name: name.name,
          username: username,
          password: await hashPassword(username),
        });
      } else {
        return await USERMODEL.create({
          name: name.name,
          username: "admin",
          password: await hashPassword("admin"),
        });
      }
    });
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
    res.status(200).json({ token });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    }
  }
});

router.get("/tecnicos", async (req: Request, res: Response) => {
  try {
    const users = await USERMODEL.find({}, { name: 1 });
    res.status(200).json({ users: users.map((user) => user.name) });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    }
  }
});

export default router;
