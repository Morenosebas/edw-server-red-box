// src/middleware/upload.ts
import multer from "multer";
import path from "path";
import fs from "fs";
// Configuración de almacenamiento
const storage = multer.memoryStorage()

// Filtro para aceptar solo ciertos tipos de archivos (opcional)
const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Por ejemplo, aceptar solo imágenes
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Solo se permiten archivos de imagen"));
  }
};

const upload = multer({ storage, fileFilter });

export default upload;
