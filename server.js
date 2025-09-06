const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const TronWeb = require('tronweb');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const tronWeb = new TronWeb({
  fullHost: 'https://api.shasta.trongrid.io', // شبكة Shasta تجريبية
  privateKey: process.env.PRIVATE_KEY          // يستخدم المفتاح السري لمحفظتك بالفعل
});

// طباعة عنوان المحفظة في السجل
(async () => {
  try {
    const addr = tronWeb.defaultAddress.base58;
    console.log(`🔐 الآن الخادم يستخدم محفظتك: ${addr}`);
  } catch (err) {
    console.error("❌ خطأ في استخراج عنوان المحفظة:", err.message);
  }
})();

const USDT_ADDRESS = 'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj';

app.post('/withdraw-usdt', async (req, res) => {
  const { toAddress, amount } = req.body;
  if (!toAddress || !amount || amount <= 0)
    return res.json({ success: false, message: "بيانات غير صحيحة" });
  try {
    const tx = await tronWeb.contract().at(USDT_ADDRESS).then(c => c.transfer(toAddress, tronWeb.toSun(amount)).send());
    res.json({ success: true, tx });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

app.post('/withdraw-trx', async (req, res) => {
  const { toAddress, amount } = req.body;
  if (!toAddress || !amount || amount <= 0)
    return res.json({ success: false, message: "بيانات غير صحيحة" });
  try {
    const tx = await tronWeb.trx.sendTransaction(toAddress, tronWeb.toSun(amount));
    res.json({ success: true, tx });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 الخادم يعمل على Shasta | المنفذ ${PORT}`));
