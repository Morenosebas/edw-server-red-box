// src/routes/reportes.routes.ts

import type { Request, Response } from "express";
import { Router } from "express";
import path from "path";
import fs from "fs";

const router = Router();

// Rutas existentes (insertar_reportes, actualizar_reporte, etc.)

// Nueva ruta para servir imágenes
router.get("/imagen/:src", async (req: Request, res: Response) => {
  try {
    const encodedPath = req.query.src as string;

    // Verifica que el parámetro 'path' exista y sea una cadena
    if (!encodedPath || typeof encodedPath !== "string") {
      res.status(400).json({
        error:
          "El parámetro 'path' es requerido y debe ser una cadena codificada en Base64.",
      });
      return;
    }

    // Decodifica el 'path' desde Base64 usando Buffer
    let decodedPath: string;
    try {
      decodedPath = Buffer.from(encodedPath, "base64").toString("utf-8");
    } catch (decodeError) {
      res.status(400).json({
        error: "El parámetro 'path' no es una cadena válida en Base64.",
      });
      return;
    }

    const imagePath = decodedPath;

    // Verifica que el parámetro 'path' exista y sea una cadena
    if (!imagePath || typeof imagePath !== "string") {
      res.status(400).json({
        error: "Parámetro 'path' es requerido y debe ser una cadena.",
      });
      return;
    }

    // Define el directorio base de uploads
    const uploadsDir = path.join(__dirname.split("src")[0], "uploads");

    // Construye la ruta absoluta del archivo
    const absolutePath = path.join(uploadsDir, imagePath);

    // Previene ataques de path traversal verificando que la ruta absoluta empiece con el directorio de uploads
    if (!absolutePath.startsWith(uploadsDir)) {
      res.status(400).json({ error: "Path de imagen inválido." });
      return;
    }

    // Verifica que el archivo exista
    if (!fs.existsSync(absolutePath)) {
      res.status(404).json({ error: "Imagen no encontrada." });
      return;
    }

    // Obtiene la extensión del archivo para establecer el Content-Type adecuado
    const ext = path.extname(absolutePath).toLowerCase();
    let contentType = "application/octet-stream"; // Default

    switch (ext) {
      case ".jpg":
      case ".jpeg":
        contentType = "image/jpeg";
        break;
      case ".png":
        contentType = "image/png";
        break;
      case ".webp":
        contentType = "image/webp";
        break;
      case ".gif":
        contentType = "image/gif";
        break;
      // Añade más casos si soportas otros formatos
    }

    // Establece el Content-Type y envía el archivo
    res.setHeader("Content-Type", contentType);
    res.sendFile(absolutePath);
  } catch (error) {
    console.error("Error al servir la imagen:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

export default router;
