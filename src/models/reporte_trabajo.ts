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
  PictBOX: { type: String, required: true },
  PictBef: { type: String, required: true },
  PictDef: { type: String, required: true },
  PictAft: { type: String, required: true },
  nota: { type: String, required: true },
  name_tecnico: { type: String, required: true },
});

const REPORTE_TRABAJO_MODEL =
  models.ReporteTrabajo ||
  model<ReporteTrabajoModel>("ReporteTrabajo", ReporteTrabajoSchema);

export default REPORTE_TRABAJO_MODEL;
