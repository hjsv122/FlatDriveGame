// server.js
const express = require('express');
const bodyParser = require('body-parser');
const TronWeb = require('tronweb');

const app = express();
const PORT = 10000;

app.use(bodyParser.json());

// قراءة المفتاح من Environment Variables
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const FULL_NODE = 'https://api.trongrid.io';
const SOLIDITY_NODE = 'https://api.trongrid.io';
const EVENT_NODE = 'https://api.trongrid.io';

// إنشاء TronWeb instance
const tronWeb = new TronWeb(FULL_NODE, SOLIDITY_NODE, EVENT_NODE, PRIVATE_KEY);

// محفظة الخادم داخليًا (رصيد اللعبة)
let serverWallet = 0; // USDT balance داخلي

// نقطة نهاية للسحب
app.post('/withdraw-usdt', async (req, res) => {
  const { toAddress, amount } = req.body;

  // تحقق من صحة العنوان والمبلغ
  if (!toAddress.startsWith('T') || amount <= 0) {
    return res.json({ success: false, error: 'عنوان غير صحيح أو مبلغ غير صالح' });
  }

  try {
    // عنوان عقد USDT TRC20 الرسمي على شبكة TRON
    const USDT_CONTRACT = 'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj'; 

    // تحقق من رصيد الخادم الداخلي قبل السحب
    if (serverWallet < amount) {
      return res.json({ success: false, error: 'الرصيد الداخلي غير كافٍ' });
    }

    // تنفيذ التحويل
    const contract = await tronWeb.contract().at(USDT_CONTRACT);
    const tx = await contract.transfer(toAddress, tronWeb.toSun(amount)).send({
      feeLimit: 100_000_000 // 100 TRX كحد أقصى للرسوم
    });

    // خصم الرصيد الداخلي بعد السحب
    serverWallet -= amount;

    // إعادة النتيجة
    res.json({ success: true, txId: tx });
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: err.message });
  }
});

// نقطة نهاية مؤقتة لإضافة رصيد داخلي (للاختبار داخل اللعبة)
app.post('/add-balance', (req, res) => {
  const { amount } = req.body;
  if (amount > 0) {
    serverWallet += amount;
    res.json({ success: true, newBalance: serverWallet });
  } else {
    res.json({ success: false, error: 'مبلغ غير صالح' });
  }
});

// تشغيل الخادم
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
