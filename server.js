import express from "express";
import bodyParser from "body-parser";
import { google } from "googleapis";

const app = express();
app.use(bodyParser.json());

const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const sheets = google.sheets({ version: "v4", auth });

app.post("/mcp/tools", async (req, res) => {
  try {
    const {
      Phone,
      sheet_name,
      Address,
      Details,
      tab,
      Timestamp,
      spreadsheet_id,
      Name,
    } = req.body.arguments;

    const values = [[Timestamp, Name, Phone, Address, Details]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheet_id,
      range: `${tab}!A:E`,
      valueInputOption: "RAW",
      requestBody: { values },
    });

    res.json({ success: true, message: "Logged to Google Sheets" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(3000, () => console.log("MCP server running on port 3000"));
