// server.js
import express from "express";
import bodyParser from "body-parser";
import { google } from "googleapis";

const app = express();
app.use(bodyParser.json());

// Authenticate using credentials stored in Render env variable
const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

// Replace with your Google Sheet ID
const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE";

// Endpoint to receive data and write to Google Sheets
app.post("/log", async (req, res) => {
  try {
    const { tab, full_name, phone, details } = req.body;

    if (!tab || !full_name || !phone || !details) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Append row to the correct tab
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${tab}!A:D`, // Tab with 4 columns: Full Name, Phone, Details, Timestamp
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[full_name, phone, details, new Date().toLocaleString()]],
      },
    });

    res.json({ success: true, message: "Data logged to Google Sheets" });
  } catch (error) {
    console.error("Error logging to sheet:", error);
    res.status(500).json({ error: "Failed to log data" });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
