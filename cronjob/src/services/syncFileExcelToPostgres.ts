import { google } from "googleapis";
import { GoogleAuth } from "google-auth-library";
import * as fs from "fs";
import { elizaLogger } from "@elizaos/core";
const credentialsPath = "../certificate.json";
const spreadsheetId = "12l01g0tP4qA7YdX4Bz5300aOgFakRsr1uTXl_0AVOHE"; // ID of Google Sheet
const range = "Projects!A1:D10";

async function readGoogleSheet(job:any): Promise<void> {
  try {
    if (!fs.existsSync(credentialsPath)) {
      throw new Error("❌ File credentials không tồn tại.");
    }

    const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf-8"));

    const auth: GoogleAuth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    elizaLogger.info("✅ Data of Google Sheets:", response.data.values);
  } catch (error) {
    elizaLogger.info("❌ Lỗi khi đọc Google Sheets:", error);
  }
}

