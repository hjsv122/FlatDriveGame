// server.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const TronWeb = require("tronweb");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("."));

// إعداد TronWeb باستخدام المفتاح الخاص من Environment Variables
const tronWeb = new TronWeb({
  fullHost: "https://api.trongrid.io",
  privateKey: process.env.PRIVATE_KEY
});

// مثال على الرصيد الداخلي والخادم (يمكن تعديلها حسب اللعبة)
let wallet = 0;       // الرصيد الداخلي للاعب
let serverWallet = 100; // رصيد محفظة الخادم (TRX)

// سحب USDT TRC20
app.post("/withdraw-usdt", async (req, res) => {
  try {
    const { toAddress, amount } = req.body;

    if (!toAddress || !amount) {
      return res.status(400).json({ success: false, error: "بيانات ناقصة" });
    }

    if (!toAddress.startsWith("T") || amount <= 0 || wallet < amount) {
      return res.status(400).json({ success: false, error: "تحقق من العنوان أو الرصيد" });
    }

    if (serverWallet < 0.1) {
      return res.status(400).json({ success: false, error: "رصيد TRX في محفظة الخادم غير كافٍ لتغطية الرسوم" });
    }

    const contractAddress = "TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj"; // عقد USDT TRC20
    const contract = await tronWeb.contract().at(contractAddress);

    const tx = await contract.transfer(toAddress, tronWeb.toSun(amount)).send();

    wallet -= amount; // خصم الرصيد الداخلي بعد نجاح السحب
    serverWallet -= 0; // خصم رسوم الشبكة إذا أردت تحديث الرصيد

    res.json({ success: true, txId: tx });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "فشل السحب" });
  }
});

// تشغيل الخادم
app.listen(PORT, () => {
  console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`);
});
