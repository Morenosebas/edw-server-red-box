import { Schema, model, models, Document } from "mongoose";
export interface ReporteTrabajo {
  KioskId: string;
  fecha: Date;
  PictBOX: string;
  PictBef: string;
  PictDef: string;
  PictAft: string;
  nota: string;
  name_tecnico: string;
}
export type ReporteTrabajoModel = ReporteTrabajo & Document;

const ReporteTrabajoSchema = new Schema<ReporteTrabajoModel>({
  KioskId: { type: String, required: true },
  fecha: { type: Date, required: true },
  PictBOX: { type: String },
  PictBef: { type: String },
  PictDef: { type: String },
  PictAft: { type: String },
  nota: { type: String },
  name_tecnico: { type: String, required: true },
});

const REPORTE_TRABAJO_MODEL =
  model<ReporteTrabajoModel>("ReporteTrabajo", ReporteTrabajoSchema) ||
  models.ReporteTrabajo;

export default REPORTE_TRABAJO_MODEL;
