import { Schema, model, models, Document } from "mongoose";

export interface Sitios {
  KioskId: string;
  ParentName?: string;
  store_id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  tienda_nombre?: string;
}
export type SitiosModel = Sitios & Document;
const SitiosSchema = new Schema<SitiosModel>({
  KioskId: {
    type: String,
    required: true,
    set: (v: string) => v.toString().trim(),
  },
  ParentName: {
    type: String,
    default: "Wal-Mart Stores Inc",
    set: (v: string) => v.toString().trim(),
  },
  store_id: {
    type: String,
    required: true,
    set: (v: string) => v.toString().trim(),
  },
  address: {
    type: String,
    required: true,
    set: (v: string) => v.toString().trim(),
  },
  city: {
    type: String,
    required: true,
    set: (v: string) => v.toString().trim(),
  },
  state: {
    type: String,
    required: true,
    set: (v: string) => v.toString().trim(),
  },
  zip_code: {
    type: String,
    required: true,
    set: (v: string) => v.toString().trim(),
  },
  tienda_nombre: { type: String },
});

const SITIOSMODEL = models.Sitios || model<SitiosModel>("Sitios", SitiosSchema);
export default SITIOSMODEL;
