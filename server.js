// server.js
import express from "express";
import { google } from "googleapis";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json()); // replaces body-parser
app.use(cors()); // allow cross-origin requests

// Load service account key
const auth = new google.auth.GoogleAuth({
  keyFile: "service-account.json", // must exist in project root
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

const SPREADSHEET_ID = "1P5bgV1aQhjClyvry6H4E9-XSeKkF5bEFbr2elQk1B1E"; // your sheet id

// POST route to log call
app.post("/log", async (req, res) => {
  try {
    // Accept multiple field names for flexibility
    const name = req.body.name || req.body.full_name;
    const phone = req.body.phone;
    const address = req.body.address || req.body.location;
    const details = req.body.details || req.body.notes;
    const type = req.body.type || req.body.tab;

    if (!name || !phone || !address || !details || !type) {
      return res.status(400).json({
        error:
          "Missing required fields. Required: name/full_name, phone, address/location, details/notes, type/tab",
      });
    }

    // Decide which sheet tab to use
    let sheetName;
    if (["Job", "Emergency", "Inquiry"].includes(type)) {
      sheetName = type;
    } else {
      return res.status(400).json({ error: "Invalid type/tab value" });
    }

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

