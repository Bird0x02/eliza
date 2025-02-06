import * as fs from "fs";
import * as xlsx from "xlsx";
import { elizaLogger } from "@elizaos/core";

const excelFilePath = "../data.xlsx";

export default async function readExcelFile(job: any): Promise<void> {
  try {

    if (!fs.existsSync(excelFilePath)) {
      throw new Error("❌ File Excel không tồn tại.");
    }


    const workbook = xlsx.readFile(excelFilePath);

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];


    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

    elizaLogger.info("✅ Data of Excel Sheet:", data);
  } catch (error) {
    elizaLogger.info("❌ Lỗi khi đọc file Excel:", error);
  }
}