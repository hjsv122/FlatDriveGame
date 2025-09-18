require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// تقديم ملفات الواجهة من مجلد public
app.use(express.static(path.join(__dirname, 'public')));

// إعداد مزود شبكة BSC
const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');

// عنوان عقد USDT على BSC
const usdtAddress = '0x55d398326f99059fF775485246999027B3197955';

// ABI بسيط لعقد USDT
const usdtAbi = [
  "function transfer(address to, uint256 amount) public returns (bool)",
  "function balanceOf(address account) external view returns (uint256)"
];

// قراءة المفتاح الخاص من .env
const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
  console.error("⚠️  يجب تعيين PRIVATE_KEY في ملف .env");
  process.exit(1);
}

const wallet = new ethers.Wallet(privateKey, provider);
const usdtContract = new ethers.Contract(usdtAddress, usdtAbi, wallet);

// ✅ API: إرجاع عنوان المحفظة
app.get('/wallet-address', (req, res) => {
  console.log("📡 طلب عنوان المحفظة");
  res.json({ address: wallet.address });
});

// ✅ API: إرجاع رصيد USDT لأي عنوان
app.get('/balance', async (req, res) => {
  try {
    const address = req.query.address;
    if (!address) return res.status(400).json({ error: 'Address required' });

    const balanceRaw = await usdtContract.balanceOf(address);
    const balance = ethers.formatUnits(balanceRaw, 18);
    console.log(`💰 الرصيد لـ ${address}: ${balance} USDT`);
    res.json({ balance });
  } catch (err) {
    console.error("❌ خطأ في /balance:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ API: استقبال USDT فقط (لا إرسال لمحافظ خارجية)
app.post('/send-usdt', async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Amount must be > 0' });
    }

    const to = wallet.address;
    const amountWei = ethers.parseUnits(amount.toString(), 18);

    console.log(`🚀 إرسال ${amount} USDT إلى المحفظة الداخلية: ${to}`);

    const tx = await usdtContract.transfer(to, amountWei);
    await tx.wait();

    console.log(`✅ تمت المعاملة: ${tx.hash}`);
    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    console.error("❌ خطأ في إرسال USDT:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ تشغيل السيرفر على المنفذ المناسب لـ Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`✅ Wallet address: ${wallet.address}`);
});
