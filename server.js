import express from "express";
import bodyParser from "body-parser";
import { google } from "googleapis";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// Load service account key
const auth = new google.auth.GoogleAuth({
  keyFile: "service-account.json", // make sure this file exists in root
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

const SPREADSHEET_ID = "1P5bgV1aQhjClyvry6H4E9-XSeKkF5bEFbr2elQk1B1E"; // your sheet id

// POST route to log call
app.post("/log", async (req, res) => {
  try {
    const { name, phone, address, details, type } = req.body;

    if (!name || !phone || !address || !details || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Decide which sheet tab to use
    let sheetName;
    if (type === "Job") sheetName = "Job";
    else if (type === "Emergency") sheetName = "Emergency";
    else if (type === "Inquiry") sheetName = "Inquiry";
    else return res.status(400).json({ error: "Invalid type" });

    // Append row
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:D`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[name, phone, address, details]],
      },
    });

    res.json({ success: true, message: `Entry saved to ${sheetName} tab` });
  } catch (err) {
    console.error("Error saving to Google Sheets:", err);
    res.status(500).json({ error: "Failed to log entry" });
  }
});

// Root check
app.get("/", (req, res) => {
  res.send("Wire-Man Electric Ltd. API is running ✅");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
