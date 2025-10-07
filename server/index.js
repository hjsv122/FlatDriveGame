require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const bitcoin = require('bitcoinjs-lib');
const fetch = require('node-fetch');

const app = express();
app.use(bodyParser.json());
app.use(express.static('../public'));

const PORT = process.env.PORT || 3000;

// التحقق من المتغيرات البيئية
if (!process.env.HOT_WALLET_WIF) {
  throw new Error("HOT_WALLET_WIF غير معرف. ضع المفتاح الخاص للمحفظة الساخنة في المتغيرات البيئية.");
}
if (!process.env.COLD_WALLET_WIF) {
  throw new Error("COLD_WALLET_WIF غير معرف. ضع المفتاح الخاص للمحفظة الباردة في المتغيرات البيئية.");
}

// إعداد المحفظة الساخنة والباردة
const hotKeyPair = bitcoin.ECPair.fromWIF(process.env.HOT_WALLET_WIF);
const coldKeyPair = bitcoin.ECPair.fromWIF(process.env.COLD_WALLET_WIF);

// نقطة اختبار بسيطة
app.get('/status', (req, res) => {
  res.json({ status: 'server running', hotAddress: bitcoin.payments.p2pkh({ pubkey: hotKeyPair.publicKey }).address });
});

// هنا تضيف باقي الأكواد الخاصة بالأرباح والتحويل بين المحفظتين

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
