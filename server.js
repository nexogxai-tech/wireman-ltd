import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { google } from "googleapis";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Root route for homepage test
app.get("/", (req, res) => {
  res.send("🚀 Wire-Man Electric Ltd. API is live! Use POST /log to send data.");
});

// Google Sheets Auth
const creds = JSON.parse(process.env.GOOGLE_CREDENTIALS);

// Fix private key formatting (Render stores \n as literal \\n)
if (creds.private_key) {
  creds.private_key = creds.private_key.replace(/\\n/g, "\n");
}

const auth = new google.auth.GoogleAuth({
  credentials: creds,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

// POST /log
app.post("/log", async (req, res) => {
  try {
    const body = req.body;

    const name = body.name || body.full_name;
    const phone = body.phone;
    const type = body.type || body.tab;
    const details =
      body.details ||
      (body.task && body.address
        ? `${body.task} at ${body.address}`
        : body.task || body.address);

    if (!name || !phone || !details || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Map tab/type → correct Google Sheet tab
    let sheetName = "Sheet1"; // fallback
    if (type.toLowerCase() === "job") sheetName = "Job";
    else if (type.toLowerCase() === "emergency") sheetName = "Emergency";
    else if (type.toLowerCase() === "inquiry") sheetName = "Inquiry";

    // Append row
    const row = [name, phone, details, type, new Date().toISOString()];
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: `${sheetName}!A:E`,
      valueInputOption: "RAW",
      resource: { values: [row] },
    });

    res.json({ success: true, message: `Entry saved to ${sheetName}` });
  } catch (err) {
    console.error(
      "Error saving to Google Sheets:",
      err.response?.data || err.message || err
    );
    res.status(500).json({ error: "Failed to log entry" });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
