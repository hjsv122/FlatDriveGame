import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch"; // ✅ تأكد من تثبيته: npm install node-fetch

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

// 📥 نقطة استقبال الدفع من TTPay (Webhook)
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

// 💸 إنشاء طلب سحب (طلب دفع من TTPay)
app.post("/api/payment", async (req, res) => {
  try {
    const { amount, order_id } = req.body;

    const payload = {
      amount,
      order_id,
      token: process.env.API_TOKEN, // من TTPay
      redirect_url: "https://flatdrivegame-4.onrender.com", // يمكن تغييره إلى صفحة نجاح مخصصة
    };

    // إنشاء التوقيع
    const sorted = Object.keys(payload).sort().reduce((obj, key) => {
      obj[key] = payload[key];
      return obj;
    }, {});
    const string = Object.entries(sorted).map(([k, v]) => `${k}=${v}`).join("&");
    const signature = crypto.createHmac("sha256", process.env.API_SECRET).update(string).digest("hex");

    // إرسال الطلب إلى TTPay
    const response = await fetch("https://api.tt-pay.tech/api/v1/order/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sign": signature
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    return res.json(data);
  } catch (err) {
    console.error("🚨 TTPay Error:", err);
    return res.status(500).json({ code: -1, message: "TTPay request failed" });
  }
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
