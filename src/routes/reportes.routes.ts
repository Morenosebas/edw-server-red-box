// src/routes/reportes.routes.ts

import type { Request, Response } from "express";
import { Router } from "express";
import REPORTE_TRABAJO_MODEL from "@/models/reporte_trabajo";
import { ReporteTrabajo } from "@/models/reporte_trabajo";
import sharp from "sharp";
import upload from "@/controllers/uploadImages"; // Asegúrate de que esta ruta sea correcta
import path from "path";
import fs from "fs";
import moment from "moment";
import mongoose from "mongoose";
import SITIOSMODEL from "@/models/sitios";

const router = Router();

// Configuración de campos para Multer
const uploadFields = upload.fields([
  { name: "PictBOX", maxCount: 1 },
  { name: "PictBef", maxCount: 1 },
  { name: "PictDef", maxCount: 1 },
  { name: "PictAft", maxCount: 1 },
]);

router.post(
  "/insertar_reportes",
  uploadFields,
  async (req: Request, res: Response): Promise<void> => {
    // Tipo de retorno void
    try {
      // Extrae los datos del cuerpo de la solicitud
      const { KioskId, nota, name_tecnico } = req.body;

      // Verifica que los archivos estén presentes
      if (!req.files) {
        res.status(400).json({ error: "No se subieron los archivos" });
        return;
      }

      const files = req.files as {
        [fieldname: string]: Express.Multer.File[];
      };

      const processedFiles: { [key: string]: string | null } = {};

      for (const field in files) {
        const fileArray = files[field];
        if (fileArray && fileArray.length > 0) {
          const file = fileArray[0];
          const buffer = file.buffer;

          // Genera un nombre de archivo único
          const uniqueSuffix = `${Date.now()}-${Math.round(
            Math.random() * 1e9
          )}`;
          const extension = ".webp"; // Fallback a .webp
          const filename = `${uniqueSuffix}${extension}`;

          // Construye la ruta de subida
          const uploadDir = path.join(
            __dirname.split("src")[0],
            "uploads/",
            KioskId || "default"
          );

          // Asegura que el directorio exista
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }

          const filepath = path.join(uploadDir, filename);

          // Procesa la imagen con Sharp
          await sharp(buffer)
            .resize(800, 800, {
              fit: sharp.fit.contain,
              withoutEnlargement: true,
            })
            .toFormat("webp") // Convertir a webp
            .webp({ quality: 90 }) // Calidad del 90%
            .toFile(filepath);

          // Guarda la ruta relativa para la base de datos
          processedFiles[field] = path.relative(
            path.join(__dirname.split("src")[0], "uploads"),
            filepath
          );
        }
      }
      const fecha = moment().toDate();
      // Crea una nueva instancia del modelo con las rutas de las imágenes
      const newReporte = new REPORTE_TRABAJO_MODEL({
        KioskId,
        fecha,
        nota,
        name_tecnico,
        PictBOX: processedFiles["PictBOX"] || null,
        PictBef: processedFiles["PictBef"] || null,
        PictDef: processedFiles["PictDef"] || null,
        PictAft: processedFiles["PictAft"] || null,
      });

      // Guarda en la base de datos
      const savedReporte = await newReporte.save();

      // Envía la respuesta al cliente
      res.status(201).json(savedReporte);
    } catch (error) {
      console.error(error);
      // Manejo de errores
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
);

router.patch(
  "/actualizar_reporte/:id",
  uploadFields,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // Validar que el ID es un ObjectId válido de MongoDB
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ error: "ID de reporte inválido" });
        return;
      }

      // Buscar el reporte existente
      const reporteExistente = await REPORTE_TRABAJO_MODEL.findById(id);
      if (!reporteExistente) {
        res.status(404).json({ error: "Reporte no encontrado" });
        return;
      }

      // Extraer los campos que se pueden actualizar del cuerpo de la solicitud
      const { nota, name_tecnico } = req.body;

      // Crear un objeto para almacenar las actualizaciones
      const actualizaciones: Partial<{
        nota: string;
        name_tecnico: string;
        PictBOX: string;
        PictBef: string;
        PictDef: string;
        PictAft: string;
      }> = {};

      // Actualizar los campos permitidos si están presentes
      if (nota !== undefined) actualizaciones.nota = nota;
      if (name_tecnico !== undefined)
        actualizaciones.name_tecnico = name_tecnico;

      // Verificar si se han subido archivos
      if (req.files) {
        const files = req.files as {
          [fieldname: string]: Express.Multer.File[];
        };

        for (const field in files) {
          const fileArray = files[field];
          if (fileArray && fileArray.length > 0) {
            const file = fileArray[0];
            const buffer = file.buffer;

            // Generar un nombre de archivo único
            const uniqueSuffix = `${Date.now()}-${Math.round(
              Math.random() * 1e9
            )}`;
            const extension = ".webp"; // Convertir a .webp
            const filename = `${uniqueSuffix}${extension}`;

            // Construir la ruta de subida
            const uploadDir = path.join(
              __dirname.split("src")[0],
              "uploads/",
              reporteExistente.KioskId || "default"
            );

            // Asegurar que el directorio exista
            if (!fs.existsSync(uploadDir)) {
              fs.mkdirSync(uploadDir, { recursive: true });
            }

            const filepath = path.join(uploadDir, filename);

            // Procesar la imagen con Sharp
            await sharp(buffer)
              .resize(800, 800, {
                fit: sharp.fit.contain,
                withoutEnlargement: true,
              })
              .toFormat("webp") // Convertir a webp
              .webp({ quality: 90 }) // Calidad del 90%
              .toFile(filepath);

            // Guardar la ruta relativa para la base de datos
            const relativePath = path.relative(
              path.join(__dirname.split("src")[0], "uploads"),
              filepath
            );

            // Asignar la nueva ruta al objeto de actualizaciones
            // @ts-ignore
            actualizaciones[field] = relativePath;

            // Opcional: Eliminar la imagen antigua si existe
            const campoImagen = reporteExistente[
              field as keyof typeof reporteExistente
            ] as string | undefined;
            if (campoImagen) {
              const rutaAntigua = path.join(
                __dirname.split("src")[0],
                "uploads",
                campoImagen
              );
              fs.unlink(rutaAntigua, (err) => {
                if (err) {
                  console.error(
                    `Error al eliminar la imagen antigua en ${rutaAntigua}:`,
                    err
                  );
                }
              });
            }
          }
        }
      }

      // Actualizar el reporte en la base de datos
      const reporteActualizado = await REPORTE_TRABAJO_MODEL.findByIdAndUpdate(
        id,
        { $set: actualizaciones },
        { new: true } // Para devolver el documento actualizado
      );
      res.status(200).json(reporteActualizado);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
);

router.get("/reporte/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const reporte = await REPORTE_TRABAJO_MODEL.findById(id);
    if (!reporte) {
      res.status(404).json({ error: "Reporte no encontrado" });
      return;
    }
    const sitio = await SITIOSMODEL.findOne({
      KioskId: reporte.KioskId,
    });
    if (!sitio) {
      res.status(404).json({ error: "Sitio no encontrado" });
      return;
    }

    const response: {
      reporte: {
        KioskId: string;
        fecha: string;
        PictBOX?: string;
        PictBef?: string;
        PictDef?: string;
        PictAft?: string;
        nota: string;
        name_tecnico: string;
        address: string;
        city: string;
        state: string;
        zip: string;
        code: number;
        store_id: string;
      };
    } = {
      reporte: {
        KioskId: reporte.KioskId,
        fecha: moment(reporte.fecha).format("YYYY-MM-DD"),
        PictBOX: reporte.PictBOX,
        PictBef: reporte.PictBef,
        PictDef: reporte.PictDef,
        PictAft: reporte.PictAft,
        nota: reporte.nota,
        name_tecnico: reporte.name_tecnico,
        address: sitio.address,
        city: sitio.city,
        state: sitio.state,
        zip: sitio.zip_code,
        code: reporte.code,
        store_id: sitio.store_id,
      },
    };
    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

//lista de reportes sin paginar

router.get("/reportes", async (req: Request, res: Response) => {
  try {
    const reportes = await REPORTE_TRABAJO_MODEL.find(
      {},
      { KioskId: 1, fecha: 1, nota: 1, name_tecnico: 1, code: 1 }
    );
    const sitios = await SITIOSMODEL.find(
      { KioskId: { $in: reportes.map((reporte) => reporte.KioskId) } },
      { KioskId: 1, store_id: 1 }
    );
    console.log(sitios);
    const reportesConSitio = reportes.map((reporte) => {
      const sitio = sitios.find((s) => s.KioskId === reporte.KioskId);

      return {
        KioskId: reporte.KioskId,
        fecha: moment(reporte.fecha).format("YYYY-MM-DD"),
        nota: reporte.nota,
        name_tecnico: reporte.name_tecnico,
        code: reporte.code,
        store_id: sitio?.store_id,
        _id: reporte._id,
      };
    });
    res.status(200).json(reportesConSitio);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;