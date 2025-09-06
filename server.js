// server.js - FlatDriveGame TRC20 (CommonJS)
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const TronWeb = require('tronweb');

// ----------- إعدادات TronWeb -------------
const PRIVATE_KEY = process.env.PRIVATE_KEY || ''; // ضع المفتاح السري هنا في Environment Variables
const FULL_NODE = 'https://api.trongrid.io';
const SOLIDITY_NODE = 'https://api.trongrid.io';
const EVENT_SERVER = 'https://api.trongrid.io';

const tronWeb = new TronWeb(FULL_NODE, SOLIDITY_NODE, EVENT_SERVER, PRIVATE_KEY);
let serverWallet = 0; // رصيد TRX في المحفظة، سيتم تحديثه تلقائيًا
// -----------------------------------------

const app = express();
const PORT = process.env.PORT || 10000;

// دعم ملفات الواجهة
app.use(express.static(path.join(__dirname, '/')));
app.use(bodyParser.json());

// إرسال صفحة اللعبة الرئيسية
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint لسحب USDT TRC20
app.post('/withdraw-usdt', async (req, res) => {
  const { toAddress, amount } = req.body;
  if (!toAddress.startsWith('T') || !amount || amount <= 0) {
    return res.json({ success: false, error: 'تحقق من العنوان أو المبلغ.' });
  }

  try {
    // تحويل USDT TRC20 من محفظة الخادم
    const usdtContract = 'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj'; // TRC20 USDT الرسمي
    const amountInSun = tronWeb.toSun(amount); // تحويل إلى Sun (الوحدة الصغيرة)
    const transaction = await tronWeb.transactionBuilder.triggerSmartContract(
      usdtContract,
      'transfer(address,uint256)',
      { feeLimit: 100_000_000 },
      [{ type: 'address', value: toAddress }, { type: 'uint256', value: amountInSun }],
      tronWeb.defaultAddress.base58
    );

    const signedTxn = await tronWeb.trx.sign(transaction.transaction);
    const broadcast = await tronWeb.trx.sendRawTransaction(signedTxn);

    if (broadcast.result) {
      res.json({ success: true, txId: broadcast.txid });
    } else {
      res.json({ success: false, error: 'فشل تنفيذ المعاملة.' });
    }
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: 'خطأ في الاتصال بمحفظة الخادم.' });
  }
});

// تشغيل الخادم
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
