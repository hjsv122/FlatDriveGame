// server.js
const express = require("express");
const bodyParser = require("body-parser");
const TronWeb = require("tronweb");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(bodyParser.json());
app.use(express.static(__dirname)); // لملفات HTML, CSS, JS

// إعداد TronWeb
const tronWeb = new TronWeb({
  fullHost: "https://api.trongrid.io",
  privateKey: process.env.PRIVATE_KEY
});

// المحفظة الداخلية للخادم
let serverWalletUSDT = 0;
let serverWalletTRX = 0;

// مثال على رصيد داخلي للمحاكاة (سيتم تحديثه بعد السحب)
let playerWalletUSDT = 0;

// Route لإرسال USDT TRC20
app.post("/withdraw-usdt", async (req, res) => {
  const { toAddress, amount } = req.body;

  if (!toAddress || !toAddress.startsWith("T") || amount <= 0) {
    return res.json({ success: false, error: "تحقق من العنوان أو المبلغ" });
  }

  try {
    // تحقق من رصيد الخادم USDT
    const contractAddress = "TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj"; // USDT TRC20
    const contract = await tronWeb.contract().at(contractAddress);

    const balance = await contract.methods.balanceOf(tronWeb.defaultAddress.base58).call();
    const balanceUSDT = parseInt(balance) / 1e6;

    if (balanceUSDT < amount) {
      return res.json({ success: false, error: "رصيد USDT في محفظة الخادم غير كافٍ" });
    }

    // التحقق من رصيد TRX للرسوم
    const trxBalance = await tronWeb.trx.getBalance(tronWeb.defaultAddress.base58);
    if (trxBalance < 100000) { // 0.1 TRX على الأقل لتغطية الرسوم
      return res.json({ success: false, error: "رصيد TRX في محفظة الخادم غير كاف لتغطية الرسوم." });
    }

    // إرسال USDT
    const tx = await contract.methods
      .transfer(toAddress, amount * 1e6)
      .send({ feeLimit: 100_000_000 });

    // تحديث الرصيد الداخلي للمحاكاة
    playerWalletUSDT -= amount;

    return res.json({ success: true, txId: tx });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, error: "حدث خطأ أثناء السحب" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
