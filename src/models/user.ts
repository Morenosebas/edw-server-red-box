import { Schema, Document, model, models } from "mongoose";
export interface UserInterface {
  name: string;
  username: string;
  password: string;
}
export type UserIModel = UserInterface & Document;

const UserSchema = new Schema({
  name: { type: String, required: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
});

const USERMODEL = model<UserIModel>("User", UserSchema) || models.User;
export default USERMODEL;
