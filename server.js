import express from "express";
import { google } from "googleapis";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// Load service account key
const auth = new google.auth.GoogleAuth({
  keyFile: "service-account.json", // must exist in project root
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

const SPREADSHEET_ID = "1P5bgV1aQhjClyvry6H4E9-XSeKkF5bEFbr2elQk1B1E"; // your sheet id

// Helper: format timestamp like "2025-09-25: 4:30 PM"
function formatTimestamp(date = new Date()) {
  const options = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };

  const formatter = new Intl.DateTimeFormat("en-US", options);
  const parts = formatter.formatToParts(date);

  const year = parts.find(p => p.type === "year").value;
  const month = parts.find(p => p.type === "month").value;
  const day = parts.find(p => p.type === "day").value;
  const hour = parts.find(p => p.type === "hour").value;
  const minute = parts.find(p => p.type === "minute").value;
  const dayPeriod = parts.find(p => p.type === "dayPeriod").value.toUpperCase();

  return `${year}-${month}-${day}: ${hour}:${minute} ${dayPeriod}`;
}

// POST route to log call
app.post("/log", async (req, res) => {
  try {
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

    // Format timestamp for readability
    const timestamp = formatTimestamp();

    // Append row
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:E`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[timestamp, name, phone, address, details]],
      },
    });

    res.json({
      success: true,
      message: `Entry saved to ${sheetName} tab with timestamp`,
    });
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
