import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { google } from "googleapis";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json());

/**
 * ---------------------------
 * GOOGLE SHEETS AUTH
 * ---------------------------
 */
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS), // put service account JSON in Render env var
  scopes: ["https://www.googleapis.com/auth/spreadsheets"]
});

const sheets = google.sheets({ version: "v4", auth });

const SPREADSHEET_ID = process.env.SPREADSHEET_ID; // put your sheet ID in Render env var

/**
 * ---------------------------
 * LANDING PAGE (/mcp)
 * ---------------------------
 */
app.get("/mcp", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>MCP Google Sheets Server</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          .status { padding: 10px; margin: 10px 0; border: 1px solid #ccc; background: #e7f7e7; }
        </style>
      </head>
      <body>
        <h1>MCP Google Sheets Server</h1>
        <p><strong>Version:</strong> 1.0.0</p>
        <div class="status">✅ Connected to Google Sheets</div>
        
        <h2>MCP Endpoint</h2>
        <code>${req.protocol}://${req.get("host")}/mcp</code>

        <h2>Available Tools</h2>
        <ul>
          <li><strong>Log:</strong> Send call details (Job, Emergency, or Inquiry) into the correct Google Sheet tab.</li>
        </ul>

        <h2>Other Endpoints</h2>
        <ul>
          <li><a href="/health">Health Check</a></li>
          <li><a href="/server-info">Server Info</a></li>
        </ul>
      </body>
    </html>
  `);
});

/**
 * ---------------------------
 * TOOLS ENDPOINT (/mcp/tools)
 * ---------------------------
 */
app.get("/mcp/tools", (req, res) => {
  res.json({
    tools: [
      {
        name: "Log",
        description: "Send call details (Job, Emergency, or Inquiry) to the Wireman Electric Google Sheet",
        parameters: [
          "Timestamp",
          "Phone",
          "Address",
          "Name",
          "Details",
          "tab"
        ]
      }
    ]
  });
});

/**
 * ---------------------------
 * TOOL RUNNER (/mcp/run/:tool)
 * ---------------------------
 */
app.post("/mcp/run/:tool", async (req, res) => {
  const { tool } = req.params;
  const payload = req.body;

  console.log(`🎯 POST /mcp/run/${tool}`, payload);

  if (tool === "Log") {
    try {
      const timestamp = new Date().toISOString();
      const { Phone, Address, Name, Details, tab } = payload;

      // Pick the correct sheet tab (must match tab names in your sheet: Job, Emergency, Inquiry)
      const range = `${tab}!A:F`;

      const values = [[timestamp, Phone, Address, Name, Details, tab]];

      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range,
        valueInputOption: "USER_ENTERED",
        requestBody: { values }
      });

      return res.json({
        status: "logged",
        tab,
        message: `📌 Logged call for ${Name} (${Phone}) into '${tab}' tab.`
      });
    } catch (err) {
      console.error("❌ Error logging to Google Sheets:", err);
      return res.status(500).json({ error: "Failed to log to Google Sheets" });
    }
  }

  res.json({ status: "unknown tool", tool, payload });
});

/**
 * ---------------------------
 * HEALTH & INFO
 * ---------------------------
 */
app.get("/health", (req, res) => res.json({ status: "ok", uptime: process.uptime() }));
app.get("/server-info", (req, res) =>
  res.json({ name: "MCP Google Sheets Server", version: "1.0.0", port: PORT })
);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 MCP Sheets server running at http://localhost:${PORT}`);
});
