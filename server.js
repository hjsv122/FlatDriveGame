require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// توفير الملفات الثابتة من مجلد public
app.use(express.static(path.join(__dirname, 'public')));

// إعداد مزود الشبكة (Binance Smart Chain) - ethers 6.x
const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');

// عنوان USDT على BSC
const usdtAddress = '0x55d398326f99059fF775485246999027B3197955';

// ABI مبسط لـ USDT (لمعاملات transfer و balanceOf)
const usdtAbi = [
  "function transfer(address to, uint256 amount) public returns (bool)",
  "function balanceOf(address account) external view returns (uint256)"
];

// قراءة المفتاح الخاص من متغيرات البيئة (env)
const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
  console.error("⚠️  يجب تعيين PRIVATE_KEY في ملف .env");
  process.exit(1);
}

// إنشاء المحفظة الحقيقية
const wallet = new ethers.Wallet(privateKey, provider);

// إنشاء عقد USDT
const usdtContract = new ethers.Contract(usdtAddress, usdtAbi, wallet);

// API: الحصول على عنوان المحفظة الحقيقية
app.get('/wallet-address', (req, res) => {
  res.json({ address: wallet.address });
});

// API: الحصول على رصيد USDT للمحفظة الحقيقية
app.get('/balance', async (req, res) => {
  try {
    const address = req.query.address;
    if (!address) return res.status(400).json({ error: 'Address required' });
    const balanceRaw = await usdtContract.balanceOf(address);
    // USDT على BSC له 18 خانة عشرية لذا نقسم على 10^18
    const balance = ethers.formatUnits(balanceRaw, 18);
    res.json({ balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: إرسال USDT (إما جمع الأرباح أو إرسال خارجي)
app.post('/send-usdt', async (req, res) => {
  try {
    const { recipient, amount } = req.body;
    const to = recipient || wallet.address; // إذا لم يتم تحديد مستلم ترسل إلى المحفظة نفسها
    if (!amount || amount <= 0) return res.status(400).json({ success: false, error: 'Amount must be > 0' });

    // USDT عدد الخانات العشرية 18
    const amountWei = ethers.parseUnits(amount.toString(), 18);

    const tx = await usdtContract.transfer(to, amountWei);
    await tx.wait();

    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`Wallet address: ${wallet.address}`);
});
