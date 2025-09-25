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
  credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"]
});

const sheets = google.sheets({ version: "v4", auth });
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

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
          .tools { margin-top: 20px; }
          ul { line-height: 1.6; }
        </style>
      </head>
      <body>
        <h1>MCP Google Sheets Server</h1>
        <p><strong>Version:</strong> 1.0.0</p>
        <div class="status">✅ Connected to Google Sheets</div>
        
        <h2>MCP Endpoint</h2>
        <code>${req.protocol}://${req.get("host")}/mcp</code>

        <div class="tools">
          <h2>Available Tools</h2>
          <ul>
            <li><strong>Log:</strong> Send call details (Job, Emergency, or Inquiry) to the Wireman Electric Google Sheet</li>
          </ul>
        </div>

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
        description:
          "Log a caller’s details into the Wireman Electric Google Sheet. Automatically records the timestamp and requires the caller’s phone, address, name, request details, and which tab to log into (Job, Emergency, or Inquiry).",
        parameters: [
          {
            id: "Timestamp",
            type: "string",
            value_type: "constant",
            description: "Record the time of the call automatically.",
            required: true
          },
          {
            id: "Phone",
            type: "string",
            value_type: "llm_prompt",
            description: "Phone number of the caller.",
            required: true
          },
          {
            id: "Address",
            type: "string",
            value_type: "llm_prompt",
            description: "Address where the work or issue is located. Required for jobs and emergencies.",
            required: true
          },
          {
            id: "Name",
            type: "string",
            value_type: "llm_prompt",
            description: "Full name of the caller.",
            required: true
          },
          {
            id: "Details",
            type: "string",
            value_type: "llm_prompt",
            description: "Details about the request, including work type, issue, or inquiry.",
            required: true
          },
          {
            id: "tab",
            type: "string",
            value_type: "llm_prompt",
            description: "Which sheet tab to log into (Job, Emergency, or Inquiry).",
            required: true
          }
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

      const range = `${tab}!A:F`; // expects tabs named Job, Emergency, Inquiry
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
app.get("/health", (req, res) =>
  res.json({ status: "ok", uptime: process.uptime() })
);
app.get("/server-info", (req, res) =>
  res.json({ name: "MCP Google Sheets Server", version: "1.0.0", port: PORT })
);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 MCP Sheets server running at http://localhost:${PORT}`);
});

