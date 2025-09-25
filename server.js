import express from "express";
import bodyParser from "body-parser";
import { google } from "googleapis";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();
const app = express();
app.use(bodyParser.json());

// Load credentials from service account key file
const credentials = JSON.parse(fs.readFileSync("service-account.json"));

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

// Your Google Sheet ID (replace with yours!)
const SPREADSHEET_ID = process.env.SHEET_ID;

// Endpoint to log call details
app.post("/log", async (req, res) => {
  try {
    const { tab, full_name, phone, details } = req.body;

    if (!tab || !full_name || !phone || !details) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Timestamp
    const timestamp = new Date().toLocaleString();

    // Add new row to the correct tab
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${tab}!A:D`, // Timestamp, Name, Phone, Details
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[timestamp, full_name, phone, details]],
      },
    });

    res.json({ success: true, message: "Entry logged successfully" });
  } catch (error) {
    console.error("Error saving to Google Sheets:", error);
    res.status(500).json({ error: "Failed to log entry" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
