require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// تقديم الملفات الثابتة
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));
console.log(`📂 Static files served from ${publicPath}`);

// إعداد شبكة BSC
const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');

// عنوان عقد USDT على BSC
const usdtAddress = '0x55d398326f99059fF775485246999027B3197955';
const usdtAbi = [
  "function transfer(address to, uint256 amount) public returns (bool)",
  "function balanceOf(address account) external view returns (uint256)"
];

// مفتاحك الخاص (للمحفظة التي ترسل منها الأرباح)
const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
  console.error("⚠️ يجب تعيين PRIVATE_KEY في ملف .env");
  process.exit(1);
}

const wallet = new ethers.Wallet(privateKey, provider);
const usdtContract = new ethers.Contract(usdtAddress, usdtAbi, wallet);

// عنوان محفظتك التي تستقبل الأرباح (المحفظة المدمجة)
const RECEIVER_ADDRESS = "0x088d30e03a2C1914bB02Fb21b6d0cB1fE1318eA7";

// API: عرض عنوان المحفظة المرسلة (للتحقق فقط)
app.get('/wallet-address', (req, res) => {
  console.log("GET /wallet-address");
  res.json({ address: wallet.address });
});

// API: رصيد USDT لأي عنوان
app.get('/balance', async (req, res) => {
  console.log("GET /balance", req.query);
  try {
    const address = req.query.address;
    if (!address) {
      return res.status(400).json({ error: 'Address required' });
    }
    const balanceRaw = await usdtContract.balanceOf(address);
    const balance = ethers.formatUnits(balanceRaw, 18);
    console.log(`Balance of ${address}: ${balance}`);
    res.json({ balance });
  } catch (err) {
    console.error("Error in /balance:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// API: إرسال الأرباح إلى المحفظة المدمجة
app.post('/send-usdt', async (req, res) => {
  console.log("POST /send-usdt", req.body);
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Amount must be > 0' });
    }

    const amountWei = ethers.parseUnits(amount.toString(), 18);
    console.log(`🔁 Transferring ${amount} USDT to ${RECEIVER_ADDRESS}`);

    const tx = await usdtContract.transfer(RECEIVER_ADDRESS, amountWei);
    await tx.wait();

    console.log("✅ Transaction hash:", tx.hash);
    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    console.error("❌ Error in send-usdt:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// بدء الخادم
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`✅ Sender Wallet address: ${wallet.address}`);
  console.log(`📥 Profits go to: ${RECEIVER_ADDRESS}`);
});
