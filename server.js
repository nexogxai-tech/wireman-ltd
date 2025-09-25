import express from "express";
import bodyParser from "body-parser";
import { google } from "googleapis";
import cors from "cors";

// Load .env only when NOT in production
if (process.env.NODE_ENV !== "production") {
  const dotenv = await import("dotenv");
  dotenv.config();
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Auth using environment variable
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

// POST route to log call
app.post("/log", async (req, res) => {
  try {
    const { full_name, phone, address, details, tab } = req.body;

    if (!full_name || !phone || !address || !details || !tab) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let sheetName;
    if (tab === "Job") sheetName = "Job";
    else if (tab === "Emergency") sheetName = "Emergency";
    else if (tab === "Inquiry") sheetName = "Inquiry";
    else return res.status(400).json({ error: "Invalid tab" });

    const now = new Date();
    const timestamp = now.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:E`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[timestamp, full_name, phone, address, details]],
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
