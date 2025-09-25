import express from "express";
import { google } from "googleapis";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// --------------------
// Google Sheets Setup
// --------------------

// Path to service account key
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KEYFILEPATH = path.join(__dirname, "service-account.json"); // <-- put your key file here
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

// Load client
const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILEPATH,
  scopes: SCOPES,
});
const sheets = google.sheets({ version: "v4", auth });

// Your Google Sheet ID
const SPREADSHEET_ID = "https://docs.google.com/spreadsheets/d/1P5bgV1aQhjClyvry6H4E9-XSeKkF5bEFbr2elQk1B1E/edit?gid=774242830#gid=774242830"; // replace with actual sheet ID

// --------------------
// Routes
// --------------------

// Root (so browser shows something)
app.get("/", (req, res) => {
  res.send("⚡ Wire-Man Electric Ltd. API is running");
});

// Log endpoint for AI receptionist
app.post("/log", async (req, res) => {
  try {
    const { tab, full_name, phone, details } = req.body;

    if (!tab || !full_name || !phone || !details) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Map tab names to Sheet tabs
    const validTabs = ["Job", "Emergency", "Inquiry"];
    if (!validTabs.includes(tab)) {
      return res.status(400).json({ error: "Invalid tab" });
    }

    // Prepare row
    const row = [full_name, phone, details];

    // Append row to correct tab
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${tab}!A:C`, // assuming 3 columns
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [row],
      },
    });

    res.json({ status: "success", message: `Saved to ${tab} tab` });
  } catch (err) {
    console.error("Error saving to Google Sheets:", err);
    res.status(500).json({ error: "Failed to log entry" });
  }
});

// --------------------
// Start Server
// --------------------
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

