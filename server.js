// server.js
const express = require('express');
const cors = require('cors');
const TronWeb = require('tronweb');
require('dotenv').config();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Serve static files (index.html, style.css, script.js)
app.use(express.static(path.join(__dirname, '/')));

// إعداد TronWeb
const tronWeb = new TronWeb({
  fullHost: 'https://api.trongrid.io',
  privateKey: process.env.PRIVATE_KEY
});

// Endpoint لسحب USDT TRC20
app.post('/withdraw-usdt', async (req, res) => {
  try {
    const { toAddress, amount } = req.body;

    if (!toAddress.startsWith('T') || !amount || amount <= 0) {
      return res.json({ success: false, error: 'عنوان غير صحيح أو مبلغ غير صالح' });
    }

    // إعداد عقد USDT TRC20 على الشبكة
    const contractAddress = 'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj'; // عقد USDT الرسمي على TRON
    const contract = await tronWeb.contract().at(contractAddress);

    const tx = await contract.methods
      .transfer(toAddress, tronWeb.toSun(amount)) // تحويل USDT
      .send();

    return res.json({ success: true, txId: tx });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, error: err.message || 'خطأ غير معروف' });
  }
});

// Endpoint لسحب TRX
app.post('/withdraw-trx', async (req, res) => {
  try {
    const { toAddress, amount } = req.body;

    if (!toAddress.startsWith('T') || !amount || amount <= 0) {
      return res.json({ success: false, error: 'عنوان غير صحيح أو مبلغ غير صالح' });
    }

    const tx = await tronWeb.trx.sendTransaction(toAddress, tronWeb.toSun(amount));
    return res.json({ success: true, txId: tx.txid });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, error: err.message || 'خطأ غير معروف' });
  }
});

// بدء الخادم
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
