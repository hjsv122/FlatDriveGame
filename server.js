require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// 🟢 إعداد شبكة BSC
const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');

// 🟢 عقد USDT على شبكة BSC
const usdtAddress = '0x55d398326f99059fF775485246999027B3197955';
const usdtAbi = [
  "function transfer(address to, uint256 amount) public returns (bool)",
  "function balanceOf(address account) external view returns (uint256)"
];

// 🟢 المحفظة التي ستُستخدم لاستقبال الأرباح
const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
  console.error("❌ يجب تعيين PRIVATE_KEY في ملف .env");
  process.exit(1);
}

const wallet = new ethers.Wallet(privateKey, provider);
const usdtContract = new ethers.Contract(usdtAddress, usdtAbi, wallet);

console.log("✅ محفظة الأرباح:", wallet.address);

// 🟢 واجهة للحصول على عنوان المحفظة
app.get('/wallet-address', (req, res) => {
  res.json({ address: wallet.address });
});

// 🟢 التحقق من الرصيد
app.get('/balance', async (req, res) => {
  try {
    const address = req.query.address || wallet.address;
    const balanceRaw = await usdtContract.balanceOf(address);
    const balance = ethers.formatUnits(balanceRaw, 18);
    res.json({ balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🟢 استقبال الأرباح داخل المحفظة
app.post('/send-usdt', async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Amount must be > 0' });
    }

    const amountWei = ethers.parseUnits(amount.toString(), 18);
    const tx = await usdtContract.transfer(wallet.address, amountWei);
    await tx.wait();

    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
