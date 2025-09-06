import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { TronWeb } from "tronweb";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("."));

// إعداد TronWeb
const tronWeb = new TronWeb({
  fullHost: "https://api.trongrid.io",
  privateKey: process.env.PRIVATE_KEY
});

// سحب USDT TRC20
app.post("/withdraw-usdt", async (req, res) => {
  try {
    const { toAddress, amount } = req.body;
    if (!toAddress || !amount)
      return res.status(400).json({ success: false, error: "بيانات ناقصة" });

    const contractAddress = "TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj"; // عنوان عقد USDT TRC20
    const contract = await tronWeb.contract().at(contractAddress);

    const tx = await contract.transfer(toAddress, tronWeb.toSun(amount)).send();
    res.json({ success: true, txId: tx });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "فشل السحب" });
  }
});

app.listen(PORT, () => console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`));
