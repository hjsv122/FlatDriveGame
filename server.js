import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 🔒 تشفير التوقيع للتحقق من الطلبات القادمة من TTPay
function verifySignature(data, signature) {
  const secret = process.env.API_SECRET;
  const sorted = Object.keys(data).sort().reduce((obj, key) => {
    obj[key] = data[key];
    return obj;
  }, {});
  const string = Object.entries(sorted).map(([k, v]) => `${k}=${v}`).join("&");
  const hash = crypto.createHmac("sha256", secret).update(string).digest("hex");
  return hash === signature;
}

// 📥 نقطة استقبال الدفع من TTPay
app.post("/callback", (req, res) => {
  const body = req.body;
  const signature = req.headers["x-sign"];

  if (!verifySignature(body, signature)) {
    return res.status(403).send("Invalid signature");
  }

  console.log("✅ مدفوعات جديدة:", body);
  // يمكنك هنا تحديث رصيد المستخدم في قاعدة البيانات أو اللعبة
  res.send("OK");
});

// 🌐 تقديم ملفات الواجهة (HTML/CSS/JS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
