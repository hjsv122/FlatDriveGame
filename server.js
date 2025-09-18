require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files
const publicPath = path.join(__dirname, 'public');
console.log(`📂 Static files will be served from: ${publicPath}`);
app.use(express.static(publicPath));

// BSC setup
const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
const usdtAddress = '0x55d398326f99059fF775485246999027B3197955';
const usdtAbi = [
  "function transfer(address to, uint256 amount) public returns (bool)",
  "function balanceOf(address account) external view returns (uint256)"
];

const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
  console.error("⚠️  PRIVATE_KEY غير معرّف في ملف .env");
  process.exit(1);
}

const wallet = new ethers.Wallet(privateKey, provider);
const usdtContract = new ethers.Contract(usdtAddress, usdtAbi, wallet);

// API endpoints
app.get('/wallet-address', (req, res) => {
  console.log("GET /wallet-address");
  res.json({ address: wallet.address });
});

app.get('/balance', async (req, res) => {
  console.log("GET /balance", req.query);
  try {
    const address = req.query.address;
    if (!address) {
      console.log("❗ address query missing");
      return res.status(400).json({ error: 'Address required' });
    }
    const balanceRaw = await usdtContract.balanceOf(address);
    const balance = ethers.formatUnits(balanceRaw, 18);
    console.log(`Balance of ${address}: ${balance}`);
    res.json({ balance });
  } catch (err) {
    console.error("Error in /balance:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/send-usdt', async (req, res) => {
  console.log("POST /send-usdt", req.body);
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Amount must be > 0' });
    }
    const to = wallet.address;
    const amountWei = ethers.parseUnits(amount.toString(), 18);
    console.log(`Transferring ${amount} USDT to ${to}`);
    const tx = await usdtContract.transfer(to, amountWei);
    await tx.wait();
    console.log("Transaction hash:", tx.hash);
    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    console.error("Error in send-usdt:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`✅ Wallet address: ${wallet.address}`);
});
