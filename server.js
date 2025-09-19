require('dotenv').config();
const express = require('express');
const { ethers } = require('ethers');
const path = require('path');

const app = express();
const port = process.env.PORT || 10000;

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL;

// إعداد موفر الشبكة والمحفظة
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// عقد USDT BEP20 (Binance Smart Chain)
const USDT_ADDRESS = '0x55d398326f99059fF775485246999027B3197955';
const USDT_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

const usdtContract = new ethers.Contract(USDT_ADDRESS, USDT_ABI, provider);

// بيانات اللعبة الأساسية (محاكاة)
let gameData = {
  carSpeed: 120,
  earnings: 0,
  distance: 0
};

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API لجلب حالة اللعبة والمحفظة
app.get('/game-status', async (req, res) => {
  try {
    const balance = await usdtContract.balanceOf(wallet.address);
    gameData.earnings = parseFloat(ethers.formatUnits(balance, 18));

    res.json({
      walletAddress: wallet.address,
      balanceUSDT: gameData.earnings,
      carSpeed: gameData.carSpeed,
      distance: gameData.distance
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch game status' });
  }
});

// API لجمع الأرباح (تحديث داخلي فقط، لا يتم إرسال عملات من هنا)
app.post('/collect-earnings', (req, res) => {
  const { distanceTraveled, earnings } = req.body;

  gameData.distance += distanceTraveled;
  gameData.earnings += earnings; // هذا للتحديث داخلي داخل اللعبة فقط

  res.json({ message: 'Collected earnings successfully', gameData });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Wallet address: ${wallet.address}`);
});
