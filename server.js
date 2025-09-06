// ملف: server/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const tronService = require("./tronService");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/send-trx", async (req, res) => {
  const { to, amount } = req.body;
  try {
    const tx = await tronService.sendTRX(to, amount);
    res.json({ success: true, tx });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(3000, () => {
  console.log("🚀 Server running on port 3000");
});
