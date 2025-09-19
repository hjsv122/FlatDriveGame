require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from public folder
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));
console.log(`📂 Static files served from ${publicPath}`);

// إعداد شبكة BSC
const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');

// عقد USDT على BSC
const usdtAddress = '0x55d398326f99059fF775485246999027B3197955';
const usdtAbi = [
  "function transfer(address to, uint256 amount) public returns (bool)",
  "function balanceOf(address account) external view returns (uint256)"
];

// مفتاح محفظتك
const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
  console.error("❌ PRIVATE_KEY مفقود في ملف .env");
  process.exit(1);
}

const wallet = new ethers.Wallet(privateKey, provider);
const usdtContract = new ethers.Contract(usdtAddress, usdtAbi, wallet);

console.log("🎯 Wallet address:", wallet.address);

// API: عرض عنوان المحفظة
app.get('/wallet-address', (req, res) => {
  res.json({ address: wallet.address });
});

// API: رصيد USDT
app.get('/balance', async (req, res) => {
  try {
    const address = req.query.address;
    if (!address) return res.status(400).json({ error: 'Address required' });

    const balanceRaw = await usdtContract.balanceOf(address);
    const balance = ethers.formatUnits(balanceRaw, 18);
    res.json({ balance });
  } catch (err) {
    console.error("Error in /balance:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// API: إرسال USDT إلى نفس المحفظة
app.post('/send-usdt', async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Amount must be > 0' });
    }

    // 🟢 أرسل إلى نفس المحفظة التي تملكها
    const to = wallet.address;

    const amountWei = ethers.parseUnits(amount.toString(), 18);
    console.log(`🚀 Transferring ${amount} USDT to ${to}`);

    const tx = await usdtContract.transfer(to, amountWei);
    await tx.wait();

    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    console.error("❌ Error in send-usdt:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// بدء السيرفر
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`✅ Wallet address: ${wallet.address}`);
});
