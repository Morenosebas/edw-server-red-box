import type { Request, Response } from "express";
import { Router } from "express";
import SITIOSMODEL from "@/models/sitios";
import type { Sitios, SitiosModel } from "@/models/sitios";
import * as xlsx from "xlsx";
import fs from "fs/promises";
import REPORTE_TRABAJO_MODEL from "@/models/reporte_trabajo";
const router = Router();

//insertar sitios desde un xlsx a la base de datos
router.get("/insertar_sitios", async (req: Request, res: Response) => {
  try {
    const doc = await fs.readFile(
      "/home/edwin/Desktop/edw-server-red-box/src/routes/Walmart_Dollar General - Red Box Removal - Store List.xlsx"
    );
    const workbook = xlsx.read(doc, { type: "buffer" });
    const sheet_name_list = workbook.SheetNames;

    const sheet = workbook.Sheets[sheet_name_list[0]];
    const data = xlsx.utils.sheet_to_json(sheet);
    // const sitios: Sitios[] = data.map((sitio: any, index: number) => {
    //   console.log("sitio ", index, sitio);
    //   return {
    //     address: sitio[address],
    //     city: sitio[city],
    //     KioskId: sitio[kioskId],
    //     state: sitio[state],
    //     store_id: sitio[storeNumber],
    //     zip_code: sitio[zipCode],
    //   };
    // });
    const sitios: Sitios[] = [];

    const brandCollumn = "Brand";
    const kioskId = "Kiosk ID";
    const storeNumber = "Store #";
    const address = "Address";
    const city = "City";
    const state = "State";
    const zipCode = "Zip";

    for (const sitio of data) {
      //index
      const index = data.indexOf(sitio);
      if (index === 3623) break;
      const site = sitio as {
        __rowNum__: number;
        Brand: string;
        "Kiosk ID": number;
        "Store #": number;
        Address: string;
        City: string;
        State: string;
        Zip: string;
        "Indoor/ Outdoor": string;
      };
      // if (!site.Zip) console.log("sitio ", index, site);
      sitios.push({
        ParentName:site["Brand"] as string,
        address: site[address] as string,
        city: site[city] as string,
        KioskId: site[kioskId].toString() as string,
        state: site[state] as string,
        store_id: site[storeNumber].toString() as string,
        zip_code: site[zipCode] || "no zip code",
      });
    }
    await SITIOSMODEL.insertMany(sitios);
    res.status(200).json({ message: "Sitios insertados correctamente" });
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
      res.status(400).json({ error: error.message });
    }
  }
});

router.get("/sitios/:KioskId", async (req: Request, res: Response) => {
  try {
    const KioskId = req.params.KioskId as string;
    const sitio = await SITIOSMODEL.findOne({ KioskId: KioskId });
    if (!sitio) {
      res.status(404).json({ error: "Sitio no encontrado" });
      return;
    }
    res.status(200).json({ sitio: sitio.toJSON() });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    }
  }
});
router.get("/kiosks", async (req: Request, res: Response) => {
  try {
    const kiosks = await SITIOSMODEL.find({}, { KioskId: 1 });
    const existReports = await REPORTE_TRABAJO_MODEL.find({}, { KioskId: 1 });

    res.status(200).json({
      kiosks: kiosks
        .map((kiosk) => kiosk.KioskId)
        .filter(
          (kiosk) =>
            !existReports.some(
              (report) => report.KioskId.toString() === kiosk.toString()
            )
        ),
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    }
  }
});

export default router;
