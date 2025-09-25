import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Load credentials from environment variable
const creds = JSON.parse(process.env.GOOGLE_CREDENTIALS);

// Fix newline issue in private key
if (creds.private_key.includes("\\n")) {
  creds.private_key = creds.private_key.replace(/\\n/g, "\n");
}

const auth = new google.auth.GoogleAuth({
  credentials: creds,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

// Spreadsheet ID from env
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

// ✅ Homepage route (for clicking link)
app.get("/", (req, res) => {
  res.send("🚀 Wire-Man Electric Ltd. API is live! Use POST /log to send data.");
});

// ✅ Health check (Render uses this sometimes)
app.get("/healthz", (req, res) => {
  res.json({ status: "ok" });
});

// ✅ POST route to log call
app.post("/log", async (req, res) => {
  try {
    const body = req.body;

    // Normalize fields
    const name = body.name || body.full_name;
    const phone = body.phone;
    const type = body.type || body.tab;
    const details =
      body.details ||
      (body.task && body.address
        ? `${body.task} at ${body.address}`
        : body.task || body.address);

    // Validation
    if (!name || !phone || !details || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Append to Google Sheet
    const row = [name, phone, details, type, new Date().toISOString()];
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sheet1!A:E",
      valueInputOption: "RAW",
      resource: { values: [row] },
    });

    res.json({ success: true, message: "Entry saved to Google Sheet" });
  } catch (err) {
    console.error("Error saving to Google Sheets:", err);
    res.status(500).json({ error: "Failed to log entry" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});


