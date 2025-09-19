require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));
console.log(`📂 Static files served from ${publicPath}`);

// إعداد شبكة BSC
const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');

// عقد USDT
const usdtAddress = '0x55d398326f99059fF775485246999027B3197955';
const usdtAbi = [
  "function balanceOf(address account) external view returns (uint256)"
];

const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
  console.error("⚠️ يرجى وضع PRIVATE_KEY في ملف .env");
  process.exit(1);
}

const wallet = new ethers.Wallet(privateKey, provider);
const usdtContract = new ethers.Contract(usdtAddress, usdtAbi, wallet);

// GET: عنوان المحفظة
app.get('/wallet-address', (req, res) => {
  console.log("GET /wallet-address");
  res.json({ address: wallet.address });
});

// GET: رصيد المحفظة
app.get('/balance', async (req, res) => {
  try {
    const address = req.query.address || wallet.address;
    const balanceRaw = await usdtContract.balanceOf(address);
    const balance = ethers.formatUnits(balanceRaw, 18);
    res.json({ balance });
  } catch (err) {
    console.error("❌ Error in /balance:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST: تسجيل الأرباح فقط (بدون إرسال فعلي)
app.post('/send-usdt', async (req, res) => {
  console.log("POST /send-usdt", req.body);
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Amount must be > 0' });
    }

    console.log(`✅ أرباح مسجلة داخل اللعبة: ${amount} USDT`);
    res.json({ success: true, message: `تم تسجيل ${amount} USDT كمكافأة في المحفظة.` });
  } catch (err) {
    console.error("❌ Error in send-usdt:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`✅ Wallet address: ${wallet.address}`);
});
