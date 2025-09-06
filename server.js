require('dotenv').config();
const express = require('express');
const TronWeb = require('tronweb');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// إعداد متغيرات البيئة في ملف .env (تحتاج لإنشائه بنفس المسار)
const PRIVATE_KEY = process.env.PRIVATE_KEY;  // مفتاح محفظة الخادم الخاصة بك
const FULL_NODE = 'https://api.trongrid.io';  // شبكة TRON الرئيسية
const SOLIDITY_NODE = 'https://api.trongrid.io';
const EVENT_SERVER = 'https://api.trongrid.io';

if (!PRIVATE_KEY) {
  console.error('ERROR: الرجاء تعيين PRIVATE_KEY في ملف .env');
  process.exit(1);
}

const tronWeb = new TronWeb(
  FULL_NODE,
  SOLIDITY_NODE,
  EVENT_SERVER,
  PRIVATE_KEY
);

const SERVER_ADDRESS = tronWeb.defaultAddress.base58;
console.log('عنوان محفظة الخادم:', SERVER_ADDRESS);

// رمز عقد USDT TRC20 على شبكة Tron الرئيسية
const USDT_CONTRACT = 'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj';

// --------------- دوال مساعدة ---------------

// استعلام رصيد TRX للمحفظة
async function getTrxBalance() {
  try {
    const balanceInSun = await tronWeb.trx.getBalance(SERVER_ADDRESS);
    return balanceInSun / 1_000_000; // تحويل من Sun إلى TRX
  } catch (err) {
    console.error('خطأ في جلب رصيد TRX:', err);
    return 0;
  }
}

// استعلام رصيد USDT للمحفظة
async function getUsdtBalance() {
  try {
    const contract = await tronWeb.contract().at(USDT_CONTRACT);
    const balance = await contract.methods.balanceOf(SERVER_ADDRESS).call();
    return parseInt(balance) / 1_000_000; // USDT TRC20 فيه 6 أرقام عشرية
  } catch (err) {
    console.error('خطأ في جلب رصيد USDT:', err);
    return 0;
  }
}

// إرسال USDT (TRC20) إلى عنوان معين
async function sendUsdt(toAddress, amount) {
  try {
    const contract = await tronWeb.contract().at(USDT_CONTRACT);
    const amountInSun = Math.floor(amount * 1_000_000); // تحويل الى اصغر وحدة
    const transaction = await contract.methods.transfer(toAddress, amountInSun).send({
      feeLimit: 1_000_000,
      callValue: 0,
      shouldPollResponse: true
    });
    return transaction; // يحتوي على txid وغيره
  } catch (err) {
    throw new Error('فشل إرسال USDT: ' + err.message);
  }
}

// إرسال TRX إلى عنوان معين
async function sendTrx(toAddress, amount) {
  try {
    const amountInSun = amount * 1_000_000;
    const tx = await tronWeb.transactionBuilder.sendTrx(toAddress, amountInSun, SERVER_ADDRESS);
    const signedTx = await tronWeb.trx.sign(tx);
    const broadcast = await tronWeb.trx.sendRawTransaction(signedTx);
    if (!broadcast.result) throw new Error('فشل في إرسال TRX');
    return broadcast;
  } catch (err) {
    throw new Error('فشل إرسال TRX: ' + err.message);
  }
}

// ------------------- API -------------------

// جلب رصيد TRX للخادم
app.get('/balance/trx', async (req, res) => {
  const balance = await getTrxBalance();
  res.json({ balance });
});

// جلب رصيد USDT للخادم
app.get('/balance/usdt', async (req, res) => {
  const balance = await getUsdtBalance();
  res.json({ balance });
});

// طلب سحب USDT (يرسل USDT من محفظة الخادم إلى العنوان المطلوب)
app.post('/withdraw', async (req, res) => {
  const { toAddress, amount } = req.body;

  if (!toAddress || !toAddress.startsWith('T') || !amount || amount <= 0) {
    return res.status(400).json({ error: 'عنوان أو مبلغ غير صالح' });
  }

  try {
    // تأكد من الرصيد الكافي
    const usdtBalance = await getUsdtBalance();
    if (usdtBalance < amount) {
      return res.status(400).json({ error: 'رصيد USDT غير كافٍ' });
    }

    // نفذ التحويل
    const txResult = await sendUsdt(toAddress, amount);
    return res.json({ success: true, tx: txResult });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// بدء الخادم
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`خادم FlatDrive شغّال على http://localhost:${PORT}`);
});
