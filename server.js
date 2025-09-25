import express from "express";
import cors from "cors";
import { google } from "googleapis";
const app = express();
app.use(cors());
app.use(express.json());

// Load Google credentials from environment variable
const creds = JSON.parse(process.env.GOOGLE_CREDENTIALS);
// Fix private key newlines if needed
if (creds.private_key.includes("\\n")) {
  creds.private_key = creds.private_key.replace(/\\n/g, "\n");
}

const auth = new google.auth.GoogleAuth({
  credentials: creds,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

// POST /log endpoint
app.post("/log", async (req, res) => {
  try {
    const body = req.body;

    // Normalize fields (accept multiple formats)
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

    // Append row to Google Sheets
    const row = [name, phone, details, type, new Date().toISOString()];
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: "Sheet1!A:E",
      valueInputOption: "RAW",
      resource: { values: [row] },
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Error saving to Google Sheets:", err);
    res.status(500).json({ error: "Failed to log entry" });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

