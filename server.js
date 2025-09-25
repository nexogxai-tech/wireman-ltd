import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { google } from "googleapis";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Load Google credentials from env
let creds = JSON.parse(process.env.GOOGLE_CREDENTIALS);

// Fix private_key in case it's stored with literal \n
if (creds.private_key.includes("\\n")) {
  creds.private_key = creds.private_key.replace(/\\n/g, "\n");
}

const auth = new google.auth.GoogleAuth({
  credentials: creds,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

// Spreadsheet ID (must be plain ID, not full URL)
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

app.post("/log", async (req, res) => {
  try {
    const { name, phone, address, details, type } = req.body;

    if (!name || !phone || !address || !details || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Decide sheet tab
    let sheetName;
    if (type === "Job") sheetName = "Job";
    else if (type === "Emergency") sheetName = "Emergency";
    else if (type === "Inquiry") sheetName = "Inquiry";
    else return res.status(400).json({ error: "Invalid type" });

    // Append row
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:E`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[`${new Date().toLocaleString()}`, name, phone, address, details]],
      },
    });

    res.json({ success: true, message: `Entry saved to ${sheetName} tab` });
  } catch (err) {
    console.error("Error saving to Google Sheets:", err);
    res.status(500).json({ error: "Failed to log entry" });
  }
});

app.get("/", (req, res) => {
  res.send("Wire-Man Electric Ltd. API is running ✅");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
