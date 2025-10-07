const express = require("express");
const bitcoin = require("bitcoinjs-lib");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

const COLD_WALLET_WIF = process.env.COLD_WALLET_WIF; // مفتاح المحفظة الباردة
const keyPair = bitcoin.ECPair.fromWIF(COLD_WALLET_WIF);
const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });

app.use(bodyParser.json());
app.use(express.static("../public")); // ملفات اللعبة

// نقطة النهاية لاستقبال أرباح اللعبة
app.post("/send-earnings", (req, res) => {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).send({ error: "Invalid amount" });

    // هنا يمكن إرسال المعاملة إلى محفظتك الباردة عبر bitcoinjs
    console.log(`سيتم إرسال ${amount} satoshi إلى ${address}`);
    // تنفيذ المعاملة الفعلية لاحقًا باستخدام bitcoinjs-lib

    res.send({ status: "success", sentTo: address, amount });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
