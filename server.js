import express from "express";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

// POST /log endpoint
app.post("/log", async (req, res) => {
  const { tab, full_name, phone, address, details } = req.body;

  console.log("📞 New entry received:");
  console.log("Tab:", tab);
  console.log("Full Name:", full_name);
  console.log("Phone:", phone);
  console.log("Address:", address);
  console.log("Details:", details);

  // TODO: Add Google Sheets integration here
  res.json({ success: true, message: "Entry logged successfully" });
});

// Root route
app.get("/", (req, res) => {
  res.send("✅ Wire-Man Electric Ltd. server is running!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
