import express from "express";
import bodyParser from "body-parser";
import { google } from "googleapis";

const app = express();
app.use(bodyParser.json());

// Load Google Auth with service account
const auth = new google.auth.GoogleAuth({
  keyFile: "service-account.json", // Make sure this file is in project root
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

// Replace with your actual Google Sheet ID
const SPREADSHEET_ID = "1P5bgV1aQhjClyvry6H4E9-XSeKkF5bEFbr2elQk1B1E";

// POST /log endpoint
app.post("/log", async (req, res) => {
  try {
    const { name, phone, address, details, type } = req.body;

    if (!name || !phone || !address || !details || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // type decides which tab to use
    let sheetName;
    if (type.toLowerCase() === "job") sheetName = "Job";
    else if (type.toLowerCase() === "emergency") sheetName = "Emergency";
    else if (type.toLowerCase() === "inquiry") sheetName = "Inquiry";
    else {
      return res.status(400).json({ error: "Invalid type (must be Job, Emergency, or Inquiry)" });
    }

    // Append row (Name, Phone, Address, Details)
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:D`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[name, phone, address, details]],
      },
    });

    res.json({ success: true, message: `Entry saved to ${sheetName} tab` });
  } catch (error) {
    console.error("Error saving to Google Sheets:", error);
    res.status(500).json({ error: "Failed to log entry" });
  }
});

// Root test route
app.get("/", (req, res) => {
  res.send("Wire-Man Electric Ltd API is running 🚀");
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

