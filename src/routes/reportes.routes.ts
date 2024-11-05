// src/routes/reportes.routes.ts

import type { Request, Response } from "express";
import { Router } from "express";
import REPORTE_TRABAJO_MODEL from "@/models/reporte_trabajo";
import { ReporteTrabajo } from "@/models/reporte_trabajo";
import sharp from "sharp";
import upload from "@/controllers/uploadImages"; // Asegúrate de que esta ruta sea correcta
import path from "path";
import fs from "fs";
import mongoose from "mongoose";
import SITIOSMODEL from "@/models/sitios";
import puppeteer, { Browser } from "puppeteer";
import jwt from "jsonwebtoken";
import moment from "@controllers/moment";
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
      const {
        KioskId,
        nota,
        name_tecnico,
        field: fieldChange,
        fecha,
      } = req.body;
      const sitio = await SITIOSMODEL.findOne({ KioskId });
      if (!sitio) {
        res.status(500).json({ error: "Sitio no encontrado" });
        return;
      }
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
            .withMetadata()
            .resize(800, 800, {
              fit: sharp.fit.fill,
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
      const formatedDate = moment(fecha).format("YYYY-MM-DD");
      // Crea una nueva instancia del modelo con las rutas de las imágenes
      const newReporte = new REPORTE_TRABAJO_MODEL({
        KioskId,
        fecha: formatedDate,
        nota,
        name_tecnico,
        PictBOX: processedFiles["PictBOX"] || null,
        PictBef: processedFiles["PictBef"] || null,
        PictDef: processedFiles["PictDef"] || null,
        PictAft: processedFiles["PictAft"] || null,
        field: fieldChange || "",
      });

      // Guarda en la base de datos
      const savedReporte = await newReporte.save();

      // Envía la respuesta al cliente
      res.status(201).json(savedReporte);
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        if (error.message.includes("E11000")) {
          res
            .status(500)
            .json({ error: "The KIOSKID already has a report.  " });
        } else {
          res.status(500).json({ error: "Server error" });
        }
      }
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
      const {
        nota,
        name_tecnico,
        field: fieldChange = "",
        fecha,
      }: {
        nota: string;
        name_tecnico: string;
        field: string;
        fecha: string;
      } = req.body;

      // Crear un objeto para almacenar las actualizaciones
      const actualizaciones: Partial<{
        nota: string;
        name_tecnico: string;
        PictBOX: string;
        PictBef: string;
        PictDef: string;
        PictAft: string;
        field: string;
        fecha: string;
      }> = {};

      // Actualizar los campos permitidos si están presentes
      if (nota !== undefined) actualizaciones.nota = nota;
      if (name_tecnico !== undefined)
        actualizaciones.name_tecnico = name_tecnico;
      if (fecha !== undefined) {
        const formatedDate = moment(fecha[0]).format("YYYY-MM-DD");
        actualizaciones.fecha = formatedDate;
      }
      if (fieldChange !== undefined) actualizaciones.field = fieldChange;
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
              .withMetadata()
              .resize(800, 800, {
                fit: sharp.fit.fill,
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
        _id: string;
        field: string;
        ParentName: string;
      };
    } = {
      reporte: {
        _id: id,
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
        field: reporte?.field || "",
        ParentName: sitio.ParentName as string,
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
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      res.status(401).json({ error: "No autorizado" });
      return;
    }
    const decode = jwt.decode(token) as {
      username: string;
      name: string;
    };

    const query =
      decode.username === "EdwinR" ? {} : { name_tecnico: decode.name };
    const reportes = await REPORTE_TRABAJO_MODEL.find(query, {
      KioskId: 1,
      fecha: 1,
      nota: 1,
      name_tecnico: 1,
      code: 1,
    }).sort({ _id: -1 });
    const sitios = await SITIOSMODEL.find(
      { KioskId: { $in: reportes.map((reporte) => reporte.KioskId) } },
      { KioskId: 1, store_id: 1, address: 1 }
    );
    const reportesConSitio = reportes.map((reporte) => {
      const sitio = sitios.find((s) => s.KioskId === reporte.KioskId);

      return {
        KioskId: reporte.KioskId,
        fecha: moment(reporte.fecha).format("YYYY-MM-DD"),
        nota: reporte.nota,
        name_tecnico: reporte.name_tecnico,
        code: reporte.code,
        store_id: sitio?.store_id,
        address: sitio?.address,
        _id: reporte._id,
      };
    });
    res.status(200).json(reportesConSitio);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/reportes/public", async (req: Request, res: Response) => {
  try {
    const reportes = await REPORTE_TRABAJO_MODEL.find(
      {},
      {
        KioskId: 1,
        fecha: 1,
        nota: 1,
        name_tecnico: 1,
        code: 1,
      }
    ).sort({ _id: -1 });
    const sitios = await SITIOSMODEL.find(
      { KioskId: { $in: reportes.map((reporte) => reporte.KioskId) } },
      { KioskId: 1, store_id: 1, address: 1 }
    );
    const reportesConSitio = reportes.map((reporte) => {
      const sitio = sitios.find((s) => s.KioskId === reporte.KioskId);

      return {
        KioskId: reporte.KioskId,
        fecha: moment(reporte.fecha).format("YYYY-MM-DD"),
        nota: reporte.nota,
        name_tecnico: reporte.name_tecnico,
        code: reporte.code,
        store_id: sitio?.store_id,
        address: sitio?.address,
        _id: reporte._id,
      };
    });
    res.status(200).json(reportesConSitio);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.delete("/reporte/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const reporte = await REPORTE_TRABAJO_MODEL.findById(id);
    if (!reporte) {
      res.status(404).json({ error: "Reporte no encontrado" });
      return;
    }
    await REPORTE_TRABAJO_MODEL.findByIdAndDelete(id);
    res.status(200).json({ message: "Reporte eliminado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

interface InfoReportePersonal {
  _id: string;
  KioskId: number;
  fecha: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  name_tecnico: string;
}

router.get("/reportes/personal", async (req: Request, res: Response) => {
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
    const query =
      decode.username === "EdwinR" ? {} : { name_tecnico: decode.name };

    const reportes = await REPORTE_TRABAJO_MODEL.find(query, {
      KioskId: 1,
      fecha: 1,
      name_tecnico: 1,
    }).sort({ _id: -1 });
    const sitios = await SITIOSMODEL.find(
      { KioskId: { $in: reportes.map((reporte) => reporte.KioskId) } },
      { KioskId: 1, address: 1, city: 1, state: 1, zip_code: 1 }
    );
    const reportesConSitio = reportes.map((reporte) => {
      const sitio = sitios.find((s) => s.KioskId === reporte.KioskId);
      return {
        _id: reporte._id,
        KioskId: reporte.KioskId,
        fecha: moment(reporte.fecha).format("YYYY-MM-DD"),
        address: sitio?.address || "",
        city: sitio?.city || "",
        state: sitio?.state || "",
        zipCode: sitio?.zip_code || "",
        name_tecnico: reporte.name_tecnico,
      };
    });
    res.status(200).json(reportesConSitio);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

import { promisify } from "util";

const unlinkAsync = promisify(fs.unlink);

router.get("/reportes/pdf/:id", async (req: Request, res: Response) => {
  let browser: Browser | null = null;
  try {
    const { id } = req.params;

    // Lanzar Puppeteer
    browser = await puppeteer.launch({
      headless: true, // Cambia a 'false' si quieres ver la operación de Puppeteer
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.goto(`http://localhost:3003/redbox/reporteCarta/${id}`, {
      waitUntil: "networkidle0",
    });
    const reporte = await REPORTE_TRABAJO_MODEL.findById(id);
    if (!reporte) {
      res.status(404).json({ error: "Reporte no encontrado" });
      return;
    }
    // Generar el PDF y guardarlo en un archivo temporal
    const pdfPath = path.join(__dirname, `report_${reporte.KioskId}.pdf`);
    await page.pdf({
      path: pdfPath, // Guardar el PDF en la ruta especificada
      format: "LETTER",
      printBackground: true,
      waitForFonts: true,
      pageRanges: "1",
    });

    // Descargar el archivo PDF
    res.download(pdfPath, `report_${reporte.KioskId}.pdf`, async (err) => {
      if (err) {
        console.error("Error al descargar el archivo:", err);
        res.status(500).json({ error: "Error al descargar el archivo" });
      }

      // Eliminar el archivo temporal después de la descarga
      try {
        await unlinkAsync(pdfPath);
      } catch (error) {
        console.error("Error al eliminar el archivo:", error);
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error generando el PDF:", error);
      res.status(500).json({ error: error.message });
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

// import JSZip from "jszip";
import archiver from "archiver";
import { Readable } from "stream";
router.get(
  "/reportes/pdf",
  async (req: Request, res: Response): Promise<void> => {
    try {
      // **1. Autenticación y Extracción de Parámetros**
      const token = req.headers.authorization?.split(" ")[1];
      const { minDate, maxDate } = req.query;
      const minDateMoment = minDate ? moment(minDate as string) : null;
      const maxDateMoment = maxDate ? moment(maxDate as string) : null;

      if (!token) {
        res.status(401).json({ error: "No autorizado" });
        return;
      }

      const decode = jwt.decode(token) as {
        username: string;
        name: string;
      };
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", "attachment; filename=reportes.zip");
      // **2. Construcción de la Consulta**
      const query =
        decode.username === "EdwinR"
          ? {
              fecha: {
                $gte: minDateMoment?.toDate(),
                $lte: maxDateMoment?.endOf("day").toDate(),
              },
            }
          : {
              name_tecnico: decode.name,
              fecha: {
                $gte: minDateMoment?.toDate(),
                $lte: maxDateMoment?.endOf("day").toDate(),
              },
            };

      // **3. Recuperación de Reportes**
      const reportes = await REPORTE_TRABAJO_MODEL.find(query, {
        KioskId: 1,
        fecha: 1,
        name_tecnico: 1,
      });

      if (reportes.length === 0) {
        res.status(404).json({ error: "No se encontraron reportes" });
        return;
      }

      // **4. Inicialización de Puppeteer**
      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const pdfs: { path: string; pdf: Buffer }[] = [];
      let index = 0;
      const page = await browser.newPage();

      // **5. Generación de PDFs con `for...of`**

      const archive = archiver("zip", { zlib: { level: 9 } });
      archive.on("error", (err) => {
        console.error("Error en el archivo ZIP:", err);
        if (!res.headersSent) {
          res.status(500).end("Error in the archive.");
        } else {
          res.end();
        }
      });
      archive.pipe(res);

      for (const reporte of reportes) {
        try {
          await page.goto(
            `http://localhost:3003/redbox/reporteCarta/${reporte._id}`,
            {
              waitUntil: "networkidle0",
              timeout: 10000,
            }
          );

          const pdfBuffer = await page.createPDFStream({
            format: "LETTER",
            printBackground: true,
            waitForFonts: true,
            pageRanges: "1",
            // Puedes ajustar otras opciones según tus necesidades
          });

          // pdfs.push({
          //   path: `report_${reporte.KioskId}_${index}.pdf`,
          //   pdf: pdfBuffer as Buffer,
          // });
          const nodeReadableStream = Readable.fromWeb(pdfBuffer as any);
          archive.append(nodeReadableStream, {
            name: `report_${reporte.KioskId}_${index}.pdf`,
          });
          nodeReadableStream.on("error", (err) => {
            console.error(
              `Error en el stream del reporte ${reporte._id}:`,
              err
            );
            archive.destroy(err); // Esto emitirá 'error' en Archiver
          });

          console.log(
            `PDF generado para el reporte ${reporte._id} index ${index}`
          );
          index++;
        } catch (error) {
          console.error(
            `Error generando el PDF para reporte ${reporte._id}:`,
            error
          );
        }
      }
      await new Promise<void>((resolve, reject) => {
        archive
          .finalize()
          .then(() => {
            console.log("Archivo ZIP finalizado.");
          })
          .catch((err) => {
            console.error("Error al finalizar Archiver:", err);
            reject(err);
          });

        archive.on("close", async () => {
          await page.close();
          await browser.close();
          console.log("Puppeteer cerrado.");
          resolve();
        });

        archive.on("error", (err) => {
          console.error("Error en Archiver:", err);
          reject(err);
        });
      });

      if (pdfs.length === 0) {
        res.status(500).json({ error: "No se pudieron generar los PDFs" });
        return;
      }
      // **7. Creación del Archivo ZIP en Memoria**
      // const zip = new JSZip();
      // pdfs.forEach((pdf) => {
      //   zip.file(pdf.path, pdf.pdf);
      // });

      // const zipContent = await zip.generateAsync({
      //   type: "nodebuffer",
      //   compression: "DEFLATE",
      //   compressionOptions: { level: 9 },
      // });

      // **8. Configuración de las Cabeceras de Respuesta**
      // res.set({
      //   "Content-Type": "application/zip",
      //   "Content-Disposition": `attachment; filename=reportes.zip`,
      //   "Content-Length": zipContent.length,
      // });

      // **9. Envío del ZIP al Cliente**
      // res.send(zipContent);
    } catch (error) {
      console.error("Error generando el PDF:", error);
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Error desconocido" });
      }
    }
  }
);

import ExcelJS from "exceljs";

router.get("/reportes/excel", async (req, res) => {
  try {
    const { minDate, maxDate } = req.query;
    const minDateMoment = minDate ? moment(minDate.toString()) : moment(0);
    const maxDateMoment = maxDate
      ? moment(maxDate.toString()).endOf("day")
      : moment().endOf("day");

    const query = {
      fecha: {
        $gte: minDateMoment.toDate(),
        $lte: maxDateMoment.toDate(),
      },
    };

    const reportes = await REPORTE_TRABAJO_MODEL.find(query, {
      KioskId: 1,
      fecha: 1,
      name_tecnico: 1,
      nota: 1,
      code: 1,
      field: 1,
    });
    const sitios = await SITIOSMODEL.find(
      {},
      { KioskId: 1, store_id: 1, address: 1, city: 1, state: 1, zip_code: 1 }
    );

    const reportesConSitio = reportes.map((reporte) => {
      const sitio = sitios.find((s) => s.KioskId === reporte.KioskId);
      return {
        code: reporte.code.toString(),
        KioskId: reporte.KioskId,
        Date: moment(reporte.fecha).format("YYYY-MM-DD"),
        Technician: reporte.name_tecnico,
        Store: sitio?.store_id,
        Address: sitio?.address,
        City: sitio?.city,
        State: sitio?.state,
        Zip: sitio?.zip_code,
        Note: reporte.nota,
        Completed: "True",
        Field: reporte.field || "none",
      };
    });
    const sitiosSinReporte = sitios
      .filter(
        (sitio) =>
          !reportesConSitio.some((reporte) => reporte.KioskId === sitio.KioskId)
      )
      .map((sitio) => ({
        code: "",
        KioskId: sitio.KioskId,
        Date: "",
        Technician: "",
        Store: sitio.store_id,
        Address: sitio.address,
        City: sitio.city,
        State: sitio.state,
        Zip: sitio.zip_code,
        Note: "",
        Completed: "False",
        Field: "none",
      }));

    reportesConSitio.push(...sitiosSinReporte);

    // Crear una nueva instancia de Workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Reportes");

    // Definir las columnas
    worksheet.columns = [
      { header: "Code", key: "code", width: 15 },
      { header: "KioskId", key: "KioskId", width: 15 },
      { header: "Date", key: "Date", width: 15 },
      { header: "Technician", key: "Technician", width: 20 },
      { header: "Store", key: "Store", width: 15 },
      { header: "Address", key: "Address", width: 30 },
      { header: "City", key: "City", width: 20 },
      { header: "State", key: "State", width: 15 },
      { header: "Zip", key: "Zip", width: 15 },
      { header: "Note", key: "Note", width: 30 },
      { header: "Completed", key: "Completed", width: 15 },
      { header: "Field", key: "Field", width: 15 },
    ];

    // Agregar filas de datos
    reportesConSitio.forEach((reporte) => {
      worksheet.addRow(reporte);
    });

    // Aplicar estilos a la primera fila (encabezados)
    worksheet.getRow(1).eachCell((cell: ExcelJS.Cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0000FF" }, // Fondo azul
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    // Opcional: Aplicar estilos a todas las celdas
    worksheet.eachRow(
      { includeEmpty: false },
      (row: ExcelJS.Row, rowNumber: number) => {
        if (rowNumber !== 1) {
          // Saltar encabezados
          row.eachCell((cell: ExcelJS.Cell) => {
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
            cell.alignment = { vertical: "middle", horizontal: "left" };
            if (cell.value === "True") {
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FF00FF00" }, // Fondo verde
              };
            }
          });
        }
      }
    );

    // Generar el buffer del archivo Excel
    const buffer = await workbook.xlsx.writeBuffer();

    // Configurar las cabeceras de la respuesta
    res.setHeader("Content-Disposition", "attachment; filename=reportes.xlsx");
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    // Enviar el archivo Excel como respuesta
    res.send(buffer);
  } catch (error) {
    console.error("Error generando el Excel:", error);
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    }
  }
});
export default router;
